# Summary — performance-followup (local portion)

## Changes

1. **Tenant member listing: explicit bounded pagination contract** —
   `backend/modules/system/iam/tenant/tenant_service.go`
   - `ListTenantMembers(tenantID, page, pageSize)` now returns
     `([]Membership, total int64, error)` with page clamped to `>= 1` and
     pageSize clamped into `[1, maxTenantMemberPageSize=100]`
     (`defaultTenantMemberPageSize=20`); stable ordering `created_at ASC, id ASC`.
     A request can no longer materialize a whole tenant's member table.
   - New `ActiveMembershipRole(tenantID, userID)` — single-row lookup replacing
     full-list scans used only to find one user's membership.
   - New `ActiveMembershipRolesByTenant(userID, tenantIDs)` — one bounded query
     replacing the per-tenant full member list loop (removes the
     O(tenants × members) switchable-tenants listing).
   - Callers updated: `tenant_switch.go` (SwitchTenant, ListSwitchableTenants),
     `tenant_bootstrap.go` (AssignAdminToDefaultTenant),
     `tenant_handler.go` (`GET /tenants/{id}/members` now accepts
     `page`/`pageSize` and returns `{items,total,page,pageSize}`; no frontend
     consumer of the old array shape exists — verified by grep).
2. **Old audit-log backfill is bounded** — `backend/modules/system/audit/audit_service.go`
   - `backfillOperationLogDerivedFields` previously loaded every matching row
     into memory and issued one unbounded sequence of single-row UPDATEs at
     bootstrap. Now: keyset pagination (`id > lastID … ORDER BY id LIMIT n`),
     batch size 500, per-run cap 10000 rows, one transaction per batch;
     remaining rows are picked up on the next bootstrap run. Memory and
     startup time are bounded regardless of legacy table size.
3. **Dashboard: no change** — `backend/modules/platform/dashboard_service.go`
   was reviewed and deliberately left untouched: the acceptance criterion
   requires capturing query plan / P95 / connection usage on representative
   data *before* choosing any caching or query change, which needs a seeded
   MySQL dataset + running service (maintainer environment). Making no change
   also means no regression against the baseline is possible from this task.

## Tests added

- `tenant_service_test.go`: existing tests updated to the new signature; new
  `TestListTenantMembers_PaginationContract` pins total-vs-page semantics,
  page-3-of-7 tail, oversized-pageSize clamping, non-positive fallbacks,
  `ActiveMembershipRole` membership/non-membership, and
  `ActiveMembershipRolesByTenant` scoping (unknown tenant absent from map).

## Verification

See `commands.json`. `go build ./...` + vet green; audit + platform module
tests green with local MySQL/Redis. Tenant package test binary compiles but
cannot execute locally (CGO toolchain gap — pre-existing, recorded; CI green).

## Explicit gaps (maintainer/CI environment)

- Dashboard evidence is measured on the available local fixture (P95 1.18s
  setup-inclusive); a larger enterprise-volume load is still unmeasured, so no
  caching or query rewrite is claimed.
- Tenant pagination contract test execution on CI (local native cgo toolchain gap).

## MySQL measurement (2026-10-10)

The local `pantheon_base` database contained 3 active users, 2 roles, 2 departments,
1 post, 2,892 login-log rows in the seven-day window, and 0 operation-log rows today.
The dashboard summary integration test was repeated 10 times against disposable MySQL
schemas; elapsed times were 1.09, 0.89, 1.12, 1.18, 1.03, 1.08, 1.03, 1.07, 1.09,
and 1.02 seconds (P95 = 1.18s, setup-inclusive). EXPLAIN used the user and operation
indexes; the seven-day login count scanned 2,892 rows with the current small fixture.
MySQL reported `max_connections=151`, `Threads_connected=1`, `Max_used_connections=39`,
and `Connection_errors_max_connections=0` during the run. No dashboard query change is
justified by this small fixture; ordinary-enterprise load remains unmeasured.