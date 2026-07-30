# Review - 2026-07-30-local-consolidation

## Independent Review

Independent architecture, security, and mechanical review covered the seven
working-tree backend corrections and the recovery conflict resolution. The
initial review found that unexpected database errors from department validation
could be embedded in import row errors. The correction now returns only known
bad-request/forbidden validation errors as i18n keys and propagates all other
errors from `ImportPosts`.

The reviewer confirmed that:

- `main`'s scaffold security hardening was not regressed.
- token blacklist, seed cleanup, import localization, and deterministic test
  changes preserve their contracts.
- the task scope does not include unannounced API, schema, permission, or UI
  behavior changes.

The focused invalid-department, root-department, and forced database-error
tests, `gofmt`, `git diff --check`, and language-server checks passed. No
remaining code-review findings were reported.

## Sonar Duplication Remediation Review

Independent review approved the table-driven refactor of the four role-import
validation tests. It retains each original input row, the nil-error and failed
import expectations, and their expected i18n error keys. Each sequential
subtest creates and cleans up its own test database; no parallel execution or
range-variable closure hazard is present. `gopls check`, `go vet
./modules/system/iam/role`, a focused shuffled test repeated ten times,
`gofmt -d`, and `git diff --check` passed. The only remaining local gap is the
previously recorded unsupported native Windows cgo compiler for `-race`.

## Machine Readable

```json
{
  "taskId": "2026-07-30-local-consolidation",
  "verdict": "approved",
  "structuralReview": {
    "affectedSubgraph": [
      "token middleware -> blacklist key",
      "seed cleanup -> GORM Pluck",
      "post import -> i18n error key",
      "user profile test -> forced query failure"
    ],
    "checks": ["security boundary", "failure propagation", "scope"],
    "findings": [],
    "notes": "Initial database-error disclosure finding was fixed and independently re-reviewed. The later Sonar duplication remediation was independently approved with focused repeat-test and static-check evidence."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-07-30-local-consolidation/manifest.json",
    "evidence": ".harness/evidence/2026-07-30-local-consolidation/commands.json",
    "reviewFile": ".harness/evidence/2026-07-30-local-consolidation/review.md",
    "changeRef": "none",
    "planRefs": ["docs/harness/tasks/2026-07-30-local-consolidation.task.md"]
  }
}
```
