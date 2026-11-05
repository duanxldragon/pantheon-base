# Summary — 2026-11-04-audit-freeze-preconditions

FE-01b：`PermissionList.tsx` 的 `loadRoles` 与 `permission/index.ts` 的 `roles:default` 预热都改走已有 `fetchAllPages`。没有新 helper。查询仍是 `sortField: 'sort', sortOrder: 'asc'`，没有加 `status: 1`（用户模块的 active 过滤不适用于这里）。两处返回 `T[]`，`loadRoles` 用 `result.map`，不再读 `result.items`。

DB-01：只改 `data_scope_middleware.go` 两段注释。DDL 字符串未动。`AutoMigrate` 没有回来。注释写明 bootstrap 只建模型读写列（`id, tenant_id, role_key, mode, dept_ids` + `uk_role_data_scope_tenant_role`），不是 000001 全形（缺 `scope_defs` / `created_at` / `updated_at`）。未跑版本化迁移的全新启动不是支持路径。

事实边界：

- 2026-11-03 整改仍是未提交工作区，不是已合并。
- FE-01b 不在 W1 `2026-11-03-audit-p1-pagination-data-consistency` 的 scope.in。
- `tenant_id` 权威是 `000024_tenant_core_tables_repair.up.sql` :201-221，不是 000020。

未做：提交已有工作区；冻结宣告；GOV-08；执行 `000031`；改 ops。

可选的路由组布尔棘轮已补：`TestSystemModulesPinGroupOptions` 锁注册行与计数。`WithDataScope()` = 1（仅 user 列表/导出），`WithCapability()` = 2（tenant 与 i18n），`systemGroupOptions(deps, true)` = 8，`false` = 6。不改中间件链。路由级 `RefreshSyncMiddleware`（dict/setting/i18n 写路由）不是组选项，不在此锁。

## 验证读数

见 `commands.json`：`gofmt -l` 无输出，注释检索无 `must stay identical` / `AutoMigrate`，`tsc -b` exit 0。路由组棘轮 `go test -short -count=1 ./modules/system/ -run TestSystemModules` 通过。
