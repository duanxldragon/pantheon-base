# 2026-10-20-tenant-delivery-hardening — Summary

## 结论

交付审计发现的 3 个阻断项全部关闭：

| # | 缺陷 | 严重度 | 状态 |
|---|---|---|---|
| 1 | 权限策略控制台未绑定租户，请求体决定命名空间（可写全局策略/跨租户写/全量读） | P0 | closed |
| 2 | 租户可创建 `admin` / `platform_ops` 角色键，登录后继承平台全局授权 | P0 | closed |
| 3 | `platform.tenant_mode` 非公开，前端不渲染租户控件，Tenant Smoke 主干常红 | P1 | closed（浏览器层待 CI 确认） |
| 4 | 角色删除/重命名/Bootstrap 不识别租户域主语 | P1 | closed |
| 5 | CSV 导入角色写成 `tenant_id = 0`；导入与启动查询按裸键跨租户 | P1 | closed |

## 1. 权限策略逃逸（P0）

**根因**：`permission_handler.go` 的策略面用的是 `h.service`（未绑定上下文），而 `PermissionPolicyCreateReq.TenantId`
直接进入 `resolvePolicySubject`。`tenantId=0` → 全局主语；`tenantId=<other>` → 别的租户域。
`ImportPolicies` 与工作台补齐则直接把裸 roleKey 写成 `V0`。

**放大器**：

- `pkg/tenant/authz.go` 的 `CasbinDomainPolicySubjects` 对租户请求同时查全局主语与域主语；
- `internal/middleware` 的 `subjectHasPlatformCapability` 把「任意全局策略允许该路径」当作平台能力；
- 工作台的受控补齐表包含 `system:tenant:list/create/update/delete/member-*`。

因此「新建一条全局策略」等价于「给所有租户的同名角色授权」，再叠加平台能力判定即可读取/管理全部租户。

**修法**：

- 所有策略端点改走 `svc(c)`；
- 新增 `policySubjectForWrite`：租户作用域强制 `role:<key>@tenant:<ctx>`，请求体 `tenantId` 冲突返回 `TENANT_FORBIDDEN`；
- 新增 `policyInTenantScope` / `applyPolicyTenantScope`：按主语后缀限定列表、导出、编辑、删除；
- 导入与补齐先解析主语再写，去重键按主语；
- 工作台角色查询与策略读取加租户谓词；补齐事件新增 `tenant_id`（迁移 000028）；
- `Bootstrap` 的孤儿清理识别域主语，避免每次启动删光租户配置。

## 2. 保留角色键（P0）

**根因**：`validateRoleCreate/Update` 只做租户内唯一校验；登录时 `roleKeys` 原样取自 `system_role.role_key`，
Casbin 先查全局主语，`platform_ops` 又被平台能力中间件按名字放行。租户因此可自建平台角色。

**修法**：`ensureRoleKeyAllowed` 拒绝两类键——平台命名空间（tenant 0）已存在的键，以及 `platform_ops`。
CSV 导入复用同一校验；导入创建补上 `TenantID`。

**残余**：已存在的租户保留键不会自动重命名，需要运营按 runbook 处理（Human Gates）。

## 3. 租户冒烟（P1）

**根因**：`platform.tenant_mode` 在 `seed_data.yaml` 中 `isPublic: 0`，`bootstrapSettingSeed` 只插缺失行，
升级库永远不公开该键；前端 `AppLayout.tsx:1805` 以 `tenantMode === 'multi'` 决定是否渲染视角切换器，
`tenant-viewpoint-switcher.spec.ts:179` 因此拿不到按钮。

**修法**：种子改 `isPublic: 1`；`Bootstrap` 增加 `syncPublicSettingFlags`，只升不降；新增三条用例锁住。

## 4. 角色生命周期（P1）

- 删除：只删角色自己的主语（平台角色删裸键，租户角色删 `role:<key>@tenant:<id>`）。
- 重命名：同一事务把 p 行迁到新主语，旧主语不留残留。
- Bootstrap：孤儿清理同时匹配裸键与域主语。

## 5. 裸键查询（P1）

- `validateImportRoleKeys` 在目标命名空间内校验（租户作用域 = 当前租户；平台 = tenant 0）。
- `ensureAdminRoleBinding` / `ensureAdminUserBinding` 固定 `tenant_id = 0`。

## 测试

| 套件 | 结果 |
|---|---|
| `go test ./...`（真实 MySQL） | 全绿 |
| `TestPermissionPolicyTenantScope_*`（6） | 全绿 |
| `TestPermissionBootstrapPreservesTenantDomainPolicies` | 绿 |
| `TestRoleTenantScope_*`（4） | 全绿 |
| `TestSettingSeed*` / `TestSettingBootstrapRepairs*`（3） | 全绿 |
| `tsc -b` | 绿 |
| `check-task-packet` / `frontmatter-check` | 绿 |

## 残余风险

1. **浏览器层未本地验证**：本机不能起 Playwright，视角切换器是否渲染由 CI 的 `Tenant Smoke` 确认。
2. **存量租户保留键**：本包只阻断新增，不自动重命名；已存在的 `admin`/`platform_ops` 租户角色仍有提权能力，
   需运营清理（runbook）。
3. **迁移 000028 的历史行**：`tenant_id` 保持 0（无法从 role_key 反推租户），平台视图可见、租户视图不可见。
4. **平台作用域仍可显式指定目标租户**：这是平台控制台的既有能力，不属于租户逃逸；若产品要求平台也只能操作
   tenant 0，需要单独决策。
