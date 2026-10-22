# Review — 2026-10-22 tenant entitlements and audit fixes

**Verdict**: PASS with one recorded P3 cosmetic residual.
**Reviewer posture**: implementation evidence re-derived from code, tests, and a real four-plan browser run; no claim rests on README or UI labels.
**Baseline**: `aef57e30`; uncommitted working tree on `main` at review time.

## 1. Scope correctness

- The three reported problems map to three independent boundaries, and each fix is placed at the boundary that actually owns the rule:
  - platform-only menu visibility → `pkg/tenant/platform_scope.go:31` consumed by menu reads (`menu_service.go:73`, `:237`), provisioning (`tenant_provision.go:272`, `:490`), role assignment (`role_helper.go:255`), and permission caching (`login_runtime.go:644`, `:683`);
  - login audit attribution → `login_tenant_audit.go:46`, `login_handler.go:180`/`:196`/`:256`, MFA pinning `mfa_service.go:163`/`:173`;
  - plan differentiation → frontend-only registry `plans.ts:37`, session hook `usePlanEntitlements.ts:34`, shell filter `useLayoutMenu.tsx:169`, route guard `PlanFeatureGuard.tsx:59`, form matrix `TenantList.tsx:794`.
- No backend seed, migration, or tenant initialization gained plan-specific behavior. The pre-existing plan→quota mapping (`GetDefaultQuota`) is untouched; backend plan handling remains data plus quota, never console feature rows. This matches the maintainer's explicit requirement.

## 2. Security review

- The platform-only classification is centralized, and tenant guards are enforced server-side (menu reads, role writes, provisioning). The frontend mirror is defensive only.
- `system:menu:list` remains assignable to tenant roles by design; write keys do not. This preserves tenant role administration without allowing shared-tree authoring.
- Stale grants are repaired at startup only inside `tenant_id <> 0`; platform bindings are untouched. Repair is idempotent and guarded by table existence.
- Permission cache handling only pays an ownership lookup when the cached list contains a platform-only key; platform users keep their keys. A failed ownership lookup fails open to the cached list rather than dropping legitimate permissions — safe because the platform-only routes remain capability-gated server-side.
- Login attribution keeps the original error text (`Error()` delegates) so message-key resolution and `errors.Is` gates are unchanged. Compat rows stay at tenant 0, verified by `TestLoginHandlerCompatKeepsAuditAtPlatformScope`.
- Plan gate is UX-only. Direct API calls remain governed by role permissions and platform capability middleware. This is documented in `plans.ts:10-14` and in the acceptance summary.

## 3. Behavior review against the reported symptoms

- Tenant admin sidebar contains no `system.tenant`, `/system/menu`, or `/system/i18n`; direct URL renders 403 with no tenant data (browser JSON `issue1` for all four plans).
- Login log pages show the tenant's own rows (7/6/8/6 across free/basic/professional/enterprise). Dashboard activity is populated as a consequence of the same attribution.
- Plan surfaces: free has no low-code group and both routes show the upgrade page; basic has module management only; professional has generator with locked datasource; enterprise unlocks it. Platform operator sees all three platform menus and the create dialog matrix.
- Mixed-content case: a free tenant's direct `/system/modules` request renders the upgrade page rather than a blank shell; a basic tenant's `/system/generator` does the same.

## 4. Regression risk and tests

- Backend regression tests added: menu filtering (`menu_service_test.go`), provisioning/repair (`tenant_provision_menus_test.go`), role assignment (`role_menu_tenant_test.go`), login attribution success/failure/compat (`login_log_tenant_attribution_test.go`).
- Frontend regression tests added: plan registry semantics (6), menu group pruning and entitlement filtering (2), dashboard widget feature gating (1), tenant session store dedupe/reset/scope (3).
- Full suite: backend `-race -p 1` on real MySQL/Redis exit 0 (46 packages); frontend 29 files / 212 tests, tsc, ESLint, 13 contracts, Vite build all pass.
- Risk considered and rejected: sharing the tenant session store changes `usePlatformScope` from local state to a global store. The store deduplicates in-flight requests and resets on logout and now at the login boundary (`Login.tsx:248`), so a re-login cannot inherit the previous subject's plan or viewpoint; no consumer writes plan data. The platform-scope classification is unchanged (`tenantId === 0 || resolvedBy platform-fallback/header`).

## 5. Residual findings

- **R1 (P3, cosmetic)**: opened-tabs retains a forbidden tab after direct navigation. The page is 403, no successful data fetch occurs, and tabs reset at login. Not fixed to avoid widening tab-state changes in this packet.
- **R2 (environment, not product)**: race testing on this Windows host requires the mingw PATH/CC workaround; `npm run build` needs `/d/nodejs` on PATH because its recursive prebuild calls `npm` through cmd.exe. The commands recorded in `commands.json` are the ones actually run.
- **R3 (design, explicit)**: plan differences are not a security boundary. A tenant that bypasses the UI and holds a role permission could still call generator endpoints on a lower plan. If commercial enforcement is required later, it must be a backend entitlement check tied to `tenants.plan` — deliberately out of scope here.
- **R4 (evidence gap, explicit)**: the four-plan Playwright run was recorded before the login-boundary session reset. The reset is covered by the new store tests plus tsc/ESLint/build, but the browser acceptance was not repeated after that last change.

## 6. Evidence cross-check

- `acceptance-result.json` is the raw browser output; screenshots in `artifacts/` correspond to the named checks. Archived runner scripts were stripped of local credential defaults and now read passwords only from `ACCEPT_ADMIN_PASSWORD` / `ACCEPT_TENANT_PASSWORD`; the result JSON contains no session tokens, CSRF tokens, or cookies.
- The four tenant accounts were created through the real tenant API in multi mode; login logs were read through the real UI against MySQL.
- Commands and results are reproduced in `summary.md`; no result in this review was inferred from a skipped or mocked path.
