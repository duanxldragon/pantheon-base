# Plan: 2026-11-24-business-route-static-guard

## Steps

1. Add `permissionroutes.Covers(routePath, policyPath)` with segment-class matching and trailing
   `*` wildcard support.
2. Build a dedicated business Casbin model whose object matcher calls `Covers`, and enforce stored
   policies against `Action.RouteTemplate` instead of the raw request path.
3. Switch permission-workbench coverage and role API policy synchronization to `Covers`.
4. Pin behaviour with a pure matcher table, an in-memory Casbin regression, and a real-MySQL
   stored-policy regression.
5. Update `SYSTEM_AUTH_CONTRACT` (zh/en) and record evidence.
6. Verify build and affected suites with required MySQL; record release/Ops consumption as gaps.

## Verification

- `go test ./pkg/permissionroutes/`
- `PANTHEON_TEST_DSN=... PANTHEON_TEST_DSN_REQUIRED=true go test ./pkg/database/ ./modules/system/iam/permission/ ./modules/system/iam/role/ ./modules/system/iam/tenant/ ./internal/middleware/ ./modules/auth/login/`
- `go build ./...`
