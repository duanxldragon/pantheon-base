---
title: Foundation Release v0.8.3 Publish Task Packet
doc_type: Acceptance
layer: platform
depends_on_layers:
  - system/auth
  - system/iam
  - system/org
  - system/config
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/designs/FOUNDATION_RELEASE_MODEL.md
updated_at: 2026-06-18
---

# Task Packet: 2026-06-18-foundation-release-v0.8.3-publish

## Goal

Publish the `base-v0.8.3` foundation release from `pantheon-base`, add GitHub release automation for the release asset, and normalize the GitHub release title to the `pantheon-base-v*` naming contract.

## Primary Layer

platform

## Dependency Layers

- `system/auth`
- `system/iam`
- `system/org`
- `system/config`

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `ci-workflow`
- Portable Failure Class: `release-traceability-gap`
- Owner Layer: `consumer-repository`
- Coverage Dimensions:
  - `behaviour`
  - `maintainability`
  - `architecture-fitness`
  - `method-health`

## Contract Anchors

- `pantheon-base/AGENTS.md`
- `pantheon-base/DESIGN.md`
- `pantheon-base/docs/README.md`
- `pantheon-base/docs/designs/FOUNDATION_RELEASE_MODEL.md`
- `pantheon-base/docs/designs/WORKFLOW.md`
- `pantheon-base/docs/archive/upgrade/FOUNDATION_RELEASE_RUNBOOK_20260604.md`
- `pantheon-base/docs/superpowers/specs/2026-06-04-foundation-release-bundles-and-upgrade-design.md`

## Scope

### In

- publish the `base-v0.8.3` release metadata and release artifact set under `releases/base-v0.8.3/`
- add a GitHub release publisher script that can create or update the release for a prepared foundation release
- update the publisher so GitHub release titles follow `pantheon-base-v*` while tags remain `base-v*`
- verify the published GitHub release matches the intended tag, commit, notes, and title

### Out

- new foundation runtime changes outside the already-cut `base-v0.8.3` artifact set
- `pantheon-ops` consumer sync logic or business overlay fixes
- branch hygiene, PR automation, or unrelated repository-governance workflows

## Structural Scope

- Affected Subgraph: `release metadata -> foundation publish script -> git tag -> GitHub release record`
- Boundary Crossings: `platform release tooling -> GitHub release API`
- Risk Nodes: `release version to title mapping`, `existing tag/update path`, `published release traceability`
- Graph Focus: `sensitive-input-flow`

## Expected Files

### Create

- `releases/base-v0.8.3/manifest.json`
- `releases/base-v0.8.3/release-notes.md`
- `releases/base-v0.8.3/upgrade-notes.md`
- `releases/base-v0.8.3/consumer-impact.md`
- `releases/base-v0.8.3/verification-summary.json`
- `scripts/foundation-release/publish-foundation-release.mjs`
- `tests/scripts/foundation-release/publish-foundation-release.test.mjs`
- `docs/harness/tasks/2026-06-18-foundation-release-v0.8.3-publish.task.md`
- `.harness/evidence/2026-06-18-foundation-release-v0.8.3-publish/summary.md`
- `.harness/evidence/2026-06-18-foundation-release-v0.8.3-publish/commands.json`
- `.harness/evidence/2026-06-18-foundation-release-v0.8.3-publish/review.md`
- `.harness/evidence/2026-06-18-foundation-release-v0.8.3-publish/pr-body.md`

### Modify

- `README.md`
- `README.en.md`
- `package.json`
- `scripts/foundation-release/build-release-manifest.mjs`
- `scripts/foundation-release/release-cli.mjs`

### Do Not Touch

- `../pantheon-ops/**`
- unrelated backend or frontend runtime modules

## Implementation Notes

- The tag contract stays `base-v*` so downstream inheritance keeps using the established release anchor.
- The GitHub release display title moves to `pantheon-base-v*` so the public release page reflects the repository identity without changing the tag contract.
- The publisher must be idempotent for an existing tag and existing release so a title correction can be applied without mutating the tagged commit.

## Method Readiness

- Consumer-Specific Controls: `foundation release metadata`, `publish script tests`, `GitHub release API verification`
- Required Sensors: `command`, `review`
- Required Evidence: `test output`, `dry-run output`, `GitHub API payload`
- Ratchet Decision: `adapter-updated`
- Deferred Code Issues: `none`

## Delivery Governance

- Design Gate: `foundation release design and runbook references`
- Development Gate: `expected files declared`
- QA Acceptance Gate: `command`
- GitHub Governance Gate: `repo-quality-gate`

## Execution Roles

- Implementer Posture: `implementer`
- Reviewer Posture: `architecture | mechanical`

## Stop Points

- stop before changing the established `base-v*` tag naming contract for consumer inheritance
- stop before widening this patch into a new consumer upgrade or runtime regression round

## State Plan

- Checkpoint Expectation: `.harness/evidence/2026-06-18-foundation-release-v0.8.3-publish/summary.md`
- Resume Artifacts: `releases/base-v0.8.3/manifest.json`, `releases/base-v0.8.3/verification-summary.json`

## Verification Plan

### Backend

- none

### Frontend

- none

### Browser / Smoke

- none

### Runtime Evidence

- explicit no-app-runtime-change statement; release tooling tests plus GitHub release API verification are sufficient

## Linkage

- Task ID: `2026-06-18-foundation-release-v0.8.3-publish`
- Task Manifest: `.harness/tasks/2026-06-18-foundation-release-v0.8.3-publish/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Evidence Directory: `.harness/evidence/2026-06-18-foundation-release-v0.8.3-publish/`
- Review File: `.harness/evidence/2026-06-18-foundation-release-v0.8.3-publish/review.md`

## Evidence Required

- foundation release publish test output
- dry-run output showing `releaseTitle`
- GitHub release API payload showing the live release title and target commit

## Human Gates

- none

## Sync expectation

- modify only `pantheon-base` in this packet
- `pantheon-ops` consumes `base-v0.8.3` through its separate inheritance sync flow

## Completion Checklist

- [ ] Layer and boundary declared
- [ ] Quality profile declared
- [ ] Ratchet decision declared
- [ ] Delivery governance gates declared
- [ ] Contract anchors read
- [ ] Verification run or exception recorded
- [ ] Evidence saved or summarized
- [ ] Review completed
