---
title: 已完成任务归档与规范引用解析
doc_type: Remediation
layer: platform
depends_on_layers: []
status: Active
linked_contracts:
  - docs/harness/AI_QUALITY_GOVERNANCE.md
updated_at: 2026-10-29
---

# Task Packet: 2026-10-29-harness-task-archive

## Goal

把 `.harness/` 下状态为 `completed` 的任务全部按月归档，让活跃目录回到"只留进行中工作"的状态，
并让规范路径引用在归档后继续有效。

归档动作本身是安全的移动（`git mv`），但会同时改掉两类路径：

- `.harness/tasks/<task-id>/manifest.json` 与 `.harness/evidence/<task-id>/` 的物理位置；
- 88 个任务包、`docs/reviews/*.md` 与 `.harness/ARCHIVE.md` 里指向它们的引用。

第一类已由 `scripts/task-manifest.mjs` 的 manifest 回退覆盖（2026-09-25 轮次建立），第二类没有：
归档后 `npm run check:task-packet` 的警告从 42 涨到 86，`npm run check:harness-docs` 直接变红。
本包把"证据"与"任务包"的解析也做成归档感知，使引用继续使用规范路径、由解析器找到实际位置，
从而让归档成为可重复执行的常规动作，而不是每轮都要重写文档或忍受假警告。

## Primary Layer

platform

## Dependency Layers

- `platform`（`scripts/` 治理脚本 + `.harness/` 归档布局）。不改后端、前端、workflow、
  接口、路由、权限或任何产品行为。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `none`
- Release Requirement: `none`
- Downstream Sync Note: 只涉及 base 自有治理脚本与历史证据的存放位置，消费方无需动作。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `docs-governance`
- Portable Failure Class: `archive-reference-rot`
- Owner Layer: `foundation-source`
- Ratchet Decision: `sensor-added`
- Coverage Dimensions:
  - maintainability
  - method-health

交付层级：**L1**（归档移动 + 三个消费方补回退，验证集合固定）。

## Contract Anchors

- `docs/harness/AI_QUALITY_GOVERNANCE.md`：归档与引用一致性的治理边界。
- `docs/harness/failure-registry.md`：本包新增 FR-019 的落点。
- `.harness/ARCHIVE.md`：归档布局、统计与"规范引用不随物理移动而改写"的约定。
- `scripts/task-manifest.mjs`：`readTaskManifest` 已有的 manifest 档案回退，本包按其模式扩展。

## Scope

### In

- 把 `.harness/tasks/<task-id>/` 中 `status: "completed"` 的 87 个目录 `git mv` 到
  `.harness/archive/<YYYY-MM>/tasks/<task-id>/`（月份取任务 ID 前缀）
- 把对应的 86 个 `.harness/evidence/<task-id>/` 移到
  `.harness/archive/<YYYY-MM>/evidence/<task-id>/`，另移 3 个无任务包的孤儿证据目录
- `scripts/task-manifest.mjs`：新增 `findArchivedReferencePath` / `resolveArchiveAwarePath`，
  复用月份枚举（`listArchiveMonths`）
- `scripts/harness/check-task-packet.mjs`：`Review File` 与 `Contract Anchors` 的存在性判定
  改用上述解析器
- `scripts/harness/check-doc-links.mjs`：文档指向 `.harness/{tasks,evidence}/...` 的链接
  在目标已归档时仍然通过
- 测试：`tests/scripts/task-manifest-archive.test.mjs`、
  `tests/scripts/harness-check-task-packet-context.test.mjs` 扩充，
  新增 `tests/scripts/harness-check-doc-links-archive.test.mjs`
- `.harness/ARCHIVE.md`：统计口径改为实测目录数，补 2026-10 轮次与残余说明
- `docs/harness/failure-registry.md`：新增 FR-019
- `.harness/STATUS.md`：记录本轮归档读数

### Out

- 不移动 `docs/harness/tasks/*.task.md`：历史轮次的约定是任务包文档留在原处，
  只移动 manifest 与证据；打包文档会让 `check-task-packet` 失去对历史包的结构约束
- 不动 `2026-10-27-codebase-simplification-program`（`in-progress`）
- 不删除、不覆盖任何内容：重复 png、散落 PR 正文都原地保留并记录
- 不改后端、前端、`.github/workflows/*`、`sonar-project.properties`、依赖
- 不改 `check-evidence` / `check-review` 的"空集合即报错"语义（门禁策略属维护者决策）

## Expected Files

### Create

- `docs/harness/tasks/2026-10-29-harness-task-archive.task.md`
- `.harness/tasks/2026-10-29-harness-task-archive/manifest.json`
- `.harness/evidence/2026-10-29-harness-task-archive/commands.json`
- `.harness/evidence/2026-10-29-harness-task-archive/summary.md`
- `.harness/evidence/2026-10-29-harness-task-archive/review.md`
- `.harness/evidence/2026-10-29-harness-task-archive/pr-body.md`
- `tests/scripts/harness-check-doc-links-archive.test.mjs`

### Modify

- `scripts/task-manifest.mjs`
- `scripts/harness/check-task-packet.mjs`
- `scripts/harness/check-doc-links.mjs`
- `tests/scripts/task-manifest-archive.test.mjs`
- `tests/scripts/harness-check-task-packet-context.test.mjs`
- `.harness/ARCHIVE.md`
- `docs/harness/failure-registry.md`
- `.harness/STATUS.md`
- `.harness/tasks/**`、`.harness/evidence/**`（移动，见 Scope）

### Do Not Touch

- `backend/**`、`frontend/**`
- `.github/workflows/*`、`sonar-project.properties`
- `package.json`、`package-lock.json`（不新增依赖）
- `.harness/evidence/2026-09-10-tenant-verification-and-gray/`、
  `.harness/evidence/2026-09-25-pr347-governance-body.md`、
  `.harness/evidence/2026-09-27-v0130-pr-body.md`

## Implementation Notes

- 归档脚本按 manifest 的 `status` 字段筛选取值，不按目录名猜；月份取任务 ID 的 `YYYY-MM`
  前缀，因此跨月任务按开工月份落位，统计口径可复算。
- 移动前做了目标存在性检查：176 次移动、0 次与既有归档路径冲突。
- 回退解析统一在 `resolveArchiveAwarePath`：先看活跃路径，再按月份从新到旧查
  `archive/<YYYY-MM>/{tasks,evidence}/<task-id>/<remainder>`。`tasks/` 与 `evidence/`
  共用一张表（`ARCHIVABLE_TREES`），因为两者的归档布局同构。
- `check-doc-links` 只对解析后落在仓库内的目标做回退，指向仓库外的链接维持原判断。
- 判定标准是"引用是否仍然可解析"，不是"文件是否还在活跃目录"，所以归档后
  `.harness/tasks/` 为空也不影响任务包校验。

## Verification Plan

- `npm run check:task-packet` → 记录归档前 42、归档后无回退 86、有回退 14 三条读数
- `npm run check:harness-docs` → 归档后无回退 3 findings，有回退 0 findings
- `node --test tests/scripts/task-manifest-archive.test.mjs`、
  `tests/scripts/harness-check-task-packet-context.test.mjs`、
  `tests/scripts/harness-check-doc-links-archive.test.mjs` → 全过
- `npm run check:structure`、`check:harness-encoding`、`check:docs-frontmatter`、
  `check:harness-inventory`、`check:harness-adoption`、`check:harness-visual`、
  `check:ui-quality-gate`、`check:failure-registry`、`check:duplication` → 0 findings
- `node scripts/harness/check-evidence.mjs --root . --strict`、
  `node scripts/harness/check-review.mjs --root . --strict` → 本包证据在位后 exit 0
- `node scripts/harness/check-boundaries.mjs --root . --strict`、
  `check-runtime-evidence.mjs --root . --strict` → 无新增 finding

## Linkage

- Task ID: `2026-10-29-harness-task-archive`
- Task Manifest: `.harness/tasks/2026-10-29-harness-task-archive/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Plan References: `.harness/ARCHIVE.md`、`docs/harness/AI_QUALITY_GOVERNANCE.md`
- Evidence Directory: `.harness/evidence/2026-10-29-harness-task-archive/`
- Review File: `.harness/evidence/2026-10-29-harness-task-archive/review.md`

## Evidence Required

- 归档前后 `.harness/{tasks,evidence}` 与 `archive/<YYYY-MM>/` 的目录计数
- 三条 `check:task-packet` 警告读数（归档前 / 无回退 / 有回退）
- `check:harness-docs` 的三条 finding 与回退后的 0 finding
- 新增与扩充测试的通过读数
- 治理门禁读数
- 已知残余（重复 png、散落 PR 正文、`check-evidence` 空集合语义）

## Human Gates

- 无。归档是可逆的 `git mv`，不涉及规则、阈值或门禁策略变更。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] 87 个 `completed` 任务与 89 份证据已按月归档，0 冲突
- [x] 归档后 `check:task-packet` 警告数不高于归档前
- [x] 未删除或覆盖任何既有内容
