# Reproduction — TC-03 phantom membership and phantom owner

Task: `2026-10-27-tenant-member-integrity` (wave W2)
Date: 2026-10-27
Backend: `backend/modules/system/iam/tenant/tenant_service.go`, `tenant_platform_handler.go`

## The defect, before the fix

`tenant_memberships` has no foreign key to `system_user` (the table is created that way in
`backend/pkg/database/migrations/000013_tenant_canary.up.sql`). `AddMember` verified only that the
*tenant* existed, then wrote the row. So every `user_id` was accepted — a typo, a soft-deleted account,
an id that has never existed. Two consequences:

1. A membership naming nobody is invisible in the member list (the row has no user to join) but is a
   real row: it counts toward occupancy, and it can be written with `role = owner`.
2. `ensureNotLastOwner` counted owners by reading `tenant_memberships` alone. One phantom `owner` row is
   therefore enough to satisfy the "keep at least one owner" invariant (contract §2.2) for a user who
   can never sign in — and the *real* last owner can then be removed, leaving a tenant that no longer
   has anybody able to administer it.

The existing suite proved the gap by construction: every tenant test inserted membership rows for ids
(`100`, `200+i`, `101`–`103`, `777`, `88001`) that had no `system_user` row, and 119 cases were green.

## Reproduction A — the write path accepts a user that does not exist

New case `TestAddMember_RejectsUnknownUser` (`backend/modules/system/iam/tenant/tenant_service_test.go`)
against the unpatched service, run with `PANTHEON_TEST_DSN_REQUIRED=true`:

```
2026-10-27 14:57:51 tenant_service.go:872 record not found
[1.752ms] [rows:0] SELECT * FROM `tenant_memberships` WHERE `tenant_memberships`.`tenant_id` = 1
    AND `tenant_memberships`.`user_id` = 424242 ORDER BY `tenant_memberships`.`id` LIMIT 1
    tenant_service_test.go:441:
        Error:       An error is expected but got nil.
        Test:        TestAddMember_RejectsUnknownUser
--- FAIL: TestAddMember_RejectsUnknownUser (0.84s)
```

`424242` names no user; the service looked for an existing membership, found none, and created one.
Full log: `.harness/evidence/2026-10-27-tenant-member-integrity/red-without-fix.log`.

## Reproduction B — the mounted route answers 200 "success"

`TestPlatformAddMemberRejectsUnknownUser`
(`backend/modules/system/iam/tenant/tenant_lifecycle_guard_test.go`) posts to
`POST /system/tenant/:id/members` through `PlatformHandler.AddTenantMember`, the same handler
`modules/system/system_modules.go:296` mounts in production. Before the fix the envelope was
`{"code":200,"message":"success"}` and a row was written; after the fix it is:

```
=== RUN   TestPlatformAddMemberRejectsUnknownUser
--- PASS: TestPlatformAddMemberRejectsUnknownUser (17.74s)
```

asserting `code = 404`, `message = user.not_found`, the request leaves **no** membership row behind, and
a `user_id` that does exist still returns `200` — so the guard is a subject check, not a blanket refusal.

## Reproduction C — the phantom owner displaces the real one

`TestRemoveMember_PhantomOwnerDoesNotProtectRealOwner` creates a real owner (user 600), then writes one
`role = owner`, `status = active` row for user `601` **straight into `tenant_memberships`**, bypassing
`AddMember`, because that is the state the fix has to survive: the row exists, the user does not.

Against the unpatched service:

```
    tenant_service_test.go:526:
        Error:       Expected error with "tenant membership last owner" in chain but got nil.
        Test:        TestRemoveMember_PhantomOwnerDoesNotProtectRealOwner
--- FAIL: TestRemoveMember_PhantomOwnerDoesNotProtectRealOwner (0.77s)
```

The removal of the *only real* owner was allowed. `TestRemoveMember_DisabledUserOwnerDoesNotCount`
fails the same way for a disabled account: an owner that cannot sign in cannot repair a tenant, so it
must not be the owner the invariant counts on.

## The fix

Two predicates, both in `tenant_service.go`, plus their error mapping:

- `memberUserExists(userID)` — `id = ? AND deleted_at IS NULL` on `system_user`, checked in `AddMember`
  **after** the tenant lookup and **before** any membership read or write, so a tombstone tenant still
  answers `ErrTenantNotFound` (`TestAddMember_TombstoneTenantStillReportsTenantNotFound`) and the
  response does not leak whether a user id exists. Unknown subject → `common.NewNotFound("user.not_found")`,
  which `PlatformHandler.failServiceError` maps to envelope `code` 404 with that key.
- `liveUser(userID)` + `liveOwnerCount(tenantID)` — the owner guard now asks whether the *target* is a
  live (undeleted, enabled) user and counts surviving owners through a `JOIN system_user` that requires
  `deleted_at IS NULL AND status = 1`. A row naming a phantom, deleted or disabled user is therefore
  neither protection nor a surviving owner; it can still be deleted, which is how the existing ghosts
  get cleaned up.

`liveUser` deliberately does **not** filter on `system_user.tenant_id`, and `AddMember` stays permissive
about `status`:

- Cross-tenant membership is the policy question waves W3/W4 own; deciding it here would be scope creep,
  and `TestAddMember_DoesNotDecideCrossTenantMembership` pins the boundary explicitly instead.
- The hostile-browser smoke matrix adds tenant A's owner as a member of tenant B
  (`frontend/tests/smoke-core/tenant-hostile-browser-matrix.spec.ts:91`), so a tenant-scoped add would
  have broken a shipped scenario that this wave does not touch.
- `BootstrapService.MigrateExistingUsersToDefaultTenant` (`tenant_bootstrap.go:99`) assigns users whose
  owning tenant is not the tenant being migrated into, and status-filtering there would strand disabled
  accounts without a login gate.

## Differential

Same ten cases, service and handler reverted to `HEAD` and then restored (byte-for-byte, verified with
`diff -q`):

| Case | Without the fix | With the fix |
|---|---|---|
| `TestAddMember_RejectsUnknownUser` | FAIL | PASS |
| `TestAddMember_RejectsDeletedUser` | FAIL | PASS |
| `TestRemoveMember_PhantomOwnerDoesNotProtectRealOwner` | FAIL | PASS |
| `TestRemoveMember_DisabledUserOwnerDoesNotCount` | FAIL | PASS |
| `TestAddMember_TombstoneTenantStillReportsTenantNotFound` | PASS | PASS |
| `TestRemoveMember_LastLiveOwnerAmongTwoLiveOwners` | PASS | PASS |
| `TestAddMember_DoesNotDecideCrossTenantMembership` | PASS | PASS |
| `TestAddMember_Duplicate` | PASS | PASS |
| `TestAddMember_OwnerIsProtected` | PASS | PASS |
| `TestDeletedTenantRefusesNewMembers` | PASS | PASS |

The two PASS→PASS rows in the middle are the point of the second half: the tombstone order and the
normal "one of two real owners may leave" case must not change. `TestRemoveMember_LastLiveOwnerAmongTwoLiveOwners`
was written before the fix precisely so the guard could not be "fixed" by refusing every owner removal.

Logs: `/d/tmp/w2/red-final.log` (4 FAIL), `/d/tmp/w2/green-final.log` (0 FAIL), both with
`PANTHEON_TEST_DSN_REQUIRED=true` and `-count=1`.
