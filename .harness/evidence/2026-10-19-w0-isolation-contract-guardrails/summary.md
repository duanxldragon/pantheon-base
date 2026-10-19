# W0 — 契约条款 + 双租户红用例（2026-10-19-w0-isolation-contract-guardrails）

**Status**: completed
**Scope**: 把「列存在但路径忽略」变成可引用的违规；把 6 个缺陷变成 7 条可执行的红用例
**Gate**: 变异后 7 项失败（每项都指向泄漏本身）→ 还原后全绿；`go build` 通过；文档门禁全绿

## 1. 一句话结论

§3.3 早就要求「带 `tenant_id` 的表必须附加租户谓词」，但它写在**上下文**一章、只描述「查询」；
§2.3 讲归属时只说了「哪些表带这一列」。于是**「表里有没有这一列」被当成合规判据，「路径上有没有用这一列」没人检查**——
这正是 6 个缺陷能同时存在的原因。W0 补上 §2.3.1，并让 7 条测试在旧代码上红、在新代码上绿。

## 2. 契约新增：§2.3.1 读写义务（V1.2）

三条，各自可被单独引用驳回：

| 条 | 内容 | 驳回什么 |
|---|---|---|
| 1 | 读必须带租户谓词；`(tenant_id, key)` 唯一而非全局唯一 | `WHERE role_key = ?`（含 `LIMIT 1`、含只用于回显） |
| 2 | 写必须由上下文赋值租户，冲突键必须含 `tenant_id` | `ON CONFLICT(role_key)` —— 会把租户私有行改写成 `tenant_id = 0` 的平台行 |
| 3 | 按裸键做存在性/归属校验也算读 | 不带租户的 `Count()` 归属校验、引用他租户主数据 id |

配套写明**唯一两个放行面**（平台作用域只读写 `tenant_id = 0`，不因此获得按裸键操作租户行的权力；租户作用域只碰自己那份），
以及「上下文缺失 → 按 §3.2 拒绝，不得退化为读全部；策略读不到 → fail-closed」。

§9 变更记录加了 V1.2 行与「触发与范围」段：明确这是**澄清**，只前移义务，不改 §3.3/§4/§5/§7 任何语义。

## 3. 红用例：怎么红、为什么可信

把 W1 引入的 5 个谓词临时还原（`loadRoleDataScopePolicies` / `ListDataScopePolicies` /
`UpdateDataScopePolicy` 的 `TenantID` 与 `OnConflict` / `ensureRoleKeyExists` / `ensureDeptIDsBelongToTenant`），
得到 7 项失败：

```
internal/middleware
  TestLoadRoleDataScopePoliciesIsTenantScoped        4 个子用例全红
  TestDataScopeMiddlewareAppliesOnlyTheCallersPolicy  got "all", expected "self"
  TestDataScopeMiddlewareIgnoresOtherTenantsPolicy    handler 跑了，mode="all"
system/iam/permission
  TestListDataScopePoliciesIsTenantScoped             本租户 2 个角色，列出 5 行
  TestUpdateDataScopePolicyWritesToCallersTenant      写入落到了 tenant 0 那一行
  TestUpdateDataScopePolicyRejectsForeignRoleKey      err = nil（他租户键被接受）
  TestUpdateDataScopePolicyRejectsForeignDeptIDs      err = nil（他租户部门被接受）
system/iam/role（第二轮补的 F13）
  TestListRolesEchoesOnlyTheCallersDataScope          租户 101 回显了租户 202 的 dept
```

F13 这条是第二轮补的：第一版只有 middleware 和 permission 的用例，`RoleService.loadRoleDataScopes`
只有验收层的 L3 断言、没有单测。补上后发现它只让**租户 A** 红——因为 B 的行恰好最后被扫到，
B 看起来是对的。这正是 F13 的形状：**只查一个租户的测试会通过**。

每一条都指向泄漏本身（模式被放宽 / 行数 5 而不是 2 / 写入落到 tenant 0 / 外来键被接受 / 回显了别人的模式），
没有一条是编译错误、夹具缺失或空指针——这是「红用例有意义」的判据。
完整输出：`red-run.log`。

还原后 `md5sum -c` 四个文件全部 OK，`go build` 通过，同一批用例全绿（middleware 5.6s / permission 11.5s / role 11.8s）。

## 4. 顺手修掉的一个门禁缺陷

manifest 原来的验证命令是 `go test -run Tenant`。7 条里有 3 条名字不含 `Tenant`：

- `TestDataScopeMiddlewareAppliesOnlyTheCallersPolicy`
- `TestUpdateDataScopePolicyRejectsForeignRoleKey`
- `TestUpdateDataScopePolicyRejectsForeignDeptIDs`

也就是说那条命令会在 3 条泄漏断言仍然红着的时候报告 `ok`。已改为 `-run 'Tenant|DataScope'`（选中 41 项），
并在 manifest 的 `implementationNotes` 里留了原因——**一个会假绿的门禁比没有门禁更糟**。

## 5. 为什么红用例是 Go 测试，而不是验收脚本

`acceptance/cross_tenant_leak.py` 需要起服务、建租户、连 MySQL，属于验收产物；`Go` 测试用 `testmysql` 起独立库、
随 CI 跑。W0 只把后者纳入门禁，前者继续留在 `.harness/evidence` 里作为运行态证据（W1 已跑 26/26）。

## 6. 剩余

见 `review.md` §3：本波只覆盖数据范围簇；F1–F6 的红用例随各自的 Wave 到来。
另外，「防止**新写**一条无谓词查询」目前只靠条款可引用 + 已有测试，真正的强制手段是静态检查（lint 掉无 `tenant_id` 的 `role_key` 查询），不在本程序范围内。
