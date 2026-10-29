---
title: 代码精简程序收口（13 波实测汇总与计划状态纠正）
doc_type: Remediation
layer: platform
depends_on_layers: []
status: Active
linked_contracts:
  - docs/reviews/CODE_SIMPLIFICATION_PLAN.md
  - docs/reviews/REDUNDANT_CODE_CANDIDATES.md
  - docs/harness/AI_QUALITY_GOVERNANCE.md
updated_at: 2026-10-29
---

# Task Packet: 2026-10-29-simplification-program-closeout

## Goal

`2026-10-27-codebase-simplification-program` 的 13 个波次（S1×2、S2×6、S3×3、S4×2）
已在 2026-10-27 至 2026-10-28 全部合并，但程序本身从未收口：

- `docs/reviews/CODE_SIMPLIFICATION_PLAN.md:6` 仍写"**未执行**。本文件只做方案与验收设计"，
  `:302` 仍声明"未修改任何业务源码、未删除任何文件"——与仓库现状相反。
- 程序包的 Completion Checklist 一项未勾；`runtimeGap` 仍写"No wave has started"。
- 程序 manifest 的 `linkage.reviewFile` 指向 `.harness/evidence/2026-10-27-codebase-simplification-program/`，
  该目录自建包起就不存在，`check:task-packet` 因此长期留一条
  `Linked review file does not exist` 警告。

读者（含下游 `pantheon-ops` 与后来的 agent）读计划文档会得到"什么都没做"的结论，
读波次证据会得到"做完了 13 个波次"的结论。本包消除这个矛盾：把计划状态改成已执行、
补程序级实测收口章节、把 13 波的实测 diff 汇总进 evidence，并把程序级仍然缺的一项
（foundation release + ops 构建验证）显式留给维护者。

## Primary Layer

platform

## Dependency Layers

- `platform`（仅 `docs/`、`.harness/`）。不改后端、前端、workflow、接口、路由、
  权限、依赖或任何产品行为。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `none`
- Release Requirement: `none`
- Downstream Sync Note: 波次的代码改动早已随常规 PR 合入；本包只写文档，不需要额外下发行。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `none`
- Portable Failure Class: `doc-status-drift`
- Owner Layer: `consumer-repository`
- Ratchet Decision: `guide-updated`
- Coverage Dimensions:
  - maintainability
  - method-health

交付层级：**L1**（纯文档收口 + 度量复算，验证集合固定）。

## Contract Anchors

- `docs/reviews/CODE_SIMPLIFICATION_PLAN.md`：状态行、结尾声明与本包新增的 §11 执行记录。
- `docs/reviews/REDUNDANT_CODE_CANDIDATES.md`：RC-001…RC-045 编号表，覆盖率的判据来源。
- `docs/harness/AI_QUALITY_GOVERNANCE.md`：本包按 §7 ratchet 规则新增 §5.3。
- `docs/harness/failure-registry.md`：FR-020 的落点。
- `.harness/tasks/2026-10-27-codebase-simplification-program/manifest.json`：程序包状态与清单。

## Scope

### In

- `docs/reviews/CODE_SIMPLIFICATION_PLAN.md`：
  - 第 6 行状态改为"已执行（S1/S2/S3/S4 全部合并）"，指向 §11
  - 第 302 行结尾声明改为指向 §11，不再声称"未修改任何业务源码"
  - 新增 §11「执行记录（2026-10-29 收口）」：13 波实测表、结构指标前后、
    行数窗口、RC 覆盖率、验证读数、仍未关闭的维护者门
- `docs/harness/tasks/2026-10-27-codebase-simplification-program.task.md`：
  勾选可验证的清单项；`pantheon-ops` 构建项保持未勾并写明原因
- `.harness/tasks/2026-10-27-codebase-simplification-program/manifest.json`：
  更新 `runtimeGap` 与 `completionChecklist`，状态保持 `in-progress`
- `.harness/evidence/2026-10-27-codebase-simplification-program/`：
  新建 `commands.json` / `summary.md` / `review.md`，兑现 manifest 里长期悬空的 linkage
- `docs/harness/failure-registry.md`：新增 FR-020（doc-status-drift）
- `docs/harness/AI_QUALITY_GOVERNANCE.md`：新增 §5.3「程序级收口规则」
- `.harness/STATUS.md`：记一条收口读数

### Out

- 不改任何 `backend/**`、`frontend/**` 源码；本包零代码 diff
- 不把程序包状态改成 `completed`：清单里"`pantheon-ops` 能对同步后的 foundation release
  构建通过"依赖维护者切发布，未满足前不能按 completed 关闭
- 不归档程序包（仍在 `in-progress`）
- 不切 foundation release、不动 ops 仓库、不裁 `RC-036/037/038` 的最终去留
- 不改门禁阈值、不新增 checker、不动 `.github/workflows/*`

## Expected Files

### Create

- `docs/harness/tasks/2026-10-29-simplification-program-closeout.task.md`
- `.harness/tasks/2026-10-29-simplification-program-closeout/manifest.json`
- `.harness/evidence/2026-10-29-simplification-program-closeout/commands.json`
- `.harness/evidence/2026-10-29-simplification-program-closeout/summary.md`
- `.harness/evidence/2026-10-29-simplification-program-closeout/review.md`
- `.harness/evidence/2026-10-29-simplification-program-closeout/pr-body.md`
- `.harness/evidence/2026-10-27-codebase-simplification-program/commands.json`
- `.harness/evidence/2026-10-27-codebase-simplification-program/summary.md`
- `.harness/evidence/2026-10-27-codebase-simplification-program/review.md`

### Modify

- `docs/reviews/CODE_SIMPLIFICATION_PLAN.md`
- `docs/harness/tasks/2026-10-27-codebase-simplification-program.task.md`
- `.harness/tasks/2026-10-27-codebase-simplification-program/manifest.json`
- `docs/harness/failure-registry.md`
- `docs/harness/AI_QUALITY_GOVERNANCE.md`
- `.harness/STATUS.md`

### Do Not Touch

- `backend/**`、`frontend/**`
- `.github/workflows/**`、`sonar-project.properties`
- `package.json`、`package-lock.json`
- `pantheon-ops/**`
- 已归档的 13 个波次证据（只读引用，不改写）

## Implementation Notes

- 实测取值优先用波次证据里记录的 `git diff --stat`，不用审计估算；
  本包只复算**当前 HEAD 的整体读数**（行数、四个结构指标 grep、测试包数），
  不重跑每个波次的 diff。
- 行数窗口（`96ef1d66` → HEAD）里同时有租户功能波次（W6/W7/W9）、计划阶梯、
  发布说明目录化和 S3776 修复，所以整体净减少会**低估**精简幅度；§11 必须
  把这一点写清，不能拿它当精简收益。
- 覆盖率按 RC 编号逐条对账：波次 summary 与
  `docs/reviews/GOVERNANCE_SURFACE_DECISIONS_2026-10-27.md` 提到即算覆盖；
  明确"暂不处理"的 13 条单列，不混进已关闭集合。
- 程序包状态保持 `in-progress`；`pantheon-ops` 构建项写明"等 foundation release"，
  避免后来者把它当成遗漏项重复追。

## Verification Plan

- `cd backend && go build ./... && go vet ./...`（0 错误）
- `cd backend && go test -count=1 ./...`（记录 ok / FAIL / no-test-files 三项读数）
- `git ls-files 'backend/**/*.go' | grep -v _test | xargs wc -l | tail -1`
- `git ls-files 'frontend/src/**/*.ts' 'frontend/src/**/*.tsx' | xargs wc -l | tail -1`
- 计划 §0.4 的四条结构指标 grep（`ParseUint(c.Param("id")`、`Offset((page`、
  `func.*tenantOwnerID`、`var errParamInvalid`）
- `npm run check:task-packet`、`check:harness-docs`、`check:structure`、
  `check:harness-encoding`、`check:docs-frontmatter`、`check:harness-inventory`、
  `check:harness-adoption`、`check:harness-visual`、`check:ui-quality-gate`、
  `check:failure-registry`、`check:duplication`
- `node scripts/harness/check-evidence.mjs --root . --strict`、
  `node scripts/harness/check-review.mjs --root . --strict`

## Linkage

- Task ID: `2026-10-29-simplification-program-closeout`
- Task Manifest: `.harness/tasks/2026-10-29-simplification-program-closeout/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Plan References: `docs/reviews/CODE_SIMPLIFICATION_PLAN.md`、`docs/reviews/REDUNDANT_CODE_CANDIDATES.md`
- Evidence Directory: `.harness/evidence/2026-10-29-simplification-program-closeout/`
- Review File: `.harness/evidence/2026-10-29-simplification-program-closeout/review.md`

## Evidence Required

- 四条结构指标的前后读数（计划目标 vs 当前实测）
- 行数窗口读数与"窗口含租户功能波次"的口径说明
- 后端 `go test` 的 ok / FAIL 包数
- 13 波实测 diff 汇总（取自各波证据，不重算）
- RC 覆盖率：32/45 已覆盖、13 条显式未处理，逐条列编号
- 治理门禁读数

## Human Gates

- `pantheon-ops` 对同步后 foundation release 的构建验证：需维护者切发布后执行，
  本包只记录为未关闭项
- `RC-036/037/038` 的最终去留：S4 已给 keep/keep-and-check 决策，若维护者改判，
  需另立波次（本包不改）
- 是否在 S2/S3 之后冻结功能进入维护期：维护者策略决定，本包不表态

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] `CODE_SIMPLIFICATION_PLAN.md` 的状态行与结尾声明不再与仓库矛盾
- [x] 13 波实测已汇总成程序级 summary，且程序 manifest 的 linkage 指向真实文件
- [x] RC 覆盖率与未处理清单逐条列出
- [x] 程序包状态仍为 `in-progress`，未关闭的维护者门已写明
