---
title: Main Sonar Batch 2 Backend I18n Coverage Task Packet
doc_type: Acceptance
layer: system/config
depends_on_layers:
  - platform
status: Approved
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/SYSTEM_CONFIG_CONTRACT.md
updated_at: 2026-06-08
---

# Task Packet: 2026-06-03-main-sonar-batch-2-backend-i18n-coverage

## Goal

Raise real backend coverage and reduce service-level duplication inside `backend/modules/system/i18n`, starting with `i18n_service.go`, which is currently the largest uncovered service file on `main`.

## Primary Layer

system/config

## Dependency Layers

- `platform`

## Harness Profile

- Template: `admin-platform`
- Overlay: `main-branch-quality-remediation`
- Coverage Dimensions:
  - `behaviour`
  - `maintainability`
  - `runtime-quality`

## Contract Anchors

- `docs/contracts/PLATFORM_CONTRACT.md`
- `docs/contracts/SYSTEM_CONFIG_CONTRACT.md`
- `docs/designs/I18N_MODULE_DESIGN.md`
- `docs/designs/QUALITY_AND_SECURITY_STRATEGY.md`
- `docs/acceptances/CODE_REVIEW_STANDARD.md`

## Scope

### In

- add focused tests around `I18nService` flows
- cover canonical menu entry normalization, locale merge behavior, cache reload behavior, and import/export seams
- reduce duplication inside `i18n_service.go` only where it directly serves testable behavior

### Out

- frontend locale file deduplication
- broad database schema changes
- route/menu contract changes outside existing i18n behavior

## Expected Files

### Modify

- `backend/modules/system/i18n/i18n_service.go`
- `backend/modules/system/i18n/i18n_handler.go`
- `backend/modules/system/i18n/seed_data.go`
- `backend/modules/system/i18n/i18n_service_test.go`

### Create

- `docs/harness/tasks/2026-06-03-main-sonar-batch-2-backend-i18n-coverage.task.md`
- `.harness/evidence/2026-06-03-main-sonar-batch-2-backend-i18n-coverage/summary.md`
- `.harness/evidence/2026-06-03-main-sonar-batch-2-backend-i18n-coverage/commands.json`
- `.harness/evidence/2026-06-03-main-sonar-batch-2-backend-i18n-coverage/review.md`

### Do Not Touch

- `frontend/src/i18n/resources/**`
- `sonar-project.properties`
- `.github/workflows/sonar.yml`

## Implementation Notes

- Fresh Sonar metrics for `backend/modules/system/i18n/i18n_service.go`: `uncovered_lines=1377`, `coverage=5.5`, `duplicated_lines=221`.
- Keep the batch centered on service seams that can be exercised with deterministic tests, not on broad rewrites of canonical locale data.
- Prefer extracting small helper functions only when they directly reduce cognitive load or make tests precise.

## Stop Points

- stop before changing locale storage contracts without contract doc updates
- stop before rewriting unrelated modules under `backend/modules/system/**`
- stop before changing Sonar or coverage tooling

## Structural Scope

- Affected Subgraph: `I18nHandler -> I18nService -> locale cache/seed helpers`
- Boundary Crossings: `system/config -> platform`
- Risk Nodes: `i18n service seams | locale cache reload | import/export helpers`
- Graph Focus: `hub-check | call-depth`

## Verification Plan

### Backend

- `go test ./backend/modules/system/i18n -count=1`
- `go test ./backend/modules/system/i18n -run TestI18nService -count=1`

### Repository Gates

- `go test ./...`
- `npm run run:sonar-remediation -- --task 2026-06-03-main-sonar-remediation --phase backend-tests --execute`

## Linkage

- Task ID: `2026-06-03-main-sonar-batch-2-backend-i18n-coverage`
- Task Manifest: `.harness/tasks/2026-06-03-main-sonar-batch-2-backend-i18n-coverage/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `docs/superpowers/plans/2026-06-03-main-sonar-priority-batches.md`
- Evidence Directory: `.harness/evidence/2026-06-03-main-sonar-batch-2-backend-i18n-coverage/`
- Review File: `.harness/evidence/2026-06-03-main-sonar-batch-2-backend-i18n-coverage/review.md`
- Parent Task: `docs/harness/tasks/2026-06-03-main-sonar-remediation.task.md`

## Evidence Required

- targeted test output for `backend/modules/system/i18n`
- before/after Sonar coverage note for `i18n_service.go`
- explanation of any helper extraction that was done specifically to improve testability

## Human Gates

- approve before changing locale storage contracts or migration semantics
- approve before adding schema changes not required for service correctness
- approve before changing Sonar or coverage tooling

## Completion Checklist

- [ ] Layer and boundary declared
- [ ] Contract anchors read
- [ ] Tests or checks updated
- [ ] Verification run or exception recorded
- [ ] Evidence saved or summarized
- [ ] Review completed
