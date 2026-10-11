---
title: Pantheon Base 冒烟辅助文件 SonarCloud 残留异味清理任务包
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

# Task Packet: 2026-10-11-sonar-smoke-helper-smells

## Goal

清掉 PR #373 文件拆分浮出的 17 个 SonarCloud code smell（全部位于
`frontend/tests/smoke/system/system-pages-helpers.ts`），让主干 Release Gate 恢复绿。
修复必须逐条保持行为不变：结构性异味做可证明等价的机械修复；顺序 await 属测试夹具刻意语义，
用带理由的 `// NOSONAR` 压制。

## Primary Layer

platform

本任务包只改一个非 spec 的测试脚手架文件与配套任务包文档；实现归属仓库治理与 platform 层测试
基础设施，不触碰任何业务源码。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `not-required`
- Release Requirement: `none`

## Dependency Layers

- `platform`：`frontend/tests/smoke/system/system-pages-helpers.ts`（唯一实现改动点）。
- 仓库治理：`.github/workflows/release-gate.yml` 的 unprocessed-issues 检查（触发本轮修复的门禁）。
- `system/{iam,config,org}`：删除类 helper 的服务对象，仅语义参照，不改其源码。

## Harness Profile

- Template: admin-platform
- Overlay: pantheon-base
- Quality Profile: ci-workflow
- Portable Failure Class: `ci-signal-noise`
- Owner Layer: consumer-repository
- Ratchet Decision: gate-restored（主干门禁被拆分浮出的存量异味打红，本任务恢复而非放松门禁）
- Coverage Dimensions:
  - maintainability
  - method-health

## Contract Anchors

- `AGENTS.md`、`DESIGN.md`、`docs/README.md`
- `docs/contracts/PLATFORM_CONTRACT.md`、`docs/contracts/DOCUMENT_GOVERNANCE_CONTRACT.md`
- `.github/workflows/release-gate.yml`（unprocessed SonarCloud issues 阻塞逻辑）
- `.sonarcloud.properties`（tests 保持全量分析的既定范围；自动分析不支持规则级忽略）
- `frontend/tests/smoke/README.md`（smoke 布局与脚本入口契约）

## Scope

### In

- `frontend/tests/smoke/system/system-pages-helpers.ts`：
  - 4x S7763 → `export { ... } from` 纯 re-export（改前 grep 证明 4 个符号无文件内使用）。
  - 1x S7503 → 去掉无 await 的 `async` 关键字（返回值仍是同一个 Promise）。
  - 1x S4043 → `targets.reverse()` 就地提前为独立语句（先子后父删除顺序不变）。
  - 11x S9382 → 逐处 `// NOSONAR` 并写明顺序语义为刻意设计。
- `.harness/tasks/2026-10-11-sonar-smoke-helper-smells/` 与 `.harness/evidence/2026-10-11-sonar-smoke-helper-smells/`。

### Out

- 任何删除顺序、header 获取节奏、断言顺序、夹具值的改动。
- 用 `Promise.all` 并行化 await-in-loop：会让 CI 已验证的夹具语义改变（如父子部门并发删除
  可能竞态后吞错），且本机无法执行 Playwright 复验。
- 把 `tests/**` 加入 `.sonarcloud.properties` 排除：tests 保持全量分析是既定决策。
- 修改 `release-gate.yml`：门禁本身是正确的，本任务是消除告警而非放松门禁。

## Expected Files

### Create

- `.harness/tasks/2026-10-11-sonar-smoke-helper-smells/manifest.json`
- `.harness/evidence/2026-10-11-sonar-smoke-helper-smells/{commands.json,summary.md,review.md}`
- `docs/harness/tasks/2026-10-11-sonar-smoke-helper-smells.task.md`

### Modify

- `frontend/tests/smoke/system/system-pages-helpers.ts`

### Do Not Touch

- `.github/workflows/**`、`.sonarcloud.properties`。
- 任何 spec 文件、`frontend/src/**`、`backend/**`。
- 已归档的 `.harness/archive/**` 与历史 evidence 目录。

## Implementation Notes

- 根因先行：SonarCloud 自动分析只对「首次分析的代码」报问题；旧文件
  `system-pages.spec.ts` 全历史 0 issue（已用 component 级 API 验证），拆分让 845 行存量代码
  重新被判为 new code，一次性浮出 17 条。修复对象是存量异味，不是拆分引入的回归。
- S7763 的等价性前提是「纯 re-export」，必须先 grep 证明符号无文件内使用再改。
- S4043 保持 `reverse()` 就地语义，只提前语句位置；不用 `toReversed()`/展开副本等无谓改写。
- NOSONAR 是仓库既有惯例（`backend/pkg/testmysql/mysql.go`、`i18n_service_fast_test.go`），
  每处必须带可复核的理由。

## Structural Scope

- Affected Subgraph: `system-pages-helpers.ts -> SonarCloud main analysis -> release-gate unprocessed-issues check`
- Boundary Crossings: 无；改动只落在 platform 层测试脚手架。
- Risk Nodes: NOSONAR 滥用会掩盖真问题——本包内 11 处全部逐条写理由，且仅覆盖 S9382 一条规则。
- Graph Focus: 门禁恢复速度与夹具行为保全之间的取舍。

## Execution Roles

- Implementer Posture: 逐条异味逐条修，不改任何夹具行为；每处修复的等价性论据写进 evidence。
- Reviewer Posture: 复核 4 个 re-export 符号确无使用、`waitForOkApiResponse` 返回值不变、
  `reverse()` 顺序不变、11 处 NOSONAR 理由是否成立。
- 实现前先读 `.github/workflows/release-gate.yml` 与 SonarCloud issues API 的实际输出。

## Dependency Plan

| Wave | 优先级 | 工作项 | 依赖 | 关闭条件 |
| --- | --- | --- | --- | --- |
| 0 | P1 | 定位 17 条 issue 与根因（API 查询、旧文件历史比对） | 无 | 全部 17 条定位到文件行，根因（new-code 重分类）有证据 |
| 1 | P1 | 6 处结构修复 + 11 处 NOSONAR + eslint/契约门禁 | Wave 0 | eslint 零警告；coverage contract 34 specs / 20 entries 通过 |
| 2 | P1 | 任务包 + PR + CI 实跑 | Wave 1 | 主干 SonarCloud 重分析 `resolved=false` 总数为 0，Release Gate 恢复绿 |

## Verification Plan

- Static: `npx eslint tests/smoke/system/system-pages-helpers.ts --max-warnings 0`。
- Contract: `node frontend/scripts/check-smoke-coverage-contract.mjs`（34 specs / 20 entries 不变）。
- Repo gates: `node scripts/check-pr-governance.mjs`、`node scripts/check-duplication.mjs`、`scripts/harness/*.mjs`。
- Sonar evidence: issues API 查询「改前 17 条 / 改后 0 条」的总量对比，附旧文件全历史 0 issue 的根因证据。
- Browser: 本机无法执行 Playwright（`spawnSync` 报 `EBUSY`）；由 CI 的 Quality Gates（L1 + 命中模块套件）
  实跑改动后的 helper，并由主干 SonarCloud 重分析给出最终判定。

## Evidence Required

- `.harness/evidence/2026-10-11-sonar-smoke-helper-smells/commands.json`：每条命令的执行目录、状态与真实输出摘要。
- `summary.md`：根因、修复映射表（规则 → 数量 → 修法）与残余风险。
- `review.md`：结论与复核要点，含「本机不能跑 Playwright」的显式声明。
- 静态推断与运行复现分别标记；本机未执行的项目不得写成已通过。

## Human Gates

- 若维护者更倾向于并行化删除循环而非 NOSONAR，需接受夹具语义变化并在有 Playwright 环境的机器上复验，
  该决定留在维护者触点。
- 是否长期把 tests 从 SonarCloud 分析中排除属治理决定，本包不做。

## Linkage

- Task ID: `2026-10-11-sonar-smoke-helper-smells`
- Task Manifest: `.harness/tasks/2026-10-11-sonar-smoke-helper-smells/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Evidence Directory: `.harness/evidence/2026-10-11-sonar-smoke-helper-smells/`
- Review File: `.harness/evidence/2026-10-11-sonar-smoke-helper-smells/review.md`
- Plan References: `.github/workflows/release-gate.yml`、`.sonarcloud.properties`
- Assessment: `docs/harness/tasks/2026-10-11-sonar-smoke-helper-smells.task.md`

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] 4 处 S7763 改为 `export ... from`，改前 grep 证明符号无文件内使用
- [x] S7503 去掉无 await 的 `async`，返回值仍是同一个 Promise
- [x] S4043 的 `reverse()` 就地提前为独立语句，先子后父顺序不变
- [x] 11 处 S9382 逐处带理由的 `// NOSONAR`
- [x] eslint、冒烟覆盖契约、PR governance、duplication、harness 门禁本地全绿
- [ ] CI 实跑确认：主干 SonarCloud 重分析 `resolved=false` 总数为 0，Release Gate 恢复绿
