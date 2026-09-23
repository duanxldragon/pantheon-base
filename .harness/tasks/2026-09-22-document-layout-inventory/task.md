---
task_id: 2026-09-22-document-layout-inventory
title: Inventory document placement and references
created: 2026-09-22
status: completed
priority: P1
layer: platform
risk: low
---

# Task Packet — 2026-09-22-document-layout-inventory

## 背景

`NAMING_AND_BOUNDARIES_REMEDIATION_PLAN_2026-09-22.md` Wave 0 第 2 项。

`docs/` 根部堆了若干历史文档，但没有引用清单，无法判断哪些能移动、移动后会断哪些链接。

本任务只盘点，不移动任何文件。

## 交付物

`.harness/evidence/2026-09-22-document-layout-inventory/inventory.json`（机器可读）：

- 17 个 `docs/` 根部散落文件 + `docs/reviews` / `docs/operations` / `docs/runbooks` 目录，
  每条含 `path` / `category` / `classification` / `targetPath` / `references[]` /
  `referenceScope` / `rationale` / `migrationRisk` / `ownerLayer`。
- 分类取值：`KEEP_INDEXED`（已索引）、`KEEP_ADD_INDEX`（保留待补索引）、
  `ARCHIVE`（移入 `docs/archive/*`）、`MOVE`（移入规范目录并改全部引用）。

## 分类结论

| 处置 | 文件 |
| --- | --- |
| ARCHIVE → `docs/archive/upgrade/` | `system_design.md`、`engineering_handoff.md`、`class-diagram.mermaid`、`sequence-diagram.mermaid` |
| ARCHIVE → `docs/archive/baselines/` | `SECURITY_SCAN_REPORT.md`、`PANTHEON_BASE_CODE_REVIEW_CHECKLIST.md` |
| KEEP_ADD_INDEX | `DEPLOYMENT_GUIDE.md`、`DEV_DB_INIT_GUIDE.md`、`VERSION_MANAGEMENT_GUIDE.md`、4 个 `testing-*.md`、`HARNESS_GOVERNANCE_GUIDE.md`、`harness-pr-generator-guide.md` |
| KEEP_INDEXED | `GITHUB_GOVERNANCE_CHECKLIST{,.en}.md`、`GITHUB_REPOSITORY_SETUP{,.en}.md`、`docs/reviews`、`docs/operations`、`docs/runbooks` |

**删除候选：0**。每个散落文件要么有活跃引用，要么有基线/样例价值。

## 关键判断

- `DEPLOYMENT_GUIDE.md` / `DEV_DB_INIT_GUIDE.md` 扇出很高（README、k8s README、GitHub issue
  模板、生成器注释、维护脚本、checker 白名单）→ 保留原路径，只补索引。
- `VERSION_MANAGEMENT_GUIDE.md` 被 `releases/*`（发布 artifact）引用，移动需改发布记录 → 保留。
- `HARNESS_GOVERNANCE_GUIDE.md` / `harness-pr-generator-guide.md` 虽已被 `docs/harness/*`
  取代，但其 `doc_type` 无法归入 `docs/archive/*` 的严格分类（frontmatter-check 只允许
  Contract/Design/Assessment/Remediation/Acceptance）→ 保留 + 索引，不强行归档。
- `.harness/**` 历史 manifest/evidence 是记录，不重写；`check-doc-links` 不扫描 `.harness`，
  故归档迁移不会产生门禁可见的断链。

## 验证集合（已执行）

| 验证 | 命令 | 结果 |
| --- | --- | --- |
| 引用普查 | `git grep -n -E "docs/(system_design\|engineering_handoff\|DEPLOYMENT_GUIDE\|DEV_DB_INIT_GUIDE\|SECURITY_SCAN_REPORT)"` | 16 个文件命中，全部记入 inventory.json |

## Human gate

- 只读盘点，无文件移动、无代码/门禁变更 → 无新 gate。

## 评审视角（Reviewer 检查点）

- [x] 每条是否有目标分类或保留理由？——是，覆盖全部 17 个散落文件 + 3 个目录。
- [x] 是否有“被引用的文档被判为删除”？——否，删除候选为 0。
- [x] 是否机器可读？——`inventory.json`，字段固定。

## 残余 gap（显式）

- `testing-*.md` 四件套是否仍属当前测试体系未能确认，按计划“无法确认归属者保留原位并记录理由”。
- 归档执行、索引补全、`fix-report.md` 引用更新属 Wave 2 `2026-09-22-document-relocation-and-archive`。
