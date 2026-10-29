# W3 review — role menu grants

## 1. Contract fit

- §2.3.1 第 2 条：写由上下文赋值租户。这里上下文不是请求租户，而是**被写角色的租户**；
  任务包明确要求 `replaceRoleMenus` 从 `roleOwningTenantIDTx` 解析，而不是从 `tenant.FromGin` 取。
  这样平台管理员编辑租户角色时不会把授权写回平台命名空间。
- §2.3.1 第 1 条：`loadRoleMenus` 本来就有 `s.scoped(...)`，问题在写侧；本次只补写侧。

## 2. 边界检查

- `rbacbind` 仍不解析租户，只接收调用方传入的 `tenantID`——与 `InsertUserRoles` 的既有形态一致。
- 平台 seed/login/menu 绑定显式使用 `tenant.PlatformGlobalTenantID`，并把 `system_role` 查询限定
  `tenant_id = 0`，避免租户的同名 `admin` 角色被误命中。
- 删除按 `role_id` 执行；`system_role.id` 全局唯一，不会误删其他租户的行，同时能清掉修复前的 0 行。

## 3. 迁移审查

- 两个 `information_schema` 守卫（`system_role_menu.tenant_id`、`system_role.tenant_id`），
  缺列时退化为 `SELECT 1`。
- `UPDATE IGNORE` 不会覆盖已存在的租户副本；随后只在该副本确实存在时删除 0 行，
  因此不会在旧主键 `(role_id, menu_id)` 的库上删掉唯一授权。
- 已软删角色被排除：它们的授权没有运行时读者。
- 幂等：第二次执行匹配 0 行。`down` 保留数据（授权是配置，不是迁移产生的临时数据）。

## 4. 剩余风险

| 风险 | 判断 |
|---|---|
| 平台视角读租户角色的菜单授权仍为空 | W1 已知缺口，W5 用显式视角切换缓解；不在 F3 范围 |
| 迁移在旧主键 schema 上依赖 000024 的修复 | 守卫保证不报错；旧主键下副本无法与 0 行共存，不会误删 |
| 菜单本身无租户维度 | 设计如此（平台级目录），只对授权行做租户隔离 |

## Machine Readable

```json
{
  "taskId": "2026-10-19-w3-role-menu-grant-persistence",
  "verdict": "approved",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-19-w3-role-menu-grant-persistence/manifest.json",
    "evidence": ".harness/evidence/2026-10-19-w3-role-menu-grant-persistence/commands.json",
    "reviewFile": ".harness/evidence/2026-10-19-w3-role-menu-grant-persistence/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-19-tenant-permission-isolation-remediation.task.md",
      "docs/contracts/TENANT_CONTRACT_V1.md"
    ]
  }
}
```
