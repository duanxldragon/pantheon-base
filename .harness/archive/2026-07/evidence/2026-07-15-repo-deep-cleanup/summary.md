# Verification summary: 2026-07-15-repo-deep-cleanup

## What landed

Deep repository cleanup on branch `chore/2026-07-15-repo-deep-cleanup`
(commit `fcec4269`, 652 files, −42,345 lines). User-directed, scope confirmed
interactively before execution.

### Retired historical process artifacts (456 tracked files)

- `docs/assessments/`, `docs/remediations/`, `docs/archive/`, `docs/superpowers/`,
  `docs/harness/tasks/` — audit reports, remediation plans, phase baselines,
  historical plan/spec records for tasks already merged to main.
- `docs/DRIFT_AUDIT{,.en}.md`, `docs/deliverable-assessment-20260630.md`,
  `docs/harness/SESSION_DECISIONS_20260608.md`, `docs/harness/DEFERRED_CODE_BACKLOG_20260608.md`.
- `.harness/evidence/`, `.harness/tasks/` — evidence and manifests for 35 closed tasks.
  Deliberate: the harness *mechanism* (specs, checkers, CI gates) is fully retained;
  only closed-task state was removed. New tasks (this one included) recreate the dirs.
- `releases/` — 9 historical base-v0.8.x release metadata sets.
- `frontend/.codex/` — 86 orphan OMX agent/prompt/skill files (consistent with the
  harness v1.4.0 OMX retirement decision).
- `frontend/screenshots/`, committed `backend/uploads/` avatar PNGs, `.codex/tasks/`,
  `.github/pr-body.txt`.

### Layout normalization

- `go.mod`/`go.sum`/`.golangci.yml` → `backend/`; module imports rewritten in 140 files
  (`pantheon-platform/backend/*` → `pantheon-platform/*`); Dockerfile, 4 CI workflows
  (go-version-file + working-directory), scaffold/dict workspace-root detection updated.
- `tests/fixtures/system-import-export/` → `frontend/tests/fixtures/` (spec path updated).
- `tests/performance/` (k6) → `backend/tests/performance/` (README paths updated).
- `docs/designs/REPOSITORY_LAYOUT{,.en}.md` rewritten to match the new tree.
- ~50 dead documentation links cleaned across contracts/designs/acceptances/READMEs;
  failure-registry FR-003 guide pointer repointed.

## Commands (see commands.json)

- backend: `go build` / `go vet` / `go test -short` — all clean.
- frontend: `tsc --noEmit` + `eslint --max-warnings 0` — clean.
- governance: all 9 harness/docs checks — 0 findings.
- root script tests — pass.

## Residual

- `test:foundation-release`: 2 of 12 tests fail with a Windows tar environment error;
  reproduced identically on the pre-cleanup tree — pre-existing, not a regression.
- `check:harness-method` reports 2 pre-existing warnings (missing openspec skeleton
  directory), unrelated to this task.
- Two `.tmp/` log files could not be deleted locally (held open by a running process);
  `.tmp/` is gitignored so this has no repo effect.

## Boundary note

No runtime behavior changes. Backend diffs are import-path rewrites plus
workspace-root detection (`go.mod` probe now `backend/go.mod`); frontend diff is
one fixture path constant.
