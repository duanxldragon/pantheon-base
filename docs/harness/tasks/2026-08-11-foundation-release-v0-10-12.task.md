---
title: Publish Pantheon Base foundation release v0.10.12
doc_type: Remediation
layer: ci-workflow
status: Active
updated_at: 2026-08-11
linked_contracts:
  - docs/designs/FOUNDATION_RELEASE_MODEL.md
---

# Task Packet: 2026-08-11-foundation-release-v0-10-12

## Goal

Record, certify, and publish `pantheon-base-v0.10.12` as a new immutable foundation release without modifying `pantheon-base-v0.10.11`.

## Primary Layer

platform

## Dependency Layers

- release tooling
- foundation release manifest

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

- Generate release metadata for Base commit `16918771e2650f8c045b0e086144eb290e774704`.
- Build the foundation archive from the manifest-declared shared paths.
- Require the exact-commit Release Gate before publishing.
- Publish an annotated tag, immutable GitHub Release, archive, and SHA-256 file.
- Upgrade the Ops lock only after the published asset is independently verified.

### Out

- Changes to the existing `pantheon-base-v0.10.11` release.
- Product UI, business-domain behavior, or database schema changes.

## Expected Files

### Create

- `.harness/tasks/2026-08-11-foundation-release-v0-10-12/manifest.json`
- `.harness/evidence/2026-08-11-foundation-release-v0-10-12/`

### Modify

- release metadata for the v0.10.12 candidate commit
- Pantheon Ops foundation lock after independent asset verification

### Do Not Touch

- the published `pantheon-base-v0.10.11` tag, assets, and checksum
- product UI, business-domain behavior, and database schema

## Implementation Notes

- Cut exactly one release from the frozen candidate commit; never mutate a published asset.
- Record the archive path set and checksum alongside the release metadata so consumers can lock identity.

## Verification Plan

- foundation release manifest test
- exact-commit `Release Gate Summary`
- archive checksum verification
- Ops foundation sync against the published asset

## Linkage

- Task ID: `2026-08-11-foundation-release-v0-10-12`
- Task Manifest: `.harness/tasks/2026-08-11-foundation-release-v0-10-12/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Plan References: `docs/harness/tasks/2026-08-11-foundation-release-v0-10-12.task.md`
- Evidence Directory: `.harness/evidence/2026-08-11-foundation-release-v0-10-12/`
- Review File: `.harness/evidence/2026-08-11-foundation-release-v0-10-12/review.md`

## Evidence Required

- exact-commit Release Gate result
- published tag, asset list, and archive checksum
- Ops lock update result
- review summary

## Human Gates

- Publishing an immutable release and updating the consumer lock are release gates.

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
