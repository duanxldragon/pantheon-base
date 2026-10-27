# Summary — 2026-10-27 v0.17.6 release closeout

## Why this release exists

v0.17.5 was cut from `ed636967` on 2026-10-24. Since then five merges landed on `main` and none of
them is consumable: the tenant-operations work (plans, reads, console, accessibility, governance
closure), the compat tenant-scope fixes, the v0.17.5 publication facts and two dependency bumps only
reach `pantheon-ops` through a foundation release. This packet cuts `pantheon-base-v0.17.6` so the
next consumable asset carries them.

The range is `ed636967..7dafa997`: `601ae446` (#423), `be75b54d` (#424), `c1b1d702` (#427),
`9371594e` (#426), `7dafa997` (#425) — 303 files, +13767 / −635.

## What ships

Unlike the previous five patches, **this release changes the database and the shared surface**.

- **Schema 29 → 30.** `000030_tenant_plan_definitions` creates `tenant_plans` (platform-global, no
  `tenant_id`) and seeds `free` / `basic` / `professional` / `enterprise` with the thresholds the old
  `GetDefaultQuota` switch returned. The seed is guarded per code and never an `UPDATE`, so the
  upgrade is a no-op for existing tenants and a replay cannot undo an operator's edit. `-1` is
  unlimited, `0` is rejected by the service, and codes match `^[a-z][a-z0-9_-]{1,31}$`.
- **Five new routes and five new permission codes.** `system:tenant:overview`,
  `:member-list`, `:plan:list`, `:plan:create`, `:plan:update` bind to
  `GET /api/v1/system/tenant-ops/overview`, `GET .../member`, `GET .../plan/list`, `POST .../plan`
  and `PUT .../plan/:code` (`permission_workbench.go:637-641`).
- **A new menu group.** `tenant-ops` (`/system/tenant-ops`, type `M`, sort 25) parents the overview
  page, the existing tenant list and `tenant-member` (`/system/tenant-ops/member`). 租户管理 moved
  under it; grants are unaffected but any hand-written menu-tree assumption changes.
- **Compat tenant scope pinned** (PR #424): the resolved `tenant_id = 0` context was discarded by six
  services, so single-tenant screens read every tenant's rows.
- **Five runtime defects fixed** (PR #427): role saves did not reach the Casbin enforcement view,
  same-tenant switching returned 500, security-event confirmation used the wrong code, a password
  reset left the lock counters intact, and the permission workbench plus department paths leaked scope.
- **Accessibility** (PR #427): `PasswordInput` gives the visibility toggle an `aria-label` on all ten
  password surfaces, `check:password-toggle` runs in `prebuild`, and `<html lang>` follows the locale.
- **Boundary ratchet executed**: `MenuNode` promoted to `frontend/src/api/menu.ts`,
  `config/boundary-baseline.json` has an empty `entries` array, and both `--strict` forms are clean.
- **Dependencies**: six frontend npm packages (#425) and three GitHub Action SHAs (#426).
- **Not included by decision**: quota enforcement, self-service password reset, and the FR-016 /
  FR-017 CI wiring.

## Verification (measured locally on 2026-10-27)

- Backend `go build ./...`, `go vet ./...`, `gofmt -l .`: clean.
- Full backend suite against real MySQL/Redis with
  `PANTHEON_TEST_DSN_REQUIRED` / `PANTHEON_TEST_REDIS_REQUIRED` set:
  **46 packages ok, 0 FAIL, 0 SKIP**, 6 packages with no test files.
- Generator-package prerequisite: without `PANTHEON_NODE_BIN` the same run reports 16
  `module.generate.server_export_failed` failures in `modules/lowcode/dynamicmodule`; with
  `PANTHEON_NODE_BIN` and `PANTHEON_WORKSPACE_ROOT` set that package passes in 15.256s. This is the
  F5 environment limitation already recorded in
  `.harness/evidence/2026-10-24-single-tenant-scope-closeout/summary.md`, not a defect.
- Targeted regressions on real MySQL: plan store 17 cases (ok 12.512s), tenant-ops overview/member/
  plan-list reads, dept compat scope and orphan-parent boundary, post import tenant stamping, the
  three role policy-sync cases (0.84s / 0.81s / 0.75s), tenant-switch error classification, security
  event acknowledgement (0.30s), reset-password lock counters (1.29s), the tenant-ops menu seed
  contract (0.82s) and schema alignment including migration 000030 (7.04s).
- `golangci-lint run --new-from-rev=main ./...` (CI form, run with a Windows PATH so the linter can
  find `go`): exit 0, no findings.
- Frontend: `tsc -b` exit 0; `eslint src tests --max-warnings 0` exit 0; all 14 `prebuild` contract
  checks pass (UI contract 0/277 files, password-toggle 0/257 files, menu contract 19 menus /
  23 routes / 102 permissions, smoke coverage 34 specs); `vite build` succeeds in 774ms.
- Governance: frontmatter 356 docs; task packet this packet `[PASS]`; structure (strict) 0 findings /
  2712 files; generated (strict) 0 findings / 11 artifacts; boundaries clean in both the bare
  `--strict` and the CI `--baseline` form; failure registry `[PASS]`; runtime evidence (strict)
  56 files, 0 errors, 0 warnings; inheritance contract `0 findings, 0 warnings` at the workspace root.
- Task-packet failures found and repaired during this round (not bypassed): the Harness Profile
  needed the literal `- Template:` / `- Overlay:` / `- Coverage Dimensions:` bullets, Primary Layer
  must be a bare enum token, Workspace Context needs its six labels, and Completion Checklist needs
  the five required items verbatim.
- CI-only signals, read back after the fact: the five required PR contexts, `Release Gate Summary`
  on the merge commit, the SonarCloud analysis of that commit, and `Foundation Release Verify` on
  the tag. All four came back green; the readings are in the Publication state section below.

## Release-gate history

- Push CI on `main@7dafa997` before this packet merged: `CI`, `Code Quality Gates`, `Security Gates`,
  `Core Smoke Tests` and `Lint Workflows` success. The release could not be cut until
  `Release Gate Summary` was green on the merge commit of this packet; it is green on `c9bc6c0f`.
- PR #428 head `a3a35a4d`: `Quality Gates` (run `40429884678`), `Security Gates` (`40429282769`),
  `Unit Tests`, `CI Summary` and `SonarCloud Code Analysis` all success, together with `CodeQL`,
  `CodeQL Security` and `Duplication Gate`. Two earlier `Quality Gates` runs on that head are stale
  red/cancelled results from the reruns that the docs-governance repair triggered, not the state at
  merge time.
- `c9bc6c0f` carries a green `Release Gate` run `40431521256` (`Release Gate Summary`, `SonarCloud
  Gate`, `CodeQL Alerts`, `Candidate Checks`, `Full Smoke`, `Actionlint`) and a green `Foundation
  Release Verify` run `40433836341` (`Verify Release Assets`, `Foundation Release Verify Summary`).
- `publish-foundation-release.mjs` hard preconditions, read from the script: clean worktree, a
  completed/success `Release Gate Summary` check-run on the target commit, a matching
  `releases/<tag>/manifest.json`, the four assets present with self-consistent SHA-256, the credential
  preflight, and no existing GitHub Release.
- Transport note: `gh` needs `HTTPS_PROXY=http://127.0.0.1:7897` on this host right now, because
  api.github.com resets while git transport works. The two channels fail independently.

## Gaps and limits

- **Local TSan** still cannot start (error 87); the race gate is CI Linux `go test -race ./...`.
- **FR-016 / FR-017 stay open** by maintainer decision, so the evidence/review/runtime/inheritance
  checkers run here are advisory rather than CI-enforced.
- **Dependabot-triggered runs** cannot read `RELEASE_GATE_TOKEN`, so `Automate Solo PR` fails on them;
  that context is not required for merge.
- **Quotas are display-only** by contract.

## Publication state

Published. `pantheon-base-v0.17.6` is an annotated tag whose tag object is
`2bc799663f83d00959d54c0c300d6393467f0d19` and which points at `c9bc6c0f5d351016afb4fffdedf12e72cc73e61d`,
the squash merge of PR #428 (`2026-10-27T01:15:41Z`). The GitHub Release is neither draft nor
prerelease, `published_at = 2026-10-27T01:39:12Z`, and carries all four assets:

| asset | sha256 |
|---|---|
| `foundation-release-pantheon-base-v0.17.6.tgz` | `dbf1edd8f4bd082baee817c8e7797d298cf70f20d41b38c60d7bd39a5f362e35` |
| `foundation-release-pantheon-base-v0.17.6.tgz.sha256` | 111 B pointer file |
| `repo.tar` | `7a44e9ce0ed642e6d2d1f1508ef488292c46148da4a9e42a3f04ad848fda645d` |
| `repo.tar.sha256` | 75 B pointer file |

Post-publication readings: `check-release-secrets` → `release secret scan: clean (3232 file(s)
scanned)`; `check-release-assets` → `[ok] local bundle pantheon-base-v0.17.6: foundation-release-…
.tgz, repo.tar` and `[ok] release pantheon-base-v0.17.6 carries all 4 required assets`;
`Foundation Release Verify` run `40433836341` → success; `Release Gate` run `40431521256` on
`c9bc6c0f` → success with `SonarCloud quality gate for c9bc6c0f…: OK`; SonarCloud main now reports
0 unresolved issues and a quality gate of OK with New Duplicated Lines 1.9% against a 3% ceiling;
CodeQL open alerts on the repository = 0. The release line stayed `release/0.17`, and the target was
the merge commit rather than `7dafa997` because `publish-foundation-release.mjs` requires a green
`Release Gate Summary` on the commit it tags.
