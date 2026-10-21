---
title: 全景验收整改任务包（租户隔离 P0/P1、会话边界、Tenant Smoke 根因）
doc_type: Remediation
layer: platform
depends_on_layers:
  - system/auth
  - system/iam
  - system/config
status: Active
linked_contracts:
  - docs/contracts/TENANT_CONTRACT_V1.md
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/SYSTEM_IAM_CONTRACT.md
  - docs/contracts/SYSTEM_AUTH_CONTRACT.md
updated_at: 2026-10-21
---

# Task Packet: 2026-10-21-acceptance-remediation

## Goal

对 `pantheon-base` 做一次全景企业级验收（单租户能力、多租户闭环、兼容模式互切、代码/架构/安全/性能/前端/测试/CI/文档八个维度），
把阻断阶段性验收的缺陷修完并留下可复核证据：

1. **B1 / B3（P0/P1）平台能力面缺失**：`system/menu` 与 `system/i18n` 写路由没有 `PlatformCapabilityMiddleware`，
   租户管理员可通过 `/system/menu` 改写共享菜单树；i18n 系统资源写路由同类。
2. **B2（P1）兼容模式租户作用域未固定**：`compat` 模式下请求头/参数仍可指定 `tenant_id`，
   且 `multi → compat` 降级无守卫，降级后多租户数据会被读成全局。
3. **B5（P1）会话不随租户/成员失效**：租户挂起、成员被移除后，在线会话仍然有效。
4. **B4（P1）新租户字典为空**：provisioning 复制 settings 却不复制 `system_dict_type` / `system_dict_item`，
   租户页面标签解析全部为空。
5. **B6（P1）角色键命名空间单向守卫**：平台可创建与租户同名的键，反向不校验。
6. **C1 / C2 / C4（P1/P2）**：OIDC 表游离在编号迁移链之外；租户 handler 仍返回旧式错误体并泄漏内部错误；
   OIDC 唯一键缺租户维度。
7. **E1 / E2（P1）会话边界数据泄漏**：路由预热缓存跨账号复用；登出不清理二次验证 operation token。
8. **F1（P1）Tenant Smoke 常红**：`AddMember` 对已存在成员返回 400，冒烟 setup 失败（第二根因，
   第一根因 `platform.tenant_mode` 已在 #393 修复）。
9. **D1（P2）生产构建未强制 Gin release mode**。

## Primary Layer

platform

缺陷集中在跨层判定：`pkg/tenant` 的租户作用域解析、`internal/middleware` 的平台能力判定、
`system/iam/tenant` 的生命周期闭环、`auth/session` 的会话边界。判定权在 platform 契约
（`TENANT_CONTRACT_V1` §2.3、§3.3/§3.4、§4），本包补齐实现并同步文档，不新增概念。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `not-required`
- Release Requirement: `foundation-release`

## Dependency Layers

- `platform`：`pkg/tenant` 的 SQL 作用域谓词、`internal/middleware` 的平台能力判定、`cmd/server` 的 release mode。
- `system/auth`：`session` 的失效链路、`oidc` 的迁移与租户唯一键。
- `system/iam`：`tenant`（生命周期、provisioning、handler 错误体）、`role`（命名空间互斥）。
- `system/config`：`setting` 的 tenant_mode 降级守卫、`dict` 的租户复制。
- 前端：`api/request.ts`、`core/router/prefetch.ts`、`core/layout/AppLayout.tsx` 的会话边界清理。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `permission-policy`
- Portable Failure Class: `missing-capability-gate-on-shared-write` / `session-outlives-authorization`
- Owner Layer: `consumer-repository`
- Ratchet Decision: `sensor-added`
- Coverage Dimensions:
  - behaviour
  - architecture-fitness
  - runtime-quality

## Contract Anchors

- `docs/contracts/TENANT_CONTRACT_V1.md` §2.3：`compat` 模式下 `tenant_id` 固定为 0，任何外部输入不得覆盖。
- §3.3/§3.4：平台管理面必须显式声明；只有全局角色或全局策略构成平台能力，租户域授权不得满足平台判定。
- `docs/contracts/SYSTEM_IAM_CONTRACT.md`：角色键命名空间唯一性与租户 provisioning 契约。
- `docs/contracts/SYSTEM_AUTH_CONTRACT.md`：会话生命周期与二次验证凭据的作用域。
- 迁移链 `000001…000029`：所有 schema 变更必须是编号迁移且带 down。

## Scope

### In

- `backend/internal/middleware`：菜单/i18n 系统写路由接入平台能力判定（B1/B3）。
- `backend/pkg/tenant/tenant.go` + `backend/modules/system/system_modules.go`：compat 作用域固定与降级守卫（B2）。
- `backend/modules/system/iam/tenant/tenant_service.go`：租户挂起/成员移除时撤销会话（B5）。
- `backend/modules/system/iam/tenant/tenant_provision.go`：幂等复制平台字典（B4）。
- `backend/modules/system/iam/role/role_helper.go`：双向角色键命名空间互斥（B6）。
- `backend/modules/system/iam/tenant/tenant_handler.go`：统一错误信封且不泄漏内部错误（C2）。
- `backend/pkg/database/migrations/000029_oidc_fields.{up,down}.sql`：OIDC 表并入编号迁移链、唯一键加租户维度（C1/C4），
  删除游离的 `add_oidc_fields.sql`。
- `backend/modules/auth/{oidc,session}`：operation token 与会话边界清理（E2）。
- `backend/cmd/server/main.go` + `Dockerfile`：生产构建强制 release mode（D1）。
- `frontend/src/{api/request.ts,core/router/prefetch.ts,core/layout/AppLayout.tsx,modules/auth/login/components/Login.tsx}`：
  路由预热缓存与会话边界失效（E1）。
- 四份验收交付文档与 `docs/README.md`、`docs/designs/TENANT_RESOURCE_SCOPE_MATRIX.md`、
  `docs/TENANT_SCOPE_FREEZE_DECISION_2026-10-15.md`、`CHANGELOG.md`、`RELEASE_NOTES_v0.17.0.md` 同步。
- 本任务包与 `.harness/evidence/2026-10-21-acceptance-remediation/`。

### Out

- 不改 Casbin 模型、domain 主语格式或平台能力定义本身（契约 §3.4/§4）。
- 不引入 CMDB、K8s、CI/CD、监控、OA、工作流、消息中心、调度等业务模块能力。
- 不做租户自定义菜单/权限（2026-10-15 冻结决策）。
- 不拆分微服务、不做性能专项重构。
- 不替维护者执行凭据轮换、分支保护、tag/release 发布等需要管理员或运维动作的事项。

## Expected Files

### Create

- `docs/harness/tasks/2026-10-21-acceptance-remediation.task.md`
- `.harness/tasks/2026-10-21-acceptance-remediation/manifest.json`
- `.harness/evidence/2026-10-21-acceptance-remediation/{commands.json,summary.md,review.md,pr-body.md}`
- `backend/pkg/database/migrations/000029_oidc_fields.{up,down}.sql`
- `backend/pkg/tenant/tenant_scope_sql_test.go`
- `backend/internal/middleware/platform_capability_middleware_test.go`
- `backend/modules/system/iam/role/role_key_namespace_test.go`
- `backend/modules/system/iam/tenant/{tenant_provision_dicts_test.go,tenant_service_session_revocation_test.go,tenant_handler_test.go}`
- `backend/modules/system/config/setting/setting_tenant_mode_guard_test.go`
- `frontend/tests/unit/api/requestOperationTokenSession.test.ts`
- `frontend/tests/unit/core/router/routeWarmDataSessionBoundary.test.ts`
- `docs/reviews/PANTHEON_BASE_{FINAL_ACCEPTANCE_REVIEW,ACCEPTANCE_MATRIX,ISSUES_AND_REMEDIATION,TEST_AND_ACCEPTANCE_REPORT}_2026-10-21.md`

### Modify

- `backend/pkg/tenant/tenant.go`、`backend/modules/system/system_modules.go`、`backend/cmd/server/{main.go,main_test.go}`、`Dockerfile`
- `backend/modules/system/iam/tenant/{tenant_service.go,tenant_provision.go,tenant_handler.go,tenant_service_test.go}`
- `backend/modules/system/iam/role/role_helper.go`
- `backend/modules/system/config/{setting/setting_service.go,dict/dict_service.go}`
- `backend/modules/auth/{oidc/handler.go,oidc/service.go,session/session_service.go,session/session_tenant_scope_test.go}`
- `backend/pkg/database/migrate_test.go`
- `frontend/src/{api/request.ts,core/layout/AppLayout.tsx,core/router/prefetch.ts,modules/auth/login/components/Login.tsx}`
- `CHANGELOG.md`、`RELEASE_NOTES_v0.17.0.md`、`docs/README.md`、`docs/designs/TENANT_RESOURCE_SCOPE_MATRIX.md`、
  `docs/TENANT_SCOPE_FREEZE_DECISION_2026-10-15.md`

### Do Not Touch

- `backend/pkg/database/casbin.go` 与 Casbin 模型定义。
- `.github/workflows/**`（本包不改门禁；Tenant Smoke 由修复本身转绿）。
- `.harness/archive/**` 与历史 evidence 目录。
- `pantheon-ops` 消费侧 lock（独立变更）。

## Implementation Notes

- **能力面收口**：共享资源的写路径必须在中间件层判定平台能力，不能依赖 handler 内的租户推断。
- **compat 固定**：`compat` 下作用域解析优先返回 pinned 0，忽略 header/param；`multi → compat` 降级要求显式确认，
  否则返回冲突而不是静默改变可见数据集。
- **会话失效**：撤销只针对该租户的 active 成员，写 `revoked_at`；不删行，保留审计。
- **字典复制**：沿用 settings 复制的 `INSERT … SELECT` + `NOT EXISTS` 形状；租户自有/已定制的键优先保留，
  软删行仍占唯一键因此跳过，平台侧只复制 `deleted_at IS NULL`。
- **命名空间互斥**：双向校验，且重命名时必须排除被编辑角色本身，否则自身行触发 `role.key.reserved`。
- **错误信封**：租户 handler 统一走 `common` 错误映射，内部错误只落日志，响应体不透出。
- **迁移 000029**：`information_schema` 守卫 + 幂等 up/down，可从已手工执行过 `add_oidc_fields.sql` 的库安全接管。
- **前端边界**：路由预热数据与 operation token 都以会话为生命周期，登出/切换账号即失效。

## Structural Scope

- Affected Subgraph: `route(middleware capability) -> tenant scope resolve -> service(policy/lifecycle) -> db(scope predicate) / session(revoke) -> frontend(cache boundary)`
- Boundary Crossings: 有。写路由的能力判定、compat 作用域解析、会话生命周期三处判定权集中收口，跨 platform / system/iam / system/auth / system/config。
- Risk Nodes: 若能力判定被绕过，共享资源再次可写；若会话撤销漏路径，被移除成员仍可访问；
  若字典复制幂等性不成立，重复 provisioning 会撞唯一键。三类各有新用例锁死。
- Graph Focus: 「授权判定」与「数据可见范围」是两个独立维度，任何只按其中一个工作的路径都是逃逸面。

## Execution Roles

- Implementer Posture: 先以真实 MySQL 复现缺陷，再最小化修复，然后把复现用例固化为回归；修复自身引入的回退（R1-R4）逐条记录。
- Reviewer Posture: 复核「租户是否还能命中共享写面」「compat 是否还能被外部输入覆盖」「被撤销成员是否仍可访问」「门禁红灯是否被掩盖」。

## Verification Plan

- Static: `cd backend && go build ./... && go vet ./modules/... ./pkg/...`；`cd frontend && node ./node_modules/typescript/bin/tsc -b`。
- Unit（真实 MySQL，`PANTHEON_TEST_DSN` 来自 `.env.test`）：
  - `go test -count=1 ./pkg/tenant/ -run TestTenantScopeSQL`
  - `go test -count=1 ./internal/middleware/ -run TestPlatformCapability`
  - `go test -count=1 ./modules/system/iam/tenant/ -v`
  - `go test -count=1 ./modules/system/iam/role/ -v`
  - `go test -count=1 ./modules/system/config/...`
  - `go test -count=1 ./modules/auth/...`
- Frontend: `node ./node_modules/vitest/vitest.mjs run`、`eslint`、`npm run build`。
- Repo gates: `node scripts/harness/check-task-packet.mjs --root .`、`node scripts/frontmatter-check.mjs`。
- CI: `go test -race ./...`、`Tenant Smoke (multi-mode advisory)`、`PR Smoke Modules`（本机无 C 工具链，`-race` 只能在 CI 复验）。

## Evidence Required

- `commands.json`：每条命令的目录、状态与真实输出摘要，含修复过程中我自己引入的四条回退（R1-R4）与修复。
- `summary.md`：缺陷、修法、影响面、未验证项与环境限制。
- `review.md`：对照 In/Out 的逐项复核与显式 gap 声明。
- 四份交付文档：`docs/reviews/PANTHEON_BASE_*_2026-10-21.md`。

## Human Gates

- 维护者三触点之「最终视觉/功能验收」：浏览器层 Tenant Smoke 需 CI 或维护者本地实跑确认。
- 数据库凭据轮换（D2）与 `main` 分支保护（F2）由维护者执行。
- `Tenant Smoke` 是否从 advisory 升为 blocking（B10）由维护者决定。
- v0.17.0 tag/release 发布需要维护者 gh 凭据与批准。

## Linkage

- Task ID: `2026-10-21-acceptance-remediation`
- Task Manifest: `.harness/tasks/2026-10-21-acceptance-remediation/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Evidence Directory: `.harness/evidence/2026-10-21-acceptance-remediation/`
- Review File: `.harness/evidence/2026-10-21-acceptance-remediation/review.md`
- Assessment: `docs/reviews/PANTHEON_BASE_FINAL_ACCEPTANCE_REVIEW_2026-10-21.md`
- Plan References: `docs/contracts/TENANT_CONTRACT_V1.md`、`docs/reviews/PANTHEON_BASE_ISSUES_AND_REMEDIATION_2026-10-21.md`

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] 共享写资源（菜单 / i18n 系统资源）受平台能力中间件保护
- [x] compat 模式租户作用域固定且 multi→compat 降级有守卫
- [x] 租户挂起与成员移除撤销在线会话
- [x] 新租户 provisioning 幂等复制平台字典
- [x] 角色键命名空间双向互斥且重命名不自冲突
- [x] OIDC schema 并入编号迁移链 000029，唯一键含租户
- [x] 会话边界（预热缓存、operation token）随登出失效
- [x] AddMember 幂等，消除 Tenant Smoke 的一条真实触发条件（job 仍 flaky，见下）
- [x] 生产构建强制 Gin release mode
- [x] 后端测试、前端 tsc/vitest/eslint/build、文档门禁本地全绿
- [x] 修正被 Redis-skip 掩盖的会话用例断言（R5），并在配好 MySQL+Redis 的环境复跑
- [x] CI 实跑确认 `Backend Tests` / `Unit Tests` / `Coverage Gate` / `CI Summary` / `Quality Gates` 转绿（PR #397，head f0f650a5）
- [ ] `go test -race ./...` 全量：本机无 C 工具链，CI 侧 `-race` 结论仍需确认（`quality.yml` 的 `Unit Tests` 腿）
- [ ] SonarCloud 新代码异味（`go:S1192`、`go:S3776`）已清除；`gosecurity:S3649` 三条 BLOCKER 属绑定参数误报，需维护者在 Sonar 侧处置（不抑制、不排除规则）
- [ ] 安全门禁处置到位后，方可在 `main`（#395 已把 `release/v0.17.0` 合入并删除该分支，merge commit `762d94a5`）上打 `pantheon-base-v0.17.0` tag
- [ ] 补一条 checker：runtime-sensitive 套件在缺 `PANTHEON_TEST_REDIS_ADDR` 时应失败而非 skip（与 B10 同族，显式延期）
