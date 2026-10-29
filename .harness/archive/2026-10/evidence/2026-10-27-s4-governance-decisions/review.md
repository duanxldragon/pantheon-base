# Review — S4 `2026-10-27-s4-governance-decisions`（治理面残留项决策）

Reviewed against branch `decision/s4-governance-surfaces-2026-10-27` (stacked on
`refactor/s1-dead-code-removal-2026-10-27`). The packet is a decision wave: the review
question is whether every item has exactly one decision with a reason and a cost, every
keep-and-check names a real checker and run location, every delete produced a follow-up
packet id, and no file was deleted. Each `reviewerPosture` item is answered with the
artefact that settles it.

## Reviewer posture, item by item

| Posture item | Reading |
|---|---|
| Every item has exactly one decision and a reason | §0 of the decision document has one row per item (RC-036 keep-and-check, RC-037 keep-and-check executed this wave, RC-038 keep-as-is, RC-031 keep-as-is, RC-043 delete), each with a one-paragraph reason and a cost column. No item carries two decisions. |
| Every keep-and-check names a real checker and a real run location | RC-036: `scripts/harness/check-doc-bilingual.mjs` with a concrete comparison spec (heading skeleton + code fences + link targets) and its run location (Docs Governance, beside `check-doc-links.mjs`), plus the explicit note that CI wiring needs maintainer approval — the spec is registered, not wired. RC-037: the "check" is the index itself, executed this wave in `docs/README.md` §4.1. |
| Every delete decision has a follow-up packet id | RC-043's delete produced `.harness/tasks/2026-10-27-s4-re-export-alias-removal/manifest.json` (status=planned) naming exactly the ten measured zero-consumer aliases and requiring the dual-repo build + full suite as the equivalence proof. `check-task-packet.mjs` validates the new manifest. |
| No file deleted in this wave | `git diff --stat` contains only: the new decision document, the README index line, the new follow-up packet manifest, this evidence directory, and the S4 status flip. The packet's `doNotTouch` set (`.harness/archive/**`, `docs/**/*.en.md`, `scripts/harness/**`, `.github/workflows/**`, `frontend/src/core/router/types.ts`) is untouched. |

## Fact-checks behind the decisions

- **RC-043 measurement supersedes the audit count** (12 → 10): the per-symbol loop counted
  `common\.<Sym>\b` qualified-reference files across `backend/` (excluding re_export.go) and
  `../pantheon-ops/backend/`. The eight consumed aliases (Fail 26/48, Success 22/44,
  FailWithError 17/37, …) stay; the ten zero-consumer ones go to the follow-up packet. The
  "bare name inside pkg/common" hits are the defining packages' own use (`commonhttp.`,
  `security`), which is exactly why the aliases are dead while the functions live.
- **RC-031's RouteDataWarmer red herring checked**: `prefetch.ts` consumes `RouteDataWarmer`,
  which does not reference the widget family — the DashboardWidget* family remains
  types.ts-only (i18n hits are key-name substrings).
- **RC-036/038 count drift recorded, not hidden**: 95 vs 99 copies, 659/1193 vs 659/1081 —
  the drift is expected (doc and evidence waves moved the numbers since the audit) and is
  captured in commands.json knownGaps per the program rule that measured figures replace
  audit estimates.

## Governance notes

- **Human gate (five maintainer decisions)**: resolved as maintainer-delegated decisions
  recorded in [decisions.md](decisions.md), open for review; overrides affect only the
  follow-up packets since this wave deleted nothing.
- **Dependency enforced mechanically**: the branch is stacked on the S1 deletion wave, so the
  PR cannot merge before it regardless of review speed.
- **No CI gate added** without maintainer approval — the bilingual checker is spec-only this
  wave, per AGENTS.md.

## Machine Readable

```json
{
  "taskId": "2026-10-27-s4-governance-decisions",
  "verdict": "approved",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-27-s4-governance-decisions/manifest.json",
    "evidence": ".harness/evidence/2026-10-27-s4-governance-decisions/commands.json",
    "reviewFile": ".harness/evidence/2026-10-27-s4-governance-decisions/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-27-codebase-simplification-program.task.md",
      "docs/reviews/REDUNDANT_CODE_CANDIDATES.md",
      "docs/reviews/GOVERNANCE_SURFACE_DECISIONS_2026-10-27.md"
    ]
  }
}
```
