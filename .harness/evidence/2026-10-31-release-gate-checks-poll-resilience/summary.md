# Summary: 2026-10-31-release-gate-checks-poll-resilience

## 结论

`pantheon-base` main `2bc77797` 的 `Release Gate` 红是门控脚本对传输层瞬时故障的过敏，
不是候选提交的质量回归。本包把「读不到响应」与「做出判定」在同一个 shell 步骤里分开：
读不到就在原有 240×30s 预算内继续等，读到合法 JSON 才进入判定；必需检查集合、预算、
超时终局与 fail-closed 语义一字未改，并由新增测试反向锁住（无保护调用、`2>/dev/null`、
删预算三种退化都会红）。

## 失败机制（读日志，不读猜测）

失败的是 `Candidate Checks / Require successful checks on candidate`
（run `41099026855`，job `124212224199`）。日志末尾：

```
17:41:18Z CI Summary: status=completed conclusion=success
17:41:18Z Quality Gates: status=completed conclusion=success
17:41:18Z Security Gates: status=completed conclusion=success
17:41:18Z Actionlint: status=completed conclusion=success
17:41:18Z Full Smoke: status=in_progress conclusion=pending
17:41:18Z SonarCloud Code Analysis: status=completed conclusion=success
17:41:18Z Waiting for candidate checks (attempt 27/240)...
17:41:52Z unexpected end of JSON input
17:41:52Z ##[error]Process completed with exit code 1.
```

三点决定性的：

1. attempt 27 的六项读数完全正常，只是 `Full Smoke` 还没跑完——这是设计中的等待状态。
2. 34 秒后（一次 `sleep 30` + 一次 `gh api`）直接中止，**中间没有任何一行 check 读数**，
   所以死的是「读响应」这一步，而不是某项检查变红。
3. `unexpected end of JSON input` 是 `gh` 自己（Go `encoding/json`）的报文；`jq` 遇到坏 JSON
   说的是 `jq: parse error: Invalid JSON text`。因此触发路径是 **`gh api` 非零退出**，旧写法
   `check_runs=$(gh api "…")` 把这个非零状态经命令替换带回赋值语句，`bash -eo pipefail`
   立即结束整步。

下游后果：`Release Gate Summary` 记 failure，`SonarCloud Gate` 因 `needs: [candidate-checks, …]`
被 `skipped`——发布证据链断一环，而不是少跑一次作业。而 `Full Smoke` 的 check run 在
**17:43:54Z 变 `completed/success`**（对应 workflow run 41099026988 于 17:55:21Z 整体收尾），
即门控在它等待的条件真正满足前约 2 分钟自杀，候选提交没有任何回归。

## 修复形状

同一个 run 块内三处守卫，全部服务于「读不到 ⇒ 无判定 ⇒ 继续等」：

```bash
# gh 失败不再中止步骤；stderr 保留
check_runs=$(gh api "repos/$REPO/commits/$CANDIDATE_SHA/check-runs?per_page=100" || true)

# 只有含 check_runs 键的合法 JSON 才进入判定
if ! jq -e 'has("check_runs")' <<< "$check_runs" > /dev/null 2>&1; then
  echo "Check-runs response unavailable or malformed (attempt $attempt/240); waiting without a verdict."
  sleep 30
  continue
fi

# 单个 check_run 解析失败也不中止整步
check_result=$(jq -c --arg name "$check_name" \
  '[.check_runs[] | select(.name == $name)] | sort_by(.started_at) | last // empty' \
  <<< "$check_runs" || true)
```

各条出口的语义：

| 读到什么 | 判定 |
|---|---|
| 六项全部 `completed/success` | `All required checks passed` → `exit 0` |
| 任一项 `conclusion != success` | `::error::A required check failed` → 立即 `exit 1` |
| 有项未完成 | 继续等，最多 240 次 |
| 读不到合法 JSON | `waiting without a verdict` → 继续等，**不产生任何判定** |
| 预算耗尽（含持续读不到） | `::error::Timed out waiting for required checks` → `exit 1` |

## 为什么保留 gh 的 stderr

最初写法是 `2>/dev/null || true`。它同样能止住红，但会把那一轮「为什么失败」从日志里彻底
抹掉——下次再红时只能靠重试次数猜。`|| true` 只吸收退出状态、不吸收诊断，是本包唯一可接受的
吸收形式，并用 `assert.doesNotMatch(candidateSource, /check_runs=\$\(gh api ".*2>\/dev\/null/)`
钉住，防止后来者「顺手静音」。

同一立场仓库里已有：既有测试
`security alert API failures block the release instead of using fallback proxies` 明令禁止
`2>/dev/null || echo "0"` 这类把失败读成 0 的兜底常量。本包不引入任何 `|| echo` 常量、
不引入 `continue-on-error`、不跳过必需检查、不缩小预算——瞬时故障只换来「继续等」，
从不换来「绿」。

## 本地仿真的边界（以及三次自我更正）

本机没有 `jq`，所以行为证据这样取：把 run 块从 YAML 里
按 10 空格缩进边界**机械抽出**（修复版 51 行一份、`git show HEAD:` 版 40 行一份，只把
`sleep 30` 改写为 `sleep 0`，循环范围 `{1..240}` 原样保留；另备同逻辑的 `{1..8}` 对照版），
`gh`/`jq` 用 `.tmp/rgsim/bin` 下的替身回放响应形态，整块在 `bash -eo pipefail` 下运行，
每个 scenario 跑在独立的 mktemp 状态目录里、严格串行。替身目录不入库（`.tmp/` 已 gitignore），
收口时删除。

最终 15 组读数（`判定行` = 输出里带 `status=` 的行数，`等待行` = 带 `attempt ` 的行数）：

| 脚本 | 响应形态 | exit | gh_calls | 判定行 | 等待行 | 终局 |
|---|---|---|---|---|---|---|
| 无保护 | `gh` 非零 | 1 | 1 | 0 | 0 | 只留一行 `gh` 报文（= CI 形态） |
| 无保护 | 非 JSON 文本 | 2 | 1 | 0 | 0 | 只留一行 `jq: parse error` |
| 无保护 | 空体 | 1 | 240 | 0 | 240 | `Timed out` 假红 |
| 无保护 | 一项 failure + 一项 in_progress | 1 | 1 | 6 | 0 | `A required check failed` |
| 修复 | 六项全 success | 0 | 1 | 6 | 0 | `All required checks passed` |
| 修复 | 一项 failure | 1 | 1 | 6 | 0 | `A required check failed` |
| 修复 | failure 与 pending 并存 | 1 | 1 | 6 | 0 | `A required check failed`（failed 优先） |
| 修复 | 前 2 轮空 / 3-4 轮截断 / 之后全绿 | 0 | 5 | 6 | 4 | `All required checks passed` |
| 修复 | 持续 `gh` 非零 | 1 | 240 | 0 | 240 | `Timed out` |
| 修复 | 持续非 JSON | 1 | 240 | 0 | 240 | `Timed out` |
| 修复 | 持续空体 | 1 | 240 | 0 | 240 | `Timed out` |

三次必须记下来的更正：

1. **抽取漏尾**：第一轮抽取时我把块的尾部（`done` 之后的 `echo "::error::Timed out…"` 与
   `exit 1`）漏掉了，导致无保护版在本地「看起来没有中止」、只是跑满预算。据此我曾写下
   「本地未复现 CI 中止、差异属 runner 语义」的结论。补齐尾部后重跑，无保护版立刻复现出
   CI 的形态：**0 次判定输出、只留一行 `gh` 报文、非零退出**，与日志里 attempt 27 → 中止
   之间什么都不打印完全一致。所以先前的「runner 差异」解释是抽取缺陷造成的误读。
2. **替身退化**：把 `jq` 替身从 Python 换成纯 bash（为了跑得起 240 轮）时，我丢掉了
   「输入不可解析 ⇒ 非零退出」这一支，于是无保护版在空体与非 JSON 下的读数被混为一谈。
   按 `jq` 的真实形状补齐（合法含键 0 / 合法缺键 1 / 不可解析 2 + `parse error` / 无 JSON 值 4
   且零输出）后逐支探针，结论才稳定：**空体不会中止，而是耗尽 240 轮变成 `Timed out` 假红；
   不可解析会在第 1 轮中止**。这既是「旧实现有三种假红形状」的依据，也是为什么单靠
   `[ -z "$check_runs" ]` 或单靠 `|| true` 都盖不全。
3. **状态共享**：同一 fixture 在全预算版与 `{1..8}` 版下的等待轮数一度不一致。定位到被
   stop 的后台任务留下了仍在 `sleep` 的 `poll.sh` 孤儿子进程，它与新运行共享同一个
   `state/count`，把计数往前推。改为每 scenario 独立状态目录 + 串行后两种规模读数完全一致
   （transient 均为 `gh_calls=5 等待=4`）。教训是：并行回放共享状态的仿真本身就是一种
   不可复现的读数来源，宁可乐观地慢，也不要并发。

本地仿真不能替代 hosted 结论：`jq` 是 bash 替身（JSON 合法性用首尾括号形状近似，不是解析器）、
`sleep` 被归零、`gh` 由脚本回放。hosted 侧的真实
回读是新 main 上 `Release Gate` 的实跑结论；若仍红，按同一入口继续收紧而不是豁免。

## 影响面

- 产品运行面：无。改动只在 CI 门控脚本与其静态断言里。
- 消费者：`pantheon-ops` 有继承自本仓的 workflow 概念，但 workflow 不走 foundation 资产；
  ops 吸收本修复的时点归维护者（与本仓发布节奏一起走），本包不手抄、不动 `.foundation/**`。
- 门禁策略：`.github/workflows/*` 属本仓声明的高风险范围（两位非作者批准，其一为 CI/发布负责）。
