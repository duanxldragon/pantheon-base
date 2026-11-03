# Review — 2026-10-31-audit-p2-doc-lifecycle-archive

## Reviewer posture

| 检查项 | 结论 | 依据 |
| --- | --- | --- |
| 每份改为 `Archived` 的包都能找到完成证据 | 通过 | `archive-plan.md` 逐份列出 evidence 位置（live/archived）、`summary.md` 存在性、manifest status；改前 status 取自 `git show HEAD:`，不是回填 |
| 没有把“实际未完成”的包洗成 `Archived` | 通过 | 3 份 manifest 仍 `in-progress` 的包保留 `Active`；6 份 `planned` 且无证据的包保留 `Draft`；判据函数对证据缺失一律返回 `keep-active` |
| 6 份设计的 status 与正文声明一致 | 通过 | `status: Draft` + 首段未实现声明 + `updated_at: 2026-10-31`，中英各一份；依据是 `backend/modules` 与 `frontend/src/modules` 无对应实现目录（命令与输出见 `commands.json`） |
| `TENANT_SCOPE_FREEZE_DECISION` 仍可直达 | 通过 | 移入 `docs/reviews/` 后仍在 `docs/README.md` §4.5 索引，且该节明确写“现行裁决、仍具有约束力”；`docs/reviews/PANTHEON_BASE_FINAL_ACCEPTANCE_REVIEW_2026-10-21.md` 等处对它的引用不受目录变化影响（引用为仓库相对路径文本） |
| 本包没有删除任何文件 | 通过 | 只做 `git mv`（7 份）与状态/元数据修改；AUD-011 的删除留在 ops 仓 |
| AUD-011 只在清单层面交付 | 通过 | sha256 前 16 位两两相同，8 份全部 SAME；未跨仓改任何文件 |
| 未引入新承诺 | 通过 | 未在 README/DESIGN 新增功能描述；设计文档只是把“已标 Active 但没实现”改成 `Draft` 并加未实现声明 |
| 门禁全绿 | 通过 | `check-task-packet` 92 PASS / 0 FAIL；`frontmatter-check` 415 docs / 295 带元数据 exit 0；`check-doc-links`、`check-doc-inventory`、`check-evidence`、`check-encoding`、`check-doc-frontmatter --strict` 均 0 findings |

## 逐条偏离与处置

1. **`docs/release-notes/RELEASE_NOTES_v0.14.0.md` 被改动（越出 Do Not Touch）**：该文件有一条
   `[Maturity Assessment](../TENANT_MATURITY_FINAL_2026-09-29.md)` 链接，文件迁走后必然死链。
   选择只改这一处路径、不改任何正文与结论，并在 `summary.md` / `commands.json` / manifest
   `residualFindings` 三处登记。替代方案（保留旧路径副本或跳过移动）会制造两份同源文档，比改一行路径更糟。

2. **`TENANT_INITIALIZATION_GUIDE.md` 没有跟着移动**：审计把它记在“8 份 `docs/TENANT_*.md`”里，但它是
   仍在维护的操作指南（`docs/README.md` §2.1/§4.3 一线入口）。把指南降级成历史评审会让“现在怎么用”
   无处可查。因此实际移动 7 份，并在任务文档与 manifest 里改成 7（审计原文的 8 记为偏差说明）。

3. **`docs/README.md` 的一条主入口链接被降级为纯文本**：`2026-10-07-release-readiness-remediation.task.md`
   改 `Archived` 后，`frontmatter-check` 报 “main entry link must target Active docs only”。按
   `DOCUMENT_FRONTMATTER_SPEC` 的 “mention without direct main-entry link” 处理，保留路径可检索。

4. **7 份 legacy 任务包没有 frontmatter，状态无处落**：这些文件（2026-07/08/09 各 1–2 份）以
   `# Task Packet:` 开头、没有 YAML 头，`status` 字段不存在，机械改写会变成“无操作”。没有为了让数字好看
   而硬塞 frontmatter——补元数据属 W5（`2026-10-31-audit-p2-doc-metadata-and-index`），已在
   `residualFindings` 与 `knownGaps` 登记。

5. **判据模块是新增脚本，不是复用**：`scripts/harness/task-evidence-state.mjs` 复用了
   `scripts/task-manifest.mjs` 的 archive-aware 解析（`findArchivedReferencePath` /
   `findArchivedTaskManifestPath`），没有另写一套路径规则。新增而非内联，是因为 W8 要接门禁、
   本包要出判据表，两处必须用同一份定义。

## Gap

- **门禁未接线**：`check-task-packet` 仍不比较 doc status 与证据存在性，所以“下次又漂移”目前仍靠
  人工跑 `task-evidence-state.mjs` 发现。这是 W8 的范围，本包只交付判据函数与本次判据表。
- **AUD-011 的删除未执行**：ops 侧 8 份副本仍在，需 ops 维护者按清单执行。
- **7 份文档内部的反引号旧路径文本未改写**：如 `` `docs/TENANT_MATURITY_FINAL_2026-09-29.md` ``，
  属历史叙述而非链接，`check-doc-links` 不校验反引号内容；改写它们等于重写历史结论，不在本包范围。

## Machine Readable

```json
{
  "taskId": "2026-10-31-audit-p2-doc-lifecycle-archive",
  "verdict": "approved",
  "structuralReview": {
    "affectedSubgraph": [
      "docs/harness/tasks/*.task.md",
      "docs/designs/*CENTER_DESIGN*.md",
      "docs/reviews/TENANT_*.md",
      "scripts/harness/task-evidence-state.mjs",
      ".harness/STATUS.md"
    ],
    "checks": [
      "cycle",
      "hub",
      "sensitive-flow"
    ],
    "findings": [],
    "notes": "Doc lifecycle only: task packet statuses driven by evidence existence, six unimplemented designs moved to Draft, seven tenant topical records relocated into docs/reviews, STATUS backfilled with v0.18.2. No file deleted."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-31-audit-p2-doc-lifecycle-archive/manifest.json",
    "evidence": ".harness/evidence/2026-10-31-audit-p2-doc-lifecycle-archive/commands.json",
    "reviewFile": ".harness/evidence/2026-10-31-audit-p2-doc-lifecycle-archive/review.md",
      "changeRef": "none",
      "planRefs": [
              "docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-10-31.md",
              "docs/contracts/DOCUMENT_METADATA_AND_STATUS.md"
      ]
  }
}
```
