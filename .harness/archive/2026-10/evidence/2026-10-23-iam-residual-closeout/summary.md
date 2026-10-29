# Summary — 2026-10-23 IAM residual closeout (post v0.17.3)

## Why this task exists

v0.17.3's known-residual recorded only the `system_role_data_scope` / `system_role_permission`
pre-check wording. Re-reading the actual code widened the list and found one defect that had never
been registered: user CSV import resolved users, roles, departments and posts without any tenant
filter, and created users without a tenant id or membership.

## Findings and fixes

### R1 (P1) — user import could read and write another tenant's user

`loadUserImportLookups` built four global maps:

- `loadUsersByUsername` — a CSV row naming `shared` updated the tenant-B row when tenant A imported.
- `loadRoleIDsByKey` — role keys are unique per tenant; the map kept whichever tenant scanned last.
- `loadPostIDsByCode` — post codes are unique per tenant; same problem.
- `BuildDeptPathMaps` — department paths are unique per tenant; same problem.

The create path also built `SystemUser` without `TenantID`, so an imported user landed in the
platform namespace (tenant 0) and could not be seen or logged in by the importing tenant, and it
did not write `tenant_memberships`, so the first login would be rejected with
`tenant.forbidden`.

Fixed in `user_export.go` and `user_helper.go`: every lookup runs through `s.scoped(...)`, the new
user is stamped with `s.tenantOwnerID()` (context only, never the CSV), and
`ensureTenantMembership` runs inside the same transaction as the insert.

### R2 (P2) — duplicate-key races surfaced as 500

`CreateUser`, `CreateRole` and `UpdateRole` pre-check key uniqueness, then insert. The pre-check is
not atomic; two callers can both pass it and only the UNIQUE index decides. The loser received
MySQL `Error 1062` wrapped in a generic error (HTTP 500) even though the sequential path returns
409.

Fixed by shaping the transaction error through `database.IsDuplicateKey` into the same conflict the
pre-check produces (`user.create.error.username_exists`, `role.key.exists`).

### R3 (P2) — provisioning grants were read-then-insert

`grantTenantRolePermissions` and `grantTenantRoleMenus` read the existing keys and inserted the
missing ones one row at a time. Two repair runs could both miss the same key and one would fail on
the composite key. Both now collect the missing grants and issue one
`CreateInBatches(...)` with `clause.OnConflict{DoNothing: true}`, so the unique key is the arbiter.

### R4 (P2) — bootstrap backfill wrote permissions into the wrong tenant

`backfillRolePermissions` selected role-menu rows without joining `system_role`, so every backfilled
`system_role_permission` row was stamped `tenant_id = 0`, even for tenant roles. It also used
`FirstOrCreate` per menu, so several menus exposing the same permission key produced duplicate
seeds. The select now joins `system_role` (skipping soft-deleted roles), the candidates are
deduplicated by `(tenant_id, role_id, permission_key)`, and the batch is inserted with
`ON CONFLICT DO NOTHING`; a second run inserts nothing.

### R5 (P3) — published residual text is stale

`RELEASE_NOTES_v0.17.3.md:114` says `system_role_data_scope` and `system_role_permission` still
pre-check. `upsertRoleDataScopePolicy` already used `clause.OnConflict`, and after R3/R4 the
permission writes no longer pre-check either. The published v0.17.3 notes are immutable; this
packet records the correction for the next release notes.

## Tests added

| Test | File | What it pins |
| --- | --- | --- |
| `TestImportUsersStaysInsideTheRequestTenant` | `user_import_tenant_test.go` | Same username/dept path/post code/role key in two tenants; create and update stay in tenant A; tenant id + membership written; tenant B untouched |
| `TestConcurrentCreateUserMapsLoserToConflict` | `user_concurrency_test.go` | Four concurrent creates leave one row; losers are 409 conflicts |
| `TestConcurrentCreateRoleMapsLoserToConflict` | `role_concurrency_test.go` | Same contract on role create |
| `TestConcurrentRenameRoleMapsLoserToConflict` | `role_concurrency_test.go` | Two renames to one key yield one winner and one 409 |
| `TestBackfillRolePermissionsStampsTenantAndDeduplicates` | `role_backfill_test.go` | Tenant stamping, soft-delete exclusion, dedupe, idempotency |
| `TestProvisionTenant_PermissionGrantsAreIdempotent` | `tenant_provision_permissions_test.go` | Re-provisioning does not duplicate or fail; a deleted grant is restored |

The duplicate-key branches are not merely executed by a lucky schedule: the `-coverprofile` runs
recorded the branch body as covered (`role_service.go:376-378`, `role_service.go:423-425`,
`user_service.go:441-443`).

## Verification

See `commands.json` for the exact commands and results. Summary:

- `gofmt`, `go build ./...`, `go vet ./...` — clean.
- Full `go test ./...` against real MySQL and Redis — exit 0; 46 packages ok, 0 FAIL,
  0 SKIP (`PANTHEON_TEST_DSN_REQUIRED` and `PANTHEON_TEST_REDIS_REQUIRED` were set).
- All new tests run individually with `PANTHEON_TEST_DSN_REQUIRED=true` and pass.
- Governance: frontmatter 346 docs, task packets PASS, structure 0 findings / 2533 files,
  generated 0 findings / 11 artifacts, failure registry 0 errors.
- `CGO_ENABLED=1 go test -race` could not start on this Windows host: TSan fails to reserve its
  shadow mapping (`failed to allocate ... error code: 87`) before any test body runs, both with the
  default package parallelism and with `-p 1`. This is an environment limit, not a test result;
  concurrency behaviour is instead pinned by the real-MySQL contender tests above. CI runs the race
  gate on Linux.

## Not in scope

- No schema change (stays at 29), no route/permission/menu/seed change.
- The published v0.17.3 tag and assets are untouched.
- The v0.17.3 release notes are not rewritten; R5 is a forward correction.
