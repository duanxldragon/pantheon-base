# Role data-scope model drift report

Task: `2026-10-27-s3-role-data-scope-model`
Comparison: deleted `role.roleDataScopePolicy` vs authoritative
`permission.PermissionRoleDataScopePolicy`
(`backend/modules/system/iam/permission/permission_data_scope_model.go`).

## Field-by-field diff (every field, every tag)

| Field | Deleted role mirror | `permission.PermissionRoleDataScopePolicy` | Identical? |
|---|---|---|---|
| `TableName()` | `system_role_data_scope` | `system_role_data_scope` | yes |
| `ID` | `uint64` `primaryKey;autoIncrement` | same | yes |
| `TenantID` | `uint64` `not null;default:0;uniqueIndex:uk_role_data_scope_tenant_role,priority:1` | same | yes |
| `RoleKey` | `string` `size:64;not null;uniqueIndex:uk_role_data_scope_tenant_role,priority:2` | same | yes |
| `Mode` | `string` `size:32;not null;default:'all'` | same | yes |
| `DeptIDs` | `string` `type:text` | same | yes |

The mechanical comparison was character-level over field names and full gorm
struct tags. The only difference was comment wording. Both models were compared
after the mirror was deleted, using the `git show` copy of the old struct against
the permission model above.

## Against the live schema (migration source of truth)

`system_role_data_scope` evolved through three migrations (none modified here):

- **000001_init_schema**: `id`, `role_key` (single-column unique index
  `idx_system_role_data_scope_role_key`), `mode`, `scope_defs`, `created_at`,
  `updated_at` — no `tenant_id`, no `dept_ids`.
- **000002_align_runtime_schema**: `ADD COLUMN dept_ids TEXT`, backfilled from
  `scope_defs`.
- **000020_tenant_phase1_core_tables**: guarded `ADD COLUMN tenant_id` plus
  `ADD INDEX idx_role_data_scope_tenant_role (tenant_id, role_key)` — **non-unique**.

### Model-vs-migration deltas (recorded, not fixed)

1. **Index shape**: migrations create non-unique `idx_role_data_scope_tenant_role`;
   both models declare unique `uk_role_data_scope_tenant_role`. This is a
   model-vs-migration historical mismatch, identical in both models — not
   model-vs-model drift. Fixing it belongs to a migration-governance packet.
2. **Legacy columns**: `scope_defs` is no longer mapped by either model (already
   backfilled), and `created_at`/`updated_at` are unmapped by both. GORM only
   maps declared fields, so there is no behavioural effect.

Crucially, neither delta distinguishes the two models: they agreed on every
declared field and tag, so deleting the mirror cannot change runtime behaviour.

## Decision: move to the single authoritative model, delete the mirror

- The mirror's comment justified itself as avoiding a cross-directory import.
  That premise is already false: the role package imports permission today
  (`role_policy_sync.go` and role tests), and permission does not import role
  (`go list -deps` → 0), so there is no cycle.
- A divergence checker would convert a structurally removable duplicate into a
  permanently maintained gate. Deleting the mirror is strictly better.
- Landed: removed the struct; rewrote 4+ references (AutoMigrate, load, write,
  delete, HasTable) to `permission.PermissionRoleDataScopePolicy`; updated role
  test seeds. The delete path still targets the same tables
  (`system_role_data_scope` and the legacy `permission_role_data_scope_policy`).

## Verification

- `grep -rn roleDataScopePolicy backend --include=*.go` → 0.
- `go list -deps ./modules/system/iam/permission | grep role` → 0.
- `go build ./...`, `go vet ./...`, role + permission tests, and the full
  47-package suite are green.
- Data-scope resolution code (`permission_data_scope.go`) is untouched; all five
  modes and the existing two-tenant regression tests pass.
