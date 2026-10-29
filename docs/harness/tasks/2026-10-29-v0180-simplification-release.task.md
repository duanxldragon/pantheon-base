---
title: Pantheon Base v0.18.0 发布任务包（13 波精简程序随 minor 发布并验证 ops 构建）
doc_type: Remediation
layer: platform
depends_on_layers:
  - system/iam
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/VERSION_MANAGEMENT_GUIDE.md
  - docs/designs/FOUNDATION_RELEASE_MODEL.md
updated_at: 2026-10-29
---

# Task Packet: 2026-10-29-v0180-simplification-release

## Goal

把 v0.17.8 之后合入 `main` 的 13 个代码精简波次（S1×2、S2×6、S3×3、S4×2）与租户生命周期、
成员关系、控制台波次（W1–W8、计划阶梯决策 A、S3776 收敛）打包为一次 **minor** foundation
release（`pantheon-base-v0.18.0`），发布四件可消费产物，并把 `pantheon-ops` 的锁推进到该版本后
完成一次真实构建。

这是 `2026-10-27-codebase-simplification-program` 清单里唯一未关闭项——"pantheon-ops builds
against the synced foundation release"——的关闭路径：没有覆盖这些波次的发布，该项读数是
`not-run`；有了发布并构建成功，它才能转为 `pass`。

## Primary Layer

platform

发布收口只改版本与文档元数据；产品源码均为已合入改动，本包不新增产品代码。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `required`
- Release Requirement: `foundation-release`

## Dependency Layers

- `platform`：版本与发布文档（`VERSION`、`CHANGELOG.md`、`docs/release-notes/`）、发布任务包与证据。
- `system/iam`：本次发布的租户行为变更主体（W1 删除归档守卫、W2 成员完整性、W4 无角色绑定不发租户上下文、
  W8 删除未挂载的遗留 handler），仅作为发布说明的范围描述，不改其源码。
- 仓库治理：`release-gate.yml`（tag 之前的硬检查点，本包不改）、`foundation-release-verify.yml`
  （发布后断言四件产物，本包不改）。
- 下游消费：`pantheon-ops` 的 lock 推进与构建验证属于消费仓动作，记录在本包证据里。

## Harness Profile

- Template: admin-platform
- Overlay: pantheon-base
- Quality Profile: ci-workflow
- Portable Failure Class: `release-artifact-gap`
- Owner Layer: consumer-repository
- Ratchet Decision: no-repeat-observed（四件产物契约与 `Foundation Release Verify` 沿用，不改门禁）
- Coverage Dimensions:
  - behaviour
  - maintainability
  - runtime-quality

## Contract Anchors

- `docs/VERSION_MANAGEMENT_GUIDE.md`（§2.3 minor 判定：架构优化与治理增强；§3.2 发布步骤）
- `docs/designs/FOUNDATION_RELEASE_MODEL.md`（§2.2 release 是消费接口；§4 四件产物）
- `docs/reviews/CODE_SIMPLIFICATION_PLAN.md`（§11 执行记录与 §11.6 未关闭项）
- `.harness/tasks/2026-10-27-codebase-simplification-program/manifest.json`（待关闭的程序清单）

## Scope

### In

- `VERSION` → `0.18.0`。
- `CHANGELOG.md` 增加 `[pantheon-base-v0.18.0]` 条目。
- 新增 `docs/release-notes/RELEASE_NOTES_v0.18.0.md` 并更新双语索引。
- `.harness/STATUS.md` 版本与发布段落。
- 任务包、manifest 与证据目录（含 `notes/` 下三份发布说明）。
- 发布后：tag、GitHub Release、四件产物、`Foundation Release Verify`。
- 消费侧：`pantheon-ops` 的 `foundation-release.lock.json` 推进与 `go build ./...`、前端构建。

### Out

- 任何产品源码改动：本包不新增后端或前端代码。
- 放松或修改 `release-gate.yml`、`foundation-release-verify.yml` 或任何既有必需检查。
- 提交被 gitignore 的 `releases/**` 与 `dist/**`。
- 改写已存在的不可变 tag 与 GitHub Release。
- 关闭 §11.6 的三项维护者决策（RC-036/037/038 处置、功能冻结、最终验收）。

## Expected Files

### Create

- `docs/release-notes/RELEASE_NOTES_v0.18.0.md`
- `.harness/tasks/2026-10-29-v0180-simplification-release/manifest.json`
- `.harness/evidence/2026-10-29-v0180-simplification-release/{commands.json,summary.md,review.md,pr-body.md}`
- `.harness/evidence/2026-10-29-v0180-simplification-release/notes/{release-notes.md,upgrade-notes.md,consumer-impact.md}`
- `docs/harness/tasks/2026-10-29-v0180-simplification-release.task.md`

### Modify

- `VERSION`、`CHANGELOG.md`、`docs/release-notes/README.md`、`docs/release-notes/README.en.md`、
  `.harness/STATUS.md`

### Do Not Touch

- `backend/**`、`frontend/**`、`release-gate.yml`、`foundation-release-verify.yml`、
  `foundation-release-cut.yml`、任何既有 spec 或发布脚本。
- 历史 tag、Release 与 `.harness/archive/**`。

## Implementation Notes

- 版本判定：`docs/VERSION_MANAGEMENT_GUIDE.md` §2.3 把「架构优化（不影响消费仓）」与「治理增强」列为
  minor。13 个精简波次是架构优化，`docs/release-notes/` 目录化、`.harness/` 月归档与三条新失败登记
  属治理增强；同时释放了 v0.17.8 之后未发布的租户行为修正（W1/W2/W4/W8）。因此切 `0.18.0` /
  `release/0.18`，而不是 patch。
- 无迁移：迁移链仍止于 `000030_tenant_plan_definitions`（schema 30）。
- `sharedPaths` 保持 52 项，消费仓只需移动版本、release line、commit 与两份校验和。
- 发布物必须齐备四件：`foundation-release-pantheon-base-v0.18.0.tgz`、其 `.sha256`、`repo.tar`、
  `repo.tar.sha256`；`Foundation Release Verify` 会在 `release: published` 上断言。
- 本地 canonical 脚本链：`cut-foundation-release.mjs` → `check-release-secrets.mjs` →
  `publish-foundation-release.mjs`（仓库 `default_workflow_permissions=read`，CI 无法创建 Release）。
  发布脚本要求工作树干净、目标 commit 上 `Release Gate Summary` 为 success。
- 网络注意：本机到 `github.com:443` 的连接间歇性超时（`api.github.com` 正常），git 操作需要重试。

## Verification Plan

- `cat VERSION && grep -n 'pantheon-base-v0.18.0' CHANGELOG.md docs/release-notes/RELEASE_NOTES_v0.18.0.md .harness/STATUS.md`
- `npm run check:task-packet`、`npm run check:harness-docs`、`npm run check:task-packet-template`
- `node scripts/harness/check-evidence.mjs --root . --strict`
- `node scripts/harness/check-review.mjs --root . --strict`
- `node scripts/check-pr-governance.mjs`（经 `create-pr.mjs` 调用）
- `gh api repos/duanxldragon/pantheon-base/commits/<sha>/check-runs` 断言六项必需检查与
  `Release Gate Summary` 均 success
- `gh release view pantheon-base-v0.18.0 --json assets --jq '.assets[].name'` 断言四件产物
- `node scripts/foundation-release/check-release-assets.mjs --release-version pantheon-base-v0.18.0 --repo duanxldragon/pantheon-base`
- `cd /d/workspace/go/pantheon-platform/pantheon-ops && npm run rebuild:from-base && cd backend && go build ./...`

## Evidence Required

- 版本引用一致性、任务包与证据门禁的真实输出。
- 目标 commit 上必需检查与 `Release Gate Summary` 的结论。
- tag 指向的 commit（peeled）与四件产物的名称、大小、SHA-256。
- `Foundation Release Verify` 在 `release: published` 上的结论。
- `pantheon-ops` 重建后 `go build ./...` 与前端构建的读数。

## Human Gates

- 发布版本级别（minor 0.18.0）由本包依据 §2.3 判定，维护者可在验收时改判。
- 自动发布需要带 `contents:write` 的凭据；本轮使用已登录的维护者 `gh` 会话在本地执行。

## Linkage

- Task ID: `2026-10-29-v0180-simplification-release`
- Task Manifest: `.harness/tasks/2026-10-29-v0180-simplification-release/manifest.json`
- Evidence Directory: `.harness/evidence/2026-10-29-v0180-simplification-release/`
- Review File: `.harness/evidence/2026-10-29-v0180-simplification-release/review.md`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/VERSION_MANAGEMENT_GUIDE.md`、`docs/designs/FOUNDATION_RELEASE_MODEL.md`、
  `docs/reviews/CODE_SIMPLIFICATION_PLAN.md`

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] 版本判定为 minor（0.18.0）并记录依据
- [x] VERSION / CHANGELOG / RELEASE_NOTES / STATUS 版本引用一致
- [ ] 目标 commit 上必需检查与 Release Gate 全绿
- [ ] tag 与 GitHub Release（含四件产物）已发布
- [ ] `pantheon-ops` 对 `pantheon-base-v0.18.0` 重建并构建通过
