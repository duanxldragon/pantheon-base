---
title: Pantheon Base v0.18.2 发布任务包（菜单契约传感器共享面登记与 patch 发布）
doc_type: Remediation
layer: platform
depends_on_layers:
  - platform
status: Active
linked_contracts:
  - docs/VERSION_MANAGEMENT_GUIDE.md
  - docs/designs/FOUNDATION_RELEASE_MODEL.md
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-10-31
---

# Task Packet: 2026-10-31-v0182-menu-contract-shared-surface

## Goal

把 `main` 自 v0.18.1（`93505225`）以来的 9 个已合并提交打成 **patch** foundation release
（`pantheon-base-v0.18.2`，`release/0.18`），并在打包前修掉一个会让修复永远到不了消费仓的登记缺口：
`frontend/scripts/check-menu-contract.mjs` 与 `pantheon-ops` 的副本逐字节相同、且由消费仓前端
`prebuild` 执行，却不在 release manifest 的 `sharedPaths` 里，因此 #471 对菜单契约解析器的修复无法
随任何 release 到达 `pantheon-ops`。

本包的动作分三段：①把该文件登记为共享路径（`sharedPaths` 52 → 53，并加入
`scripts/foundation-release/frontend-ownership.mjs` 的必需清单，防止再次漏登记）；②写版本元数据、
发布说明、双语文档索引与 `.harness/STATUS.md`；③切 tag 发布四件产物，再让 `pantheon-ops` 消费
（锁推进、`rebuild:from-base`、`check:shared-drift` 0 modified、后端 `go build ./...` 与前端
`npm run build`）。

## Primary Layer

platform

改动落在发布元数据（`VERSION`、`CHANGELOG.md`、`docs/release-notes/`）、release manifest 的共享面
清单与它的测试、`.harness/` 任务档案。零后端、零前端源码、零 schema、零路由、零权限、零 i18n 变化。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `required`
- Release Requirement: `foundation-release`

## Dependency Layers

- `platform`：`VERSION`、`CHANGELOG.md`、`docs/release-notes/`、`.harness/STATUS.md`、任务包与证据。
- 发布工具面：`scripts/foundation-release/{build-release-manifest,frontend-ownership}.mjs` 的共享路径
  清单，以及 `tests/scripts/foundation-release/*.test.mjs` 的期望值。
- 下游消费：`pantheon-ops` 的 lock 推进与重建验证，记录在本包证据里，不在本仓提交。

## Harness Profile

- Template: admin-platform
- Overlay: pantheon-base
- Quality Profile: ci-workflow
- Portable Failure Class: static-sensor-gap
- Owner Layer: foundation-source
- Ratchet Decision: registry-only
- Coverage Dimensions:
  - behaviour
  - maintainability
  - architecture-fitness

## Contract Anchors

- `docs/VERSION_MANAGEMENT_GUIDE.md`（§2.4 patch 判定：bug fix / 兼容性补丁；§3.2 发布步骤）
- `docs/designs/FOUNDATION_RELEASE_MODEL.md`（§2.2 release 是消费接口；§3 共享路径分层；§4 四件产物）
- `docs/contracts/PLATFORM_CONTRACT.md`（共享前端脚本属于消费面的一部分）
- `.harness/ARCHIVE.md`（任务包正文留在 `docs/harness/tasks/`，完成后随月度归档移动 manifest/evidence）

## Scope

### In

- `frontend/scripts/check-menu-contract.mjs` 加入 `sharedPaths.frontend`（52 → 53）与
  `requiredFrontendEntries`；对应三处测试期望同步（manifest 单测、cut 单测 fixture）。
- `VERSION` → `0.18.2`。
- `CHANGELOG.md` 增加 `[pantheon-base-v0.18.2]` 条目。
- 新增 `docs/release-notes/RELEASE_NOTES_v0.18.2.md` 并更新双语索引与「当前最新」。
- `.harness/STATUS.md` 版本行与 v0.18.2 发布段落。
- 任务包、manifest 与证据目录（含 `notes/` 三份发布文本）。
- 发布：tag `pantheon-base-v0.18.2`、GitHub Release、四件产物、`Foundation Release Verify`。
- 消费侧：`pantheon-ops` 锁推进到 0.18.2、`rebuild:from-base`、`check:business-overlay`、
  `check:shared-drift`、后端 `go build ./...`、前端 `npm run build`。

### Out

- 任何后端源码、前端源码、迁移、路由、权限、菜单键、i18n 键改动。
- 修改 `.github/workflows/**`、门禁阈值或必需检查集合。
- 撤回或改写已发布的 v0.18.1 tag 与 GitHub Release。
- 在 `pantheon-ops` 仓库提交锁推进（属该仓库自身评审）。
- 把 #471 的解析器修复回摘到 `frontend/src/**`（该修复已在 `main`，本包只负责发布它）。

## Expected Files

### Create

- `docs/release-notes/RELEASE_NOTES_v0.18.2.md`
- `docs/harness/tasks/2026-10-31-v0182-menu-contract-shared-surface.task.md`
- `.harness/tasks/2026-10-31-v0182-menu-contract-shared-surface/manifest.json`
- `.harness/evidence/2026-10-31-v0182-menu-contract-shared-surface/{commands.json,summary.md,review.md,pr-body.md}`
- `.harness/evidence/2026-10-31-v0182-menu-contract-shared-surface/notes/{release-notes.md,upgrade-notes.md,consumer-impact.md}`

### Modify

- `VERSION`、`CHANGELOG.md`、`docs/release-notes/README.md`、`docs/release-notes/README.en.md`
- `.harness/STATUS.md`
- `scripts/foundation-release/build-release-manifest.mjs`、`scripts/foundation-release/frontend-ownership.mjs`
- `tests/scripts/foundation-release/build-release-manifest.test.mjs`、`tests/scripts/foundation-release/cut-foundation-release.test.mjs`

### Do Not Touch

- `backend/**`、`frontend/src/**`、`frontend/scripts/**`（只登记路径，不改内容）
- `.github/workflows/**`、`sonar-project.properties`、`package.json`、`package-lock.json`
- `.foundation/**`、历史 tag 与 Release、`.harness/archive/**`

## Implementation Notes

- 版本判定按 §2.4：菜单契约解析缺陷、githubactions 告警、发布门禁读空、退役模块子句内聚都是修复类
  变更，不新增消费能力，因此 `0.18.2` / `release/0.18`。
- 登记缺口的证据是字节比对而不是判断：`pantheon-ops/frontend/scripts/check-menu-contract.mjs` 与
  base v0.18.1 的同名文件 diff 为空，两边只差 #471 的提交内容；消费仓 `frontend/package.json`
  `prebuild` 直接调用它。共享面漏登记使 #471 的修复对消费仓永久不可达。
- `requiredFrontendEntries` 是 manifest 构建期的守卫：文件存在但未声明就报错。把同名条目加进去，
  未来从 `sharedPaths` 删除会失败在构建期而不是静默通过。
- 共享项从 52 增到 53 会改变 lock 形态，但不改变 `rebuild-from-base.mjs` / `check-shared-drift.mjs`
  的代码：两者都从 lock 里读清单。
- 新增共享项会让 `pantheon-ops` 在重建前把两个文件读成 modified（0 modified → 2 modified），重建后
  回到 0；这不是回归，是共享面扩大的预期过渡读数，必须写进证据。
- 发布前置条件由 `publish-foundation-release.mjs` 强制：工作树干净、目标 commit 上
  `Release Gate Summary` 为 success、manifest 的 `baseCommit` 等于目标 commit、四件产物校验和有效。
- 归档不在本包内：发布与消费读数落定后，任务包按 `.harness/ARCHIVE.md` 的月度约定在后续收口提交里
  用 `git mv` 归档，manifest 路径不改写。

## Verification Plan

- `cat VERSION && grep -n 'pantheon-base-v0.18.2' CHANGELOG.md docs/release-notes/RELEASE_NOTES_v0.18.2.md .harness/STATUS.md`
- `node frontend/scripts/check-menu-contract.mjs`
- `npm run test:menu-contract`
- `node --test tests/scripts/foundation-release/*.test.mjs`
- `npm run check:task-packet`、`npm run check:task-packet-template`、`npm run check:structure`、
  `npm run check:harness-encoding`、`npm run check:docs-frontmatter`、`npm run check:harness-inventory`
- `node scripts/harness/check-evidence.mjs --root . --strict`
- `node scripts/harness/check-review.mjs --root . --strict`
- `node scripts/harness/check-failure-registry.mjs --root . --strict`
- `node scripts/check-pr-governance.mjs`（经 `create-pr.mjs` 调用）
- `gh api repos/duanxldragon/pantheon-base/commits/<sha>/check-runs` 断言必需检查与
  `Release Gate Summary` 均 success
- `node scripts/foundation-release/check-release-assets.mjs --release-version pantheon-base-v0.18.2 --repo duanxldragon/pantheon-base`
- `cd ../pantheon-ops && npm run rebuild:from-base && npm run check:business-overlay && npm run check:shared-drift`
- `cd ../pantheon-ops/backend && go build ./...`、`cd ../pantheon-ops/frontend && npm run build`

## Evidence Required

- 共享路径登记的字节比对读数与 `sharedPaths` 52 → 53、manifest 构建与 cut 测试的真实输出。
- 版本引用一致性、任务包与证据门禁的真实输出。
- 目标 commit 上必需检查与 `Release Gate Summary` 的结论。
- tag 指向的 commit（peeled）与四件产物的名称、大小、SHA-256。
- `Foundation Release Verify` 在 `release: published` 上的结论。
- `pantheon-ops` 重建前后的 `check:shared-drift` 读数，以及 `go build ./...` 与 `npm run build`。

## Human Gates

- 发布需要带 `contents:write` 的凭据；本轮使用已登录的维护者 `gh` 会话调度
  `Foundation Release Cut`，tag 与 Release 一经创建不可回退。
- 共享面从 52 增到 53 属于消费契约的形态变化，合并前由非作者评审确认这是登记修复而不是扩大共享范围。
- `pantheon-ops` 的锁推进与 live 树替换属该仓库 L2 门禁，记录在证据里、由该仓库自身评审。

## Linkage

- Task ID: `2026-10-31-v0182-menu-contract-shared-surface`
- Task Manifest: `.harness/tasks/2026-10-31-v0182-menu-contract-shared-surface/manifest.json`
- Evidence Directory: `.harness/evidence/2026-10-31-v0182-menu-contract-shared-surface/`
- Review File: `.harness/evidence/2026-10-31-v0182-menu-contract-shared-surface/review.md`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/VERSION_MANAGEMENT_GUIDE.md`、`docs/designs/FOUNDATION_RELEASE_MODEL.md`

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [ ] Review completed
- [ ] 共享路径登记完成且 `sharedPaths` 为 53 项
- [ ] 版本判定为 patch（0.18.2）并记录依据
- [ ] VERSION / CHANGELOG / RELEASE_NOTES / STATUS 版本引用一致
- [ ] 目标 commit 上必需检查与 Release Gate 全绿
- [ ] tag 与 GitHub Release（含四件产物）已发布
- [ ] `pantheon-ops` 对 `pantheon-base-v0.18.2` 重建且 drift、后端与前端构建均通过
