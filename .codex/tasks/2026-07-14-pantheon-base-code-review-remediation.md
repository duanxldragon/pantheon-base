# Pantheon Base Code Review Remediation Plan

## Metadata

- Task ID: `2026-07-14-pantheon-base-code-review-remediation`
- Repository: `pantheon-base`
- Delivery level: `L2`
- Status: `validated-awaiting-human-gate`
- Source: `docs/PANTHEON_BASE_CODE_REVIEW_CHECKLIST.md`
- Scope: `platform`, `system/auth`, `system/iam`, `system/org`, `system/config`, `lowcode`
- Human gate: production-readiness acceptance after all P0/P1 tasks and validation gates pass

## Objective

Resolve the evidence-backed findings from the Pantheon Base repository review, restore all mandatory build and governance gates, and produce runtime evidence for the remaining enterprise-delivery checks.

## Constraints

- Keep changes in `pantheon-base`; shared fixes flow to downstream repositories through the foundation release process.
- Do not weaken authentication, authorization, audit, i18n, upload security, or UI admission gates to make checks pass.
- Preserve module boundaries between `platform`, `system/*`, `lowcode`, and `business/*`.
- Update tests, checkers, documentation, and evidence together when a contract changes.
- Treat the Go toolchain upgrade as unverified until repository metadata, local tooling, CI, tests, and vulnerability scans agree.

## Tasks

### P0 - Blocking

- [x] **T01 - Synchronize and verify the Go 1.26.5 toolchain upgrade**
  - Update `go.mod`, CI workflows, container/build configuration, and developer documentation to the same supported Go version.
  - Resolve the local `internal/abi` duplicate declaration failure that currently prevents `govulncheck` from running.
  - Re-run dependency resolution without unrelated module upgrades.
  - Acceptance:
    - `go version` reports the intended toolchain.
    - `go.mod` and CI use the same Go version.
    - `go test ./backend/...` passes.
    - `govulncheck ./...` runs successfully and reports no reachable known vulnerabilities.
  - Validation:
    - `go version`
    - `go mod tidy -diff`
    - `go test ./backend/...`
    - `go run golang.org/x/vuln/cmd/govulncheck@v1.3.0 ./...`

- [x] **T02 - Sanitize public health-check dependency errors**
  - Replace client-visible `err.Error()` values in `backend/modules/platform/health.go` with stable message keys such as `database.unavailable` and `redis.unavailable`.
  - Log a sampled, safe dependency failure category server-side with request ID, dependency name, and error type; never persist the raw dependency error from this public probe.
  - Keep the existing `200/503` health status contract unless a documented contract change is approved.
  - Add tests for database and Redis degraded states that assert internal error text is absent from the response.
  - Acceptance:
    - `/api/v1/health` never exposes DSNs, hostnames, driver text, Redis addresses, or raw dependency errors.
    - Degraded status and request correlation remain available.
  - Validation:
    - `go test ./backend/modules/platform/...`
    - `go test ./backend/...`

- [x] **T03 - Remove hard-coded login-log time preset labels**
  - Replace the Chinese labels in `frontend/src/modules/auth/security/components/LoginLogList.tsx` with i18n keys.
  - Add equivalent resources for `zh-CN`, `en-US`, `fr-FR`, `ja-JP`, and `ko-KR`.
  - Preserve the existing duration and calendar-range behavior.
  - Acceptance:
    - No display label in the time presets is hard-coded.
    - All supported locales render a non-empty translated value.
    - The frontend build is no longer blocked by this finding.
  - Validation:
    - `npm run check:i18n-hardcode`
    - `npm run audit:i18n-locales`
    - `npm run type-check`
    - `npm run build`

- [x] **T04 - Restore the low-code relation-table generation contract**
  - Extend list-page governance constants in `frontend/src/modules/lowcode/generator/frontendGenerator.ts` to include `relationFromField` and `relationToField`.
  - Render both relation fields in the generated governance summary when present.
  - Keep relation tables free of standalone routes, menus, permissions, and dashboard widgets.
  - Preserve main-table, detail-table, master-detail, and many-to-many generation behavior.
  - Acceptance:
    - Generated relation-table list/detail files contain the expected relation-field context.
    - Existing relation-table isolation rules remain enforced.
    - The generator quality contract passes without weakening assertions.
  - Validation:
    - `npm run test:generator:quality`
    - `npm run test:generator:dashboard-widget`
    - `npm run test:generator:smoke`

### P1 - Serious

- [x] **T05 - Route system list-page colors through Pantheon semantic tokens**
  - Replace direct Arco color tokens in `frontend/src/modules/system/components/shared/list-page.css` with canonical Pantheon semantic tokens.
  - Cover danger actions, danger hover backgrounds, and popup surfaces.
  - Verify light/dark theme behavior and contrast without adding one-off token aliases.
  - Acceptance:
    - `list-page.css` does not directly consume prohibited Arco color tokens.
    - Shared system pages retain readable danger and popup states.
    - Shell visual contract passes.
  - Validation:
    - `npm run check:shell-visual-contract`
    - `npm run check:contrast`
    - `npm run check:important-budget`

- [x] **T06 - Restore the complete frontend quality gate**
  - Run every prebuild checker independently after T03-T05.
  - Fix regressions rather than skipping or downgrading a checker.
  - Record command results in the task evidence directory.
  - Acceptance:
    - Type checking, linting, static contracts, generator contracts, and production build all pass.
  - Validation:
    - `npm run type-check`
    - `npm run lint`
    - `npm run check:menu-contract`
    - `npm run check:i18n-hardcode`
    - `npm run check:i18n-generated-scope`
    - `npm run check:system-datetime-presentation`
    - `npm run check:shell-visual-contract`
    - `npm run check:system-page-admission`
    - `npm run check:smoke-web-base`
    - `npm run check:smoke-coverage-contract`
    - `npm run build`

- [x] **T07 - Add regression coverage for all confirmed findings**
  - Add health-response sanitization tests.
  - Keep the i18n hard-code checker covering time preset labels.
  - Expand the relation-table generator contract to assert both relation fields and governance presentation.
  - Add a focused visual-contract assertion for the semantic token mapping.
  - Acceptance:
    - Reintroducing any confirmed finding causes a deterministic local or CI failure.
  - Validation:
    - `go test ./backend/modules/platform/...`
    - `npm run test:generator:quality`
    - `npm run check:i18n-hardcode`
    - `npm run check:shell-visual-contract`

### P2 - Verification And Delivery Evidence

- [x] **T08 - Run platform and system runtime smoke coverage**
  - Run platform shell, system pages/forms, IAM authorization, governance, and API smoke suites.
  - Capture desktop and mobile rendered evidence for UI-affecting changes.
  - Confirm loading, empty, error, forbidden, and submitting states remain intact where affected.
  - Acceptance:
    - Required smoke suites pass with no unexplained skips.
    - UI evidence covers affected routes and states.
  - Validation:
    - `npm run test:smoke:platform`
    - `npm run test:smoke:system`

- [x] **T09 - Close upload and frontend/backend contract unknowns**
  - Exercise upload validation, storage failure handling, and audit-log behavior against the configured local storage mode.
  - Confirm route, permission, menu, component registry, and frontend API contracts remain aligned.
  - Do not claim S3/MinIO production readiness without an actual object-storage run.
  - Acceptance:
    - Upload type/size/storage failures return stable error keys without leaking credentials or endpoints.
    - Menu and route contract checks pass.
    - Any untested external-storage scenario is explicitly documented as a runtime gap.
  - Validation:
    - `go test ./backend/pkg/upload/...`
    - `npm run check:menu-contract`
    - Relevant upload or system API smoke tests

- [x] **T10 - Re-run security and dependency gates**
  - Run Go vulnerability analysis and frontend dependency audit after all dependency/toolchain changes.
  - Review CI security workflow results for secret scanning and CodeQL.
  - Acceptance:
    - No reachable high/critical vulnerability remains without an approved risk decision.
    - Frontend audit reports zero high/critical vulnerabilities.
  - Validation:
    - `go run golang.org/x/vuln/cmd/govulncheck@v1.3.0 ./...`
    - `npm audit --registry=https://registry.npmjs.org --audit-level=high`

### P3 - Governance Closeout

- [x] **T11 - Produce L2 evidence and independent review artifacts**
  - Create or link the L2 task packet, command evidence, runtime evidence, and review artifact.
  - Obtain independent code-reviewer and architecture review results; if agent tooling remains unavailable, record that gap and require a human review gate.
  - Acceptance:
    - Every P0/P1 task has implementation, validation, and review evidence.
    - No task is marked complete using an unavailable-review fallback.

- [x] **T12 - Update release and inheritance documentation**
  - Document the Go toolchain baseline, health-response behavior change, i18n additions, generator contract change, and visual-token correction.
  - Record whether downstream foundation synchronization is included in this release or explicitly deferred.
  - Acceptance:
    - Release notes and upgrade guidance describe all externally relevant changes.
    - The downstream synchronization decision is explicit.

## Execution Order

1. T01
2. T02 and T03
3. T04 and T05
4. T06 and T07
5. T08, T09, and T10
6. T11 and T12

## Evidence And Deferrals

- Evidence: `.harness/evidence/2026-07-14-pantheon-base-code-review-remediation/closeout.md`.
- Independent code review returned `APPROVE` and architecture review returned `PASS`; both are archived in `.harness/evidence/2026-07-14-pantheon-base-code-review-remediation/review.md`.
- `npm run check:important-budget` remains a pre-existing governance gap at 164/147; this remediation adds no `!important`.
- Full-repository `npm run format:check` remains affected by 24 unrelated pre-existing files; all remediation files pass targeted formatting checks.
- MinIO S3-compatible runtime was exercised locally with real bucket creation, upload, readback, URL verification, and cleanup; provider-specific AWS S3/OSS deployment configuration remains a human environment gate.
- `base -> ops` synchronization is deferred to the next foundation release rather than copying shared files directly.

## Completion Gate

This plan is complete only when:

- All P0 and P1 tasks are checked off.
- Backend tests, frontend build, generator contracts, UI contracts, and security scans pass.
- Runtime-sensitive changes have smoke evidence or an explicit accepted gap.
- The L2 evidence and independent review artifacts are available.
- The human gate accepts any remaining P2/P3 deferrals and the downstream synchronization decision.
