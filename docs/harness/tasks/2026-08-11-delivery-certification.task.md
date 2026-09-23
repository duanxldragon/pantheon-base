---
title: Certify Pantheon Base delivery for Ops development
doc_type: Remediation
layer: ci-workflow
status: Active
updated_at: 2026-08-11
linked_contracts:
  - docs/designs/FOUNDATION_RELEASE_MODEL.md
  - docs/designs/QUALITY_AND_SECURITY_STRATEGY.md
---

# Task Packet: 2026-08-11-delivery-certification

## Goal

Close the foundation release certification gaps, synchronize deployment documentation with runtime behavior, and produce an immutable Base release that Pantheon Ops can consume.

## Primary Layer

platform

## Dependency Layers

- release tooling
- CI workflows
- runtime build metadata

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
- `docs/designs/QUALITY_AND_SECURITY_STRATEGY.md`

## Scope

### In

- Bind Release Gate and SonarCloud evidence to the immutable candidate commit.
- Require successful release certification before publishing.
- Prevent release asset overwrite and reject dirty bundle sources.
- Run Actionlint and Full Smoke for every `main` candidate.
- Align Node, Docker, runtime version, environment, README, and deployment documentation.
- Verify with Windows/MSYS Go race tests and repository quality gates.

### Out

- Product UI changes.
- Business-domain behavior.
- Database schema changes.

## Expected Files

### Create

- `.harness/tasks/2026-08-11-delivery-certification/manifest.json`
- `.harness/evidence/2026-08-11-delivery-certification/`

### Modify

- release publication workflow and candidate binding
- release bundle provenance checks
- Node and Docker build baseline metadata
- README and deployment documentation

### Do Not Touch

- product UI
- business-domain behavior
- database schema, permissions, menus, or i18n contracts

## Implementation Notes

- Keep certification fail-closed: no publication without an exact-commit Release Gate bound to the same SHA.
- Reuse the existing release tooling; add no parallel release path.

## Verification Plan

- `npm run check:docs-frontmatter`
- Actionlint over repository workflows
- Windows/MSYS `go test -race` for the runtime-sensitive packages
- Hosted `Release Gate Summary` on the candidate commit

## Linkage

- Task ID: `2026-08-11-delivery-certification`
- Task Manifest: `.harness/tasks/2026-08-11-delivery-certification/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Plan References: `docs/harness/tasks/2026-08-11-delivery-certification.task.md`
- Evidence Directory: `.harness/evidence/2026-08-11-delivery-certification/`
- Review File: `.harness/evidence/2026-08-11-delivery-certification/review.md`

## Evidence Required

- exact-commit Release Gate and SonarCloud evidence
- race verification result
- documentation alignment diff
- review summary

## Human Gates

- Publishing an immutable certified release is a release gate.

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
