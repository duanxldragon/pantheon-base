# Summary — iam-data-scope (F01 + F06)

## Changes

- `backend/internal/middleware/data_scope_middleware.go`
  - `applyRoleDataScopePolicy` now returns `bool`; on policy-read failure the
    middleware fails closed: warn log, JSON error `permission.data_scope.policy.unavailable`
    (or plain-text 500), `c.Abort()`, and scope forced to `custom` with empty
    dept IDs so even callers ignoring the return value see zero rows.
- `backend/modules/system/iam/role/role_service.go`
  - Role update uses `upsertRoleDataScopePolicyPreservingCustomDepts`: when the
    new mode is `custom` and the existing policy is already `custom`, the
    configured dept IDs are preserved (frontend only sends `dataScope` mode);
    otherwise dept IDs are reset (all→custom without config = empty/fail-closed).
  - `CreateRole` keeps the original upsert semantics.

## Tests added

- `internal/middleware/data_scope_failclosed_test.go` — 3 tests (fault injection via wrong-schema table).
- `modules/system/iam/role/role_data_scope_preserve_test.go` — 2 tests (preserve + switch-to-custom-empty).

## Verification

See `commands.json`. All listed commands pass; full backend suite green except the
known local CGO gap in `modules/system/iam/tenant` (toolchain, not code).

## Acceptance mapping

1. "policy read error denies request, never defaults to all" — F01 tests (injected failure).
2. "create custom scope, edit role, dept IDs remain" — F06 test 1.
3. "restricted list/export + admin behavior covered" — middleware fail-closed tests cover both paths; admin bypass asserted by TestAdminBypassesPolicyLookup.
