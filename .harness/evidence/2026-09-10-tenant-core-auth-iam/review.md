# Review: 2026-09-10-tenant-core-auth-iam — slice 1

Reviewer posture: independent authorization reviewer; adversarially challenged default-allow, stale state, and forged claims.

## Adversarial attempts & outcomes

| Attempt | Vector | Outcome |
|---------|--------|---------|
| Stamp a tenant claim without membership | craft multi-mode login for user with no/disabled membership | claim stays 0 (platform population); tenant-scoped routes deny-by-default ✅ |
| Exploit ambiguous memberships to widen scope | user with two active memberships | `tenant.forbidden` — context never silently narrowed (contract §3.1) ✅ |
| Login against a suspended/archived tenant | seeded tenant status suspended/archived | `tenant.suspended` / `tenant.archived` — no token issued (contract §5) ✅ |
| Outlive a membership revocation via refresh | disable membership post-issuance, replay refresh | refresh denied — session cannot outlive membership (task packet risk node "stale membership") ✅ |
| Legacy session replay in multi mode | pre-claim session (no `tn` field) used in multi mode | decodes as claim 0 → deny-by-default on tenant routes; refresh passes only because it never touches a tenant ✅ |
| Forged header escalation re-check | `X-Tenant-Id` without platform role (canary test re-run) | still forbidden — header path untouched by this slice ✅ |
| Casbin domain bypass | request with tenant context but only global role policy | global-first expansion still authorizes legitimate global capability; domain subject adds capability only when a `role:<key>@tenant:<id>` policy exists (none writable yet — no privilege escalation surface) ✅ |
| Compat regression via new middleware order | flag off, full auth + dict suite | all green; claim never stamped under compat; Casbin loop reduces to the previous single-subject call ✅ |
| Cross-user revocation blast | `RevokeUserSessionsInTenant(user 42)` with user 43 sessions live | user 43 untouched (dedicated test) ✅ |
| Claim injection via request body | POST login with extra JSON fields | `LoginReq` binds only username/password; claim comes exclusively from `resolveLoginTenantClaim` (contract §3.3 write-ownership rule analog) ✅ |

## Findings

1. **Boundary discipline**: tenant gate logic lives in `pkg/tenant` (platform); auth modules consume it — no membership SQL in auth code, no tenants-table writes anywhere (contract §7 ownership). Import direction stays auth → pkg/tenant.
2. **Fail-safe defaults**: every deny path returns a sentinel; every error/missing-table path fails closed (`HasActiveMembership` false on error, flag reader falls back to compat, mode loader fail-safe unchanged).
3. **Flag-off regression**: compat short-circuits before any DB read in `resolveLoginTenantClaim`; full DSN-less + DB-backed suites green; dict canary 10 hostile tests unaffected.
4. **Additive schema only**: one column (`system_user_session.tenant_id`, NOT NULL DEFAULT 0) via AutoMigrate; no data rewrite; matches migration-runbook additive-column pattern. Rollback = drop column, no semantic dependency when flag is compat.
5. **Diff discipline**: changes confined to pkg/tenant (+2 files), pkg/authtoken (1 field), internal/middleware (2 files), modules/auth (3 files + 2 test files), 5 locale files. No system/iam/org runtime changes; pantheon-ops untouched.
6. **Stop-point check**: no default-allow, no cross-tenant read/write, no claim forgery path, single-tenant regression green. No stop condition triggered.

## Verdict

**Approved — slice 1 (session/token tenant semantics + isolation gates) meets the task packet's vertical-slice bar: migration additive, contract tests green, cross-tenant negatives proven, flag-off regression intact. Proceed to slice 2 (login tenant selection for multi-membership users + tenant-scoped policy authoring) before the data-infra task.**

---

# Review addendum: slice 2 (2026-09-12)

Reviewer posture: independent authorization reviewer; adversarially challenged the new explicit-choice surface (choice validation, MFA carry divergence, policy namespace forging).

## Adversarial attempts & outcomes

| Attempt | Vector | Outcome |
|---------|--------|---------|
| Log into a tenant via explicit choice without membership | `tenantId=202` with no 202 membership | `tenant.forbidden` — the choice is validated through the same gate as discovery, no bypass (test 14) ✅ |
| Use the picker endpoint to enumerate tenants | `GET /auth/login-tenants` as arbitrary user | returns only the caller's own active login-able memberships; token-authenticated; fail-closed on DB error (tests 17–18) ✅ |
| Diverge tenant between MFA challenge and session | request login for tenant 101, attempt session in 202 through MFA verify | choice travels with the challenge and is re-validated at `CreateSessionForTenantWithContext` — divergence impossible without a membership (test 16) ✅ |
| Forge a domain subject by writing a policy for a foreign tenant | create policy with `tenantId` of a tenant the admin has no relation to | policy authoring is a platform-admin API surface (pre-existing authorization unchanged); tenant existence + active status validated; subject namespace is derived server-side from `tenantId`, not from client-supplied subject strings ✅ |
| Cross-tenant policy leak via middleware | tenant-101 `role:x@tenant:101` policy vs 202-context request | dedicated `CrossTenantPolicyDoesNotLeak` test: 202 context denied ✅ |
| Compat regression from new policy writes | flag off, policy with `tenantId` still writable | writes are inert under compat (subject stored, expansion consults domain subject only with resolved tenant context); compat context ignores tenant policies (test) ✅ |
| Uniqueness collision across namespaces | same role key in tenant 101 and 202 | uniqueness check namespaced per tenant — both coexist; global namespace unaffected ✅ |

## Findings (slice 2)

1. **Choice never widens access**: explicit `tenantId` only *narrows/redirects* within memberships the gate would already accept; any other value fails closed with the same sentinel as ambiguity.
2. **Picker is read-only and self-scoped**: no tenant enumeration beyond one's own memberships; response fields limited to tenant id/name/role.
3. **MFA seam closed**: the challenge store carries the choice; session creation re-validates — no second unvalidated entry point.
4. **Authoring surface stays platform-admin**: tenant-scoped policy writes do not introduce a new authorization role; validation adds tenant status checks on top of the existing permission-service guards.
5. **Flag-off safety**: under compat, tenant policies are writable but inert (middleware ignores domain subjects without tenant context); no behavior change for single-tenant deployments.
6. **Stop-point check**: no default-allow, no cross-tenant leak, no new forgery path; single-tenant regression green (full suites). No stop condition triggered.

## Verdict (slice 2)

**Approved — slice 2 closes the two slice-1 gaps that were backend-reachable (explicit tenant selection + tenant-scoped policy authoring). Remaining for the task: frontend picker UI (UX gate; inert under compat), audit-row tenant columns (queue 5), browser E2E (queue 6). Queue 4 backend scope is complete.**
