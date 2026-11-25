# Task Packet: Normalize Foundation release names

## Goal

Normalize GitHub release presentation and publisher rules while preserving immutable tags/assets and current18.8 Latest.

## Primary Layer

platform

## Dependency Layers

none

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `not-required`
- Release Requirement: `none`

## Harness Profile

- Template: admin-platform
- Overlay: pantheon-base
- Quality Profile: ci-workflow
- Owner Layer: foundation-source
- Portable Failure Class: static-sensor-gap
- Coverage Dimensions:
  - behaviour
  - maintainability
  - method-health

## Contract Anchors

- `docs/contracts/DOCUMENT_GOVERNANCE_CONTRACT.md`
- `docs/harness/VERIFICATION_EVIDENCE_SPEC.md`
- `docs/harness/REVIEW_LOOP_SPEC.md`
- `.harness/ARCHIVE.md`

## Scope

### In

- Canonical Foundation publisher titles and valid prerelease metadata
- Legacy naming policy in CN/EN model/index and version guide
- 53 existing GitHub release presentation names and3 legacy naming notes
- Re-read current18.8 Latest and all tag/asset/state identities

### Out

- Deleting or renumbering historical tags/releases/assets
- Rewriting immutable18.8 content
- Production mutation or new release publication

## Structural Scope

- Affected Subgraph: publisher title/create args -> gh release presentation
- Boundary Crossings: base -> ops metadata only
- Risk Nodes: remote release metadata
- Graph Focus: none

## Expected Files

### Create

- `docs/harness/tasks/2026-11-14-release-naming-normalization.task.md`
- `.harness/tasks/2026-11-14-release-naming-normalization/manifest.json`
- `.harness/evidence/2026-11-14-release-naming-normalization/summary.md`
- `.harness/evidence/2026-11-14-release-naming-normalization/commands.json`
- `.harness/evidence/2026-11-14-release-naming-normalization/review.md`

### Modify

- `scripts/foundation-release/publish-foundation-release.mjs`
- `tests/scripts/foundation-release/publish-foundation-release.test.mjs`
- `docs/VERSION_MANAGEMENT_GUIDE.md`
- `docs/designs/FOUNDATION_RELEASE_MODEL.md`
- `docs/designs/FOUNDATION_RELEASE_MODEL.en.md`
- `docs/release-notes/README.md`
- `docs/release-notes/README.en.md`

### Do Not Touch

- `backend/`
- `frontend/`
- `VERSION`
- `Published tags and assets`

## Implementation Notes

none

## Execution Roles

- Implementer Posture: executor owns producer files; root owns metadata and evidence
- Reviewer Posture: independent code-reviewer

## Verification Plan

- node --test --test-concurrency=1 tests/scripts/foundation-release/_.test.mjs scripts/foundation-release/_.test.mjs
- npm run check:docs-frontmatter
- npm run check:task-packet-template
- scoped task/evidence/review validation
- GitHub release/tag/asset/state final readbacks

## Linkage

- Task ID: `2026-11-14-release-naming-normalization`
- Task Manifest: `.harness/tasks/2026-11-14-release-naming-normalization/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: none
- Evidence Directory: `.harness/evidence/2026-11-14-release-naming-normalization/`
- Review File: `.harness/evidence/2026-11-14-release-naming-normalization/review.md`

## Evidence Required

none

## Human Gates

User explicitly authorized release naming normalization and18.8 upgrade. No new publication or tag deletion.

## Completion Checklist

- [x] Layer and boundary declared
- [x] Quality profile or explicit none declared
- [x] Ratchet decision declared
- [x] Delivery governance gates declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [ ] Review completed

## README and Task Ownership Followup — 2026-11-13

none

## Core Smoke test-only followup — 2026-11-13

none
