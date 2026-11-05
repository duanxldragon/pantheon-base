---
title: 治理接线与死脚本收口（GOV-01/02/03 + BE-02，P2）
doc_type: Remediation
layer: platform
status: Archived
depends_on_layers: []
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/harness/HARNESS_ENGINEERING_CONTRACT.md
updated_at: 2026-11-03
---

# Task Packet: 2026-11-03-audit-p2-governance-wiring-closeout

## Goal

收口工程治理层三个同源 P2：①`scripts/` 根下 3 个治理脚本零引用（GOV-02/BE-02，`check-security-patterns.mjs` / `check-ui-tokens.mjs` / `migrate-task-manifests.mjs` 无任何 npm script / workflow / 源码引用）；②接线登记表与实际状态可能矛盾（GOV-01，`failure-registry` FR-016/017 仍写「no workflow / no npm script」与 open status）；③接线只靠人审、无机械检查（GOV-03，FR-026 根因，已复发 4 次）。目标是让「写了但没跑」能被机器发现。

## Priority

`medium`

## Estimated Complexity

`moderate`

## Primary Layer

platform

## Dependency Layers

- `platform`（治理脚本、failure registry、CI 接线）

## Dependencies

- blockedBy: `none`
- blocks: `none`

## Harness Profile

- Template: `custom`
- Overlay: `pantheon-base`
- Quality Profile: `method-health`
- Portable Failure Class: `checker-wiring-gap`
- Owner Layer: `foundation-source`
- Ratchet Decision: `gate-updated`
- Coverage Dimensions:
  - method-health
  - maintainability

交付层级：**L2**（触碰 CI/治理脚本接线，属 gate-policy 邻近面；不改产品代码但会改 CI 门禁行为）。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`（无继承面）
- Sync Expectation: none
- Release Requirement: none
- Downstream Sync Note: 治理脚本接线只影响 base 自身 CI；ops 无对应复制面。

## Contract Anchors

- `docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-11-03.md` §11（GOV-01/02/03、BE-02 登记处）
- `docs/harness/AI_QUALITY_GOVERNANCE.md`（checker 必须接线或显式 mirror-only/workspace-only）
- `scripts/harness/README.md`（wiring 表）
- `docs/harness/failure-registry.md`（FR-016/017/026）

## Scope

### In

- 处置 3 个零引用脚本，逐一生死判定并按结论落地：
  - 接线进 npm/workflow，**或**
  - 移入 `scripts/harness/` 收编，**或**
  - 删除并在 failure-registry 登记退役原因
- 核对 failure-registry FR-016/017 的实际接线状态（对照 `quality.yml` / `package.json` 实测），更新登记表的 Current Gate 与 Status 使登记表与事实一致
- 新增轻量接线自检 checker（枚举 `scripts/harness/check-*.mjs` 的 npm script 与 workflow 引用，未接线且不在例外表即红），接入 `quality.yml`，并补一条自检用例

### Out

- 修改任何产品代码（`backend/**`、`frontend/src/**`）
- 把未接线决策静默化——每个脚本必须落入「接线 / 收编 / 删除+登记」三选一
- 触碰 `pantheon-ops`、`VERSION`、`CHANGELOG.md`

## Structural Scope

### Scope Quantification

- Modules affected: 1（harness 治理层）
- Files: 约 6（含新增 checker 与 evidence）
- API endpoints: 0
- Database migrations: no

### Risk Nodes

1. 新接线自检 checker 若把关太严会在合法例外（mirror-only / workspace-only）上误红 - Mitigation: 例外表显式维护，与 `scripts/harness/README.md` wiring 表同构
2. 误删被隐式引用的脚本（如被 `package.json` 间接调用） - Mitigation: 删前全仓 grep + `git log` 确认无隐式入口

### Legacy Fields (for compatibility)

- Affected Subgraph: `scripts/*.mjs -> package.json check:* / .github/workflows/*.yml`；`failure-registry.md FR-016/017 条目`
- Boundary Crossings: `platform 治理层 -> CI 门禁`
- Risk Nodes: `quality.yml docs-governance job` | `failure-registry.md`
- Graph Focus: `hub-check`

## Expected Files

### Create

- `scripts/harness/check-checker-wiring.mjs`（或等价命名，接入接线自检）
- 配套自检用例（fixture/单测，证明「未接线且不在例外表 → 红」「例外表内 → 绿」）
- `.harness/evidence/2026-11-03-audit-p2-governance-wiring-closeout/{commands.json,summary.md,review.md}`

### Modify

- `.github/workflows/quality.yml` 或 `package.json`（接线新增 checker）
- `docs/harness/failure-registry.md`（FR-016/017 状态校正 + 3 个脚本处置登记）
- `scripts/harness/README.md`（wiring 表同步）
- 3 个零引用脚本本身（落地三选一生死判决）

### Do Not Touch

- `backend/**`、`frontend/src/**`
- `docs/reviews/**`、`docs/history/**`
- `pantheon-ops/**`、`VERSION`、`CHANGELOG.md`

## Implementation Notes

- GOV-01 先实测再改登记表：读 `quality.yml` / `package.json` / `ci.yml` 实际引用，不照搬审计行号；若 FR-016/017 对应 checker 已被接线，登记表 Status/Current Gate 需同步为 implemented；若仍未接线，把接线动作并入本包。
- GOV-03 不是又加一个「人审」checker，而是让机器枚举引用：scan `scripts/harness/check-*.mjs` 文件集 → 是否出现在 `package.json` scripts 或 `.github/workflows/*.yml` → 未接线且在例外表之外即 error。
- 例外表与 `docs/harness/failure-registry.md` 已有记录同构（workspace-only `check-inheritance-contract`、mirror-only `check-doc-frontmatter`），新 checker 读同一份例外来源，不再维护第二份。
- 每个零引用脚本的判决写进 summary（接线 / 收编 / 删除，各给理由），review 时逐条核对。

## Minimum Viable Approach

- Selected Rung: `small local code`（一个新 checker + fixture 自检；复用现有 check-*.mjs 的 exit-code 约定）
- Why This Is Enough: 「接线自检」粒度只需要枚举与集合比对，不需要额外的依赖或服务
- Upgrade Trigger: 若未来需要校验 wiring 表与 checker 头部注释一致，再扩展 parser

## Success Criteria

- Behaviour Outcome: 新增未接线 checker 到 `scripts/harness/` 会让 CI 红；登记表与事实一致；3 个脚本各有归宿
- Verification Signal: 负向测试「放一个不入例外的死脚本 → checker 红」+ 正向绿；`node scripts/harness/check-checker-wiring.mjs --root .` exit 0；`npm run check:docs-frontmatter` / `check:harness-inventory` 全绿
- Regression Watch: 现有 26 个 checker 的接线状态不被误判（对照 `scripts/harness/README.md` wiring 表逐行对表）
- Economics Watch: `none`

## Context Strategy

- Entry Sources: 审计报告 §GOV 段、`scripts/harness/README.md` wiring 表、failure-registry
- Retrieval Order: `entry -> summary -> raw`
- Retrieval Helpers: 全仓 grep（脚本引用枚举）
- Promotion Target: `none`
- Response Budget: `terse`
- Sensitive Context: `none`

## Execution Roles

- Implementer Posture: 逐脚本「先 grep 全仓引用 → 下三选一生死 → 落地」；新 checker 先负向后正向验证
- Reviewer Posture: 三选一必须逐条核对、无静默删除；登记表改动与实际接线一致；没有顺手改别的治理规则

## Stop Points

- 触及「把某个未接线 checker 提升为 blocking CI step」时停下，交维护者 gate-policy 决策（与 W8 上一轮一致）

## Technical Debt

- technicalDebtFlag: `yes`
- technicalDebtNote: GOV-03 本质是「失败根因缺观测者」的第二次复发；本包新增观测器防复发，但 quality.yml 中所有 new-blocking-step 决策仍归维护者，不在此包内替维护者拍板

## Rollback Plan

**Required for destructive changes.**

- Trigger Condition: 新接线自检 checker 在 CI 误红合法例外导致合并阻塞
- Rollback Steps:
  1. `git revert <commit-hash>`（回滚 goose 接线）
  2. 若例外表被误删，用 `git checkout <hash> -- docs/harness/failure-registry.md` 恢复
- Rollback Verification:
  - [ ] Functionality verified
  - [ ] Data integrity verified
  - [ ] No side effects observed

## State Plan

- Checkpoint Expectation: 3 个脚本判决表写入 summary.md 后停一档做 review
- Resume Artifacts: `.harness/evidence/2026-11-03-audit-p2-governance-wiring-closeout/summary.md`

## Verification Plan

### Backend

- 不涉及；`cd backend && go build ./...` 确认无连带（理论上必绿）

### Frontend

- 不涉及

### Browser / Smoke

- none

### Harness / 治理

- `node scripts/harness/check-checker-wiring.mjs --root .`（exit 0）
- 负向：临时放入一个不入例外的死 checker → 必红；移除后复绿
- `node scripts/harness/check-task-packet.mjs --root .`
- `npm run check:docs-frontmatter` / `check:harness-inventory`
- grep 复核 3 个脚本：结论为「删除」的必须 0 残留；「接线」的必须能在 `package.json` 或 workflow 中查到

## Linkage

- Task ID: `2026-11-03-audit-p2-governance-wiring-closeout`
- Task Manifest: `.harness/tasks/2026-11-03-audit-p2-governance-wiring-closeout/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Plan References: `docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-11-03.md` §11（GOV-01/02/03、BE-02）
- Evidence Directory: `.harness/evidence/2026-11-03-audit-p2-governance-wiring-closeout/`
- Review File: `.harness/evidence/2026-11-03-audit-p2-governance-wiring-closeout/review.md`

## Evidence Required

- `commands.json`：负向/正向 checker 读数、grep 引用复核、门禁读数
- `summary.md`：3 个脚本三选一判决表 + FR-016/017 登记表校正前后对照
- `review.md`：逐条 reviewer posture；无静默删除的反向检查

## Human Gates

- 若处置某脚本需要「新增 blocking CI step」，该门禁决策交维护者（本包只交付接线动作与读数，不替维护者把 advisory 提升为 blocking）。
- 删除任何脚本前 reviewer 确认其非隐式引用。

## Completion Checklist

- [ ] Layer and boundary declared
- [ ] Contract anchors read
- [ ] Verification run or exception recorded
- [ ] Evidence saved or summarized
- [ ] Review completed
- [ ] 3 个零引用脚本各有三选一归宿且可复核
- [ ] FR-016/017 登记表与实测一致
- [ ] 新接线自检 checker 负向测试红、正向绿、已接入
- [ ] 未把 advisory→blocking 的决策替维护者拍板
- [ ] 产品代码零改动