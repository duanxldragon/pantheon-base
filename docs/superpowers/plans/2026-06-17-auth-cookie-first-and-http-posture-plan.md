# Auth Cookie-First And HTTP Posture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `pantheon-base` browser auth truly cookie-first and replace permissive reflected CORS with allowlisted CORS plus minimal security response headers.

**Architecture:** Tighten the runtime contract at the `system/auth` boundary instead of scattering fixes across consumers. Browser-facing auth responses stop returning raw JWTs, frontend state keeps only a logged-in placeholder plus user snapshot, and middleware moves HTTP posture into explicit platform controls: origin allowlist evaluation and a dedicated security-header middleware.

**Tech Stack:** Go, Gin, TypeScript, Zustand, existing auth tests, existing workflow/test harness.

---

## Requirements Summary

- Browser login / MFA / refresh responses must not expose access or refresh tokens in JSON payloads.
- Frontend runtime must stop depending on response-body tokens for login persistence and refresh retries.
- Reflected credentialed CORS must be replaced with allowlist-based behavior.
- Minimal security response headers must be set by application middleware.
- Changes land in `pantheon-base` first; `pantheon-ops` inherits later.

## Acceptance Criteria

- `backend/modules/auth` tests assert token fields are absent from browser auth success payloads.
- `frontend` login and refresh logic no longer requires body tokens to stay authenticated.
- CORS tests prove unknown origins are not granted credentialed access.
- Middleware tests prove required security headers are present.
- Targeted backend and frontend tests pass.

## Implementation Steps

### Task 1: Lock the new auth response contract with failing backend tests

**Files:**
- Modify: `backend/modules/auth/auth_handler_test.go`
- Modify: `backend/modules/auth/smoke_test.go`
- Optional: `backend/modules/auth/auth_dto.go`

- [ ] **Step 1: Write failing tests for login, MFA, and refresh payloads**

Add assertions that success payloads no longer expose `token`, `accessToken`, or `refreshToken`, while cookies and CSRF header/cookie behavior remain intact.

- [ ] **Step 2: Run the focused auth tests and confirm failure**

Run: `go test ./backend/modules/auth -run "Write(Login|MFA|Refresh)|Smoke_(LoginFlowSetsHttpOnlyCSRFCookieAndHeader|RefreshFlowReissuesCSRFCookieAndHeader)" -count=1`

Expected: tests fail because token fields are still present in JSON responses.

### Task 2: Implement cookie-first auth responses

**Files:**
- Modify: `backend/modules/auth/auth_handler.go`
- Modify: `backend/modules/auth/auth_dto.go`
- Modify: `frontend/src/modules/auth/api.ts`
- Modify: `frontend/src/modules/auth/Login.tsx`
- Modify: `frontend/src/api/request.ts`
- Modify: `frontend/src/store/useAuthStore.ts`
- Modify: `frontend/src/core/auth/bootstrap.ts`
- Modify: `frontend/src/core/auth/sessionSnapshot.ts`

- [ ] **Step 1: Remove token exposure from browser auth success payloads**

Keep cookie-setting and CSRF issuance unchanged, but return only session metadata and user payload to the browser.

- [ ] **Step 2: Update frontend runtime to use placeholder auth state**

Login and refresh should mark auth state as active without storing real JWTs from response bodies.

- [ ] **Step 3: Run focused backend and frontend auth tests**

Run:

`go test ./backend/modules/auth -count=1`

`node --test frontend/tests/api/auth-session-snapshot.test.ts`

Expected: auth contract tests pass with no token body dependency.

### Task 3: Lock the platform HTTP posture with failing middleware tests

**Files:**
- Create: `backend/internal/middleware/cors_middleware_test.go`
- Create: `backend/internal/middleware/security_headers_middleware.go`
- Create: `backend/internal/middleware/security_headers_middleware_test.go`
- Modify: `backend/cmd/server/main.go`

- [ ] **Step 1: Write failing CORS and security-header tests**

Test two cases:

1. unknown origin does not receive `Access-Control-Allow-Origin` or credentialed CORS
2. allowed origin receives the expected CORS headers
3. every response includes `X-Content-Type-Options`, `X-Frame-Options`, and `Referrer-Policy`

- [ ] **Step 2: Run focused middleware tests and confirm failure**

Run: `go test ./backend/internal/middleware -run "CORS|SecurityHeaders" -count=1`

Expected: tests fail because current middleware reflects any origin and no security-header middleware exists.

### Task 4: Implement allowlisted CORS and security headers

**Files:**
- Modify: `backend/internal/middleware/cors_middleware.go`
- Create: `backend/internal/middleware/security_headers_middleware.go`
- Modify: `backend/cmd/server/main.go`
- Optional: `README.md` or `SECURITY.md` if environment-variable behavior needs explicit operator guidance

- [ ] **Step 1: Add origin allowlist parsing and evaluation**

Use an environment variable such as `PANTHEON_ALLOWED_ORIGINS`, include sane local defaults, and keep same-origin / no-origin requests working.

- [ ] **Step 2: Add a dedicated security-header middleware**

Set:

`X-Content-Type-Options: nosniff`

`X-Frame-Options: DENY`

`Referrer-Policy: strict-origin-when-cross-origin`

- [ ] **Step 3: Register the middleware in the server bootstrap**

Mount security headers before auth-sensitive handlers and keep the existing body-size / request-context / CSRF chain intact.

- [ ] **Step 4: Re-run focused middleware tests**

Run: `go test ./backend/internal/middleware -count=1`

Expected: CORS and security-header tests pass.

### Task 5: Document residual risk and inheritance handoff

**Files:**
- Modify: `docs/contracts/SYSTEM_AUTH_CONTRACT.md`
- Modify: `SECURITY.md`
- Optional: `README.md`

- [ ] **Step 1: Update auth contract wording**

Document that browser runtime is cookie-first and raw JWTs are not part of the frontend contract.

- [ ] **Step 2: Update security policy wording**

Document CORS allowlist responsibility and note that CSP / HSTS remain deployment follow-up items if they are not enforced in this patch.

## Risks and Mitigations

- Risk: existing smoke helpers depend on response-body tokens.
  - Mitigation: keep them out of the runtime contract and convert them to cookie-derived or explicit test-only helpers in a follow-up slice if needed.
- Risk: local dev breaks because secure cookie and allowlist assumptions differ by environment.
  - Mitigation: keep local origins in the default allowlist and preserve existing cookie behavior for now.
- Risk: frontend silently falls out of authenticated state after refresh.
  - Mitigation: keep placeholder session bootstrapping plus `auth/me` hydration and cover the refresh path in targeted tests.

## Verification Steps

- `go test ./backend/modules/auth -count=1`
- `go test ./backend/internal/middleware -count=1`
- `node --test frontend/tests/api/auth-session-snapshot.test.ts`
- Optional if frontend auth code changed materially: `cd frontend && npm run build`
