# Review — 2026-10-31-audit-p3-residual-closeout

逐条对照 manifest `executionRoles.reviewerPosture`。

## 1. AUD-021 撤的是豁免本身，不只是删了一行 import — ✅

判据不是“diff 里有删除”，而是被检文件数变了：撤豁免前 `check-search-toolbar-contract` 报
**102 module file(s)**，撤之后报 **106**，多出的 4 个正是 `src/modules/lowcode/templates/*.ts`。
如果只删 import 而保留豁免，这个数不会动，门禁对模板目录仍然是瞎的。

`EXEMPT_SEGMENTS` 常量与引用它的 filter 条件已整体删除（不是置空数组），
注释同步改写为“豁免已撤销”并说明原因，避免下一位维护者照着旧注释把豁免加回来。

## 2. 两条 AUD-021 锁在恢复旧行为时都会红 — ✅

两条锁守的是两件不同的事，所以各自验过一次负向：

| 锁 | 守什么 | 负向操作 | 读数 |
| --- | --- | --- | --- |
| `check-search-toolbar-contract` 第 10 条 | 模板目录不再是豁免区 | 恢复 `EXEMPT_SEGMENTS` | `not ok 10`，`# fail 1` |
| `generator-quality-contract` 第 14 条 | 生成器产物不含 `FilterPanel` | 往 `frontendGenerator.ts` 的 `imports` 数组拼 `'FilterPanel'` | `not ok 14`，`# fail 1` |

另外单独验过一次“门禁在真实仓库上会红”：把 `import { FilterPanel }` 塞回
`templates/listTemplate.ts`，`check-search-toolbar-contract.mjs` 输出
`1 finding(s)` / `[no-filter-panel]` / exit 1。这是撤豁免这件事**唯一有意义的证明**——
豁免还在时，同一份文件是 0 finding。

三次探测（模板、生成器、豁免）都已回滚，工作树无 `TEMP` 残留，已用 grep 核对。

## 3. AUD-025 的规则确实不阻断构建，且契约写清了为什么 — ✅

- 真实仓库：`frontmatter-check` exit 0，输出 `Active docs past the 90-day review window: 144
  (informational, not enforced — see DOCUMENT_METADATA_AND_STATUS §6.5)`。
  144 份逾期没有让门禁变红，这是设计意图，不是漏拦。
- 锁第 14 条断言 `result.ok === true`：负向（把 `activeReviewOverdue.length === 0` 加进 `ok`）
  立刻 `not ok 14`，失败信息 `overdue docs must not fail the gate / false !== true`。
  也就是说，“只报告”被偷偷改成“会阻断”会被立刻发现。
- 契约中英双版各新增 §6.5，写清规则、处置二选一、为什么不做成 error、以及首次读数与口径差异。

### 关于这条锁先红过一次（值得单独记）

写锁时 fixture 用了 `doc_type: Design`，而 `Design` 在 `DOC_TYPES_REQUIRING_CONTRACTS` 里，
两份文档因此因**缺 `linked_contracts`** 而红——与 90 天窗口无关。
如果当时不去看 `result.errors`，而是把 `assert.equal(result.ok, true)` 放宽成
“不抛异常就算过”，这条锁就会变成永远绿、永远证明不了任何东西的假锁。
修法是给 fixture 补一份可解析的 Contract 文档，而不是放宽断言。

## 4. AUD-028 的注释解释的是“为什么不需要 timeout” — ✅

原注释若写成“删除未使用的 cancel”，下一位维护者看到 `InitTracer` 慢时会把它加回来。
现在的注释直接说明：`InitTracer` 不收 context，`WithTimeout` 约束不到任何东西，
真正需要时限的是 shutdown 段（`tp.Shutdown` 收 ctx）。

`context` 包仍被 `:81` / `:194` / `:219` 使用，import 未动；`go build` / `go vet` /
`gofmt -l` 三清。

## 5. 没有借收口之名扩大改动面 — ✅

实际改动：

| 文件 | 改动 |
| --- | --- |
| `templates/listTemplate.ts` / `templates/index.ts` | 各删 1 行 import |
| `check-search-toolbar-contract.mjs` | 删 `EXEMPT_SEGMENTS` + filter 条件 + 改写注释 + 两处 `DESIGN.md §7.2` → `DESIGN_ENGINEERING_GUIDE.md §8.1` |
| `check-search-toolbar-contract.test.mjs` | `runGate` 支持 `extraFiles` + 第 10 条 |
| `generator-quality-contract.test.ts` | 第 14 条（前一轮已加）+ 本包更新其注释 |
| `frontmatter-check.mjs` | 90 天窗口计数 + `--report-overdue` |
| `frontmatter-check.test.mjs` | 第 14 条 |
| `DOCUMENT_METADATA_AND_STATUS{,.en}.md` | 各新增 §6.5 |
| `main.go` | 删 1 条语句 + 5 行注释 |

没有碰的：`InitTracer` 签名、shutdown 超时、`ENFORCED_DIR_PREFIXES`、任何 `Active` 文档的
`updated_at`、`templates/` 目录本身、`VERSION`、`CHANGELOG.md`。

`templates/` 目录 1,894 行死代码仍在——这是本包**主动没做**的事，理由与前置核对写在
`summary.md` 与 manifest `residualFindings.AUD-021b` 里，不是遗漏。

## 反向检查：四条锁真的会红吗

会，四条都各红过一次，且都是“人为恢复旧行为”而不是“改断言”：

1. 塞回 `FilterPanel` 到模板 → 门禁 exit 1；
2. 恢复 `EXEMPT_SEGMENTS` → 第 10 条红；
3. 拼 `FilterPanel` 进生成器 → 第 14 条红；
4. 把逾期计入 `ok` → docs 第 14 条红。

不存在“锁恒绿、只是实现碰巧对”的可能。

## 遗留（不在本包可关闭范围）

1. `templates/` 目录 1,894 行死代码（`AUD-021b`）——删除属独立决策。
2. 144 份逾期 `Active` 文档需要一次人工复核轮（`AUD-025-review-round`）——不能靠脚本批量完成。

两条均为 P3，均不阻断冻结。

（原第三条“门禁文案仍指向不存在的 `DESIGN.md §7.2`”已在复核过程中就地修掉：
既然本包本来就要改这个脚本，留着一个指向不存在文档的指针没有道理。故不再登记为残留。）

## Machine Readable

```json
{
  "taskId": "2026-10-31-audit-p3-residual-closeout",
  "verdict": "approved",
  "verdictRationale": "The three items are closed by measurement rather than by edit, and each one's justification changed once the cause was read properly. AUD-021 is the clearest case: the audit described it as a stray import of a retired component and offered two remedies, but the import was only a symptom. The directory holding it has been excluded from tsconfig since commit #120 — excluded because it failed to compile, not because it was being migrated — and nothing in the repo imports it, yet the search-toolbar gate exempted the whole directory as a transitional home. That exemption is why the retired component could sit there indefinitely and why the audit could only read the code as 'the generator still uses FilterPanel'. Deleting the import alone would have left the exemption in place, so the exemption was removed instead, and the proof is not the diff but the file count the gate now reports: 102 to 106, the four new files being exactly templates/*.ts. Two locks cover the two different halves — the checker test asserts the directory is no longer exempt, the generator test asserts the emitted List.tsx uses SearchToolbar — and each was verified red by restoring the old behaviour, plus a third probe that reintroduced FilterPanel into the template and watched the real gate exit 1. AUD-025 adds a 90-day review window as a reported count and never as a build failure, which is the only defensible choice at 144 overdue docs: making it an error would leave bulk-editing updated_at as the only way to turn the gate green, destroying exactly what the rule protects. The measured 144 (71 English mirrors, oldest 198 days) does not reproduce the audit's 102-at-60-days, and the contract says so rather than quietly adopting the new number. AUD-028 deletes a context.WithTimeout that bounded nothing because InitTracer takes no context, and leaves a comment explaining why no timeout belongs there, since a comment saying 'removed an unused cancel' would invite its return. What this review does not claim: the templates directory itself — 1,894 lines, five files, zero importers, tsconfig-excluded — is still present and is registered as AUD-021b rather than deleted, because removing it is a separate decision even though the downstream check (pantheon-ops references it only inside .foundation/releases/*/bundle snapshots) came back clean; the 144 overdue docs still need a human review round, which by design cannot be scripted; and the checker's own header and contract message, which cited a DESIGN.md §7.2 that no longer exists, were corrected in place to point at docs/frontend/DESIGN_ENGINEERING_GUIDE.md §8.1 — a one-line drift that was initially logged as a residual and then fixed rather than left behind, since the file was already being edited and leaving a pointer to a non-existent document is the exact failure this audit was convened about.",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-31-audit-p3-residual-closeout/manifest.json",
    "evidence": ".harness/evidence/2026-10-31-audit-p3-residual-closeout/commands.json",
    "reviewFile": ".harness/evidence/2026-10-31-audit-p3-residual-closeout/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-10-31.md",
      "docs/contracts/DOCUMENT_METADATA_AND_STATUS.md"
    ]
  }
}
```
