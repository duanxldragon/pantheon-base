# Review — `2026-10-28-tenantlist-s3776-followup`

Reviewed the working tree on branch `fix/tenantlist-cognitive-complexity`
(based on `origin/main` @ `1ae6481c`, the merge of PR #463). Measured diff:
3 tracked files, +34/−26, plus the task packet, the manifest and this evidence
directory.

This review stands on one fact that the previous packet did not have: the
finding is reproducible. `main`'s own copy of `TenantList.tsx`, measured with
the rule SonarCloud reports, still scores 16; the new copy scores nothing at the
15 threshold, and 10 + 5 when the threshold is lowered to expose raw values.

## Reviewer posture, item by item

| Posture item | Reading |
| --- | --- |
| Readings come from the same rule and the same file | All five measurements run `eslint-plugin-sonarjs@3`'s `sonarjs/cognitive-complexity` in `/d/tmp/sonarcheck` on copies of `TenantList.tsx`. The three inputs are: `origin/main` pre-#463, `1ae6481c` (what `main` ships today), and the working tree. The first two both read 16 at threshold 15, which is exactly what SonarCloud reports for `main`; the third reads nothing. |
| The threshold-4 run exposes per-function values | At threshold 4 the merged file shows one unit at 16 (the component), so nothing was masked by a second contributor. The new file shows two units, 10 and 5, so the score was not relocated into `renderBody()`. |
| The four states are predicate-for-predicate identical | `!tenantModeEnabled` → compat guide; `loading && tableData.length === 0` → `PageLoading`; `error && tableData.length === 0` → `PageRequestError`; otherwise `tableContent`. Returned elements, the `tenant-list__compat-guide` class, the `system.tenant.compat.desc` / `.action` keys, the `navigate('/system/setting/platform')` target and the `void loadData(query)` body inside `onRetry` are unchanged. The diff moves lines; it does not rewrite them. |
| `can(perm)` is untouched | The five permission flags and their `useCallback` dependency keep the values #463 merged. This packet deliberately does not revert a correct de-duplication just because it failed to move a metric. |
| No dependency, workflow, Sonar config or threshold changed | The diff contains no `package.json`, no `package-lock.json`, no `.github/**`, no `sonar-project.properties`, and no backend file. The plugin lives outside the tree. |
| Guide rule and registry entry describe the same failure | `AI_QUALITY_GOVERNANCE.md` §5.2 states the requirement (re-measure with the same rule, record before/after), and `FR-018` records the concrete trigger (the #463 claim, the post-merge reading, the neutral helper) with the same remedy. `check-failure-registry --strict` parses the new row. |

## Findings

- **P3, remote-only resolution**: the SonarCloud issue
  (`AaF89PoZ78TOH8UMk82y`) stays open until this branch merges and the next
  `main` analysis completes. The local reading is the same rule on the same
  file, which is as close to the remote reading as can be obtained without
  merging — but it is not the gate.
- **P3, the guard is a manual step**: §5.2 requires a re-measurement, and nothing
  enforces it. That is deliberately the smallest useful control: `sonarcloud-gate`
  already owns the authoritative reading, and the failure was in what the agent
  claimed before the gate ever ran. Promoting `sonarjs` into the repository
  dependency set and a CI step would be a maintainer decision.
- **P3, no browser evidence**: the rendered surface is unchanged by construction
  (same elements, same classes, same keys), so the packet relies on
  `PR Smoke Modules` for the tenant console page rather than a local Playwright
  run. Said plainly rather than implied.

## Machine Readable

```json
{
  "taskId": "2026-10-28-tenantlist-s3776-followup",
  "verdict": "approved",
  "structuralReview": {
    "affectedSubgraph": [
      "frontend/src/modules/system/iam/tenant/TenantList.tsx",
      "docs/harness/AI_QUALITY_GOVERNANCE.md",
      "docs/harness/failure-registry.md"
    ],
    "checks": ["cycle", "hub", "sensitive-flow"],
    "findings": [
      "P3 remote-only resolution: the SonarCloud issue closes only after merge and the next main analysis; local proof is the same rule measured on the same file (main copy 16, new copy none at threshold 15).",
      "P3 manual guard: AI_QUALITY_GOVERNANCE.md section 5.2 requires re-measurement but nothing enforces it; sonarcloud-gate remains the authoritative reading and promoting the plugin into CI is a maintainer decision.",
      "P3 no browser evidence: the change is a predicate-for-predicate extraction with an unchanged rendered surface; PR Smoke Modules covers the tenant console page."
    ],
    "notes": "Follow-up to 2026-10-28-release-gate-green, whose TenantList claim was falsified by main's post-merge SonarCloud analysis. The five isAdmin || hasPerm sequences merged as can(perm) were metrically neutral: sonarjs/cognitive-complexity does not count logical sequences in a plain const initializer, and both the pre-#463 file and the file main ships today measure 16 at threshold 15. The real contributor was the component body's four-state if/else-if/else chain, now extracted into a nested renderBody(); the component measures 10 and the new function 5 at threshold 4, with no finding at 15. Every predicate, returned element, class name, i18n key and onRetry body is carried over unchanged. Ratchet: FR-018 (maintainability / static-sensor-gap) plus an AI_QUALITY_GOVERNANCE section 5.2 rule requiring static-analysis fixes to be re-measured with the same rule before commit. Verification: eslint/tsc/vite green, task-packet, structure, encoding, frontmatter, doc-links, doc-inventory, UI gate, failure-registry, evidence and review checkers all at zero findings."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-28-tenantlist-s3776-followup/manifest.json",
    "evidence": ".harness/evidence/2026-10-28-tenantlist-s3776-followup/commands.json",
    "reviewFile": ".harness/evidence/2026-10-28-tenantlist-s3776-followup/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/AI_QUALITY_GOVERNANCE.md",
      ".harness/evidence/2026-10-28-release-gate-green/review.md"
    ]
  }
}
```
