# Summary — upgrade-runbook (G03)

## Problem

`RELEASE_NOTES_v0.14.0.md` upgrade steps referenced nonexistent SQL scripts
(`scripts/create-default-tenant.sql`, `scripts/migrate-users-to-tenant.sql`), a
the old `./pantheon-server migrate up` binary entry that is not the shipped path, and
pasted bare SQL inside `bash` code blocks.

## Change

Rewrote the "For Existing Deployments (Compat→Multi Upgrade)" section to the
real migration path:

1. `mysqldump` backup (bash block).
2. `./scripts/tenant-migration-execute.sh` — the shipped runner that executes
   all pending embedded migrations via `go run ./cmd/tenantmigration up` and keeps
   `platform.tenant_mode=compat` until the explicit switch.
3. Default tenant creation + user migration per `docs/migrations/COMPAT_TO_MULTI_UPGRADE.md`
   Steps 1–2 (no bundled .sql scripts exist — stated explicitly).
4. Mode switch `UPDATE system_setting … 'multi'` in a proper ```sql block.
5. Restart + `./scripts/tenant-health-check.sh 1`.
6. Rollback SQL moved into a ```sql block (was already; kept).

## Verification

- All referenced artifacts exist on disk; phantom scripts confirmed absent.
- Docs/sync gates exit 0 after the edit.

## Acceptance mapping

"Rewrite upgrade/rollback steps to the actual migration path" — done. The
A disposable MySQL rehearsal was completed: v12 backup → migration v21 (`dirty=false`) → binary-safe backup restore → v12 (`dirty=false`), with table and row counts restored. Production migration remains out of scope.
