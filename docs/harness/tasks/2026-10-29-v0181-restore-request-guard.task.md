---
title: Pantheon Base v0.18.1 修复任务包（恢复共享请求错误谓词并验证消费仓构建）
doc_type: Remediation
layer: platform
depends_on_layers:
  - platform
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/VERSION_MANAGEMENT_GUIDE.md
  - docs/designs/FOUNDATION_RELEASE_MODEL.md
  - docs/harness/AI_QUALITY_GOVERNANCE.md
updated_at: 2026-10-29
---

# Task Packet: 2026-10-29-v0181-restore-request-guard

## Goal

恢复 `frontend/src/api/request.ts` 中被 S1 去导出波次（#439，`b0a1952a`）删除的
`isForbiddenRequestError` 导出，并以 **patch** foundation release（`pantheon-base-v0.18.1`）交付，
使 `pantheon-ops` 能对覆盖 13 个精简波次的版本完成前端与后端构建。

问题是在执行“切一个覆盖 13 个波次的 foundation release 并验证 pantheon-ops 构建”时被真实构建
读出来的：v0.18.0 已发布，消费仓重建后后端 `go build ./...` 通过，前端 `npm run build` 红在

```
src/modules/business/deploy/task/DeployTaskDetail.tsx(29,10): error TS2614:
Module '"../../../../api/request"' has no exported member 'isForbiddenRequestError'.
```

在消费仓 staging 树里恢复该导出后前端构建通过（`✓ built in 751ms`），因此修复归属 base
（Base-first）：共享导出不应因为一次仅覆盖本仓的"零调用方"检索而从谓词族里消失。

## Primary Layer

platform

改动只有前端共享 API 模块的两行导出，以及版本、发布文档与治理登记；无后端、schema、路由、
权限、菜单或 i18n 变化。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `required`
- Release Requirement: `foundation-release`

## Dependency Layers

- `platform`：`frontend/src/api/request.ts` 的导出面、`VERSION`、`CHANGELOG.md`、
  `docs/release-notes/`、`.harness/STATUS.md`、任务包与证据。
- 仓库治理：`docs/harness/failure-registry.md`（新增 FR-021）与
  `docs/harness/AI_QUALITY_GOVERNANCE.md` §5.4（共享导出删除前的消费仓检索规则）。
- 下游消费：`pantheon-ops` 的 lock 推进与前后端构建验证，记录在本包证据里，不在本仓提交。

## Harness Profile

- Template: admin-platform
- Overlay: pantheon-base
- Quality Profile: ci-workflow
- Portable Failure Class: `static-sensor-gap`
- Owner Layer: consumer-repository
- Ratchet Decision: guide-updated（新增 §5.4 规则并登记 FR-021；不新增门禁脚本）
- Coverage Dimensions:
  - behaviour
  - maintainability
  - runtime-quality

## Contract Anchors

- `docs/VERSION_MANAGEMENT_GUIDE.md`（§2.3 patch 判定：bug fix；§3.2 发布步骤）
- `docs/designs/FOUNDATION_RELEASE_MODEL.md`（§2.2 release 是消费接口；§4 四件产物）
- `docs/contracts/PLATFORM_CONTRACT.md`（共享前端 API 模块的导出面契约）
- `docs/harness/AI_QUALITY_GOVERNANCE.md`（§5.4 新增规则）
- `docs/harness/failure-registry.md`（FR-021）

## Scope

### In

- `frontend/src/api/request.ts` 恢复 `isForbiddenRequestError` 导出（两行）。
- `VERSION` → `0.18.1`。
- `CHANGELOG.md` 增加 `[pantheon-base-v0.18.1]` 条目。
- 新增 `docs/release-notes/RELEASE_NOTES_v0.18.1.md` 并更新双语索引。
- `.harness/STATUS.md` 版本与发布段落（含 v0.18.0 的实际发布结果）。
- `FR-021` 登记与 `AI_QUALITY_GOVERNANCE.md` §5.4。
- 任务包、manifest 与证据目录（含 `notes/` 三份发布说明）。
- 发布后：tag、GitHub Release、四件产物、`Foundation Release Verify`。
- 消费侧：`pantheon-ops` 锁推进到 0.18.1、`rebuild:from-base`、`go build ./...`、
  `npm run build`。

### Out

- 任何后端、迁移、路由、权限、菜单、i18n 改动。
- 改动其他前端模块行为，或把谓词放回 `index.ts` 二次导出。
- 放松或修改 `release-gate.yml`、`foundation-release-verify.yml` 或任何既有必需检查。
- 撤回或改写已发布的 `pantheon-base-v0.18.0` tag 与 GitHub Release。
- 在 `pantheon-ops` 仓库提交锁推进（属该仓库自身评审）。

## Expected Files

### Create

- `docs/release-notes/RELEASE_NOTES_v0.18.1.md`
- `.harness/tasks/2026-10-29-v0181-restore-request-guard/manifest.json`
- `.harness/evidence/2026-10-29-v0181-restore-request-guard/{commands.json,summary.md,review.md,pr-body.md}`
- `.harness/evidence/2026-10-29-v0181-restore-request-guard/notes/{release-notes.md,upgrade-notes.md,consumer-impact.md}`
- `docs/harness/tasks/2026-10-29-v0181-restore-request-guard.task.md`

### Modify

- `frontend/src/api/request.ts`、`VERSION`、`CHANGELOG.md`、`docs/release-notes/README.md`、
  `docs/release-notes/README.en.md`、`.harness/STATUS.md`、`.harness/evidence/2026-10-29-v0180-simplification-release/commands.json`、
  `docs/harness/failure-registry.md`、`docs/harness/AI_QUALITY_GOVERNANCE.md`

### Do Not Touch

- `backend/**`、其他 `frontend/**` 文件、`.github/workflows/**`、`sonar-project.properties`、
  `package.json`、`package-lock.json`、`release-gate.yml`、`foundation-release-verify.yml`。
- 历史 tag、Release 与 `.harness/archive/**`。

## Implementation Notes

- 版本判定：`docs/VERSION_MANAGEMENT_GUIDE.md` §2.3 将 bug fix 列为 patch。本次只恢复被误删的
  共享导出，不新增能力，因此 `0.18.1` / `release/0.18`。
- 恢复的是谓词族第四成员：`isTimeoutRequestError`、`isNetworkRequestError`、
  `isServerRequestError` 仍在，`isForbiddenRequestError` 补齐后消费仓无需改代码。
- 根因不是"导出该不该删"，而是检索范围：S1 的零调用方检索只看本仓，而 `api/request` 是
  foundation 消费面。§5.4 把这条写成规则，FR-021 记录本次实例。
- 无迁移：schema 仍 30；`sharedPaths` 仍 52，消费仓只移动版本、release line、commit 与两份校验和。
- 发布物必须齐备四件；本地脚本链 `cut-foundation-release.mjs` → `check-release-secrets.mjs` →
  `publish-foundation-release.mjs`，要求工作树干净且目标 commit 上 `Release Gate Summary` 为 success。
- 网络注意：本机到 `github.com:443` 间歇超时（`api.github.com` 正常），git 操作需要重试。

## Verification Plan

- `cat VERSION && grep -n 'pantheon-base-v0.18.1' CHANGELOG.md docs/release-notes/RELEASE_NOTES_v0.18.1.md .harness/STATUS.md`
- `cd frontend && npm run lint && npm run type-check && npm run build`
- `npm run check:task-packet`、`npm run check:harness-docs`、`npm run check:task-packet-template`、
  `npm run check:structure`、`npm run check:harness-encoding`、`npm run check:docs-frontmatter`
- `node scripts/harness/check-evidence.mjs --root . --strict`
- `node scripts/harness/check-review.mjs --root . --strict`
- `node scripts/harness/check-failure-registry.mjs --root . --strict`
- `node scripts/check-pr-governance.mjs`（经 `create-pr.mjs` 调用）
- `gh api repos/duanxldragon/pantheon-base/commits/<sha>/check-runs` 断言必需检查与
  `Release Gate Summary` 均 success
- `gh release view pantheon-base-v0.18.1 --json assets --jq '.assets[].name'` 与
  `node scripts/foundation-release/check-release-assets.mjs --release-version pantheon-base-v0.18.1 --repo duanxldragon/pantheon-base`
- `cd /d/workspace/go/pantheon-platform/pantheon-ops && npm run rebuild:from-base && cd backend && go build ./... && cd ../frontend && npm run build`

## Evidence Required

- 前端 lint / type-check / build 的真实输出，以及消费仓修复前后的构建读数。
- 版本引用一致性、任务包与证据门禁的真实输出。
- 目标 commit 上必需检查与 `Release Gate Summary` 的结论。
- tag 指向的 commit（peeled）与四件产物的名称、大小、SHA-256。
- `Foundation Release Verify` 在 `release: published` 上的结论。
- `pantheon-ops` 重建后 `go build ./...` 与 `npm run build` 的读数。

## Human Gates

- 发布需要带 `contents:write` 的凭据；本轮使用已登录的维护者 `gh` 会话在本地执行，tag 与
  Release 一经创建不可回退。
- `pantheon-ops` 的锁推进与构建记录在证据里，提交留给该仓库自身的评审。

## Linkage

- Task ID: `2026-10-29-v0181-restore-request-guard`
- Task Manifest: `.harness/tasks/2026-10-29-v0181-restore-request-guard/manifest.json`
- Evidence Directory: `.harness/evidence/2026-10-29-v0181-restore-request-guard/`
- Review File: `.harness/evidence/2026-10-29-v0181-restore-request-guard/review.md`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/VERSION_MANAGEMENT_GUIDE.md`、`docs/designs/FOUNDATION_RELEASE_MODEL.md`、
  `docs/harness/AI_QUALITY_GOVERNANCE.md`

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] 版本判定为 patch（0.18.1）并记录依据
- [x] VERSION / CHANGELOG / RELEASE_NOTES / STATUS 版本引用一致
- [ ] 目标 commit 上必需检查与 Release Gate 全绿
- [ ] tag 与 GitHub Release（含四件产物）已发布
- [ ] `pantheon-ops` 对 `pantheon-base-v0.18.1` 重建且后端与前端构建均通过
