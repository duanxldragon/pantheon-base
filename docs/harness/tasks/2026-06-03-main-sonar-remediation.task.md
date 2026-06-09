---
title: Pantheon Base Main Sonar Remediation Task Packet
doc_type: Acceptance
layer: platform
depends_on_layers:
  - system/auth
  - system/config
  - system/org
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/SYSTEM_AUTH_CONTRACT.md
  - docs/contracts/SYSTEM_CONFIG_CONTRACT.md
  - docs/contracts/SYSTEM_ORG_CONTRACT.md
updated_at: 2026-06-08
---

# Task Packet: 2026-06-03-main-sonar-remediation

## Goal

Stabilize `pantheon-base` main-branch quality remediation by reproducing the real repository gates first, fixing verified base-owned blockers in small batches, and only trusting a fresh Sonar result after local whole-repo closure.

## Primary Layer

platform

## Dependency Layers

- `system/auth`
- `system/config`
- `system/org`

## Harness Profile

- Template: `admin-platform`
- Overlay: `main-branch-quality-remediation`
- Coverage Dimensions:
  - `behaviour`
  - `maintainability`
  - `architecture-fitness`
  - `runtime-quality`
  - `method-health`

## Contract Anchors

- `DESIGN.md`
- `docs/README.md`
- `docs/contracts/PLATFORM_CONTRACT.md`
- `docs/contracts/SYSTEM_AUTH_CONTRACT.md`
- `docs/contracts/SYSTEM_CONFIG_CONTRACT.md`
- `docs/contracts/SYSTEM_ORG_CONTRACT.md`
- `docs/designs/PANTHEON_BASE_ARCHITECTURE_OVERVIEW.md`
- `docs/designs/QUALITY_AND_SECURITY_STRATEGY.md`
- `docs/designs/WORKFLOW.md`
- `docs/designs/I18N_MODULE_DESIGN.md`
- `docs/designs/SYSTEM_ORG_DESIGN.md`
- `docs/acceptances/ACCEPTANCE_CHECKLIST.md`
- `docs/acceptances/CODE_REVIEW_STANDARD.md`
- `docs/acceptances/AGENT_EXECUTION_CHECKLIST.md`

## Scope

### In

- reproduce the current GitHub-native quality path on `main` before trusting any Sonar interpretation
- classify findings by gate blocker, Sonar structural debt, fixture drift, and workflow drift
- fix verified `pantheon-base` blockers in small vertical batches with contract-aware tests
- preserve batch-by-batch evidence so the remediation can resume without re-discovering state
- trigger the manual `sonar.yml` workflow only after local whole-repo verification is green or explicitly bounded

### Out

- narrowing Sonar source scope, exclusions, or coverage inputs to make dashboard numbers look better
- mixing unrelated feature work, broad refactors, or cross-repo cleanup into the remediation branch
- patching `pantheon-ops` before the corresponding `pantheon-base` batch is merged and verified
- deleting stale PRs or branches before evidence is preserved

## Expected Files

### Create

- `docs/harness/tasks/2026-06-03-main-sonar-remediation.task.md`
- `.harness/evidence/2026-06-03-main-sonar-remediation/summary.md`
- `.harness/evidence/2026-06-03-main-sonar-remediation/commands.json`
- `.harness/evidence/2026-06-03-main-sonar-remediation/review.md`

### Modify

- `.github/workflows/quality.yml`
- `.github/workflows/duplication.yml`
- `.github/workflows/sonar.yml`
- `sonar-project.properties`
- `scripts/run-sonar.ps1`
- `backend/modules/system/**`
- `backend/modules/auth/**`
- `frontend/src/modules/system/**`
- `frontend/tests/smoke/**`
- `docs/acceptances/**`

### Do Not Touch

- `../pantheon-ops/`
- `frontend/dist/`
- `frontend/node_modules/`
- `database/system_init.sql` unless a verified schema or seed drift is part of the failing batch

## Implementation Notes

- Treat GitHub-native checks as the merge gate and Sonar as auxiliary review data for `main`.
- Reproduce repository-wide commands first; do not start from a stale PR dashboard screenshot.
- Keep one remediation patch focused on one coherent batch so each commit has a clear verification story.
- If the same failure pattern appears again during this work, ratchet it into a repo rule, checker, smoke case, or failure registry entry instead of leaving it as tribal memory.

## Execution Roles

- Implementer Posture: `remediation-executor for base-owned quality blockers`
- Reviewer Posture: `architecture + security + mechanical + runtime-quality`

## Stop Points

- stop before changing GitHub merge-gate semantics, Sonar source-of-truth rules, or coverage-source inputs
- stop before using schema, seed, or fixture changes only to silence a failing test without a contract explanation
- stop before deleting stale PRs, branches, or evidence artifacts
- stop before introducing a new dependency, external service, or cross-repo sync step

## State Plan

- Checkpoint Expectation: `.harness/evidence/2026-06-03-main-sonar-remediation/summary.md` updated after each closed remediation batch
- Resume Artifacts: `docs/superpowers/plans/2026-06-03-main-sonar-remediation-method.md`, `.harness/evidence/2026-06-03-main-sonar-remediation/summary.md`, `.harness/evidence/2026-06-03-main-sonar-remediation/commands.json`, `.harness/evidence/2026-06-03-main-sonar-remediation/review.md`

## Verification Plan

### Backend

- `go test -race ./...`
- `go test ./... -coverprofile=coverage.out`
- `go test ./backend/modules/system/i18n -count=1`
- `go test ./backend/modules/system/org/dept -count=1`

### Frontend

- `cd frontend && npm ci`
- `cd frontend && npm run lint`
- `cd frontend && npm run build`

### Browser / Smoke

- `none unless a remediation batch changes shared UI, route guards, or smoke contracts; if touched, run the affected Playwright smoke command and record the route plus console state`

### Repository Gates

- `npm ci`
- `npm run check:duplication -- --json`
- `gh workflow run sonar.yml --ref main`

## Linkage

- Task ID: `2026-06-03-main-sonar-remediation`
- OpenSpec Change: `none`
- Superpowers Plan: `docs/superpowers/plans/2026-06-03-main-sonar-remediation-method.md`
- Evidence Directory: `.harness/evidence/2026-06-03-main-sonar-remediation/`
- Review File: `.harness/evidence/2026-06-03-main-sonar-remediation/review.md`

## Evidence Required

- command result summary with failing symptom before the fix and passing result after the fix
- duplication gate output or a summary of the measured repository duplication state
- runtime logs / metrics / traces / performance signal for workflow, scan, or coverage-path changes, or an explicit runtime gap when the environment cannot provide them
- smoke or browser evidence if the remediation touches shared shell, route guards, or other UI-facing contracts
- review summary using the same task packet and evidence directory

## Human Gates

- approve before changing merge-gate semantics or Sonar coverage scope
- approve before using schema or seed edits as part of the remediation story
- approve before deleting stale PRs, stale branches, or old evidence artifacts
- approve before syncing any merged base batch into `pantheon-ops`

## Completion Checklist

- [ ] Layer and boundary declared
- [ ] Contract anchors read
- [ ] Tests or checks updated
- [ ] Verification run or exception recorded
- [ ] Evidence saved or summarized
- [ ] Docs updated if contracts changed
- [ ] Runtime-sensitive evidence recorded or runtime gap accepted
- [ ] Review completed
