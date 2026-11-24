# Verification Summary: 2026-11-24-business-route-static-guard

## Scope

- Primary layer: platform
- Affected layers: system/iam, system/auth
- Changed files:
  - `backend/pkg/permissionroutes/cover.go` (new predicate)
  - `backend/pkg/permissionroutes/cover_test.go`
  - `backend/pkg/database/business_policy.go` (dedicated matcher + template enforcement)
  - `backend/pkg/database/business_policy_test.go`
  - `backend/modules/system/iam/permission/permission_workbench.go`
  - `backend/modules/system/iam/role/role_policy_sync.go`
  - `docs/contracts/SYSTEM_AUTH_CONTRACT.md`, `.en.md`
  - task packet, manifest, plan and this evidence set

## Behaviour

- `permissionroutes.Covers` compares route templates segment-by-segment. `:param` policy segments
  only cover `:param` route segments; a trailing `*` policy segment keeps explicit wildcard meaning.
- Business authorization enforces against `Action.RouteTemplate` with a dedicated Casbin model whose
  object matcher is `businessRouteCovers`; the process-wide system enforcer is untouched.
- Workbench coverage and role policy synchronization use the same predicate instead of `KeyMatch2`.

## Commands

- `go build -buildvcs=false ./...` — PASS.
- `go test ./pkg/permissionroutes/ ./pkg/database/` — PASS (matcher + in-memory Casbin; MySQL case skips without DSN).
- `PANTHEON_TEST_DSN_REQUIRED=true` real-MySQL runs — PASS:
  - `pkg/database` business-policy regression (detail grant denies export route).
  - permission / role / tenant / middleware / login / database / permissionroutes suites.

## Negative evidence

- Detail grant `GET /hosts/:id` evaluated against route `GET /hosts/export` returns denied in both
  in-memory and real-MySQL paths.
- Export grant evaluated against the detail route returns denied.
- Admin wildcard `/api/v1/*` still authorises both routes.

## Known gaps

- Independent review unavailable; self-review recorded.
- Official foundation release and Ops lock consumption are not part of this candidate.
- No Windows CGO race run.
