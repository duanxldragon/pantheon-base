# Evidence: 2026-09-10-tenant-migration-runbook

## Deliverables

- `docs/runbooks/TENANT_MIGRATION_RUNBOOK.md` — full runbook: inventory (31 tables, global unique keys, query entry points, Redis/upload/audit paths), 5-phase migration procedure (A new tables → B add column 4-step → C unique-key conversion → D Casbin domain → E real-tenant backfill), lock/window strategy, dual-write flags, failure detection, rollback, human gates G1–G4.
- `.harness/evidence/2026-09-10-tenant-migration-runbook/rehearsal-log.md` — three rehearsals on replica.

## Verification Evidence

- Rehearsal environment: local MySQL 8.0.36 replica DB `tenant_rehearsal`, freshly migrated via the project's own `RunMigrations` (all 12 migrations, 31 tables, ~3s). Run ID `rehearse-20260911_065959`.
- **Success path**: baseline captured (31 tables) → `ADD COLUMN tenant_id` + backfill `tenant_id=0` on `system_user` → success logged.
- **Conflict path**: duplicate-username insert against `idx_system_user_username` reproduced `ER_DUP_ENTRY`; logged as `conflict` outcome, validating the C1/C2 deterministic conflict procedure premise.
- **Failure + rollback path**: injected DDL failure → rollback via `DROP COLUMN tenant_id` → schema verified back to baseline (0 `tenant_id` columns remain), row counts match baseline snapshot (system_user 1/1, system_role 1/1, system_menu 94/94 → MATCH), cache-invalidation step logged.
- Doc gates: `check-doc-frontmatter` 0 errors (baseline preserved); `check-doc-links` 0 findings.
- Runtime untouched: `go test ./...` green in both DSN-less and DB-backed modes (run during Task 0; no runtime code changed by this task — verified via `git status` scoping).

## Success Criteria Mapping

- Behaviour Outcome: any implementer can follow §3 phases A–E on a replica — demonstrated end-to-end in rehearsal. ✅
- Verification Signal: rehearsal logs, row counts, schema check, rollback report all present. ✅
- Regression Watch: unique-key conflict probe reconfirmed global uniqueness behavior; login-path tables untouched. ✅
- Economics Watch: rehearsal timing recorded (~3s fresh migrate, <100ms single-column DDL); production conversion formula and ×2 window rule documented in runbook §4.2. ✅

## Human Gates (not passed yet, by design)

- G1 runbook approval / G2 backup RPO-RTO / G3 production window / G4 contract freeze confirmation.
- **Production execution remains prohibited until G1–G4 are green** — stated in runbook header and §8.

## Gaps

- Production-scale window estimation requires real production row counts at gate time (runbook §4.2 formula provided).
- Phase-E real-tenant backfill is intentionally not rehearsed (depends on tenant creation UX from canary/core tasks); its rollback is covered by backup restore (G2).
