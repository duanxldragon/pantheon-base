# Task Packet: 2026-09-29-v0140-release-completion

## Goal

Complete tenant production-readiness P1 work and automated tenant E2E, then publish the next sequential foundation release, `pantheon-base-v0.14.2`, after all required gates pass.

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

- Freeze per-resource tenant ownership in `docs/designs/TENANT_RESOURCE_SCOPE_MATRIX.md`, preserving global user identity with memberships.
- Complete P1 tenant model/service read and write scoping for resources classified as tenant-owned or tenant-overridable.
- Run tenant-specific backend tests and browser E2E, then the complete required smoke matrix.
- Correct the tenant smoke workflow's invalid `actions/setup-node` pin and close related hosted CI failures.
- Publish `pantheon-base-v0.14.2` only after the PR is merged and required checks, security review, and runtime evidence are green.

### Out

- OIDC tenant selection (P2; track separately unless it blocks the agreed E2E contract)
- tenant billing, quotas, or cross-tenant sharing
- `pantheon-ops` repository changes
- unrelated SSRF or product work

## Expected Files

### Create

- `.harness/tasks/2026-09-29-v0140-release-completion/manifest.json`
- `.harness/evidence/2026-09-29-v0140-release-completion/`

### Modify

- tenant resource scope matrix and approved tenant contract notes
- tenant model/service code, migration only if the approved matrix requires it, and tenant isolation tests
- tenant browser E2E fixtures/specs and `.github/workflows/smoke-core.yml`
- release notes/changelog for `v0.14.2` and task/evidence status

### Do Not Touch

- `backend/pkg/**` and `backend/modules/**` runtime code
- frontend sources
- published tags other than the approved `pantheon-base-v0.14.2`

## Implementation Notes

- The remote main branch requires PR-based merges with 4 required status checks; squash merge is the only allowed strategy.
- The maintainer selected `v0.14.2` to preserve sequential versioning after the local `v0.14.1` tag/notes; no tag or GitHub Release exists remotely for v0.14.0 or v0.14.1.
- User identity is global and tenant membership controls tenant access. Freeze remaining resource ownership in the scope matrix before changing runtime scoping.
- The base-side copy of the ops SSRF task manifest was left `in-progress`; the ops repository already marked the same task `done` on 2026-09-29.

## Verification Plan

- `cd backend && go mod tidy` (no unexpected go.sum churn)
- `cd backend && go vet ./pkg/... ./modules/system/iam/...`
- `cd backend && go test -race ./...`
- `cd frontend && npm run test:smoke:tenant`
- `cd frontend && npm run test:smoke:all`
- `cd frontend && npm run test:smoke:core`
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

- GitHub required checks (`Quality Gates`, `Security Gates`, `Unit Tests`, `CI Summary`), tenant E2E, and PR merge.
- Maintainer approval of the per-resource scope matrix and runtime security review before release.
- Maintainer approval of the v0.14.2 release notes and publication.

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
