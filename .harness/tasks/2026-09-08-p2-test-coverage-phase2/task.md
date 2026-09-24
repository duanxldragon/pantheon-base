# Task Packet: 2026-09-08-p2-test-coverage-phase2

## Goal

Raise Phase 2 automated test coverage for the system domain (`org`, `i18n`, `dict`, `setting`) to 40%+ each and overall backend coverage to 40%+, and record the measured numbers against the targets. This packet is listed in `TASK_MASTER_PLAN.md` but was never instantiated as a directory on 2026-09-08; it is back-filled on 2026-09-24 as pure accounting — the coverage work itself landed through the 2026-09-10 coverage reconciliation and later rounds.

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
- `.harness/tasks/2026-09-08-p1-test-coverage-phase1/manifest.json`

## Scope

### In

- Measurement and reconciliation of Phase 2 coverage targets (org/i18n/dict/setting 40%+, overall 40%+)
- Linking the achieved CI coverage gate (`check-coverage.mjs --threshold 50`, ci.yml line 431) as the enforcing ratchet
- Evidence for the achieved per-module numbers

### Out

- Writing new tests in this packet (the tests were delivered by the phase-1 reconciliation and the 2026-09 tenant/governance rounds)
- Raising the CI threshold further
- Frontend coverage (tracked separately via `FE_COVERAGE_THRESHOLD`)

## Expected Files

### Create

- `.harness/tasks/2026-09-08-p2-test-coverage-phase2/task.md`
- `.harness/tasks/2026-09-08-p2-test-coverage-phase2/manifest.json`
- `.harness/evidence/2026-09-08-p2-test-coverage-phase2/commands.json`
- `.harness/evidence/2026-09-08-p2-test-coverage-phase2/summary.md`
- `.harness/evidence/2026-09-08-p2-test-coverage-phase2/review.md`

### Modify

- none — this packet is retroactive accounting and changes no production code, gate, or threshold

### Do Not Touch

- `backend/modules/**` production logic
- `.github/workflows/ci.yml` coverage threshold
- frontend code

## Implementation Notes

Measured from the DB-backed cover profiles (`backend/coverage_p2.txt`, MySQL DSN from the gitignored `.env.test`):

| Group | Coverage | Statements | Target | Result |
| --- | --- | --- | --- | --- |
| org (dept/post) | 62.2% | 1435 | 40% | met |
| i18n | 68.7% | 1476 | 40% | met |
| dict | 45.3% | 955 | 40% | met |
| setting | 62.8% | 783 | 40% | met |
| overall (profile total) | 56.0% | — | 40% | met |

The ratchet is enforced by `node scripts/harness/check-coverage.mjs backend/coverage.txt --threshold 50` in ci.yml (aligned 2026-09-10 to the DB-backed 55.6% measurement with headroom), so the achieved level cannot silently regress.

## Verification Plan

- `cd backend && go tool cover -func=coverage_p2.txt | tail -1`
- `awk` statement-weighted aggregation over `coverage_p2.txt` grouped by module (org/i18n/dict/setting)
- `node scripts/harness/check-coverage.mjs backend/coverage.txt --threshold 50` (CI gate definition)
- `node scripts/harness/check-task-packet.mjs --root . .harness/tasks/2026-09-08-p2-test-coverage-phase2/task.md`

## Linkage

- Task ID: 2026-09-08-p2-test-coverage-phase2
- Task Manifest: `.harness/tasks/2026-09-08-p2-test-coverage-phase2/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `.harness/tasks/TASK_MASTER_PLAN.md`
- Evidence Directory: `.harness/evidence/2026-09-08-p2-test-coverage-phase2/`
- Review File: `.harness/evidence/2026-09-08-p2-test-coverage-phase2/review.md`

## Evidence Required

- Per-module coverage aggregation output for org/i18n/dict/setting and the overall total
- The CI coverage-gate line that keeps the achieved level ratcheted
- Review disposition confirming the targets are met without new test code in this packet

## Human Gates

- none required (retroactive packet with no production, permission, menu, i18n, or database change) — gate is evidence review

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
