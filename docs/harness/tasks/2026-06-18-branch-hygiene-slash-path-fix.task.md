---
title: Branch Hygiene Slash Path Fix Task Packet
doc_type: Acceptance
layer: platform
status: Approved
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-06-18
---

# Task Packet: 2026-06-18-branch-hygiene-slash-path-fix

## Goal

Fix the hosted `branch-hygiene` cleanup flow so slash-separated branch names keep working against the real GitHub branch lookup and branch deletion REST endpoints.

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

## Contract Anchors

- `pantheon-base/AGENTS.md`
- `pantheon-base/DESIGN.md`
- `pantheon-base/docs/README.md`
- `pantheon-base/docs/harness/PANTHEON_BASE_DELIVERY_WORKFLOW.md`
- `pantheon-base/docs/harness/AI_QUALITY_GOVERNANCE.md`
- `pantheon-base/docs/acceptances/AGENT_EXECUTION_CHECKLIST.md`
- `pantheon-base/docs/harness/tasks/2026-06-18-branch-hygiene-fallback.task.md`

## Scope

### In

- preserve raw slash-separated branch names for GitHub `/branches/{branch}` lookup paths
- preserve raw slash-separated branch names for GitHub `/git/refs/heads/{branch}` delete paths
- add regression coverage that locks this hosted GitHub API behavior for slash branch names

### Out

- changing the `pulls?head=` or `pulls?base=` query parameter encoding rules
- widening branch deletion scope beyond same-repo closed PR head branches
- changing merge strategy, PR governance rules, or local branch cleanup behavior

## Structural Scope

- Affected Subgraph: `push|schedule|workflow_dispatch -> branch-hygiene workflow -> cleanup script -> GitHub branch lookup/delete endpoints`
- Boundary Crossings: `platform -> GitHub repository API`
- Risk Nodes: `slash branch path handling`, `recreated branch safety`, `hosted verification fidelity`
- Graph Focus: `sensitive-input-flow`

## Expected Files

### Modify

- `scripts/cleanup-github-branches.mjs`
- `tests/scripts/cleanup-github-branches.test.mjs`

### Create

- `docs/harness/tasks/2026-06-18-branch-hygiene-slash-path-fix.task.md`
- `.harness/evidence/2026-06-18-branch-hygiene-slash-path-fix/commands.json`
- `.harness/evidence/2026-06-18-branch-hygiene-slash-path-fix/summary.md`
- `.harness/evidence/2026-06-18-branch-hygiene-slash-path-fix/review.md`
- `.harness/evidence/2026-06-18-branch-hygiene-slash-path-fix/pr-body.md`

### Do Not Touch

- `.github/workflows/pr-automation.yml`
- `.github/workflows/branch-hygiene.yml`
- `backend/**`
- `frontend/**`

## Implementation Notes

- Real GitHub hosted verification showed that these branch endpoints expect slash-separated branch names as path segments rather than `%2F`-encoded path atoms.
- Open-PR and base-branch query filters should keep their existing query encoding posture.
- The deletion guard must stay SHA-verified so a recreated branch with the same name is preserved.

## Method Readiness

- Consumer-Specific Controls: `GitHub workflow posture`, `slash-path endpoint regression`, `hosted residue verification`
- Required Sensors: `command`, `review`
- Required Evidence: `branch hygiene regression output`, `hosted verification plan`
- Ratchet Decision: `sensor-added`
- Deferred Code Issues: `none`

## Delivery Governance

- Design Gate: `root-cause note captured`
- Development Gate: `regression coverage added before hosted rerun`
- QA Acceptance Gate: `command`
- GitHub Governance Gate: `repo-quality-gate`

## Execution Roles

- Implementer Posture: `implementer`
- Reviewer Posture: `architecture | mechanical`

## Stop Points

- stop before changing query parameter encoding semantics
- stop before widening branch deletion beyond the closed-PR residue contract

## Verification Plan

- `npm run test:branch-hygiene`
- hosted GitHub rerun against a real closed-PR residue branch after merge

## Runtime Evidence

- no product runtime change; hosted GitHub workflow execution is the required external runtime proof

## Linkage

- Task ID: `2026-06-18-branch-hygiene-slash-path-fix`
- Task Manifest: `.harness/tasks/2026-06-18-branch-hygiene-slash-path-fix/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Evidence Directory: `.harness/evidence/2026-06-18-branch-hygiene-slash-path-fix/`
- Review File: `.harness/evidence/2026-06-18-branch-hygiene-slash-path-fix/review.md`

## Evidence Required

- branch hygiene local regression output
- hosted GitHub residue cleanup proof after merge

## Human Gates

- none

## Sync expectation

- modify only `pantheon-base` in this packet
- mirror the same slash-path endpoint fix into `pantheon-ops`

## Completion Checklist

- [ ] hosted slash-path root cause recorded
- [ ] regression coverage added
- [ ] local branch-hygiene tests rerun
- [ ] hosted residue cleanup rerun after merge
- [ ] residual risk updated
