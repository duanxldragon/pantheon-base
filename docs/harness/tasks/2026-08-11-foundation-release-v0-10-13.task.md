---
title: Publish Pantheon Base foundation release v0.10.13
doc_type: Remediation
layer: ci-workflow
status: Active
updated_at: 2026-08-11
linked_contracts:
  - docs/designs/FOUNDATION_RELEASE_MODEL.md
---

# Task Packet: 2026-08-11-foundation-release-v0-10-13

## Goal

Publish `pantheon-base-v0.10.13` as an immutable certified foundation release that closes the shared frontend ownership gap discovered during the Ops SonarCloud classification.

## Primary Layer

platform

## Dependency Layers

- release tooling
- foundation release manifest
- shared frontend ownership declaration

## Harness Profile

- Template: api-service
- Overlay: pantheon-base
- Quality Profile: ci-workflow
- Portable Failure Class: ci-signal-noise
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

- Certify Base commit `ac62d71581865d4649691095ae46216f07726681` through its exact-commit GitHub Release Gate.
- Publish the manifest-bound archive, annotated tag, GitHub Release, and SHA-256 checksum.
- Preserve the explicit ownership of the generic frontend shell roots plus `frontend/src/api` and `frontend/src/hooks`.
- Deliver the verified release to Pantheon Ops through its consumer lock.

### Out

- Mutating existing foundation releases or tags.
- Product UI redesign, business-domain behavior, and database-schema changes.
- SonarCloud issue-level remediation before a fresh Ops hosted analysis completes.

## Expected Files

### Create

- `.harness/tasks/2026-08-11-foundation-release-v0-10-13/manifest.json`
- `.harness/evidence/2026-08-11-foundation-release-v0-10-13/`

### Modify

- release metadata for the v0.10.13 candidate commit
- foundation release manifest shared frontend ownership declaration
- Pantheon Ops foundation lock after independent asset verification

### Do Not Touch

- published `pantheon-base-v0.10.12` assets and tags
- product UI redesign, business-domain behavior, and database schema
- SonarCloud issue-level code before the fresh hosted analysis

## Implementation Notes

- The ownership gap is closed in the manifest declaration, not by copying consumer files into the release.
- Verify the archive and checksum before any consumer lock update.

## Verification Plan

- foundation release manifest test
- exact-commit `Release Gate Summary`
- archive and checksum verification
- Ops consumer lock update and hosted analysis

## Linkage

- Task ID: `2026-08-11-foundation-release-v0-10-13`
- Task Manifest: `.harness/tasks/2026-08-11-foundation-release-v0-10-13/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Plan References: `docs/harness/tasks/2026-08-11-foundation-release-v0-10-13.task.md`
- Evidence Directory: `.harness/evidence/2026-08-11-foundation-release-v0-10-13/`
- Review File: `.harness/evidence/2026-08-11-foundation-release-v0-10-13/review.md`

## Evidence Required

- exact-commit Release Gate result
- published tag, asset list, and archive checksum
- Ops consumer lock result
- review summary

## Human Gates

- Publishing an immutable release and updating the consumer lock are release gates.

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
