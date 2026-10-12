# Summary — 2026-10-12-flake-signal-remediation

Two recurring main-branch flakes were traced to root cause and fixed at the race, not at the
assertion.

## 1. Go: data-scope cache keyed by a recycled pool address

**Symptom.** `TestDataScopeMiddlewareInjectsRoleDeptScope` failed on main `c7e564bc`
(Backend Tests, attempt 1) with
`seed role data scope: Error 1146 (42S02): Table pantheon_base_testdatascopemiddlewa_..._4675.system_role_data_scope doesn't exist`.
Attempt 2 of the same run passed, so it presented as a flake.

**Root cause.** `MigrateDataScopePolicy` returned `nil` without creating the table, which is only
possible through its `else if !cachedHasTable(...)` branch — i.e. the package-global
`tableExistCache` already held `true` for a database that had no such table. The cache key came from
`buildDatabaseCacheNamespace`, which used `fmt.Sprintf("%p", sqlDB)`: the *pool pointer address*.
`testmysql.Open` drops each per-test database in `t.Cleanup`, so the pool becomes unreachable and Go
hands the same address to the next one. The poisoning entry was written by
`data_scope_failclosed_test.go`, which deliberately creates a broken same-named table and calls
`storeCachedTableExistence(db, ..., true)`; it runs before `data_scope_middleware_test.go`, matching
the CI order exactly.

**Measured.** A throwaway probe opened 12 pools sequentially and saw only 9 distinct addresses —
one reused 3 times, another twice. Address recycling is an observed runtime property here, not a
hypothesis.

**Fix.** `database.ConnectionCacheNamespace` derives the namespace from the connection DSN
(`mysql:<host:port>/<dbname>`) instead of the object address, with the pool pointer kept only as a
fallback for non-MySQL dialectors. `buildDatabaseCacheNamespace` delegates to it. The key carries no
credentials, two pools pointing at the same logical database correctly share the cache, and a
recycled address can no longer alias two different databases.

**Regression sensors.**

- `TestDataScopeCacheKeysAreScopedPerConnection` — deterministic invariant: two connections must not
  share a table-existence or user-dept cache key, and the key must be stable for one connection.
- `TestMigrateDataScopePolicyIgnoresForeignCachedVerdict` — replays the CI sequence: poison a broken
  table into connection A's cache, then require connection B to build its own table.

**Control experiment.** With the legacy `%p` implementation temporarily restored and `GOGC=20`,
`go test ./internal/middleware/ -count=25` fails on run 1 with the same `Error 1146`. With the fix,
three consecutive `-count=25` runs pass (75 package executions, zero failures).

## 2. Browser: sidebar width measured mid-transition

**Symptom.** `platform-shell-critical.spec.ts:60` failed twice in one CI job: attempt 1 read
`248 vs 248` (`toBeLessThan`), the retry read `215.5625 vs 108.265625` (`toBeGreaterThan`).

**Root cause.** Arco `Sider` declares `transition: width` (200 ms) and the shell uses
`width={248} collapsedWidth={76}`. The test clicked the toggle and read `boundingBox()` immediately;
the `await expect(sidebar).toBeVisible({ timeout: 3000 })` that followed waited for nothing because
the sidebar is always visible. Both CI values are mid-flight samples.

**Probe.** A standalone Chromium probe on a 248px → 76px transitioning element returned
`{w1: 248, mid: 248, w2: 76}`: an immediate read after the style change still returns the old width
(transition not started), and the read taken after awaiting `element.getAnimations({subtree:true})`
returns the target. This reproduces both CI symptoms directly.

**Fix.** `tests/smoke/helpers/layout-settle.ts` now owns `readElementWidth` and
`settleElementLayout` (box-signature stability, then await `getAnimations().finished`). The sidebar
test additionally waits for the `arco-layout-sider-collapsed` class to appear/disappear, which both
asserts the state really flipped and guarantees the transition has started — closing the
"two equal samples mean settled" window. `tests/smoke/platform/shell-top-panels.spec.ts` had already
solved this class of problem with a local `settlePanel`; it now imports the shared helper instead,
so no 20-line near-duplicate was added to new code.

**Assertion bounds unchanged.** `collapsedWidth < initialWidth` and `expandedWidth > collapsedWidth`
are exactly as before.

**Verification.** Run against a real local stack (MySQL + Redis backend built from this tree on
:8080, the project's own `start-smoke-vite` on :5173, admin login against the seeded dev database):
`4 passed (23.1s)`, reproduced twice. The pre-fix body was also run 12 times locally and passed
12/12 — this host is fast enough to dodge the race, so the local before/after is not decisive and the
pre-fix failure rests on the CI log plus the animation probe. That limitation is recorded rather than
papered over.

## Files changed

| File | Change |
| --- | --- |
| `backend/pkg/database/connection_cache_namespace.go` | New `ConnectionCacheNamespace` + DSN-derived namespace |
| `backend/pkg/database/connection_cache_namespace_test.go` | New offline unit tests (5 cases) |
| `backend/internal/middleware/data_scope_middleware.go` | Namespace delegated; `%p` implementation and `fmt` import removed |
| `backend/internal/middleware/data_scope_middleware_test.go` | 2 new regression tests |
| `frontend/tests/smoke/helpers/layout-settle.ts` | New shared layout-settle helper |
| `frontend/tests/smoke-core/platform-shell-critical.spec.ts` | Await state class + settle before measuring |
| `frontend/tests/smoke/platform/shell-top-panels.spec.ts` | Reuse shared helper, local copies removed |
| `docs/harness/failure-registry.md` | FR-012 and FR-013 registered as implemented sensors |

## Residual risk

- Core Smoke is push-triggered and report-only, so a PR cannot prove the browser fix in CI; the
  merge-commit push is its first hosted validation.
- The browser fix is verified on one host with one browser build; a much slower CI runner is the
  environment that produced the original failure.
- The cache namespace is keyed on the DSN's `host:port/dbname`. Two physically different servers
  behind the same string would share a namespace; the repository runs one logical database.
- Neither fix was validated against a genuinely red hosted run of the *fixed* code, because the
  failures were intermittent by construction.
