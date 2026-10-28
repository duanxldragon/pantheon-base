# Summary — `2026-10-27-s3-role-data-scope-model`

## Outcome

The two role data-scope model definitions were **field-for-field identical**
(names and full gorm tags). Decision: **move to the single authoritative model
and delete the mirror** — `role` now references
`permission.PermissionRoleDataScopePolicy`. No table, migration, data-scope
resolution or permission result changed.

Closed finding: **RC-022** (mirrored role data-scope model).

## Why delete instead of adding a checker

- The mirror existed to avoid a cross-directory import, but role already imports
  permission (`role_policy_sync.go` and tests), and permission does not depend on
  role (`go list -deps` → 0). No cycle.
- One authoritative model removes the drift surface structurally; a checker would
  preserve the duplicate and add a permanent gate. The packet's preferred branch
  (share the model) applies.

## Measured change

- Role package: **7 files, +54 / −75** (shared with the sibling tenant-scope
  conversion in the same package; the model delta is the deleted struct plus
  reference rewrites).
- Tests: role seeds updated to the permission model; no test deleted or weakened.

## Schema delta, recorded not fixed

Migrations name the composite index `idx_role_data_scope_tenant_role`
(non-unique) while both models declare unique `uk_...`; legacy `scope_defs` and
timestamps are unmapped. These are model-vs-migration items for a
migration-governance packet — migrations are `doNotTouch` here. They do not
distinguish the two models, so removing the mirror cannot change behaviour.

## Verification

| Command (cwd `backend`) | Result |
|---|---|
| `go build ./...` / `go vet ./...` | exit 0 |
| `go test ./modules/system/iam/role/... ./modules/system/iam/permission/...` | 2 ok / 0 FAIL |
| full `go test -count=1 ./...` | 47 ok / 0 FAIL |
| `grep roleDataScopePolicy` | 0 |
| `go list -deps permission \| grep role` | 0 (no cycle) |

## Runtime gap

No local MySQL credentials, so the schema was compared through the migration
files rather than a live dump. CI's MySQL-backed tests exercise the table. The
gap is recorded, not simulated.
