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
