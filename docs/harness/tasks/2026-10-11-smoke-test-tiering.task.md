---
title: Pantheon Base 冒烟测试分层与业务模块拆分任务包
doc_type: Remediation
layer: platform
depends_on_layers:
  - system/iam
  - system/config
  - system/audit
  - system/org
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/DOCUMENT_GOVERNANCE_CONTRACT.md
updated_at: 2026-10-11
---

# Task Packet: 2026-10-11-smoke-test-tiering

## Goal

让「改哪里就跑哪里」：把 3709 行、81 个用例的 `system-pages.spec.ts` 单体按业务模块拆成独立 spec，
建立 L0/L1/L2/L3 分层，并让 PR 门禁按**改动路径**选择模块套件，从而不再每次修改都跑全量浏览器回归。
断言、路由、权限码与夹具一律不变。

## Primary Layer

platform

本任务包只改测试结构、脚本入口与门禁选择逻辑；实现归属为仓库治理与 `platform` 层测试基础设施，
不在 `system/*` 或 `business/*` 内实施任何业务修复。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `not-required`
- Release Requirement: `none`

## Dependency Layers

- `platform`：smoke 目录结构、npm 脚本入口、Playwright 配置与 `tests/smoke/README.md`。
- 仓库治理：`.github/workflows/quality.yml` 的 change-scope 与 Quality Gates 聚合逻辑。
- `system/{iam,config,i18n,audit,org}`：仅作为 spec 拆分的命名基准，不修改其源码。

## Harness Profile

- Template: admin-platform
- Overlay: pantheon-base
- Quality Profile: ci-workflow
- Portable Failure Class: `ci-signal-noise`
- Owner Layer: consumer-repository
- Ratchet Decision: gate-updated（把「按路径选层」变成可执行门禁，而不是只写文档）
- Coverage Dimensions:
  - behaviour
  - maintainability
  - architecture-fitness
  - method-health

## Contract Anchors

- `AGENTS.md`、`DESIGN.md`、`docs/README.md`
- `docs/contracts/PLATFORM_CONTRACT.md`、`docs/contracts/DOCUMENT_GOVERNANCE_CONTRACT.md`
- `frontend/tests/smoke/README.md`（smoke 布局、脚本规则与覆盖矩阵）
- `frontend/tests/smoke-core/README.md`（smoke-core 维持 report-only 的既有约定）
- `docs/harness/AI_QUALITY_GOVERNANCE.md`

## Scope

### In

- `frontend/tests/smoke/system/system-pages.spec.ts` 拆分为 `system-{routes,iam,config,i18n,audit,org,platform}.spec.ts`，共享脚手架上提到 `system-pages-helpers.ts`。
- `frontend/package.json`：新增按模块的 `test:smoke:system:*` 与 `test:smoke:l0/l1/l2`、`test:smoke:module:*` 入口。
- `frontend/tests/smoke/README.md`：脚本入口表、覆盖矩阵与分层说明。
- `frontend/config/system-page-admission.json`：`requiredSmokeAssertions` 指向新的 spec 文件。
- `scripts/resolve-smoke-modules.mjs` + `tests/scripts/resolve-smoke-modules.test.mjs`：路径到模块的解析与其单测。
- `.github/workflows/quality.yml`：change-scope 输出模块列表；`smoke-sanity` 收敛为 L1；新增阻塞的 `pr-smoke-modules`。
- `.github/pull_request_template.md`：验证记录对齐分层入口。

### Out

- 任何断言、期望值、路由字符串、权限码、夹具值或清理步骤的改动。
- 任何生产代码改动（`frontend/src/**`、`backend/**` 均不动）。
- 把 `smoke-core` 转为阻塞：按其 README 必须连续多轮全绿后另行走治理流程。
- 拆分 `platform/system-secondary-route-*.spec.ts` 与 `backoffice-ui-visual.spec.ts`。
- 把 `tests/` 纳入 CI 静态检查：会暴露 69 条既有类型错误，属独立整改。

## Expected Files

### Create

- `frontend/tests/smoke/system/system-pages-helpers.ts`
- `frontend/tests/smoke/system/system-{routes,iam,config,i18n,audit,org,platform}.spec.ts`
- `scripts/resolve-smoke-modules.mjs`、`tests/scripts/resolve-smoke-modules.test.mjs`
- `.harness/tasks/2026-10-11-smoke-test-tiering/manifest.json`
- `.harness/evidence/2026-10-11-smoke-test-tiering/{commands.json,summary.md,review.md}`

### Modify

- `frontend/package.json`、`frontend/tests/smoke/README.md`、`frontend/config/system-page-admission.json`
- `.github/workflows/quality.yml`、`.github/pull_request_template.md`

### Do Not Touch

- `frontend/src/**`、`backend/**` 的任何源文件。
- `.github/workflows/smoke-core.yml` 的 report-only 约定。
- 已归档的 `.harness/archive/**` 与 `.harness/evidence/2026-10-11-sonar-duplication-under-3/**` 历史记录。

## Implementation Notes

- 拆分必须可证伪：以「原文件测试块多重集逐字节相等」+「helper 区间逐行保留」+「前后类型错误多重集一致」三重证据交付，而不是以「跑过了」代替。
- 模块选择必须 fail-safe：任何不能明确归属单一模块的路径（共享 `frontend/src/core/**`、路由、i18n 资源、workflow、未知路径）一律升级为全模块。
- `smoke-core` 不进 L1；L1 = `platform:contracts` + `system:routes`。
- 新增 job 的 `skipped` 必须被聚合器视为可接受，避免 docs-only / governance-only PR 被「没跑过」的 job 阻塞。

## Structural Scope

- Affected Subgraph: `changed paths -> resolve-smoke-modules -> change-scope.smoke_modules -> pr-smoke-modules -> npm run test:smoke:module:*`
- Boundary Crossings: `platform (smoke 基础设施) -> repository governance (workflow 门禁)`；不跨越任何业务域边界。
- Risk Nodes: 模块选择过窄会静默缩小 PR 覆盖；`check:system-page-admission` 的目标文件改错会让门禁空转通过。
- Graph Focus: PR 门禁的覆盖率与反馈时延之间的取舍。

## Execution Roles

- Implementer Posture: 单次机械搬运 + 门禁接线，不夹带任何行为改动；每个新 spec 只 import 自己用到的符号。
- Reviewer Posture: 复核等价性数字而非叙述；独立确认升级默认与 `check:system-page-admission` 的新目标文件确实含有所需 token。
- 实现前先读 `frontend/tests/smoke/README.md` 与 `frontend/scripts/check-smoke-coverage-contract.mjs`，确认拆分后仍需满足的入口契约。

## Dependency Plan

| Wave | 优先级 | 工作项 | 依赖 | 关闭条件 |
| --- | --- | --- | --- | --- |
| 0 | P2 | 拆分 `system-pages.spec.ts` + 共享脚手架上提 | 无 | 59/59 测试块逐字节相等、845/845 helper 行保留、前后类型错误多重集一致 |
| 1 | P2 | 模块脚本 + L0/L1/L2 分层 + README/覆盖矩阵 | Wave 0 | `check:smoke-coverage-contract` 与 `check:system-page-admission` 通过 |
| 2 | P2 | 路径解析器 + change-scope 输出 + `pr-smoke-modules` job | Wave 1 | 解析器单测 13/13；workflow YAML 可解析且 job 图正确 |
| 3 | P2 | 本地门禁全跑 + PR + CI 实跑确认 | Wave 2 | Quality Gates 全绿，且模块 job 对模块级 PR 实跑、对共享改动跑 `module:all` |

## Verification Plan

- Static: `npm run type-check`、`npm run lint`、`npm run prebuild`（13 个契约门禁）、`npm run test:smoke:l0`。
- Structural proof: `.tmp/verify-split.mjs`（测试块 / helper / import 三重等价性）。
- Type proof: 临时 tsconfig 对 `tests/` 做前后错误集对比（该目录当前不在 `tsconfig.app.json` 与 CI eslint 范围内）。
- Resolver: `node --test tests/scripts/resolve-smoke-modules.test.mjs`。
- Repo gates: `node scripts/check-duplication.mjs`、`scripts/harness/*.mjs --strict`。
- Browser: 本机无法执行（Node 无法派生子进程，`spawnSync` 报 `EBUSY`）；由 CI 的 Quality Gates 实跑 L1 与命中模块套件，需记录实际执行的套件名。

## Evidence Required

- `.harness/evidence/2026-10-11-smoke-test-tiering/commands.json`：每条命令的执行目录、状态与真实输出摘要，含失败项与环境缺口。
- `summary.md`：拆分映射表、分层定义、等价性数字与残余风险。
- `review.md`：结论、复核要点与复核姿态，含「本机不能跑 Playwright」的显式声明。
- 静态推断与运行复现分别标记；本机未执行的项目不得写成已通过。

## Human Gates

- 改变 PR 必过门禁的覆盖范围属治理决定：若维护者希望共享改动也跑全量 L2，需显式调整 `resolve-smoke-modules.mjs` 的升级策略。
- 是否把 `tests/` 纳入 CI 静态检查、是否把 `smoke-core` 转阻塞，均留在维护者触点，不在本任务包内自行决定。

## Linkage

- Task ID: `2026-10-11-smoke-test-tiering`
- Task Manifest: `.harness/tasks/2026-10-11-smoke-test-tiering/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Evidence Directory: `.harness/evidence/2026-10-11-smoke-test-tiering/`
- Review File: `.harness/evidence/2026-10-11-smoke-test-tiering/review.md`
- Plan References: `frontend/tests/smoke/README.md`、`frontend/tests/smoke-core/README.md`、`.github/workflows/quality.yml`
- Assessment: `docs/harness/tasks/2026-10-11-smoke-test-tiering.task.md`

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] 59/59 测试块逐字节相等、845/845 helper 行保留、前后类型错误多重集一致
- [x] 13 个 prebuild 契约门禁、type-check、lint、L0、duplication、harness 门禁全部通过
- [x] 解析器单测 13/13；升级默认（共享/未知路径 → 全模块）有断言覆盖
- [x] `pr-smoke-modules` 已接入 Quality Gates 聚合器，`skipped` 不被误判为失败
- [ ] CI 实跑确认：模块级 PR 只跑命中模块，共享改动跑 `module:all`
