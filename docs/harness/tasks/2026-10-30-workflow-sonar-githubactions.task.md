---
title: 修掉 main 上 6 条 githubactions Sonar 缺陷（Release Gate 红灯根因）
doc_type: Remediation
layer: platform
depends_on_layers: []
status: Archived
linked_contracts:
  - docs/harness/VERIFICATION_EVIDENCE_SPEC.md
  - docs/harness/AI_QUALITY_GOVERNANCE.md
updated_at: 2026-10-30
---

# Task Packet: 2026-10-30-workflow-sonar-githubactions

## Goal

`main` 在合并提交 `03e13d48` 上 `Release Gate` 红灯：`SonarCloud Gate` 报
`Unprocessed SonarCloud issues: 6`，6 条全部是 `.github/workflows/**` 的
`githubactions:` 规则缺陷（`S1192` 重复字面量、`S7677` 错误文本走 stdout）。
本包修工作流本体：把每步重复 3 次以上的 `"success"` 字面量提升为 step env 常量
`GATE_OK`，把语义上是错误出口的输出改写到 stderr，把语义上是信息计数但含
`error/critical` 关键字的输出改为「blocking」措辞；同步把两条依赖字面量形态的工作流
守护测试改为断言新形态并额外断言常量声明。不削弱任何门禁、不改阈值、不做 Sonar
后台标记。

## Primary Layer

platform

## Dependency Layers

- `platform`（CI/发布工作流的治理面）。不触碰 `system/*`、`business/*`、
  `backend/**`、`frontend/**`，也不改变任何门禁的判定语义。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `not-required`
- Release Requirement: `none`
- Downstream Sync Note: 工作流是各仓自有的 CI 资产，base 的 gate 逻辑不构成消费者契约；
  ops 侧同名缺陷按消费者仓库自己的评审处理。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `ci-workflow`
- Portable Failure Class: `gate-red-from-unprocessed-debt`
- Owner Layer: `consumer-repository`
- Ratchet Decision: `no-repeat-observed`
- Coverage Dimensions:
  - maintainability
  - method-health

交付层级：**L2**（触碰 `.github/workflows/*`，属本仓高风险面：门禁与发布链路）。

## Contract Anchors

- `docs/harness/AI_QUALITY_GOVERNANCE.md`：门禁红灯的处置纪律——修根因，不做豁免。
- `docs/harness/VERIFICATION_EVIDENCE_SPEC.md`：evidence 记录格式与命令读数可复现要求。
- `docs/harness/failure-registry.md`：FR-023 登记本次缺陷类与升级判断。
- `.github/workflows/release-gate.yml`：`SonarCloud Gate` 的判定即“branch=main 上
  `resolved=false&types=BUG,VULNERABILITY,CODE_SMELL` 必须为 0”。

## Scope

### In

- `.github/workflows/quality.yml`：`Enforce harness governance gate` 与
  `quality-gates` 汇总步各加 step env `GATE_OK: success`，8 + 7 处
  `!= "success"` 改为 `!= "$GATE_OK"`
- `.github/workflows/ci.yml`：`ci-summary` 步加 `GATE_OK`，5 处字面量改常量；
  错误出口 `echo "Critical check did not complete successfully"` 改为
  `echo "Blocking check did not complete successfully" >&2`
- `.github/workflows/release-gate.yml`：CodeQL / Dependabot 计数与通过行的
  `error/critical`、`high/critical` 措辞改为「blocking」（信息行不是错误出口）
- `.github/workflows/security.yml`：zizmor 阻断分支的错误行改写 stderr；
  CodeQL 计数信息行改「blocking」措辞
- `tests/scripts/quality-workflow.test.mjs`、`tests/scripts/release-gate-workflow.test.mjs`：
  断言改到新形态，并新增 `GATE_OK: success` 声明断言（等强度替换，非放宽）
- `docs/harness/failure-registry.md`：FR-023 行与 `Last reviewed`
- 本任务包、manifest 与 evidence

### Out

- 改变任何门禁的判定语义、阈值、needs 关系、`continue-on-error`、必需检查集合
- 用 `NOSONAR` / `//nolint` / 标记 False Positive / 移动 new-code baseline / 放宽
  `Release Gate` 查询条件让读数变绿
- `.github/workflows/**` 中其它未触发规则的 `"success"` 字面量（`release-gate.yml:281-284` 单步
  4 次、`security.yml:108-110` 3 次，以及若干单步 1 次；本次 Sonar 实际报出的最小重复次数是 5，
  它们都在阈值之下，保持最小 diff）
- `VERSION`、`CHANGELOG.md`、`docs/release-notes/**`、foundation release 切版发布
- `pantheon-ops` 仓库（其工作流副本属消费者评审）
- stage 工作树中既有的未提交 i18n 改动

## Expected Files

### Create

- `docs/harness/tasks/2026-10-30-workflow-sonar-githubactions.task.md`
- `.harness/tasks/2026-10-30-workflow-sonar-githubactions/manifest.json`
- `.harness/evidence/2026-10-30-workflow-sonar-githubactions/commands.json`
- `.harness/evidence/2026-10-30-workflow-sonar-githubactions/summary.md`
- `.harness/evidence/2026-10-30-workflow-sonar-githubactions/review.md`
- `.harness/evidence/2026-10-30-workflow-sonar-githubactions/pr-body.md`

### Modify

- `.github/workflows/quality.yml`、`.github/workflows/ci.yml`
- `.github/workflows/release-gate.yml`、`.github/workflows/security.yml`
- `tests/scripts/quality-workflow.test.mjs`、`tests/scripts/release-gate-workflow.test.mjs`
- `docs/harness/failure-registry.md`

### Do Not Touch

- `backend/**`、`frontend/**`
- `sonar-project.properties`、`.github/workflows/{pr-automation,foundation-release*,smoke*,lint-workflows}.yml`
- `VERSION`、`CHANGELOG.md`、`docs/release-notes/**`
- `config/**`（门禁阈值与豁免配置）
- 工作树中既有的未提交 i18n 文件

## Implementation Notes

- 6 条缺陷的 `creationDate` 是 2026-07-02 ~ 2026-10-11，而 2026-10-29T04:50Z 的同一条
  查询（run 40818421372）报 0：这是**重新检出**而非新增债务。因此修复必须落在文件本体，
  任何“等它自己消失”的判断都不成立。
- `S1192` 的计数单位是**单个 step 的 run 脚本**，所以常量声明放在 step `env`，不是
  workflow 顶层——顶层 `env` 会让无关 job 也获得这个名字。
- `S7677` 的判定是「错误文本写到 stdout」。两类行语义不同，处置也不同：
  `::error::` 前缀行本来就是正确写法（未触发规则）；`exit 1` 前的人类可读行应改到
  stderr；纯计数/通过行含 `error|critical` 字样属措辞问题，改措辞而不是改流向，
  否则会把正常日志变成噪声。
- ci.yml 的 `Blocking check did not complete successfully >&2` 同时解决两件事：
  错误出口进 stderr，且不再用 `Critical` 这个词触发同一规则的下一次检出。
- 两条工作流守护测试原本断言字面量形态（`!= "success"`），它们保护的是「该结果变量
  非 success 时门禁必须失败」这一语义。改为断言 `!= "$GATE_OK"` 并**新增**
  `GATE_OK: success` 声明断言后，保护强度不降：常量若被改名或改值，测试同样会红。

## Verification Plan

- `npm run test:quality-workflow`、`npm run test:security-workflow`、
  `npm run test:release-gate-workflow`、`npm run test:ci-bench-perf-smoke-workflow`、
  `npm run test:pr-automation-workflow` → 全绿
- `npm run test:scripts` → 全量脚本测试绿
- 对被改的 run 块做 `bash -n` 语法检查
- 用等价的 shell 片段模拟 `ci-summary` 判定：全 `success` → pass；任一 `failure` → 阻断
- `npm run check:docs-frontmatter`、`check:harness-docs`、`check:harness-inventory`、
  `check:harness-encoding`、`check:structure`、`check:task-packet`、
  `check:task-packet-template`、`check:failure-registry`、`check:duplication`、
  `check:generated`、`check:ui-quality-gate` → exit 0
- `node scripts/harness/check-evidence.mjs --strict`、
  `node scripts/harness/check-review.mjs --strict` → exit 0
- PR 检查回读；合并后 `main` 的 `Release Gate` 必须从 `Unprocessed SonarCloud issues: 6`
  变回 0（这是本包唯一的终局读数，只能在合并后的 push 分析上取得）

## Linkage

- Task ID: `2026-10-30-workflow-sonar-githubactions`
- Task Manifest: `.harness/tasks/2026-10-30-workflow-sonar-githubactions/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/harness/failure-registry.md`、`docs/harness/AI_QUALITY_GOVERNANCE.md`
- Evidence Directory: `.harness/evidence/2026-10-30-workflow-sonar-githubactions/`
- Review File: `.harness/evidence/2026-10-30-workflow-sonar-githubactions/review.md`

## Evidence Required

- 五条工作流守护测试与 `test:scripts` 的读数
- `bash -n` 与被改判定逻辑的行为模拟读数
- 治理检查矩阵读数
- PR 检查回读（含 CodeQL、Lint Workflows、Quality Gates）
- 合并后 `main` 上 `Release Gate` 的 `Unprocessed SonarCloud issues` 读数（6 → 0）

## Human Gates

- 合并按维护者「继续完成未完成的任务」的在途指令执行；`Release Gate` 的终局读数只有
  合并后的 push 分析才能取得，因此本包的“修好了”只能在合并后闭环。
- 若合并后 Sonar 仍在其它工作流文件里重新检出同类缺陷，处置（继续修 vs 调整 Sonar
  扫描范围）归维护者裁决，本包不预先放宽查询条件。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] 6 条 Sonar 缺陷全部在工作流本体修复，未使用任何抑制手段
- [x] 门禁判定语义、阈值、needs、必需检查集合零变化（由守护测试等强度断言证明）
- [x] 合并后 `main` 的 `Release Gate` 读数回到 0（终局闭环，需 push 分析）：PR #473 squash 到 `c1f0b1dd`，Release Gate run `41077154410` completed success，`SonarCloud Gate` 日志记录 `Unprocessed SonarCloud issues: 0` 与 `quality gate … OK`
