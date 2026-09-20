# Summary — 2026-09-20-tenant-hostile-matrix-phase2

## What was done

Phase 2 of the hostile two-tenant browser matrix (finding #1 follow-up of
`tenant-verification-and-gray`). New spec covers the remaining surfaces not
touched by phase 1:

| # | Surface | Assertions |
|---|---------|-----------|
| 1 | auth-log (login-log + security-event pages) | Both pages render per tenant, rows pinned to acting tenant, no cross-tenant ids |
| 2 | audit (operation-log list/detail/export) | List and detail pinned to acting tenant; export payload scoped to it |
| 3 | settings (tenant-bound group) | Reads return per-tenant values; cache refresh keeps scoping |
| 4 | dynamic-module (registry) | Registry list readable per tenant; unverified write stays rejected |

Plus `scripts/tenant-matrix-fixture-setup.mjs`: idempotent re-provisioning of
the `matrix_browser_a/_b` dict fixtures through the admin API (previously
hand-provisioned only; wiped by `tenantmatrixdb down` with no way to restore).

## Verification

- `tenant-hostile-browser-matrix.spec.ts` (phase 1) +
  `tenant-hostile-browser-matrix-phase2.spec.ts`: **9/9 passed (30.9s)**
  against a live backend with `platform.tenant_mode=multi`.
- Environment quiet state restored after the run: flag back to compat,
  tenants 101/202 re-provisioned, fixture cleanup script verified working.

## Root-caused environment pitfalls (documented for future runs)

1. **Local system proxy**: Clash (127.0.0.1:7897) intercepts playwright
   APIRequestContext POSTs; cookies are dropped en route → backend replies
   `csrf.missing`. Browser-context requests through the vite proxy were
   unaffected, which made the failure look like a product bug. Fix: run with
   `NO_PROXY=127.0.0.1,localhost`. CI unaffected (no system proxy).
2. **API base URL must include `/api/v1`**: `PANTHEON_API_BASE_URL` values
   without the suffix hit the unknown route (0s, envelope 403) instead of the
   login handler.
3. **Vite proxy default is 8080**: without `--proxy-target`, browser-driven
   parts of a matrix run silently exercise the wrong backend.
4. **`tenantmatrixdb down` wipes dict fixtures and its migration rollback
   fails on the shared local DB (pre-existing legacy data)** — the kill-switch
   flag reset does take effect first, so recovery is `up` (idempotent) +
   `tenant-matrix-fixture-setup.mjs`.

## Post-review fix (CI)

First CI run on PR #329 made `Frontend Contract` red: the new spec carried two
unused type-only imports (`APIRequestContext`, `BrowserLoginResult`), which the
`eslint .` step flagged as `@typescript-eslint/no-unused-vars`. Removed both and
re-verified locally (spec lint, full frontend lint, `tsc -b`); the smoke run
above is unaffected — the imports were never referenced.

## Gaps

- The rollback failure inside `down` (v16 `PREPARE` syntax on MySQL 8) is
  pre-existing tooling behavior on the shared dev DB; not addressed here
  (flag kill-switch semantics unaffected). Tracked as a follow-up note for
  the tenant tooling owner.
