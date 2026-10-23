# Review — 2026-10-23 v0.17.4 release closeout

Reviewed against `main` at `a9fffac8` (the merge of PR #417), with `pantheon-base-v0.17.3` as the
previous release tag.

## Scope audit

`git diff --stat pantheon-base-v0.17.3..HEAD` reports 21 files and 1184 insertions. Production
changes are confined to six files under `system/iam/user`, `system/iam/role` and
`system/iam/tenant`, plus five new test files, the IAM residual packet and evidence, and the
STATUS/evidence updates from #416. There is no migration, route, permission-code, menu-seed,
workflow or frontend change. The package version moves 0.17.3 → 0.17.4 as a patch.

## Claim audit

| Release-note / packet claim | Evidence |
|---|---|
| Import lookups are tenant-scoped | `loadUsersByUsername`, `loadRoleIDsByKey`, `loadPostIDsByCode` call `s.scoped(...)`; `BuildDeptPathMaps(s.scoped(s.db))`; `TestImportUsersStaysInsideTheRequestTenant` PASS |
| Imported users carry the request tenant and a membership | `TenantID: s.tenantOwnerID()` and `ensureTenantMembership(tx, user.TenantID, user.ID)` inside the create transaction; the same test asserts the membership |
| Duplicate-key losers get 409, not 500 | `database.IsDuplicateKey` mapping in `CreateUser`, `CreateRole`, `UpdateRole`; three contender tests PASS with exactly one winner and one row |
| Grants are idempotent | `CreateInBatches` + `clause.OnConflict{DoNothing:true}` in both grant helpers; `TestProvisionTenant_PermissionGrantsAreIdempotent` provisions, re-provisions and restores a deleted grant |
| Backfill keeps tenant ownership and dedupes | explicit `JOIN system_role ... deleted_at IS NULL`, `tenant_id` selected, natural-key dedupe, `OnConflict`; `TestBackfillRolePermissionsStampsTenantAndDeduplicates` PASS |
| No schema or contract change | the diff contains no migration; schema stays at 29; routes, permission codes, menus and error envelopes are unchanged |
| Branch coverage is real | coverprofile hits at `user_service.go:441.35,443.4`, `role_service.go:376.35,378.4`, `role_service.go:423.35,425.4` with count 1 |

## Findings

No blocking finding in the release content. Residual risks carried forward:

- **R1 (P2, accepted)**: concurrent same-tenant `ProvisionTenant` can still collide while creating
  roles (read-then-insert) before reaching the idempotent grant code. Normal provisioning is
  serialized per tenant creation; repair runs are sequential. Outside this packet.
- **R2 (P3, accepted)**: `replaceRolePermissions` / `replaceUserRoles` remain delete-then-insert.
  They do not pre-check and their inputs are deduplicated; the failure mode needs an unsupported
  concurrent writer on the same role/user.
- **R3 (P3, environment)**: the race detector cannot start on this Windows host (error 87). The
  real-MySQL contender tests cover the contract; CI's Linux race gate is the independent signal.
- **R4 (P3, immutable)**: old `system_role_permission` rows stamped `tenant_id = 0` by the previous
  backfill are not rewritten. The new backfill adds correctly owned rows; cleaning the old rows is
  a deliberate data migration, not part of this upgrade.
- **R5 (P3, immutable)**: the published v0.17.3 notes keep the stale `system_role_data_scope`
  sentence. The correction is recorded forward in v0.17.4.

## Verdict

Release content is consistent with its notes and evidence. The release was cut and published from
`ac813f6f` on 2026-10-23: annotated tag `pantheon-base-v0.17.4` (object `b1e8fc4b`), four assets
with verified checksums, `check-release-assets` consistent, and `Foundation Release Verify`
(run `39954843594`) succeeded. Details and the command trail are in `summary.md` and
`commands.json`.
