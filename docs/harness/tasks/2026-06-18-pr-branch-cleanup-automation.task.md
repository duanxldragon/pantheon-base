---
title: PR Branch Cleanup Automation Task Packet
doc_type: Acceptance
layer: platform
depends_on_layers: []
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-06-18
---

# Task Packet: 2026-06-18-pr-branch-cleanup-automation

## Goal

Make solo-maintainer PR flow clean up merged head branches deterministically, so GitHub branch hygiene no longer depends on repository auto-delete behavior alone.

## Primary Layer

platform

## Dependency Layers

- none

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `repo-governance`
- Portable Failure Class: `repo-quality-gate`
- Owner Layer: `repository-governance`
- Coverage Dimensions:
  - `behaviour`
  - `maintainability`
  - `architecture-fitness`

## Contract Anchors

- `AGENTS.md`
- `DESIGN.md`
- `docs/README.md`
- `docs/contracts/PLATFORM_CONTRACT.md`

## Scope

### In

- extend PR automation to listen for `pull_request.closed`
- add explicit merged-head-branch deletion for same-repo PRs after merge
- lock the cleanup behavior with workflow tests
- record branch-hygiene evidence for the solo-maintainer GitHub flow

### Out

- auth runtime behavior
- frontend runtime behavior
- backend runtime behavior
- non-governance repository debt

## Structural Scope

- Affected Subgraph: `pull_request.closed -> merged branch cleanup job -> remote branch deletion`
- Boundary Crossings: `none`
- Risk Nodes: `pr automation workflow`, `branch cleanup conditions`
- Graph Focus: `hub-check`

## Expected Files

### Create

- `docs/harness/tasks/2026-06-18-pr-branch-cleanup-automation.task.md`
- `.harness/evidence/2026-06-18-pr-branch-cleanup-automation/commands.json`
- `.harness/evidence/2026-06-18-pr-branch-cleanup-automation/summary.md`
- `.harness/evidence/2026-06-18-pr-branch-cleanup-automation/review.md`
- `.harness/evidence/2026-06-18-pr-branch-cleanup-automation/pr-body.md`

### Modify

- `.github/workflows/pr-automation.yml`
- `tests/scripts/pr-automation-workflow.test.mjs`

### Do Not Touch

- `backend/**`
- `frontend/**`
- `../pantheon-ops/**`

## Implementation Notes

- GitHub repository setting `deleteBranchOnMerge=true` stays enabled, but the workflow now owns an explicit delete step after successful merge because recent auto-merged PRs did not emit a head-branch deletion event.
- Cleanup only targets merged pull requests whose head branch belongs to the same repository and is different from the base branch.

## Method Readiness

- Consumer-Specific Controls: `workflow test`
- Required Sensors: `command`
- Required Evidence: `commands summary`, `review summary`
- Ratchet Decision: `gate-updated`
- Deferred Code Issues: `historical local branch cleanup remains manual when unpublished local commits exist`

## Delivery Governance

- Design Gate: `boundary note`
- Development Gate: `workflow test`
- QA Acceptance Gate: `scripted verification`
- GitHub Governance Gate: `repo-quality-gate`

## Execution Roles

- Implementer Posture: `implementer`
- Reviewer Posture: `mechanical | governance`

## Verification Plan

- `node --test tests/scripts/pr-automation-workflow.test.mjs`
- `node --test tests/scripts/run-github-feedback-loop.test.mjs`
- `npm run check:pr-governance`
- `npm run check:docs-frontmatter`
- `npm run check:task-packet-template`
- `npm run check:failure-registry`
- `npm run check:generated-modules`

## Linkage

- Task ID: `2026-06-18-pr-branch-cleanup-automation`
- Task Manifest: `.harness/tasks/2026-06-18-pr-branch-cleanup-automation/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Evidence Directory: `.harness/evidence/2026-06-18-pr-branch-cleanup-automation/`
- Review File: `.harness/evidence/2026-06-18-pr-branch-cleanup-automation/review.md`

## Evidence Required

- workflow test output
- governance check output
- branch-cleanup root-cause summary

## Human Gates

- none

## Completion Checklist

- [ ] Layer and boundary declared
- [ ] Workflow cleanup rule added
- [ ] Contract anchors read
- [ ] Verification run or exception recorded
- [ ] Evidence saved or summarized
- [ ] Review completed
