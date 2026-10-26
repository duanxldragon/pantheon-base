# Review — 2026-10-13-tenant-true-isolation

## Verdict

**Accepted, with two explicitly recorded exceptions** (`go vet` and the combined targeted `go test` run
could not complete in this environment; see below). The substantive claim — that multi mode now enforces
tenant isolation rather than merely carrying a tenant claim — is supported by live end-to-end evidence
(34/34 assertions) rather than by assertion alone.

## Contract compliance

| Contract anchor | Check | Result |
|---|---|---|
| §2.1 tenant lifecycle | Status remains `active`/`suspended`/`archived`; `deleted` stays the soft-delete marker and is not editable | ✅ unchanged |
| §2.2 membership | Membership remains the authority for tenant access; `owner` is created by provisioning and is what the login issuance gate requires | ✅ |
| §2.3 `tenant_id = 0` reserved | The isolation migration uses `NOT NULL DEFAULT 0`, so all pre-existing rows land in the platform/global scope and compat behaviour is untouched | ✅ verified (18 tables, default 0) |
| §3.1 resolution priority | Header (platform-capable subjects only) → subject claim → platform-global fallback. The header is now additionally validated against a real, active tenant | ✅ strengthened, not relaxed |
| §3.3 data-access invariants | Platform admin APIs are explicitly declared; the tenant console is now both declared platform-scoped **and** gated on platform capability | ✅ strengthened |
| §4 Casbin domain | Membership roles map to `role:<key>@tenant:<id>`; global and tenant namespaces stay separate and are never merged | ✅ |
| §5 error codes | `tenant.forbidden` / `tenant.suspended` / `tenant.archived` / `tenant.platformOnly` / `tenant.switch.same` all surface with the right code | ✅ live-verified |
| §6 compat mode | Unchanged; the switch is multi-only and one-way | ✅ |

**No contract text was modified by this task.** The changes implement behaviour the contract already
requires; where the contract was silent (how the unnamed-tenant login path disambiguates a username that
exists in several tenants) the resolution is deterministic and documented rather than left to row order.

## Reviewer checklist

**Is tenant confinement enforced on every read path?**
Verified for user, role, dept, post and the dashboard. The live probe confirms a tenant administrator sees
exactly one user (its own), only its two tenant-local roles, and cannot read another tenant's user by id.
The dashboard's tenant filtering uses a `tenantScopedTables` allowlist covering all 18 tenant tables.

**Can a tenant administrator escape its tenant?**
Three independent paths were checked and all are closed: (1) data reads are scoped by `WithTenantScope`;
(2) `X-Tenant-Id` only takes effect for platform-capable subjects, so a tenant subject cannot pin another
tenant; (3) the tenant-management console returns 403 via `PlatformCapabilityMiddleware`, which keys on a
*global* Casbin grant that a `role:<key>@tenant:<id>` subject can never satisfy. The live probe exercises
all three.

**Was the data-scope relaxation safe?**
`IsAdmin` is consumed in exactly one place — the branch that decides whether to apply the row-level
data-scope policy. It does not gate tenant scoping. The relaxation therefore cannot widen a tenant
administrator's view beyond its tenant, only remove a second, redundant restriction *within* it. A companion
test (`TestDataScopeMiddlewareStillFailsClosedForPlainRoles`) pins that a policy-less non-administrative
role still fails closed, so the widening cannot leak the whole table.

**Did the login change preserve the platform path?**
Yes. With no tenant named, the lookup still uses `FindByUsername`; only a deterministic `ORDER BY` was added
so the platform population (tenant_id = 0) wins rather than the lowest id by accident. The platform
administrator login is exercised at the start of every live probe run and still succeeds.

**Is provisioning idempotent?**
`ProvisionTenant` checks for each artefact before creating it, and both the role and admin lookups are
`tenant_id`-qualified. Re-running for an existing tenant re-creates only what is missing, which is what
makes it usable as a repair entry point. `InitializeTenantDefaults` now delegates to it instead of being
a no-op.

**Was the migration safe?**
`000024` is purely additive (add column if absent, add index if absent), guarded by `information_schema`
checks, and ships a `down`. No applied migration was edited. `NOT NULL DEFAULT 0` means the migration cannot
fail on existing rows and cannot change compat behaviour.

**Did anything grant new authority to a tenant administrator that the product decision does not cover?**
The only new grant is the tenant-domain `/api/v1/*` policy, which is the decision itself. The
platform-capability gate was added in the *opposite* direction — it removes a capability the tenant
administrator previously had by accident (enumerating all tenants).

## Exceptions recorded

| Item | Reason | Mitigation |
|---|---|---|
| `go vet` not run | Blocks indefinitely rather than being slow: 0.03s of user CPU over 5 minutes, no output. `go vet -x` stops after 345 work-directory creations, before invoking the compiler. Eliminated by experiment: not network (`GOPROXY=off`), not test deps (`-tests=false`), not cache-lock contention (zero concurrent Go processes). | `go build ./...` passes and `gofmt` is clean, so the code compiles and is formatted. Vet-specific checks remain unverified; this is a host limitation, not a code signal. |
| Combined targeted `go test` not completed | Same cause — the run never got past the compile stage (stopped after 13m31s with no output). | Packages that did complete while the cache was warm: user, role, dept, post, platform, `pkg/tenant`, `pkg/rbacbind`. The live probe exercises the same paths end to end. The two new regression tests are compiled but not executed in this session. |
| Frontend smoke/E2E suites not run | Not required by this task's scope; the tenant switcher is gated to multi mode with ≥ 2 switchable tenants and is verified by typecheck, lint and the shell visual contract. | Recorded as not-run rather than implied as passing. |

## Residual risks accepted

1. `copyPlatformSettingsToTenant` carries a hand-written column list; a future `NOT NULL`-without-default
   column on `system_setting` will re-break tenant creation. Flagged in the task packet's Human Gates.
2. Tenant confinement remains a per-service convention (`WithTenantContext` + `scoped`). A new IAM service
   that omits it will read across tenants. Uniform today, but convention rather than compiler-enforced.
3. The tenants-CRUD ownership mismatch between contract §7 (`system/org`) and the implementation
   (`system/iam`) predates this task and was deliberately not touched.


## Machine Readable

```json
{
  "taskId": "2026-10-13-tenant-true-isolation",
  "verdict": "approved with documented P2 follow-up",
  "verdictRationale": "Accepted with two recorded exceptions (go vet and the combined targeted go test run could not complete on this host).",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-13-tenant-true-isolation/manifest.json",
    "evidence": ".harness/evidence/2026-10-13-tenant-true-isolation/commands.json",
    "reviewFile": ".harness/evidence/2026-10-13-tenant-true-isolation/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-13-tenant-true-isolation.task.md"
    ]
  }
}
```

> This block was backfilled on 2026-10-26 during the governance-schema repair round. It restates the verdict already written above in machine-readable form and links the artifacts that existed for this task; no conclusion, finding or verification claim was added, removed or reworded. The prose remains authoritative.
