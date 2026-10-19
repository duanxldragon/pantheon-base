# W3 — 角色菜单授权的租户维度（2026-10-19-w3-role-menu-grant-persistence）

**Status**: completed
**Scope**: F3（P0）
**Baseline → 现状**: `tenant_acceptance.py` A4「role persists navigation grants」由丢失 → `menuIds=6 expected=6`；二次编辑后 `menuIds=[6,7]`，不再清空
**Gate**: `go build` / `go vet` 全绿；role / rbacbind / menu / login / system / database 测试通过；`schema_migrations` 26 → 27

## 1. 一句话结论

`system_role_menu` 从 000020 起就有 `tenant_id` 且主键是 `(tenant_id, role_id, menu_id)`，但
`InsertRoleMenus` 仍然只写 `(role_id, menu_id)`。租户角色保存菜单后，授权落在 `tenant_id = 0`，
而 `loadRoleMenus` 按租户读——**保存即不可见**；再次编辑时先删后写，删除成功、写入又落到 0，
于是导航授权被永久清空。

## 2. 改了什么

| 代码点 | 修复前 | 修复后 |
|---|---|---|
| `rbacbind.InsertRoleMenu` / `InsertRoleMenus` | 不接收租户 | 显式接收 `tenantID` 并写入 `tenant_id` |
| `rbacbind.EnsureRoleMenu` | 只按 `(role_id, menu_id)` 查重 | 按 `(tenant_id, role_id, menu_id)` 查重并写入 |
| `replaceRoleMenus` | 直接 `InsertRoleMenus(tx, roleID, ...)` | 先 `roleOwningTenantIDTx(tx, roleID)`，授权跟随**角色行**而不是请求上下文 |
| 平台 admin 菜单绑定（seed / login / menu） | `role_key = 'admin'` 命中任意租户 | 只认 `role_key = 'admin' AND tenant_id = 0` |
| 迁移 `000026_role_menu_tenant_backfill` | — | 把历史上落在 0 的租户角色授权移动到角色所属租户；`UPDATE IGNORE` + 仅在租户副本存在时删除 0 行；`information_schema` 守卫；幂等 |

租户从角色行解析，而不是从请求上下文取：平台管理员可以编辑某个租户的角色，授权必须跟着角色走。
删除仍按 `role_id`（`system_role.id` 全局唯一），顺带清掉修复前遗留的 0 行。

## 3. 测试与实测证据

### 3.1 单元测试（真 MySQL）

```
TestCreateTenantRolePersistsMenusInRoleTenant           PASS
TestPlatformEditOfTenantRoleKeepsGrantInRoleTenant      PASS
TestEnsureBindingsAreIdempotent                         PASS
TestInsertBindingsBatch                                 PASS
```

- 第一条：租户 282 建角色 → `system_role_menu(tenant_id=282)` 有 1 行、`tenant_id=0` 有 0 行；
  `ListRoles` 回读 `menuIds=[1]`；二次 `UpdateRole` 后仍为 1 行；租户 291 看不到该角色。
- 第二条：租户 282 建角色后由平台服务（无租户上下文）编辑，授权仍在 282，不在 0。
- rbacbind 测试断言同一 `(role, menu)` 在两个租户是两条独立授权，租户 0 写不进去。

### 3.2 接口层验收（A4）

```
PASS [A4] role persists navigation grants        menuIds=6 expected=6
PASS [A4] role persists operation grants         permissionKeys=5 expected=5
PASS [A4] update role                            code=200
PASS [A4] role update persisted (narrowed grants) menuIds=[6, 7]
```

完整输出见 `menu-roundtrip.log`。

### 3.3 迁移 000026 探针

在 `pantheon_mig026_probe` 上构造四种情形（平台角色、单租户角色、已有租户副本、已软删角色），
连续执行两次：

| 情形 | 结果 |
|---|---|
| 平台角色 `(0, 1, 10)` | 保持 0 |
| 租户角色只有 `(0, 2, 20)` | 移动到 `(282, 2, 20)` |
| 租户角色已有 `(291, 3, 30)` 且存在 `(0, 3, 30)` | 保留 291，删除 0 行 |
| 已软删角色 `(0, 4, 40)` | 跳过 |
| 第二次执行 | 4 行不变 |

无 `tenant_id` 列的旧 schema 上执行退化为 `SELECT 1`，数据原样保留。

## 4. 不做的事

- **不改菜单表**：`system_menu` 是平台级目录，只有授权行属于租户。
- **不改删除策略**：仍是 delete-then-insert；缺陷是缺列，不是 replace 语义。
- **不猜授权**：迁移只移动已存在的行，不凭空给角色补菜单。

## 5. 剩余风险

- 平台管理员在平台视角查看租户角色时，`loadRoleMenus` 按 0 读，看不到租户角色的授权；
  W1 记录的「平台作用域列出全部租户角色」仍是已知缺口，W5 的视角切换器让「平台/租户视角」显式化。
- 迁移只在探针库和线上升级路径验证；线上库没有需要移动的行，所以移动路径的证明来自探针。
