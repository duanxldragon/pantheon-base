---
title: 归档收口两个已完成任务包并补 PR 治理传感器的档案回退（FR-024）
doc_type: Remediation
layer: platform
depends_on_layers: []
status: Archived
linked_contracts:
  - docs/harness/VERIFICATION_EVIDENCE_SPEC.md
  - docs/harness/AI_QUALITY_GOVERNANCE.md
updated_at: 2026-10-31
---

# Task Packet: 2026-10-31-archive-closure-pr-governance

## Goal

两个 2026-10-30 的治理包（`2026-10-30-menu-contract-inline-const`、
`2026-10-30-workflow-sonar-githubactions`）已经合并并在 `main` 上取到终局读数，但
`.harness/tasks/` 里仍留着 6 个 `completed` manifest，`.harness/ARCHIVE.md` 的月度归档
约定要求它们落到 `archive/<YYYY-MM>/`。本轮按约定归档这 6 个任务（manifest 与 evidence
用 `git mv` 移动，`.task.md` 留在文档面），并在准备收口 PR 时撞上 FR-019 那一类的另一半：
`scripts/check-pr-governance.mjs` 用裸 `fs.existsSync` 校验 `Task Manifest` /
`Evidence` / `Verification evidence` / `Review Artifact`，任务一旦归档，引用规范路径的
PR 正文就会被判「file does not exist in repository」。本包把档案回退接进该传感器
（复用 `resolveArchiveAwarePath`，直查优先、失败才回退），并补两条相反方向的单元测试，
使「归档后继续用规范路径引用」这条写在 `ARCHIVE.md` 里的规则对所有 PR 正文成立。
零运行时代码、零门禁阈值变化、零 schema 变化。

## Primary Layer

platform

## Dependency Layers

- `platform`（治理脚本与任务档案面）。不触碰 `system/*`、`business/*`、`backend/**`
  业务代码与 `frontend/src/**`，不改变任何门禁判定语义或阈值。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `not-required`
- Release Requirement: `none`
- Downstream Sync Note: `scripts/check-pr-governance.mjs` 是本仓自有治理脚本，ops 侧有
  自己的副本并按消费者评审演进；本轮不回抄 base 文件到 ops（Base-first 只适用于
  共享底座代码）。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `ci-workflow`
- Portable Failure Class: `static-sensor-gap`
- Owner Layer: `consumer-repository`
- Ratchet Decision: `sensor-added`
- Coverage Dimensions:
  - maintainability
  - method-health

交付层级：**L2**（修改共享治理传感器并移动任务档案树）。

## Contract Anchors

- `docs/harness/AI_QUALITY_GOVERNANCE.md`：同类错误第二次出现必须按 ratchet 升级并落成
  传感器/测试，而不是只补一行文档。
- `docs/harness/VERIFICATION_EVIDENCE_SPEC.md`：读数必须可复现；断言只能等强度替换，
  不能放宽。
- `docs/harness/failure-registry.md`：FR-019（档案回退的首次登记）与 FR-024（本次，
  occurrence=2）。
- `.harness/ARCHIVE.md`：归档移动物理位置、保留规范引用路径。

## Scope

### In

- `.harness/archive/2026-10/tasks/<id>/manifest.json` 与
  `.harness/archive/2026-10/evidence/<id>/`：6 个 `completed` 任务的 `git mv` 归档
  （含 `2026-10-29-v0181-restore-request-guard/notes/` 子目录）
- `.harness/ARCHIVE.md`：统计（88/91、合计 209/215）、`最后更新`、当前活跃任务清单，
  以及本轮归档说明
- `scripts/check-pr-governance.mjs`：`hasExistingRepoFile` 在直查失败后走
  `resolveArchiveAwarePath` 回退
- `tests/scripts/check-pr-governance.test.mjs`：`writeTaskManifest` 增加基目录参数；
  新增「归档路径必须通过」与「既不在线也不归档必须仍报缺失」两条用例
- `docs/harness/failure-registry.md`：FR-024 行 + Review Notes 条目（含对
  `check-evidence` / `check-review` / `generate-pr-body` 的实测残余）
- `.harness/evidence/2026-10-30-workflow-sonar-githubactions/` 的合并后回读记录
  （27 条命令读数、`## Post-merge` 与 `## Post-merge record`、终局勾选项）
- 本任务包、manifest 与 evidence

### Out

- 把档案回退补进 `check-evidence` / `check-review` / `generate-pr-body`：本轮只做实测并
  记入 FR-024 的残余说明——那三个脚本今天只扫描 live 树，归档证据因此不在默认门禁面内；
  补齐需要自带 fixture，不塞进收口轮
- 修改任何门禁阈值、workflow 判定、Sonar 查询条件
- 为 67 个仍标 `status: Active` 的历史任务包正文批量改状态：除本轮两个已实测收口的包，
  其余没有逐条完成证据，批量改写是在制造读数
- `VERSION`、`CHANGELOG.md`、`docs/release-notes/**` 与 foundation release 切版发布
- 未移动的三处刻意保留：`2026-10-29-v0180-simplification-release`（仍 `in-progress`）、
  `2026-09-10-tenant-verification-and-gray/`（归档后被 #427 重写进旧路径的重复产物）、
  两份无归属的散落 PR 正文
- stage 工作树中既有的未提交 i18n 改动

## Expected Files

### Create

- `docs/harness/tasks/2026-10-31-archive-closure-pr-governance.task.md`
- `.harness/tasks/2026-10-31-archive-closure-pr-governance/manifest.json`
- `.harness/evidence/2026-10-31-archive-closure-pr-governance/commands.json`
- `.harness/evidence/2026-10-31-archive-closure-pr-governance/summary.md`
- `.harness/evidence/2026-10-31-archive-closure-pr-governance/review.md`
- `.harness/evidence/2026-10-31-archive-closure-pr-governance/pr-body.md`

### Modify

- `scripts/check-pr-governance.mjs`
- `tests/scripts/check-pr-governance.test.mjs`
- `docs/harness/failure-registry.md`
- `.harness/ARCHIVE.md`
- `docs/harness/tasks/2026-10-30-workflow-sonar-githubactions.task.md`
- `.harness/tasks/2026-10-30-workflow-sonar-githubactions/manifest.json`（移动 + `status`）
- `.harness/evidence/2026-10-30-workflow-sonar-githubactions/*`（移动 + 合并后回读）
- `.harness/tasks/2026-10-30-menu-contract-inline-const/manifest.json` 与其 evidence 树（移动）
- 另外 4 个 `completed` 任务的 manifest 与 evidence 树（移动）

### Do Not Touch

- `backend/**`、`frontend/src/**`
- `.github/workflows/**`、`sonar-project.properties`、`config/**`
- `VERSION`、`CHANGELOG.md`、`docs/release-notes/**`
- `.harness/archive/2026-07|08|09/`（历史月份目录）
- 工作树中既有的未提交 i18n 文件

## Implementation Notes

- 归档只动 manifest 与 evidence，不动 `.task.md`：`check:task-packet` 与
  `readTaskManifest` 已具备按月回退能力，正文留在文档面对其它读者更有用。
- PR 治理传感器必须**先**做直查、失败才回退：回退只是补全解析，不能让一个规范路径
  引用解析到任意月份的同名目录里去了。负向用例（既不 live 也不归档）就是这条边界。
- FR-024 记 occurrence=2 而不是新类：FR-019 已经登记「引用规范路径的校验器需要档案回退」，
  当时只补了变红的两个检查器，没有枚举全部消费方——本次漏网的正是 PR 正文校验器。
  因此这轮的durable部分是把消费方清单写进登记项，而不只是加一个开关。
- 残余用实测而非推断记录：对已归档的 `commands.json` 直接跑
  `check-evidence --strict` 得到 3 条错误（`taskManifest does not exist`、
  `reviewFile does not exist`、`evidenceDir must match the commands.json directory`），
  三个文件在 `archive/2026-10/` 下均存在。
- 收口 PR 引用已归档任务时，PR 正文的 evidence 路径同样依赖本传感器修复——先修传感器
  再移动文件是不可行的顺序（移动已经发生），因此两者同一 PR 内落地并由测试钉住。

## Verification Plan

- `npm run test:pr-governance` → 8/8 绿（含两条新增用例）
- `npm run test:scripts` → 全量脚本测试绿
- `npm run check:task-packet`、`check:task-packet-template`、`check:docs-frontmatter`、
  `check:harness-docs`、`check:harness-inventory`、`check:harness-encoding`、
  `check:structure`、`check:failure-registry`、`check:generated`、
  `check:generated-modules`、`check:ui-quality-gate`、`check:duplication` → exit 0
- `node scripts/harness/check-evidence.mjs --root . --strict`、
  `node scripts/harness/check-review.mjs --root . --strict` → exit 0
- 对已归档 evidence 显式跑 `check-evidence --strict`，把 3 条错误读数记入 evidence
  （证明残余是实测而非猜测）
- 修复的终局对照：取已归档的 `2026-10-30-workflow-sonar-githubactions/pr-body.md`（其链路仍写
  规范路径）合成 event JSON，分别喂给 `git show HEAD:` 导出的旧传感器与修复版——旧版 exit 1
  报 4 条 `file does not exist in repository`，修复版 exit 0；两个探针文件用完即删
- `node scripts/create-pr.mjs --title ... --body-file .harness/evidence/<task-id>/pr-body.md`
  → 包装器对本 PR 正文（指向 live 路径）先跑 `check-pr-governance`，验证修复没有把 live 路径
  的校验一并放宽
- PR 检查回读；合并后 `main` 上 `Release Gate` 继续为 0

## Linkage

- Task ID: `2026-10-31-archive-closure-pr-governance`
- Task Manifest: `.harness/tasks/2026-10-31-archive-closure-pr-governance/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/harness/failure-registry.md`、`.harness/ARCHIVE.md`
- Evidence Directory: `.harness/evidence/2026-10-31-archive-closure-pr-governance/`
- Review File: `.harness/evidence/2026-10-31-archive-closure-pr-governance/review.md`

## Evidence Required

- `test:pr-governance`（含两条新用例）与 `test:scripts` 全量读数
- 同一份已归档 PR 正文在 HEAD 版与修复版传感器上的前后 exit 码与 finding 列表
- 归档移动的 `git mv` 结果与前后目录计数
- 治理检查矩阵读数（含 `check-evidence --strict` / `check-review --strict`）
- 已归档 evidence 上 `check-evidence --strict` 的 3 条错误读数（残余证明）
- `check:harness-adoption --strict` 的前后读数（2 findings → 0）与其 pairing 机制说明
- PR 检查回读与合并后 `main` 的 `Release Gate` 读数

## Human Gates

- 合并按维护者「继续完成未完成的任务」在途指令执行；本仓 main 无分支保护，
  auto-merge 由 `pr-automation` 完成。
- 是否把档案回退继续补进 `check-evidence` / `check-review` / `generate-pr-body`，
  以及是否要新增「归档证据也纳入扫描面」的门禁，属治理面扩容，归维护者裁决。
- `.harness/evidence/2026-09-10-tenant-verification-and-gray/` 的重复产物与两份散落
  PR 正文是否删除，本包只保留并记录，不代为实现删除决定。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] 6 个 `completed` 任务按月归档，`ARCHIVE.md` 统计与清单同步
- [x] PR 治理传感器具备档案回退，且直查优先、负向用例仍报缺失
- [x] FR-024 登记 occurrence=2 并实测记录残余消费方
- [x] 合并后 `main` 的 `Release Gate` 与全量检查保持绿（终局读数，合并后回读）：PR #474 squash 到 `05ee0ec1`，main 七个作业（CI / Code Quality Gates / Core Smoke / Full Smoke / Lint Workflows / Security Gates / Release Gate）全部 success，`SonarCloud Gate` 读数 `Unprocessed SonarCloud issues: 0`，独立 API 复核 total 0 且 gate OK
