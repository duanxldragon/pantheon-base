# W1 — 数据权限的租户维度（2026-10-19-w1-data-scope-tenant-dimension）

**Status**: completed
**Scope**: F7 / F8 / F9 / F10 / F11 / F13
**Baseline → 现状**: `cross_tenant_leak.py` 27/34（6 项未关闭）→ **26/26 全通过**；UI 探测 5/5（数据权限页总数 53 → 2）
**Gate**: `go build` / `gofmt` / `go vet` / `go test`（middleware + permission + role）全部通过；`schema_migrations` 24 → 25

## 1. 一句话结论

`system_role_data_scope` 一直有 `tenant_id` 和 `(tenant_id, role_key)` 唯一键，但**六个读写点里有五个只按 `role_key` 工作**。
W1 把租户维度补到读、写、校验三条路径上，并新增 000025 把历史 `tenant_id = 0` 的策略复制回真正持有该角色的租户。

## 2. 改了什么

| 代码点 | 修复前 | 修复后 |
|---|---|---|
| `SystemRoleDataScope`（middleware） | 结构体没有 `TenantID` | 带 `TenantID`，与唯一键 `(tenant_id, role_key)` 对齐 |
| `loadRoleDataScopePolicies`（middleware） | `WHERE role_key IN (...)` | `WHERE tenant_id = ? AND role_key IN (...)`，租户由 `resolvePolicyTenantID(c)` 显式传入 |
| `applyRoleDataScopePolicy` | 2 参数，内部无租户概念 | 3 参数，租户由调用方传入，fail-closed 分支原样保留 |
| `ListDataScopePolicies` | `system_role` 无租户谓词 | 非平台作用域时加 `tenant_id = ?` |
| `ensureRoleKeyExists` | 任意租户存在即通过 | 只认调用方租户（平台作用域除外） |
| `UpdateDataScopePolicy` | 不写 `TenantID`，`OnConflict(role_key)` | 写 `tenantOwnerID()`，`OnConflict(tenant_id, role_key)` |
| `loadRoleDataScopes`（role 服务） | `WHERE role_key IN (...)` | `s.scoped(...)` + `tenant_id` |
| `deleteRoleDataScopes`（role 服务） | 按 `role_key` 删 | 按 `(tenant_id, role_key)` 删 |
| `ensureDeptIDsBelongToTenant`（新增） | 自定义范围接受任意部门 id | 部门必须属于调用方租户，否则 `permission.data_scope.dept_invalid` |

租户从 `tenant.FromGin(c)` 一路显式传进 helper，而不是在 helper 里再解析一次——`DataScopeMiddleware` 已经解析过，
重复解析会让「用哪个租户」出现第二个事实来源。

## 3. 实测证据

### 3.1 L2 配置面（F7 / F8 / F9）

```
[L2] A 的数据范围页只列本租户角色            rows=3  B角色泄露=[]          （基线 53）
[L2] A 为 B 独有角色写数据范围被拒           code=500 msg=permission.role.invalid
[L2] A 写策略后不产生 tenant_id=0 的全局行   rows=[['282','dsp_w1095735','self',''],
                                                  ['292','dsp_w1095735','all','']]
```

第三行是关键：两个租户各写各的行，模式不同（`self` / `all`），没有任何 `tenant_id = 0` 的行被创建。

### 3.2 L3 有效范围串扰（F10，双向）

```
[L3] 两租户同名键基线均为 self
[L3] A 把共享键数据范围放宽为 all            code=200
[L3] A 放宽后 B 用户的有效数据范围不变        B 用户可见行数 1 -> 1；策略行=[['282','all'],['292','self']]
[L3] B 放宽后 A 用户的有效数据范围不变        （反向同样不变）
```

基线里这一步是 `1 -> 3`：A 改自己的策略，B 的普通用户多看到两行。现在两边互不影响。

### 3.3 F11 部门归属

```
[L3] A 提交 B 租户的部门 ID 作为自定义范围被拒   deptIds=[204] code=500 stored(tenant_id=0)= (空)
```

### 3.4 F13 角色列表回显

```
[L3] 角色列表 dataScope 回显与各自库内策略一致
     A 列表=self 库内=self ; B 列表=all 库内=all
     快照(id,tenant,mode)=[['328','282','self'],['329','292','all']]
```

### 3.5 UI 层（F7 的界面证据）

```
PASS 权限工作台角色表不混列他租户同名角色      rows=2 重复键=[]
PASS 数据权限页角色总数等于本租户角色数        总数=2 本租户角色数=2 重复键=[]
```

断言从「总数 ≤ 5」收紧为「总数 == 本租户去重角色数」——原来的写法只要数字不大就能通过，证明不了隔离。

### 3.6 迁移 000025

在独立库 `pantheon_mig025_probe` 上跑四种情形（`sql-snapshots.txt` §D）：

| 情形 | 结果 |
|---|---|
| 角色只被一个租户持有，且有 `tenant_id = 0` 策略 | 复制到该租户 |
| 角色被两个租户持有，其中一个已有自己的行 | 已有行不覆盖，另一个租户得到一份副本 |
| 角色任何地方都没有策略 | 不创建（不凭空给一个没人配过的角色 `all`） |
| 角色已软删除 | 跳过 |
| 第二次执行 | 行数仍为 6，幂等 |

线上库 `pantheon_base` 上 000025 插入 0 行——这个安装里没有任何「租户本地角色 + tenant 0 策略」的组合。
所以迁移语句的正确性靠独立库证明，而不是靠线上数据；这一点写在 `knownGaps` 里，不装作线上已验证。

**迁移语句带 `information_schema` 守卫**（和 000024 同样的写法）：一个数据库可能记录着版本 24 而 000024 的 DDL
从没真正执行过（这正是 000024 存在的原因），那种库上根本没有 `tenant_id`，无守卫的 `INSERT` 会把启动变成失败循环。
有守卫时退化为 no-op，等 000024 的修复在下次真实升级中生效。

这条守卫是被测试逼出来的：`pkg/database` 的
`TestRunMigrationsDoesNotReapplyRoleDataScopeBackfillAfterPolicyDeletion` 造了一个「标记为 24 但没有 tenant_id 列」的库，
第一次跑直接 `migration failed`。同时该测试最后一行从 `assertMigrationVersion(currentRuntimeSchemaVersion)` 改成
`assertLatestMigrationVersion`——基线现在有意落后于最新迁移文件，原来的断言前提不成立了；它真正要断言的
「已删除的策略不会被复活」没有变，仍然在断言。

守卫的两条路径都验证过（`sql-snapshots.txt` §D）：有 `tenant_id` 时正常复制；没有时 `SELECT 1` 空跑不报错。
线上库再把 `schema_migrations` 回退到 24 重启一次，仍然 24 → 25、策略行数 145、健康检查全 ok，
所以带守卫的版本（而不只是它的前身）在真实 schema 上也被证明过。

## 4. 为什么不做另外三件事

- **不删历史 `tenant_id = 0` 行。** 平台作用域仍然读它们；删了会让平台管理员的视图瞬间清空。隔离靠「租户只读自己的行」，不靠删数据。
- **不把「无策略的角色」补成 `all`。** 那等于替运维决定一个从没配过的角色能看全租户。运行时继续 fail-closed。
- **不改平台作用域的读范围。** 平台管理员按定义跨租户（`hasAdministrativeRole` 注释里写明），W5 的视角切换器才负责让「平台视角 / 租户视角」显式化。

## 5. 顺带修的测试夹具

`ensureDeptIDsBelongToTenant` 让两个既有夹具暴露了不真实的 `system_dept`：

- `permission/permission_service_test.go`：`system_dept` 表不存在 → 补建并种入部门 10/20；
- `role/role_service_test.go`：`system_dept` 只有 `(id, dept_name)`，没有 `tenant_id`/`deleted_at`，也没有数据 → 改成真实结构并种入 10/20/30。

第二次是失败后修的（`Error 1054: Unknown column 'deleted_at'`），记录在 `commands.json` 里，因为「新增校验会波及第二个包的夹具」这件事本身值得留痕。

## 6. 剩余风险

见 `review.md` §4 与 `commands.json.knownGaps`：平台作用域仍列出全部角色、无策略角色仍 500、历史自定义范围里的跨租户部门 id 被原样复制（只会更窄，不会更宽）、F14 未排期。
