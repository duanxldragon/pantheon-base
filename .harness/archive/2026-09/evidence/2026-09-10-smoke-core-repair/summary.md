# Verification Summary — 2026-09-10-smoke-core-repair

## Task

Repair the Core Smoke suite (0 CI successes since introduction), mark the gate
report-only per triage recommendation, and fix the two real product defects
uncovered during live verification.

## Repairs delivered

| Area | Change | Files |
|------|--------|-------|
| Class A — navigation | Sidebar group-button + tooltip/menuitem dual-form locators, dashboard quick-link fallback | `platform-shell-critical.spec.ts` |
| Class B — CRUD selectors | Arco `field=` aria-labels, `新增/保存` submit-bar buttons, nickname field, tree-table search+expand reveal (ellipsis prefix match), roleName search, refresh-topic re-render retries | 5 CRUD specs + `smoke-core-fixtures.ts` |
| Class C — import/export | Blob-download / download-event assertions; **product bug ①** found: `downloadFile` bypassed CSRF interceptor → 403 `csrf.missing`; fixed by reusing clientSession helpers | `system-import-export.spec.ts`, `src/api/file.ts` |
| Backend contract | **Product bug ②** found: role list serialized nil slices as `menuIds/permissionKeys: null`, crashing `openEdit`; normalized to `[]` in `buildRoleListItems` (aligned with role_export.go), pure-function regression test added | `role_service.go`, `role_service_pure_test.go` |
| Gate | `continue-on-error: true` (report-only) with promotion criteria documented | `smoke-core.yml`, `tests/smoke-core/README.md` |

## Verification evidence

- smoke-core suite (local stack, backend with role fix, two stable rounds):
  **23 passed / 3 skipped / 0 failed**. The 3 skips (auth logout/lockout,
  business lowcode) are environment-specific and absent from the CI failure set.
- Full regression, all 13 canonical phases:
  **279 passed / 0 failed** (platform 24+55+77, system 81+4+4+18+11, business 5).
- Frontend: `tsc --noEmit`, ESLint (smoke-core + file.ts), `tsc -b` + `vite build` — all clean.
- Backend: `go build`, `go vet`, role package `go test` (incl. new regression test) — all green.
- CI cross-check: main's latest Full Smoke Suite run = success; local results consistent.

## Environment-pacing notes (no repo change; CI unaffected)

1. Cold vite deps cache produced a one-off pagination timeout (trace showed the
   module graph still loading, API never fired). Green after warm-up.
2. `system-layout-contract` 12-page loops need ~46s locally vs the fixed 30s
   test timeout; both pass with CLI `--timeout=90000` (46.3s / 22.1s).

## Residual gaps

- `business-generated-basic.spec.ts` not rewritten (not in CI failure set).
- smoke-core remains report-only until multiple green rounds justify promotion.
