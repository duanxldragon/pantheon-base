# 2026-10-20-tenant-audit-permission-seed — Summary

## 缺陷

`Tenant Smoke (multi-mode advisory)` 在主干 `8ffb00bf` 上每次失败，断言是
`assertProtectedPage(page, '/system/login-log', '.auth-login-log-page__table-card')`。

浏览器侧现象（来自 `smoke-tenant-artifacts`）：

```
- list:
  - listitem: 首页
  - listitem: 登录日志          <- 导航里有
- tab "登录日志" [selected]
- main:
  - text: 403 你没有访问当前页面的权限   <- 页面进不去
```

导航来自 `system_role_menu`（上一轮 `2026-10-20-sonarcloud-zero-issues` 补过），
页面鉴权来自 `system_role_permission`（从来没补）。两个判定，只写了一半。

## 根因

`backend/modules/auth/login/login_menu.go` 的 `SeedAuthModuleMenus` 只做两件事：
写 `system_menu`、写 `system_role_menu`。它**不写** `system_role_permission`。
`backend/modules/system/seed.go` 的 `bindSeedMenuAdminRole` 两半都写。

于是这 12 个键在平台管理员身上就是缺的：

| 页面 | 权限键 |
| --- | --- |
| 登录日志 | `system:login-log:list` / `:export` / `:clear` / `:delete` |
| 会话管理 | `system:session:list` / `:delete` / `:clear` / `:export` |
| 安全事件 | `system:security-event:list` / `:acknowledge` / `:clear` / `:export` |

而租户开通是「把平台管理员的键集复制一份」（`provisionTenantRoleBindings`，契约 §4 的收敛方式），
缺失被原样放大到每个租户。

CI 日志证据（`_temp/pantheon-tenant-backend.log`）：

- 播种器对 `role_id = 1` 只检查过 **85** 个不同的键，其中审计键 **0** 个；
- 全文没有一条不带 `tenant_id` 的 `system_role_permission` INSERT —— 即 auth 播种器确实没写过权限行；
- 租户 204 的 `tenant_admin`（role 4）插入 **85** 行，与平台管理员完全一致，
  含 `system:operation-log:list`，不含上述 12 个键。

## 修法

| 位置 | 改动 |
| --- | --- |
| `backend/pkg/rbacbind/rbacbind.go` | 新增 `EnsureRolePermission(db, tenantID, roleID, key)`：按 `(tenant_id, role_id, permission_key)` 幂等写入，显式带 `tenant_id`，与生产唯一键 `uk_role_permission_tenant` 一致 |
| `backend/modules/auth/login/login_menu.go` | `ensureSingleMenuSeed` 在绑定菜单后补写该菜单的 `PagePerm` 与 `Perms` |
| `backend/modules/system/seed.go` | `ensureAdminPermissionSeed` 改为委托 `rbacbind.EnsureRolePermission`，两处播种只剩一份实现 |
| 三处测试夹具 | `system_role_permission` DDL 补 `tenant_id`，与生产表对齐 |

为什么修上游而不在租户侧补键：租户侧补 12 个键，平台管理员自己的控制台仍然是坏的（同一批页面同样 403），
而且下一个新租户会继续缺。

## 影响面

- 平台管理员：下一次启动播种后多出 12 个键，`/system/login-log`、`/system/session`、
  `/system/security-event` 三个页面从「导航有、进去 403」变成可进入。这是本次唯一的**行为改动**。
- 租户管理员：新开通的租户复制到 97 个键（原 85 + 12），三个审计页面可进入。
- 租户成员：`isReadOnlyPermissionKey` 未改，仍只拿 `:list/:detail/:view/:tree/:export`。
- 表结构、Casbin 策略、菜单可见性模型均未改。

## 测试

| 用例 | 断言 |
| --- | --- |
| `TestSeedAuthModuleMenusGrantsAdminPermissionKeys` | 平台管理员 12 个审计键齐备；重复播种不重复（键数不变） |
| `TestProvisionTenant_CopiesPlatformAdminPermissionKeys` | 租户管理员 `ElementsMatch` 平台键集；成员只拿到只读子集 |

两条都跑在真实 MySQL 上（`pkg/testmysql`），不是 SQLite 替身。

## 残余风险

1. **存量租户不会自动修好。** 升级后已存在的租户仍是 85 个键，需要重新开通（`ProvisionTenant` 幂等，
   本身即修复入口）或由维护者提供受控回填。本包不自动回填：租户管理员可能主动收回过键，
   自动回填会把它们授回去。
2. **浏览器层未在本地验证。** 本机无法启动 Playwright（`spawnSync EBUSY`），
   `/system/login-log` 的真实渲染由 CI 的 `smoke-tenant` 作业确认。
3. **权限工作台仍不覆盖登录日志与会话路由。** `requiredAPIRoutesByPermission` 里没有
   `system:login-log:*` 与 `system:session:list/delete/clear`，工作台对它们没有意见。属于既有缺口，不在本包范围。
