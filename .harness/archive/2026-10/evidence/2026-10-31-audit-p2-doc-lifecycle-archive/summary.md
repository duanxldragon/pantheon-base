# Summary — 2026-10-31-audit-p2-doc-lifecycle-archive

## 为什么用“证据存在”当判据，而不是“作者认为完成”

审计的核心发现不是“文档写得差”，而是**完成态从未回写**：`docs/harness/tasks/` 里 70 份任务包停在
`status: Active`，其中相当一部分的证据早就随月度归档进了 `.harness/archive/**`。此前没有任何机械判据，
只能靠人回忆“这个任务做完了吗”，于是状态与事实永久分叉。

本包把判据写成代码（`scripts/harness/task-evidence-state.mjs`），三个条件同时成立才允许改状态：

1. 证据目录存在（live 或 `archive/<YYYY-MM>/evidence/` 下）；
2. 该目录下有 `summary.md`；
3. manifest `status: completed` **或** `summary.md` 含结果类小标题。

反过来说：**没有证据的包一律不动**。这条约束是为了防止本轮最常见的错误做法——批量改状态把
`Active` 计数降下来，把“未完成”洗成“已完成”。逐份判据表在 `archive-plan.md`，改前 status 从
`git show HEAD:` 读取，不是回填。

## 结果

| 项 | 数量 |
| --- | --- |
| 任务包文档总数 | 92 |
| 本包改为 `Archived` | 70（含本包自身任务文档：证据落盘后 `Draft` → `Archived`） |
| 原本已是 `Archived` | 7 |
| 保留 `Active`（证据在、manifest 仍 `in-progress`） | 3 |
| 保留 `Draft`（`planned`、无证据） | 5 |
| 无 frontmatter、状态无处落（legacy 包） | 7 |
| 改后分布 | `Archived` 77 / `Active` 3 / `Draft` 5 |

保留 `Active` 的 3 份都是有 live 证据但 manifest 明确 `in-progress` 的包（`v0180-simplification-release`、
`base-menu-filter-sql-literal-convergence`、`release-gate-checks-poll-resilience`），它们的工作确实没关，
改 `Archived` 就是造假。保留 `Draft` 的 5 份是 `planned` 且没有证据的后续包（`ci-checker-wiring`、`dead-code-legacy-surface`、`doc-metadata-and-index`、`token-cache-race`、`audit-remediation-programme`）。

## 6 份未实现设计为什么是 `Draft` 而不是 `Archived`

`Archived` 读作“做过并废弃”，而这 6 份表达的是“**想做但没做**”。代码侧证据：`backend/modules` 只有
`auth / business / lowcode / platform / system` 五个域，`grep -ril` 在 `backend/modules` 下找不到
alert / notice / report / scheduler / approval 的任何实现包；`frontend/src/modules` 同样只有
`auth / generated / lowcode / platform / system`。

处置：`status: Draft` + `updated_at: 2026-10-31` + 正文首段加一句未实现声明（中英同步）。涉及
`ALERT_MONITORING_CENTER_DESIGN`、`NOTICE_CENTER_DESIGN`、`REPORT_CENTER_DESIGN`、
`SCHEDULER_CENTER_DESIGN`、`TASK_CENTER_DESIGN`、`APPROVAL_WORKFLOW_DESIGN`（后者按审计的
`APPROVAL_*` 归入；它是业务域接入统一审批位的骨架约定，平台层同样零实现）。

`NOTIFICATION_SERVICE_DESIGN` 不在此列：它已在 `docs/designs/README.md` 的“运营中心设计（设计稿，尚未实现）”
分组里，且不在审计的 6 份清单内，本包不顺手改。

## AUD-018（零入链）已经由索引解决，不需要归档

`docs/designs/TASK_CENTER_DESIGN.md` 在本轮 W3 重建 `docs/designs/README.md` 时已进索引（“运营中心设计
（设计稿，尚未实现）”分组，中英各 1 处）。所以选择的路径是“**补索引**”而非“归档”，理由是：设计意图仍有
被检索的价值，归档会让它彻底沉底；而索引里已经明写“尚未实现”，不会误导读者。

## AUD-019：7 份移入 `docs/reviews/`，第 8 份不该动

审计列的 8 份 `docs/TENANT_*.md` 里，`TENANT_INITIALIZATION_GUIDE.md` 是**仍在维护的操作指南**
（`docs/README.md` §2.1、§4.3 的一线入口，`api/TENANT_API.md` 也在引），不是专题评审记录。把指南塞进
`docs/reviews/` 会把“现行怎么用”降级成“历史怎么评”。

处置：其余 7 份（3 份 2026-09 评审、4 份 2026-10 评估/决策）移入 `docs/reviews/`，与同目录其它评审一致；
`TENANT_SCOPE_FREEZE_DECISION_2026-10-15.md` 是**现行裁决**，移动后仍在 §4.5 索引里可直达，摘要句额外
标注“仍具有约束力，不适用‘可能已被取代’”。

移动同时把 7 份文件里的相对链接按新位置重算（`../contracts/`、`../designs/`、同目录 `./`），并修正 5 处
外部入链。**一处越界**：`docs/release-notes/RELEASE_NOTES_v0.14.0.md` 有一条指向
`../TENANT_MATURITY_FINAL_2026-09-29.md` 的链接，属于本包 `Do Not Touch` 的历史发布说明。不改就是
`check-doc-links --strict` 红灯，改就是动历史文档——选择改路径（只改这一处路径，不改任何正文与结论），
并在 `review.md` 里登记为强制副作用。

## AUD-011：只出清单，不动消费仓

8 份文档在 base 与 `pantheon-ops` 逐字节相同（sha256 前 16 位两两相等，见 `commands.json`）。
删除属 ops 仓动作，本包只交付清单与校验命令，交 ops 维护者执行；不跨仓改文件。

## 附带项：`.harness/STATUS.md` 补 v0.18.2

该文件停在 v0.18.1，而 `origin/main` 已发 v0.18.2（tag `pantheon-base-v0.18.2`，提交 `bb0498f5`，
`docs/release-notes/RELEASE_NOTES_v0.18.2.md` 存在）——与 AUD-006 是同一类“完成态未回写”。已补章节，
并把“已知缺口”改为“本地 HEAD `ef00738` 未同步 main”，避免下一轮把本地 VERSION（0.18.1）当成当前版本。

## 机械锁：本包只出判据，接线留给 W8

`scripts/harness/task-evidence-state.mjs` 导出了 `evaluateTaskLifecycleState(rootDir, taskId)` 与
CLI（`--json`），本包用它生成了逐份判据表。**门禁接线没有做**——`check-task-packet` 目前仍不比较
doc status 与证据；这正是 `2026-10-31-audit-p2-ci-checker-wiring` 的职责，已在该包 `findings` 之外
由本包显式登记（见 `review.md` 的 gap 段）。

## 显式 gap

- **AUD-011 的删除动作未执行**（跨仓，需 ops 维护者）。
- **门禁未接线**（W8）。
- 7 份被移动文档内部仍有形如 `` `docs/TENANT_MATURITY_FINAL_2026-09-29.md` `` 的反引号路径文本，属历史
  叙述、非链接，未改写；`check-doc-links` 只校验 markdown 链接，不因此误报。
- `docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-10-31.md` 里列出这 8 份旧路径的清单未改（历史审计记录），
  同一处路径现已指向 `docs/reviews/`。
