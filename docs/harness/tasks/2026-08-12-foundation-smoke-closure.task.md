---
title: Close foundation generated smoke ownership
doc_type: Remediation
layer: inheritance-sync
status: Active
updated_at: 2026-08-12
linked_contracts:
  - docs/designs/FOUNDATION_RELEASE_MODEL.md
---

# Task Packet: 2026-08-12-foundation-smoke-closure

## Goal

Make the foundation release own the complete generated-business runtime smoke closure so consumers cannot retain stale setup, configuration, helper, or specification copies.

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

- generated-business runtime smoke
- foundation release manifest

## Harness Profile

- Template: admin-platform
- Overlay: pantheon-base
- Quality Profile: generator
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

- Add generated-business smoke setup, cleanup, configuration, helper, and specification paths to the release manifest.
- Fail release construction when the generic runtime QA closure is left unowned.
- Publish the next immutable patch release and verify Pantheon Ops consumes it without shared smoke drift.

### Out

- Product UI or business behavior changes.
- Ops-specific CMDB or deploy smoke specifications.
- Mutating any existing release tag or artifact.

## Expected Files

### Create

- `.harness/tasks/2026-08-12-foundation-smoke-closure/manifest.json`
- `.harness/evidence/2026-08-12-foundation-smoke-closure/`

### Modify

- foundation release manifest runtime QA closure path set
- release construction ownership assertion
- producer ownership ratchet

### Do Not Touch

- Ops-specific CMDB and deploy smoke specifications
- product UI and business behavior
- existing release tags and artifacts

## Implementation Notes

- Increment the existing manifest allowlist; add no packaging abstraction.
- Make an unowned generic runtime QA path a release-construction failure, not a warning.

## Verification Plan

- foundation release manifest test asserting the QA closure is owned
- exact-commit Release Gate and Full Smoke before publication
- Ops consumption check for shared smoke drift

## Linkage

- Task ID: `2026-08-12-foundation-smoke-closure`
- Task Manifest: `.harness/tasks/2026-08-12-foundation-smoke-closure/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Plan References: `docs/harness/tasks/2026-08-12-foundation-smoke-closure.task.md`
- Evidence Directory: `.harness/evidence/2026-08-12-foundation-smoke-closure/`
- Review File: `.harness/evidence/2026-08-12-foundation-smoke-closure/review.md`

## Evidence Required

- release manifest test result
- exact-commit Release Gate and Full Smoke result
- Ops consumption drift check
- review summary

## Human Gates

- Stop publication if exact-commit Release Gate or Full Smoke fails.
- Stop Ops merge if shared generated smoke assets differ from the published release.
- Stop closeout if the Ops business smoke suite does not pass against a running backend.

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
