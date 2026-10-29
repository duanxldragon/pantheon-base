# Review — 2026-10-12-flake-signal-remediation

## Verdict

Accepted. Both races are removed at their source, both are covered by sensors that fail against the
old code, and neither fix relaxes an assertion.

## What was actually executed on this host (versus argued)

Executed here:

- Go: `go build ./...`, `gofmt -l`, `go vet`; the new `pkg/database` unit tests; the full
  data-scope test set against live MySQL; the legacy-vs-fixed control experiment under `GOGC=20
  -count=25` (legacy fails run 1, fixed passes 3/3).
- Browser: `tsc --noEmit`, `eslint --max-warnings 0`, and `platform-shell-critical.spec.ts` run
  through real Chromium against a real local stack (backend on :8080 with MySQL + Redis, Vite on
  :5173), 4/4 passed twice.
- Repo gates: coverage contract, duplication, PR governance and the full harness suite.

Argued from evidence rather than reproduced locally:

- The pre-fix browser race did not fire in 12 local repeats. The claim that it was a
  mid-transition read rests on the CI log (248 vs 248; 215.5625 vs 108.265625) and on the standalone
  animation probe (immediate read 248, post-animation read 76).
- Hosted CI has not yet run the fixed code; the merge-commit push is the first hosted validation of
  the browser fix.

## Reviewer checklist

- [x] `buildDatabaseCacheNamespace` no longer references a pointer address anywhere.
- [x] The namespace string contains host, port and database name only — verified by asserting the
      exact value `mysql:127.0.0.1:3306/pantheon` for a DSN carrying `super_secret`.
- [x] A fallback still exists for dialectors without a usable DSN, so the cache cannot silently
      collapse into one shared namespace.
- [x] The new regression tests fail against the legacy implementation (demonstrated) — they are
      guards, not descriptions.
- [x] `MigrateDataScopePolicy`'s fail-closed behaviour, the `ShouldAutoMigrate` branch and every
      policy read path are untouched; the fail-closed suite still passes.
- [x] The sidebar assertions are unchanged: `collapsedWidth < initialWidth` and
      `expandedWidth > collapsedWidth`.
- [x] `settleElementLayout` only waits; it does not alter, clamp or widen any measured value.
- [x] The helper is shared by both specs, so no duplicated helper block was added.
- [x] Smoke coverage contract unchanged at 34 specs / 20 script entries.
- [x] No product source, workflow, SonarCloud configuration or package script was modified.

## Points a reviewer should challenge

1. **Is DSN-derived identity the right abstraction?** It fixes the aliasing and keeps the production
   cache meaningful, but it couples the cache key to a DSN string shape. An alternative is an
   explicit database id injected at startup. The DSN approach was chosen because it needs no new
   wiring and no call-site changes; it is recorded as a maintainer touchpoint in the task packet.
2. **Is the state-class wait redundant?** No. Without it, `settleElementLayout` can observe two
   identical pre-transition samples and declare the layout settled — exactly the original bug in a
   new costume. The class assertion pins the moment the state has flipped.
3. **Why not make Core Smoke blocking now?** `tests/smoke-core/README.md` requires consecutive green
   runs plus a maintainer decision; that is a governance call, not a flake fix, so it is out of scope.
4. **Could the Go fix mask a real missing table?** The opposite: the old cache could return
   `exists=true` for a database without the table, which is precisely how the failure was produced.
   The new key cannot alias two different databases.

## Residual risk accepted

- The browser fix is validated on one host and one browser build; the original failure came from a
  slower runner.
- `tests/**` is still not type-checked or linted as a whole in CI (pre-existing); the changed files
  were checked manually.
- Two physically different servers sharing a `host:port/dbname` string would share a cache
  namespace. Single logical database today, so recorded rather than engineered around.


## Machine Readable

```json
{
  "taskId": "2026-10-12-flake-signal-remediation",
  "verdict": "approved",
  "verdictRationale": "Accepted: both races removed at source, both covered by sensors that fail against the old code, no assertion relaxed.",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-12-flake-signal-remediation/manifest.json",
    "evidence": ".harness/evidence/2026-10-12-flake-signal-remediation/commands.json",
    "reviewFile": ".harness/evidence/2026-10-12-flake-signal-remediation/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-12-flake-signal-remediation.task.md"
    ]
  }
}
```

> This block was backfilled on 2026-10-26 during the governance-schema repair round. It restates the verdict already written above in machine-readable form and links the artifacts that existed for this task; no conclusion, finding or verification claim was added, removed or reworded. The prose remains authoritative.
