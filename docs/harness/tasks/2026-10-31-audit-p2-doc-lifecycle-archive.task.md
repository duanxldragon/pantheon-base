---
title: 文档生命周期收口：完成态任务包、未实现设计、孤立文档与根级索引（AUD-006/011/017/018/019）
doc_type: Remediation
layer: platform
status: Archived
depends_on_layers: []
linked_contracts:
  - docs/contracts/DOCUMENT_GOVERNANCE_CONTRACT.md
  - docs/contracts/DOCUMENT_METADATA_AND_STATUS.md
updated_at: 2026-10-31
---

# Task Packet: 2026-10-31-audit-p2-doc-lifecycle-archive

## Goal

审计发现文档体系的失真**不是“写得不好”，而是“完成态没有回写”**：`docs/harness/tasks/`
82 份任务包里 68 份仍标 `status: Active`（含 2026-08 的发布任务），而对应证据早已进
`.harness/archive/**`；6 份从未实现的设计标着 `Active`；1 份设计零入链；8 份 `TENANT_*`
躺在 `docs/` 根目录不进任何索引。

本包做**一次归档动作**把状态与事实对齐，并留下可机械复核的判据，避免下一轮继续累积。

## Primary Layer

platform

## Dependency Layers

- `platform`（文档状态与索引）
- `inheritance-sync`（AUD-011 的 8 份重复文档位于 `pantheon-ops`，需在消费仓执行）

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: deferred
- Release Requirement: none
- Downstream Sync Note: AUD-011 要求从 ops 删除 8 份与 base 逐字节相同的文档并在 ops 侧指向
  base；该动作在 ops 仓单独执行，本包只提供清单与校验命令。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `doc-lifecycle`
- Portable Failure Class: `stale-doc-state`
- Owner Layer: `foundation-source`
- Ratchet Decision: `gate-updated`
- Coverage Dimensions:
  - maintainability
  - method-health

交付层级：**L1**（纯文档状态收口，无运行面）。

## Contract Anchors

- `docs/contracts/DOCUMENT_GOVERNANCE_CONTRACT.md`：文档生命周期与归档规则。
- `docs/contracts/DOCUMENT_METADATA_AND_STATUS.md`：`status` 字段的语义（本包的判据来源）。
- `docs/harness/TASK_PACKET_SPEC.md`：任务包完成态的回写要求。

## Scope

### In

- **AUD-006**：把已完成任务包从 `Active` 改为 `Archived`。判据不是“看起来做完了”，而是
  `.harness/evidence/<taskId>/` 存在且其 `summary.md` 记录了完成读数；判据不足的留在 `Active`
  并在 evidence 里登记原因（**不猜**）。
- **AUD-017**：6 份未实现设计（`ALERT_MONITORING_CENTER_DESIGN`、`APPROVAL_*`、`NOTICE_CENTER_DESIGN`、
  `REPORT_CENTER_DESIGN`、`SCHEDULER_CENTER_DESIGN`、`TASK_CENTER_DESIGN`）的 `status` 从 `Active`
  改为 `Draft` 或 `Archived`，并在正文首段加一句“当前未实现，仅保留设计意图”。
- **AUD-018**：`docs/designs/TASK_CENTER_DESIGN.md` 零入链——ARCHIVE 或补进索引（与 W5 的索引补齐协同）。
- **AUD-019**：`docs/TENANT_*.md`（8 份）从 `docs/` 根移入 `docs/reviews/`（历史评审性质）或补进
  `docs/README.md` 索引；二选一须在 evidence 说明理由。
- **AUD-011**：给出 ops 侧 8 份重复文档的清单与逐字节校验命令（在 ops 仓执行，本包不跨仓改动）。
- **附带项**：`.harness/STATUS.md` 补 v0.18.2 章节——该文件停在 v0.18.1，而 `origin/main` 已发
  0.18.2（`bb0498f5`），属同类“完成态未回写”。已在文件头登记为已知缺口。
- 机械锁：新增/接线一个“Active 任务包必须有未归档 evidence”的检查（与 W8 的 checker 接线协同，
  本包只提供判据函数与清单，接线由 W8 完成）。

### Out

- 改写任何历史结论或评审正文。
- 删除任何文档（本包只做状态与位置调整；删除需单独立项并逐份 REVIEW）。
- 修改 `docs/harness/DOCUMENT_FRONTMATTER_SPEC.md`（属 W5 的元数据三合一）。
- 修改产品代码、迁移、CI。
- 在 ops 仓内执行删除（由 ops 按清单单独执行）。

## Expected Files

### Create

- `docs/harness/tasks/2026-10-31-audit-p2-doc-lifecycle-archive.task.md`
- `.harness/tasks/2026-10-31-audit-p2-doc-lifecycle-archive/manifest.json`
- `.harness/evidence/2026-10-31-audit-p2-doc-lifecycle-archive/{commands.json,summary.md,review.md,archive-plan.md}`

### Modify

- `docs/harness/tasks/*.task.md`（仅 `status` 字段，逐份按判据改）
- `docs/designs/{ALERT_MONITORING_CENTER_DESIGN,APPROVAL_*,NOTICE_CENTER_DESIGN,REPORT_CENTER_DESIGN,SCHEDULER_CENTER_DESIGN,TASK_CENTER_DESIGN}.md`
- `docs/README.md`（若选择“补索引”路径）

### Do Not Touch

- `docs/history/**`（HISTORICAL，只读）
- `docs/reviews/**` 的既有报告正文
- `.harness/archive/**`（归档证据是判据来源，不改）
- `backend/**`、`frontend/**`、`.github/**`
- `VERSION`、`CHANGELOG.md`、`docs/release-notes/**`

## Implementation Notes

- 判据先行：先把“什么算完成”写成一张表（taskId / evidence 存在 / summary 有完成读数 / 结论），
  再批量改 `status`。反过来做就是“批量改状态掩盖证据缺失”，正是本轮要消除的失败模式。
- `Active` 的语义在 `DOCUMENT_METADATA_AND_STATUS.md` 里有定义；若定义与现状不符，改定义要先于改状态，
  否则会把规范妥协成现状。
- 6 份未实现设计改 `Draft` 比 `Archived` 更准确：它们表达的是“想做但没做”，不是“做过并废弃”。
- `docs/TENANT_*.md` 8 份是评审/决策性质，移入 `docs/reviews/` 比塞进 `docs/README.md` 索引更符合
  现有目录语义；但 `TENANT_SCOPE_FREEZE_DECISION_2026-10-15.md` 是**现行决策**，应留在可达位置并进索引。
- AUD-011 的 8 份文件在两仓字节相同，校验用 `sha256sum` 对比，不要用“看起来一样”判断。

## Verification Plan

- `node scripts/harness/check-task-packet.mjs --root .`（改完后所有包仍合规）
- `npm run check:docs-frontmatter`
- `node scripts/harness/check-doc-links.mjs --root . --strict`
- `node scripts/harness/check-doc-inventory.mjs --root . --strict`
- `grep -h '^status:' docs/harness/tasks/*.task.md | sort | uniq -c`（Active 数量下降且剩余每份都有登记原因）
- `sha256sum` 对比 base/ops 的 8 份文档（AUD-011 清单）
- `node scripts/harness/check-evidence.mjs --root . --strict`

## Linkage

- Task ID: `2026-10-31-audit-p2-doc-lifecycle-archive`
- Task Manifest: `.harness/tasks/2026-10-31-audit-p2-doc-lifecycle-archive/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-10-31.md` §8.3/§8.4、`docs/contracts/DOCUMENT_METADATA_AND_STATUS.md`
- Evidence Directory: `.harness/evidence/2026-10-31-audit-p2-doc-lifecycle-archive/`
- Review File: `.harness/evidence/2026-10-31-audit-p2-doc-lifecycle-archive/review.md`

## Evidence Required

- `archive-plan.md`：逐份判据表（taskId / evidence 是否存在 / 是否改状态 / 若未改的原因）
- `commands.json`：改前改后的 `status` 分布、四条文档门禁读数、8 份文档的 sha256 对比
- `summary.md`：为什么用“证据存在”而不是“作者认为完成”作判据；6 份设计的 Draft/Archived 取舍
- `review.md`：逐条 reviewer posture

## Human Gates

- `TENANT_SCOPE_FREEZE_DECISION_2026-10-15.md` 是维护者裁决记录，移动位置前需确认仍可达。
- ops 侧删除 8 份重复文档属消费仓动作，需 ops 维护者执行并确认无本地引用。
- 若发现某份 `Active` 任务包实际未完成，不得改状态，应登记为 gap 并交回对应负责人。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] 每份 `Active` 任务包都有“已完成/未完成”的判据记录，无静默保留
- [x] 6 份未实现设计的 `status` 与正文声明一致
- [x] `docs/` 根目录不再有未入索引的 `TENANT_*`
- [x] AUD-011 的 8 份文档清单与校验命令落盘

## Execution Result（2026-10-31）

- **判据先行**：判据落成代码 `scripts/harness/task-evidence-state.mjs`（证据存在 + `summary.md` + manifest
  `completed` 或结果类小标题），再用它遍历 92 份任务包。逐份结果在
  `.harness/evidence/2026-10-31-audit-p2-doc-lifecycle-archive/archive-plan.md`。
- **状态收口**：69 份 `Active`/`Draft` → `Archived`；3 份保留 `Active`（manifest 仍 `in-progress`）；
  6 份保留 `Draft`（`planned`、无证据）。改后分布 `Archived` 76 / `Active` 3 / `Draft` 6。
- **6 份设计**：`ALERT_MONITORING_CENTER_DESIGN`、`NOTICE_CENTER_DESIGN`、`REPORT_CENTER_DESIGN`、
  `SCHEDULER_CENTER_DESIGN`、`TASK_CENTER_DESIGN`、`APPROVAL_WORKFLOW_DESIGN` 改 `status: Draft` +
  未实现声明（中英同步）；理由：`backend/modules` 与 `frontend/src/modules` 下无对应实现目录。
- **AUD-018**：`TASK_CENTER_DESIGN` 已由 W3 重建的 `docs/designs/README.md` 收录（“运营中心设计（设计稿，
  尚未实现）”分组），走“补索引”而非“归档”。
- **AUD-019**：7 份专题评审/TENANT_* 移入 `docs/reviews/`（`TENANT_INITIALIZATION_GUIDE.md` 是仍在使用
  的操作指南，留在 `docs/` 根），移动时重算了文件内相对链接并修正 5 处外部入链。
- **AUD-011**：8 份文档 base/ops sha256 逐字节相同，清单与校验命令落盘；删除属 ops 仓动作，未跨仓执行。
- **附带项**：`.harness/STATUS.md` 补 v0.18.2 章节（tag `pantheon-base-v0.18.2` / 提交 `bb0498f5` /
  发布说明 `docs/release-notes/RELEASE_NOTES_v0.18.2.md`）。
- **未做（显式）**：门禁接线（W8）；7 份 legacy 无 frontmatter 任务包的状态承载（W5）；ops 侧删除（跨仓）。
