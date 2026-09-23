---
title: Preserve post-merge workflow triggers
doc_type: Remediation
layer: ci-workflow
status: Active
updated_at: 2026-08-12
linked_contracts:
  - docs/designs/WORKFLOW.md
---

# Task Packet: 2026-08-12-pr-auto-merge-push-trigger

## Goal

Ensure an automated merge creates the exact-commit push workflow signals required by foundation publication.

## Primary Layer

platform

## Dependency Layers

- repository PR automation workflows
- release publication triggers

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

## Contract Anchors

- `AGENTS.md`
- `DESIGN.md`
- `docs/designs/WORKFLOW.md`

## Scope

### In

- Prefer the existing `RELEASE_GATE_TOKEN` for `gh pr merge --auto`.
- Fail closed when `RELEASE_GATE_TOKEN` is unavailable; do not fall back to `github.token`.
- Add a manual CI trigger for exact-commit recovery.
- Add regression tests for both requirements.

### Out

- Branch-protection or required-check policy changes.
- Repository-token fallback for automated merges.
- Product, backend, frontend, or release validation changes.
- Bypassing the publisher's exact-commit Release Gate requirement.

## Expected Files

### Create

- `.harness/tasks/2026-08-12-pr-auto-merge-push-trigger/manifest.json`
- `.harness/evidence/2026-08-12-pr-auto-merge-push-trigger/`

### Modify

- PR automation workflow auto-merge step token selection
- workflow regression tests for the fail-closed behavior and manual recovery trigger

### Do Not Touch

- branch-protection and required-check policy
- product, backend, and frontend code
- release validation and publication gates

## Implementation Notes

- Fail closed: an unavailable token must stop the workflow rather than silently degrading to the repository token.
- Keep the manual CI trigger additive so exact-commit recovery does not depend on a new merge.

## Verification Plan

- `npm run test:pr-automation-workflow`
- `npm run check:docs-frontmatter`
- `npm run check:task-packet-template`
- Hosted PR checks and post-merge push workflows.

## Linkage

- Task ID: `2026-08-12-pr-auto-merge-push-trigger`
- Task Manifest: `.harness/tasks/2026-08-12-pr-auto-merge-push-trigger/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Plan References: `docs/harness/tasks/2026-08-12-pr-auto-merge-push-trigger.task.md`
- Evidence Directory: `.harness/evidence/2026-08-12-pr-auto-merge-push-trigger/`
- Review File: `.harness/evidence/2026-08-12-pr-auto-merge-push-trigger/review.md`

## Evidence Required

- workflow regression test result
- hosted post-merge push workflow result
- review summary

## Human Gates

- No Ops source sync; this repairs Base release automation before publishing a new foundation artifact.

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
