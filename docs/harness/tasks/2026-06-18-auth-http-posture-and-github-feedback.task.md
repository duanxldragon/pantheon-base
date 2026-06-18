---
title: Auth HTTP Posture And GitHub Feedback Closure Task Packet
doc_type: Acceptance
layer: system/auth
depends_on_layers:
  - platform
  - system/iam
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/SYSTEM_AUTH_CONTRACT.md
  - docs/contracts/SYSTEM_IAM_CONTRACT.md
updated_at: 2026-06-18
---

# Task Packet: 2026-06-18-auth-http-posture-and-github-feedback

## Goal

Harden browser auth and HTTP posture in `pantheon-base`, add GitHub feedback closure automation for solo PR flow, and preserve the already-validated permission remediation compatibility fix bundled in this branch.

## Primary Layer

system/auth

## Dependency Layers

- `platform`
- `system/iam`

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `auth-security`
- Portable Failure Class: `runtime-evidence-gap`
- Owner Layer: `consumer-repository`
- Coverage Dimensions:
  - `behaviour`
  - `maintainability`
  - `architecture-fitness`
  - `runtime-quality`
  - `method-health`

## Contract Anchors

- `pantheon-base/AGENTS.md`
- `pantheon-base/DESIGN.md`
- `pantheon-base/docs/README.md`
- `pantheon-base/docs/contracts/PLATFORM_CONTRACT.md`
- `pantheon-base/docs/contracts/SYSTEM_AUTH_CONTRACT.md`
- `pantheon-base/docs/contracts/SYSTEM_IAM_CONTRACT.md`
- `pantheon-base/docs/designs/QUALITY_AND_SECURITY_STRATEGY.md`
- `pantheon-base/docs/superpowers/specs/2026-06-17-auth-cookie-first-and-http-posture-design.md`
- `pantheon-base/docs/superpowers/plans/2026-06-17-auth-cookie-first-and-http-posture-plan.md`
- `pantheon-base/docs/harness/tasks/2026-06-17-auth-platform-preference-boundary.task.md`
- `pantheon-base/docs/harness/tasks/2026-06-17-permission-workbench-remediation-schema-compat.task.md`

## Scope

### In

- extract platform preference parsing into `backend/pkg/platformprefs` and remove direct `system/auth -> system/iam/user` helper coupling from the browser auth contract path
- make browser auth responses cookie-first so login, MFA, and refresh success payloads stop exposing raw access or refresh tokens
- tighten HTTP posture with allowlisted CORS and minimum security response headers
- update frontend auth request helpers and smoke helpers to follow the cookie-first and header-first runtime contract
- add GitHub feedback fetch/apply loop scripts, PR governance coverage, and solo-PR auto-merge gating for PR, issue, and discussion comments
- keep the previously validated `permission_workbench_remediation_event` compatibility fix in the same delivery branch without reopening its runtime scope

### Out

- graceful shutdown refactor for `backend/cmd/server/main.go`
- constant-time CSRF comparison follow-up
- full frontend colocated unit-test rollout under `frontend/src/**`
- `pantheon-ops` inheritance sync in this same patch

## Structural Scope

- Affected Subgraph: `browser auth request -> cookie-first auth response -> platform preference contract -> allowlisted CORS/security headers -> GitHub feedback gate -> solo PR auto-merge`
- Boundary Crossings: `system/auth -> pkg/*`, `system/iam -> pkg/*`, `platform -> GitHub governance workflow`
- Risk Nodes: `auth handler`, `auth service`, `request middleware`, `PR governance body gate`, `GitHub feedback classifier`
- Graph Focus: `sensitive-input-flow | hub-check`

## Expected Files

### Create

- `backend/internal/middleware/cors_middleware_test.go`
- `backend/internal/middleware/security_headers_middleware.go`
- `backend/internal/middleware/security_headers_middleware_test.go`
- `backend/pkg/platformprefs/preferences.go`
- `backend/pkg/platformprefs/preferences_test.go`
- `frontend/scripts/lib/auth-cookie-session.mjs`
- `frontend/tests/api/auth-cookie-session.test.ts`
- `frontend/tests/api/auth-smoke-helper.test.ts`
- `scripts/address-github-feedback.mjs`
- `scripts/check-pr-governance.mjs`
- `scripts/fetch-github-feedback.mjs`
- `scripts/run-github-feedback-loop.mjs`
- `tests/scripts/address-github-feedback.test.mjs`
- `tests/scripts/check-pr-governance.test.mjs`
- `tests/scripts/fetch-github-feedback.test.mjs`
- `tests/scripts/pr-automation-workflow.test.mjs`
- `tests/scripts/run-github-feedback-loop.test.mjs`
- `tests/scripts/security-workflow.test.mjs`
- `docs/assessments/CURRENT_GOVERNANCE_AND_CODE_AUDIT_2026-06-17.md`
- `docs/harness/tasks/2026-06-18-auth-http-posture-and-github-feedback.task.md`
- `.harness/evidence/2026-06-18-auth-http-posture-and-github-feedback/summary.md`
- `.harness/evidence/2026-06-18-auth-http-posture-and-github-feedback/commands.json`
- `.harness/evidence/2026-06-18-auth-http-posture-and-github-feedback/review.md`
- `.harness/evidence/2026-06-18-auth-http-posture-and-github-feedback/pr-body.md`

### Modify

- `.github/workflows/pr-automation.yml`
- `.github/workflows/quality.yml`
- `.github/workflows/security.yml`
- `backend/cmd/server/main.go`
- `backend/internal/middleware/cors_middleware.go`
- `backend/modules/auth/auth_dto.go`
- `backend/modules/auth/auth_handler.go`
- `backend/modules/auth/auth_handler_test.go`
- `backend/modules/auth/auth_service.go`
- `backend/modules/auth/smoke_test.go`
- `backend/modules/system/iam/user/user_preferences.go`
- `frontend/src/api/request.ts`
- `frontend/src/modules/auth/Login.tsx`
- `frontend/src/modules/auth/api.ts`
- `frontend/tests/smoke/helpers/auth.ts`
- `SECURITY.md`
- `docs/contracts/SYSTEM_AUTH_CONTRACT.md`
- `docs/GITHUB_GOVERNANCE_CHECKLIST.md`
- `docs/GITHUB_REPOSITORY_SETUP.md`

### Do Not Touch

- `../pantheon-ops/**`
- unrelated business-domain modules

## Implementation Notes

- Browser auth now treats cookies plus CSRF header/cookie as the runtime contract; raw JWTs are no longer browser response payload fields.
- The platform-preference extraction slice remains base-owned because both `system/auth` and `system/iam` depend on the same normalized shell preference contract.
- GitHub feedback automation is repository-governance work, but it lands in `pantheon-base` first because downstream repos inherit the same solo-maintainer PR closure pattern.
- The permission remediation compatibility fix keeps its own task packet and evidence trail; this packet only records that the branch continues to carry that already-validated commit.

## Method Readiness

- Consumer-Specific Controls: `auth contract`, `middleware tests`, `GitHub governance scripts`, `PR automation workflow tests`
- Required Sensors: `command`, `review`, `runtime evidence`
- Required Evidence: `command summary`, `runtime gap`, `review summary`
- Ratchet Decision: `gate-updated`
- Deferred Code Issues: `graceful shutdown`, `constant-time csrf compare`, `frontend colocated unit tests`, `ops inheritance sync`

## Delivery Governance

- Design Gate: `spec reference`
- Development Gate: `expected files declared`
- QA Acceptance Gate: `command`, `runtime`
- GitHub Governance Gate: `repo-quality-gate`

## Execution Roles

- Implementer Posture: `implementer`
- Reviewer Posture: `architecture | security | mechanical`

## Stop Points

- stop before changing non-browser auth token semantics for non-cookie clients
- stop before broadening base-to-ops sync beyond repository-governance documentation and scripts

## State Plan

- Checkpoint Expectation: `.harness/evidence/2026-06-18-auth-http-posture-and-github-feedback/summary.md`
- Resume Artifacts: `docs/assessments/CURRENT_GOVERNANCE_AND_CODE_AUDIT_2026-06-17.md`, `docs/superpowers/plans/2026-06-17-auth-cookie-first-and-http-posture-plan.md`

## Verification Plan

### Backend

- `go test ./backend/pkg/platformprefs -count=1`
- `go test ./backend/modules/auth -count=1`
- `go test ./backend/internal/middleware -count=1`
- `go test ./backend/pkg/database -count=1`
- `go test ./backend/modules/system/iam/permission -count=1`

### Frontend

- `node --test frontend/tests/api/auth-session-snapshot.test.ts frontend/tests/api/auth-cookie-session.test.ts frontend/tests/api/auth-smoke-helper.test.ts`
- `cd frontend && npm run type-check`

### Browser / Smoke

- `none`

### Runtime Evidence

- `explicit runtime gap for full browser smoke; focused auth and middleware tests plus existing permission-runtime coverage`

## Linkage

- Task ID: `2026-06-18-auth-http-posture-and-github-feedback`
- OpenSpec Change: `none`
- Superpowers Plan: `docs/superpowers/plans/2026-06-17-auth-cookie-first-and-http-posture-plan.md`
- Evidence Directory: `.harness/evidence/2026-06-18-auth-http-posture-and-github-feedback/`
- Review File: `.harness/evidence/2026-06-18-auth-http-posture-and-github-feedback/review.md`

## Evidence Required

- targeted backend, frontend, and workflow-script command results
- PR governance body validation against a synthetic `pull_request` event
- explicit residual-risk and runtime-gap notes for unaudited follow-up items
- review summary tied to the same task packet and evidence directory

## Human Gates

- none

## Sync expectation

- only `pantheon-base` changes in this packet
- `pantheon-ops` follows through inheritance after the base repository PR flow is proven green

## Completion Checklist

- [ ] Layer and boundary declared
- [ ] Quality profile declared
- [ ] Ratchet decision declared
- [ ] Delivery governance gates declared
- [ ] Contract anchors read
- [ ] Verification run or exception recorded
- [ ] Evidence saved or summarized
- [ ] Review completed
