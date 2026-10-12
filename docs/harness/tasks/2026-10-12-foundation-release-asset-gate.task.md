---
title: Pantheon Base 发布产物门禁（Foundation Release 资产完整性）任务包
doc_type: Remediation
layer: platform
depends_on_layers:
  - system/iam
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/DOCUMENT_GOVERNANCE_CONTRACT.md
updated_at: 2026-10-12
---

# Task Packet: 2026-10-12-foundation-release-asset-gate

## Goal

补上「发布产物」这一环缺失的传感器：让「发布了却没有产物」这件事在发生时立刻变红，而不是被下游消费方
在数周后发现。

`pantheon-base` 的消费模型是产物制 —— `pantheon-ops` 用 `repo.tar` + bundle 归档物化一个 release，
并对两者做 SHA-256 校验。但实测：

| Release | Assets |
| --- | ---: |
| `pantheon-base-v0.16.0` | 0 |
| `pantheon-base-v0.15.0` | 0 |
| `pantheon-base-v0.14.0` | 0 |
| `pantheon-base-v0.13.0` | 4 |
| `pantheon-base-v0.12.1` | 4 |

产物通道从 v0.14.0 起断裂并持续三版。ops 的锁因此停在 `pantheon-base-v0.13.0`（`.foundation/releases/`
也止于该版本）—— **锁无法推进到一个没有产物可物化的版本**，这正是 ops 基线落后三个小版本的直接原因。

发布脚本本身是对的（`publish-foundation-release.mjs` 会 `gh release create` 后 `gh release upload`），
问题是这一步**从未接入任何 workflow、也从未被执行**；CI 只跑 `npm run test:foundation-release`
（测脚本的单元测试），而「脚本测试通过」与「产物已发布」是两个问题。`release-gate.yml` 的注释自称
「发布 bundle 前的唯一硬检查点」，但文件里没有任何一步观察产物 —— 文档契约与实现门禁互相矛盾，
且没有任何东西检验这个矛盾。

本次要交付：(1) 一个校验 release 是否带齐四件产物且校验和一致的检查；(2) 把它接到
`release: published` 事件上；(3) 一个仅手动触发、默认 dry-run 的 workflow，可从发布 commit 重建并
上传缺失产物。

## Primary Layer

platform

改动只落在发布工程与 CI 门禁（`scripts/foundation-release/`、`tests/scripts/foundation-release/`、
`.github/workflows/`、`package.json`），不触碰任何产品源码、共享层契约或既有 workflow 的作业。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `not-required`
- Release Requirement: `none`

## Dependency Layers

- `platform`：`scripts/foundation-release/`（新增检查脚本，复用既有导出）、`.github/workflows/`（新增两个
  workflow）、`package.json`（新增脚本入口）。
- 仓库治理：`docs/harness/failure-registry.md`（新增 FR-014）。
- 无 `system/*` 与 `business/*` 依赖：本次不读取也不修改任何业务层代码。

## Harness Profile

- Template: admin-platform
- Overlay: pantheon-base
- Quality Profile: ci-workflow
- Portable Failure Class: `runtime-evidence-gap`
- Owner Layer: consumer-repository
- Ratchet Decision: gate-updated（新增一个 CI 门禁：发布产物完整性在 `release: published` 上被强制校验）
- Coverage Dimensions:
  - runtime-quality
  - maintainability

## Contract Anchors

- `AGENTS.md`、`DESIGN.md`、`docs/README.md`
- `docs/designs/FOUNDATION_RELEASE_MODEL.md`（§2.2「release 才是消费接口」、§4 release 最小定义、
  §4.1 frontend shared-path ownership、§5 Release Gate）
- `docs/VERSION_MANAGEMENT_GUIDE.md`（§3.1 发版前置条件、§3.2 发布步骤）
- `.github/workflows/release-gate.yml`（自称「发布 bundle 前的唯一硬检查点」）
- `.github/workflows/ci.yml`（第 186 行 `npm run test:foundation-release`）
- `docs/harness/VERIFICATION_EVIDENCE_SPEC.md`、`docs/harness/failure-registry.md`

## Scope

### In

- `scripts/foundation-release/check-release-assets.mjs`（新增）：校验四件产物齐备；`--dist` 校验本地
  bundle 的 SHA-256；`--local-only` 只做本地校验不联网；`--wait` 轮询等待上传完成；CLI 经
  `runCheckCli` 导出以便无需 spawn 即可测试。
- `tests/scripts/foundation-release/check-release-assets.test.mjs`（新增）：21 条 hermetic 用例，
  不联网、不 spawn 子进程。
- `package.json`：新增 `check:release-assets` 脚本入口。
- `.github/workflows/foundation-release-verify.yml`（新增）：`release: published` + `workflow_dispatch`
  触发，产物缺失即失败。
- `.github/workflows/foundation-release-backfill.yml`（新增）：仅 `workflow_dispatch`，默认
  `dry_run: true`，从发布 commit 重建 bundle 并上传四件产物。
- `docs/harness/failure-registry.md`：登记 FR-014。
- `.harness/tasks/2026-10-12-foundation-release-asset-gate/`、
  `.harness/evidence/2026-10-12-foundation-release-asset-gate/`、
  `docs/harness/tasks/2026-10-12-foundation-release-asset-gate.task.md`。

### Out

- **不在本次向 v0.14.0 / v0.15.0 / v0.16.0 上传任何东西**：修复已发布的 release 是一次需要单独发起、
  单独复核的 backfill 操作，不是加门禁的副作用。
- 不修改发布脚本行为：`publish-foundation-release.mjs`、`build-release-bundle.mjs`、
  `build-release-manifest.mjs`、`release-cli.mjs` 只被读取与复用。
- 不改写 `sharedPaths` 契约或 foundation release 模型：所有权清单与「快照 + overlay」设计保持原样。
- 不把新 workflow 设为 required check：那属于分支保护决策，已登记为人工门禁。
- 不触碰 `backend/**`、`frontend/**` 以及任何既有 workflow 的作业。

## Expected Files

### Create

- `scripts/foundation-release/check-release-assets.mjs`
- `tests/scripts/foundation-release/check-release-assets.test.mjs`
- `.github/workflows/foundation-release-verify.yml`
- `.github/workflows/foundation-release-backfill.yml`
- `.harness/tasks/2026-10-12-foundation-release-asset-gate/manifest.json`
- `.harness/evidence/2026-10-12-foundation-release-asset-gate/commands.json`
- `.harness/evidence/2026-10-12-foundation-release-asset-gate/summary.md`
- `.harness/evidence/2026-10-12-foundation-release-asset-gate/review.md`
- `docs/harness/tasks/2026-10-12-foundation-release-asset-gate.task.md`

### Modify

- `package.json`：新增 `check:release-assets`（单行新增）。
- `docs/harness/failure-registry.md`：新增 FR-014 一行，并补一条 review note。

### Do Not Touch

- `scripts/foundation-release/publish-foundation-release.mjs`、`build-release-bundle.mjs`、
  `build-release-manifest.mjs`、`cut-foundation-release.mjs`、`release-cli.mjs`、`frontend-ownership.mjs`
- `.github/workflows/release-gate.yml`、`ci.yml`、`quality.yml`、`security.yml`、`smoke-core.yml`、
  `smoke-full.yml`、`branch-hygiene.yml`、`lint-workflows.yml`、`pr-automation.yml`
- `backend/**`、`frontend/**`、`docs/designs/FOUNDATION_RELEASE_MODEL.md`、`releases/**`
- 任何已发布的 GitHub release

## Implementation Notes

- **复用而非重写**：`validateReleaseAssetChecksum` 与 `isMissingGitHubReleaseError` 已由
  `publish-foundation-release.mjs` 导出，直接导入。这既保证校验语义与发布路径完全一致，也避免重复率门禁
  触发 —— 若照抄 `runCommand` / `parseRepoParts` / `resolveRepoFullName`，会形成约 41 行的连续重复块，
  超过 21 行的检出下限。
- **事件竞态**：`publish-foundation-release.mjs` 先 `gh release create` 再 `gh release upload`，
  因此 `release: published` 可能在产物上传途中触发。verify workflow 用 `--wait 600` 轮询，而不是在
  这个竞态上误报。
- **两个 workflow 分工**：verify 在**默认分支**上运行（`release: published` 只在该分支触发）；
  backfill 用两次 checkout —— 发布 commit 用于构建（因为 `build-release-bundle.mjs` 会校验工作树的
  sharedPaths 与 manifest 的 `baseCommit` 一致），默认分支用于取门禁脚本（该脚本在历史 release 中并不
  存在）。
- **失败语义**：只有 `HTTP 404` / `release not found` 才被当作「release 尚未创建」并进入重试；
  HTTP 500 等意外错误直接抛出，绝不退化成「产物缺失」或「一切正常」。
- **本机不可执行的部分**：本机 Node 无法 spawn 任何子进程（`EBUSY`），因此
  `build-release-bundle.mjs` 依赖的 `git rev-parse` / `git archive` 无法运行，bundle 重建在本机跑不通。
  这是为什么回填以 CI workflow 交付、并以静态方式验证可行性，而不是在本机手工产出 50MB 产物。

## Structural Scope

- Affected Subgraph:
  `release tag → publish-foundation-release.mjs → gh release upload → release assets → pantheon-ops materialization`
  与 `release: published → foundation-release-verify.yml → check-release-assets.mjs → 门禁结论`。
- Boundary Crossings: 无。改动只落在发布工程与 CI 门禁；不跨越前后端 module 边界，不改任何共享层契约。
- Risk Nodes: 门禁若只校验「存在」而不校验「校验和」，一个损坏的归档也能通过 —— 因此复用发布路径的
  `validateReleaseAssetChecksum`；`release: published` 与产物上传存在时序竞态 —— 因此用 `--wait` 轮询
  而非直接判失败；回填若默认上传则可能误改已发布 release —— 因此默认 `dry_run: true` 且仅手动触发。
- Graph Focus: 发布契约的可验证性 vs. 对既有发布流程的侵入面之间的取舍。
- 新增文件全部落在既有目录约定内：`scripts/foundation-release/`、`tests/scripts/foundation-release/`、
  `.github/workflows/`、`.harness/**`、`docs/harness/tasks/`。
- 未新增目录层级，未改变任何 module 边界或 import 约定。
- 两个 workflow 均按仓库既有约定以 commit SHA 固定 action，并声明最小权限。

## Execution Roles

- Implementer Posture: 先取实测证据（各版本 release 的 assets 数量、ops 锁的版本、CI 实际跑了什么），
  再动手；门禁必须「失败即红」而不是「记录一下」；修复必须可复核，不碰已发布的 release。
- Reviewer Posture: 复核门禁对四类失败（缺件、缺校验和、校验和不符、release 不存在）是否都返回非零；
  复核校验语义确实复用了发布路径的 `validateReleaseAssetChecksum` 而非另写一套；复核 `--local-only`
  确实不联网；复核意外错误（HTTP 500）被抛出而不是被当成门禁结论；复核 backfill 默认不上传。
- 人工门禁：新检查是否提升为 required check（分支保护），以及是否发起 backfill 修复 v0.14–v0.16。

## Dependency Plan

- 无前置任务。FR-014 与 2026-10-12 的两条 flake 记录（FR-012 / FR-013）同属「信号缺失」这一类，
  但彼此独立，无阻塞关系。
- 本次改动不依赖任何未合并分支或未发布版本。

## Verification Plan

- Unit（hermetic，不联网、不 spawn）：`node --test tests/scripts/foundation-release/check-release-assets.test.mjs`，21/21 通过。
- 正对照（真实 release）：`npm run check:release-assets -- --release-version pantheon-base-v0.13.0 --repo duanxldragon/pantheon-base`，必须 exit 0 并列出四件产物。
- 负对照（真实 release）：`npm run check:release-assets -- --release-version pantheon-base-v0.16.0 --repo duanxldragon/pantheon-base --skip-local`，必须 exit 1 并列出四件缺失。
- 参数校验：`npm run check:release-assets -- --release-version 0.16.0 --repo duanxldragon/pantheon-base --skip-local`，必须 exit 1（版本格式不合法）。
- 本地 bundle 校验：`npm run check:release-assets -- --release-version pantheon-base-v0.16.0 --dist dist/foundation-releases --local-only`，必须不联网且校验本地归档的 SHA-256。
- 发布状态实测：`gh release view <tag> --json assets` 遍历 v0.12.1 / v0.13.0 / v0.14.0 / v0.15.0 / v0.16.0，记录 assets 数量。
- 回填可行性（静态）：在 commit `3fe572f3` 的工作树中执行 `node scripts/foundation-release/build-release-manifest.mjs --release-version pantheon-base-v0.16.0 --release-line release/0.16 --base-commit 3fe572f3...`，再断言 manifest 的 52 条 sharedPaths 在该 commit 下全部存在。
- Workflow 校验：解析两个新增 YAML，并断言每个 `uses:` 匹配 `[^@]+@[0-9a-f]{40}`。
- Repo gates: `npm run check:duplication`、`node scripts/harness/check-failure-registry.mjs`、`node scripts/harness/check-task-packet.mjs`、`node scripts/harness/check-evidence.mjs --strict`。
- 本机不可执行项：`build-release-bundle.mjs`（依赖 `git rev-parse` / `git archive`）与既有 spawn 型测试在本机因 `EBUSY` 无法运行，如实记录并以 hosted CI 为准。

## Evidence Required

- `v0.13.0` 通过（exit 0，列出四件产物，并校验本地两个归档的 SHA-256）。
- `v0.16.0` 失败（exit 1，四件全部报缺失）—— 这正是此前毫无信号的状态。
- 21/21 单元测试通过，含 local-only 的「不得联网」断言与「意外错误必须抛出」断言。
- 各版本 release 的 assets 实测数量（0/0/0/4/4），以及 ops 锁停在 v0.13.0 的实测结果。
- `check:duplication` 通过。
- 回填可行性：commit `3fe572f3` 的 manifest 生成成功，52/52 sharedPaths 齐备。
- 本机无法执行 bundle 重建（`spawnSync` EBUSY）这一限制被如实记录，并给出既有测试 17/40 同样失败的
  基线以证明其环境性。

## Human Gates

- [ ] 是否将 `Verify Release Assets` 加入分支保护 required checks（本 PR 未做，属维护者决策）。
- [ ] 是否对 v0.14.0 / v0.15.0 / v0.16.0 发起 backfill（`dry_run: true` 先看重建结果，再决定是否上传）。
- [ ] 是否在下一个常规版本（预计 v0.17.0）中一并修复产物链路，并补 Consumer Impact Summary。

## Linkage

- Assessment: `docs/harness/tasks/2026-10-12-foundation-release-asset-gate.task.md`
- Evidence: `.harness/evidence/2026-10-12-foundation-release-asset-gate/`
- Summary: `.harness/evidence/2026-10-12-foundation-release-asset-gate/summary.md`
- Review: `.harness/evidence/2026-10-12-foundation-release-asset-gate/review.md`
- Plan refs: `docs/designs/FOUNDATION_RELEASE_MODEL.md`、`docs/VERSION_MANAGEMENT_GUIDE.md`、
  `.github/workflows/release-gate.yml`、`.github/workflows/ci.yml`
- Change ref: none

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] 新增 `check-release-assets.mjs`，复用发布路径已导出的校验器，未引入重复实现。
- [x] 21 条 hermetic 单元测试通过，覆盖通过与各类失败路径。
- [x] 正/负对照在真实 release 上验证（v0.13.0 通过，v0.16.0 失败）。
- [x] `--local-only` 与 `--skip-local` 的冲突组合被显式拒绝。
- [x] 意外错误被抛出，而不是被当成门禁失败。
- [x] `release: published` 触发的校验 workflow 已新增，action 以 SHA 固定。
- [x] 仅手动触发、默认 dry-run 的 backfill workflow 已新增。
- [x] `check:duplication` 通过，未新增重复块。
- [x] FR-014 已登记，枚举值合法。
- [x] 未修改任何发布脚本、既有 workflow 作业、产品源码或已发布的 release。
- [x] 本机无法执行 bundle 重建的限制已记录在 evidence 与 manifest 的 `runtimeGap` 中。
- [ ] 合并后首次 hosted 运行确认两个 workflow 行为符合预期（合并后跟踪）。
