---
title: 发布说明目录化与索引（根目录收敛）
doc_type: Remediation
layer: platform
depends_on_layers: []
status: Active
linked_contracts:
  - docs/designs/REPOSITORY_LAYOUT.md
updated_at: 2026-10-28
---

# Task Packet: 2026-10-28-release-notes-directory

## Goal

把仓库根目录堆放的 14 份 `RELEASE_NOTES_v0.13.1.md` … `RELEASE_NOTES_v0.17.8.md`
移入 `docs/release-notes/`，新增中英文索引并接到 `docs/README` 与根 README 的
变更记录入口；同步修正所有指向旧根路径的 markdown 链接，并在
`REPOSITORY_LAYOUT` 中声明“发布说明进 `docs/release-notes/`、只追加不回改”的
放置规则。零代码、零 schema、零路由、零权限变化。

## Primary Layer

platform

## Dependency Layers

- `platform`（docs 布局规范 + 发布说明文档面）。不触碰 `system/*`、`business/*`、
  `backend/**`、`frontend/**`。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `none`
- Release Requirement: `none`
- Downstream Sync Note: 仅文件位置与索引变化，无接口/路由/权限/schema 变化；消费者无需动作。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `none`
- Portable Failure Class: `navigation-dead-end`
- Owner Layer: `foundation-source`
- Ratchet Decision: `no-repeat-observed`
- Coverage Dimensions:
  - maintainability

交付层级：**L1**（范围与验证集合固定：移动 + 索引 + 链接同步 + 布局规范声明）。

## Contract Anchors

- `docs/designs/REPOSITORY_LAYOUT.md`：§1 根目录分组与 §2.1 放置规则；本包新增第 9 条。
- `docs/README.md`：docs 统一入口；本包在“4.3 升级与运行”下挂发布说明索引。
- `docs/VERSION_MANAGEMENT_GUIDE.md`：发布流程说明（只读引用，不改）。

## Scope

### In

- `git mv` 14 份 `RELEASE_NOTES_v*.md` 到 `docs/release-notes/`（保留历史）
- 新增 `docs/release-notes/README.md` 与 `README.en.md` 索引（版本 / 发布日期 / 链接）
- 更新根 `README.md`、`README.en.md` 的变更记录链接到新路径
- 更新 `docs/README.md`、`docs/README.en.md` 的升级与运行入口
- 更新 `docs/reviews/ENTERPRISE_RELEASE_READINESS_REVIEW_2026-10-07.md` 中三处
  `../../RELEASE_NOTES_v0.14.0.md` 链接为 `../release-notes/...`
- 修正 `RELEASE_NOTES_v0.14.0.md` 文档链接区（`./docs/*` → `../*`）
- 把 4 处历史证据 `linkage.planRefs` 的发布说明路径从根目录改为
  `docs/release-notes/...`（仅路径，不改结论与读数）：
  `2026-10-23-iam-race-closeout`（commands.json、review.md）、
  `2026-10-23-iam-residual-closeout`（commands.json）、
  `2026-10-27-v0178-dep-vuln-closure`（review.md）
- `docs/designs/REPOSITORY_LAYOUT.md` / `.en.md`：§1 目录注释与 §2.1 第 9 条放置规则

### Out

- 改写任何历史发布说明的正文内容（仅修正 v0.14.0 的相对链接前缀）
- 修改 `CHANGELOG.md`、`.harness/STATUS.md`、历史任务包；历史证据只允许上述
  4 处 planRefs 的路径重指，结论、命令读数、knownGaps 一律不动
- 修改发布脚本 / workflow（`cut-foundation-release.mjs` 通过 `--release-notes`
  接收正文，不读取仓库内文件路径）
- 任何 `backend/**`、`frontend/**`、schema、路由、权限、i18n 变化

## Expected Files

### Create

- `docs/harness/tasks/2026-10-28-release-notes-directory.task.md`
- `.harness/tasks/2026-10-28-release-notes-directory/manifest.json`
- `.harness/evidence/2026-10-28-release-notes-directory/commands.json`
- `.harness/evidence/2026-10-28-release-notes-directory/summary.md`
- `.harness/evidence/2026-10-28-release-notes-directory/review.md`
- `.harness/evidence/2026-10-28-release-notes-directory/pr-body.md`
- `docs/release-notes/README.md`
- `docs/release-notes/README.en.md`

### Modify

- `README.md`、`README.en.md`
- `docs/README.md`、`docs/README.en.md`
- `docs/designs/REPOSITORY_LAYOUT.md`、`docs/designs/REPOSITORY_LAYOUT.en.md`
- `docs/reviews/ENTERPRISE_RELEASE_READINESS_REVIEW_2026-10-07.md`
- 14 份 `RELEASE_NOTES_v*.md`（移动；仅 v0.14.0 有链接前缀修正）
- `.harness/evidence/2026-10-23-iam-race-closeout/{commands.json,review.md}`
- `.harness/evidence/2026-10-23-iam-residual-closeout/commands.json`
- `.harness/evidence/2026-10-27-v0178-dep-vuln-closure/review.md`

### Do Not Touch

- `backend/**`、`frontend/**`
- `.github/workflows/*`、`scripts/foundation-release/**`
- `CHANGELOG.md`、`VERSION`
- `.harness/evidence/**` 中除上述 4 个 planRefs 路径以外的历史证据
- `.harness/archive/**`（其中的旧相对链接在移动前即已失效，按历史快照保留）

## Implementation Notes

- 目录名选 `docs/release-notes/` 而非 `docs/releases/`：`.gitignore` 的 `releases/`
  规则不带前导斜杠，会同时匹配任意层级的 `releases/`，用 `release-notes` 避免与
  foundation release 产物忽略规则纠缠。
- 索引与 README 的“当前最新”指向 v0.17.8；表按版本倒序，发布日期取自各文件
  `Release date` 或 `CHANGELOG.md` 对应条目。
- 正文中的文件名提及（任务包、证据、`CHANGELOG.md`、failure-registry）是历史
  叙述而非链接，保持原样；唯一需要改的是 markdown 链接目标。
- 发布脚本不读取该路径（`--release-notes` 传正文），移动不改变发布行为。

## Verification Plan

- `node scripts/harness/check-doc-links.mjs --root . --strict` → 0 findings
- `node scripts/harness/check-doc-inventory.mjs --root . --strict` → 0 findings
- `npm run check:docs-frontmatter` → passed
- `npm run check:harness-encoding` → 0 findings
- `npm run check:structure` → 0 findings
- `npm run check:task-packet-template`、`npm run check:task-packet` → exit 0
- `npm run check:generated`、`npm run check:ui-quality-gate` → 0 findings
- `node scripts/harness/check-evidence.mjs --strict`、`node scripts/harness/check-review.mjs --strict` → exit 0
- `grep` 核实除历史叙述外无指向根目录旧路径的链接
- `git diff --stat` 证明改动面：14 个 rename + 8 个文档修改 + 新增索引/任务包

## Linkage

- Task ID: `2026-10-28-release-notes-directory`
- Task Manifest: `.harness/tasks/2026-10-28-release-notes-directory/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/designs/REPOSITORY_LAYOUT.md`、`docs/README.md`
- Evidence Directory: `.harness/evidence/2026-10-28-release-notes-directory/`
- Review File: `.harness/evidence/2026-10-28-release-notes-directory/review.md`

## Evidence Required

- 四条 doc 门禁读数（links / inventory / frontmatter / encoding / structure）
- task-packet、generated、ui-quality-gate 读数
- `git diff --stat` 与 `git status` 的 rename 证明
- 旧根路径链接的 grep 结果与保留理由

## Human Gates

- 无。纯文档位置整理，不改任何行为、契约语义或发布流程；按维护者“根目录文件过多”
  的直接要求执行。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] 14 份发布说明移入 `docs/release-notes/`，根目录不再有 `RELEASE_NOTES_*.md`
- [x] 中英文索引覆盖全部 14 个版本并在 `docs/README` 挂接
- [x] 所有 markdown 链接指向新路径（历史叙述与 archive 快照除外）
- [x] `REPOSITORY_LAYOUT` 中英文同步声明放置规则
