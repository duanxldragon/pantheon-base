---
title: Make generated-module smoke portable across foundation consumers
doc_type: Remediation
layer: inheritance-sync
status: Active
updated_at: 2026-08-12
linked_contracts:
  - docs/designs/FOUNDATION_RELEASE_MODEL.md
---

# Task Packet: 2026-08-12-foundation-consumer-runtime-portability

## Goal

Make Base-owned generated-module runtime smoke use the consumer repository's Go module identity and restore the tracked feature-ledger baseline after smoke cleanup.

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

- generated-module runtime smoke
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

- Resolve generated registry import assertions from the active repository `go.mod` and backend layout.
- Restore tracked `schema/generated/feature-ledger.json` from the consumer Git index.
- Add focused producer regression coverage and real Ops runtime evidence.
- Distribute every Base-owned script referenced by the shared frontend package contract.
- Publish a new immutable patch release after exact-commit gates pass.

### Out

- Ops business behavior or schema changes.
- Consumer-local smoke or cleanup overrides.
- Mutation of published `pantheon-base-v0.10.18` assets.

## Expected Files

### Create

- `.harness/tasks/2026-08-12-foundation-consumer-runtime-portability/manifest.json`
- `.harness/evidence/2026-08-12-foundation-consumer-runtime-portability/`

### Modify

- generated-module smoke Go module and backend-layout resolution
- feature-ledger cleanup baseline restoration
- foundation release manifest script ownership

### Do Not Touch

- consumer-local smoke or cleanup overrides
- database schema and business behavior
- published `pantheon-base-v0.10.18` assets

## Implementation Notes

- Read module identity from the consumer `go.mod` rather than assuming the producer module path.
- Restore the tracked feature ledger rather than regenerating it, so the cleanup leaves no tracked drift.
- Reference script ownership from the frontend package contract; add no duplicate tooling.

## Verification Plan

- focused producer regression test for module-layout portability
- real Ops runtime smoke against a running backend
- `npm run check:task-packet-template`
- exact-commit Release Gate and Full Smoke before publication

## Linkage

- Task ID: `2026-08-12-foundation-consumer-runtime-portability`
- Task Manifest: `.harness/tasks/2026-08-12-foundation-consumer-runtime-portability/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Plan References: `docs/harness/tasks/2026-08-12-foundation-consumer-runtime-portability.task.md`
- Evidence Directory: `.harness/evidence/2026-08-12-foundation-consumer-runtime-portability/`
- Review File: `.harness/evidence/2026-08-12-foundation-consumer-runtime-portability/review.md`

## Evidence Required

- producer regression result
- Ops runtime smoke result
- package-contract script ownership verification
- review summary

## Human Gates

- Stop publication if producer tests, independent review, or exact-commit gates fail.
- Stop Ops merge until the immutable patch is consumed and full business smoke passes.
- Stop if cleanup leaves any tracked consumer runtime artifact modified.
- Stop if the consumer package contract references a script absent from the release bundle.

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
