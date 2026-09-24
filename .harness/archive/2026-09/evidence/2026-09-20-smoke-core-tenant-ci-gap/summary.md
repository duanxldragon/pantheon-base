# Summary — 2026-09-20-smoke-core-tenant-ci-gap

Diagnosis executed on 2026-09-20 against the `main` tip lineage (`add2d003`).
The verdict is **H1 confirmed, H2 refuted**: the tenant specs in the advisory
`Core Smoke` job fail because the job provisions **none** of their
preconditions, not because of a tenant isolation leak.

## Verdict

| Hypothesis | Result | Basis |
|---|---|---|
| **H1** — scope mismatch: the specs run in a job that never provides multi mode, tenants 101/202 or the matrix fixtures | **Confirmed** | Every failing assertion's `Received` value is a compat-mode shape (`undefined`, `0`), never another tenant's id; the job's tenant-related provisioning is empty; the specs carry no skip guard |
| **H2** — a genuine tenant isolation regression, hidden behind `continue-on-error` for two weeks | **Refuted** | No row belonging to tenant 202 was ever observed by a request acting as tenant 101. The product paths that produce the observed values (compat fallback, compat claim suppression) are intentional, documented (contract §6) and pinned by passing PR-path backend tests |
| **H3** — the non-tenant failures are an independent cluster | **Confirmed as separate** | `platform-shell-critical:60` and `system-dept-operations:151` are deterministic and tenant-blind; `auth-tenant-picker:145` is flaky in a fully mocked spec |

## The decisive evidence: what the assertions actually received

The specs word their assertions as leaks, which is why the job read like a
security finding. The assertion detail blocks say something different:

| Assertion at the tip (job `106044975128`) | Expected | **Received** | What `Received` really is |
|---|---|---|---|
| `security-event row 1 leaked across tenants` | `101` | **`undefined`** | the response row carries no `tenantId` field at all |
| `operation-log list leaked a foreign row to tenant 101` | `101` | **`0`** | `tenant.PlatformGlobalTenantID` — the compat platform-global namespace |

Neither value is `202` (tenant B). A real cross-tenant leak would have to surface
tenant 202's id; what surfaces instead is the single compat namespace. The
remaining tenant failures are the same shape mismatch: `tenantSelectionRequired`
is falsy (picker never renders), the upload `objectKey` fails `/^t101\//`, and
the "pre-provisioned" dict fixtures are absent.

Two further pieces of boundary evidence:

- **The product code says compat is supposed to do this.**
  `backend/pkg/tenant/tenant.go` — `ResolveForCanary` returns
  `{TenantID: PlatformGlobalTenantID, Mode: compat, ResolvedBy: "compat-fallback"}`
  for any non-multi mode, with no membership checks (contract §6).
  `backend/modules/auth/login/login_runtime.go:367` — `resolveLoginTenantClaim`:
  *"Compat ignores any requested tenant: no claim is ever stamped"* and returns 0
  before `tenantChoice` is examined. So `loginByApi(…, tenantId: 101)` succeeds
  in compat mode while stamping tenant 0, which is exactly the mismatch the specs
  then report as a leak.
- **Four tenant tests in these same specs pass in compat mode** —
  `phase2:179` (settings surface), `phase2:219` (dynamic-module surface),
  `matrix:117`, `matrix:129` (dashboard/refresh isolation). A real isolation
  regression would not break only the row-scoped assertions and spare these.
- **The compat behaviour is already pinned by passing tests** —
  `login_tenant_gate_test.go` asserts "compat explicit choice → claim 0" and
  `GateSessionIssuance` compat "never stamps"; `system_modules_tenant_wiring_test.go`
  covers the multi-mode middleware wiring.

## The precondition inventory (the answer to the task's question)

What the three tenant specs require, where it comes from, and what the job has:

| # | Precondition | Authoritative producer | Core Smoke state |
|---|---|---|---|
| P1 | `platform.tenant_mode = multi` | `system_setting` flag row; the seed writes `compat` (`modules/system/config/setting/setting_seed.go:42`, `seed_data.yaml:26`). Flipped to `multi` only during the matrix runbook | **absent** — seeded `compat`, never flipped |
| P2 | tenant master rows `101`/`202`, status active | `tenants` table; upserted by `tenantmatrixdb up` (tagged `plan='__smoke_matrix__'`) | **absent** — job runs no `tenantmatrixdb` step |
| P3 | active `tenant_memberships` for user 1 (`admin`) in both tenants | `tenant_memberships`; upserted by `tenantmatrixdb up` | **absent** |
| P4 | dict fixtures `matrix_browser_a` / `matrix_browser_b` under tenants 101/202 | `frontend/scripts/tenant-matrix-fixture-setup.mjs` (idempotent, admin-API based) | **absent** — the script exists but no workflow invokes it; its own header records the fixtures were hand-provisioned during the 2026-09-15 matrix run and wiped by `tenantmatrixdb down` |
| P5 | tenant object namespace `t{tenantID}/` on uploaded object keys | derived at runtime from the resolved context (`pkg/upload/service.go:488`, `modules/system/config/setting/setting_handler.go:302`) | **absent by consequence** — resolves to `t0/` while P1 is unset |

Precondition P5 needs no provisioning of its own; it is listed because it fails
*silently* (a `t0/` key looks like a valid key, so only the namespace assertion
notices).

**The trap for whoever implements the disposition:** `tenantmatrixdb up` is not a
complete CI step on its own. `cmdUp` finishes by writing
`platform.tenant_mode = compat` — *"explicit starting point"* for the matrix
runbook — so a job that only adds `tenantmatrixdb up` would still be in compat
mode and would still fail. The flip to `multi` is a separate, later step in the
runbook that any CI wiring must reproduce explicitly. (`tenantmatrixdb` also
requires `PANTHEON_MATRIX_DSN` and deliberately refuses to guess credentials.)
On a fresh CI database the migration-version precondition is already satisfied by
server startup: `RunMigrations` records the latest version (17), so `up`'s
`ensureMigration(13..16)` calls short-circuit while the tenant tables that
migration 13 creates already exist.

## Red baseline, restated at execution time

- **Workflow level looks healthy, job level does not.** `gh run list` reports
  every recent `main` run as success because `8db84bd8` (#301, 2026-09-10) added
  `continue-on-error: true`; the red only exists in the job list. Before #301 the
  workflow itself was red (2026-09-05 → 2026-09-09 runs).
- **31 failure / 3 success / 5 cancelled** across the 39 most recent `main` runs,
  i.e. 31 of the 34 completed runs red. The only green `Core Smoke` jobs are
  `34431776614` (2026-09-10T03:02Z), `34437941109` (04:38Z) and `34442715170`
  (05:50Z) — the window immediately after #301 repaired the suite. From
  `34456538724` (08:41Z) the job is red again, continuously, through the tip.
- **The red baseline is older than the tenant specs.** The specs landed on
  2026-09-20 (#329); the job had already been red for ten days. The tenant specs
  are *additional* failures in an already-red job, not its cause.

## The second cluster (H3), and two signal-quality findings

- `platform-shell-critical.spec.ts:60` — `expect(expandedWidth).toBeGreaterThan(collapsedWidth)`
  fails on both attempts: deterministic, tenant-blind, not caused by P1–P5.
- `system-dept-operations.spec.ts:151` — "can create a root department" times out
  on both attempts (15s poll). Deterministic, tenant-blind.
- `auth-tenant-picker.spec.ts:145` — mobile-viewport overflow assertion that
  **failed then passed on retry**. It is a flake, and the spec is fully mocked
  (`page.route` stubs `/auth/login` and `/settings/public`), so it needs no live
  tenant preconditions whatsoever — it is only in the failing list by coincidence
  of name.
- `business-generated-basic.spec.ts` — a README-listed core member whose all 3
  tests self-skip via conditional `test.skip()`. It is the job's entire "3 skipped"
  and it means the core list claims coverage that never executes.
- `tests/smoke-core/README.md` still advertises **8 files / ~20 minutes** while
  `test:smoke:core` globs `tests/smoke-core/*.spec.ts` over **12 specs**; neither
  the three tenant specs nor `auth-tenant-picker.spec.ts` appear in the README.
  That drift is the mechanism by which specs needing a different environment
  ended up in this job.

## Disposition implemented (2026-09-22)

| Option | Cost / risk |
|---|---|
| Core Smoke | Uses an explicit nine-spec compat-mode allowlist; tenant specs no longer enter through a broad glob |
| Tenant Smoke | New push-only advisory job provisions MySQL/Redis, runs `tenantmatrixdb up` with `PANTHEON_MATRIX_MODE=multi`, runs the fixture setup script, executes all three hostile tenant specs, and restores tagged fixtures in an `always()` cleanup step |
| Matrix tool safety | `PANTHEON_MATRIX_MODE` defaults to compat and rejects values other than `compat`/`multi`; unit tests cover default, accepted values and rejection |

The README now lists the nine compat-mode files and documents the separate tenant
job, so future special-precondition specs must be assigned to an explicit job.

## What this task did and did not change

- **Changed:** `.github/workflows/smoke-core.yml`, `frontend/package.json`,
  `frontend/tests/smoke-core/README.md`, `backend/cmd/tenantmatrixdb`, this
  evidence directory, the task packet, and the `FR-011` row.
- **Not changed:** the three tenant specs, product tenant isolation code, or the
  two independent non-tenant failure specs.

## Known gaps

- No local end-to-end replay: this machine has no MySQL on 127.0.0.1:3306. The
  new hosted Tenant Smoke job is the required runtime evidence; no local pass is
  claimed.
- The non-tenant failures are separated from the tenant cluster but not
  root-caused here; they need their own triage.
- `auth-tenant-picker:145` is classified flaky from a single fail-then-pass pair;
  a retry-rate sample would be needed to call it stable.
- The two non-tenant failures remain separate follow-up work and are not silently
  attributed to tenant isolation.
