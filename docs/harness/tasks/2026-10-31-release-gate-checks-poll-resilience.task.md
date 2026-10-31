---
title: Release Gate 的候选检查轮询不因瞬时空响应判定（fail-closed 保持）
doc_type: Remediation
layer: platform
status: Archived
depends_on_layers: []
linked_contracts:
  - docs/harness/VERIFICATION_EVIDENCE_SPEC.md
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-10-31
---

# Task Packet: 2026-10-31-release-gate-checks-poll-resilience

## Goal

`pantheon-base` main 在 `2bc77797`（PR #476 的 squash 提交）上的 `Release Gate` 作业失败，
失败步骤是 `Candidate Checks / Require successful checks on candidate`（run 41099026855、
job 124212224199）。日志显示该步骤在 attempt 27（17:41:18Z）时状态是正常的——六项必需检查里
只有 `Full Smoke` 还在 `in_progress`，其余全部 `completed/success`；下一轮 17:41:52Z 直接打出
`unexpected end of JSON input` 并 `##[error]Process completed with exit code 1`，中间没有任何
一行 check 读数。这条报文是 `gh` 自己的 Go JSON 解码错误（`jq` 的措辞是 `jq: parse error: …`），
也就是说 `gh api` 这一轮非零退出；旧实现写成 `check_runs=$(gh api "…")`，在
`bash -eo pipefail` 下命令替换带回的非零状态直接终止整步。随后 `Release Gate Summary`
记 failure、`SonarCloud Gate` 因 `needs` 未满足被 `skipped`。

而 `Full Smoke` 在 17:55:21Z 以 success 结束——候选提交本身没有任何质量回归，红的是
门控脚本对传输层瞬时故障的过敏。本包修这条根因：轮询里读不到合法 JSON 时**不产生任何判定**，
在原 240 次预算内继续等待，预算耗尽仍以 `Timed out waiting for required checks` 失败。
判定条件、必需检查集合与 fail-closed 语义一字未改。

## Primary Layer

platform

## Dependency Layers

- `platform`（CI 门控作业 + 其单元测试）。不触碰业务代码、`system/*`、`business/*`、
  底座共享 `pkg/*`、Sonar 配置与告警口径。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: deferred
- Release Requirement: foundation-release
- Downstream Sync Note: ops 有同名 `Release Gate` 概念与本仓 workflow 的继承副本；本修复经
  下一次 foundation release 流向消费者，不手抄。在那之前消费者的同名作业仍带这条过敏。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `ci-workflow`
- Portable Failure Class: `ci-signal-noise`
- Owner Layer: `foundation-source`
- Ratchet Decision: `gate-updated`
- Coverage Dimensions:
  - behaviour
  - runtime-quality
  - architecture-fitness

交付层级：**L2**（改 `.github/workflows/*` 属仓规明确的高风险范围，需两位非作者批准，
其中一位应为 CI/发布负责；本包同时给出本地行为仿真读数）。

## Contract Anchors

- `docs/contracts/PLATFORM_CONTRACT.md`：发布前置检查点的定义与不可弱化要求。
- `docs/harness/VERIFICATION_EVIDENCE_SPEC.md`：结论用读数表达；本包的判定证据是 15 组仿真
  读数 + CI 原始日志读数（含两次仿真自身缺陷的更正）。
- `docs/harness/failure-registry.md`：FR-025 记录「门控脚本把传输层瞬时故障读成判定结果」这一类，
  归入 FR-002 已命名的 `ci-signal-noise`。

## Scope

### In

- `.github/workflows/release-gate.yml` 的 `Require successful checks on candidate` 步骤：
  - `gh api` 调用加 `|| true`，把「这一轮读不到」收敛成空串而非「步骤中止」；刻意**不**加
    `2>/dev/null`——`unexpected end of JSON input` 这类报文是 `gh` 自己（Go `encoding/json`）
    打的，是本包唯一能定位「哪一轮、因为什么读失败」的线索，静音它等于把证据换成猜测；
  - 新增 `jq -e 'has("check_runs")'` 合法性门槛：读不到合法 JSON 时打印
    `Check-runs response unavailable or malformed (attempt N/240); waiting without a verdict.`
    并 `continue`，不进入判定；
  - 循环内取 check_run 的 `jq -c` 加 `|| true`，避免单个字段解析失败中止整步。
- `tests/scripts/release-gate-workflow.test.mjs`：新增一条断言，锁住上述形状，并显式断言
  无保护的 `check_runs=$(gh api "…")` 不得回归、`gh api` 一行不得带 `2>/dev/null`、
  `for attempt in {1..240}` 与 `Timed out waiting for required checks` 必须仍在
  （预算、终局失败与诊断输出都不得被删）。
- `docs/harness/failure-registry.md`：FR-025。
- 任务包、manifest 与 evidence。

### Out

- 必需检查集合（`CI Summary`/`Quality Gates`/`Security Gates`/`Actionlint`/`Full Smoke`/
  `SonarCloud Code Analysis`）的增删——一条没动。
- 轮询预算（240×30s）、超时终局、`A required check failed on $CANDIDATE_SHA` 的 fail-closed 语义。
- `SonarCloud Gate` / `CodeQL Alerts` / `Dependabot Alerts` 的判定口径与告警状态过滤。
- 用 `|| echo "0"`、`continue-on-error`、跳过必需检查或缩小等待预算来让读数变绿——
  既有测试 `security alert API failures block the release instead of using fallback proxies`
  正是禁止这类兜底常量，本包沿用同一立场：瞬时故障只换来「继续等」，不换来「绿」。
- `.foundation/**`、`ops` 侧任何文件、`VERSION` / `CHANGELOG.md` / foundation release 切版。

## Expected Files

### Create

- `docs/harness/tasks/2026-10-31-release-gate-checks-poll-resilience.task.md`
- `.harness/tasks/2026-10-31-release-gate-checks-poll-resilience/manifest.json`
- `.harness/evidence/2026-10-31-release-gate-checks-poll-resilience/commands.json`
- `.harness/evidence/2026-10-31-release-gate-checks-poll-resilience/summary.md`
- `.harness/evidence/2026-10-31-release-gate-checks-poll-resilience/review.md`
- `.harness/evidence/2026-10-31-release-gate-checks-poll-resilience/pr-body.md`

### Modify

- `.github/workflows/release-gate.yml`
- `tests/scripts/release-gate-workflow.test.mjs`
- `docs/harness/failure-registry.md`

### Do Not Touch

- `.github/workflows/` 除 `release-gate.yml` 以外的文件
- `sonar-project.properties`、`.foundation/**`
- `VERSION`、`CHANGELOG.md`、`docs/release-notes/**`
- `backend/modules/system/i18n/builtin_locale_resources.json` 与
  `frontend/src/i18n/resources/*.ts`（工作树中既有的未提交 i18n 改动，属别的在途工作，
  本 PR 不 stage、不提交、不背书）

## Implementation Notes

- 中止机制是 `-e` 与命令替换的组合，而不是显式的错误处理缺失：日志末尾那行
  `unexpected end of JSON input` 是 `gh` 自己（Go `encoding/json`）的报文——`jq` 遇到坏 JSON
  说的是 `jq: parse error: Invalid JSON text`。所以触发路径是**那一轮 `gh api` 非零退出**，
  旧写法 `check_runs=$(gh api "…")` 把命令替换带回的非零状态交给赋值语句，
  `bash -eo pipefail` 立即结束整步。修复把这条路径显式化：`|| true` 吸收状态码，
  再用「是否是含 `check_runs` 的合法 JSON」决定是否进入判定，使结论不再依赖 `-e`
  在特定 runner 上的传播细节。
- 「读不到」有三种形态，旧实现里它们各自把门控变成假红，形状不同（本地仿真逐条实测）：
  A `gh` 非零退出（CI 实测到的那一支）——`jq` 根本不会跑到，整步以 exit 1 中止、零行判定；
  B `gh` 返回 0 但 body 不可解析（截断 / 非 JSON）——下游 `jq` 报解析错误并被 `-e` 放大，
  同样在第 1 轮中止，只是出口码是 2；C `gh` 返回 0 且 body 为空——`jq` 对「没有 JSON 值」
  的输入是零输出 + 退出 0，于是六项 check 全部读成「not present yet」，跑满 240 轮后以
  `Timed out` 假红收场。两处守卫合起来才覆盖三支：`|| true` 卸掉 A 的状态码，
  `jq -e 'has("check_runs")'` 把 B 与 C 都挡在判定之外（B 走解析失败、C 走「无值」的
  非零退出）。只按字符串判空的写法只能看见 C。
- 吸收状态码不吸收诊断：`|| true` 后保留 `gh` 的 stderr（不加 `2>/dev/null`），并把这条
  约束写成测试断言。理由是可逆性——下次再红时日志里必须还有「哪一轮、因为什么读失败」，
  否则门控变成不可诊断组件，只能靠重试次数猜。
- 「这次红本来会自己好」有机器读数：job 124212224199 在 17:41:52Z 中止，而它等的
  `Full Smoke` check run 在 **17:43:54Z** 变 `completed/success`（对应 workflow run
  41099026988 整体 17:55:21Z 收尾）。也就是说门控在真正满足条件前约 2 分钟自杀，
  候选提交没有任何回归；这类红的成本是发布证据链断一环（`SonarCloud Gate` 被 `skipped`），
  不是「多跑一次」。
- fail-closed 三处保持：持续读不到 → 耗尽 240 次预算仍 `Timed out` + `exit 1`；
  `conclusion != success` → 立即 `A required check failed` + `exit 1`；`failed=1` 的优先级
  不被 `pending` 分支吃掉。仿真读数逐条对应这三处。
- 本包刻意不动 `gh api` 的分页（`per_page=100`）与 `sort_by(.started_at) | last` 取最新
  check_run 的语义：那是既有判定口径，改它会连带改变「同名检查多次出现时取哪一次」的含义。

## Verification Plan

- `npm run test:release-gate-workflow` → 8 tests / 8 pass（含本包新增断言）
- `npm run test:scripts` → 184 tests / 184 pass / 0 fail
- CI 原始日志读数：run 41099026855 / job 124212224199 的 attempt 27 六项 check 读数、
  17:41:52Z 的 `unexpected end of JSON input` 与 `##[error]Process completed with exit code 1`、
  `Full Smoke` 17:43:54Z `completed/success`、`SonarCloud Gate` `skipped`
- 行为仿真（`.tmp/rgsim/`：run 块按 10 空格缩进边界从 YAML 机械抽出，修复版 51 行与
  `git show HEAD:` 版 40 行各一份，`{1..240}` 保留、仅 `sleep 30`→`sleep 0`，另有把循环
  缩为 `{1..8}` 的同逻辑对照版；`gh`/`jq` 为本地替身，每轮跑在独立临时状态目录里）读数，
  逐条为 `exit= / gh_calls= / 判定行数 / 等待行数`：
  1. 无保护 + `gh` 非零（A）→ `exit=1 gh_calls=1 判定=0 等待=0`，只留一行 `gh` 报文（复现 CI 形态）
  2. 无保护 + 非 JSON（B）→ `exit=2 gh_calls=1 判定=0 等待=0`，只留一行 `jq: parse error`
  3. 无保护 + 空体（C）→ `exit=1 gh_calls=240 判定=0 等待=240`，终局 `Timed out`
  4. 修复 + 六项全 completed/success → `exit=0 gh_calls=1 判定=6 等待=0`，`All required checks passed`
  5. 修复 + 一项 `conclusion=failure` → `exit=1 gh_calls=1 判定=6 等待=0`，`A required check failed`
  6. 修复 + 前 2 轮空体 / 3-4 轮截断 / 之后全绿 → `exit=0 gh_calls=5 判定=6 等待=4`
  7. 修复 + 持续 A / B / C 三种形态（`{1..240}` 真预算）→ 三种读数一致：
     `exit=1 gh_calls=240 判定=0 等待=240`，每轮 `waiting without a verdict`，终局 `Timed out`
     ——吸收失败只换来「继续等」，从不换来「绿」，也不会变成无限等待
- `bash -n` 对两份抽取出的 run 块
- 对照回读：新 main `e17eaaa1`（PR #477 squash）的 `Release Gate` 实跑结论
- `npm run check:failure-registry`、`check:task-packet`、`check:task-packet-template`、
  `check:docs-frontmatter`、`check:structure`、`check:harness-encoding`、`check:duplication`
- `node scripts/harness/check-evidence.mjs --root . --strict`、`check-review.mjs --root . --strict`
- `node scripts/create-pr.mjs --title … --body-file .harness/evidence/…/pr-body.md`
- `git diff --numstat` 证明改动面只有 workflow 一个步骤、测试一条断言、registry 一处

## Linkage

- Task ID: `2026-10-31-release-gate-checks-poll-resilience`
- Task Manifest: `.harness/tasks/2026-10-31-release-gate-checks-poll-resilience/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/harness/failure-registry.md`、`docs/harness/VERIFICATION_EVIDENCE_SPEC.md`
- Evidence Directory: `.harness/evidence/2026-10-31-release-gate-checks-poll-resilience/`
- Review File: `.harness/evidence/2026-10-31-release-gate-checks-poll-resilience/review.md`

## Evidence Required

- `commands.json`：CI 失败作业与原始日志读数、15 组仿真读数（含 jq 替身退出码校正与
  仿真状态隔离两次自我更正）、`test:release-gate-workflow`
  与 `test:scripts` 读数、治理门禁读数、新 main 提交的 `Release Gate` 对照读数
- `summary.md`：中止机制（`-e` × 命令替换）、为何不能靠加大预算解决、fail-closed 保持点
- `review.md`：逐条 reviewer posture 读数 + Machine Readable 块

## Human Gates

- `.github/workflows/*` 是本仓明确的高风险范围：需两位非作者批准，其中一位应为 CI/发布负责。
  本包不自批、不改评审规则；auto-merge 由 `pr-automation.yml` 打开，若维护者认为该范围必须
  人工把关，可关闭 auto-merge 后按评审推进。
- 不切 foundation release、不动 `VERSION`/`CHANGELOG`：ops 吸收本修复需一次发布，时点归维护者。
- 工作树中既有的未提交 i18n 改动本 PR 显式不 stage。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] 必需检查集合、240 次预算与超时终局一字未改，且有断言锁住
- [x] 15 组仿真读数实测：读不到的三种形态只等待不判定（两支中止、一支耗尽）、全绿仍通过、失败仍 fail-closed
- [x] 未使用兜底常量、continue-on-error、跳过检查或降阈值让读数变绿
- [x] FR-025 写入 failure-registry
