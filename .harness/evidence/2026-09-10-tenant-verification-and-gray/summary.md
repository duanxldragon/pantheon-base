# Verification Summary: 2026-09-10-tenant-verification-and-gray

## Scope

- Primary layer: `platform`
- Runtime sensitivity: high
- Boundary: ingress -> auth/IAM -> tenant context -> protected resources and side effects -> audit/observability -> release governance
- Product code changes in this verification pass: logout now deletes the current Redis access-token session and invalidates the TokenAuth middleware cache before clearing cookies; the change is covered by handler and runtime regression tests.
- Repository boundary: `pantheon-base` only; `pantheon-ops` was not modified.

## Business Verification Result (2026-09-14)

The repository-level tenant business verification completed for the executable local scope:

- Full backend short suite passed.
- Hostile two-tenant middleware matrix and concurrent request boundary tests passed.
- Tenant-sensitive auth/login, security events, audit, settings, dictionary, tenant context, and upload packages passed.
- Frontend type-check and lint passed.
- `git diff --check` passed.
- No cross-tenant leak was reproduced in the available unit/integration fixtures.
- The real local HTTP tenant runtime matrix passed 23/23 checks after rebuilding the backend. It covered compat -> multi -> compat, tenant picker, session tenant claims, stale-token rejection, header forgery, dictionary list/export, ID tampering, refresh rotation/replay, operation-log isolation, file namespace rejection, logout revocation, and kill-switch force expiry. Temporary dictionary fixtures and the blacklist were removed, the flag was restored to `compat`, and the pre-existing reusable smoke tenants 101/202 were retained.
- The focused protected-resource Playwright smoke passed 1/1 with independent browser contexts for tenants 101 and 202. It verified dashboard and dictionary page access, dictionary list isolation, export isolation, and rejection of cross-tenant dictionary ID update and batch-status tampering. Cleanup restored `platform.tenant_mode=compat`.

This is **not** a production or gray-release approval. The verification is still `blocked` because the task packet requires broader browser coverage, production-like rollback/recovery evidence, operational baselines, and human gates.

## Commands

| Command | CWD | Result | Notes |
| --- | --- | --- | --- |
| `go test -short ./...` | `backend/` | passed | All backend packages passed; exit code 0. |
| `go test -short ./internal/middleware -run 'TestTenantContextMiddleware_(HostileTwoTenantMatrix\|ConcurrentRequestsKeepTenantBoundary)$' -count=1` | `backend/` | passed | Hostile two-tenant and concurrent tenant-boundary tests passed; exit code 0. |
| `npm run type-check` | `frontend/` | passed | TypeScript build check passed; exit code 0. |
| `npm run lint` | `frontend/` | passed | ESLint passed; exit code 0. |
| `git diff --check` | repository root | passed | No whitespace errors; exit code 0. |
| `go test -short ./pkg/common/http ./pkg/authtoken ./internal/middleware ./modules/auth/login` | `backend/` | passed | Logout access-token deletion, shared token extraction, middleware, and auth handler regressions passed. |
| `node scripts/run-smoke-suite.mjs --host 127.0.0.1 --port 5173 --cleanup-fixtures all --config playwright.config.ts -- tests/smoke-core/auth-login-logout.spec.ts tests/smoke-core/auth-tenant-picker.spec.ts --workers=1` | `frontend/` | passed | Browser auth and tenant-picker smoke passed 7/7. |
| `npx playwright test tests/smoke-core/tenant-protected-resources.spec.ts --config playwright.config.ts --workers=1` | `frontend/` | passed | Independent tenant-101/tenant-202 browser contexts passed 1/1 for protected pages, dictionary reads, export isolation, and ID/batch tampering rejection; cleanup restored `platform.tenant_mode=compat`. |
| `npx playwright test -c playwright.visual.config.ts tests/visual/visual-baseline.spec.ts` | `frontend/` | partial | Login baselines passed 3/3; dashboard and system-user-list snapshots failed with ~2% pixel diffs and were not updated. |
| `tenant-runtime-matrix.ps1` | `pantheon-base` | passed | Real local MySQL/Redis HTTP matrix passed 23/23; temporary dictionary fixtures/flag/blacklist cleaned up, reusable smoke tenants retained. |
| `go test -short -race ./internal/middleware` | `backend/` | blocked | Windows toolchain reports `-race requires cgo; enable cgo by setting CGO_ENABLED=1`. |

## Existing Evidence References

- Migration and rollback rehearsal: `.harness/evidence/2026-09-10-tenant-migration-runbook/`
- Tenant core data, audit, upload, settings, auth-log, async, and route-guard evidence: `.harness/evidence/2026-09-10-tenant-core-data-infrastructure/`
- Database-per-tenant evaluation: `.harness/evidence/2026-09-10-tenant-core-data-infrastructure/database-per-tenant-evaluation.md`
- Task packet: `.harness/tasks/2026-09-10-tenant-verification-and-gray/task.md`

## Graph Checks

- Used CodeGraph: yes
- Index status: up to date on 2026-09-13
- Affected subgraph: ingress -> auth/IAM -> tenant context -> protected resources/side effects -> audit/metrics -> release flag
- Structural checks: cycle, hub, call-depth, sensitive-flow review recorded for the tenant slices
- Findings: no new structural finding in this evidence-only pass

## Browser Evidence

- Repository Playwright Chromium evidence was produced on September 14, 2026:
  - `tests/smoke-core/auth-login-logout.spec.ts`: 4/4 passed.
  - `tests/smoke-core/auth-tenant-picker.spec.ts`: 3/3 passed. Covers password-gated candidate display, invalid-password non-disclosure, explicit `tenantId` resubmission, empty session state before selection, and 390px horizontal-overflow check.
  - `tests/smoke-core/tenant-protected-resources.spec.ts`: 1/1 passed. Covers independent tenant contexts, dashboard/dictionary protected pages, dictionary list/export isolation, cross-tenant ID update rejection, and cross-tenant batch-status rejection.
  - `tests/visual/visual-baseline.spec.ts`: 3/3 passed for desktop light, mobile light, and desktop dark login rendering.
  - Screenshots: `artifacts/browser/tenant-picker-desktop.png`, `artifacts/browser/tenant-picker-mobile.png`.
- A real local HTTP probe against MySQL-backed `pantheon-base` used the reusable smoke tenants `101` and `202`: multi mode returned both candidates, explicit `tenantId=101` issued a session, and the database was restored to `platform.tenant_mode=compat`.
- The in-app browser backend was unavailable in this session, so the rendered evidence comes from the repository's Playwright Chromium runner.

## Known Gaps

- Browser coverage is still concentrated on login and tenant picker; the broader protected-resource matrix is HTTP-harness evidence rather than browser automation.
- In-app browser backend was unavailable; standalone repository Playwright Chromium was used.
- Runtime flag switching and kill-switch were exercised locally in the matrix, but production-like rollback timing, cache invalidation, and recovery evidence are still missing.
- S3 download authorization is not implemented or verified; only local upload download authorization is covered by the core-data evidence.
- No durable async job framework beyond the operation-log queue exists to verify.
- No production-like performance baseline or cache/error/trace/alert measurements were captured.
- No production backup/restore/rollback execution was approved or run; migration rehearsal remains replica-only and human gates G1-G4 are open.
- Race tests are unavailable in the current Windows environment because cgo is disabled.
- Two non-login visual baselines (`dashboard.png`, `system-user-list.png`) remain out of sync with the current rendered data-driven surface; no snapshot update was authorized in this verification pass.

## Completion Status

blocked

## Release Recommendation

`blocked`. Unit and static gates are green, but the task packet requires runtime evidence and human release gates. Do not promote to controlled pilot or production candidate until the listed gaps are closed or explicitly accepted by the responsible human gate.
