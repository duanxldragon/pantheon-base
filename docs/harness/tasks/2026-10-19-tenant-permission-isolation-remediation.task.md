---
title: 租户权限隔离整改任务包（角色键全局命名空间 / 数据范围租户维度缺失 / 租户自助开通断链）
doc_type: Remediation
layer: platform
depends_on_layers:
  - system/iam
  - system/auth
  - system/org
  - system/config
status: Active
linked_contracts:
  - docs/contracts/TENANT_CONTRACT_V1.md
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/designs/TENANT_RESOURCE_SCOPE_MATRIX.md
  - docs/runbooks/TENANT_MIGRATION_RUNBOOK.md
updated_at: 2026-10-19
---

# Task Packet: 2026-10-19-tenant-permission-isolation-remediation

## Goal

2026-10-19 的租户交付验收（`.harness/evidence/2026-10-19-tenant-permission-isolation-remediation/baseline-findings.md`）
在 `platform.tenant_mode = multi` 的实机上跑了 193 项断言，通过 179 项（92.7%），留下 13 个缺陷、其中 **5 个 P0**。
这 5 个 P0 不是五个独立 bug，而是**一个同源缺陷簇的三层表现**：

> `role_key` 被当成了跨租户的全局命名空间。表结构（`system_role`、`system_role_permission`、
> `system_role_data_scope`）都已经带了 `tenant_id` 并建了 `(tenant_id, role_key)` 唯一键，
> 但**读写链路上有一半的入口退化成按 `role_key` 单键工作**，写入端还丢掉了租户值（落到 `tenant_id=0`）。

本包的目标是把「租户内资源以 `tenant_id` 为第一维度」这件事从**表结构层面**补齐到**读写链路层面**，
并顺带关闭验收里其余 8 个 P1/P2。完成后，一个配置好的租户应当是：租户管理员能自助建用户、该用户能登录、
自定义角色的菜单授权不丢、数据范围策略互不串租，且 A 租户的任何配置都无法改变 B 租户用户的可见数据。

## Primary Layer

platform

缺陷根因分布在 `internal/middleware`（行级数据范围判定）、`modules/system/iam/{permission,role,user}`（策略与授权读写）、
`pkg/rbacbind`（授权落库）与 `modules/auth/login`（会话签发）。
判定权与契约归属都在 platform 层：本包修改的是**租户作用域契约在数据层的落实方式**，而不是某个业务域的业务规则。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `not-required`
- Release Requirement: `foundation-release`

## Dependency Layers

- `system/iam`：`system_role` / `system_role_permission` / `system_role_menu` / `system_role_data_scope` 四个授权表，以及用户开通。
  本包的主力战场。
- `system/auth`：会话签发与令牌吊销（用户级黑名单），F2 的落点。
- `system/org`：`system_dept` 是数据范围 `custom` 模式的取值来源，F11 的租户归属校验要读它。
- `system/config`：`platform.tenant_mode` 决定 `tenant.FromGin(c)` 是否给出有效上下文，是本包所有租户谓词的输入前提。

## Harness Profile

- Template: admin-platform
- Overlay: pantheon-base
- Quality Profile: permission-policy
- Portable Failure Class: `tenant-predicate-gap`
- Owner Layer: platform
- Ratchet Decision: no new gate（本包不新增门禁；W0 的双租户用例补进既有 `go test` 覆盖面，W6 用验收脚本做终态校验）
- Coverage Dimensions:
  - behaviour
  - runtime-quality
  - architecture-fitness

## Contract Anchors

- `docs/contracts/TENANT_CONTRACT_V1.md` §2.3（租户内资源的主键维度）、**§2.3.1 读写义务（V1.2 新增，本包的判定依据）**、§3.3（数据访问不变量）、§4（Casbin 域主体 `role:<key>@tenant:<id>`）、§7（跨层只读引用）
- `docs/designs/TENANT_RESOURCE_SCOPE_MATRIX.md`（哪些表按租户分片、哪些是平台级）
- `docs/TENANT_SCOPE_FREEZE_DECISION_2026-10-15.md`（作用域冻结决策：本包**不改** `tenant_mode` 取值，只补齐其语义）

## Scope

### In

- 数据范围（行级）策略表在**读写两侧**的租户维度收口，含中间件、权限控制台、角色列表回显
- 租户内新建用户的成员关系（membership）自动建立与删除时的停用
- 角色菜单授权的租户落库
- 登录成功后的用户级令牌黑名单清理
- 控制台两处前端缺陷（平台能力误判、部门树不展开）
- 上述改动的迁移、单元测试、双租户回归用例与验收复跑

### Out

- **不改变** `platform.tenant_mode` 的取值，也不改变 compat 模式下的行为（compat 仍走全局主体）
- 不重做数据权限模型（仍沿用 `all / self / dept / dept_and_children / custom` 五种模式）
- 不改 Casbin 域主体命名规则（`role:<key>@tenant:<id>` 已经是正确的）
- 不引入行级 `tenant_id` 之外的多租户隔离机制（如 schema-per-tenant）
- 不处理本包之外的既有遗留项（`tenants` CRUD 归口 `system/org` 的错位等）

## Expected Files

### Create

- `backend/pkg/database/migrations/000025_role_data_scope_tenant_backfill.up.sql`
- `backend/pkg/database/migrations/000025_role_data_scope_tenant_backfill.down.sql`
- `backend/pkg/database/migrations/000026_role_menu_tenant_backfill.up.sql`
- `backend/pkg/database/migrations/000026_role_menu_tenant_backfill.down.sql`
- `backend/internal/middleware/data_scope_tenant_test.go`
- `backend/modules/system/iam/permission/permission_data_scope_tenant_test.go`
- `.harness/evidence/2026-10-19-w1-data-scope-tenant-dimension/`

### Modify

- `backend/internal/middleware/data_scope_middleware.go`
- `backend/modules/system/iam/permission/permission_data_scope.go`
- `backend/modules/system/iam/permission/permission_service.go`
- `backend/modules/system/iam/role/role_service.go`
- `backend/modules/system/iam/role/role_menu.go`
- `backend/modules/system/iam/user/user_service.go`
- `backend/pkg/rbacbind/rbacbind.go`
- `backend/modules/auth/login/login_runtime.go`
- `backend/pkg/authtoken/token.go`
- `frontend/src/modules/auth/tenant/TenantViewpointSwitcher.tsx`
- `frontend/src/modules/system/org/dept/DeptList.tsx`
- `docs/contracts/TENANT_CONTRACT_V1.md`（补 §2.3 的落地条款）

### Do Not Touch

- `backend/pkg/tenant/authz.go`（域主体构造已正确，改动会波及所有授权判定）
- `backend/pkg/database/scope.go`（`WithDataScope` 的收窄语义正确，问题在"喂给它的 scope 从哪来"）
- 任何 `*.task.md` 之外的历史文档

## Implementation Notes

1. **先补契约再改代码。** `TENANT_CONTRACT_V1.md` §2.3 目前只说"租户内资源带 `tenant_id`"，没有说"读路径必须带谓词、写路径必须赋值"。
   W0 把这条写清楚，后续每个 Wave 的 review 都以它为准，避免"表有列但没人用"的历史重演。
   注意：**红用例不能以失败状态合入主干**——W0 负责编写并跑出红证据，测试文件随 W1 的修复一起转绿后提交（或先挂在 build tag 下）。

2. **`tenant_id = 0` 是平台/全局作用域，不是"未知"。** 所有新增谓词都要显式区分三种情况：
   平台作用域（`tenantID == 0` 且调用方是平台主体）→ 不过滤；
   租户作用域（`tenantID != 0`）→ 强制过滤；
   上下文缺失 → fail-closed（拒绝），绝不退回 `all`。

3. **中间件是热点路径。** `DataScopeMiddleware` 每个带数据范围的请求都走，改动必须保持 fail-closed 语义
   （`rolePoliciesCoverAll` 缺行即拒绝），并且新增单元测试覆盖"同 role_key 两租户各自只读自己的行"。

4. **迁移必须可回滚且幂等。** `000021` 的回填脚本是范本：`INSERT IGNORE` + `LEFT JOIN` + down 只写注释。
   本包的迁移只做"唯一归属回填"（`role_key` 只在一个租户存在时，把 `tenant_id=0` 的行归位），
   有歧义的重复键交给运维按报告 5.6 的巡检 SQL 处理——自动猜测归属比不猜更危险。

5. **F2 的清除时机是安全边界。** 黑名单清理只能发生在**认证成功之后**，不能放宽到任意请求；
   同时要保证"旧 token 仍然失效"（清的是用户级黑名单键，不是会话级）。

6. **前端两处都是"判断依据选错了"，不是样式问题。** F5 用 `hasPerm('system:tenant:list')` 代理平台能力，
   而租户管理员持有全量控制台权限键；F6 把嵌套树直接喂给 Arco Table 而没有 `expandable`。

## Structural Scope

- Affected Subgraph: `HTTP 请求 -> DataScopeMiddleware -> applyRoleDataScopePolicy -> loadRoleDataScopePolicies -> system_role_data_scope`；`权限控制台 -> ListDataScopePolicies/UpdateDataScopePolicy -> ensureRoleKeyExists -> system_role`；`角色 CRUD -> replaceRoleMenus -> rbacbind.InsertRoleMenus -> system_role_menu`；`用户开通 -> CreateUser -> system_user + tenant_memberships -> GateSessionIssuance`；`登录 -> login_runtime -> authtoken.BlacklistUser/ClearUserBlacklist -> Redis`
- Boundary Crossings: `platform`（租户作用域契约）-> `system/iam`（授权数据读写）；`platform` -> `system/auth`（会话签发与吊销）；`system/iam` -> `system/org`（`custom` 数据范围的部门归属校验）；`pkg/database/migrations` -> 四张授权表 DDL 与回填
- Risk Nodes: ① 中间件是全站热点，谓词写错会大面积 500 或越权——由 fail-closed 单测与双租户用例固定；② `tenant_id = 0` 语义过载（既是平台作用域，也是缺陷写入值）——迁移只做唯一归属回填，歧义键交人工；③ `ensureRoleKeyExists` 被三个调用点共享，签名改动会影响平台侧建策略路径——必须显式区分平台/租户调用者；④ F2 的黑名单清理时机是安全边界，过早清理等于绕过禁用动作；⑤ 菜单回填会改写既有安装的数据，需幂等且可回滚
- Graph Focus: 授权表的每一条读写路径都必须能回答「租户从哪来」，答案只能是「从所属实体解析」或「显式传入」，不能是「从标识符猜」

## Execution Roles

- Implementer Posture: 按 Wave 顺序推进，每个 Wave 一个可独立 review 的改动集；先红后绿（W0 先落失败用例）。改任何一条 SQL 之前先回答「这个查询的租户从哪来」。
- Reviewer Posture:
  - 核验每条新增/修改的授权表 SQL 都带租户谓词，或能说明为何不需要（平台作用域）。
  - 核验 fail-closed 仍然成立：缺策略行必须拒绝，不得退回 `all`。
  - 核验没有把 `tenant_id = 0` 当成"未知"使用，也没有把平台作用域写进租户作用域。
  - 核验迁移幂等、可回滚，且不在回填里猜测归属。
  - 核验 F2 的黑名单清理只发生在认证成功之后，且会话级吊销仍生效。
  - 核验前端两处修的是判定依据，不是把报错提示吞掉。

## Dependency Plan

七个 Wave，W0 是所有 Wave 的前置（契约 + 红用例），W1~W5 之间无相互依赖，可并行；W6 收口。

| Wave | 任务包 | 关闭缺陷 | 依赖 | 可并行 |
|---|---|---|---|---|
| W0 | `2026-10-19-w0-isolation-contract-guardrails` | 契约条款 + 双租户红用例 | — | 否（前置） |
| W1 | `2026-10-19-w1-data-scope-tenant-dimension` | F7 F8 F9 F10 F11 F13 | W0 | 是 |
| W2 | `2026-10-19-w2-tenant-user-onboarding` | F1 F4 | W0 | 是 |
| W3 | `2026-10-19-w3-role-menu-grant-persistence` | F3 | W0 | 是 |
| W4 | `2026-10-19-w4-session-revocation-login-gate` | F2 | W0 | 是 |
| W5 | `2026-10-19-w5-tenant-console-ux` | F5 F6 | W0 | 是 |
| W6 | `2026-10-19-w6-reverification-closeout` | 全量复跑 + 报告收口 | W1~W5 | 否（收口） |

**建议推进顺序**：W0 → W1 → W2 → W3 → W4 → W5 → W6。
W1 最重且风险最高，放在前面做可以让后续 Wave 在"租户谓词"这套新约定下写代码；
W2/W3 同属 `system/iam` 且都改授权落库，可合并在一次 review 里看；W5 纯前端，随时可插入。

## Verification Plan

- 静态：`cd backend && go build ./...`；`gofmt -l internal/ modules/ pkg/` 应无输出；`go vet ./internal/middleware/... ./modules/system/iam/... ./modules/auth/login/... ./pkg/...`。
- 单测：`cd backend && go test -count=1 ./internal/middleware/... ./modules/system/iam/... ./modules/auth/login/... ./pkg/rbacbind/... ./pkg/tenant/...`。
- 双租户回归（W0 建立、W1 转绿）：`go test -count=1 ./internal/middleware/ -run Tenant`；`go test -count=1 ./modules/system/iam/permission/ -run Tenant`。
- 接口层验收（W6）：`python tenant_acceptance.py`（136 项，A0~A13）。
- UI 走查（W6）：`NODE_PATH=<frontend>/node_modules node ui_walkthrough.cjs`（23 项，14 个页面）。
- 串租专项（W1 与 W6）：`python cross_tenant_leak.py`（34 项，L0~L4，双租户对打）。
- 迁移校验（W1/W3）：在测试库上正反各跑一次 `000025` / `000026`，确认幂等且 down 不丢数据。
- 仓库门禁：`node scripts/harness/check-task-packet.mjs --root .`。
- 运行期证据（W6 必须逐条给出）：① A 改策略、B 用户可见行数不变的前后对比（`cross_tenant_leak.py` L3）；② 数据范围页在租户 A 下的角色总数等于本租户角色数；③ 租户内新建用户直接登录成功，无需平台侧补 membership；④ 租户内建角色配菜单后回读 `menuIds` 一致，二次编辑不丢；⑤ 重置密码后立即登录成功，且改动前的 token 仍返回 `401 token.expired.force`。

## Evidence Required

- `.harness/evidence/2026-10-19-tenant-permission-isolation-remediation/baseline-findings.md`：整改前的 13 个缺陷与实测证据
- `.harness/evidence/2026-10-19-tenant-permission-isolation-remediation/commands.json`：逐条命令的 cwd、状态、输出摘要；未执行的标注 not-run 与原因
- `.harness/evidence/2026-10-19-tenant-permission-isolation-remediation/summary.md`：Wave 完成度与剩余项
- `.harness/evidence/2026-10-19-tenant-permission-isolation-remediation/review.md`：架构 review（谓词覆盖率、fail-closed 是否保持）
- 每个子任务的 `evidence/<task-id>/` 下各自的 commands / summary / review

## Human Gates

1. **是否保留 `platform.tenant_mode = multi`** —— 本包不改这个值，但 W1 的谓词行为依赖它；若退回 compat，本包的隔离收益为零。
2. **`tenant_id = 0` 历史行的处置** —— 迁移只做"唯一归属回填"，重复键的全局行需要人工确认后再删（报告 5.6 给了巡检 SQL）。
3. **W2 的成员关系默认角色** —— 新建用户默认 `member` 还是继承创建者角色，属产品决策；本包按 `member` 实现。
4. **是否接受"先关 P0、P1 分批"** —— W6 允许在 P0 全绿、P1 有明确排期的情况下收口。
5. **F2 的清理范围** —— 只清用户级黑名单（保留会话级吊销），这会让"重置密码后旧 refresh token"仍失效；若产品要求"重置密码踢掉所有设备"，需要另开任务。

## Linkage

- Task ID: `2026-10-19-tenant-permission-isolation-remediation`
- Task Manifest: `.harness/tasks/2026-10-19-tenant-permission-isolation-remediation/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Plan References: `docs/contracts/TENANT_CONTRACT_V1.md`, `docs/TENANT_SCOPE_FREEZE_DECISION_2026-10-15.md`
- Evidence Directory: `.harness/evidence/2026-10-19-tenant-permission-isolation-remediation/`
- Review File: `.harness/evidence/2026-10-19-tenant-permission-isolation-remediation/review.md`

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] W0 契约条款落地，双租户红用例在未修复代码上稳定失败
- [x] W1 数据范围策略的读写入口全部带租户谓词，`tenant_id=0` 不再产生新行
- [x] W1 迁移幂等且可回滚（down 保留数据），历史 `tenant_id=0` 行按持有者复制回填
- [x] W2 租户内新建用户可直接登录，删除用户不留幽灵成员
- [x] W3 租户内角色菜单授权落库带租户，二次编辑不丢
- [x] W4 重置密码/禁用后立即登录成功，旧 token 仍失效
- [x] W5 控制台不再出现 `tenant.platformOnly` 提示，部门树完整渲染
- [x] W6 `tenant_acceptance.py` 136 项、`ui_walkthrough.cjs` 23 项、`cross_tenant_leak.py` 34 项全绿
- [x] 验收报告与 `STATUS.md` 更新，缺陷状态逐条关闭或明确降级（F14 降级，见 W6 disposition）
