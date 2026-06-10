---
title: Sonar Critical Issue Remediation
doc_type: Acceptance
layer: platform
depends_on_layers:
  - system/config
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-06-09
---

# Task Packet: 2026-06-09-sonar-critical-fixes

## Goal

Fix 4 actionable Sonar findings outside of vendored harness scripts.

## Sonar Report Summary

| Metric | Value | Notes |
|---|---|---|
| Coverage | **36.8%** | Up from 3.5% |
| Blockers | 2 | S2083 false-positive, already fixed in code (PR #65) |
| Bugs | 28 | 27 in vendored harness scripts, 1 real |
| Vulnerabilities | 43 | 2 S2083 + 14 i18n S2068 false-positives + 2 real |
| Code Smells | 627 | ~620 in harness scripts + 4 real + 3 i18n-resources |
| Hotspots | 45 | All in harness scripts (ReDoS) |
| Duplication | 16.4% | i18n resources (known) |

## Scope

### In — Real fixes

1. `.github/workflows/security.yml` — `githubactions:S8264` (MAJOR × 2)
   Move `permissions: contents: read` from workflow level to each job that needs it.
   Jobs that only need `contents: read`: `dependency-vulnerabilities`, `secret-scan`,
   `workflow-posture`, `security-gates`. The `codeql-security` job needs additional
   `security-events: write`. The `codeql-alerts` job needs `security-events: read`.
   Remove the top-level `permissions` block; add job-level `permissions` instead.

2. `backend/modules/system/audit/audit_benchmark_test.go` — `go:S3776` (CRITICAL)
   Refactor `BenchmarkQueryScan` or the heaviest benchmark helper to reduce
   cognitive complexity from 17 to ≤15. Extract a sub-function or simplify
   nested conditionals.

3. `backend/modules/system/i18n/i18n_service.go` — `go:S1192` (CRITICAL × 3)
   Define constants for duplicated string literals:
   - `"system.lowcode"` (15 occurrences) → `const lowcodeMenuKey = "system.lowcode"`
   - `"system.menu.lowcode"` (5 occurrences) → `const lowcodeMenuI18nKey = "system.menu.lowcode"`
   - `"system.menu.modules"` (5 occurrences) → `const modulesMenuI18nKey = "system.menu.modules"`

4. `scripts/check-duplication.mjs` — `javascript:S2871` (CRITICAL)
   Add a `String.localeCompare` compare function to the array `.sort()` call.

### Out

- `scripts/harness/**` — vendored from `harness-engineering`, fix upstream
- `frontend/src/i18n/resources/**` S2068 — "password" in i18n strings is translation, not credential
- S2083 BLOCKERs — already fixed in code (PR #65), just need Sonar exclusion to take effect

### In — Sonar exclusion cleanups

5. `sonar-project.properties` — Add exclusion for S2068 on i18n resource files:
   - `frontend/src/i18n/resources/**` — Translations containing "密码" are not hardcoded passwords
6. `sonar-project.properties` — Add exclusion for harness scripts:
   - `scripts/harness/**` — Vendored from `harness-engineering`, not owned by this repo

### Do Not Touch

- `backend/pkg/**` — no Sonar criticals here
- `frontend/src/modules/**` — no Sonar criticals here

## Verification Plan

```powershell
cd pantheon-base
go build ./...
go test ./backend/modules/system/audit/... -count=1
go test ./backend/modules/system/i18n/... -count=1
go vet ./backend/modules/system/audit/... ./backend/modules/system/i18n/...
node scripts/check-duplication.mjs --json > /dev/null
```

## Evidence Required

- Build passes
- Tests pass
- Check-duplication script still works
- Sonar rescan shows S8264/S3776/S1192/S2871 resolved
