# Scoped migration state integrity handoff

Parent: `docs/harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps.task.md`.
Execution scope: `resume-migration-scope.md`. Final mechanical evidence and exact hashes: `resume-migration-receipt.json`.

## Source inspection (Generator, not independent approval)

- Dirty/read-error checks in `bootstrapExistingCurrentSchema` precede embedded-version lookup and all schema-marker inference. `RunMigrations` preserves the concrete `migrate.ErrDirty` through `%w` and returns before creating the official migrator.
- `bootstrapMigrationVersion` also checks recorded state before its existing clean-version guards and before `writeMigrationVersion`. The automatic dirty-repair branch and its success log are removed.
- Recorded state reading no longer selects an arbitrary first row as a valid clean state: clean multiple rows, negative clean versions, malformed/missing values and query/read errors refuse startup and readiness. A readable dirty row refuses startup even among multiple records. Dirty zero and minus-one are preserved as failures rather than treated as absent versions.
- Readiness reuses actual state reading. A valid nonnegative single clean record remains ready, including a future version; this preserves the existing clean-record contract rather than claiming that unknown future SQL can be applied by this embedded source. No/empty state remains unready until legitimate migration/bootstrap supplies a record.
- No new production function, dependency, DDL/index migration, policy/audit/i18n/menu change or automatic Force/recovery is introduced. Only existing database startup/readiness paths change; no domain boundary is crossed. The baseline CodeGraph impact listed the direct bootstrap, caller and startup entry point. New readiness-to-record-reader reuse adds no cycle or hub; no full updated graph sync is claimed.

## Meaningful runtime regression evidence

Five schema shapes (current v24 markers, pre-module, pre-menu, partial, no markers), five dirty versions (37/24/2/0/-1), and three actual entry points (RunMigrations, bootstrapExistingCurrentSchema, bootstrapMigrationVersion) cover 75 refusals. Exact values and SQL wire byte serialization, column schema and a nontransactional trigger witness verify preservation and zero record writes on each refusal. SQL byte serialization is not a claim about physical InnoDB page identity.

Eight malformed/multiple state fixtures across current/no-marker schemas and all three entry points cover 48 refusals; eight fresh/legacy/clean fixtures retain bootstrap/readiness and actual startup compatibility. The original auto-repair test now requires a typed startup refusal and unchanged dirty2. A closed database fails readiness and direct bootstrap.

## Preserved failures and recovery

- `resume-migration-red.txt` and its receipt show original dirty37 becoming clean24 at bootstrap and clean31 at actual RunMigrations (success), against the original source hash. All 45 initial cases failed. Those receipts remain unchanged.
- `resume-migration-targeted.txt` and its receipt retain the first post-repair attempt: dirty and unknown-state cases passed, but two added legacy startup fixtures failed because their newly partial user table lacked dept_id for v11 replay. The fixture correction confines tenant-marker tables to the current shape and reuses the established early legacy fixture; `resume-migration-compat-final.txt` verifies all eight compatibility cases.
- `resume-migration-race.jsonl` and its receipt retain the initial external MinGW-link failure before tests. The final race invocation prefixes the existing MinGW bin directory in its own process PATH and records its explicit CC. No machine configuration, compiler installation or test/source relaxation was used.

## Remaining ownership and limits

This adapter supplies implementation and scoped database-package evidence. Independent CODE/ARCH approval, full repository/shared release gates, official immutable publication and paired Ops consumption remain root-owned and open. No production database, Ops inherited file, consumer lock, foundation manifest/plan, original receipt, commit/push or publication was changed. Concurrent bootstrap/recovery actors and a production server/health HTTP endpoint are not separately exercised by this fixture matrix; the actual database startup function and readiness predicate are exercised. This handoff is not overall P0 or release approval.
