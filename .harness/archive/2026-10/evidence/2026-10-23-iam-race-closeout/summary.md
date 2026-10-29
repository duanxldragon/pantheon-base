# Summary — 2026-10-23 IAM concurrency closeout (post v0.17.4)

## Why this task exists

v0.17.4 closed the import, duplicate-key and grant-idempotency defects but registered five
residuals. This packet closes all five; each one is now either fixed with a real-MySQL regression or
evidenced by CI, and the stale published sentence is corrected with an audit trail.

## Findings and fixes

### R1 (P2) — same-tenant provisioning was read-then-insert

`ProvisionTenant` ran a chain of read-then-insert steps inside one transaction:
`provisionTenantRoles`, `provisionTenantRootDept`, `provisionTenantAdminUser` and
`provisionTenantAdminBinding`. Two callers for the same tenant both read "not there" and both
inserted:

- the role insert collided on `uk_system_role_tenant_key` (the loser rolled back the whole
  provisioning transaction);
- the administrator collided on `uk_system_user_tenant_username`;
- the root department has no unique key at all, so the race produced two roots instead of an error;
- the binding and membership writes could duplicate.

Fixed by locking the `tenants` row (`SELECT ... FOR UPDATE`) at the start of the provisioning
transaction, so same-tenant callers queue and later callers read what the first committed. On top
of the lock, roles and the administrator are written with `clause.OnConflict{DoNothing: true}` and
read back with a locking read: under REPEATABLE READ a plain SELECT keeps the older snapshot and
would miss a row whose insert was suppressed after a wait. Bindings and memberships use the same
conflict-tolerant insert.

`TestConcurrentProvisioningOfTheSameTenantIsConvergent` runs four concurrent `ProvisionTenant`
calls for one tenant and asserts every caller succeeds with the same role ids, exactly one role per
definition, one administrator, one binding, one membership, one root department and one copy of
every platform setting, dict type and dict item. Against the pre-fix code it fails on the
administrator's duplicate key (`system_user.uk_system_user_tenant_username`).

The platform-default copies are also read-then-insert and ran after the lock was released.
`system_setting` and `system_dict_type` would turn a lost race into a duplicate-key 500, and
`system_dict_item` has no unique key at all, so a lost race would silently duplicate every item.
The copies now take the transaction handle and run in a second short transaction that re-takes the
tenant row lock. `TestCopyPlatformDefaultsRunOnTheLockedTenantRow` proves the mechanism without
timing: while the copy transaction is open a second connection's `FOR UPDATE NOWAIT` probe gets
MySQL 3572, and rolling the transaction back leaves no copied rows, so the helpers write through
the caller's handle. A 16-contender / 200-row stress run against the pre-fix copy shape never made
the windows overlap, which is why the concurrency test is documented as a convergence check rather
than as proof of the copy fix.

### R2 (P2) — replace-style grants could interleave

`replaceRolePermissions` and `replaceUserRoles` deleted every row and re-inserted the requested set
without holding the parent row. Two replacers that both delete before either inserts leave a merged
set: each caller sees a grant the other never granted. The index-gap locks can also deadlock.

Both now lock the parent `system_role` / `system_user` row before the DELETE. The lock serialises
the whole delete-then-insert sequence, so the surviving set is exactly the last caller's.

The regressions
`TestConcurrentReplaceRolePermissionsSerialisesOnTheRoleRow` and
`TestConcurrentReplaceUserRolesSerialisesOnTheUserRow` are deterministic: while one replace is in
flight, a second transaction's `FOR UPDATE NOWAIT` probe must fail with MySQL 3572 (lock not
acquired). That is the mechanism the fix adds; a schedule-based race test would have passed against
the pre-fix code because MySQL's own row locks change the timing. Both tests fail against the
pre-fix helpers (`An error is expected but got nil` at the probe) and then assert that the queued
second writer's set is the stored one. The probe and the serialised-writer choreography live in
`pkg/testmysql` and are shared with the tenant copy test, so the three regressions cannot drift apart.

### R3 (P2) — historical tenant_id = 0 permission rows

Before v0.17.4 the bootstrap backfill selected role-menu rows without joining `system_role`, so
tenant roles' grants were stamped `tenant_id = 0`. Those rows are invisible to every tenant-scoped
read: the tenant role silently loses the permission while a stray grant sits in the platform
namespace.

`backfillRolePermissions` now repairs them before seeding (and before its empty-seed early return):

1. delete stale rows whose `(role_id, permission_key)` is already owned under the role's tenant —
   updating them would violate `uk_role_permission_tenant`;
2. re-stamp the remaining stale rows with the role's tenant.

Platform grants (`tenant_id = 0` on a platform role) and grants of soft-deleted roles are left
alone. `TestBackfillRolePermissionsRepairsPlatformNamespaceGrants` covers re-stamping, the
duplicate deletion, the untouched platform grant, the untouched soft-deleted-role grant and
idempotency; it fails against the pre-fix helper (`elements differ`).

### R4 (P2) — race gate evidence

The local Windows host cannot start ThreadSanitizer (`go test -race` aborts during runtime init with
`failed to allocate 0x... error code: 87`, with and without `-p 1`), and no Docker daemon or WSL
distro is available to run a Linux container. The authoritative race evidence is the CI
`quality.yml` `backend-tests` job, which runs `go test -race ./...` against MySQL 8 and Redis on
Linux. Run 39969299263 (`headSha` 973f5be2) passed the Backend Tests job on the final head; the
run and job ids are recorded in `commands.json`.

### R5 (P3) — v0.17.3 notes correction

`RELEASE_NOTES_v0.17.3.md` claimed `system_role_data_scope` and `system_role_permission` still
pre-checked. `upsertRoleDataScopePolicyPreservingCustomDepts` has always written through
`clause.OnConflict`, so only the `system_role_permission` half was accurate. A dated correction
block is appended in the repository file and in the GitHub v0.17.3 release body, keeping the
original text visible; the tag and its four assets are unchanged.

## Tests added

| Test | File | What it pins |
| --- | --- | --- |
| `TestConcurrentProvisioningOfTheSameTenantIsConvergent` | `tenant_concurrency_test.go` | Four concurrent provisions converge on one role set, administrator, binding, membership, root department and one copy of each platform default |
| `TestCopyPlatformDefaultsRunOnTheLockedTenantRow` | `tenant_concurrency_test.go` | The copies run on the locked transaction: second connection gets 3572, rollback leaves no copied rows |
| `TestConcurrentReplaceRolePermissionsSerialisesOnTheRoleRow` | `role_replace_concurrency_test.go` | The role row is locked during a replace; the queued writer's set survives |
| `TestConcurrentReplaceUserRolesSerialisesOnTheUserRow` | `user_concurrency_test.go` | The user row is locked during a replace; the queued writer's set survives |
| `TestBackfillRolePermissionsRepairsPlatformNamespaceGrants` | `role_backfill_test.go` | Stale `tenant_id = 0` grants are re-stamped or deduplicated; platform/deleted-role grants untouched; idempotent |

## Verification

See `commands.json` for the exact commands and results. Summary:

- `gofmt`, `go build ./...`, `go vet ./...` — clean.
- Full `go test ./...` against real MySQL and Redis — exit 0; 46 packages ok, 0 FAIL, 0 SKIP
  (`PANTHEON_TEST_DSN_REQUIRED` and `PANTHEON_TEST_REDIS_REQUIRED` set).
- The new tests fail against the pre-fix code and pass with the fix.
- Governance checkers pass (frontmatter, task-packet template and instances, structure, generated,
  failure registry).
- Race gate: CI `backend-tests` (`go test -race ./...`, MySQL 8 + Redis) — run id in
  `commands.json`.

## Not in scope

- No schema change (stays at 29), no route/permission/menu/seed change.
- Workflow files, gate thresholds and the published tags/assets are untouched.
