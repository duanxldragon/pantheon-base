---
title: base 主干落地未合并的租户整改与代码简化分析工件
doc_type: Remediation
layer: platform
depends_on_layers:
  - system/iam
status: Active
linked_contracts:
  - docs/designs/REPOSITORY_LAYOUT.md
  - docs/README.md
updated_at: 2026-10-27
---

# Task Packet: 2026-10-27-base-docs-artifact-landing

## Goal

把 2026-10-27 审查轮产出、此前只存在于本地分支
`chore/harness-task-packets-2026-10-27`（提交 `806e053e`，30 个文件、5244 行新增，从未开过 PR）
的治理与分析工件落进 `pantheon-base` 主干，使 base 的本地分支集合收敛到只剩 `main`。

工件分两类：

- 4 份审查交付：`docs/reviews/TENANT_FUNCTIONAL_COMPLETENESS_REVIEW_2026-10-27.md`、
  `CODEBASE_SIMPLIFICATION_AUDIT.md`、`CODE_SIMPLIFICATION_PLAN.md`、
  `REDUNDANT_CODE_CANDIDATES.md`。
- 23 个 L2 task manifest + 2 份 task packet + 1 份租户冒烟基线，覆盖租户完整性整改与
  S1–S4 简化规划的立项记录。

## Primary Layer

platform

本轮不改动任何产品代码，只把记录平台级审查结论与规划的文档纳入主干；内容涉及
`system/iam`（租户、成员、权限）与 `system/config`，但载体是文档，归属仍是平台治理层。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `not-required`
- Release Requirement: `none`
- Downstream Sync Note: ops 侧不需要为此发版。`docs/harness/tasks` 是 ops 的
  `baseExcludedPaths`，`.harness` 与 `.github` 是 ops 的 `replaceRoots` 且登记在
  `repositoryOverlayPaths`，因此本轮新增的 base 文档不会进入 ops 的重建树。
  唯一的例外是 `docs/reviews/*`：ops 会在下一次 `rebuild:from-base` 时把这 4 份审查文档带进自己的树，
  这是期望行为（它们描述的就是 base 的产品）。
- 本机限制：本轮为纯文档，未运行 `go test` 与前端构建；读数只来自 base 的文档与治理检查脚本。

## Dependency Layers

- `docs/reviews/`：新增 4 份审查与简化规划文档。
- `.harness/tasks/`：新增 23 个 manifest（规划立项，status 记录为 planned/blocked 等非 complete）。
- `.harness/evidence/2026-10-27-tenant-completeness-remediation/`：新增 1 份租户冒烟基线记录。
- `docs/harness/tasks/`：新增 2 份 task packet。
- `.harness/STATUS.md`：追加本轮状态条目。

## Harness Profile

- Level: L2（触碰治理工件与主干文档集合）
- Template: admin-platform
- Overlay: pantheon-base
- Review Mode: agent-authored, evidence-linked
- Evidence Mode: commands + summary + review
- Coverage Dimensions:
  - maintainability
  - method-health
- Human Gate: 无（文档落地，不改行为、不发版）

## Contract Anchors

- `docs/designs/REPOSITORY_LAYOUT.md`：文档目录归属。
- `scripts/harness/check-task-packet.mjs`：task packet 必备分节。
- `scripts/harness/check-review.mjs`：`## Machine Readable` JSON 契约。
- `scripts/frontmatter-check.mjs`：`docs/**` 前置元数据。
- `scripts/harness/check-doc-links.mjs` 与 `check-doc-inventory.mjs`：链接与清单一致性。

## Scope

### In

- cherry-pick `806e053e` 到新的 `docs/harness-task-packets-2026-10-27` 分支。
- 为本轮补齐 task packet、manifest、commands.json、summary、review 五件治理工件。
- 跑通 base 的文档与治理检查集合，开 PR 并合并。
- 删除已确认与 `main` 树完全一致的本地分支 `fix/lint-and-codeql-suppressions-2026-10-27`，
  以及在 PR 合并后删除源分支 `chore/harness-task-packets-2026-10-27`。

### Out

- 不执行文档里规划的简化整改（S1–S4 与租户整改的后续实现）。
- 不改动任何 Go / TS / 配置文件。
- 不切 foundation release，不触碰 `VERSION` 或 `CHANGELOG.md`。
- 不把 `pantheon-ops` 的治理工件搬进 base。

## Expected Files

### Create

- `docs/harness/tasks/2026-10-27-base-docs-artifact-landing.task.md`
- `.harness/tasks/2026-10-27-base-docs-artifact-landing/manifest.json`
- `.harness/evidence/2026-10-27-base-docs-artifact-landing/commands.json`
- `.harness/evidence/2026-10-27-base-docs-artifact-landing/summary.md`
- `.harness/evidence/2026-10-27-base-docs-artifact-landing/review.md`
- cherry-pick 带来的 30 个文档与治理文件

### Modify

- `.harness/STATUS.md`（cherry-pick 自带）

### Do Not Touch

- `backend/**`、`frontend/src/**`、`frontend/tests/**`：本轮零代码改动。
- `VERSION`、`CHANGELOG.md`、`docs/RELEASE_PROCESS.md`：不发版。
- `foundation-release` 资产与 `config/**` 锁文件。

## Implementation Notes

- 用 `git cherry-pick -x 806e053e` 而非 merge，保留原提交来源说明且不引入分叉 merge commit。
  cherry-pick 无冲突，因为 `main` 自 `2091a2d8` 起未再触碰这些路径。
- 落地前确认这两类工件确实是「未进主干的真实工作」：
  `git diff --name-only main chore/harness-task-packets-2026-10-27` 得到 30 个纯新增文件，
  `gh pr list --state all` 中不存在以该分支为 head 的 PR。
- 与之相对，`fix/lint-and-codeql-suppressions-2026-10-27` 与 `main` 的树完全一致
  （`git diff --quiet main fix/...` 通过，输出 `TREES IDENTICAL`），内容已被 PR #430 squash 进主干，
  删除不丢任何文件。
- task manifest 的 status 沿用原分支上的取值，本轮不重写历史规划内容；只补本轮自身的工件。

## Verification Plan

- `node scripts/frontmatter-check.mjs` → 全部 `docs/**` 通过。
- `node scripts/harness/check-task-packet.mjs --root .` → 新增 packet 满足必备分节。
- `node scripts/harness/check-evidence.mjs --root . --strict` → 本轮 commands.json 为对象根并通过。
- `node scripts/harness/check-review.mjs --root . --strict` → 本轮 review.md 的 Machine Readable 契约通过。
- `node scripts/harness/check-adoption.mjs --root . --strict`、`check-doc-links.mjs`、
  `check-doc-inventory.mjs`、`check-sync-drift.mjs`、`check-method-health.mjs`、
  `check-template-health.mjs`、`check-generated.mjs`、`check-structure-contract.mjs`、
  `check-encoding.mjs` → 0 finding。
- `node scripts/check-duplication.mjs` → PASS。
- `node scripts/check-pr-governance.mjs --event <generated event>` → PR body 字段齐全。
- CI：`Docs Governance`、`Quality Gates`、`Security Gates` 与 CodeQL 在 PR 上归绿。

## Linkage

- Task ID: `2026-10-27-base-docs-artifact-landing`
- Task Manifest: `.harness/tasks/2026-10-27-base-docs-artifact-landing/manifest.json`
- Evidence Directory: `.harness/evidence/2026-10-27-base-docs-artifact-landing/`
- Review File: `.harness/evidence/2026-10-27-base-docs-artifact-landing/review.md`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References:
  - `docs/harness/tasks/2026-10-27-tenant-completeness-remediation.task.md`
  - `docs/harness/tasks/2026-10-27-codebase-simplification-program.task.md`
  - `docs/harness/tasks/2026-10-27-v0177-lint-codeql-closure.task.md`
- Source: 本地分支 `chore/harness-task-packets-2026-10-27` @ `806e053e`

## Evidence Required

- 上述每条检查的命令、退出码与最后一行读数。
- `git diff --stat main docs/harness-task-packets-2026-10-27` 的文件清单（证明只有新增）。
- 删除分支前的树等同性证明。

## Human Gates

- 无需维护者中途确认：本轮不触碰行为、凭据、发布与共享分支状态之外的东西。
- 分支删除属于破坏性动作，只在「内容与 `main` 逐字节一致」或「内容已进主干」被证明后执行。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] 改动落在正确的仓库与层级，未引入代码或版本变更
- [x] 分支删除前逐一证明其内容已在 `main`
