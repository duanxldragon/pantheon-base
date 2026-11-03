# Review — 2026-10-31-audit-p2-doc-metadata-and-index

## Reviewer posture

| 检查项 | 结论 | 依据 |
| --- | --- | --- |
| 字段定义只存在于一处 | 通过 | 字段清单只在 `DOCUMENT_FRONTMATTER_SCHEMA.md`；`DOCUMENT_METADATA_AND_STATUS`(zh/en) §2 已改为指针，只保留 `doc_type`/`status` 两个枚举；harness 版 12 行指针 + `Archived` |
| 另两份不再重复定义 | 通过 | `grep -rn "DOCUMENT_FRONTMATTER_SPEC" docs` 剩余引用只指向归档说明，无“本文定义字段”表述 |
| scope 矩阵结论均有代码行号 | 通过 | `dept/post` 行附 `dept_service.go:28/88/112`、`post_service.go:26/144`；§4 三行分别给 middleware、`login_tenant_switch.go`、合同 §6 |
| dept/post 归类与实现一致 | 通过 | 归类 `tenant-owned`；依据是表带 `tenant_id`、service 嵌入 `tenant.Scoper`、创建写 `TenantOwnerID()`、读走 `Scoped()` |
| 中英同步 | 通过 | 矩阵、metadata、HARNESS contract 三处均改了 `.en.md`；没有出现“中文已更正、英文仍旧”的分叉 |
| 检查器输出能回答“覆盖多少份” | 通过 | 输出含“415 扫描 / 302 带元数据 / 113 不强制”与强制目录清单（4 目录 / 4 份文档） |
| 没有一次性把存量文档变红 | 通过 | 采用方案 (b)，强制范围维持 4 个目录；113 份无元数据文档只计入信息性数字 |
| 单测随之更新且通过 | 通过 | `node --test tests/docs/frontmatter-check.test.mjs`：13 tests / 13 pass；新增 `summarizeCoverage` 用例锁定三个口径 |
| 7 份 legacy 任务包元数据真实 | 通过 | title 取 archive manifest、layer 取文档 `## Primary Layer`、status 取 manifest `completed`、linked_contracts 指向真实合同文件且 `check-task-packet` 92/92 PASS |
| 没有改写历史结论 | 通过 | 矩阵的更正以“2026-10-31 更正（AUD-009）”标注并保留原文引用；`docs/history` 未触碰 |

## 偏离与处置

1. **没有采用方案 (a)**：任务包把 (a)/(b) 并列为可选，落 (b) 的理由写在 schema §11.3 与 `summary.md`：
   (a) 会让 113 份文档同时变红，只剩“阻塞 PR”或“永久白名单”两种结局。该选择标记为 human gate 项，
   若维护者要求扩大强制，改动点已收敛到 §11 + `ENFORCED_DIR_PREFIXES` 两处。

2. **`HARNESS_ENGINEERING_CONTRACT`(zh/en) 被改**：不在任务包 `Expected Files.Modify` 列表里。改的理由是
   它把已归档的 `DOCUMENT_FRONTMATTER_SPEC.md` 称作校验依据——不改就等于把“权威”留在归档文件上，
   AUD-008 的目标（同一个问题只有一个答案）无法达成。只改这一句，未动其它条款。

3. **`docs/harness/DOCUMENT_FRONTMATTER_SPEC.md` 未删除**：任务包 `Out` 明确“删除需单独立项”，
   处置为指针 + `status: Archived` + `linked_contracts` 指向 schema。

4. **legacy 任务包的 `updated_at` 统一写 `2026-10-31`**：反映的是“本文最后一次被修改”的日期（本次补
   frontmatter），不是任务完成日期；任务日期由文件名与 manifest 承载，不靠该字段。

## Gap

- 113 份文档仍无元数据（方案 b 的显式边界，非遗漏）。
- 任务包状态与证据的一致性校验仍未接门禁（W8）。
- 矩阵 §5 “维护责任”是历史登记，未改。

## Machine Readable

```json
{
  "taskId": "2026-10-31-audit-p2-doc-metadata-and-index",
  "verdict": "approved",
  "structuralReview": {
    "affectedSubgraph": [
      "docs/contracts/DOCUMENT_FRONTMATTER_SCHEMA.md",
      "docs/contracts/DOCUMENT_METADATA_AND_STATUS.md",
      "docs/harness/DOCUMENT_FRONTMATTER_SPEC.md",
      "docs/designs/TENANT_RESOURCE_SCOPE_MATRIX.md",
      "scripts/frontmatter-check.mjs",
      "tests/docs/frontmatter-check.test.mjs"
    ],
    "checks": [
      "cycle",
      "hub",
      "sensitive-flow"
    ],
    "findings": [],
    "notes": "Metadata authority convergence plus scope-matrix correction: one field definition, status semantics only in the metadata contract, harness spec demoted to an archived pointer, gate declares its coverage boundary and prints it, dept/post reclassified with code line references, seven legacy task packets backfilled with frontmatter."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-31-audit-p2-doc-metadata-and-index/manifest.json",
    "evidence": ".harness/evidence/2026-10-31-audit-p2-doc-metadata-and-index/commands.json",
    "reviewFile": ".harness/evidence/2026-10-31-audit-p2-doc-metadata-and-index/review.md",
      "changeRef": "none",
      "planRefs": [
              "docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-10-31.md",
              "docs/contracts/DOCUMENT_FRONTMATTER_SCHEMA.md",
              "docs/contracts/TENANT_CONTRACT_V1.md"
      ]
  }
}
```
