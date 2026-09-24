# Task Packet: 2026-09-08-p2-test-coverage-phase3

## Goal

Raise Phase 3 automated test coverage for the platform layer and low-code (platform/lowcode) to 30%+ each and overall backend coverage to 50%+, and record the measured numbers against the targets. Like phase 2, this packet was listed in `TASK_MASTER_PLAN.md` but never instantiated on 2026-09-08; it is back-filled on 2026-09-24 as accounting against the measured DB-backed profiles.

## Primary Layer

platform

## Dependency Layers

- go-testing
- backend-services
- backend-repositories

## Harness Profile

- Template: api-service
- Overlay: test-coverage-improvement
- Coverage Dimensions:
  - behaviour
  - maintainability
  - runtime-quality

## Contract Anchors

- `.harness/tasks/TASK_MASTER_PLAN.md`
- `scripts/harness/check-coverage.mjs`
- `.github/workflows/ci.yml`
- `.harness/tasks/2026-09-08-p2-test-coverage-phase2/manifest.json`

## Scope

### In

- Measurement and reconciliation of Phase 3 coverage targets (platform 30%+, lowcode 30%+, overall 50%+)
- Evidence that the CI coverage gate (threshold 50) keeps the overall target ratcheted
- Recording the one sub-target outlier (generator 26.3%) as a documented residual

### Out

- Writing new tests in this packet
- Raising the CI threshold beyond 50
- Frontend coverage

## Expected Files

### Create

- `.harness/tasks/2026-09-08-p2-test-coverage-phase3/task.md`
- `.harness/tasks/2026-09-08-p2-test-coverage-phase3/manifest.json`
- `.harness/evidence/2026-09-08-p2-test-coverage-phase3/commands.json`
- `.harness/evidence/2026-09-08-p2-test-coverage-phase3/summary.md`
- `.harness/evidence/2026-09-08-p2-test-coverage-phase3/review.md`

### Modify

- none — retroactive accounting, no production code, gate, or threshold change

### Do Not Touch

- `backend/modules/**` production logic
- `.github/workflows/ci.yml` coverage threshold
- frontend code

## Implementation Notes

Measured from the DB-backed cover profiles:

| Group | Coverage | Statements | Target | Result |
| --- | --- | --- | --- | --- |
| platform | 75.2% | 214 | 30% | met |
| lowcode aggregate (dynamicmodule 69.2% + generator 26.3% + other) | 56.4% | 1844 | 30% | met |
| dynamicmodule | 69.2% | 1294 | — | — |
| generator | 26.3% | 548 | — | below per-package, inside aggregate |
| overall (`coverage_p2.txt` total) | 56.0% | — | 50% | met |

`backend/coverage_lc.txt` total (platform+lowcode only) is 58.3%. The overall 50% target is also the enforced CI floor (`check-coverage.mjs --threshold 50`, ci.yml:431), so regression below the target fails CI rather than this packet.

The generator package (26.3%) is the one package below a phase-level number; it is called out as a documented residual rather than hidden, because the phase-3 target as written is per-layer (platform/lowcode), which is met.

## Verification Plan

- `cd backend && go tool cover -func=coverage_p2.txt | tail -1` and `go tool cover -func=coverage_lc.txt | tail -1`
- `awk` statement-weighted aggregation over both profiles grouped by platform/lowcode
- `node scripts/harness/check-coverage.mjs backend/coverage.txt --threshold 50`
- `node scripts/harness/check-task-packet.mjs --root . .harness/tasks/2026-09-08-p2-test-coverage-phase3/task.md`

## Linkage

- Task ID: 2026-09-08-p2-test-coverage-phase3
- Task Manifest: `.harness/tasks/2026-09-08-p2-test-coverage-phase3/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `.harness/tasks/TASK_MASTER_PLAN.md`
- Evidence Directory: `.harness/evidence/2026-09-08-p2-test-coverage-phase3/`
- Review File: `.harness/evidence/2026-09-08-p2-test-coverage-phase3/review.md`

## Evidence Required

- Per-group coverage aggregation output for platform and lowcode plus both profile totals
- The CI coverage-gate line at threshold 50
- Review disposition naming the generator residual explicitly

## Human Gates

- none required (retroactive packet with no production, permission, menu, i18n, or database change) — gate is evidence review

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
