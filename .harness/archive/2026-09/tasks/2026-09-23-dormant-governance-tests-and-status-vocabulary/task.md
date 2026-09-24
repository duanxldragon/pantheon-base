# Task Packet: 2026-09-23-dormant-governance-tests-and-status-vocabulary

## Goal

Stop a whole class of silent drift: 13 of the 28 test files under `tests/scripts/` had no npm script and 12 of the 17 `test:` scripts were referenced by no workflow, so the repository's own governance regression tests ran nowhere. Running them for the first time exposed two real failures (one of them caused by an earlier un-gated strict-mode change in `check-boundaries.mjs`), so fix those, wire the suite into CI behind a catch-all script, and close the adjacent gap where `manifest.json` `status` was free text with three vocabularies in use that no gate validated.

## Primary Layer

platform

## Dependency Layers

- tests/scripts governance regression suite and the CI npm script step
- scripts/task-manifest.mjs schema and the gates that read every manifest

## Harness Profile

- Template: admin-platform
- Overlay: governance-ratchet
- Quality Profile: ci-workflow
- Portable Failure Class: static-sensor-gap
- Owner Layer: platform
- Coverage Dimensions:
  - behaviour
  - maintainability
  - architecture-fitness

## Contract Anchors

- `scripts/task-manifest.mjs`
- `tests/scripts/ci-workflow-dispatch.test.mjs`
- `tests/scripts/harness-check-boundaries.test.mjs`
- `tests/scripts/branch-hygiene-workflow.test.mjs`
- `.github/workflows/ci.yml`
- `docs/HARNESS_GOVERNANCE_GUIDE.md`

## Scope

### In

- Add a `test:scripts` catch-all that runs `tests/scripts/*.test.mjs` and wire it into the `ci.yml` "Run npm script tests" step.
- Guard that wiring with an assertion in `tests/scripts/ci-workflow-dispatch.test.mjs`.
- Fix the stale `branch-hygiene-workflow` test to match the deliberate removal of the push-to-main trigger in #142.
- Update the `check-boundaries` stale-baseline test to the strict-mode contract documented in the script (strict exits 1, non-strict warns).
- Validate `manifest.json` `status` when present against `planned | in-progress | completed | abandoned` in `scripts/task-manifest.mjs`.
- Normalise the 9 base manifests that used `done` / `complete` to `completed`.
- Document the optional `status` field and its vocabulary in `docs/HARNESS_GOVERNANCE_GUIDE.md`.
- Add `tests/scripts/task-manifest-status.test.mjs` covering the vocabulary and the repository's own manifests.

### Out

- Any change to runtime behaviour, API, permissions, menus, i18n, database or seed.
- Wiring or repairing `check-evidence.mjs`, `check-review.mjs` or `check-graph-review.mjs` (recorded as deferred with measurements).
- Migrating `pantheon-ops` manifests or any `pantheon-ops` change (standing deferral).
- Adding npm scripts for each of the 13 orphaned test files; the catch-all makes per-file scripts optional.

## Expected Files

### Create

- `tests/scripts/task-manifest-status.test.mjs`
- `.harness/tasks/2026-09-23-dormant-governance-tests-and-status-vocabulary/manifest.json`
- `.harness/tasks/2026-09-23-dormant-governance-tests-and-status-vocabulary/task.md`
- `.harness/evidence/2026-09-23-dormant-governance-tests-and-status-vocabulary/commands.json`
- `.harness/evidence/2026-09-23-dormant-governance-tests-and-status-vocabulary/summary.md`
- `.harness/evidence/2026-09-23-dormant-governance-tests-and-status-vocabulary/review.md`

### Modify

- `package.json` (new `test:scripts` script)
- `.github/workflows/ci.yml` (run the catch-all)
- `scripts/task-manifest.mjs` (status vocabulary)
- `docs/HARNESS_GOVERNANCE_GUIDE.md` (document the optional field)
- `tests/scripts/ci-workflow-dispatch.test.mjs` (wiring guard)
- `tests/scripts/harness-check-boundaries.test.mjs` (strict-mode contract)
- `tests/scripts/branch-hygiene-workflow.test.mjs` (drop the removed trigger assertion)
- the 9 `.harness/tasks/**/manifest.json` files listed in the manifest

### Do Not Touch

- `backend/modules/**` and `backend/pkg/**` (no Go source change in this round)
- `frontend/src/**` and `frontend/tests/**` (no product or smoke change)
- admin SQL, seeds, permission matrix and i18n resources
- `scripts/harness/check-evidence.mjs`, `check-review.mjs` and `check-graph-review.mjs` (deferred)
- the `pantheon-ops` repository

## Implementation Notes

- The catch-all is deliberately a glob over `tests/scripts/*.test.mjs` rather than 13 new per-file scripts: the per-file convention is exactly what let the suite drift, because forgetting one line in a workflow is invisible.
- `node --test` expands the glob itself, so the script works whether or not the calling shell expands globs (verified on Windows Git Bash and in Node 24).
- `status` is validated **when present**, not made required. The field is undocumented optional metadata, and the inherited `scripts/task-manifest.mjs` is shared with `pantheon-ops`, where 15 manifests carry no `status` at all; requiring it would turn an out-of-scope repository red at sync time.
- The enum is `planned | in-progress | completed | abandoned`, chosen so the one value already in real use outside base (`planned` in ops) stays legal while the actual drift (`done`, `complete`) is rejected.
- Prefer changing the test over the workflow in the branch-hygiene case: the trigger removal is a deliberate, committed simplification (#142), so the test encoded a stale intent.
- No new dependency, no new CI job; the only workflow edit adds one step line to an existing job.

## Verification Plan

- `node --test tests/scripts/*.test.mjs`
- `node --test tests/scripts/task-manifest-status.test.mjs`
- `node --test tests/scripts/harness-check-boundaries.test.mjs tests/scripts/branch-hygiene-workflow.test.mjs`
- `node scripts/harness/check-task-packet.mjs --root .`
- `node scripts/harness/check-visual-evidence.mjs --root . --strict`
- `node scripts/harness/check-method-health.mjs --root . --strict`
- `node scripts/harness/check-adoption.mjs --root . --strict`
- `node scripts/harness/check-generated.mjs --root . --strict`
- `node scripts/harness/check-boundaries.mjs --strict --repo pantheon-base --baseline config/boundary-baseline.json`

## Linkage

- Task ID: `2026-09-23-dormant-governance-tests-and-status-vocabulary`
- Task Manifest: `.harness/tasks/2026-09-23-dormant-governance-tests-and-status-vocabulary/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Plan References: `.harness/tasks/2026-09-23-legacy-packet-migration-and-config-integrity/manifest.json`
- Evidence Directory: `.harness/evidence/2026-09-23-dormant-governance-tests-and-status-vocabulary/`
- Review File: `.harness/evidence/2026-09-23-dormant-governance-tests-and-status-vocabulary/review.md`

## Evidence Required

- test counts before and after for the dormant `tests/scripts` suite
- the two failure outputs and which side (test or workflow) had drifted, with the commit that drifted it
- task-manifest `status`: vocabulary census before/after, positive and negative probes
- wiring proof: the `ci.yml` step, the new `test:scripts` script, and the guard assertion
- governance gate battery output
- review disposition incl. the three deferred unwired gates

## Human Gates

- none required (no permission, API, retention, menu or data surface changed) — PR gates and non-author review

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
