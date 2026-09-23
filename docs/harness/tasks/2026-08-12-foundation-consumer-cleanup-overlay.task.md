---
title: Preserve consumer business overlays during generated cleanup
doc_type: Remediation
layer: inheritance-sync
status: Active
updated_at: 2026-08-12
linked_contracts:
  - docs/designs/FOUNDATION_RELEASE_MODEL.md
---

# Task Packet: 2026-08-12-foundation-consumer-cleanup-overlay

## Goal

Ensure Base-owned generated-module cleanup removes only untracked QA artifacts and never deletes a foundation consumer's tracked `business/*` overlays, registries, i18n resources, or schemas.

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

- generated cleanup tooling
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

- Classify generated artifacts against the consumer repository Git index.
- Preserve tracked business source and restore tracked registries/i18n to their index baseline.
- Remove untracked generated modules, including generated modules nested under a tracked business domain.
- Add producer and real Ops-consumer regression evidence.

### Out

- Ops business behavior or schema changes.
- Consumer-local overrides of Base cleanup behavior.
- Mutation of the published `pantheon-base-v0.10.17` release.

## Expected Files

### Create

- `.harness/tasks/2026-08-12-foundation-consumer-cleanup-overlay/manifest.json`
- `.harness/evidence/2026-08-12-foundation-consumer-cleanup-overlay/`

### Modify

- generated cleanup ownership classification against the consumer Git index
- producer regression gate for consumer overlay preservation
- foundation release manifest

### Do Not Touch

- tracked consumer `business/*` overlays, registries, i18n resources, and schemas
- published `pantheon-base-v0.10.17` assets
- database schema

## Implementation Notes

- Decide ownership from the consumer Git index, never from a path prefix alone.
- Restore tracked registry/i18n files to their index baseline instead of deleting them.
- Keep cleanup idempotent so a repeated run cannot widen the deletion set.

## Verification Plan

- focused producer regression test for overlay preservation
- real Ops-consumer cleanup run against a tracked business overlay
- exact-commit Release Gate and Full Smoke before publication

## Linkage

- Task ID: `2026-08-12-foundation-consumer-cleanup-overlay`
- Task Manifest: `.harness/tasks/2026-08-12-foundation-consumer-cleanup-overlay/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Plan References: `docs/harness/tasks/2026-08-12-foundation-consumer-cleanup-overlay.task.md`
- Evidence Directory: `.harness/evidence/2026-08-12-foundation-consumer-cleanup-overlay/`
- Review File: `.harness/evidence/2026-08-12-foundation-consumer-cleanup-overlay/review.md`

## Evidence Required

- producer regression result
- Ops-consumer cleanup result showing tracked overlays preserved
- exact-commit Release Gate and smoke result
- review summary

## Human Gates

- Stop publication if cleanup changes any tracked consumer business overlay.
- Stop Ops merge until a new immutable release carries the fix and business smoke passes.
- Stop publication if exact-commit Full Smoke or Release Gate fails.

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
