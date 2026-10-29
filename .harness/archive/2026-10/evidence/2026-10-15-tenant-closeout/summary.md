# Evidence Summary — 2026-10-15-tenant-closeout

## Goal

Close the tenant feature out so that a human reviewer opening the console finds **multi-tenant mode
genuinely usable**, with the E2E and smoke evidence to back it: fix the remaining known defects, restore a
clean acceptance state, and run the end-to-end and smoke suites against a real stack (backend 8080, MySQL
3306, Redis 6379, real Chromium).

## Starting point (assessment)

Two task packets from 2026-10-13 (`tenant-console-remediation`, `tenant-true-isolation`) had landed the
bulk of the work but left it uncommitted, and two evaluation documents from 2026-10-15 named three defects
(A/B/C) plus a set of open decisions. Assessment against a live stack showed:

| Item | State found | Action |
|---|---|---|
| Defect A — login-page picker blocked by `tenantId` double semantics | **already fixed in the worktree** (`findCredentialByUsername` now does named-tenant-first → global fallback) | verified, no change |
| Defect B — `/auth/tenants/current` disagrees with `/auth/tenants/switchable` on role/isActive | **still broken** (`role:""`, `isActive:false` vs `owner`/`true`) | fixed |
| Defect C — hard-deleting a tenant leaves Casbin domain policies | **still absent** from ops docs | documented |
| Dev database | polluted with ~45 leftover probe/e2e fixture tenants, the platform admin carrying stray active memberships, and orphan tenant-domain Casbin policies | cleaned |
| Environment | `go vet`/`go test` blocked in the earlier sessions | re-verified working |

The polluted database mattered for acceptance: with stray memberships on the platform admin, the login page
shows the tenant picker to the operator instead of logging them in — exactly the "tenant mode looks broken"
state to avoid.

## What changed

**Code (one file).** `backend/modules/auth/login/login_tenant_switch.go` — `GetCurrentTenant` now enriches
the resolved tenant with the caller's own membership role and marks it active, so `/auth/tenants/current`
and `/auth/tenants/switchable` give the same `role`/`isActive` for the same tenant (contract §2.2). No new
authority: it reports what the membership table already grants.

**Docs (one file).** `docs/runbooks/TENANT_TROUBLESHOOTING.md` — defect C closeout. New §2b documents the
ops-only hard-delete procedure, and explains *why* it is security-relevant rather than cosmetic: `casbin_rule`
has no FK to `tenants` and the app has no purge path, so a hard delete that skips it leaves
`role:<key>@tenant:<id>` grants behind; if the AUTO_INCREMENT recycles the id, the next tenant inherits the
old one's authority. The section also records that the API refuses the delete with business code `500`
(`tenant.has_active_members`) rather than a 4xx, and corrects the stale `/api/v1/tenants` endpoints in the
same document to the real `/api/v1/system/tenant` routes.

**Formatting.** Fixed one pre-existing `gofmt` violation in `login_tenant_gate_test.go` so the gofmt gate is
genuinely green rather than "green except one".

**Database hygiene.** Purged every leftover fixture tenant and its dependent rows across the 18
tenant-scoped tables plus `casbin_rule`, restored `platform.tenant_mode=multi`, and confirmed the clean
acceptance state: 0 active memberships, 0 fixture tenants, 0 tenant-domain policies, 40 platform policies.

## Verification (all against the live stack)

| Suite | Result |
|---|---|
| Tenant lifecycle E2E (`.tmp/verify_tenant_full_flow.py`) | **62/62** |
| Tenant isolation E2E (`.tmp/verify_tenant_isolation_phase_g.py`) | **34/34** |
| Picker / `/tenants/current` defect probe | Defect A: member-only tenant → **200** (was 401). Defect B: both endpoints agree → **AGREE=True** (was False) |
| Core smoke (`test:smoke:core`, 9 specs, real browser) | **26 passed, 3 skipped, 0 failed** (2.4m); skips are the conditional generated-module fixtures |
| Tenant UI smoke (`tenant-viewpoint-switcher.spec.ts`, real Chromium) | **5/5 passed** (49.4s), screenshots retained |
| Go gates | `go build ./...`, `gofmt -l internal/ modules/ pkg/` (empty), `go vet` and `go test` on `modules/auth/login` + `pkg/tenant` all pass |

The `go vet` / `go test` result is worth calling out: the 2026-10-13 and 2026-10-14 task packets both record
these as **not-run** because any fresh Go tool invocation blocked indefinitely on this host. That condition
is gone in this session, so those two recorded exceptions are now closed for the packages this work touches.

## Acceptance state left behind

The operator logs in as `admin` / `123456` and lands directly in the platform console: no tenant picker, no
banner, `resolvedBy=platform-fallback`. Creating a tenant from the console provisions it in one call (roles,
admin user, owner membership, Casbin domain policies, settings copy), and that tenant's own admin can log in
and sees only its own data. The two flows a reviewer will click are the two flows the E2E and browser smoke
prove.

## Residual risks / explicit gaps

1. **The tenant hostile matrix is red, and it is a stale fixture, not a product bug.** The fixture setup and
   the three hostile/protected spec files log the platform `admin` in with an explicit tenant claim; under
   the isolation model that yields an empty tenant role set, so every call is `403 permission.denied`. The
   sanctioned pattern (provision a real tenant, log in as *its* admin) is what the passing viewpoint spec
   does. This suite is CI-advisory, so it has been invisible to merge gates. Fix path is recorded; it needs a
   decision about how fixture policies reach the running enforcer, which is why it was not rushed here.
2. **Platform admin + tenant claim = unusable console.** Same root cause, raised as a product question: if a
   platform-capable subject picks a tenant at login, should it keep platform roles? Today it does not.
3. **`docs/TENANT_SCOPE_FREEZE_DECISION_2026-10-15.md` §6 is still open** — whether `system_role` /
   `system_menu` / `system_permission` are tenant-owned or global. The shipped implementation is per-tenant
   roles + global menus/permissions, and every probe above validates that combination; the document
   recommends the opposite for roles. Maintainer call.
4. **Defect C is documented, not enforced.** Nothing stops an operator from hard-deleting a tenant without
   purging Casbin; the runbook is the control. A future `PurgeTenant` must run the documented steps in one
   transaction behind a platform-capability gate.
5. `tests/` remains outside the repo typecheck gate; the smoke/unit files under `frontend/tests` are not
   typechecked by CI.
