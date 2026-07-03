---
title: CodeQL Alert Remediation Task Packet
doc_type: Acceptance
layer: platform
status: Active
linked_contracts:
  - docs/harness/TASK_PACKET_SPEC.md
updated_at: 2026-07-03
---

# Task Packet: 2026-07-03-codeql-alert-remediation

## Goal

Close the open CodeQL alerts in `pantheon-base` by removing the request-header log injection path in the backend logging middleware and hardening the PR helper so shell commands are executed with argv arrays.

## Priority (v1.1+)

`high`

## Estimated Complexity (v1.1+)

`simple`

## Primary Layer

platform

## Dependency Layers

- none

## Dependencies (v1.1+)

- blockedBy: `none`
- blocks: `none`

## Harness Profile

- Template: admin-platform
- Overlay: pantheon-base
- Coverage Dimensions:
  - behaviour
  - maintainability
  - architecture-fitness
  - runtime-quality
  - method-health

## Contract Anchors

- `pantheon-base/AGENTS.md`
- `pantheon-base/DESIGN.md`
- `pantheon-base/docs/README.md`
- `pantheon-base/docs/designs/QUALITY_AND_SECURITY_STRATEGY.md`
- `pantheon-base/docs/harness/TASK_PACKET_SPEC.md`

## Scope

### In

- remove the `user_agent` log field from the shared request logging middleware so CodeQL no longer tracks a user-controlled value into the log sink
- convert the PR creation helper to `execFileSync` argv-based command execution so branch, title, and commit message values are never interpolated into a shell command string
- add task packet and evidence artifacts so the PR governance gate can validate the change

### Out

- `pantheon-ops` sync or release publication
- unrelated backend or frontend runtime changes
- rewriting the broader PR governance ruleset

## Assumptions and Open Questions

- Confirmed Facts: the PR governance gate requires task linkage artifacts for non-trivial changes, and the current PR body failed that check
- Working Assumptions: the existing logging middleware is the minimal place to remove the flagged log sink without changing request handling
- Open Questions: none

## Structural Scope (v1.1+ Enhanced)

### Scope Quantification

- Modules affected: 2
- Files: 2 create, 2 modify
- API endpoints: 0
- Database migrations: no

### Risk Nodes

1. User-controlled request metadata reaching a log sink - remove the specific field that CodeQL flagged.
2. Shell command interpolation in PR helper automation - switch to argv-based execution.

### Legacy Fields (for compatibility)

- Affected Subgraph: `request context -> structured logging middleware -> log sink` | `PR helper inputs -> child process invocation -> GitHub PR creation`
- Boundary Crossings: `platform -> pkg/*`
- Risk Nodes: `none`
- Graph Focus: `sensitive-input-flow`

## Expected Files

### Create

- `docs/harness/tasks/2026-07-03-codeql-alert-remediation.task.md`
- `.harness/tasks/2026-07-03-codeql-alert-remediation/manifest.json`
- `.harness/evidence/2026-07-03-codeql-alert-remediation/commands.json`
- `.harness/evidence/2026-07-03-codeql-alert-remediation/summary.md`
- `.harness/evidence/2026-07-03-codeql-alert-remediation/review.md`

### Modify

- `backend/internal/middleware/logging_middleware.go`
- `scripts/create-pr.mjs`

### Do Not Touch

- `pantheon-ops/**`
- unrelated release metadata

## Implementation Notes

- Keep the logging change surgical: remove the flagged user-agent field instead of expanding the logging surface.
- Keep the Node helper shell-safe by passing argv arrays directly to `execFileSync`.
- PR governance artifacts should describe the code fix, not the broader release flow.

## Minimum Viable Approach

- Selected Rung: `stdlib`
- Why This Is Enough: the fix is a targeted source change plus governance artifacts; no new dependency or architectural refactor is needed.
- Upgrade Trigger: none

## Success Criteria

- Behaviour Outcome: the branch no longer carries the open CodeQL alert paths and the PR governance gate accepts the linked task packet
- Verification Signal: `go test ./backend/...`, `node --check scripts/create-pr.mjs`, and PR governance validation
- Regression Watch: request logging and PR helper automation keep their existing functionality
- Economics Watch: none

## Context Strategy

- Entry Sources: `AGENTS.md`, current task packet, PR governance checker
- Retrieval Order: `entry -> summary -> raw`
- Retrieval Helpers: none
- Promotion Target: none
- Response Budget: standard
- Sensitive Context: none

## Execution Roles

- Implementer Posture: implementer
- Reviewer Posture: mechanical

## Stop Points

- none

## Technical Debt (v1.1+)

- technicalDebtFlag: no
- technicalDebtNote: none

## Rollback Plan (v1.1+)

- Trigger Condition: any validation regression or unexpected PR governance failure
- Rollback Steps:
  1. `git revert 6783edf`
  2. restore the task packet artifacts if they become stale
- Rollback Verification:
  - [ ] Functionality verified
  - [ ] Data integrity verified
  - [ ] No side effects observed

## State Plan

- Checkpoint Expectation: `.harness/evidence/2026-07-03-codeql-alert-remediation/summary.md`
- Resume Artifacts: `.harness/evidence/2026-07-03-codeql-alert-remediation/commands.json`

## Verification Plan

### Backend

- `go test ./backend/...`

### Frontend

- `node --check scripts/create-pr.mjs`

### Browser / Smoke

- `none`

## Linkage

- Task ID: `2026-07-03-codeql-alert-remediation`
- Task Manifest: `.harness/tasks/2026-07-03-codeql-alert-remediation/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Evidence Directory: `.harness/evidence/2026-07-03-codeql-alert-remediation/`
- Review File: `.harness/evidence/2026-07-03-codeql-alert-remediation/review.md`

## Evidence Required

- command result summary
- review summary

## Human Gates

- none

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Tests or checks updated
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Docs updated if contracts changed
- [ ] Review completed
