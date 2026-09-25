---
task_id: 2026-09-22-document-relocation-and-archive
title: Relocate or archive out-of-place documents
created: 2026-09-22
status: completed
priority: P2
layer: platform
risk: low
---

# Task Packet — 2026-09-22-document-relocation-and-archive

## 背景

`NAMING_AND_BOUNDARIES_REMEDIATION_PLAN_2026-09-22.md` Wave 2 第 5 项，依赖 Wave 0
盘点（`2026-09-22-document-layout-inventory`）与 canonical 规范。按盘点结果执行**最小范围**
迁移或归档，更新索引与引用；无法确认归属者保留原位并记录理由。

## 执行结果

### 归档（`docs/archive/**`）

| 原路径 | 新路径 | 理由 |
| --- | --- | --- |
| `docs/system_design.md` | `docs/archive/upgrade/SYSTEM_DESIGN_v0.9.0_RENAME.md` | v0.9.0 重命名一次性设计 |
| `docs/engineering_handoff.md` | `docs/archive/upgrade/ENGINEERING_HANDOFF_v0.9.0_RENAME.md` | 已完成的实现交接单 |
| `docs/class-diagram.mermaid` | `docs/archive/upgrade/class-diagram.mermaid` | 仅被上述两份引用 |
| `docs/sequence-diagram.mermaid` | `docs/archive/upgrade/sequence-diagram.mermaid` | 仅被上述两份引用 |
| `docs/SECURITY_SCAN_REPORT.md` | `docs/archive/baselines/SECURITY_SCAN_REPORT_20260821.md` | 一次性扫描基线 |
| `docs/PANTHEON_BASE_CODE_REVIEW_CHECKLIST.md` | `docs/archive/baselines/PANTHEON_BASE_CODE_REVIEW_CHECKLIST.md` | 已被 `CODE_REVIEW_STANDARD.md` 取代 |

4 个 `.md` 归档件补齐归档 frontmatter（`index_group` / `retention_reason` /
`linked_contracts` / `status: Archived`）；`.mermaid` 非 `.md`，无需 frontmatter。

### 引用更新

- 归档件内部对 `docs/system_design.md` / `docs/class-diagram.mermaid` /
  `docs/sequence-diagram.mermaid` 的引用改为新归档路径（无残留旧路径）。
- `fix-report.md` 对审查清单的引用更新为归档路径并标注取代关系。
- 保留在位的 `DEPLOYMENT_GUIDE.md` / `DEV_DB_INIT_GUIDE.md` 引用**不变**（它们未被移动）。

### 索引补全（盘点结论 KEEP_ADD_INDEX）

- `docs/README.md` 新增 §4.3 运行指南（部署 / 开发库 / 版本管理）与 §4.4 测试与 Harness 指南。
- `docs/README.en.md` 新增 “Operations and guides” 分组。

## 边界

- 不移动盘点判定为 KEEP 的文件（`DEPLOYMENT_GUIDE.md`、`DEV_DB_INIT_GUIDE.md`、
  `VERSION_MANAGEMENT_GUIDE.md`、4 个 `testing-*.md`、2 个 harness 指南）。
- 不重写 `.harness/**` 历史 manifest/evidence（记录不可篡改；`check-doc-links` 不扫描 `.harness`）。
- 不改任何代码/合同正文。

## 验证集合（已执行）

| 验证 | 命令 | 结果 |
| --- | --- | --- |
| frontmatter（严格） | `node scripts/frontmatter-check.mjs` | passed，266 docs / 212 带 frontmatter |
| harness frontmatter | `node scripts/harness/check-doc-frontmatter.mjs --root . --strict` | 0 error（仅既有 legacy warning） |
| 文档内链 | `node scripts/harness/check-doc-links.mjs --root . --strict` | 0 findings |
| harness 脚本清单 | `node scripts/harness/check-doc-inventory.mjs --root . --strict` | 0 findings |
| 结构门禁 | `node scripts/harness/check-structure-contract.mjs --root . --strict` | 0 findings |

## Human gate

- 纯文档搬迁 + 索引更新，无运行时/接口/权限变更 → 无新 gate。

## 评审视角（Reviewer 检查点）

- [x] 是否批量盲移？——否，仅按盘点结论搬 6 个低扇出文件；高扇出文件保留并补索引。
- [x] 是否产生断链？——否；`check-doc-links` 0 findings，归档件内部引用已改。
- [x] 归档 frontmatter 是否合规？——是；`frontmatter-check` 通过（归档目录要求 `index_group`
      / `retention_reason` / `linked_contracts` / `Archived`）。
- [x] diff 是否可回退、可审查？——是，纯路径变更 + 少量链接/frontmatter 编辑。

## 残余 gap（显式）

- `.harness/**` 内对已移动文档的历史路径引用未改写（记录性质，非门禁可见）。
- 4 个 `testing-*.md` 与 2 个 harness 指南仍在 `docs/` 根部，按盘点理由保留（currency 未确认 /
  doc_type 不适配归档分类）。
