# Review artifact — 2026-10-11-sonar-smoke-helper-smells

## Verdict

**Accept.** The fix separates the 17 findings into two honest categories and treats each the only
way that is both safe and verifiable on this host: provably-equivalent mechanical fixes for the 6
structural smells, and justified suppressions for the 11 intentional sequential-await sites.

## Review points

- **The diagnosis is measured, not assumed.** A component-scoped issue search against the old
  `system-pages.spec.ts` shows 0 issues across all analyses, which pins the root cause: the file
  split re-classified long-lived code as new code. The smells predate PR #373.
- **The S7763 fix was gated on a usage check.** Converting import-plus-re-export to
  `export ... from` is only equivalent if the symbols are not used in the file body; that was
  verified by grep before editing, not assumed from Sonar's report.
- **The S4043 fix preserves ordering semantics.** `targets.reverse()` stays in-place and moves to a
  statement before the loop, so the children-before-parents dept deletion order — which the suite
  depends on — is untouched. A `toReversed()` or spread-copy rewrite was rejected as gratuitous.
- **The NOSONAR suppressions carry reasons, not apologies.** Each of the 11 sites states why the
  sequential await is intentional (deterministic teardown order, per-delete headers, ordered
  seeding, sequential auto-retrying assertions). This matches the repo's existing NOSONAR
  convention and keeps the intent reviewable in place.
- **The alternative was rejected for cause.** Parallelising the delete loops could let a parent
  dept delete race ahead of its children and fail inside a `.catch(() => undefined)` — a silent
  fixture regression that no local run could catch, since Playwright cannot execute here.
- **Scope stayed closed.** No exclusion was added to `.sonarcloud.properties` (tests stay fully
  analysed by design) and no workflow change was made; the gate that fired was correct.
- **Residual risk is explicit:** the executed proof is CI (L1 + module suites plus the SonarCloud
  re-analysis), since this host cannot spawn Playwright. The structural-equivalence argument is
  strong, but the first local-equivalent execution is the CI run itself.


## Machine Readable

```json
{
  "taskId": "2026-10-11-sonar-smoke-helper-smells",
  "verdict": "approved",
  "verdictRationale": "Accept: 6 provably-equivalent mechanical fixes and 11 justified suppressions, with the executed proof being CI.",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-11-sonar-smoke-helper-smells/manifest.json",
    "evidence": ".harness/evidence/2026-10-11-sonar-smoke-helper-smells/commands.json",
    "reviewFile": ".harness/evidence/2026-10-11-sonar-smoke-helper-smells/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-11-sonar-smoke-helper-smells.task.md"
    ]
  }
}
```

> This block was backfilled on 2026-10-26 during the governance-schema repair round. It restates the verdict already written above in machine-readable form and links the artifacts that existed for this task; no conclusion, finding or verification claim was added, removed or reworded. The prose remains authoritative.
