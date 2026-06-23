---
title: Branch Hygiene Fallback Workflow Task Packet
doc_type: Acceptance
layer: platform
status: Approved
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-06-18
---

# Task Packet: 2026-06-18-branch-hygiene-fallback

## Goal

Add an independent GitHub branch-hygiene fallback so `pantheon-base` can automatically delete stale same-repo PR head branches that remain after merge or close, without re-binding branch cleanup to `pull_request.closed`.

## Primary Layer

platform

## Dependency Layers

- none

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `ci-workflow`
- Portable Failure Class: `ci-signal-noise`
- Owner Layer: `consumer-repository`
- Coverage Dimensions:
  - `behaviour`
  - `maintainability`
  - `architecture-fitness`
  - `method-health`

## Contract Anchors

- `AGENTS.md`
- `DESIGN.md`
- `docs/README.md`
- `docs/harness/PANTHEON_BASE_DELIVERY_WORKFLOW.md`
- `docs/harness/AI_QUALITY_GOVERNANCE.md`
- `docs/acceptances/AGENT_EXECUTION_CHECKLIST.md`

## Scope

### In

- add an independent `branch-hygiene` GitHub Actions workflow for fallback branch cleanup
- add a deterministic Node cleanup script that deletes only stale same-repo PR head branches
- add focused workflow and script tests for the fallback cleanup contract

### Out

- changing the existing PR governance or auto-merge decision flow
- restoring `pull_request.closed` cleanup coupling
- deleting local branches or worktrees from developer machines
- cleaning fork branches or non-PR branches

## Structural Scope

- Affected Subgraph: `main push or schedule -> branch hygiene workflow -> GitHub PR history -> remote branch deletion`
- Boundary Crossings: `platform -> GitHub repository API`
- Risk Nodes: `workflow trigger scope`, `head branch deletion guardrails`, `same-branch reuse safety`
- Graph Focus: `sensitive-input-flow`

## Expected Files

### Create

- `.github/workflows/branch-hygiene.yml`
- `scripts/cleanup-github-branches.mjs`
- `tests/scripts/branch-hygiene-workflow.test.mjs`
- `tests/scripts/cleanup-github-branches.test.mjs`
- `docs/harness/tasks/2026-06-18-branch-hygiene-fallback.task.md`

### Modify

- `package.json`

### Do Not Touch

- `.github/workflows/pr-automation.yml`
- `backend/**`
- `frontend/**`
- `../pantheon-ops/**`

## Implementation Notes

- The fallback must run independently from PR-close events so GitHub auto-merge race conditions do not strand stale branches.
- The deletion guard must only remove branches whose current remote HEAD SHA still matches a closed same-repo PR head SHA.
- A recreated branch with the same name but a different SHA must be preserved.
- A branch still referenced by an open PR must be preserved.

## Method Readiness

- Consumer-Specific Controls: `GitHub workflow posture`, `same-repo branch deletion guard`, `workflow contract tests`
- Required Sensors: `command`, `review`
- Required Evidence: `workflow test output`, `script test output`, `workflow posture summary`
- Ratchet Decision: `gate-updated`
- Deferred Code Issues: `none`

## Delivery Governance

- Design Gate: `short boundary note`
- Development Gate: `expected files declared`
- QA Acceptance Gate: `command`
- GitHub Governance Gate: `repo-quality-gate`

## Execution Roles

- Implementer Posture: `implementer`
- Reviewer Posture: `architecture | mechanical`

## Stop Points

- stop before widening cleanup beyond same-repo PR head branches
- stop before changing merge strategy or PR governance requirements

## State Plan

- Checkpoint Expectation: `docs/harness/tasks/2026-06-18-branch-hygiene-fallback.task.md`
- Resume Artifacts: `docs/harness/tasks/2026-06-18-branch-hygiene-fallback.task.md`

## Verification Plan

### Backend

- none

### Frontend

- none

### Browser / Smoke

- none

### Runtime Evidence

- explicit no-runtime-app-change statement; workflow and script tests are sufficient for this repository-governance change

## Linkage

- Task ID: `2026-06-18-branch-hygiene-fallback`
- Task Manifest: `.harness/tasks/2026-06-18-branch-hygiene-fallback/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Evidence Directory: `.harness/evidence/2026-06-18-branch-hygiene-fallback/`
- Review File: `.harness/evidence/2026-06-18-branch-hygiene-fallback/review.md`

## Evidence Required

- branch hygiene workflow test output
- branch hygiene script test output
- final branch cleanup rule summary

## Human Gates

- none

## Sync expectation

- modify only `pantheon-base` in this packet
- mirror the same fallback branch hygiene pattern into `pantheon-ops` with its own local task packet and verification

## Completion Checklist

- [ ] Layer and boundary declared
- [ ] Quality profile declared
- [ ] Ratchet decision declared
- [ ] Delivery governance gates declared
- [ ] Contract anchors read
- [ ] Verification run or exception recorded
- [ ] Evidence saved or summarized
- [ ] Review completed
