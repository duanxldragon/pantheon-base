---
title: Patch frontend security dependencies for foundation release
doc_type: Remediation
layer: ci-workflow
status: Archived
updated_at: 2026-08-11
linked_contracts:
  - docs/designs/FOUNDATION_RELEASE_MODEL.md
---

# Task Packet: 2026-08-11-base-security-dependencies

## Goal

Remove high-severity npm audit findings from the shared frontend toolchain before cutting the next foundation release.

## Primary Layer

platform

## Dependency Layers

- shared frontend toolchain
- foundation release manifest

## Harness Profile

- Template: admin-platform
- Overlay: pantheon-base
- Quality Profile: auth-security
- Portable Failure Class: security-boundary-gap
- Owner Layer: consumer-repository
- Coverage Dimensions:
  - behaviour
  - maintainability
  - architecture-fitness

## Contract Anchors

- `AGENTS.md`
- `DESIGN.md`
- `docs/designs/FOUNDATION_RELEASE_MODEL.md`

## Scope

### In

- Upgrade `js-yaml` to `3.15.1`.
- Upgrade `nanoid` to `3.3.17`.
- Cut and verify `pantheon-base-v0.10.11` for Ops consumption.

### Out

- Business-domain changes and unrelated frontend dependency upgrades.

## Expected Files

### Create

- `.harness/tasks/2026-08-11-base-security-dependencies/manifest.json`
- `.harness/evidence/2026-08-11-base-security-dependencies/`

### Modify

- `frontend/package-lock.json` for the two advisory-bearing packages

### Do Not Touch

- business-domain modules
- unrelated frontend dependencies
- the published `pantheon-base-v0.10.10` release

## Implementation Notes

- Raise only the packages carrying high-severity advisories; do not sweep unrelated upgrades into a release patch.
- Verify the advisory is actually removed rather than silenced by a downgrade.

## Verification Plan

- `npm audit` on the shared frontend toolchain
- foundation release manifest test
- Ops foundation sync and hosted smoke

## Linkage

- Task ID: `2026-08-11-base-security-dependencies`
- Task Manifest: `.harness/tasks/2026-08-11-base-security-dependencies/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Plan References: `docs/harness/tasks/2026-08-11-base-security-dependencies.task.md`
- Evidence Directory: `.harness/evidence/2026-08-11-base-security-dependencies/`
- Review File: `.harness/evidence/2026-08-11-base-security-dependencies/review.md`

## Evidence Required

- `npm audit` result before and after
- release manifest and Ops consumption result
- review summary

## Human Gates

- Immutable foundation publication requires a passing exact-commit Release Gate.

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
