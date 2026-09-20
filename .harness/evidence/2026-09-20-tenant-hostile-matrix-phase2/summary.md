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

## Closeout (post-merge, 2026-09-20)

Recorded after the merge so this evidence reflects the merged facts rather than
only the branch-time claims.

| Item | Fact |
|---|---|
| PR | https://github.com/duanxldragon/pantheon-base/pull/329 |
| Merge commit | `3f35a0666ac0fc2dc67af482f8a309dfcbfd4bc4` |
| Merged at | 2026-09-20T05:54:31Z |
| Branch closure | `feat/tenant-hostile-matrix-phase2` deleted from origin |
| PR signal (required) | 32 success / 2 skipped; the only reds were advisory `Bench Perf Smoke` runs, fixed in #330 |
| Main-tip signal (`b3350be3`) | required `CI` (incl. Quality Gates / Frontend Contract), `Security Gates`, `Code Quality Gates`, `Lint Workflows` all green |
| Post-merge fix carried | the two unused type imports removed after the first CI run (see "Post-review fix (CI)") are what turned Frontend Contract green before auto-merge |
| Ratchet decision | no-repeat-observed for this task; the two signal defects observed around it landed as FR-010 and FR-011 |

### Gap that the merge does not close

The "9/9" figure above is **local live multi-mode evidence**. In CI the only job
that executes `tests/smoke-core/` (including both tenant matrix specs) is
advisory `Core Smoke`, which is push-to-`main` only and `continue-on-error: true`;
it has been red on `main` since at least 2026-09-05. So the tenant specs still
have no trustworthy CI green signal, and no PR-path gate runs them. Recorded as
`FR-011` (registry-only) with the disposition left to the maintainer: either give
that job the multi-mode backend plus fixtures it needs, or move the tenant specs
out of its scope.

See also the consolidated writeback record in
`.harness/evidence/2026-09-20-merged-packet-closeout/`.
