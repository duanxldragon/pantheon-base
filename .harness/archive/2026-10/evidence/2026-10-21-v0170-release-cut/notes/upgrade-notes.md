# Upgrade Notes

## From pantheon-base-v0.16.1 to pantheon-base-v0.17.0

No consumer code change is required. The release is additive at the schema level and removes no
API route, permission code or menu key.

### Steps

1. Point the consumer lock at `releaseVersion: pantheon-base-v0.17.0`, `releaseLine: release/0.17`,
   the release commit, the bundle checksum and the `repo.tar` checksum.
2. Materialize the release, or let `npm run rebuild:from-base` fetch it from the locked GitHub
   release; both archives are verified against the lock.
3. Rebuild and run the consumer gates. `sharedPaths` is unchanged at 52 entries, so the declaration
   itself does not move.

### Schema

Migrations `000025` through `000028` are additive and run through the standard startup migrator:

- `000025` / `000026` backfill tenant-scoped role data-scope and role-menu rows.
- `000027` cleans up ghost tenant memberships.
- `000028` adds `tenant_id` to `permission_workbench_remediation_event`.

No consumer-owned table is touched.

### Behaviour changes worth knowing

- A tenant-scoped policy write whose body names another tenant now fails with `TENANT_FORBIDDEN`
  instead of writing into that tenant. This is the security fix; a client that relied on the old
  cross-tenant write was broken by design.
- `tenantId=0` from a tenant session no longer creates a global policy.
- Tenant role keys that collide with the platform namespace are rejected on create, rename and
  import.
- `platform.tenant_mode` is raised to public on existing rows at startup (never lowered), so tenant
  controls render on upgraded deployments.

### Operator runbook

Existing deployments may already contain tenant roles whose keys shadow platform roles. They are
**not** renamed automatically. Before exposing the tenant console, list tenant roles whose key also
exists under tenant 0 (or is `platform_ops`), rename them, and re-assign their users. The bootstrap
orphan cleanup recognises the tenant-domain subject form, so renamed roles keep their policies.

### Rollback

Re-point the lock at `pantheon-base-v0.16.1` and rebuild. The migrations are additive, so a rollback
does not need a down migration for the consumer to run; `000028`'s down migration exists if the
column must be dropped.
