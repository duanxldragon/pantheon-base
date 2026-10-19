# Review — W1 数据权限的租户维度

对照 `docs/contracts/TENANT_CONTRACT_V1.md` §2.3（`tenant_id` 非空、0 为平台全局）/ §4（平台能力与租户能力分层）
与 `docs/designs/TENANT_RESOURCE_SCOPE_MATRIX.md`，复核 2026-10-19 W1 的实际改动。

## 1. 谓词覆盖矩阵（修复后）

| 代码点 | 文件 | 读写 | 租户谓词 | 判定 |
|---|---|---|---|---|
| `SystemRoleDataScope` 模型 | `internal/middleware/data_scope_middleware.go` | — | 结构体含 `TenantID`，与 `uk_role_data_scope_tenant_role` 一致 | ok |
| `resolvePolicyTenantID` | 同上 | 读上下文 | `tenant.FromGin` → 租户；compat/缺失 → 0 | ok |
| `loadRoleDataScopePolicies` | 同上 | 读 | `tenant_id = ? AND role_key IN ?` | ok |
| `applyRoleDataScopePolicy` | 同上 | 读 | 租户由调用方传入；fail-closed 分支未改 | ok |
| `MigrateDataScopePolicy` 的兜底 DDL | 同上 | 建表 | 含 `tenant_id` + 唯一键 | ok |
| `ListDataScopePolicies` | `permission/permission_data_scope.go` | 读 | 非平台作用域加 `tenant_id = ?` | ok |
| `loadRoleDataScopePolicies`（permission） | 同上 | 读 | 同上 | ok |
| `UpdateDataScopePolicy` | 同上 | 写 | `TenantID = tenantOwnerID()`，`OnConflict(tenant_id, role_key)` | ok |
| `ensureDeptIDsBelongToTenant` | 同上 | 校验 | `system_dept.tenant_id = ?`（平台作用域不限） | ok |
| `ensureRoleKeyExists` | `permission/permission_service.go` | 校验 | 非平台作用域加 `tenant_id = ?` | ok |
| `fetchWorkbenchRoles` | `permission/permission_workbench.go` | 读 | 非平台作用域加 `tenant_id = ?` | ok |
| `loadRoleDataScopes` | `role/role_service.go` | 读 | `s.scoped(...)` | ok |
| `deleteRoleDataScopes` | 同上 | 写 | 两个 delete 都带 `tenant_id`，调用方传 `role.TenantID` | ok |

基线里这张表是「唯一一张读写两侧都忽略租户列的表」；现在每一行都有谓词。

## 2. 三个设计选择

### 2.1 租户显式传参，不在 helper 里再解析

`DataScopeMiddleware` 已经 `tenant.FromGin(c)` 解析过一次。如果 helper 内部再解析，就会有两个事实来源：
中间件认为请求属于租户 A，helper 因为上下文缺失回落到 0——这类分叉在 review 里最难发现。
所以 `applyRoleDataScopePolicy` / `loadRoleDataScopePolicies` 都改成接收 `tenantID`，代价是四处测试调用点要跟着改
（`data_scope_failclosed_test.go` 传入 `tenant.PlatformGlobalTenantID`，语义不变：那些夹具本来就把行写在 tenant 0）。

### 2.2 迁移是「复制」而不是「搬移」，且只从 tenant 0 复制

- **只从 `tenant_id = 0` 复制。** 若某租户角色的策略只存在于**另一个租户**名下，那条行是别人的授权；复制它等于把 F10 的泄漏固化进数据。
- **不搬移，保留 tenant 0 原行。** 平台作用域仍读它，搬走会让平台视图空掉。
- **不凭空补 `all`。** 运行时对「无策略」是 fail-closed；补 `all` 会把一个没人配过的角色悄悄放大到全租户。

代价：某租户角色若在别处（非 0）有策略、自己名下没有，迁移后仍是 fail-closed。这属于基线就存在的状态（000021 之后新建的角色本来就没有行），不是 W1 引入的回归，已在 `knownGaps` 记录。

### 2.3 部门校验 fail-closed

`system_dept` 不存在时也拒绝（`permission.data_scope.dept_invalid`）：没有部门表就等于没有合法部门，
放行等于让校验形同虚设。这条选择直接导致两个既有夹具要补真实的 `system_dept`，其中 `role` 包是先失败后修的。

### 2.4 迁移守卫：宁可空跑，不要启动失败

000025 用 `information_schema` 判断两张表的 `tenant_id` 是否存在，再决定执行 `INSERT` 还是 `SELECT 1`——与 000024 同一写法。
理由是仓库里已经发生过的事实：`schema_migrations` 记着 24 而 000024 的 DDL 没跑过。那种库上 `tenant_id` 不存在，
无守卫的 `INSERT` 会让每次启动都迁移失败，把「少了一列」升级成「服务起不来」。守卫只会让这一条空跑，
000024 的修复在下次真实升级里补列，000025 随后自然生效。

这条不是设计时想到的，是 `pkg/database` 的迁移测试逼出来的（`TestRunMigrationsDoesNotReapplyRoleDataScopeBackfillAfterPolicyDeletion`
造了一个「标记 24 但没列」的库）。同一轮里还把该测试的末行断言从 `currentRuntimeSchemaVersion` 改成最新迁移版本——
基线现在有意落后于最新文件，旧断言的前提失效了；测试真正的主张（已删除的策略不被复活）没动。

## 3. 与既有不变量的关系

| 不变量 | 是否受影响 | 说明 |
|---|---|---|
| `tenant_admin` / `tenant_member` 豁免行级策略 | 未变 | `hasTenantLocalRole` / `hasAdministrativeRole` 未改动 |
| 策略读取失败 fail-closed | 未变 | `rolePoliciesCoverAll` 仍要求每个 role_key 都有行；新增谓词只会让「没有本租户行」也落入同一分支 |
| `system_role_permission` 的 `(role_id, tenant_id)` 隔离 | 未变 | L2b 复测：A/B 同名角色的权限键互不可见 |
| Casbin `@tenant` 域主体与 `permission.escalation.forbidden` | 未变 | 本次未触碰 Casbin 路径 |
| 业务行隔离（A11） | 未变 | 行级过滤仍由 `WithDataScope` + tenant scope 双重施加 |

## 4. 剩余风险与未覆盖项

1. **平台作用域仍列出全部租户的角色。** 这是本波的有意保留（平台管理员跨租户），但意味着平台视角下同名 role_key 仍会出现两次。
   W5 的视角切换器让「我在看哪个租户」显式化之后，这里应该收紧为「平台视角只列 tenant 0 的角色」。**这是一条待办，不是已完成项。**
2. **无策略角色仍 500。** 见 §2.2。需要一次独立决策（是补默认值，还是把 fail-closed 改成 403 并提示配置）。
3. **历史自定义范围的 `dept_ids` 原样复制。** 跨租户的部门 id 只会让该租户的结果收窄到 0 行（行过滤本身带租户谓词），不会放宽，所以是正确性瑕疵而非泄漏；新写入已被 `ensureDeptIDsBelongToTenant` 拦住。
4. **F14 未排期**：跨租户读角色仍返回 500 而不是 403/404。与隔离无关，属响应码质量问题。
5. **未覆盖**：MySQL 只读副本路径、软删除角色与其他租户活角色同 key 的组合、多实例部署下迁移并发（000025 是单条 `INSERT IGNORE`，靠唯一键幂等，但未做并发压测）。

## 5. 复核结论

W1 的六个缺陷（F7/F8/F9/F10/F11/F13）在代码、单测、双租户探测、UI 探测四个层面都得到关闭证据，
且没有放宽任何既有不变量。剩余风险均已显式记录，其中第 1 条（平台作用域）需要在 W5 收口。

## Machine Readable

```json
{
  "taskId": "2026-10-19-w1-data-scope-tenant-dimension",
  "verdict": "approved",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-19-w1-data-scope-tenant-dimension/manifest.json",
    "evidence": ".harness/evidence/2026-10-19-w1-data-scope-tenant-dimension/commands.json",
    "reviewFile": ".harness/evidence/2026-10-19-w1-data-scope-tenant-dimension/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-19-tenant-permission-isolation-remediation.task.md",
      "docs/contracts/TENANT_CONTRACT_V1.md"
    ]
  }
}
```
