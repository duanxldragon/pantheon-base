# Foundation Release v0.12.1 — Evidence

**Task**: 2026-08-31-base-operational-workbench-design
**Date**: 2026-09-16
**Scope**: Close the task's two external dependencies — immutable foundation release publish + Ops consumer lock (maintainer approved Path A).

## Prerequisite unblock: SonarCloud S3649 terminal fix (PR #310)

The Release Gate Summary was red on every v0.12-line commit because SonarCloud's
main-branch analysis kept 1 unresolved `gosecurity:S3649` (taint) issue at
`backend/modules/system/i18n/i18n_service.go:200` — #306's struct-form `Updates()`
did not clear it (taint still flows into the GORM builder).

- Fix: constant-SQL parameterized `Exec` (rule-recommended terminal form); `req.Value`/`req.Remark` only as bound parameters
- PR #310 merged (squash) after PR Governance + Docs Governance + full CI green; SonarCloud PR analysis: pass
- Post-merge main analysis: unresolved issues **0**; **Release Gate Summary: success** on `884465c0`
- Local verification: build/vet/gofmt clean; DB-backed i18n package tests green (96s, real MySQL)

## Release publish

| Item | Value |
|------|-------|
| Tag | `pantheon-base-v0.12.1` (annotated) → `884465c07815f7fc03ae6b7814c9d254eac0e3d3` |
| GitHub release | published 2026-09-16T04:26:44Z, non-draft |
| Assets | `foundation-release-pantheon-base-v0.12.1.tgz` (17,250,801 B) + `.sha256`; `repo.tar` (27,852,800 B) + `.sha256` |
| Manifest | schema v1, releaseLine `release/0.12`, baseCommit = tag target (verified by publish script pre-checks) |
| Verification summary | required checks: CI Summary, Quality Gates, Security Gates, Actionlint, Full Smoke, SonarCloud Code Analysis — all success on candidate |

Publish ran `scripts/foundation-release/publish-foundation-release.mjs` (dry-run first,
then live). The script enforced: clean worktree, `Release Gate Summary=success` on the
target commit, manifest `baseCommit` match, asset checksum validity, GH-release
immutability guard.

## Ops consumer side (pantheon-ops)

- Downloaded both release assets via `gh release download`; `sha256sum -c` **OK** for tgz and repo.tar
- Materialized `.foundation/releases/pantheon-base-v0.12.1/` (layout matches v0.11.0 precedent: `bundle/{docs,shared-backend,shared-frontend,manifest.paths.json}` + metadata + `go.mod`)
- Created `.foundation/foundation-release.lock.json` (lockedRelease `pantheon-base-v0.12.1`, supersedes `pantheon-base-v0.11.0`, gate/sonar verification recorded)
- **Explicit gaps (recorded in lock `pendingWork`)**: `baseline-swap` and post-swap verification are deferred — the ops source tree carries unrelated uncommitted changes (casbin/csrf middleware, go.mod/go.sum, main.go) from a parallel session; swapping baselines over a dirty tree would risk mixing lineages
- Note: `.foundation/` is gitignored in ops (local consumer state); `check:base-sync` / `upgrade:foundation:*` scripts referenced in docs do not exist in the ops repo (recorded as tooling gap, not silently assumed)

## Non-goals honored

- No code-version bumps (VERSION file is unrelated to the release tag per v0.12.0 precedent b2e90791)
- No push of release docs commits (docs travel in the GH release body + this evidence file; avoids triggering a fresh 40-minute gate cycle for non-code content)
- The stale local `v0.12.0` tag (5d7c7098, never published, never gate-verified) is explicitly marked superseded in the release notes and lock; not deleted (irreversible action not required)

## Result

The workbench task's last two external dependencies are resolved: **immutable release published** and **consumer lock established** (with honest, recorded gaps for the source-tree swap). Task close-out status: **closed-loop**.
