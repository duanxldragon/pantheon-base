# Summary — 2026-10-24 v0.17.5 release closeout

## Why this release exists

PR #420 (`45aa7389`) closed the five residuals registered after v0.17.4: same-tenant
`ProvisionTenant` read-then-insert races, delete-then-insert replace-style grants, historical
`system_role_permission` rows stamped `tenant_id = 0`, the missing local race signal, and the stale
v0.17.3 notes sentence. Those fixes live on `main` only. A foundation release is the only channel
that carries them into a consumable asset, so v0.17.5 publishes them unchanged.

## What ships

Nothing under `backend/` changes again in this packet. The release carries what #420 already
merged, plus version material:

- **Provisioning serialisation** (`tenant_provision.go`): the provisioning transaction takes the
  `tenants` row first, roles and the administrator converge through locking read-back, bindings and
  membership tolerate duplicate keys, and the platform-default settings and dictionary copies run in
  a second transaction that re-takes the same tenant row on the caller's handle.
- **Replace-style grants** (`role_helper.go`, `user_helper.go`): `replaceRolePermissions` and
  `replaceUserRoles` lock the parent `system_role` / `system_user` row before delete-then-insert.
- **Historical-row repair** (`role_helper.go`): the bootstrap backfill deletes stale duplicates and
  re-stamps `tenant_id = 0` grants onto the owning role's tenant, leaving platform rows and grants
  of soft-deleted roles untouched.
- **Race evidence**: the CI Linux `go test -race ./...` job is the authoritative signal (runs
  `39969299263` and `39970863908` passed on head `973f5be2`); the local Windows host cannot start
  ThreadSanitizer (error 87).
- **v0.17.3 correction**: a dated correction block in `RELEASE_NOTES_v0.17.3.md` and the mutable
  GitHub release body. The tag and assets stay immutable.
- **Version material**: `VERSION` 0.17.5, `CHANGELOG.md`, `RELEASE_NOTES_v0.17.5.md`,
  `README.md`, `README.en.md`, `.harness/STATUS.md`, task packet and manifest.

## Verification (measured locally on 2026-10-24)

- `go build ./...`, `go vet ./...`, `gofmt -l .` clean.
- Full backend suite against real MySQL and Redis with both required flags set:
  **46 packages ok, 0 FAIL, 0 SKIP**, 6 packages without test files (`EXIT=0`).
- Targeted regressions, each on real MySQL: tenant convergence, copy lock and cross-tenant
  isolation PASS in 2.926s; role replace lock, backfill re-stamp/dedupe and platform-namespace
  repair PASS in 2.201s; user replace lock and duplicate-key loser mapping PASS in 1.758s.
- Governance: frontmatter 349 docs (256 with frontmatter), task packets 54 files / 0 errors,
  structure 0 findings across 2557 tracked files, generated 0 findings across 11 artifacts,
  failure registry 0 errors, `check-evidence --strict` and `check-review --strict` clean.
- Scope: `git diff --stat pantheon-base-v0.17.4..HEAD` reports 21 files and 1533 insertions;
  backend changes are 9 files under `system/iam` and `pkg/testmysql`, with no migration and no
  workflow file (`git diff --name-only` filtered for `migrations` and `.github/workflows` is empty).

Decided by CI, not locally: the release PR required checks, SonarCloud, `Release Gate Summary` on
the merge commit, and `Foundation Release Verify` on the tag.

## Gaps and limits

- The local race detector cannot start on this Windows host (TSan shadow-memory allocation, error
  code 87). Race coverage is the CI Linux gate, not a local run.
- Platform-default copy serialisation depends on the tenant row lock; `system_dict_item` has no
  unique key, so that dependency is load-bearing rather than defence in depth.
- Concurrent same-tenant `ProvisionTenant` role creation still relies on the tenant row lock for
  serialisation, not on a per-role upsert.
- Published tags and assets for v0.17.0 through v0.17.4 remain immutable; only repository files and
  mutable release bodies can carry corrections.

## Publication state

Prepared, not yet published. Target commit is `45aa7389` (the squash merge of PR #420); previous
release is `pantheon-base-v0.17.4` (commit `ac813f6f`, tag object `b1e8fc4b`). Publication facts
(tag object, asset checksums, Release Gate run, Foundation Release Verify run) are appended to this
file and `commands.json` in the facts commit after the tag is cut.
