## 变更摘要

- 改动层级：`platform`（CI 发布门控作业 + 其单元测试 + failure-registry）
- 改动模块：`.github/workflows/release-gate.yml` 的 `Candidate Checks / Require successful checks on candidate` **一个步骤**（`13 insertions(+), 2 deletions(-)`，删除的 2 行都在同一个 `run` 块内）、`tests/scripts/release-gate-workflow.test.mjs` 一条用例（`28/0`）、`docs/harness/failure-registry.md` 的 FR-025（`23/0`），加本包任务文档、manifest 与 evidence
- 目标问题：底座 main `2bc77797` 的 `Release Gate` 在 `Candidate Checks` 一步判红（run 41099026855 / job 124212224199）。日志末尾是 17:41:18Z 的 attempt 27 **正常等待**（六项必需检查：五项 `completed/success`，`Full Smoke` 仍 `in_progress`）→ 34 秒后 17:41:52Z 一行 `unexpected end of JSON input` → `##[error]Process completed with exit code 1`，中间**没有任何 check 读数行**。这条报文是 `gh` 自己（Go `encoding/json`）的措辞（`jq` 说 `parse error: Invalid JSON text`），因此触发路径是那一轮 `gh api` **非零退出**，旧写法 `check_runs=$(gh api "…")` 把命令替换带回的非零状态交给赋值语句，`bash -eo pipefail` 直接结束整步。而它等的 `Full Smoke` 在 **17:43:54Z** 就 `completed/success`（对应 workflow run 41099026988 整体 17:55:21Z 收尾）——门控在自身条件满足前约 2 分钟自杀，候选提交零回归；下游 `Release Gate Summary` 记 failure、`SonarCloud Gate` 因 `needs` 被 `skipped`。
- 预期影响：把「读不到」与「判定」在同一个 run 块里分开。`gh api` 用 `|| true` 吸收状态码但**保留 stderr**（那是唯一能定位「哪一轮、因何失败」的线索）；新增 `jq -e 'has("check_runs")'` 门槛，把空体 / 截断体 / 非 JSON 三种形态统一收敛成 `Check-runs response unavailable or malformed (attempt N/240); waiting without a verdict.` 后 `continue`；循环内取 check_run 的 `jq -c` 同样吸收自身失败。**必需检查集合六项、`for attempt in {1..240}`、两处 `sleep 30`、`A required check failed` 的立即失败、`Timed out` 的终局失败全部一字未动**，并被新用例反向锁住。零产品运行面变化：不改任何后端/前端代码、路由、权限、schema 或前后端契约。

## Harness 链路

- Task ID：2026-10-31-release-gate-checks-poll-resilience
- Task Manifest：.harness/tasks/2026-10-31-release-gate-checks-poll-resilience/manifest.json
- Evidence：.harness/evidence/2026-10-31-release-gate-checks-poll-resilience/commands.json
- Verification evidence：.harness/evidence/2026-10-31-release-gate-checks-poll-resilience/summary.md
- Review Artifact：.harness/evidence/2026-10-31-release-gate-checks-poll-resilience/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：ci-workflow
- Ratchet Decision：gate-updated
- GitHub Signal：external-flaky

> Quality Profile 选 `ci-workflow`：改动对象是发布门控工作流自身的脚本形状。
> GitHub Signal 选 `external-flaky`：红来自外部 checks API 的一次非零响应，不是本仓代码或
> 任一必需检查的结论；本包不否认外部抖动存在，只否认「抖动有权决定发布门」。
> Ratchet Decision 选 `gate-updated`：这条类的持久控制点就在门控里——既有测试只把
> `release-gate.yml` 当文本读，从未执行过轮询循环，所以「读不到」与「判定」的分离必须写进
> 门控本身，并由同一文件里的断言锁住形状。

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-10-31-release-gate-checks-poll-resilience
- task manifest: .harness/tasks/2026-10-31-release-gate-checks-poll-resilience/manifest.json
- evidence: .harness/evidence/2026-10-31-release-gate-checks-poll-resilience/commands.json
- boundaries: `.github/workflows/release-gate.yml` 单一步骤的读取路径 + 该步骤的单元测试 + FR-025；不动必需检查集合、不动轮询预算、不动下游作业口径、不动 `.foundation/**`、不动消费者仓库、不切发布
- backend response contract: not-applicable（无任何后端代码、接口或响应结构改动）
- backend DTO contract: not-applicable
- permission contract: not-applicable（无权限键变化；本包唯一的「门禁」是 CI 发布门控，其判定口径未变）
- audit coverage: not-applicable（无审计链路改动）
- visual evidence: not-applicable（无 UI 面；改动只存在于 Actions 脚本与其静态断言）
- inheritance contract: Base-first——门控脚本在底座修，消费者的同名 workflow 概念经下一次发布或维护者显式同步吸收，不手抄（Release Requirement：foundation-release）
- base drift: not-applicable（本包不动 `.foundation/allowed-drift.json`，两侧 workflow 不属 shared-drift 比对资产）
- CI gate posture: fail-closed 保持不变——持续读不到 → 耗尽 240 次预算后 `Timed out` + `exit 1`；任一必需检查 `conclusion != success` → 立即 `A required check failed` + `exit 1`；无 `|| echo` 兜底常量、无 `continue-on-error`、无跳过检查

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

> 代码面只有 `.github/workflows/release-gate.yml` 里 `Require successful checks on candidate`
> 步骤的 `run` 块：一处 `|| true`、一个 `jq -e` 门槛 + `continue` 分支、一处循环内 `|| true`。
> 删除的 2 行是这两条语句的原形，位置相邻；`on:`、`permissions:`、`needs:`、其余五个 job
> （`codeql-alerts` / `dependabot-alerts` / `sonarcloud-gate` / `open-prs` /
> `release-gate-summary`）一字未动，YAML 解析后作业集合保持
> `candidate-checks / codeql-alerts / dependabot-alerts / sonarcloud-gate / open-prs / release-gate-summary`。
> 工作树中既有的 6 个未提交 i18n 文件（`backend/modules/system/i18n/builtin_locale_resources.json` +
> `frontend/src/i18n/resources/*.ts`）属别的在途工作，本 PR 不 stage、不提交、不背书。

## 验证记录

- [x] CI 原始日志读数（失败根因）：job 124212224199 末尾 `Waiting for candidate checks (attempt 27/240)...`（17:41:18Z）→ `unexpected end of JSON input`（17:41:52.840Z）→ `##[error]Process completed with exit code 1.`（17:41:52.844Z），其间零行 check 读数；该措辞属 `gh`（Go）而非 `jq`
- [x] 反证「红不是质量回归」：同一候选 `2bc77797` 上 `Full Smoke` check run **17:43:54Z `completed/success`**（workflow run 41099026988 整体 17:55:21Z 收尾），其余五项在 17:27:57Z–17:32:34Z 已 success；`Candidate Checks failure 17:42:51Z`、`SonarCloud Gate skipped 17:42:51Z`
- [x] 行为仿真 15 组（把 run 块按 10 空格缩进边界从修复版 YAML（51 行）与 `git show HEAD:` 版（40 行）**机械抽出**，只把 `sleep 30`→`sleep 0`，循环 `{1..240}` 原样保留；`gh`/`jq` 为本地替身，每个 scenario 独立状态目录、严格串行；四份脚本均 `bash -n` 通过）。读数记作 `exit / gh_calls / 判定行 / 等待行`：
  - 无保护版 + `gh` 非零 → `1 / 1 / 0 / 0`，只留一行 `gh` 报文——与 CI 日志「attempt 27 之后零行 check 读数即中止」同形
  - 无保护版 + 非 JSON 文本 → `2 / 1 / 0 / 0`，只留一行 `jq: parse error`（`-e` 放大下游 jq 的解析失败）
  - 无保护版 + 空体 → `1 / 240 / 0 / 240`：**不中止，而是跑满真预算**变成 `Timed out` 假红（jq 对「无 JSON 值」的输入是零输出 + 退出 0，六项全读成 not present yet）
  - 修复版 + 全绿 → `0 / 1 / 6 / 0`，`All required checks passed`（0 轮等待，不引入额外延迟）
  - 修复版 + `Full Smoke: completed/failure` → `1 / 1 / 6 / 0`，第 1 轮即 `::error::A required check failed`（fail-closed 未被重试吞掉）
  - 修复版 + failure 与 `in_progress` 并存 → 同形读数、终局仍是 `A required check failed`：`failed` 优先级不被 `pending` 分支吃掉（无保护版对同一 fixture 给出同样的 exit 1 / 6 判定行，两版在「有结论」时完全等价）
  - 修复版 + 前 2 轮空体、3-4 轮截断、第 5 轮起全绿 → `0 / 5 / 6 / 4`，4 次 `waiting without a verdict` 后 exit 0（即 `2bc77797` 那一次若脚本不过敏应有的结局）
  - 修复版 + 持续 `gh` 非零 / 空体 / 非 JSON 三组 → 读数一致 `1 / 240 / 0 / 240`，每轮只打 `waiting without a verdict`，终局 `::error::Timed out waiting for required checks`（「只等待、不判定、不转绿」；`{1..8}` 对照版给出同形结论，说明该结论不依赖循环规模）
- [x] `npm run test:release-gate-workflow` → **tests 8 / pass 8 / fail 0**（含本包新增用例；其中既有 `release gate requires every aggregate check on the candidate SHA` 逐项锁六项必需检查、`security alert API failures block the release instead of using fallback proxies` 锁「不许用兜底常量」，两者本次仍通过）
- [x] `npm run test:scripts` → **tests 184 / pass 184 / fail 0**（全量脚本层测试无回归）
- [x] YAML 完整性：`python -c "import yaml; yaml.safe_load(...)"` → OK，六个 job 集合不变
- [x] 治理矩阵：`check:failure-registry --strict` → 1 file / 0 error / 0 warning（`[PASS]`）、`check:docs-frontmatter` → 404 docs 通过、`check:task-packet-template` → OK、`check:task-packet` → 本包 PASS、`check:structure` → strict 0 finding / 2960 files、`check:harness-encoding` → strict 0 finding / 2612 files、`check:duplication` → PASS
- [x] 证据契约：`check-evidence.mjs --root . --strict` 与 `check-review.mjs --root . --strict` → 本包 0 error
- [x] 对照回读：新 main `e17eaaa1`（PR #477 squash）的 `Release Gate` run 41107553430 = **completed/success**（18:30:43Z→18:54:01Z，`Candidate Checks` 18:30:46Z→18:53:47Z），同 sha 34 项 check 全绿、`SonarCloud Gate` 正常执行并成功。**本包不声称修好了某一次历史红**，只声称消除该类的复发条件；该 sha 未复现属同类抖动未命中，不是反证
- [x] 仿真产物不入库：`.tmp/rgsim/`（含替身、抽出脚本、响应 fixture、CI 日志副本）已删除，`git status --short` 只剩本包文件与既有未提交 i18n 改动
- [x] 未使用任何弱化手段：diff 无 `NOSONAR` / `//nolint` / `eslint-disable` / `continue-on-error` / 阈值调整 / 白名单条目 / 兜底常量；`gh api` 一行不含 `2>/dev/null`；未减必需检查、未放大或缩小轮询预算
- [ ] hosted 侧最终结论：以本 PR 的 `Lint Workflows` / `Actionlint` / `Release Gate` 与合并后 main 实跑为准（见审核留痕，合并前为 pending）
- [ ] GitHub required checks 通过：`main` 无分支保护（required contexts 由 workflow 结论 + 维护者批准承担）

补充说明：本改动**没有产品运行面**，也不新造运行时驱动。它的运行证据只能来自 hosted CI，
因此给的是三层：失败那次的原始 job 日志读数、同一 run 块在本地替身下的 15 组行为读数、
以及新 main 的实跑对照。本地仿真不替代 hosted 结论——`jq` 是 bash 替身（本机无 jq 本体，
只实现该步骤用到的三个过滤器，并对齐 jq 的退出码形状：合法含键 0 / 合法缺键 1 / 不可解析 2 /
无 JSON 值 4，JSON 合法性用首尾括号形状近似而非完整解析）、`sleep` 被归零、`gh` 由脚本回放。

## 审核留痕

- Copilot review：requested（由 PR Automation 自动请求）
- CodeQL 结果：pending。代码面是 Actions 里的 bash 片段，不新增 sink；合并后按 `CodeQL Security` job 结论回读。
- SonarCloud 结果：pending。本改动不触碰被 Sonar 分析的产品源码（workflow YAML 与 `.mjs` 测试），预期只影响 `Release Gate` 自身的稳定性；合并后按 `SonarCloud Gate` 读数回读。
- GitHub checks 结果：pending（`main` 未设 required contexts，结论以 workflow 实跑为准）；本 PR 的 `Actionlint` 是这条脚本形状是否能被 hosted 接受的第一道读数。
- Auto-merge：由 `pr-automation.yml` 在 PR 打开后自动开启（SQUASH + delete-branch），与本轮既有 PR 一致。已记录的机制事实：自动化 squash 合并会在底座 main 触发 7 个 push 型工作流，回读按 sha 查询即可。
- Duplication Gate 结果：ran（`npm run check:duplication` → PASS）
- **是否高风险改动：yes。** `.github/workflows/*` 在 `repo-pr-gate` 中被明确列为高风险范围——**需至少两位非作者批准，其中一位应为 CI/发布负责**。本包不自批、不改评审规则；`pr-automation.yml` 会自动打开 auto-merge，若维护者认为发布门控脚本必须人工把关，请在合并前关闭 auto-merge。
- 三次自我更正（如实留痕，全部已回落到任务包 / summary / evidence）：
  - ① 初稿把根因写成「空响应喂给 `jq`、`-e` 放大 jq 的非零」，并据此认为「同一份无保护脚本在本地 Git Bash 下不会中止、差异属 runner 语义」。两处错误：日志里的报文属 `gh` 而非 `jq`；抽出脚本时漏掉了 `done` 之后的 `Timed out` + `exit 1` 两行终局，使无保护版看起来「只是跑满预算」。
  - ② 补齐抽取尾部后，又踩到替身退化：为跑得起 240 轮把 `jq` 从 Python 换成纯 bash 时丢了「输入不可解析 ⇒ 非零退出」这一支，于是空体与非 JSON 两支被混为一谈。按 jq 真实退出码补齐（0/1/2/4）并逐支探针后结论稳定：**`gh` 非零与不可解析 body 都在第 1 轮中止（exit 1 / 2、零判定行），空 body 不中止而是耗尽 240 轮变 `Timed out` 假红**——旧实现的假红有三种形状，这也是为什么 `[ -z ]` 或单独的 `|| true` 都盖不全，必须两支守卫一起上。
  - ③ 同一 fixture 在全预算版与 `{1..8}` 版下等待轮数一度不一致，定位到被 stop 的后台任务留下仍在 `sleep` 的孤儿 `poll.sh` 子进程，与新运行共享 `state/count`。改为每 scenario 独立 mktemp 状态目录 + 严格串行后两种规模读数一致。教训：共享状态的并发回放本身就是不可复现的读数来源。
- 保留 `gh` stderr 的决定：`|| true` 只吸收退出状态、不吸收诊断。若写成 `2>/dev/null || true`，同样能止住红，但下一次红时只剩重试次数可看。这条约束写成了测试断言，防止后来者「顺手静音」。
- Ratchet 说明：`gate-updated` —— 该类失败（FR-025，归入 FR-002 已命名的 `ci-signal-noise`）的控制点在门控自身：既有 workflow 测试只把 YAML 当文本读，从未执行轮询循环，所以「无法观察」与「观察到坏」的分离必须写进门控脚本，并由同文件的断言锁住形状（含反向断言：无保护调用、`2>/dev/null`、删预算三种退化都会红）。不新增传感器、不改治理指南。
- Residual risk / follow-up：① hosted 真实 `jq`/`gh` 的 `-e` 传播组合仍只能由 CI 实跑确认，若新 main 再红按同一入口继续收紧而非豁免；② 吸收失败仍消耗一次 30 秒预算，checks API 长时间不可用时门控以 `Timed out` 失败（刻意的 fail-closed，代价是失去对真实故障的快速失败能力）；③ `2bc77797` 那次被 `skipped` 的 `SonarCloud Gate` 未对该 sha 补跑，其历史 Sonar 结论仍缺一次 gate 读数；④ 不切 foundation release、不动版本与发布文件，消费者侧同名 workflow 概念待维护者决定吸收时点；⑤ 高风险评审（两位，其一 CI/发布）归维护者；⑥ 工作树既有的未提交 i18n 改动不在本 PR 范围也不背书。

## 检查清单

- [x] 已明确本次改动归属 `platform`（CI 发布门控），未触碰 `system/*`、`business/*`、共享 `pkg/*` 与生成器面
- [x] 未把认证、IAM、组织、配置等系统域职责混写（改动只在 Actions bash 片段与其静态断言）
- [x] 前端新增展示文案已使用 i18n（无前端文件改动、无新增展示文案）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰（无权限键、无菜单、无接口变化）
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（无上述变更；同步的是 failure-registry FR-025、任务包、manifest、evidence 与本 PR 正文）
- [x] 已确认不会泄露敏感配置、账号密码或 Token（diff 无任何凭据字面量、无 DSN、无 token；仿真 fixture 只含虚构的 `fake/repo` / `deadbeef` 与 check 名称，目录已删除）
- [x] 已确认本次 PR 由 GitHub workflow 结论与维护者批准负责最终合并门禁（`main` 当前无 required contexts；`.github/workflows/*` 高风险范围需两位非作者批准已在审核留痕显式认领）
