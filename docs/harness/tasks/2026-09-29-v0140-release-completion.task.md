# Task Packet: 2026-09-29-v0140-release-completion

## Goal

Complete the interrupted v0.14.0 multi-tenant release: land the local-only tenant commits plus the missing test-dependency fix through the governed PR gate, sync the stale SSRF integration manifest status, and publish the `pantheon-base-v0.14.0` tag and GitHub Release that the README already references.

## Primary Layer

platform

## Dependency Layers

- backend test dependencies (go.mod)
- harness governance metadata (.harness tasks/evidence)
- release identity (README, RELEASE_NOTES, tag)

## Harness Profile

- Template: api-service
- Overlay: pantheon-base
- Quality Profile: ci-workflow
- Portable Failure Class: method-health-gap
- Owner Layer: consumer-repository
- Coverage Dimensions:
  - behaviour
  - maintainability
  - method-health

## Contract Anchors

- `AGENTS.md`
- `README.md`
- `RELEASE_NOTES_v0.14.0.md`
- `.github/workflows/release-gate.yml`

## Scope

### In

- missing test dependency declarations in `backend/go.mod` (`stretchr/testify`, `gorm.io/driver/sqlite`)
- stale manifest status sync for `2026-09-29-ops-ssrf-protection-integration`
- v0.14.0 tag and GitHub Release publication

### Out

- product code behavior changes
- SSRF middleware implementation changes
- `pantheon-ops` repository changes
- new feature work beyond release completion

## Expected Files

### Create

- `.harness/tasks/2026-09-29-v0140-release-completion/manifest.json`
- `.harness/evidence/2026-09-29-v0140-release-completion/`

### Modify

- `backend/go.mod`
- `.harness/tasks/2026-09-29-ops-ssrf-protection-integration/manifest.json`
- `RELEASE_NOTES_v0.14.1.md` (superseded by unified v0.14.0 release)
- `.harness/STATUS.md`

### Do Not Touch

- `backend/pkg/**` and `backend/modules/**` runtime code
- frontend sources
- published tags other than `pantheon-base-v0.14.0`

## Implementation Notes

- The remote main branch requires PR-based merges with 4 required status checks; squash merge is the only allowed strategy.
- The remote repository has never carried the `pantheon-base-v0.14.0` tag, so release identity stays unified on v0.14.0 instead of publishing a patch v0.14.1.
- The base-side copy of the ops SSRF task manifest was left `in-progress`; the ops repository already marked the same task `done` on 2026-09-29.

## Verification Plan

- `cd backend && go mod tidy` (no unexpected go.sum churn)
- `cd backend && go vet ./pkg/... ./modules/system/iam/...`
- `cd backend && go test -count=1 ./modules/system/iam/tenant/`
- `node scripts/check-pr-governance.mjs`
- `node scripts/harness/check-task-packet.mjs --root .`
- `node scripts/harness/check-structure-contract.mjs --root . --strict`
- `node scripts/frontmatter-check.mjs`

## Linkage

- Task ID: `2026-09-29-v0140-release-completion`
- Task Manifest: `.harness/tasks/2026-09-29-v0140-release-completion/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Plan References: `docs/harness/tasks/2026-09-29-v0140-release-completion.task.md`
- Evidence Directory: `.harness/evidence/2026-09-29-v0140-release-completion/`
- Review File: `.harness/evidence/2026-09-29-v0140-release-completion/review.md`

## Evidence Required

- go dependency and test verification output
- governance and structure gate results
- review summary of the release-completion diff

## Human Gates

- GitHub required checks (`Quality Gates`, `Security Gates`, `Unit Tests`, `CI Summary`) and PR merge.
- Maintainer acceptance of the unified v0.14.0 release identity before tagging.

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
