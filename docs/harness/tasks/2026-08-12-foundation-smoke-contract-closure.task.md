---
title: Close foundation smoke contract ownership
doc_type: Remediation
layer: inheritance-sync
status: Active
updated_at: 2026-08-12
linked_contracts:
  - docs/designs/FOUNDATION_RELEASE_MODEL.md
---

# Task Packet: 2026-08-12-foundation-smoke-contract-closure

## Goal

Ensure foundation consumers receive self-consistent smoke entrypoints, coverage documentation, and executable guards together with Base-owned smoke specifications.

## Primary Layer

inheritance-sync

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `completed`
- Release Requirement: `foundation-release`

## Dependency Layers

- frontend smoke entrypoints
- foundation release manifest

## Harness Profile

- Template: ui-heavy-product
- Overlay: pantheon-base
- Quality Profile: ci-workflow
- Portable Failure Class: architecture-drift
- Owner Layer: consumer-repository
- Coverage Dimensions:
  - behaviour
  - maintainability
  - architecture-fitness
  - runtime-quality

## Contract Anchors

- `AGENTS.md`
- `DESIGN.md`
- `docs/designs/FOUNDATION_RELEASE_MODEL.md`

## Scope

### In

- Own `frontend/package.json` and `frontend/tests/smoke/README.md` in the release manifest.
- Own `frontend/scripts/check-smoke-web-base.mjs` in the release manifest.
- Reject smoke commands that hard-code an API proxy target instead of following `PANTHEON_API_PROXY_TARGET`.
- Fail producer tests if either smoke contract is omitted.
- Preserve consumer business-specific smoke overlays through structured merging.

### Out

- Ops business behavior or schemas.
- Mutating an existing release.

## Expected Files

### Create

- `.harness/tasks/2026-08-12-foundation-smoke-contract-closure/manifest.json`
- `.harness/evidence/2026-08-12-foundation-smoke-contract-closure/`

### Modify

- foundation release manifest smoke command and guard ownership
- frontend smoke coverage matrix documentation
- producer regression test for smoke contract ownership

### Do Not Touch

- consumer business-specific smoke overlays
- existing releases and tags
- business behavior and database schema

## Implementation Notes

- Merge smoke contracts structurally so a consumer overlay keeps its own entries.
- The web-base guard must fail on a hard-coded proxy target rather than warn.

## Verification Plan

- `npm run check:smoke-web-base` on the Base package
- producer regression test for the smoke contract ownership set
- exact-commit Full Smoke and Release Gate before publication

## Linkage

- Task ID: `2026-08-12-foundation-smoke-contract-closure`
- Task Manifest: `.harness/tasks/2026-08-12-foundation-smoke-contract-closure/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Plan References: `docs/harness/tasks/2026-08-12-foundation-smoke-contract-closure.task.md`
- Evidence Directory: `.harness/evidence/2026-08-12-foundation-smoke-contract-closure/`
- Review File: `.harness/evidence/2026-08-12-foundation-smoke-contract-closure/review.md`

## Evidence Required

- smoke web-base guard result
- producer regression result
- exact-commit Full Smoke and Release Gate result
- review summary

## Human Gates

- Stop publication if exact-commit Full Smoke or Release Gate fails.
- Stop Ops merge if its CMDB/Deploy smoke entrypoints are lost.
- Stop publication if Base's own package fails the smoke web-base guard.

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
