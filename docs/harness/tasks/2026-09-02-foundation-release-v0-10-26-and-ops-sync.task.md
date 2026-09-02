# Task Packet: 2026-09-02-foundation-release-v0-10-26-and-ops-sync

## Goal

Merge the remaining Pantheon Base PRs and branches into `main`, publish `pantheon-base-v0.10.26`, and update Pantheon Ops through the foundation-release consumer pipeline.

## Primary Layer

inheritance-sync

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `required`
- Release Requirement: `foundation-release` and `consumer-lock-update`

## Harness Profile

- Quality Profile: `ci-workflow`
- Portable Failure Class: `method-health-gap`
- Owner Layer: `consumer-repository`
- Minimal Complexity Rung: `reuse`
- Ratchet Decision: `no-repeat-observed`

## Contract Anchors

- `AGENTS.md`
- `DESIGN.md`
- `docs/designs/FOUNDATION_RELEASE_MODEL.md`
- `docs/WORKSPACE_INHERITANCE.md`
- `pantheon-ops/docs/PROJECT_INHERITANCE.md`

## Scope

### In

- Close actionable feedback on PR `#279`, merge it, and delete its remote source branch.
- Merge the existing `chore/sonar-duplication-reduction` branch after independent review and required checks.
- Correct `CLAUDE.md` so it defers execution-role boundaries to `AGENTS.md`.
- Keep only `main` locally and on GitHub after verified merges.
- Cut immutable `pantheon-base-v0.10.26` from the checked `main` commit and publish its required assets.
- Rebuild and validate a clean Pantheon Ops consumer worktree from the release, then update its foundation lock through the existing pipeline.

### Out

- Changes to Base API, schema, permissions, menus, i18n semantics, or business behavior.
- Hand-copying Base files into Pantheon Ops.
- Overwriting the dirty primary `pantheon-ops` worktree or its unpushed commits.
- Mutating any existing tag or GitHub Release.

## Structural Scope

- Affected Subgraph: `Base main -> foundation manifest/bundle -> Ops consumer lock -> business overlay validation`
- Boundary Crossings: `base -> ops`
- Risk Nodes: `GitHub branch protection`, `immutable release tag`, `foundation-release.lock.json`, `business-overlay.json`
- Graph Focus: `none`; release and inheritance scripts provide the contract boundary

## Expected Files

### Create

- `docs/harness/tasks/2026-09-02-foundation-release-v0-10-26-and-ops-sync.task.md`
- `.harness/tasks/2026-09-02-foundation-release-v0-10-26-and-ops-sync/manifest.json`
- `.harness/evidence/2026-09-02-foundation-release-v0-10-26-and-ops-sync/`

### Modify

- `CLAUDE.md`

### Do Not Touch

- `backend/`
- `frontend/src/`
- Primary `pantheon-ops` worktree

## Delivery Governance

- Design Gate: `docs/designs/FOUNDATION_RELEASE_MODEL.md`
- Development Gate: expected files and boundaries declared above
- QA Acceptance Gate: GitHub required checks, release gate, consumer rebuild and overlay validation
- GitHub Governance Gate: `repo-quality-gate`

## Execution Roles

- Implementer Posture: `reviewer-assisted`
- Reviewer Posture: `architecture` and `mechanical`

## Stop Points

- Stop before an immutable tag/release if the matching `Release Gate Summary` is absent or failed.
- Stop before modifying the dirty primary Ops worktree; use an isolated consumer worktree instead.

## Verification Plan

- `npm run check:docs-frontmatter`
- `npm run check:task-packet-template`
- `npm run check:github-feedback -- --repo duanxldragon/pantheon-base --pr <number>`
- GitHub required checks and `Release Gate Summary` on the final Base commit
- `npm run release:foundation:cut -- --release-version pantheon-base-v0.10.26 --release-line release/0.10 --base-commit <final-main-sha>`
- `npm run upgrade:foundation:local-plan -- --release-version pantheon-base-v0.10.26`
- Pantheon Ops overlay, Go race, frontend, and business-smoke gates in an isolated worktree

## Linkage

- Task ID: `2026-09-02-foundation-release-v0-10-26-and-ops-sync`
- OpenSpec Change: `none`
- Evidence Directory: `.harness/evidence/2026-09-02-foundation-release-v0-10-26-and-ops-sync/`
- Review File: `.harness/evidence/2026-09-02-foundation-release-v0-10-26-and-ops-sync/review.md`

## Foundation Release Handoff

- Shared change owner: `pantheon-base`
- Foundation release required: `yes`
- Consumer sync status: `in-progress`
- Downstream validation command: `npm run check:base-sync`
- Release/lock stop point: `immutable release and consumer lock update`

## Completion Checklist

- [ ] PR feedback closed and merged
- [ ] All non-main branches deleted locally and remotely
- [ ] Required Base checks and release gate pass
- [ ] Immutable release published with verified assets
- [ ] Ops consumer lock updated through the upgrade pipeline
- [ ] Evidence and independent review recorded
