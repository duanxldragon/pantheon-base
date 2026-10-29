# Reference search — W8 `2026-10-27-tenant-dead-surface-removal`

Fresh searches re-run on branch `refactor/tenant-dead-surface-removal-w8-2026-10-27`
after the W5 stack (not copied from the task packet). Symbols searched:
`NewHandler`, `RegisterRoutes(engine`, `BootstrapService` (+ `NewBootstrapService`),
`EnsureDefaultTenant`, `AssignAdminToDefaultTenant`, `MigrateExistingUsersToDefaultTenant`,
`InitializeTenantInfrastructure`.

## 1. Backend source (`backend --include=*.go`, tests excluded)

Only hit outside the four doomed files:

```
backend/modules/system/iam/tenant/tenant_service.go:884:
// BootstrapService.MigrateExistingUsersToDefaultTenant assigns users whose
```

A doc comment on `memberUserExists` mentioning the bootstrap service as
historical rationale. Updated in this PR to end at "reserved for the
cross-tenant waves" so the tree holds zero references after deletion. The
symbol definitions themselves appear only inside `tenant_handler.go`
(`Handler`, `NewHandler`, `parseTenantMemberPagination`, `writeTenantMembersPage`,
`GetMyTenants`), `tenant_routes.go` (`RegisterRoutes`) and `tenant_bootstrap.go`
(`BootstrapService` and its four methods).

## 2. Backend tests (`backend --include=*_test.go`)

Only `backend/modules/system/iam/tenant/tenant_handler_test.go` (the file this
wave deletes). Two files that the earlier coarse pattern flagged —
`backend/modules/system/system_modules_tenant_wiring_test.go` and
`backend/pkg/contracts/module_test.go` — were read in full: both match only on
generic symbols (`audit.NewAuditHandler`, `m.RegisterRoutes(api)`, the
`orderedModule` fake); neither references any tenant handler/routes/bootstrap
symbol.

## 3. Frontend (`frontend/src`)

Zero hits for any searched symbol.

## 4. Scripts and CI config (`scripts/`, `.github/`)

Zero hits for any searched symbol.

## 5. pantheon-ops overlay (`../pantheon-ops/backend|frontend|scripts`)

`../pantheon-ops/backend` is a full copied tree of the backend module (own
`go.mod`, module path `github.com/duanxldragon/pantheon-base/backend`). It
carries **inherited duplicates** of all four files this wave deletes:

- `modules/system/iam/tenant/tenant_bootstrap.go` (self-references only)
- `modules/system/iam/tenant/tenant_handler.go` / `tenant_handler_test.go` / `tenant_routes.go` (self-references only)

No file in the ops overlay outside those copies references any searched
symbol (the ops hits for `NewHandler`/`RegisterRoutes(engine` are unrelated
business modules: `bizscope`, `business/service`). Per the workspace
base-first rule, ops is not edited directly; these duplicates disappear at
the next foundation-release sync. **Residual note for the runbook**: if the
sync flow only overwrites files and never deletes, ops would retain dead
copies after the release — the sync runbook should confirm removal semantics
for deleted upstream files.

## Legacy endpoint mapping (no production equivalent)

| Legacy (unmounted) route | Status after W8 | What replaces it |
|---|---|---|
| `GET /tenants/my` | Deleted with the file | `GET /auth/tenants/switchable` (login-tenant switch surface, W4-filtered); `/auth/current` still reports memberships honestly |
| `GET /tenants/:id/members/page` | Deleted with the file | `GET /system/tenant/:id/members` (mounted; same bounded pagination, platform envelope) |
| `GET /tenants` / `GET /tenants/:id` / `POST /tenants` / `PUT /tenants/:id` / `DELETE /tenants/:id` | Deleted with the file | Mounted platform routes `GET/POST/PUT/DELETE /system/tenant(/:id)` (system_modules.go:293-297) |
| `POST/DELETE /tenants/:id/members(/:user_id)` | Deleted with the file | Mounted `POST/DELETE /system/tenant/:id/members(/:userId)` |

The legacy routes were registered nowhere (`RegisterRoutes` had no production
caller), so no client could have reached them; no deprecation shim is needed.
