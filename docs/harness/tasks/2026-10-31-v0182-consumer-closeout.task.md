---
title: 收口 v0.18.2 消费闭环并归档三个已完成任务包（v0182 发布、发布门禁修复、第二轮归档）
doc_type: Remediation
layer: platform
depends_on_layers: []
status: Active
linked_contracts:
  - docs/harness/VERIFICATION_EVIDENCE_SPEC.md
  - docs/designs/REPOSITORY_LAYOUT.md
updated_at: 2026-10-31
---

# Task Packet: 2026-10-31-v0182-consumer-closeout

## Goal

`pantheon-base-v0.18.2` 的最后一个未闭合项——`pantheon-ops` 对锁定发行包的重建——已经由消费仓
两个 PR 关闭：`#166`（`5676ffc`，2026-10-31T01:59:39Z 合并）把 lock 推进到 `pantheon-base-v0.18.2`
并完成重建与门禁，`#167`（`81d2941`）把错过 `#166` 合并窗口的 Sonar 新代码修复重放到合并后的
main，使 SonarCloud Code Analysis 与 Go Lint 回到绿。与此同时，`2026-10-31-harness-archive-closeout-round2`
由自身 PR #481（`94a492ef`）合并关闭，`2026-10-31-release-gate-checks-poll-resilience` 随 #478 的
`Release Gate` 修复进入 main（FR-025）。三个任务的实质工作都已结束，但 `.harness/tasks/` 里仍留着
它们的 `in-progress` manifest —— 与 `.harness/ARCHIVE.md` 的月度归档约定不一致。

本包只做档案收口：三份 manifest 的 `status` 改为 `completed`，三份任务包 frontmatter 改为
`status: Archived`，`.harness/tasks/<id>` 与 `.harness/evidence/<id>` 以 `git mv` 落到
`archive/2026-10/{tasks,evidence}/<id>/`，并把 `.harness/ARCHIVE.md` 的月度统计、「当前活跃任务」
清单与本轮收口记录写清。零运行时代码、零门禁阈值变化、零 schema 变化、零 `.foundation/**` 变化。

## Primary Layer

platform

## Dependency Layers

- `platform`（任务档案面与治理文档面）。不触碰 `system/*`、`business/*`、`backend/**`、
  `frontend/src/**`，不改变任何门禁判定语义、阈值或 CI 作业。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`（方法论）
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `deferred`
- Release Requirement: `none`

## Harness Profile

- Template: api-service
- Overlay: pantheon-base
- Quality Profile: `ci-workflow`
- Portable Failure Class: `harness-governance`
- Owner Layer: `platform`
- Coverage Dimensions:
  - method-health
  - architecture-fitness

## Contract Anchors

- `.harness/ARCHIVE.md`
- `docs/harness/VERIFICATION_EVIDENCE_SPEC.md`
- `docs/designs/REPOSITORY_LAYOUT.md`

## Scope

### In

- `docs/harness/tasks/2026-10-31-v0182-menu-contract-shared-surface.task.md`：勾选最后一项消费验证、
  补充 `## Consumer verification（pantheon-ops）` 一节、frontmatter 改 `status: Archived`。
- `docs/harness/tasks/2026-10-31-harness-archive-closeout-round2.task.md` 与
  `docs/harness/tasks/2026-10-31-release-gate-checks-poll-resilience.task.md`：frontmatter 改
  `status: Archived`。
- 三个 manifest 的 `status` 改为 `completed`，随后 `git mv` 到 `archive/2026-10/tasks/<id>/`，
  三个 evidence 目录 `git mv` 到 `archive/2026-10/evidence/<id>/`。
- `.harness/ARCHIVE.md`：2026-10 统计 91/94 → 94/97、合计 212/218 → 215/221，重写「当前活跃任务」
  一节，新增本轮收口记录。
- `.harness/STATUS.md`：把 v0.18.2 段落里「`pantheon-ops` 正在对 0.18.2 做消费重建」更新为已完成事实。
- 本收口包的 task packet、manifest 与 live evidence。

### Out

- 任何产品代码、`.github/workflows/**`、门禁阈值、测试集合。
- `.foundation/**`、`releases/**`、既有 tag 与 release 资产。
- `pantheon-ops` 仓库内的任何文件。

## Expected Files

### Create

- `docs/harness/tasks/2026-10-31-v0182-consumer-closeout.task.md`
- `.harness/tasks/2026-10-31-v0182-consumer-closeout/manifest.json`
- `.harness/evidence/2026-10-31-v0182-consumer-closeout/{commands.json,summary.md,review.md,pr-body.md}`

### Modify

- `docs/harness/tasks/2026-10-31-v0182-menu-contract-shared-surface.task.md`
- `docs/harness/tasks/2026-10-31-harness-archive-closeout-round2.task.md`
- `docs/harness/tasks/2026-10-31-release-gate-checks-poll-resilience.task.md`
- `.harness/ARCHIVE.md`
- `.harness/STATUS.md`

### Do Not Touch

- `backend/**`、`frontend/**`、`.github/**`、`.foundation/**`、`releases/**`、`scripts/**`、`tests/**`

## Implementation Notes

- v0.18.2 包的消费项不是据叙述勾选，而是据消费仓两个 PR 的合并提交与检查回读：`5676ffc` 的重建
  读数（overlay 53、business-overlay 13/13、drift 813 identical / 10 allowlisted / 161 skipped、
  后端 64 包、前端 lint/type-check/build 0），以及 `81d2941` 上 SonarCloud Code Analysis、
  Go Lint、Backend Tests、Smoke Sanity 全绿。
- 三个包的 Completion Checklist 在归档前已全部勾选，本轮只处理 `status` 与位置，不重写已完成的事实。
- 归档一律 `git mv`，diff 呈现 rename；任务包正文仍留在 `docs/harness/tasks/`，只在 frontmatter
  标 `status: Archived`。
- 归档后继续使用规范路径 `.harness/tasks/<id>` 与 `.harness/evidence/<id>` 引用，
  `readTaskManifest` / `resolveArchiveAwarePath` 会回退到归档位置。
- `check-evidence.mjs --strict` 与 `check-review.mjs --strict` 只扫 live 树；本轮把最后的 live
  evidence 目录归档后，本包保留自己的 live evidence，使扫描对象不归零（沿用第二轮的处理方式）。

## Verification Plan

- `npm run check:task-packet`
- `npm run check:docs-frontmatter`、`npm run check:structure`、`npm run check:harness-encoding`
- `node scripts/harness/check-evidence.mjs --root . --strict`
- `node scripts/harness/check-review.mjs --root . --strict`
- `node scripts/harness/check-failure-registry.mjs --root . --strict`
- `npm run check:harness-adoption`
- `node scripts/check-pr-governance.mjs`（经 `create-pr.mjs` 调用）

## Linkage

- Task ID: `2026-10-31-v0182-consumer-closeout`
- Task Manifest: `.harness/tasks/2026-10-31-v0182-consumer-closeout/manifest.json`
- Evidence Directory: `.harness/evidence/2026-10-31-v0182-consumer-closeout/`
- Review File: `.harness/evidence/2026-10-31-v0182-consumer-closeout/review.md`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `.harness/ARCHIVE.md`、`docs/harness/VERIFICATION_EVIDENCE_SPEC.md`

## Evidence Required

- 三个任务包的收口依据（PR 号、合并提交、检查读数）
- 移动前后 `archive/2026-10` 的目录计数（91/94 → 94/97，合计 212/218 → 215/221）
- 归档后 `check:task-packet`、docs 门禁与 `--strict` 传感器的真实输出

## Human Gates

- 归档只移动 manifest/evidence 并改 status，不触碰 `.github/workflows/*` 等高风险范围。
- 不发布 foundation release，不改 `VERSION` / `CHANGELOG.md` / `docs/release-notes/**`。
- 是否把 `check-evidence` / `check-review` 接入 `archive/` 回退属治理脚本变更，由维护者判断。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] 三个 manifest `status` 均为 `completed`，三份 `.task.md` 均为 `status: Archived`
- [x] `git mv` 呈现 rename，归档目录数与 `.harness/ARCHIVE.md` 统计一致（94/97、215/221）
- [x] 归档后 `check:task-packet` 与治理门禁仍通过（规范路径回退成立）
- [x] 未动产品代码、CI 作业、门禁阈值、发布资产与消费者仓库
