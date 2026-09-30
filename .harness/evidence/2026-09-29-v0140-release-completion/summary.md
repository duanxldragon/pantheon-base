# v0.14.0 Release Completion - Verification Summary

## Task ID

2026-09-29-v0140-release-completion

## Objective

Complete the interrupted v0.14.0 multi-tenant release: land the local-only commits through the governed PR gate, sync the stale SSRF integration manifest status, and publish the `pantheon-base-v0.14.0` tag and GitHub Release that the README already references.

## Background

- Local main carried 7 unpushed commits (tenant system remediation + release docs) plus an uncommitted `backend/go.mod` fix.
- The v0.14.0 tag existed only locally; the remote repository had never carried it, and the README's "已发布" release link was dangling.
- The base-side copy of `2026-09-29-ops-ssrf-protection-integration/manifest.json` was still `in-progress`, while the ops repository marked the same task `done` on 2026-09-29.

## Changes

1. **backend/go.mod**: added missing test dependencies (`stretchr/testify v1.11.1`, `gorm.io/driver/sqlite v1.6.0`) required by the tenant sqlite-backed tests.
2. **`.harness/tasks/2026-09-29-ops-ssrf-protection-integration/manifest.json`**: synced status from `in-progress` to `completed` to match the ops-side truth.
3. **Release identity**: unified on `pantheon-base-v0.14.0` (no separate v0.14.1), with release notes for the housekeeping changes folded into the v0.14.0 GitHub Release body.
4. **Governance artifacts**: this task packet, manifest, and evidence set.

## Verification Results

| Command | Result |
| --- | --- |
| `go mod tidy` | exit 0, go.sum unchanged |
| `go vet ./pkg/... ./modules/system/iam/...` | exit 0 |
| `go test -count=1 ./modules/system/iam/tenant/` | compiles, package ok |
| `check-pr-governance` | OK |
| `check-task-packet` | PASS (pre-existing warnings only) |
| `check-structure-contract --strict` | 0 findings across 2144 files |
| `frontmatter-check` | 311 docs checked |

## Release Publication Plan

1. Open a PR from `release/v0.14.0-completion` to `main` with a governance-compliant body.
2. Let hosted required checks (`Quality Gates`, `Security Gates`, `Unit Tests`, `CI Summary`) run.
3. Squash-merge via auto-merge once green.
4. Tag the merge commit `pantheon-base-v0.14.0` and publish the GitHub Release.

## Explicit Gaps

- Hosted required checks and SonarCloud results are pending until the PR opens; they are the enforced merge gate.
- `pantheon-ops` consumer lock / inheritance snapshot updates remain a separate ops-repository follow-up (already tracked there).

## 2026-09-30 Reassessment

### Maintainer Decisions

- Target release: `pantheon-base-v0.14.2` to preserve sequential versioning after the local v0.14.1 tag/notes.
- User identity remains global; tenant membership determines access to tenant-owned resources.
- Freeze resource ownership individually before runtime scoping changes.
- Complete tenant P1 and automated browser E2E before release.
- Do not delegate runtime implementation/review in this session.

### Current GitHub State

- PR #358 is open and blocked at `https://github.com/duanxldragon/pantheon-base/pull/358`.
- PR-event CI, Security Gates, Code Quality Gates, and Core Smoke checks passed at head `c1b6f771`.
- The push-event Code Quality Gates run failed at Docs Governance because the canonical `pantheon-harness/main` frontmatter checker differs from the local sibling checkout. The local strict sync check passes against that unpushed sibling checkout.
- The tenant smoke job did not start tests: GitHub could not resolve the invalid `actions/setup-node` pin in the pushed commit. The corrected pin is in local commit `81e1bb09`, which could not be pushed because Git HTTPS to github.com:443 timed out.
- No `pantheon-base-v0.14.0`, `v0.14.1`, or `v0.14.2` release/tag exists on GitHub.

### Verification Run In This Session

| Check | Result |
| --- | --- |
| `backend/pkg/tenant` tests | Pass |
| `backend/modules/system/iam/tenant` tests | Blocked: Windows Go is `CGO_ENABLED=0`; enabling cgo invokes Cygwin gcc, which cannot compile native Windows cgo |
| Tenant browser E2E / full smoke | Not run: Docker daemon is unavailable and no test DSN is configured; tenant fixtures provision/delete fixed records |
| `npm run check:task-packet` | Pass, 0 errors; 28 pre-existing missing-review warnings |
| `npm run test:security-workflow` | Pass |
| `npm run test:quality-workflow` | Pass |
| `npm run check:harness-sync -- --strict` | Pass against the local sibling checkout; not representative of remote canonical `main` |
| `zizmor .github/workflows/smoke-core.yml` | Exit 14 with 4 existing `cache-poisoning` findings; no `unpinned-uses` finding on the corrected pin |

### Remaining Release Blockers

- Tenant resource scope matrix is not frozen. `system_user` global identity with memberships is decided; role, menu, permission, department, post, settings, dictionary, audit, and upload ownership still need explicit classification.
- Backend tenant P1 model/service scoping and tenant-specific backend tests are not closed.
- Tenant browser E2E has not run successfully; the current hosted tenant job is advisory and previously failed before test execution.
- The local workflow/task-state commit has not been pushed, the PR has no required approval, and PR #358 is blocked.
- Local branches are not reduced to `main`; the release branch contains unmerged work. Eight unrelated user deletions remain unstaged and untouched.
- Release publication is not approved by gates and has not occurred.
