# Consumer Impact

## pantheon-ops

**Impact level: medium-low. Upgrade recommended. No overlay changes required.**

### Lock shape

`sharedPaths` is unchanged from v0.13.0 onward: the same 52 entries (backend 4, frontend 46,
docs 2). The consumer lock moves version, release line, commit, bundle checksum and `repo.tar`
checksum only. `rebuild-from-base.mjs` and `check-shared-drift.mjs` need no change.

### What arrives in the ops tree

| Area | Change | Consumer effect |
| --- | --- | --- |
| `backend/modules/system/iam/permission` | Tenant-bound policy console, role-key namespace guard, workbench remediation `tenant_id` | Security fix. Business code that writes policies on behalf of another tenant now receives `TENANT_FORBIDDEN`. |
| `backend/modules/auth` | Auth module seeds its own permission keys | None; it removes a first-login gap in fresh tenants. |
| `backend/pkg/database/migrations` | `000025`–`000028`, additive | Runs on startup through the standard migrator. No ops-owned table is touched. |
| `backend/pkg/database/migrations` (tenant seeds) | `platform.tenant_mode` becomes public | Tenant controls render on upgraded deployments. |
| `backend/modules/system/iam/menu` | Package name remains `menu` | The overlay menu registry already derives the package from the base tree. |
| `frontend/**` | 18 dependency updates, tenant menu seeds | `npm ci` from the new lock; type-check must stay green. |

### Overlay compatibility

The business overlay anchors on exact source lines and throws `Base assembly contract changed` if an
anchor does not appear exactly once. The six anchors were re-checked against the v0.17.0 tree before
the release was cut; none of the touched files changes them.

### Residual risk

- The migrations backfill tenant scoping. A deployment that already holds cross-tenant rows should
  be reviewed before the migration runs; the backfill is idempotent but it cannot guess ownership
  of a row that was written into the wrong tenant by the old defect.
- Tenant role keys that shadow the platform namespace are rejected going forward but are not
  renamed. Existing rows need the operator runbook in `upgrade-notes.md`.

### Rollback

Re-point the lock at `pantheon-base-v0.16.1` and rebuild. The schema stays compatible because every
migration in this release is additive.
