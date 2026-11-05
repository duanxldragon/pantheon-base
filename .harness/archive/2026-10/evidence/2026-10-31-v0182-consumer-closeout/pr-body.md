## 变更摘要

- 改动层级：`platform`（仓库治理档案面 + 治理文档面）。不触碰 `system/*`、`business/*`、`backend/**`、`frontend/src/**`。
- 改动模块：`.harness/archive/2026-10/{tasks,evidence}/`（3 个 manifest + 17 个证据文件由 `git mv` 落入）、`.harness/ARCHIVE.md`（月度统计、活跃清单、本轮收口记录）、`.harness/STATUS.md`（v0.18.2 消费状态）、3 份任务包 `.task.md` 的 frontmatter 与 v0182 包的消费章节、本包新建的任务包 + manifest + evidence 四件套。**零产品代码、零 CI 作业、零脚本、零发布资产。**
- 目标问题：`pantheon-base-v0.18.2` 的最后一个未闭合项——消费仓对锁定发行包的重建——已经由 `pantheon-ops` 两个 PR 关闭（`#166` → `5676ffc`，`#167` → `81d2941`），同日另有 `2026-10-31-harness-archive-closeout-round2`（自身 PR #481 → `94a492ef`）与 `2026-10-31-release-gate-checks-poll-resilience`（#478 的 `Release Gate` 修复，FR-025）在 main 上落地；三个任务的 manifest 却仍停在 `in-progress`，与 `.harness/ARCHIVE.md` 的月度归档约定不一致。
- 预期影响：档案与磁盘一致，历史证据仍可追溯——19 条归档变化全部呈 `rename`（93–100%），没有内容重写。归档后继续用规范路径引用：`check:task-packet` 对四份任务包正文（含三份已归档包）仍给 `[PASS]`，因此本包**不改写任何 `linkage` 字段**。统计口径按实测目录数重写：`2026-10 91/94` → `94/97`，合计 `212/218` → `215/221`。运行面、接口、权限、i18n、菜单、数据库、seed、smoke 一律为零变化。

## Harness 链路

- Task ID：2026-10-31-v0182-consumer-closeout
- Task Manifest：.harness/tasks/2026-10-31-v0182-consumer-closeout/manifest.json
- Evidence：.harness/evidence/2026-10-31-v0182-consumer-closeout/commands.json
- Verification evidence：.harness/evidence/2026-10-31-v0182-consumer-closeout/summary.md
- Review Artifact：.harness/evidence/2026-10-31-v0182-consumer-closeout/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：ci-workflow
- Ratchet Decision：registry-only
- GitHub Signal：method-gate

> `Quality Profile` 取 `ci-workflow`：本包的判定证据全部来自治理侧的 strict 传感器
> （`check:task-packet`、`check-evidence --strict`、`check-review --strict`、`check:structure`、
> `check:harness-encoding`），不来自运行面，沿用同形态纯文档收口轮次的既有口径。
> `GitHub Signal` 取 `method-gate`：本轮暴露的是两个 strict 传感器只扫 live 树的口径缺口，
> 不是仓库门禁误挡。

## Harness adoption markers

- task id: 2026-10-31-v0182-consumer-closeout
- task manifest: .harness/tasks/2026-10-31-v0182-consumer-closeout/manifest.json
- evidence: .harness/evidence/2026-10-31-v0182-consumer-closeout/commands.json
- boundaries: `.harness/` 档案目录 + `.harness/ARCHIVE.md` + `.harness/STATUS.md` + `docs/harness/tasks/` 的 frontmatter；不动 `.github/workflows/**`、`scripts/**`、门禁阈值、`.foundation/**`、`VERSION`/`CHANGELOG.md`/`docs/release-notes/**`、消费者仓库，不切发布
- backend response contract: not-applicable（无后端代码或响应结构改动）
- backend DTO contract: not-applicable
- permission contract: not-applicable（无权限键、无菜单/授权语义变化）
- audit coverage: not-applicable（无审计链路改动）
- visual evidence: not-applicable（无 UI 面；改动全部是治理档案与索引文本）
- inheritance contract: Base-first 的档案侧执行——被归档任务之一的成果（v0.18.2 共享传感器）已经随发行包到达消费者并在其仓内完成修复；本包不手抄任何文件到 ops
- base drift: not-applicable（不动 `.foundation/allowed-drift.json`；被移动的档案不是 shared-drift 比对资产）
- Base/ops inheritance: 本 PR 只动底座仓内档案。`pantheon-ops` 零改动；ops 的 #166/#167 只是被归档任务的完成判据来源（只读引用）

### 本包登记的工具边缘（登记，不修）

`check-evidence.mjs --root . --strict` 与 `check-review.mjs --root . --strict` 只扫 live 树。本轮把
最后一批带 `commands.json` 的证据目录归档后，两传感器当场报：

```
Evidence check (strict): 1 file(s), 1 error(s), 0 warning(s)
[FAIL] .harness/evidence  ·  error: No evidence command files found.
Review check (strict): 1 file(s), 1 error(s)
[FAIL] .harness/evidence  ·  error: No review artifacts found.
```

两条 `failed` 读数原样写入 commands.json。两个传感器都不在 `package.json` 的 `check:*` 面，
也不在任何 CI 作业里，因此不会把 CI 变红；但一个只在「还有活跃任务」时才有意义的门禁，
恰好在收口完成的那一刻失去覆盖对象。本包的处置是**自带 live evidence 目录**，而不是改脚本或加豁免。

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

> 改动面清单：`.harness/ARCHIVE.md`、`.harness/STATUS.md`、
> `.harness/archive/2026-10/{tasks,evidence}/` 下 19 个被 `git mv` 的文件、
> 三份已归档 `.task.md`（其中 v0182 包另加 `## Consumer verification（pantheon-ops）` 一节）、
> 本包新建的任务包正文 + manifest + `commands.json` / `summary.md` / `review.md` / `pr-body.md`。
> 三份被归档 manifest 只改 `status` 一处，`linkage` 与其余字段一字未动。
> 历史残留（重复的 `2026-09-10-tenant-verification-and-gray` 产物、两份散落 PR 正文、
> 67 个无 manifest 的旧 `Active` 正文）保持原地并显式记入 knownGaps。

## 验证记录

- [x] 归档呈现：`git -c diff.renameLimit=3000 diff --cached -M --summary` → 19 条归档变更全部
  93–100% 的 `rename .harness/{ => archive/2026-10}/…`；另有 2 条新建（本包 manifest 与 task.md）
- [x] 状态读数：三份已归档 manifest `status=completed`；三份 `.task.md` frontmatter `status: Archived`
- [x] 索引一致性：移动前 `git ls-tree -d origin/main .harness/archive/2026-10/{tasks,evidence}` → 91 / 94；
  移动后 `ls | wc -l` → 94 / 97；合计 215/221，与 ARCHIVE.md 表格逐项对上
- [x] 关闭判据（消费者）：`gh pr view 166` → `mergedAt 2026-10-31T01:59:39Z`、`5676ffc`；
  `gh pr view 167` → `81d2941`；`gh pr checks 167` → SonarCloud Code Analysis、Go Lint、
  Backend Tests、Smoke Sanity、CodeQL、Docs Governance 全 pass
- [x] 关闭判据（底座）：#481 → `94a492ef`；#478 的 `Release Gate` 修复与 FR-025 已在 main
- [x] 治理门禁（worktree 内实跑）：`check-task-packet` → 四份正文 PASS；`check-doc-frontmatter` →
  0 error / 0 warning；`check-structure-contract` → 0 finding / 2983 tracked；`check-encoding` →
  0 finding / 2635 scanned；`check-failure-registry --strict` → 1 file / 0 error / 0 warning
- [x] `check-evidence --strict` / `check-review --strict`：归档后即时 `1 error` ×2（已如实记录），
  本包证据落盘后恢复 PASS
- [x] 环境噪声与被排除的假回归：worktree 内 `check-adoption` 报
  `../pantheon-harness/patterns/tool-adapter-matrix.md` missing，根因是嵌套根把 sibling 解析到
  `pantheon-base/.tmp/pantheon-harness`；主仓同命令只剩既有 `openspec` warning。本包以对照读数说明，
  不改链接写法去迎合 worktree
- [ ] hosted 回读（Docs Governance / PR Governance Prereq / harness 各 strict 作业）：待本 PR 的 checks 落定后回填

## 审核留痕

- Copilot review：待本 PR 打开后经包装器请求；若再次返回不可用将如实记录而不是写成已审
- CodeQL 结果：本 PR 只含 Markdown 与 JSON 档案，预计无新增告警；以 PR checks 上的 `CodeQL` 为准
- GitHub checks 结果：待回读（打开 PR 后按 run 详情逐条记录，不用本地读数替代）
- Auto-merge：沿用仓库 `pr-automation` 的默认策略；本包不自批
- Duplication Gate 结果：本包未新增重复文本；hosted 判定为准
- 是否高风险改动：no（纯治理档案移动与索引更新，无源码、无 workflow、无权限/审计链路、无依赖变化）
- 本包自审立场：实现者写的 4 个证据文件由「逐条 posture 读数」形式的 review.md 独立复核，
  每条给实测读数与判定
- Residual risk / follow-up：①`check-evidence` / `check-review` 的 live-tree-only 口径未接档案回退，
  接回退或接 CI 前需先定口径（归维护者）；②hosted 回读尚未产生，不预先写成 passed；
  ③`.tmp/closeout-0182` worktree 的 sibling 解析噪声是本地执行环境产物，PR 提交后移除 worktree；
  ④`pantheon-ops` 两个已合并远端分支的删除被 Auto Mode 的 Git Destructive 分类器拦下，
  Branch Hygiene 已按 main 调度并在同一入口清理；⑤历史残留显式延期，不静默清理

## 检查清单

- [x] 三份 manifest `status=completed`、三份 `.task.md` `status: Archived`
- [x] `git mv` 呈 rename（19 条 93–100%），目录计数与 ARCHIVE.md 统计一致（94/97、合计 215/221）
- [x] `linkage` 路径未改写，归档后 `check:task-packet` 仍按规范路径给 `[PASS]`
- [x] 关闭判据为主机实测读数（ops 两个 merge 提交号与 PR 检查、#481 合并提交）
- [x] 治理门禁在 worktree 内通过，环境噪声以主仓对照读数区分
- [x] 未动产品代码、CI 作业、门禁阈值、`.foundation/**`、发布资产与消费者仓库
- [ ] hosted 检查回读待回填
