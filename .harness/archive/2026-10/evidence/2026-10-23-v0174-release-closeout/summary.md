# Summary — 2026-10-23 v0.17.4 release closeout

## Why this release exists

v0.17.3's known-residual registered a single item. Re-reading the code against that sentence found
four defects, one of them never registered: user CSV import resolved usernames, role keys,
department paths and post codes across tenants, and the create path wrote neither `tenant_id` nor a
membership. A tenant-A import could update tenant B's same-named user; created users landed in the
platform namespace, invisible to the importer and unable to log in.

The fixes merged in PR #417 (`a9fffac8`), but a fix that is only on `main` does not change any
consumable asset. v0.17.4 publishes them.

## What ships

- **Tenant-scoped import** (`user_export.go`, `user_helper.go`): all four import lookups run through
  `s.scoped(...)`, including `impexp.BuildDeptPathMaps`; created users carry
  `TenantID: s.tenantOwnerID()` and receive `ensureTenantMembership` in the same transaction.
- **Duplicate-key conflicts** (`user_service.go`, `role_service.go`): `CreateUser`, `CreateRole` and
  `UpdateRole` map `database.IsDuplicateKey` to the pre-check's existing 409
  (`user.create.error.username_exists`, `role.key.exists`).
- **Idempotent grants** (`tenant_provision.go`): permission and menu grants batch
  `CreateInBatches(grants, 100)` with `clause.OnConflict{DoNothing:true}`.
- **Correct backfill** (`role_helper.go`): joins `system_role` for `tenant_id`, requires
  `system_role.deleted_at IS NULL`, deduplicates by `SystemRolePermission` and inserts with
  `OnConflict{DoNothing:true}`.
- **Version material**: `VERSION` 0.17.4, `CHANGELOG.md`, `RELEASE_NOTES_v0.17.4.md`,
  `README.md`, `README.en.md`, `.harness/STATUS.md`.

## Verification (measured locally)

- Full backend suite against real MySQL/Redis, both required flags set: **46 packages ok, 0 FAIL,
  0 SKIP**, 6 packages without test files.
- New tests individually: tenant-scoped import PASS 2.45s, backfill ownership/dedupe PASS 1.98s,
  grant idempotency PASS 1.92s.
- Coverprofiles: `user_service.go:441.35,443.4`, `role_service.go:376.35,378.4` and
  `role_service.go:423.35,425.4` all recorded with count 1 — the duplicate-key branches executed.
- `go build ./...`, `go vet ./...`, `gofmt -l .` clean.
- Governance: frontmatter 347 docs; task packets all PASS; structure 0 findings across 2543 tracked
  files; generated 0 findings across 11 artifacts; failure registry 0 errors.

Decided by CI, not locally: the PR required checks, `Release Gate Summary` on the merge commit, and
`Foundation Release Verify` on the tag.

## Gaps and limits

- The race detector cannot start on this Windows host (TSan shadow-memory allocation, error code 87).
  The concurrency contract is covered by the real-MySQL contender tests; the race gate runs in CI
  on Linux.
- Concurrent same-tenant `ProvisionTenant` can still collide while creating roles (read-then-insert)
  before reaching the now-idempotent grant code. Normal provisioning is serialized per tenant
  creation and repair runs are sequential.
- `replaceRolePermissions` and `replaceUserRoles` still delete-then-insert. They do not pre-check
  and their inputs are deduplicated, so the failure mode requires an unsupported concurrent writer
  on the same role/user.
- The v0.17.3 release notes are immutable; the stale `system_role_data_scope` sentence is corrected
  forward in v0.17.4.

## Publication state

Published on 2026-10-23T12:38Z. PR #418 merged as `ac813f6f74de41ebb773a749d7cb2f591fa1050a`;
`Release Gate Summary` succeeded on that commit (run `39951900733`). The annotated tag
`pantheon-base-v0.17.4` (object `b1e8fc4ba84b6868e6f3ea4b7cb47e0bbc428cdc`) points at the merge
commit. The GitHub release is neither a draft nor a prerelease and carries exactly four assets:

- `foundation-release-pantheon-base-v0.17.4.tgz` — sha256 `339a9a89252b62515e279659a12179a6e8c6b94e9d08906ac12b01f9975ce53d`
- `foundation-release-pantheon-base-v0.17.4.tgz.sha256`
- `repo.tar` — sha256 `bcc0250a8c1c13349291021d8aebf1f3ab8e9bf18ef90ab78912cab27843476f`
- `repo.tar.sha256`

The pre-tag scan reported `clean (3108 file(s) scanned)` with both `bundle/` and `repo.tar` opened.
`check-release-assets` confirmed the local bundle and the four remote assets, and
`Foundation Release Verify` (run `39954843594`) succeeded. Full command trail in `commands.json`.
