# Review — dependabot-sprintf-js-dos

## Verdict

Accepted. The change removes the only open Dependabot alert without touching runtime code, and
without the collateral version drift a full lockfile re-resolve would have produced.

## Review points

- **Scope discipline.** Two files changed: `frontend/package.json` (override) and
  `frontend/package-lock.json` (45 deleted lines). No source, workflow, backend or docs changes.
- **Correctness of the override.** `load-nyc-config` consumes `js-yaml` through
  `require('js-yaml').load(...)` only. `load()` is present in js-yaml v5 and behaves as a safe
  parser; the exercised `.nycrc.yml` round-trip confirms real config parsing still works.
- **No orphan references.** `npm ci --dry-run` independently confirms the lockfile is internally
  consistent and that only the four now-unreferenced packages are removed.
- **No upstream fix exists.** `sprintf-js@1.1.3` is the latest release and is still inside the
  vulnerable range, so pinning to a patched version was not an option; eliminating the dependency
  edge is the stronger outcome.
- **Alert closure is downstream.** Dependabot re-evaluates the dependency graph on the default
  branch, so alert #43 is expected to move to `fixed` after this lands on `main`. That is a
  follow-up observation, not a gap in the fix.

## Reviewer posture

- Assume the override could silently disable the coverage tooling: covered by the executed
  `load-nyc-config` YAML parse plus `npm run lint` / `npm run type-check`.
- Assume a hand-edited lockfile is subtly invalid: covered by `npm ci --dry-run`.
- Do not accept a broad `npm update`-style re-resolve as a security fix: explicitly rejected,
  with the 104-package drift recorded in the evidence.


## Machine Readable

```json
{
  "taskId": "2026-10-11-dependabot-sprintf-js-dos",
  "verdict": "approved",
  "verdictRationale": "Accepted: removes the only open Dependabot alert without touching runtime code or the collateral drift a full lockfile re-resolve would cause.",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-11-dependabot-sprintf-js-dos/manifest.json",
    "evidence": ".harness/evidence/2026-10-11-dependabot-sprintf-js-dos/commands.json",
    "reviewFile": ".harness/evidence/2026-10-11-dependabot-sprintf-js-dos/review.md",
    "changeRef": "none",
    "planRefs": [
      ".harness/tasks/2026-10-11-dependabot-sprintf-js-dos/manifest.json"
    ]
  }
}
```

> This block was backfilled on 2026-10-26 during the governance-schema repair round. It restates the verdict already written above in machine-readable form and links the artifacts that existed for this task; no conclusion, finding or verification claim was added, removed or reworded. The prose remains authoritative.
