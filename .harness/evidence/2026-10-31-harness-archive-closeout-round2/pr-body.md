## 变更摘要

- 改动层级：`platform`（仓库治理档案面 + 治理文档面）。不触碰 `system/*`、`business/*`、`backend/**`、`frontend/src/**`。
- 改动模块：`.harness/archive/2026-10/{tasks,evidence}/`（2 个 manifest + 11 个证据文件由 `git mv` 落入）、`.harness/ARCHIVE.md`（月度统计、活跃清单、本轮收口记录）、2 份已归档任务包 `.task.md` 的 frontmatter、本包新建的任务包 + manifest + evidence 四件套。**零产品代码、零 CI 作业、零脚本、零发布资产。**
- 目标问题：两个任务包的实质工作已经结束，但 `.harness/tasks/` 里仍留着它们的活跃 manifest，与 `.harness/ARCHIVE.md` 的月度归档约定不一致；维护者此前已明确要求「把 `.harness` 下已完成的任务做归档处理」。关闭判据全部取自主机读数而非叙述：①`2026-10-31-base-menu-filter-sql-literal-convergence` 已由 PR #477 squash 进底座 `main @ e17eaaa1`，消费者 `check:shared-drift` 从 `FAIL … 1 modified / DRIFT_MODIFIED backend/modules/business/retired_modules.go` 转为 `OK … 812 shared files identical to base, 10 allowlisted drift, 161 business-overlay files skipped`；②`2026-10-29-v0180-simplification-release` 的 tag `pantheon-base-v0.18.0` 与 `pantheon-base-v0.18.1` 均存在、`VERSION` = `0.18.1`、两个 release 各带 4 个资产，其最后一项遗留（消费仓 `runtime-acceptance`）由 `pantheon-ops` PR #164（merge `4e69224f`）关闭、#165（merge `9afabc2a`，ops `origin/main` 现值）复核落地。
- 预期影响：档案与磁盘一致，历史证据仍可追溯——13 条变化全部呈 `rename .harness/{ => archive/2026-10}/…（100%）`、`0 insertions(+), 0 deletions(-)`，没有内容重写。归档后继续用规范路径引用：`check:task-packet` 对两份已归档任务包正文仍给 `[PASS]`，这正是 ARCHIVE.md 所声明的 `readTaskManifest` / `resolveArchiveAwarePath` 回退规则的机器证据，因此本包**不改写任何 `linkage` 字段**（改写会让历史 PR 正文里的引用失效）。统计口径按实测目录数重写而非旧值加减：`2026-07 26/31`、`2026-08 23/23`、`2026-09 72/70`、`2026-10 91/94` → 合计 `212/218`。运行面、接口、权限、i18n、菜单、数据库、seed、smoke 一律为零变化。

## Harness 链路

- Task ID：2026-10-31-harness-archive-closeout-round2
- Task Manifest：.harness/tasks/2026-10-31-harness-archive-closeout-round2/manifest.json
- Evidence：.harness/evidence/2026-10-31-harness-archive-closeout-round2/commands.json
- Verification evidence：.harness/evidence/2026-10-31-harness-archive-closeout-round2/summary.md
- Review Artifact：.harness/evidence/2026-10-31-harness-archive-closeout-round2/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：ci-workflow
- Ratchet Decision：registry-only
- GitHub Signal：method-gate

> `Quality Profile` 取 `ci-workflow`：本包的判定证据全部来自治理/CI 侧的 strict 传感器
> （`check:task-packet`、`check-evidence --strict`、`check-review --strict`、`check:structure`、
> `check:harness-encoding`、`check:harness-inventory`），不来自任何运行面——沿用同一形态的
> 纯文档收口轮次既有口径。`GitHub Signal` 取 `method-gate`：本轮真正暴露的是一条方法侧口径缺口
> （见下节「本包登记的工具边缘」），不是仓库门禁误挡。

## Harness adoption markers

- task id: 2026-10-31-harness-archive-closeout-round2
- task manifest: .harness/tasks/2026-10-31-harness-archive-closeout-round2/manifest.json
- evidence: .harness/evidence/2026-10-31-harness-archive-closeout-round2/commands.json
- boundaries: `.harness/` 档案目录 + `.harness/ARCHIVE.md` 索引 + `docs/harness/tasks/` 的 frontmatter；不动 `.github/workflows/**`、不动 `scripts/**`、不动门禁阈值与必需检查集合、不动 `.foundation/**`、不动 `VERSION`/`CHANGELOG.md`/`docs/release-notes/**`、不动消费者仓库、不切发布
- backend response contract: not-applicable（无任何后端代码、接口或响应结构改动）
- backend DTO contract: not-applicable
- permission contract: not-applicable（无权限键、无菜单/授权语义变化）
- audit coverage: not-applicable（无审计链路改动）
- visual evidence: not-applicable（无 UI 面；改动全部是治理档案与索引文本）
- inheritance contract: Base-first 的档案侧执行——被归档任务之一的成果（菜单过滤 SQL 字面量收敛）已经在底座 `main` 上，消费者经下一次发布或自身流程吸收；本包不手抄任何文件到 ops，也不新增跨仓资产
- base drift: not-applicable（本包不动 `.foundation/allowed-drift.json`，被移动的档案不属 shared-drift 比对资产；实测 shared-drift 仍为 10 条既有的 allowlisted，零增删）
- Base/ops inheritance: 本 PR 只动底座仓内档案。`pantheon-ops` 零改动；ops 侧读到的 #161/#164/#165 与 `origin/main = 9afabc2` 只是被归档任务的完成判据来源（只读引用），不是本包要同步的内容

### 本包登记的工具边缘（登记，不修）

`check-evidence.mjs --root . --strict` 与 `check-review.mjs --root . --strict` 只扫 **live 树**
`.harness/evidence/`，不接 `archive/<YYYY-MM>/evidence/` 的回退。本轮把最后两个带
`commands.json` 的证据目录归档后，两传感器当场报：

```
Evidence check (strict): 1 file(s), 1 error(s), 0 warning(s)
[FAIL] .harness/evidence  ·  error: No evidence command files found.
Review check (strict): 1 file(s), 1 error(s)
[FAIL] .harness/evidence  ·  error: No review artifacts found.
```

这两条 `failed` 读数原样写入 commands.json（没有改写成 passed）。它们既不在
`package.json` 的任何 `check:*` 面，也不在任何 CI 作业里，所以不会把 CI 变红；但一个只在
「还有活跃任务」时才有意义的门禁，恰好在收口完成的那一刻失去覆盖对象，这是口径缺口。
本包的处置是**自带 live evidence 目录**（即报错的消失来自本包四个证据文件落盘，终局读数
`0 error(s)` / `0 error(s)`），而不是改治理脚本或加豁免。是否给这两个传感器接档案回退、
或把它们接进 CI，属治理脚本变更，归维护者判断。

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

> 改动面清单：`.harness/ARCHIVE.md`（统计 + 活跃清单 + 本轮记录）、
> `.harness/archive/2026-10/{tasks,evidence}/` 下 13 个被 `git mv` 的文件、
> 两份已归档 `.task.md` 的 `status: Archived`、本包新建的任务包正文 + manifest +
> `commands.json` / `summary.md` / `review.md` / `pr-body.md`。
> 两份被归档 manifest 只改 `status` 一处，`linkage` 与其余字段一字未动。
> 在途的 PR #478（`2026-10-31-release-gate-checks-poll-resilience`）**不在本包归档范围**：
> 它尚未合并，提前判 `completed` 会让档案与事实脱钩；其 manifest 随该 PR 进 `main` 后按同一入口收口。
> 既有历史残留（`.harness/evidence/2026-09-10-tenant-verification-and-gray/` 重复产物、
> 两份无归属的散落 PR 正文、`docs/harness/tasks/` 下 67 个无 manifest 的历史 `Active` 正文）
> 保持原地并显式记入 knownGaps，不做静默清理。

## 验证记录

- [x] 归档呈现：`git -c diff.renameLimit=2000 diff --cached -M --summary` → 13 条全部
  `rename .harness/{ => archive/2026-10}/…（100%）`；`--stat -M` → `13 files changed, 0 insertions(+), 0 deletions(-)`
- [x] 状态读数：两份已归档 manifest `status=completed`；两份 `.task.md` frontmatter `status: Archived`
- [x] 索引一致性：实测目录计数 26/31、23/23、72/70、91/94 → 合计 212/218，与 ARCHIVE.md 表格逐项对上（本轮增量 +2/+2 与「归档两个任务包」互为验证）
- [x] 关闭判据（底座）：`git tag -l "pantheon-base-v0.18*"` → `pantheon-base-v0.18.0` + `pantheon-base-v0.18.1`；`cat VERSION` → `0.18.1`；`gh release view … assets | length` → 4 / 4
- [x] 关闭判据（消费者）：`gh pr view` → #161 merge `430a9f0c`（2026-10-30T06:37:05Z）、#164 merge `4e69224f`（17:01:47Z）、#165 merge `9afabc2a`（17:42:45Z），均 `mergedAt` 非空；`ops origin/main = 9afabc2`，远端分支计数 2（`origin/HEAD` + `origin/main`）
- [x] 治理门禁（worktree 内实跑）：`check:task-packet` → `82 file(s), 0 error(s), 13 warning(s)` 且 `[PASS]` 覆盖两份已归档正文与本包正文（主仓同一检查亦为 82/0/13，13 条 warning 全落在既有历史包，本包新增 0 条）；`check:task-packet-template` → OK；`check-failure-registry --strict` → `1 file(s), 0 error(s), 0 warning(s) [PASS]`（本轮不新增 FR 条目）；`check:structure` → 0 findings / 2960 tracked files；`check:harness-encoding` → 0 findings / 2612 files；`check:harness-inventory` → 0 findings；`check:duplication` → `Result: PASS`
- [x] `check-evidence --strict` / `check-review --strict`：归档后即时 `1 error(s)` ×2（已如实记录），本包证据落盘后 → `1 file(s), 0 error(s), 0 warning(s)` 与 `1 file(s), 0 error(s)`
- [x] 本包任务包被检查器纠正 2 轮：首轮 `check:task-packet` 报 10 error（缺 `Upstream Dependencies` / `Downstream Consumers` / `Sync Expectation` 标签、缺 `Template` / `Overlay` / 嵌套 `Coverage Dimensions`、枚举值被续行粘连、`runtimeEvidence` 需为字符串数组）；补齐后仍报 `Release Requirement` 粘连——根因是续行标签写了**全角冒号**，`parseLinkageItems` 只认 ASCII 冒号。修法是服从既有契约（枚举行单行纯 token、长说明移到带 ASCII 冒号的非枚举标签），没有删段落、没有改 `check-task-packet.mjs`
- [x] 环境噪声与被排除的假回归：worktree 内 `check:docs-frontmatter` 报 8 条（全部 `docs/README.md → ../../pantheon-harness/patterns/*`）、`check:harness-method` 多一条 `patterns/METHOD_VERSION.json required file is missing`、`check-adoption` / `check-doc-links` 报同类 sibling finding；**主仓对同一批 404 docs 报 `Frontmatter check passed.`、`check:harness-method` 只剩既有 `openspec` warning**。根因是 worktree 落在 `pantheon-base/.tmp/ledger`，sibling 仓被解析到 `pantheon-base/.tmp/pantheon-harness`。本包以对照读数说明这一点，不改 `docs/README.md` 的链接写法去迎合 worktree
- [ ] hosted 回读（Docs Governance / PR Governance Prereq / harness 各 strict 作业）：待本 PR 打开后回填；本地 worktree 读数不能替代

## 审核留痕

- Copilot review：待本 PR 打开后经包装器请求；此前同一仓库多次返回不可用（单维护者 ruleset），若再次不可用将如实记录而不是写成已审
- CodeQL 结果：本 PR 只含 Markdown 与 JSON 档案，预计无新增告警；以 PR checks 上的 `CodeQL` / `CodeQL Security` 为准
- GitHub checks 结果：待回读（打开 PR 后按 run 详情逐条记录，不用本地读数替代）
- Auto-merge：沿用仓库 `pr-automation` 的默认策略；本包不自批，合并与高风险豁免决定归维护者
- Duplication Gate 结果：本地 `npm run check:duplication` → `Result: PASS`（既有 report-only 重复段仍指向 `.github/workflows/*`，本包未新增重复文本）；hosted 判定为准
- 是否高风险改动：no（纯治理档案移动与索引更新，无源码、无 workflow、无权限/审计链路、无依赖变化；`git diff --stat` 的 13 条 rename 即证明）
- 本包自审立场：实现者为本包写的 4 个证据文件由「逐条 posture 读数」形式的 review.md 独立复核，每条给实测读数与判定，不给结论式形容词
- Residual risk / follow-up：①`check-evidence` / `check-review` 的 live-tree-only 口径未接档案回退——本轮之后只要活跃 evidence 目录清空就会重现 `No … found.`，接回退或接 CI 前需先定口径（归维护者）；②本 PR 的 hosted 回读尚未产生，`create-pr.mjs` 记录当前为 `not-run`，不预先写成 passed；③`.tmp/ledger` worktree 的 sibling 解析噪声是本地执行环境产物，收口 PR 提交后移除 worktree；④PR #478 的 manifest 待其合并进 `main` 后按同一入口收口；⑤历史残留（重复产物目录、两份散落 PR 正文、67 个无 manifest 的 `Active` 正文）显式延期，不静默清理

## 检查清单

- [x] 两份 manifest `status=completed`、两份 `.task.md` `status: Archived`
- [x] `git mv` 呈 rename（13 条 100%、0 insertions / 0 deletions），目录计数与 ARCHIVE.md 统计一致（91/94、合计 212/218）
- [x] `linkage` 路径未改写，归档后 `check:task-packet` 仍按规范路径给 `[PASS]`
- [x] 关闭判据为主机实测读数（tag / release 资产 / VERSION / shared-drift 终局 / ops 三个 merge 提交号）
- [x] 治理门禁在 worktree 内通过，环境噪声以主仓对照读数区分，未冒充回归也未反向修改文档
- [x] 未动产品代码、CI 作业、门禁阈值、`.foundation/**`、发布资产与消费者仓库
- [x] 未合并的在途任务（PR #478）未被代为归档
- [ ] hosted 检查回读待回填
