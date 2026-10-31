---
title: 归档两个已完成任务包（菜单 SQL 字面量收敛、v0.18.0 简化程序发布）并更新档案索引
doc_type: Remediation
layer: platform
depends_on_layers: []
status: Archived
linked_contracts:
  - docs/harness/VERIFICATION_EVIDENCE_SPEC.md
  - docs/designs/REPOSITORY_LAYOUT.md
updated_at: 2026-10-31
---

# Task Packet: 2026-10-31-harness-archive-closeout-round2

## Goal

`2026-10-31-base-menu-filter-sql-literal-convergence` 已经由 PR #477 squash 进底座 `main`
（`e17eaaa1`），`2026-10-29-v0180-simplification-release` 的最后一项遗留（消费仓
`runtime-acceptance`）也已经由 `pantheon-ops` PR #164（`4e69224f`）关闭、并在 #165
（ops main `9afabc2a`）复核落地。两个任务的实质工作都结束，但 `.harness/tasks/` 里仍留着
它们的 `in-progress` manifest，与 `.harness/ARCHIVE.md` 的月度归档约定不一致——维护者此前
已明确要求「把 `.harness` 下已完成的任务做归档处理」。本包只做档案收口：两份 manifest 的
`status` 改为 `completed`，对应任务包 frontmatter 改为 `status: Archived`，
`.harness/tasks/<id>` 与 `.harness/evidence/<id>` 以 `git mv` 落到
`archive/2026-10/{tasks,evidence}/<id>/`，并把 `.harness/ARCHIVE.md` 的月度统计、
「当前活跃任务」清单与本轮收口记录写清。零运行时代码、零门禁阈值变化、零 schema 变化、
零 `.foundation/**` 变化。

## Primary Layer

platform

## Dependency Layers

- `platform`（任务档案面与治理文档面）。不触碰 `system/*`、`business/*`、`backend/**`、
  `frontend/src/**`，不改变任何门禁判定语义、阈值或 CI 作业。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `deferred`
- Release Requirement: `none`
- Cross Repository Facts: `pantheon-ops` 的 #161/#164/#165 与 ops main `9afabc2a`
  （只读引用，不在本包改动）。这些读数只用于证明被归档任务的完成条件成立；本包不引入任何
  被消费者吸收的内容，ops 侧的 ledger 已在自己的仓内闭环，也不切 foundation release。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `ci-workflow`
- Portable Failure Class: `harness-governance`
- Ratchet Decision: `registry-only`
- Coverage Dimensions:
  - method-health
  - architecture-fitness
- 说明：本轮不新增传感器、不改治理指南，只把已成立的完成事实写进档案并让索引与磁盘一致。
  `Quality Profile` 取 `ci-workflow` 是因为判定证据全部来自治理/CI 侧的 strict 传感器
  （`check:task-packet`、`check-evidence`、`check-review`、`check:structure`、`check:encoding`、
  `check:harness-inventory`）而不是任何运行面——沿用同一形态的纯文档收口轮次既有口径。
  新发现的工具边缘（见 Implementation Notes 第 5 条）在本包如实登记，是否修治理脚本归维护者。

## Contract Anchors

- `docs/harness/VERIFICATION_EVIDENCE_SPEC.md`：收口用读数表达——本包的完成判据是
  tag/资产计数、drift 比对读数、ops main 落地提交，以及归档后各检查器仍 PASS。
- `.harness/ARCHIVE.md`：月度归档目录约定（`archive/<YYYY-MM>/{tasks,evidence}/<task-id>/`）、
  「任务包正文留在 `docs/harness/tasks/` 并标 `status: Archived`」、以及
  `readTaskManifest` / `resolveArchiveAwarePath` 的规范路径回退规则。
- `docs/designs/REPOSITORY_LAYOUT.md`：`.harness/` 与 `docs/harness/` 的职责边界。

## Scope

### In

- `2026-10-31-base-menu-filter-sql-literal-convergence`：manifest `status` → `completed`；
  `.task.md` frontmatter `status` → `Archived`；manifest 与 evidence 目录 `git mv` 到
  `archive/2026-10/{tasks,evidence}/`。
- `2026-10-29-v0180-simplification-release`：同上三条。
- `.harness/ARCHIVE.md`：月度统计行（2026-10 由 89/92 → 91/94）、合计行（210/216 → 212/218）、
  「当前活跃任务」清单、以及本轮收口记录（含两条收口依据读数）。
- 本包自己的任务包 + manifest + evidence（`2026-10-31-harness-archive-closeout-round2`）。

### Out

- 任何产品代码、workflow、门禁阈值、必需检查集合（PR #478 的范围，不在此重复）。
- `docs/harness/failure-registry.md`：本轮不新增 FR 条目；发现的检查器边缘以正文登记，
  是否入册归维护者。
- `.harness/evidence/2026-09-10-tenant-verification-and-gray/`（归档后被 #427 重写进旧路径的
  重复产物）与两份无任务归属的散落 PR 正文——沿用上一轮的显式延期，不扩面。
- 67 个历史 `status: Active` 的旧格式任务包正文：它们没有 manifest，属另一类批量迁移决策。
- `.foundation/**`、`VERSION`、`CHANGELOG.md`、`docs/release-notes/**`、`pantheon-ops` 任何文件。

## Expected Files

### Create

- `docs/harness/tasks/2026-10-31-harness-archive-closeout-round2.task.md`
- `.harness/tasks/2026-10-31-harness-archive-closeout-round2/manifest.json`
- `.harness/evidence/2026-10-31-harness-archive-closeout-round2/{commands.json,summary.md,review.md,pr-body.md}`

### Modify

- `.harness/ARCHIVE.md`
- `docs/harness/tasks/2026-10-31-base-menu-filter-sql-literal-convergence.task.md`（仅 frontmatter）
- `docs/harness/tasks/2026-10-29-v0180-simplification-release.task.md`（仅 frontmatter）
- `.harness/tasks/2026-10-31-base-menu-filter-sql-literal-convergence/manifest.json` →
  `archive/2026-10/tasks/…`（`status` 一处变化）
- `.harness/tasks/2026-10-29-v0180-simplification-release/manifest.json` → `archive/2026-10/tasks/…`
- `.harness/evidence/2026-10-31-base-menu-filter-sql-literal-convergence/**` →
  `archive/2026-10/evidence/…`
- `.harness/evidence/2026-10-29-v0180-simplification-release/**` → `archive/2026-10/evidence/…`

### Do Not Touch

- `backend/**`、`frontend/**`、`pkg/**`、`.github/workflows/**`、`scripts/**`
- `.foundation/**`、`VERSION`、`CHANGELOG.md`、`docs/release-notes/**`
- 归档产物内部的 `linkage` 字段（`taskManifest` / `evidenceDir` / `reviewFile`）：
  归档约定明确要求继续用规范路径引用，靠回退分支解析，不在移动后改写。

## Implementation Notes

1. 收口判据全部取自主机读数而非叙述：底座两个 tag `pantheon-base-v0.18.0` 与
   `pantheon-base-v0.18.1` 均存在且各自带 4 个 release 资产、`VERSION` = `0.18.1`；
   菜单 SQL 收敛那一条的判据是消费者 `check:shared-drift` 由 `FAIL 1 modified` 变为
   `OK 812 identical / 10 allowlisted / 0 modified`；v0180 的最后一项由 ops PR #164 关闭、
   PR #165 在 ops main `9afabc2a` 复核。
2. 移动一律用 `git mv`，让 diff 呈现为 rename 而不是删除 + 新增，保留可追溯性（与
   2026-10-29 / 10-30 / 10-31 三轮归档一致）。
3. manifest 只改一个字段（`status`），`linkage` 保持规范路径：`check:task-packet` 在移动后
   仍对两份 `.task.md` 给出 `[PASS]`，证明 `resolveArchiveAwarePath` 的回退分支成立。
4. `.harness/ARCHIVE.md` 的统计口径是「`archive/<YYYY-MM>/{tasks,evidence}/` 的目录数」，
   本包按实测目录数（26/31、23/23、72/70、91/94）重写，而不是在旧数字上加减——两者恰好
   一致（+2/+2），这本身就是核对结果。
5. 如实登记一个新观察到的工具边缘：`scripts/harness/check-evidence.mjs --root . --strict`
   与 `check-review.mjs --root . --strict` 只扫 live 树（FR-024 已记录该口径），因此当
   `.harness/evidence/` 里只剩没有 `commands.json` 的历史目录时，它们会报
   `No evidence command files found.` / `No review artifacts found.`。这两条不在 npm
   `check:*` 脚本面上、也不在任何 CI 作业里（CI 走的是 `check:task-packet`、
   `check:failure-registry` 等），所以不影响本 PR 的门禁；本包含盖自己的 evidence 目录，
   移动后可用性不受影响。是否把「档案回退」接进这两个检查器归维护者决定。

## Verification Plan

- `node scripts/harness/check-task-packet.mjs --root .` → 两份被归档 `.task.md` 与本包
  `.task.md` 均 `[PASS]`（回填实际读数）
- `node scripts/harness/check-evidence.mjs --root . --strict`、
  `node scripts/harness/check-review.mjs --root . --strict` → 本包 0 error
- `node scripts/harness/check-failure-registry.mjs --root . --strict` → 0 error / 0 warning
- `node scripts/harness/check-structure-contract.mjs --root . --strict` → 0 finding
- `node scripts/harness/check-encoding.mjs --root . --strict` → 0 finding
- 目录计数核对：`for m in 2026-07..2026-10; do ls archive/$m/{tasks,evidence} | wc -l; done`
- `git show --stat` 呈现 rename（`R100` / `R0xx`）而非 delete + add
- 主机侧完成判据读数：`git tag -l 'pantheon-base-v0.18*'`、`gh release view … --json assets`、
  `cat VERSION`、ops `gh pr list --state merged` 的 #161/#164/#165 与 squash oid
- `node scripts/create-pr.mjs --title … --body-file .harness/evidence/…/pr-body.md`
- PR 侧回读：`Docs Governance`、`Quality Gates`、`CI Summary` 等作业结论

## Linkage

- Task ID: `2026-10-31-harness-archive-closeout-round2`
- Task Manifest: `.harness/tasks/2026-10-31-harness-archive-closeout-round2/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `.harness/ARCHIVE.md`、`docs/harness/VERIFICATION_EVIDENCE_SPEC.md`
- Evidence Directory: `.harness/evidence/2026-10-31-harness-archive-closeout-round2/`
- Review File: `.harness/evidence/2026-10-31-harness-archive-closeout-round2/review.md`

## Evidence Required

- `commands.json`：两条收口判据的主机读数、`git mv` 结果与 rename 呈现、目录计数、
  归档后各检查器读数、新观察到的检查器边缘复现读数
- `summary.md`：为什么这两条现在可以关闭（读数而非叙述）、归档约定如何保持一致、
  live-tree-only 检查口径的影响面
- `review.md`：逐条 reviewer posture 读数 + Machine Readable 块

## Human Gates

- 纯档案/文档移动，属低风险范围（一位非作者批准即可）；不含 workflow、权限、schema、
  依赖或发布资产变化。
- 不切 foundation release、不动 `VERSION`/`CHANGELOG`/`docs/release-notes/**`。
- 是否把 `check-evidence` / `check-review` 接入档案回退（第 5 条 Implementation Note）
  属治理脚本变更，归维护者决定，本包不扩面。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] 两份 manifest `status` 均为 `completed`，两份 `.task.md` 均为 `status: Archived`
- [x] `git mv` 呈现 rename，归档目录数与 `.harness/ARCHIVE.md` 统计一致（91/94、212/218）
- [x] 归档后 `check:task-packet` 与治理门禁仍通过（规范路径回退成立）
- [x] 未动产品代码、CI 作业、门禁阈值、发布资产与消费者仓库
