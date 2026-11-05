# Upgrade Notes

## pantheon-base-v0.18.3

Upgrade from the previously published `pantheon-base-v0.18.2` through the checksummed foundation release and its exact repository snapshot.

1. Verify the release manifest, bundle SHA-256, repository snapshot SHA-256 and immutable tag/base commit. Preserve the current consumer lock and business overlay.
2. Read `docs/runbooks/MIGRATION_000031_PRODUCTION_DROP.md` and its referenced tenant/backup runbooks before any production deployment. Migration 000031 drops the obsolete `permission_role_data_scope_policy` table. Its down migration recreates the table shape only; it does not restore rows. A server startup can apply all pending migrations, so deployment is itself a migration event.
3. Run the prescribed read-only preflight, inventory all pending migrations, preserve and verify any residual data, and obtain the runbook's explicit maintainer/database release decision. This artifact publication does not grant production DDL approval and no production migration was executed by the release task.
4. Reconstruct the consumer in an isolated target from the official release snapshot plus its declared business overlay. Resolve migration-number collisions by ownership before applying migrations; the isolated Ops host-state repair has been renumbered from 000031 to 000032 and must be validated together with the foundation migrations.
5. Validate the reconstructed migration chain, business overlay/shared drift, full isolated database/Redis Go race, frontend lint/type-check/build/unit and affected business runtime smoke. Advance the consumer lock and live working tree only after its staging checks pass.

Refresh tokens are single-use. A consumed token cannot be restored after a later storage failure, and a rejected concurrent rotation/switch may require signing in again. Keep existing SSRF network policy in place and verify actual datasource/webhook endpoints; do not disable protection to make consumer tests pass.

Tenant V1 remains compat/multi with system-domain isolation and quota measurement/display. This upgrade does not introduce business-domain isolation or enforced quotas.

Rollback requires restoring the prior application/release lock together with a compatible verified database backup where migration data was removed. `migrate down` alone is not a data rollback.
