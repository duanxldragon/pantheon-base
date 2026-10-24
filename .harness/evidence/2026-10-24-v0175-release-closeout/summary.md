# Summary — 2026-10-24 v0.17.5 release closeout

## Why this release exists

PR #420 (`45aa7389`) closed the five residuals registered after v0.17.4: same-tenant
`ProvisionTenant` read-then-insert races, delete-then-insert replace-style grants, historical
`system_role_permission` rows stamped `tenant_id = 0`, the missing local race signal, and the stale
v0.17.3 notes sentence. Those fixes live on `main` only. A foundation release is the only channel
that carries them into a consumable asset, so v0.17.5 publishes them unchanged.

## What ships

No backend production file changes again in this packet. The release carries what #420 already
merged, the reduced-motion guard needed to clear Release Gate, plus version material:

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
- **Reduced-motion guard** (`frontend/src/assets/list-page.css`, `frontend/src/core/layout/index.css`):
  the org-chart card and top-menu item transitions are declared inside
  `@media (prefers-reduced-motion: no-preference)`. Default rendering is unchanged; reduced-motion
  users get no transition. This closes the two unresolved SonarCloud `css:S9440` issues that
  blocked Release Gate at `d36c63e9`. The SonarCloud rule and project configuration are untouched.
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
  failure registry 0 errors, `check-evidence --strict` clean, and `check-review --strict` scoped to
  this task's `review.md` clean. A repo-wide `check-review --strict` reports one pre-existing
  failure outside this packet: `2026-10-23-v0174-release-closeout/review.md` has no Machine
  Readable block (committed in `b3071847`, unchanged by this release).
- Scope: `git diff --stat pantheon-base-v0.17.4..HEAD` reports 21 files and 1533 insertions before
  the reduced-motion fix; the release-material PR added 12 files, and the reduced-motion PR touches
  two CSS files. Backend changes are 9 files under `system/iam` and `pkg/testmysql`, with no
  migration and no workflow file (`git diff --name-only` filtered for `migrations` and
  `.github/workflows` is empty).
- Frontend: Prettier clean on both edited files, `check-ui-contract` 0 findings across 263 files,
  `check-shell-visual-contract` passed, `vite build` succeeded. A headless Chromium check of the
  built CSS measured `transition-duration: 0.18s, 0.18s, 0.18s` (card) and `0.18s` × 4 (menu)
  under `prefers-reduced-motion: no-preference`, and `0s` for both under `reduce`.

Decided by CI, not locally: the release PR required checks, SonarCloud, `Release Gate Summary` on
the merge commit, and `Foundation Release Verify` on the tag.

## Release-gate history

The release-material PR #421 merged as `d36c63e9`. `Release Gate Summary` failed twice on that
commit:

1. **Network flake, not a code failure.** `PR Smoke Modules` failed while downloading
   `google.golang.org/grpc@v1.83.2` from `proxy.golang.org` (`stream error: ... INTERNAL_ERROR`).
   Rerunning the failed job in the Code Quality Gates workflow passed.
2. **Two unresolved SonarCloud issues.** `css:S9440` flagged the org-chart card transition
   (`frontend/src/assets/list-page.css:1541`) and the top-menu item transitions
   (`frontend/src/core/layout/index.css:785`). Both were logged on 2026-05-11 and are unrelated to
   the IAM work. Per the maintainer's standing rule the rule is not changed and no suppression was
   added; the transitions were moved under `@media (prefers-reduced-motion: no-preference)`.

Because the gate must be green on the commit that is tagged, the release target is the merge of the
reduced-motion fix, not `d36c63e9`.

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

Published on 2026-10-24T01:13:53Z. Previous release is `pantheon-base-v0.17.4` (commit
`ac813f6f`, tag object `b1e8fc4b`). Release materials merged as `d36c63e9` (PR #421); the
reduced-motion fix merged as `ed636967` (PR #422), and that commit is the release target:

- Tag `pantheon-base-v0.17.5`, annotated tag object `42495b25`, target commit `ed636967`.
- Four assets published: `foundation-release-pantheon-base-v0.17.5.tgz`
  (`33b6e78a…`), its `.sha256`, `repo.tar` (`788bd97f…`), its `.sha256`.
- `Release Gate` run `40046885713` success on `ed636967`; SonarCloud analysed `main@ed636967`
  with 0 unresolved issues and a green quality gate.
- Release secret scan clean across 3126 files; `check-release-assets` reports local and remote
  assets consistent.
- `Foundation Release Verify` run `40048834275` on the tag: success.
