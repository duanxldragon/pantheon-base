# Summary: 2026-10-31-harness-archive-closeout-round2

## 结论

两个 2026-10 的任务包实质工作已经结束，档案却还挂在 `.harness/tasks/` 的活跃位：
`2026-10-31-base-menu-filter-sql-literal-convergence` 与
`2026-10-29-v0180-simplification-release`。本包按 `.harness/ARCHIVE.md` 的月度约定把它们
收进 `.harness/archive/2026-10/{tasks,evidence}/`，并把索引的月度统计、活跃清单与本轮记录
改到与磁盘一致。全部动作是 `git mv`（13 条 rename，0 insertions / 0 deletions），
零产品代码、零门禁阈值、零 CI 作业、零发布资产。

## 为什么这两条现在可以关闭（读数，不是叙述）

**SQL 字面量收敛**：底座侧由 PR #477 squash 进 `main @ e17eaaa1`。关闭判据是消费者门禁的
终局读数——收敛前 `FAIL shared drift check: 1 modified … DRIFT_MODIFIED
backend/modules/business/retired_modules.go`，收敛后 `OK shared drift check: 812 shared files
identical to base, 10 allowlisted drift, 161 business-overlay files skipped`，且那 10 条
`ALLOWED_DRIFT` 是同一批条目，本包与上一包都没增删。`docs/harness/tasks/`
里该任务包正文在归档后仍被 `check:task-packet` 判 `[PASS]`。

**v0.18.0 简化程序发布**：`git tag -l "pantheon-base-v0.18*"` → `pantheon-base-v0.18.0`
与 `pantheon-base-v0.18.1`；`VERSION` → `0.18.1`；两个 release 各带 4 个资产
（`gh release view … assets | length` → 4 / 4）。该任务包唯一遗留项是消费仓
`runtime-acceptance`，它由 `pantheon-ops` PR #164（merge `4e69224f`，2026-10-30T17:01:47Z）
以 fresh-schema 证据关闭，再由 #165（merge `9afabc2a`，2026-10-30T17:42:45Z）在 ops main
复核落地；#161（merge `430a9f0c`）是同一链路上的业务侧收口。ops 远端现在只有 `main`
（`git branch -r | wc -l` → 2，含 `origin/HEAD`）。

两条的外仓终局都落在主机读数上，所以「关闭」不是自我评价。

## 归档怎么做的，以及为什么保持规范路径

- manifest 与 evidence **整目录** `git mv` 到 `archive/2026-10/`，`.task.md` 留在
  `docs/harness/tasks/` 并把 frontmatter 改为 `status: Archived`。这是 ARCHIVE.md 已有的
  三条既有约定，本包不新造规则。
- 两份 manifest 的 `status` 改为 `completed`（实测读回：`completed` / `completed`）。
- **`linkage` 路径一字未改**。ARCHIVE.md 规定归档后继续用规范路径引用，靠
  `readTaskManifest` / `resolveArchiveAwarePath` 回退解析；本包给出了这条规则的机器证据：
  manifest/evidence 移走后，`check:task-packet` 对两份已归档正文仍给 `[PASS]`。改写路径会
  让历史 PR 正文里的引用失效，是更大的破坏。
- 统计按实测目录数重写：`2026-07 26/31`、`2026-08 23/23`、`2026-09 72/70`、
  `2026-10 91/94` → 合计 `212/218`。与「旧值各 +2」恰好吻合，这个吻合本身是核对结果，
  不是省事。

## 一处必须点出来的工具口径（登记，不修）

`check-evidence.mjs --root . --strict` 与 `check-review.mjs --root . --strict` 只扫
**live 树** `.harness/evidence/`，不接 `archive/<YYYY-MM>/evidence/` 的回退。本轮把最后两个
带 `commands.json` 的证据目录归档后，live 树只剩一个历史遗留目录和两份散落 PR 正文，两个
strict 检查器当场报：

```
Evidence check (strict): 1 file(s), 1 error(s), 0 warning(s)
[FAIL] .harness/evidence
  error: No evidence command files found.
Review check (strict): 1 file(s), 1 error(s)
[FAIL] .harness/evidence
  error: No review artifacts found.
```

这不是档案损坏：归档内容完好，检查器只是看不见它。两个传感器既不在 `package.json` 的任何
`check:*` 面，也不在任何 CI 作业里，所以不会把 CI 变红；但一个「只在还有活跃任务时才有意义」
的门禁，恰好在收口完成的那一刻失去覆盖对象，这是口径缺口。

处置方式选择**本包自带 live evidence 目录**（即这两个报错的消失是因为本包的四个证据文件落盘），
而不是改治理脚本或加豁免。把档案回退接进这两个传感器属另一类变更面，归维护者判断，本包只在
任务包 Implementation Notes 第 5 条与 PR residual 如实登记。

## 本地 worktree 的两条噪声，与被排除的「假回归」

本包在 `.tmp/ledger` worktree（自 `main @ e17eaaa1` 切出）执行。两条检查在 worktree 内报错、
在主仓对同一批文件报错为 0：

- `check:docs-frontmatter`：worktree 内 `Frontmatter check failed. Checked 404 docs, 284 with
  frontmatter.`，8 条全部是 `docs/README.md: link target does not exist:
  ../../pantheon-harness/patterns/*.md`；主仓同批 404 docs → `Frontmatter check passed.`。
- `check:harness-method`：worktree 内 `finding: patterns/METHOD_VERSION.json / required file
  is missing`；主仓只剩既有的 `openspec` warning。

根因相同：worktree 落在 `pantheon-base/.tmp/ledger`，`../../pantheon-harness` 从仓库根解析成
`pantheon-base/.tmp/pantheon-harness`（不存在），而 `../pantheon-harness/patterns/` 在主仓相对
层级真实存在。所以这是嵌套根的产物，不是本包引入的回归；本包不改 `docs/README.md` 的链接写法
去迎合 worktree，hosted Docs Governance 作业是权威。同一条对照读数写入 commands.json 供复核。

## 一次自己被检查器纠正的记录

本包任务包正文首轮 `check:task-packet` 报 10 个 error：必需标签缺失
（`Upstream Dependencies` / `Downstream Consumers` / `Sync Expectation`——我把标签写成了
`Workspace Context Sync Expectation`）、`Harness Profile` 缺 `Template` / `Overlay` 与嵌套
`Coverage Dimensions`、枚举值被后续续行粘连成非枚举字符串（`parseLinkageItems` 会把不匹配
`^- Label:` 的行并进上一个值）、以及 manifest 的 `verificationPlan.runtimeEvidence` 写成字符串
而检查器要求字符串数组。修法是服从检查器既有契约：枚举行改单行纯 token，长说明移到非枚举标签
`Cross Repository Facts`，`runtimeEvidence` 拆 3 条。没有删内容、没有放宽检查器。

## 收口 PR 的创建被拦在本包之外（如实记录）

分支与两个提交已推送（`8e459ce1` 归档 + 索引，`5cc50d5e` 补 `status → completed`；第二刀是
必要的更正：`git mv` 只把重命名放进暂存区，状态单行改动留在工作区，首个提交因此不含它声明的
状态变化——按「不 amend、新建提交」处理，不重写已提交历史）。
`node scripts/create-pr.mjs …` 在调用 GitHub 之前被 Auto Mode 的安全分类器拦下：
`[External System Writes] PR creation publishes changes … the task was archival work which the
agent could have completed locally without externalizing`。正文自身通过 `validatePrBody`
本地校验（no findings）。按「被拦的调用不重试、外部写入不当默认可做」的纪律，PR 创建与维护者
批准留作待办；本包的 evidence 因此把 `create-pr` 记为 `not-run`，把 hosted 回读记为未产生。

### 后续更新（2026-10-31）

维护者指出「pantheon-base 的分支没有合并」，本包据此补上了收口动作：

- 经本仓包装器创建 PR #481（标题 `chore(harness): archive the two closed 2026-10 task packets`），
  `validatePrBody` 通过后调用 GitHub；分支仍为 `chore/harness-archive-closeout-round2`。
- 在途的 PR #478（release-gate 轮询韧性）已合入 `main`（squash `beace427`）。它的 manifest 随该 PR
  进入 `main`，按 ARCHIVE.md 的同一入口在下一轮归档；本包不把未归档的 #478 提前判为 completed。
- hosted 回读在 PR #481 的 checks 落定后由本文件的上游记录方式（PR 评论/新一轮 evidence）补齐，
  本包仍不预先把本地读数写成 hosted passed。

## 影响面

- 产品运行面：无。被移动的都是治理档案。
- 消费者：零。ops 只作为完成判据的只读来源被引用，本包不动其任何文件。
- 后续：仍在途的 PR #478（release-gate 轮询韧性）的 manifest 随该 PR 进 `main` 后按同一入口
  收口；本包不代为归档，避免把未合并工作的档案状态提前判定为 completed。
