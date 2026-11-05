# Summary — 2026-11-03-audit-p2-data-scope-automigrate

DB-01 闭环：`system_role_data_scope` 的 schema 权威只剩版本化迁移链，
运行时不再对单表跑 AutoMigrate，只保留「表不存在才建」的冷启动兜底。

## 证先于改：迁移链 vs 模型逐列比对

| 模型字段 | 列 | 000001 | 000002 | 000024 | 兜底 DDL |
|---|---|---|---|---|---|
| `ID` | `id` | 建表 PRIMARY KEY | — | — | 有 |
| `TenantID` | `tenant_id` | — | — | ADD COLUMN + 唯一键首列 | 有 |
| `RoleKey` | `role_key` | VARCHAR(64) NOT NULL | — | 唯一键次列 | 有 |
| `Mode` | `mode` | VARCHAR(32) DEFAULT 'all' | — | — | 有 |
| `DeptIDs` | `dept_ids` | —（原为 scope_defs） | ADD COLUMN + 回填 | — | 有 |
| （唯一键） | `uk_role_data_scope_tenant_role (tenant_id, role_key)` | — | — | ADD UNIQUE INDEX；同时 DROP 掉 role_key-only 索引 | 有 |

结论：迁移链已完整持有最终形状，运行时 AutoMigrate 是**第二个权威**，不是补丁。

## 改动

- 删除 `if database.ShouldAutoMigrate() { db.AutoMigrate(&SystemRoleDataScope{}) }` 分支。
- 保留 `!cachedHasTable(...)` 的 `CREATE TABLE IF NOT EXISTS` 兜底，并把 DDL 提为常量
  `dataScopePolicyDDL`，使测试能直接比对运行时真正执行的那串 SQL。
- 行为差异只在 dev 的 AutoMigrate 模式：以前由 GORM 补列，现在只建表、不补列。
  生产路径（`ShouldAutoMigrate()==false`）本来就只走「表不存在才建」，**零变化**。

## 新增断言（`internal/middleware/data_scope_schema_test.go`）

1. `TestDataScopeModelMatchesMigrationChain` — 反射遍历模型字段，字段→列映射表必须覆盖全部导出字段，
   且每列同时出现在迁移链与兜底 DDL 中；反过来映射表里也不能有模型不存在的字段。
2. `TestDataScopeUniqueKeyIsTheIdentity` — 唯一键必须是 `(tenant_id, role_key)`，迁移链与 DDL 都要有。
3. `TestMigrateDataScopePolicyDoesNotAutoMigrate` — 函数体内出现 AutoMigrate 即红，且必须使用 `dataScopePolicyDDL`。

第 1 条是防漂移的关键：模型加字段而不给列，会红在这里，而不是在生产查询失败时。

## 读数

`grep AutoMigrate data_scope_middleware.go` 0 命中；三个断言 ok；
`go build` / `go vet` exit 0、`gofmt -l` 无输出、`go test ./... -short` 47 ok / 0 FAIL。
