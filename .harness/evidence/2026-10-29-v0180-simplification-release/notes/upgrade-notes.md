# Upgrade Notes

## From pantheon-base-v0.17.8 to pantheon-base-v0.18.0

No consumer source change is required. There is no migration, no removed route, permission code,
menu key or i18n key, and `sharedPaths` is unchanged at 52 entries.

### Steps

1. Point the consumer lock at `releaseVersion: pantheon-base-v0.18.0`,
   `releaseLine: release/0.18`, the release commit, the bundle checksum and the `repo.tar`
   checksum.
2. Materialize the release, or let `npm run rebuild:from-base` fetch it from the locked GitHub
   release; both archives are verified against the lock.
3. Rebuild and run the consumer gates. `backend/go.sum` changes because `go-oidc` moves to 3.21.0
   and `go-jose` to v4; run `go mod download` as part of the first build.

### Schema

No migration in this release. The chain still ends at `000030_tenant_plan_definitions`.

### Behaviour changes worth knowing

- **A membership without a role binding is no longer a usable context.** Login discovery, the
  candidate list and the switchable list are gated by `tenant.HasRoleBindingInTenant`, and
  `POST /system/tenant/member` returns `tenant.member.user_not_in_tenant` (400) for a user that the
  target tenant does not own. A consumer that seeded a bare membership and expected a login will
  see the login refused; the fix is to bind a role in the owning tenant.
- **`DELETE /system/tenant/:id` refuses a tenant that is not archived.** Callers must archive first.
- **The login picker and the shell `TenantSwitcher` are gone.** The underlying endpoints remain as
  compatibility surfaces that return at most one item; `/auth/current` still reports unfiltered
  memberships.
- **The legacy tenant handler, routes and bootstrap service are deleted.** They were never mounted,
  so no request path changes.

### Rollback

Re-point the lock at `pantheon-base-v0.17.8` and rebuild. No migration runs in either direction, so
the rollback is a tree swap plus the standard startup path.
