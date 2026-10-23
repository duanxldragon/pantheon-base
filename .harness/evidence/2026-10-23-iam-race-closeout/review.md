# Review — 2026-10-23 IAM concurrency closeout

## Scope reviewed

- `backend/modules/system/iam/tenant/tenant_provision.go`
- `backend/modules/system/iam/role/role_helper.go`
- `backend/modules/system/iam/user/user_helper.go`
- The four regressions in `tenant_concurrency_test.go`, `role_replace_concurrency_test.go`,
  `user_concurrency_test.go`, `role_backfill_test.go`
- `RELEASE_NOTES_v0.17.3.md` and the GitHub v0.17.3 release body

## Correctness

**Lock ordering.** Provisioning locks one row (`tenants`), then writes children; replace-style
grants lock one parent row (`system_role` / `system_user`), then rewrite children. No path takes two
parent locks, so no lock-order cycle is introduced. Different tenants/roles/users do not contend.

**Lock scope.** The tenant lock is held for the whole provisioning transaction, including the
bcrypt hash. That is the existing transaction shape (the hash already ran inside it), and it
serialises only same-tenant callers; other tenants keep provisioning in parallel. The post-commit
platform-default copies re-take the same tenant row in a second short transaction: they are
read-then-insert too, `system_setting` / `system_dict_type` would turn a lost race into a
duplicate-key 500, and `system_dict_item` has no unique key at all, so a lost race would silently
duplicate every item. The copies now take the transaction handle instead of the pool.

**Read-back semantics.** GORM renders `clause.OnConflict{DoNothing: true}` on MySQL as
`ON DUPLICATE KEY UPDATE <col>=<col>`. If the statement waited on a competing transaction, the
transaction's read view predates the winner's commit, so the follow-up read is a locking (current)
read. The code also fails loudly if the row is still missing instead of returning role id 0.

**Soft-deleted rows.** The upserts keep the previous semantics: a tombstoned role/user still owns its
natural key, so the insert is suppressed and the read-back returns that row. No new behaviour.

**Historical-row repair.** The DELETE runs first so the UPDATE cannot collide with the unique key.
Only `stale.tenant_id = 0` rows joined to a live tenant-owned role move; platform rows and grants of
soft-deleted roles are untouched. Both statements are idempotent, so two startup repairs converge.

**No error-envelope change.** The new lock waits surface as ordinary transaction errors; no response
shape is added or renamed.

## Tests

- The provisioning regression fails against the pre-fix code on the administrator's unique key.
- The two replace regressions assert the actual mechanism (a `FOR UPDATE NOWAIT` probe from a second
  transaction must get 3572) because a schedule-based 8-way race passed against the pre-fix code as
  well; MySQL's own row locks change the timing. Both fail against the pre-fix helpers.
- The backfill regression fails against the pre-fix helper and covers re-stamp, duplicate deletion,
  platform/deleted-role isolation and idempotency.
- The copy regression does not rely on timing: while the copy transaction holds the tenant row a
  second connection's `FOR UPDATE NOWAIT` probe must get 3572, and rolling the transaction back
  leaves no copied rows, which proves the helpers write through the caller's transaction. The
  16-contender stress run against the pre-fix shape never overlapped the copy windows, so the
  schedule-based test is a convergence check, not the proof.
- Tests use real MySQL (per-test isolated database), no mocks.

## Residuals and limits

- ThreadSanitizer cannot start on this Windows host (error 87); no Docker daemon or WSL distro is
  available. The race gate is CI `quality.yml` `backend-tests` (`go test -race ./...`, MySQL 8 +
  Redis); the run id is recorded in `commands.json`.
- The published v0.17.3 tag and its assets still contain the stale sentence; only the mutable
  release body and the repository file carry the correction.

## Verdict

Approve. The five registered residuals are fixed at the layer that owns the invariant; four have
regressions that fail before and pass after, and the fifth is closed as a dated correction.
