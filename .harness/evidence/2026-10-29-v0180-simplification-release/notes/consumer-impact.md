# Consumer Impact

## pantheon-ops

**Impact level: medium-low. Upgrade recommended. No overlay changes required.**

### Lock shape

`sharedPaths` is unchanged at 52 entries (backend 4, frontend 46, docs 2). The lock moves version,
release line, commit, bundle checksum and `repo.tar` checksum only. `rebuild-from-base.mjs` and
`check-shared-drift.mjs` need no change; `foundation-release.lock.json` must move its
`releaseLine` to `release/0.18` together with the version.

### What arrives in the ops tree

| Area | Change | Consumer effect |
| --- | --- | --- |
| `backend/pkg/common` | Shared request helpers, not-found translation, error-key map, `re_export.go` narrowed to 52 lines | Structural. Response envelopes unchanged; business code that used a removed zero-caller symbol must use the canonical name (none of the ten removed aliases had a consumer in base). |
| `backend/pkg/impexp` | One import/export pipeline replacing eight module copies | Structural. Module-level import/export endpoints keep their paths and envelopes. |
| `backend/pkg/tenant` | `Scoper` becomes the single tenant-scope entry; `tenant.HasRoleBindingInTenant` added | Structural plus the W4 issuance gate below. |
| `backend/modules/auth` | Login discovery and switch gated by role binding; picker keys removed from five locales | Behaviour change: a membership without a role binding cannot log in or switch. |
| `backend/modules/system/iam/tenant` | Archive guard on delete, member integrity, legacy handler removed | Behaviour change: delete requires the archived state; adding a foreign user returns `tenant.member.user_not_in_tenant`. |
| `backend/go.mod` / `go.sum` | `go-oidc` 3.21.0, `go-jose` v4 | Rebuild resolves the new modules; `go mod download` on the first build. |
| `backend/pkg/database/migrations` | No change | Nothing runs on startup. |
| `frontend/src/modules/auth` | Login picker and shell `TenantSwitcher` removed; tenant console smoke spec added | Menu and route contracts unchanged; the removed components were unreachable. |

### Overlay compatibility

The business overlay anchors on exact source lines and throws `Base assembly contract changed` if an
anchor does not appear exactly once. The simplification waves touched 129 backend and frontend files
but none of the overlay anchors; the anchors are re-checked by `npm run rebuild:from-base` during the
consumer sync, and the sync is recorded in the consumer repository commit.

### Residual risk

- A consumer deployment that relies on a bare tenant membership for login must bind a role in the
  owning tenant. Existing cross-tenant membership rows are not deleted, they simply stop granting a
  context.
- Automation that deletes tenants without first archiving them now receives a refusal.

### Rollback

Re-point the lock at `pantheon-base-v0.17.8` and rebuild. No migration runs, so the schema is
compatible in both directions.
