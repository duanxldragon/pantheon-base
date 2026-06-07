# Verification Summary: 2026-06-03-main-sonar-remediation

## Scope

- Primary layer: `platform`
- Changed files:
  - `package.json`
  - `scripts/run-sonar-remediation.mjs`
  - `tests/scripts/run-sonar-remediation.test.mjs`
  - `docs/harness/tasks/2026-06-03-main-sonar-remediation.task.md`
  - `docs/remediations/MAIN_SONAR_REMEDIATION_RUNBOOK_20260603.md`
  - `docs/remediations/MAIN_SONAR_REMEDIATION_RUNBOOK_20260603.en.md`
  - `.harness/evidence/2026-06-03-main-sonar-remediation/summary.md`
  - `.harness/evidence/2026-06-03-main-sonar-remediation/commands.json`
  - `.harness/evidence/2026-06-03-main-sonar-remediation/review.md`

## Commands

| Command | CWD | Result | Notes |
|---|---|---|---|
| `node --test tests/scripts/run-sonar-remediation.test.mjs` | `pantheon-base` | passed | runner tests now cover Windows backend fallback, repo-local `GOCACHE`, evidence seeding, and runtime-log capture |
| `node scripts/run-sonar-remediation.mjs --task 2026-06-03-main-sonar-remediation --group baseline --execute` | `pantheon-base` | passed | full local baseline batch passed; backend phase wrote explicit Windows fallback evidence while frontend/build/duplication stayed green |
| `node ../harness-engineering/scripts/harness/check-evidence.mjs --root . .harness/evidence/2026-06-03-main-sonar-remediation/commands.json` | `pantheon-base` | passed | evidence linkage and minimum JSON structure validated |
| `node scripts/run-sonar-remediation.mjs --task 2026-06-03-main-sonar-remediation --phase backend-tests --execute` | `pantheon-base` | passed | verified the backend phase remains stable after pinning `GOCACHE` to `.harness/cache/go-build` |
| `gh api repos/duanxldragon/pantheon-base/actions/workflows/sonar.yml/dispatches -X POST -f ref=main` | `pantheon-base` | passed | triggered a fresh merged-main Sonar workflow on `main` |
| `gh run watch 26866784416` | `pantheon-base` | passed | watched `SonarCloud Auxiliary Scan` to completion; GitHub Actions job succeeded on `2026-06-03 14:04:17 +08:00` |
| `Invoke-RestMethod https://sonarcloud.io/api/project_analyses/search?...branch=main&ps=2` | `pantheon-base` | passed | latest main-branch analysis recorded at `2026-06-03 14:02:48 +08:00` for revision `2f70c2da40fe4c0a59d3c0c77522d27d3727f6f4` |
| `Invoke-RestMethod https://sonarcloud.io/api/measures/component?...branch=main&metricKeys=alert_status,open_issues,duplicated_lines_density,coverage,security_hotspots` | `pantheon-base` | passed | main Sonar metrics after the fresh scan: `alert_status=ERROR`, `coverage=3.5`, `duplicated_lines_density=16.3`, `open_issues=749`, `security_hotspots=0` |

## Browser Evidence

- none

## Known Gaps

- local `baseline` is closed, but Windows evidence still downgrades `go test -race ./...` to `go test ./...`; authoritative race coverage remains `quality.yml` on Ubuntu
- merged-main Sonar runtime evidence is now fresh, but the quality gate remains `ERROR` on `main`
- local Sonar is still `not-run` on this workstation because `pantheon-sonarcloud.env` is absent and `Sonar-Scanner` is unavailable

## Completion Status

runtime-evidence-complete / remediation-open
