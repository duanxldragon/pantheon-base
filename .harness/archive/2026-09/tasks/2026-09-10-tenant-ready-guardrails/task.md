# Task Packet: Tenant-Ready Guardrails

## Goal

移除当前生成器的租户伪能力，并把租户就绪检查纳入业务模块、DDL 和验收流程，同时保持单租户运行态不变。

## Priority

`critical`

## Estimated Complexity

`moderate`

## Primary Layer

platform

## Dependency Layers

- platform contracts
- system/config and low-code generator governance
- harness acceptance checks

## Dependencies

- blockedBy: `none`
- blocks: `2026-09-10-tenant-contract-design`, `2026-09-10-tenant-canary-slice`

## Harness Profile

- Template: `custom`
- Overlay: `tenant-ready`
- Coverage Dimensions:
  - architecture-fitness
  - maintainability
  - method-health
  - behaviour

## Contract Anchors

- `docs/reviews/PANTHEON_BASE_INDEPENDENT_AUDIT_PLAN_20260910.md`
- `docs/designs/TENANT_READY_SINGLE_TENANT_DESIGN.md`
- `docs/acceptances/BUSINESS_MODULE_ACCEPTANCE_MATRIX.md`
- `docs/acceptances/TASK_PACKET_BASE_TEMPLATE.md`
- `backend/internal/scaffold/contract.go`
- `frontend/src/modules/lowcode/generator/schema.ts`

## Scope

### In

- 删除或禁用生成器中没有 runtime 实现支撑的 `tenant` 数据范围选项，并补回归测试/文案。
- 在业务模块模板、DDL review、验收矩阵中加入 tenant 字段、租户内唯一、查询/导出/统计过滤、审计维度四项检查。
- 建立 platform-global / tenant-owned / tenant-overridable / derived resource 矩阵模板和全局唯一键登记入口。
- 在设计文档中把 Header、子域名、自定义域名、JWT 等识别方式标为待决策，不允许按示例直接实现。
- 覆盖率测量口径对账：使 CI 门禁测得的覆盖率与 `2026-09-08-p1-test-coverage-phase1` evidence 声称的口径一致，并据实对齐该任务的 manifest 状态与 CI 阈值。详见 Implementation Notes。

### Out

- 不新增 Tenant 表、tenant middleware、token claim、Casbin domain 或 migration。
- 不改变现有登录、权限、菜单、配置和业务 API 的运行行为。
- 不宣称系统已支持多租户。

## Assumptions and Open Questions

- Confirmed Facts: 当前 `DataScopeMode` 没有 tenant 模式，但 scaffold contract、前端 schema 和向导暴露了该选项。
- Confirmed Facts: 伪能力触点共 8 处 —— `backend/internal/scaffold/contract.go:73`、`frontend/src/modules/lowcode/generator/schema.ts:25`、`frontend/src/modules/lowcode/generator/pages/ModuleWizard.tsx:1737-1738`，以及 5 个 locale 的 `generator.wizard.dataScopeMode.tenant` 键（`zh-CN.ts:1076`、`en-US.ts:1163`、`ja-JP.ts:1808`、`ko-KR.ts:1741`、`fr-FR.ts:1879`）。运行时真相源为 `backend/pkg/common/data_scope.go:11-15`（`all / self / dept / dept_and_children / custom`）。
- Confirmed Facts: `2026-09-08-p1-test-coverage-phase1` 的达成数字建立在本地 MySQL + Redis 环境；CI `unit-tests` job（`.github/workflows/ci.yml:103-124`）无 MySQL/Redis service、无 `PANTHEON_TEST_DSN`，两条测量线之间没有桥。
- Working Assumptions: 任务只修改治理/生成器契约和测试，不改已有数据库。
- Open Questions: 矩阵模板的最终业务资源清单由合同任务冻结。
- Open Questions: CI 覆盖率对账采用「给 unit-tests job 补 MySQL/Redis service」还是「增设独立 DB-backed 覆盖率 job」，属阈值/门禁政策决策，需 human gate。

## Minimum Viable Approach

- Selected Rung: `reuse`
- Why This Is Enough: 复用现有生成器契约、验收矩阵和文档门禁，只下线伪能力并增加检查项。
- Upgrade Trigger: 若现有 checker 无法表达四项租户就绪条件，再增加最小本地 checker。

## Success Criteria

- Behaviour Outcome: 向导不再提供静默失效的 tenant 选项，新的业务/DDL 评审能留下租户就绪判断。
- Behaviour Outcome: CI 门禁报告的覆盖率与 evidence 声称的口径一致；`2026-09-08-p1-test-coverage-phase1` 的 manifest 状态与 CI 阈值据实对齐，不再出现「evidence 称达成、门禁测不到」的双轨状态。
- Verification Signal: 生成器契约测试、`npm run check:docs-frontmatter`、`npm run check:harness-docs`、后端全量测试通过。
- Verification Signal: `node scripts/audit-i18n-locales.mjs` 五个 locale 均 `missing=0 extra=0`（当前基线各 2805 键），证明 tenant 文案键在全部 locale 同步下线。
- Regression Watch: 单租户生成模块、现有权限和数据库 schema 无行为变化。
- Regression Watch: 覆盖率对账只改测量与门禁配置，不得为凑阈值删除或跳过既有测试。
- Economics Watch: 若为对账给 CI 增加 MySQL/Redis service，记录 unit-tests job 时长变化（当前 `timeout-minutes: 10`）。

## Structural Scope

- Affected Subgraph: low-code schema/contract -> generator wizard -> generated module acceptance -> DDL review
- Boundary Crossings: platform -> system/config -> business/*
- Risk Nodes: generator orchestrator; acceptance checker; false capability surface
- Graph Focus: contract consistency and sensitive-input-flow

## Expected Files

### Create

- `.harness/tasks/2026-09-10-tenant-ready-guardrails/manifest.json`
- `.harness/evidence/2026-09-10-tenant-ready-guardrails/summary.md`
- `.harness/evidence/2026-09-10-tenant-ready-guardrails/review.md`
- tenant resource-scope matrix template under `docs/`

### Modify

- `backend/internal/scaffold/contract.go`
- `frontend/src/modules/lowcode/generator/schema.ts`
- `frontend/src/modules/lowcode/generator/pages/ModuleWizard.tsx`
- `frontend/src/i18n/resources/{zh-CN,en-US,ja-JP,ko-KR,fr-FR}.ts` — 同步下线 `generator.wizard.dataScopeMode.tenant`，保持五个 locale 键数一致
- `.github/workflows/ci.yml` — 仅覆盖率测量口径与阈值（对账项）
- `.harness/tasks/2026-09-08-p1-test-coverage-phase1/manifest.json` — 仅据实对齐 status
- related generator tests and acceptance/DDL governance documents

### Do Not Touch

- production auth/session/IAM code
- database migrations and existing user data
- `pantheon-ops` files

## Implementation Notes

- 下线选项时必须给出明确“未实现”或移除路径，不能仅隐藏 UI 而保留可生成的后端模式。
- 若前端向导显示 capability status，文字必须与 backend runtime enum 同源。
- 任何新增 checker 必须 fail closed 于新模块，不回溯破坏已有单租户模块。
- 伪能力清理需覆盖全部 8 处触点（见 Assumptions）。只改代码不改 i18n 会留下孤儿文案；`scripts/audit-i18n-locales.mjs` 强校验五个 locale 键数一致，只删部分 locale 会红。
- 覆盖率对账的根因是两条测量线不通，不是状态字段填错。`manifest.json:8` 的 `week23Progress` 已自述 "CI threshold still not raised (needs MySQL service in ci.yml first - maintainer decision)"。因此对账动作是补 CI 的 DB 环境让门禁能测到真实数字，之后再按实测值设定阈值；**不允许只把 manifest status 改为 done 就算对账完成**。
- 对账前的实测基线（DSN-less，即 CI 当前所测路径）：`auth/login` 8.9%、`auth/security` 6.0%、`auth/session` 32.5%、`iam/menu` 12.8%、`iam/permission` 5.5%、`iam/role` 8.4%、`iam/user` 10.8%、`audit` 26.5%。CI 阈值当前为 backend 11%、frontend 0%（`ci.yml:316`、`:328`），低于真实基线，不具备防回归作用。
- 本项对账是 `2026-09-10-tenant-core-auth-iam` 的前置。该任务已声明 `blockedBy: 2026-09-08-p1-test-coverage-phase1`，但在两条测量线打通前那道依赖是空转的，挡不住任何东西。

## Execution Roles

- Implementer Posture: contract/governance implementer; no tenant runtime implementation
- Reviewer Posture: generator/runtime contract reviewer; verify no pseudo-capability remains

## Stop Points

- 发现需要修改 auth、IAM、schema 或 migration 时停止，转交后续任务。
- 生成器测试无法证明 tenant 选项已从 runtime contract 消失时停止。
- 覆盖率对账无法在 CI 内取得可复现的 DB-backed 读数时停止，改为记录 gap 并把该项转为独立任务，不得用本地读数替代门禁读数放行 `tenant-core-auth-iam`。

## Rollback Plan

- Trigger Condition: 单租户生成模块或现有向导契约回归失败。
- Rollback Steps:
  1. revert the guardrail commit
  2. restore the prior generator contract only with an explicit “unsupported” warning
  3. rerun generator and single-tenant smoke checks
- Rollback Verification:
  - [ ] Functionality verified
  - [ ] Data integrity verified
  - [ ] No side effects observed

## Verification Plan

### Backend

- `go test ./...`
- focused scaffold contract tests
- 覆盖率对账：`go test -short -coverprofile=coverage.out -covermode=atomic ./...` 后 `go tool cover -func=coverage.out | tail -1`，记录 DSN-less 与 DB-backed 两种口径的数字

### Frontend

- `npm run type-check` from `frontend`
- `npm run lint` from `frontend`
- `node scripts/audit-i18n-locales.mjs` from `frontend` — 五 locale `missing=0 extra=0`

### Browser / Smoke

- generated single-tenant module smoke; no tenant runtime smoke is claimed

## Linkage

- Task ID: `2026-09-10-tenant-ready-guardrails`
- Task Manifest: `.harness/tasks/2026-09-10-tenant-ready-guardrails/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Plan References: `.harness/tasks/TENANT_EVOLUTION_MASTER_PLAN_20260910.md`; `docs/reviews/PANTHEON_BASE_INDEPENDENT_AUDIT_PLAN_20260910.md`
- Evidence Directory: `.harness/evidence/2026-09-10-tenant-ready-guardrails/`
- Review File: `.harness/evidence/2026-09-10-tenant-ready-guardrails/review.md`

## Evidence Required

- generator contract diff and focused tests
- updated acceptance/DDL checklist
- single-tenant regression result
- reviewer summary and explicit runtime gap
- i18n locale audit 输出（五 locale 键数一致）
- 覆盖率对账证据：对账前后的 CI 门禁读数、采用的测量方案、新阈值取值依据

## Human Gates

- none for the guardrail-only change; any schema/auth/IAM expansion is a separate gate
- CI 覆盖率测量方案与新阈值取值需 gate（门禁政策变更）；`2026-09-08-p1-test-coverage-phase1` 的 manifest 状态变更需同一 gate 确认

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Tests or checks updated
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
