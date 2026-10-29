# Review — 2026-10-20-tenant-audit-permission-seed

## 结论

`approved`。改动很小，但落点正确：缺口的产生地是播种器，不是租户开通，也不是前端。

## 复核要点

### 1. 落点是否正确

`provisionTenantRoleBindings` 的行为是「读平台管理员的键集 → 逐个补写到租户角色」，
这是契约 §4 的收敛方式（靠租户域隔离，而不是裁剪键集）。它复制出的 85 个键与平台管理员完全一致，
**复制逻辑本身没有错**，错在上游只准备了 85 个键。

因此修复放在播种侧。若在租户侧补 12 个键：平台管理员的三个审计页面仍然 403，且下一个新租户继续缺。

### 2. `tenant_id` 是否真的必要

必要。登录时的权限加载器是：

```
WHERE system_user_role.user_id = ? AND system_user_role.tenant_id = ?
  AND system_role_permission.tenant_id = ?
```

不带 `tenant_id` 的写入落在 0，租户主体永远读不到。这与 `rbacbind.insertRoleMenuSQL`
注释里记录过的坑（acceptance F3）是同一个。新函数用共享 SQL 常量
`insertRolePermissionSQL` 显式带 `tenant_id`，并由 `TestProvisionTenant_CopiesPlatformAdminPermissionKeys`
从租户域读回验证。

### 3. 幂等键是否与生产唯一键一致

生产唯一键是 `uk_role_permission_tenant`，即 `(tenant_id, role_id, permission_key)`
（迁移 `000020_tenant_phase1_core_tables`）。`EnsureRolePermission` 的存在性检查与唯一键逐列一致，
所以并发/重复播种既不会重复插入，也不会因为检查条件比唯一键更宽而漏判。

`TestSeedAuthModuleMenusGrantsAdminPermissionKeys` 用「第二次播种后键数不变」把它钉住。

### 4. 成员角色是否被误放开

没有。`isReadOnlyPermissionKey` 未改，`tenant_member` 只拿 `:list/:detail/:view/:tree/:export`。
新增用例显式断言成员拿到的是 `system:user:list`、`system:login-log:list`、
`system:login-log:export`、`system:security-event:list`、`system:session:list` 这个只读子集。

### 5. 夹具改动是否只是补列

是。`seed_test.go`、`tenant_service_test.go`、`login_menu_test.go` 的 `system_role_permission`
DDL 从 `(role_id, permission_key)` 改成 `(tenant_id, role_id, permission_key)`，
与生产表一致。没有放宽任何既有断言——四个 `modules/system` 用例在补列后重新变绿，
说明它们本来就在等这个列。

### 6. 行为改动清单

只有一条：平台管理员与租户管理员多出 12 个审计权限键。
没有表结构变更、没有 Casbin 策略变更、没有菜单可见性变更、没有前端改动。

### 7. 拆分是否引入语义漂移

没有拆分，只有收敛：`ensureAdminPermissionSeed` 的旧实现（`strings.TrimSpace` + 计数 + 裸 INSERT）
被 `rbacbind.EnsureRolePermission` 逐字取代，空键短路、幂等跳过、显式列名三点都保留。

## 边界检查

- 未触碰 `.github/workflows/**`、`.sonarcloud.properties`、`release-gate.yml`。
- 未触碰 `backend/pkg/database/migrations/**`（无 schema 改动）。
- 未触碰 `frontend/**`。
- 未触碰 `.harness/archive/**` 与历史 evidence 目录。

## 残余风险

| 风险 | 判断 |
| --- | --- |
| 存量租户仍是 85 个键 | 接受。自动回填会把租户主动收回的键授回去，属于产品决策；已在 Human Gates 记录 |
| 浏览器层未本地验证 | 接受。本机无法启动 Playwright，`smoke-tenant` 作业是唯一可信来源 |
| 权限工作台不覆盖登录日志/会话路由 | 接受。既有缺口，与本缺陷无关，已列入 knownGaps |
| 未跑全仓 `go test ./...` | 接受。改动只涉及 `pkg/rbacbind`、`auth/login`、`system` 的播种与三个夹具，受影响包已全量跑过 |

## Machine Readable

```json
{
  "taskId": "2026-10-20-tenant-audit-permission-seed",
  "verdict": "approved",
  "structuralReview": {
    "affectedSubgraph": "module menu seeder -> system_role_menu + system_role_permission -> tenant provisioning copy -> login permission loader -> route guard",
    "checks": ["sensitive-flow"]
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-20-tenant-audit-permission-seed/manifest.json",
    "evidence": ".harness/evidence/2026-10-20-tenant-audit-permission-seed/commands.json",
    "reviewFile": ".harness/evidence/2026-10-20-tenant-audit-permission-seed/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-20-tenant-audit-permission-seed.task.md",
      "docs/contracts/TENANT_CONTRACT_V1.md",
      ".github/workflows/smoke-core.yml"
    ]
  }
}
```
