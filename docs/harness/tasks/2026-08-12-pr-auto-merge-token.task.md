---
title: Repair PR auto-merge authentication
doc_type: Remediation
layer: ci-workflow
status: Active
updated_at: 2026-08-12
linked_contracts:
  - docs/designs/WORKFLOW.md
---

# Task Packet: 2026-08-12-pr-auto-merge-token

## Goal

Restore reliable squash auto-merge after required PR checks pass.

## Primary Layer

platform

## Dependency Layers

- repository PR automation workflows

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

- Authenticate the `gh pr merge --auto` workflow step with `github.token`.
- Fail the workflow when enabling auto-merge fails.
- Add a regression test for both requirements.

### Out

- Branch-protection policy changes.
- Product, backend, frontend, or release content changes.

## Expected Files

### Create

- `.harness/tasks/2026-08-12-pr-auto-merge-token/manifest.json`
- `.harness/evidence/2026-08-12-pr-auto-merge-token/`

### Modify

- PR automation workflow auto-merge step authentication
- workflow regression test for the fail-closed auto-merge behavior

### Do Not Touch

- branch-protection policy
- product, backend, and frontend code
- foundation release contents

## Implementation Notes

- Pass the token explicitly to `gh` rather than relying on an ambient credential.
- A failed auto-merge enablement must fail the workflow so it cannot look green while unarmed.

## Verification Plan

- `npm run test:pr-automation-workflow`
- `npm run check:docs-frontmatter`
- Hosted workflow security and Actionlint checks.

## Linkage

- Task ID: `2026-08-12-pr-auto-merge-token`
- Task Manifest: `.harness/tasks/2026-08-12-pr-auto-merge-token/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Plan References: `docs/harness/tasks/2026-08-12-pr-auto-merge-token.task.md`
- Evidence Directory: `.harness/evidence/2026-08-12-pr-auto-merge-token/`
- Review File: `.harness/evidence/2026-08-12-pr-auto-merge-token/review.md`

## Evidence Required

- workflow regression test result
- hosted workflow security and Actionlint result
- review summary

## Human Gates

- No Ops sync; this repairs Base repository PR automation only.

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
