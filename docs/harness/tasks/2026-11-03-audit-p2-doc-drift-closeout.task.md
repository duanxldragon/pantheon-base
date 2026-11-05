---
title: 文档漂移收口（DOC-01/02 + GOV-06/07，P2）
doc_type: Remediation
layer: platform
status: Archived
depends_on_layers: []
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/DOCUMENT_FRONTMATTER_SCHEMA.md
updated_at: 2026-11-03
---

# Task Packet: 2026-11-03-audit-p2-doc-drift-closeout

## Goal

收口两组同源文档漂移 P2：①`CONTRIBUTING.md` 工具链版本与命令漂移（DOC-01/GOV-06：写「Go 1.21 or later」实为 go 1.26.10、`--migrate` flag 不存在、`npm test` 实为 `test:unit`）；②两份 PR 生成器指南引用已归档模板 `sonarcloud-s4666`、manifest 必填字段与现行 schema 不一致（DOC-02/GOV-07）。目标是文档与机器可执行事实（go.mod / package.json / live 模板）一致，并把两份 PR 指南合并为一份指向 live 模板。

## Priority

`medium`

## Estimated Complexity

`simple`

## Primary Layer

platform

## Dependency Layers

- `platform`（文档治理、开发环境流程）

## Dependencies

- blockedBy: `none`
- blocks: `none`

## Harness Profile

- Template: `custom`
- Overlay: `pantheon-base`
- Quality Profile: `maintainability`
- Portable Failure Class: `doc-code-drift`
- Owner Layer: `foundation-source`
- Ratchet Decision: `gate-updated`
- Coverage Dimensions:
  - maintainability
  - method-health

交付层级：**L1**（纯文档修复；不改产品代码与 CI 语义）。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`（CONTRIBUTING 若被 ops 复制需同步；PR 指南为 base 内部流程）
- Sync Expectation: deferred
- Release Requirement: none
- Downstream Sync Note: ops 若手抄了 CONTRIBUTING 的旧 Go/Node 版本行或 `--migrate` 命令，需在 ops 仓内同步（本包不改 ops，登记为 downstream note）。

## Contract Anchors

- `docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-11-03.md` §11（DOC-01/02）
- `docs/contracts/DOCUMENT_FRONTMATTER_SCHEMA.md`（frontmatter 字段定义，唯一权威——DOC-02 中 manifest 字段对照此 schema）
- `backend/go.mod`（go 1.26.10）、`SHELL_VERSION.json`（minimumNode 24）、`frontend/package.json`（scripts）

## Scope

### In

- `CONTRIBUTING.md`：Prerequisites 改为从机器源读（Go/Node 版本指向 `go.mod` 与 `SHELL_VERSION.json`，或写明具体版本并附命令出处）；`go run ./cmd/server --migrate` 改为实际存在的 flag（核实迁移入口后改写）；`npm test` 改为 `npm run test:unit`（或 package.json 实际 scripts 名）
- `docs/HARNESS_GOVERNANCE_GUIDE.md` + `docs/harness-pr-generator-guide.md`：二合一为一份指向 live 模板（`sonarcloud-s4666` 已归档则改指实际生效模板），manifest 必填字段对齐 `scripts/task-manifest.mjs` validateTaskManifest 与实际 schema
- 更新 `CONTRIBUTING.en.md` 对应漂移（若存在且同步滞后——按 §8.3 DOC-03 判断为收益低则记录不动，不扩大范围）

### Out

- 修改 `backend/**`、`frontend/src/**`、`scripts/**` 任何行为
- 删除已归档模板文件（`sonarcloud-s4666` 属 `.harness/archive` 历史，只改引用不删归档）
- 触碰 `pantheon-ops`、`VERSION`、`CHANGELOG.md`
- 顺带 "优化" 其他文档（只修本包清单内漂移）

## Structural Scope

### Scope Quantification

- Modules affected: 1（文档治理）
- Files: 约 4（CONTRIBUTING.md、两份 PR 指南合并、evidence）
- API endpoints: 0
- Database migrations: no

### Risk Nodes

1. 改写启动命令时误引入不存在的 flag - Mitigation: 改写前 `go run ./cmd/server --help` 或读 main.go flags 确认；若无法运行则以 main.go grep 为准并标注
2. 合并两份 PR 指南时丢失其中一份独有的操作细节 - Mitigation: 逐段 diff 合并，独有内容并入保留稿，写明「另一份已并入」

### Legacy Fields (for compatibility)

- Affected Subgraph: `CONTRIBUTING.md -> docs/` 入口；两份 PR 指南 -> `scripts/task-manifest.mjs` schema / `.harness` 模板
- Boundary Crossings: `platform 文档 -> 开发环境流程`
- Risk Nodes: `CONTRIBUTING.md` 命令段 | PR 指南 manifest 字段表
- Graph Focus: `none`

## Expected Files

### Create

- `.harness/evidence/2026-11-03-audit-p2-doc-drift-closeout/{commands.json,summary.md,review.md}`

### Modify

- `CONTRIBUTING.md`
- `docs/HARNESS_GOVERNANCE_GUIDE.md`（或选择另一份作为保留稿，另一份改为指针）
- `docs/harness-pr-generator-guide.md`

### Do Not Touch

- `.harness/archive/**`（sonarcloud-s4666 归档模板本身）
- `scripts/task-manifest.mjs`（只对齐引用，不改校验逻辑）
- `backend/**`、`frontend/src/**`
- `pantheon-ops/**`、`CHANGELOG.md`、`VERSION`

## Implementation Notes

- 先 grep `go.mod` / `SHELL_VERSION.json` / `package.json` 取真值，再改 CONTRIBUTING——「先证实事后改文档」是本包唯一纪律。
- `--migrate` flag：审计先照抄入问题，实际需核实 `backend/cmd/server/main.go` 是否有该 flag（上一轮 W3 已把入口命令改为 `go run ./cmd/server`）。若 flag 确实不存在，把命令改为文档实际描述的启动方式并写明来源。
- 两份 PR 指南：选 `HARNESS_GOVERNANCE_GUIDE.md` 为保留稿（名字更通用）还是保留 `harness-pr-generator-guide.md`（更具体），以「读者少跳一次」为准；被并掉的一份改为指向保留稿的短指针（或按 frontmatter 规范处理），不直接删除。
- `sonarcloud-s4666`：先 grep 确认该模板在 `.harness/archive` 还是已删除；若已删除则指南移除引用改指向 live 模板并写明替换关系。
- 收口后跑 `check-doc-links`——任何文档改 URL / 指针不能引入断链。

## Minimum Viable Approach

- Selected Rung: `reuse`（复用现有 frontmatter 规范与 doc-links 门禁，纯文本修复）
- Why This Is Enough: 漂移是「文档与事实不一致」，最小修法就是把文档写回事实
- Upgrade Trigger: `none`

## Success Criteria

- Behaviour Outcome: CONTRIBUTING 的版本/命令/测试名与机器事实一致；PR 指南单一来源指向 live 模板且 manifest 字段与 schema 一致
- Verification Signal: `check-doc-links --strict` 0 finding；`frontmatter-check` 通过；grep 复核 `--migrate`/`npm test`/`1.21` 等旧文本无残留（指针段除外）；`scripts/task-manifest.mjs` 校验字段与指南字段表一致
- Regression Watch: 未引入新断链；文档门禁（frontmatter/encoding/inventory/duplication）全绿
- Economics Watch: `none`

## Context Strategy

- Entry Sources: 审计报告 §11（DOC-01/02）、`CONTRIBUTING.md`、两份 PR 指南
- Retrieval Order: `entry -> summary -> raw`
- Retrieval Helpers: `grep go.mod/SHELL_VERSION.json/package.json` 取版本真值
- Promotion Target: `none`
- Response Budget: `terse`
- Sensitive Context: `none`

## Execution Roles

- Implementer Posture: 先取真值再改；合并时逐段保留独有内容；改后跑 doc-links 确认零断链
- Reviewer Posture: 确认版本/命令/测试名与机器事实逐条对应；确认没有把 PR 指南的独有步骤弄丢；确认未触碰 archive 模板

## Stop Points

- `none`

## Technical Debt

- technicalDebtFlag: `no`
- technicalDebtNote: 纯文档对齐，消除漂移债

## Rollback Plan

**Required for destructive changes.**

- Trigger Condition: `none`（纯文档，无破坏性）
- Rollback Steps:
  1. `git revert <commit-hash>`
- Rollback Verification:
  - [ ] Functionality verified（doc-links 仍在 0 finding）
  - [ ] Data integrity verified
  - [ ] No side effects observed

## State Plan

- Checkpoint Expectation: 真值表完成后一次改完
- Resume Artifacts: `.harness/evidence/2026-11-03-audit-p2-doc-drift-closeout/summary.md`

## Verification Plan

### Backend

- 仅确认 `go build` 不受影响（理论上与文档无关，跑一次门禁基线）

### Frontend

- 不涉及；`grep -n "npm test" CONTRIBUTING.md` 复核（指向 `test:unit` 段应改写或明确）

### Browser / Smoke

- none

### Harness / 文档

- `node scripts/harness/check-doc-links.mjs --root . --strict`（0 finding）
- `npm run check:docs-frontmatter`
- grep 复核：`go 1.21` / `--migrate` / `sonarcloud-s4666` 在目标文档中的处理结果（改写或指针化）

## Linkage

- Task ID: `2026-11-03-audit-p2-doc-drift-closeout`
- Task Manifest: `.harness/tasks/2026-11-03-audit-p2-doc-drift-closeout/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Plan References: `docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-11-03.md` §11（DOC-01/02）
- Evidence Directory: `.harness/evidence/2026-11-03-audit-p2-doc-drift-closeout/`
- Review File: `.harness/evidence/2026-11-03-audit-p2-doc-drift-closeout/review.md`

## Evidence Required

- `commands.json`：doc-links / frontmatter 读数、grep 旧文本复核
- `summary.md`：真值表（go.mod/SHELL_VERSION/package.json → CONTRIBUTING 改写对照）、PR 指南合并前后字段对照
- `review.md`：逐条 reviewer posture；「独有步骤未丢失」的合并 diff 证

## Human Gates

- 无强制 gate（纯文档）；合并两份指南时若涉及读者工作流变化，由非作者 Reviewer 确认保留稿选择合理。

## Completion Checklist

- [ ] Layer and boundary declared
- [ ] Contract anchors read
- [ ] Verification run or exception recorded
- [ ] Evidence saved or summarized
- [ ] Review completed
- [ ] CONTRIBUTING 版本/命令/测试名与机器事实一致
- [ ] PR 指南单一来源，指向 live 模板，manifest 字段与 schema 一致
- [ ] 被并掉的指南保留可追溯（指针/归档），未直接删除
- [ ] doc-links 0 finding、frontmatter 通过
- [ ] 未触碰 archive 模板与产品代码