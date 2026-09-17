# Tenant Migration Rehearsal Log (replica: tenant_rehearsal)

- Run ID: `rehearse-20260911_065959`
- Date: 2026-09-11 (local)
- Replica: MySQL 8.0.36 @ 127.0.0.1:3306, database `tenant_rehearsal` (fresh full migration via `RunMigrations`, 31 tables)
- Excluded from production: this database is a disposable local replica; no production DDL was executed.
- Cache fixture: rehearsal Redis logical DB 15 @ 127.0.0.1:6379 (isolated from dev DB 0).

## Steps

| time | step | outcome | detail |
|------|------|---------|--------|
| 2026-09-11 07:00:09 | baseline-capture | success | 31 tables captured into tenant_migration_baseline |
| 2026-09-11 07:00:09 | backfill-tenant-id | success | system_user backfilled with tenant_id=0, rows=1 |
| 2026-09-11 07:00:18 | conflict-probe | conflict | INSERT duplicate username admin violates idx_system_user_username -> ER_DUP_ENTRY |
| 2026-09-11 07:00:27 | injected-failure | failure | injected DDL failure simulating online migration crash (kill -9 during ALTER, metadata lock wait) |
| 2026-09-11 07:00:27 | rollback-schema | success | ALTER TABLE system_user DROP COLUMN tenant_id executed |
| 2026-09-11 07:00:41 | cache-invalidation | success | FLUSHDB on rehearsal Redis DB 15 verified |
| 2026-09-11 07:00:41 | restore-verified | success | row counts + schema match baseline after rollback |

## Post-rollback verification

- `information_schema.columns` for `tenant_rehearsal`: **0** columns named `tenant_id` remaining (schema == baseline).
- Row-count verification vs baseline snapshot:
  - `system_user`: baseline 1 == actual 1 → MATCH
  - `system_role`: baseline 1 == actual 1 → MATCH
  - `system_menu`: baseline 94 == actual 94 → MATCH
- Login-path invariants unchanged: `idx_system_user_username` global unique still enforced (conflict probe reproduced ER_DUP_ENTRY), auth throttle/session tables untouched.

## Timing / economics observation

- Full fresh migration (31 tables, all 12 migrations): ~3 s on empty local replica.
- Single-column ADD/DROP on a 1-row table: < 100 ms; metadata-lock window scales with table size in production — see runbook §4.2 window estimates (to be filled from production table sizes at the release gate).
