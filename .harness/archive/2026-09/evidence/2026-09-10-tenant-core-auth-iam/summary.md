# Evidence: 2026-09-10-tenant-core-auth-iam — slice 1 (session/token tenant semantics) + slice 2 (login tenant selection + tenant-scoped policy authoring)

Date: 2026-09-11 · Branch: fix/i18n-s3649-zero · Flag default: `platform.tenant_mode=compat` (unchanged)

## Slices delivered this session

| Slice | Deliverable | Key files |
|-------|-------------|-----------|
| A — claim at issuance | `SessionData.TenantID` (Redis session payload, `tn` JSON field, legacy-safe 0) + `SystemUserSession.TenantID` column (AutoMigrate) + `applyTokenContext` surfaces `tenantId` to Gin | `pkg/authtoken/token.go`, `modules/auth/session/session_model.go`, `internal/middleware/token_middleware.go` |
| B — login discovery | multi-mode login resolves tenancy from active membership (single → deterministic claim; none → platform population claim 0; ambiguous → deny); issuance gate requires active membership + active tenant master | `pkg/tenant/authz.go` (`DiscoverDefaultTenant`, `GateSessionIssuance`, `EnsureTenantLoginable`), `modules/auth/login/login_runtime.go` (`resolveLoginTenantClaim`, `issueTenantTokenPair`) |
| C — Casbin domain | request subjects expanded global-first then `role:<key>@tenant:<id>` per contract §4; compat/global contexts consult global subject only (zero behavior change) | `pkg/tenant/authz.go` (`TenantRoleSubject`, `CasbinDomainPolicySubjects`), `internal/middleware/casbin_middleware.go` |
| D — membership revocation | `RevokeUserSessionsInTenant`: revoke all live session rows for the user + cascade-delete bound refresh tokens + per-user blacklist (over-approximation, safe: re-login re-resolves tenancy) | `pkg/tenant/authz.go` |
| refresh gate | `GateSessionRefresh` re-validates membership + tenant status on every refresh; claim-less sessions pass (flag-off regression guarantee) | `pkg/tenant/authz.go`, `modules/auth/session/session_service.go` |
| error surface | tenant gate errors map to i18n keys `auth.login.error.tenant_{forbidden,suspended}` in all 5 locales (2807 keys × 5, missing=0 extra=0) | `modules/auth/login/login_handler.go`, `frontend/src/i18n/resources/*.ts` |

## Hostile two-tenant test results (12/12 pass, MySQL-backed)

`modules/auth/login/login_tenant_gate_test.go` — fixture: tenants **101** vs **202** + global tenant 0, flag seeded via `system_setting`.

1. `CompatModeNoClaim` — memberships exist but compat mode never stamps a claim (contract §6). ✅
2. `SingleMembershipResolves` — deterministic claim 101 in multi mode. ✅
3. `NoMembershipPlatformPopulation` — no membership ⇒ claim 0, no error (contract §3.1). ✅
4. `AmbiguousMembershipsDenied` — two active memberships ⇒ `tenant.forbidden`, never silently narrowed. ✅
5. `DisabledMembershipFallsBackToPlatform` — disabled membership ⇒ platform fallback (claim 0) AND refresh into the tenant denied (stale-membership gate proven at line level). ✅
6. `TenantStatusGates` — suspended ⇒ `tenant.suspended`; archived ⇒ `tenant.archived` (contract §5). ✅
7. `RefreshPassesWithMembership` — active membership refresh OK. ✅
8. `RefreshDeniedAfterMembershipRevoked` — membership disabled post-issuance ⇒ refresh denied (session cannot outlive membership). ✅
9. `RefreshClaimlessPasses` — claim-less session refresh OK in multi mode (flag-off regression guarantee). ✅
10. `RevokeUserSessions` — 2 live sessions of user 42 revoked; user 43 untouched. ✅
11. `IssuanceCompatNoStamp` — gate double-safety net under compat. ✅
12. `SessionDataClaimRoundTrip` — claim survives the Redis JSON envelope; legacy payload decodes as 0. ✅

Plus 6 pure unit tests in `pkg/tenant/authz_test.go` (subject format, expansion order, claim normalization, gate-error classification).

## Runtime verification

- DB-backed (`PANTHEON_TEST_DSN` local MySQL): `go test -count=1 -short ./pkg/... ./internal/... ./modules/auth/... ./modules/system/config/...` — all packages ok (login 78.9s incl. full auth suite, dict 4.9s incl. 10 canary hostile tests still green).
- DSN-less: `go test -short ./pkg/... ./internal/... ./modules/...` — 0 FAIL.
- `go build ./...` green; `go vet` green on touched packages; `gofmt` clean.
- Frontend: `tsc -b` exit 0; ESLint on i18n resources exit 0; i18n audit 5×2807 keys missing=0 extra=0.
- Docs: frontmatter 0 errors (1 pre-existing legacy-metadata warning unrelated), links strict 0 findings.

## Economics Watch

- Login adds 1 indexed membership lookup (`idx_tenant_memberships_user`) + 1 tenant PK read per login in multi mode; compat mode short-circuits before any query (`NormalizeMode` check first, and the flag reader is a single indexed `system_setting` PK lookup only when the mode loader is absent).
- Refresh adds the same two indexed reads; deny path fails closed.
- Casbin adds at most one extra `Enforce` call per role key per request, only in multi mode with a resolved tenant context; compat path is byte-identical to the previous single-subject loop.
- No new Redis keys beyond the pre-existing blacklist pattern; no new goroutines.

## Human Gates consumed / remaining

- **Canary 放量 gate (consumed)**: maintainer acknowledged canary isolation evidence in-session (2026-09-11), per master plan stop-condition "canary 放量". Canary review verdict was Approved.
- Remaining gates per manifest: schema/migration approval for new `system_user_session.tenant_id` column is AutoMigrate-only (additive, default 0, no data rewrite) — production migration execution still gated; Casbin/admin boundary approval for any policy *writes* using domain subjects (this slice only reads/expands); staged rollout approval unchanged.

## Slice 2 (2026-09-12): login tenant selection + tenant-scoped policy authoring

| Deliverable | Key files |
|-------------|-----------|
| Explicit tenant choice at login | `LoginReq.TenantId` (uint64, optional); discovery validates the choice through the same membership gate — wrong/inactive membership ⇒ `tenant.forbidden` (never silent fallback to another tenant) | `modules/auth/login/login_dto.go`, `login_runtime.go` (`resolveLoginTenantClaim` signature + `validateChosenTenant`) |
| Tenant picker data source | `GET /auth/login-tenants` (token-authenticated) returns active login-able memberships via `tenant.ListActiveMembershipsForUser` (tenant master + role only, no leaks) | `modules/auth/module.go:65`, `login_handler.go` (`GetLoginTenantCandidates`), `login_tenant_candidates.go` |
| MFA carry-through | `MFAVerifyReq.TenantId` carried through the challenge store → `CreateSessionForTenantWithContext(ctx, userID, roles, ip, ua, tenantChoice)`; choice re-validated at session creation, challenge-to-session choice cannot diverge from the login request | `modules/auth/mfa/mfa_service.go`, `login_runtime.go` |
| Tenant-scoped policy authoring | `CreatePolicyReq.TenantId` / `UpdatePolicyReq.TenantId` (min=1): validates tenant exists + active, writes Casbin subject `role:<key>@tenant:<id>` with domain field = tenant id (contract §4), uniqueness check namespaced per tenant | `modules/system/iam/permission/permission_dto.go`, `permission_service.go` |

### Slice-2 test results (18 auth-gate + 6 middleware + 4 permission, all DB-backed)

New in `modules/auth/login/login_tenant_gate_test.go` (tests 13–18):

13. `ExplicitTenantChoiceHonored` — login with `tenantId=101` where user has memberships in 101+202 ⇒ claim 101, deterministic. ✅
14. `ExplicitChoiceWrongTenantRejected` — login with `tenantId=202` but no 202 membership ⇒ `tenant.forbidden`. ✅
15. `ExplicitChoiceResolvesAmbiguity` — two active memberships + explicit id ⇒ no more `tenant.forbidden`. ✅
16. `MFAChoiceCarriedToSession` — challenge with tenant 101, verify ⇒ session claim 101. ✅
17. `LoginTenantsEndpointListsActiveOnly` — endpoint returns active memberships only (disabled/suspended excluded). ✅
18. `CandidatesFailClosedOnDBError` — DB failure ⇒ error, never empty-but-successful list. ✅

`internal/middleware/casbin_tenant_domain_test.go` (6 tests, real enforcer): domain policy grants only in matching tenant context; tenant context without domain policy denied; **cross-tenant policy does not leak** (101 policy never authorizes 202 context); compat context ignores tenant policies; global policy still applies in tenant context; nil tenant context = global-only.

`modules/system/iam/permission/permission_tenant_policy_test.go` (4 tests): domain subject stored verbatim; uniqueness per (role, tenant) namespace; invalid/suspended tenant rejected; update moving the tenant moves the namespace.

### Slice-2 verification

- DB-backed: full battery green (`./pkg/... ./internal/... ./modules/auth/... ./modules/system/...`).
- DSN-less: 0 FAIL. `go build`/`go vet`/`gofmt` clean.
- i18n: 5×2807 keys missing=0 extra=0; `tsc -b` exit 0; doc links strict 0 findings.

## Slice 3 (2026-09-13): frontend tenant picker and MFA binding

| Deliverable | Key files |
|---|---|
| Password-verified tenant picker | `backend/modules/auth/login/login_handler.go`, `frontend/src/modules/auth/login/components/Login.tsx` |
| Error data preservation | `frontend/src/api/request.ts` |
| Tenant-aware MFA challenge binding | `backend/modules/auth/mfa/mfa_model.go`, `mfa_service.go`, `login_runtime.go` |
| Five-language picker copy and compact responsive styling | `frontend/src/i18n/resources/*.ts`, `Login.css` |

The picker is returned only after successful password authentication and before
session/token issuance. Password failures remain generic and never expose
membership candidates. The MFA challenge stores the selected tenant and rejects
tenant divergence at verification.

### Slice-3 verification

- `go test -short ./modules/auth/login ./modules/auth/mfa` — passed.
- `go test -short ./...` — passed.
- `npm run type-check` — passed.
- `npm run lint -- --quiet` — passed.
- `git diff --check` — passed.

## Gaps (explicit)

- ~~**Casbin domain policies are not yet writable anywhere**~~ → **closed in slice 2**: tenant-scoped policy authoring via `tenantId` on create/update policy APIs; middleware expansion + authoring now round-trip (covered by permission + middleware tests).
- ~~**Login tenant selection UI** for users with multiple memberships~~ → **closed in slice 3** (password-verified picker, retry with explicit `tenantId`, MFA tenant binding, five locales); runtime browser evidence remains pending;
- **Two-tenant runtime smoke of the full login→dict flow through HTTP** (Playwright): unit/integration layer proven DB-backed; end-to-end browser evidence deferred to task 6 verification matrix.
- **Audit/security-event rows** do not yet carry tenant_id columns (data-infra task scope).
- `RevokeUserSessionsInTenant` blacklists per-user rather than per-(user,tenant) — safe over-approximation; per-tenant revocation would need a session-index Redis key (noted for the data-infra task if cross-tenant users become common).
