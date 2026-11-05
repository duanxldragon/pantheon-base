# Review — 2026-11-04-archive-governance-scope-repair

Reviewer posture: mechanical + architecture-fitness. Reviewed the three checker diffs, both legacy configs, and a sample of the archived artifacts touched (append-only verified with `git diff --numstat` per file).

## 结构复核

- 三个检查器的发现范围统一到 `live + .harness/archive/<month>/evidence`，共用 `listArchiveMonths()`；引用解析统一到 `resolveArchiveAwarePath`，与 `scripts/task-manifest.mjs` 既有约定一致，没有引入第二套路径规则。
- `check-evidence` 的代际作用域是单一常量、单点判定（`classifySchemaGeneration`），并保留 `File does not exist` / `Invalid JSON` 两类永远 gate；历史缺口以计数与逐条 `pre-schema:` 行打印，可见性没有下降。
- 敏感度判定改为声明优先（evidence → task packet → 文本回落），把「作者已明确说不是运行时敏感」的包从误报里摘出来；没有新增字段，没有放宽 `runtimeLogs/Metrics/Traces/Performance` 与 `runtimeGap` 的既有语义。
- 豁免按文件具名且条目消失即报错，符合 `config/task-packet-legacy-docs.json` 与 `review-loop-legacy-artifacts.json` 既有模式。
- 同一作用域缺陷在本包收尾时第二次现形：`check-failure-registry.mjs` 的 `findRegistryTable` 遇空行即停，`FR-026` 行因此落在表外（渲染成无表头孤立表）从未被校验。修复只在表内跨空行、遇正文停止，并由 `tests/scripts/harness-check-failure-registry.test.mjs` 同时钉住「跨空行仍校验」与「正文后不再当表」两半。

## 风险与残留

1. 代际作用域让 205 条历史结构缺口不再阻断。缓解：负向差分（阈值改 2020-01-01 立刻 205 error）+ 计数打印 + `scripts/harness/README.md` 作用域说明。彻底清偿需要「回填 vs 永久分层」的决定，登记在 `knownGaps`，归维护者。
2. `runtimeSensitive: false` 成为权威声明后，作者可以用它规避运行时证据要求。本包不新增「声明与 runtimeEvidence 文本矛盾」的一致性检查（那会立刻把若干历史包标成违规），把它留作显式后续。
3. 归档 `review.md` 的机器块是重述而非原始记录。每份块下都写了重述说明，散文仍是权威；审阅时以 `numstat N/0` 为准。
4. 当前后端 build 红在未跟踪的 `aud001bcheck` 在途产物，落地前必须由该路收敛并复跑。
5. `FR-027` 的第二实例（登记表空行截断）说明「传感器的发现作用域」是一类会重现的缺陷，而不是一次疏漏：本轮只修了证据三检查器与登记表扫描，没有增加「观测文件数 vs 应观测集合」的通用不变式。后续若再加检查器，仍需按 `scripts/harness/README.md` 作用域小节自证范围。
6. 并发设计文档 agent 触顶后未完成的文档包让 `check-doc-links --root . --strict` 读红（16 条悬空内部链接，指向缺失的 APPROVAL/SCHEDULER/TASK 同级文档）。该红属于设计文档轮：这些文件未跟踪、不属于本治理包，落地 PR 不 stage，故 CI 不会看到；本地红已如实记录在 `commands.json`。

## 判定

approved with documented P2 follow-up — 三个 strict 门禁在扫到归档全量的前提下 exit 0，改动承重有负向差分背书，历史债务以计数与具名豁免显式登记而非沉默；残留六项（205 条历史缺口的处置、false 声明的一致性检查、在途 Go 产物复跑、检查器作用域不变式缺位、登记表空行实例的同类风险、设计文档轮的 16 条悬空链接）已写入 `knownGaps` 与本节。

## Machine Readable

```json
{
  "taskId": "2026-11-04-archive-governance-scope-repair",
  "verdict": "approved with documented P2 follow-up",
  "structuralReview": {
    "affectedSubgraph": [
      "check-evidence / check-review / check-runtime-evidence -> .harness/evidence + .harness/archive/<month>/evidence -> config/*-legacy-artifacts.json"
    ],
    "checks": [
      "call-depth",
      "sensitive-flow"
    ],
    "findings": [
      "205 pre-2026-10-26 structural findings are counted and printed instead of gated; clearing them needs a maintainer decision (backfill vs permanent generation split) and is recorded in knownGaps.",
      "runtimeSensitive: false now wins over verificationPlan.runtimeEvidence prose, with no consistency check for a false declaration that still plans runtime evidence.",
      "backend go build/vet is red on the untracked modules/business/aud001bcheck in-flight artefact from a concurrent P3 agent; it must converge and be re-run before landing.",
      "check-failure-registry.mjs silently skipped every row after a blank line (FR-026 was never validated); the class is the same silent-scope-loss recorded as FR-027, so the fix is scanner-side plus a regression test, not a one-off data repair.",
      "check-doc-links --strict is red with 16 dangling internal links in the in-flight design packages (missing APPROVAL/SCHEDULER/TASK sibling docs); it is untracked, out of this packet's scope and not staged by the landing PR."
    ],
    "notes": "Append-only verified on every touched archived artefact (git diff --numstat N/0, single hunk). Verdicts restated from each artifact's own prose; nothing invented."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-11-04-archive-governance-scope-repair/manifest.json",
    "evidence": ".harness/evidence/2026-11-04-archive-governance-scope-repair/commands.json",
    "summary": ".harness/evidence/2026-11-04-archive-governance-scope-repair/summary.md",
    "reviewFile": ".harness/evidence/2026-11-04-archive-governance-scope-repair/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-11-04-archive-governance-scope-repair.task.md",
      "docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-11-04.md"
    ]
  }
}
```
