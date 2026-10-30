# Review — 2026-10-31-release-gate-checks-poll-resilience

评审对象：底座分支 `fix/release-gate-checks-poll-resilience`（自 `main @ e17eaaa1`），
改动面是 `.github/workflows/release-gate.yml` 的 `Require successful checks on candidate`
一步、`tests/scripts/release-gate-workflow.test.mjs` 一条用例、`docs/harness/failure-registry.md`
的 FR-025，加本包任务文档、manifest 与 evidence。

## 逐条 reviewer posture 读数

1. **diff 面只有声明的三处。**
   `git diff --numstat` → `.github/workflows/release-gate.yml 13/2`、
   `tests/scripts/release-gate-workflow.test.mjs 28/0`、`docs/harness/failure-registry.md 23/0`。
   workflow 的 2 行删除全部落在同一个步骤的同一个 `run` 块内（原 `check_runs=$(gh api …)` 与
   原 `<<< "$check_runs"`），没有跨 job、没有动 `on:`/`permissions:`/`needs:`/其它 job。
   工作树里既有的 6 个未提交 i18n 文件未被 stage。→ **通过**

2. **必需检查集合一字未动。**
   `REQUIRED_CHECKS` 仍是 `CI Summary / Quality Gates / Security Gates / Actionlint /
   Full Smoke / SonarCloud Code Analysis` 六项；既有测试
   `release gate requires every aggregate check on the candidate SHA` 逐项断言这六个名字，
   本次仍 8/8 通过（commands[13]），这是「没偷偷减一项」的机器证明。→ **通过**

3. **预算与终局一字未动。**
   `for attempt in {1..240}` 保留，循环末尾那处既有的 `sleep 30` 位置与时长不变（新增的
   `sleep 30` 只出现在「读不到 ⇒ 继续等」分支里，是本步的第二处等待，不是对既有预算的
   改动）；`::error::Timed out waiting for required checks on $CANDIDATE_SHA.` + `exit 1`
   仍是循环耗尽后的唯一出口。新增断言把这三条写进测试，防「用无限等待换绿」。→ **通过**

4. **fail-closed 三处仍在，且有读数。**
   `conclusion != success` → 立即 `A required check failed` + `exit 1`（仿真 onefail 组：
   `exit=1 gh_calls=1 判定行=6 等待行=0`，第 1 轮即 `::error::A required check failed on deadbeef.`）；
   `failed=1` 的判定优先于 `pending`（脚本里 `if [ "$failed" -ne 0 ]` 仍在 `pending` 检查之前，
   并用 failure + `in_progress` 并存的 mixed fixture 实测：终局仍是 `A required check failed`，
   无保护版对同一 fixture 给出同样的 exit 1 / 6 判定行，两版在「有结论」时等价）；
   持续读不到 → 耗尽 240 次真预算后 `Timed out` + `exit 1`（apifail / empty / garbage 三组均为
   `gh_calls=240 判定行=0 等待行=240`，每轮只打 `waiting without a verdict`，不产生任何判定；
   `{1..8}` 对照版给出同形结论）。→ **通过**

5. **没有用兜底常量、静音诊断或 `continue-on-error` 换绿。**
   吸收形式只有 `|| true`（空串），没有任何 `|| echo` 值；diff 中不含
   `continue-on-error`；`gh api` 那一行不含 `2>/dev/null`，并由新增断言
   `assert.doesNotMatch(candidateSource, /check_runs=\$\(gh api ".*2>\/dev\/null/)` 钉住。
   既有测试 `security alert API failures block the release instead of using fallback proxies`
   仍通过（同一次 8/8 里）。→ **通过**

6. **根因判定来自日志而非推测，且被更正过一次。**
   `unexpected end of JSON input` 是 `gh` 自己的 Go 解码报文（`jq` 的措辞是
   `parse error: Invalid JSON text`），因此触发路径是 `gh api` **非零退出** + `bash -e`
   放大命令替换状态，而非「jq 解析空体」。据此把诊断静音的初版写法撤回。该结论与
   commands[1] 的原始日志行序（17:41:18Z attempt 27 六项正常 → 17:41:52Z 一行报文 →
   `##[error]Process completed with exit code 1`，中间零行 check 输出）一致。→ **通过**

7. **「这次红本来会自己好」有对照读数，不是叙述。**
   commands[2]：同一候选上 `Full Smoke` check run 在 **17:43:54Z** 变 `completed/success`
   （workflow run 41099026988 整体 17:55:21Z 收尾），其余五项早已 success；
   门控在 17:41:52Z 自杀，即它等待的条件在约 2 分钟后满足。
   新 main `e17eaaa1` 的 Release Gate run 41107553430 = completed/success
   （`Candidate Checks` 18:30:46Z → 18:53:47Z），该 sha 上 34 项 check 全绿——本包不声称
   「修好了某次红」，只声称消除复发条件。→ **通过**

8. **仿真忠实度被如实标注，包括三次自我更正。**
   run 块按 10 空格缩进边界从 YAML（51 行）与 `git show HEAD:`（40 行）各机械抽出，只把
   `sleep 30`→`sleep 0`、循环 `{1..240}` 原样保留，四份（含 `{1..8}` 对照版）都 `bash -n`
   通过且都以 `Timed out` + `exit 1` 结尾。① 第一版抽取漏掉 `done` 之后的两行终局，导致
   无保护版「看起来没中止」，据此写下的「runner 语义差异」结论是错的。② 为跑得起 240 轮
   把 `jq` 替身从 Python 换成纯 bash 时丢了「不可解析 ⇒ 非零退出」这一支，使空体与非 JSON
   两支被混为一谈；按 jq 真实退出码（合法含键 0 / 合法缺键 1 / 不可解析 2 / 无 JSON 值 4）
   补齐并逐支探针后，结论分裂为两支：**`gh` 非零与不可解析 body 都在第 1 轮中止
   （exit 1 / exit 2、零行 check 读数、`gh_calls=1`）——与 CI 形态一致；而空 body 不中止，
   六项全读成「not present yet」，耗尽 240 轮变成 `Timed out` 假红**。这说明旧实现的假红
   有三种形状，也说明修复必须两支守卫齐上（单靠 `[ -z ]` 只看得到空体那一支）。
   ③ 全预算版与 `{1..8}` 版一度等待轮数不一致，定位到被 stop 的后台任务留下仍在 `sleep`
   的孤儿 `poll.sh` 子进程与新运行共享 `state/count`；改为每 scenario 独立 mktemp 状态目录
   且严格串行后两种规模读数一致。`jq` 仍是本地替身（JSON 合法性用首尾括号形状近似，不是
   完整解析器），该边界写入 commands.json 与 summary。→ **通过**

9. **FR-025 入册且严格校验通过。**
   表格行 + 散文条均落地，`node scripts/harness/check-failure-registry.mjs --root . --strict`
   → `1 file(s), 0 error(s), 0 warning(s)` / `[PASS]`。首轮因单元里写了字面 `||`
   （markdown 表格切列）报错，改写为文字描述后通过——没有通过删内容来消警告。→ **通过**

10. **未越界：不动 release、不动消费者、不动下游作业口径。**
    `VERSION` / `CHANGELOG.md` / `docs/release-notes/**` / `.foundation/**` /
    `sonar-project.properties` / `package.json` 零改动；`pantheon-ops` 零改动；
    `SonarCloud Gate` / `CodeQL Alerts` / `Dependabot Alerts` 的判定条件与 `needs` 关系未动。
    ops 侧同名 workflow 概念经下一次发布或维护者显式同步吸收。→ **通过**

## 残留判断

- **高风险范围认领**：`.github/workflows/*` 按 `repo-pr-gate` 需两位非作者批准、其一为
  CI/发布负责。本包不自批，也不改评审规则；`pr-automation.yml` 会自动打开 auto-merge，
  维护者若判定该范围必须人工把关，应在合并前关闭。
- **本地替身不是 jq 本体**：真实 `jq`/`gh` 在 ubuntu-latest 上的 `-e` 传播与退出码组合，
  只能由 hosted 回读确认；若新 main 仍红，按同一入口继续收紧而不是豁免。
- **等待成本未变**：吸收失败仍消耗一次 30 秒预算，checks API 长时间不可用时门控以
  `Timed out` 失败——这是刻意的 fail-closed 取舍，本包不引入兜底常量、不放大预算。
- **`2bc77797` 那次被 skipped 的 SonarCloud Gate 未被补跑**：同一 sha 的历史 Sonar 结论
  仍缺一次 gate 读数，由后续 sha `e17eaaa1` 的成功 gate 覆盖当前 main 状态。

## Machine Readable

```json
{
  "taskId": "2026-10-31-release-gate-checks-poll-resilience",
  "verdict": "approved with documented P2 follow-up",
  "structuralReview": {
    "affectedSubgraph": [
      ".github/workflows/release-gate.yml (Candidate Checks / Require successful checks on candidate)",
      "tests/scripts/release-gate-workflow.test.mjs",
      "docs/harness/failure-registry.md (FR-025)",
      ".github/workflows/release-gate.yml (SonarCloud Gate needs edge, unchanged)",
      "docs/harness/tasks/2026-10-31-release-gate-checks-poll-resilience.task.md",
      ".harness/tasks/2026-10-31-release-gate-checks-poll-resilience/manifest.json",
      ".harness/evidence/2026-10-31-release-gate-checks-poll-resilience/"
    ],
    "checks": ["sensitive-flow", "hub", "cycle"],
    "findings": [
      "P2: .github/workflows/* is a declared high-risk scope in repo-pr-gate (two non-author approvals, one CI/release owning). This package does not self-approve and does not change review rules; pr-automation.yml opens auto-merge, so a maintainer who wants a human gate on this file must disable it before merge.",
      "P2: the local jq stand-in is not jq itself. Behaviour of the guarded loop under real jq and real gh on ubuntu-latest is only established by the hosted reading; if a future main run goes red again the same entry point must be tightened, not waived.",
      "P2: the fix converts an unreadable response into continued waiting, so a persistently unavailable checks API still ends in Timed out exit 1 - the gate loses the ability to fail fast on a real outage. Accepted deliberately over a fallback constant; recorded so the trade-off is visible rather than implicit.",
      "P3: the SonarCloud Gate skipped on 2bc77797 was not re-run for that sha; that historical commit keeps a missing gate reading, superseded for current main by e17eaaa1 where the gate succeeded.",
      "P3: no foundation release is cut here, so a consumer repository's inherited equivalent workflow keeps this fragility until the next release or an explicit maintainer sync.",
      "P3: the six pre-existing uncommitted i18n files in the base working tree belong to other in-flight work and are neither staged nor endorsed."
    ],
    "notes": "Release Gate on base main 2bc77797 went red inside the candidate polling step while the candidate itself was clean. The job log ends with attempt 27 printing six normal check readings (five required checks completed/success, Full Smoke still in_progress) followed 34 seconds later by `unexpected end of JSON input` and a step exit code 1 with no check line in between - and that wording is gh's Go decoder, not jq's, so the trigger is gh api exiting non-zero and bash -e converting the command-substitution status into a step abort. The Full Smoke check run it was waiting for turned completed/success at 17:43:54Z, roughly two minutes after the abort, and SonarCloud Gate was then skipped by its needs edge. The change separates observation from verdict inside one run block: gh's exit status is absorbed with `|| true` while its stderr stays visible (silencing it would erase the only trace of which attempt failed and why), a `jq -e has(\"check_runs\")` gate turns empty, truncated and non-JSON bodies into `waiting without a verdict`, and the per-check filter absorbs its own failure. The six required checks, the 240x30s budget, the `A required check failed` immediate exit and the `Timed out` ending are untouched and are now asserted to survive. Evidence: new workflow test 8/8, full script suite 184/184, YAML parses with the same six jobs, registry strict 0/0, structure strict 0 findings across 2960 files, encoding strict 0 across 2612, duplication PASS, frontmatter 404 docs. Behaviour simulated by mechanically extracting the run block from both the fixed (51 lines) and HEAD (40 lines) workflow, keeping the real {1..240} budget and only neutralising sleep 30, then replaying fifteen scenarios serially against stubbed gh/jq with one isolated state directory per run. Readings are exit / gh_calls / verdict-lines / wait-lines: unguarded aborts on the FIRST attempt for gh-non-zero (1/1/0/0, one gh line - the CI shape) and for an unparseable body (2/1/0/0, one jq parse-error line), but an empty body does not abort: it reads all six checks as absent and burns the whole budget (1/240/0/240) into a Timed out false red. Guarded: all-green 0/1/6/0 with All required checks passed, a failed conclusion 1/1/6/0 immediately, a mixed failed+in_progress fixture also 1/1/6/0 ending in A required check failed which is the evidence that failed still outranks pending, transient outage (two empty then two truncated rounds) 0/5/6/4 recovering to exit 0, and persistent gh-non-zero / unparseable / empty each 1/240/0/240 exhausting the real budget into Timed out. Two corrections are recorded rather than hidden: the first extraction dropped the post-done Timed out/exit 1 tail, and replacing the python jq stand-in with a pure-bash one initially lost jq non-zero-exit-on-unparseable-input, which had collapsed the empty and malformed shapes into one reading. Control reading: main e17eaaa1 Release Gate completed/success with all 34 checks green, so this package claims removal of the recurrence condition, not repair of a specific past red."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-31-release-gate-checks-poll-resilience/manifest.json",
    "evidence": ".harness/evidence/2026-10-31-release-gate-checks-poll-resilience/commands.json",
    "reviewFile": ".harness/evidence/2026-10-31-release-gate-checks-poll-resilience/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/VERIFICATION_EVIDENCE_SPEC.md",
      "docs/contracts/PLATFORM_CONTRACT.md",
      "docs/harness/failure-registry.md"
    ]
  }
}
```
