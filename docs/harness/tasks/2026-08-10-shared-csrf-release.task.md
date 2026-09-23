---
title: Distribute shared CSRF request client in foundation release
doc_type: Remediation
layer: system/auth
status: Active
updated_at: 2026-08-10
linked_contracts:
  - docs/designs/FOUNDATION_RELEASE_MODEL.md
  - docs/designs/WORKFLOW.md
---

# Task Packet: 2026-08-10-shared-csrf-release

## Goal

Ensure the HttpOnly CSRF cookie/header contract is shipped to foundation-release consumers.

## Primary Layer

system/auth

## Dependency Layers

- shared frontend request client
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
  - runtime-quality

## Contract Anchors

- `AGENTS.md`
- `DESIGN.md`
- `docs/designs/FOUNDATION_RELEASE_MODEL.md`
- `docs/designs/WORKFLOW.md`

## Scope

### In

- Include the shared request client and error classifier in the foundation release manifest.
- Validate release manifest generation and downstream Ops consumption.

### Out

- Business-domain changes, cookie policy changes, and unrelated frontend files.

## Expected Files

### Create

- `.harness/tasks/2026-08-10-shared-csrf-release/manifest.json`
- `.harness/evidence/2026-08-10-shared-csrf-release/`

### Modify

- foundation release shared frontend manifest path set
- release manifest contract tests

### Do Not Touch

- cookie policy and CSRF token semantics
- business-domain modules
- unrelated frontend files outside the shared request client

## Implementation Notes

- Treat the shared request client and error classifier as base-owned release-manifest content so consumers cannot drift behind the CSRF contract.
- Add the paths to the existing manifest allowlist; introduce no new packaging abstraction.

## Verification Plan

- Foundation release manifest unit test.
- Ops foundation sync, frontend build/type-check, and hosted smoke.

## Linkage

- Task ID: `2026-08-10-shared-csrf-release`
- Task Manifest: `.harness/tasks/2026-08-10-shared-csrf-release/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Plan References: `docs/harness/tasks/2026-08-10-shared-csrf-release.task.md`
- Evidence Directory: `.harness/evidence/2026-08-10-shared-csrf-release/`
- Review File: `.harness/evidence/2026-08-10-shared-csrf-release/review.md`

## Evidence Required

- command result summary for the release manifest test
- downstream Ops foundation sync and smoke result
- review summary

## Human Gates

- Immutable foundation publication requires a passing exact-commit Release Gate.

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
