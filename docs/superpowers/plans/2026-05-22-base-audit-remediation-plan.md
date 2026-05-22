# Base Audit Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the verified findings from `docs/pantheon-base-analysis.md` and `docs/pantheon-base-audit-report.md` with security hardening, migration/versioning, targeted service decomposition, tests, and harness evidence.

**Architecture:** Treat this as five independent remediation lanes. Security and database changes go first because later refactors depend on stable behavior and schema. Service decomposition is behavior-preserving: add characterization tests, extract focused collaborators, keep existing route and DTO contracts stable.

**Tech Stack:** Go, Gin, GORM, MySQL, Redis, Casbin, React, TypeScript, Vite, Playwright, GitHub Actions, Harness Engineering evidence artifacts.

---

## Scope

### In

- Fix confirmed security baseline gaps: CORS, secure cookies, CSRF comparison, request body limit, operation-token replay scope, secret examples, and secret scanning gates.
- Add migration/versioning baseline for schema changes.
- Add missing database indexes for hot audit/session queries through migrations.
- Split the largest backend service files in controlled, test-backed increments.
- Add handler tests for auth and IAM user security-sensitive paths.
- Add harness task packet, command evidence, and review artifact for the remediation.

### Out

- Moving `go.mod` into `backend/`.
- Large frontend physical module migration to `system/iam`, `system/org`, `system/config`.
- Reorganizing all docs directories.
- Full repository-wide logger replacement beyond security/audit hot paths.
- Any rewrite that changes public API routes or response envelope shape.

## Cross-Validation Decisions

| Finding | Decision |
|---|---|
| CORS origin reflection | Confirmed, fix in Batch 1 |
| Cookie `Secure: false` | Confirmed, fix in Batch 1 |
| Default secrets | Confirmed, keep dev fallback but make docs/gates safe and production explicit |
| Big service files | Confirmed as meaningful P1, execute as dedicated decomposition lane |
| Missing CI/CD | Rejected, workflows already exist |
| Frontend no tests | Downgraded, Playwright smoke exists; component tests are future work |
| Missing DB migration | Confirmed, fix in Batch 2 |
| Missing log indexes | Confirmed for init SQL/hot-path migration, fix in Batch 2 |
| Empty `backend/modules/system/menu/` | Confirmed low-risk cleanup, optional in Batch 5 |

## Target File Structure

### Harness Artifacts

- Create: `docs/harness/tasks/2026-05-22-base-audit-remediation.task.md`
- Create: `.harness/evidence/2026-05-22-base-audit-remediation/commands.json`
- Create: `.harness/evidence/2026-05-22-base-audit-remediation/summary.md`
- Create: `.harness/evidence/2026-05-22-base-audit-remediation/review.md`

### Security

- Modify: `backend/internal/middleware/cors_middleware.go`
- Modify: `backend/internal/middleware/csrf_middleware.go`
- Modify: `backend/internal/middleware/secure_action_middleware.go`
- Modify: `backend/internal/middleware/operation_log_middleware.go`
- Modify: `backend/pkg/common/cookie.go`
- Modify: `backend/pkg/common/jwt.go`
- Modify: `backend/pkg/common/security_config.go`
- Modify: `backend/cmd/server/main.go`
- Modify: `README.md`
- Modify: `README.en.md`
- Modify: `.github/workflows/security.yml`

### Database And Migrations

- Create: `database/migrations/000001_baseline_schema.up.sql`
- Create: `database/migrations/000001_baseline_schema.down.sql`
- Create: `database/migrations/000002_audit_session_indexes.up.sql`
- Create: `database/migrations/000002_audit_session_indexes.down.sql`
- Modify: `docs/designs/DATABASE.md`
- Modify: `docs/designs/DATABASE.en.md`

### Auth Service Decomposition

- Modify: `backend/modules/auth/auth_service.go`
- Create: `backend/modules/auth/session_service.go`
- Create: `backend/modules/auth/login_log_service.go`
- Create: `backend/modules/auth/security_policy_service.go`
- Create: `backend/modules/auth/mfa_service.go`
- Create: `backend/modules/auth/preferences_service.go`
- Modify: `backend/modules/auth/auth_service_test.go`
- Create: `backend/modules/auth/auth_handler_test.go`

### I18n/User/Dept/Dict Decomposition

- Modify: `backend/modules/system/i18n/i18n_service.go`
- Create: `backend/modules/system/i18n/i18n_lifecycle_service.go`
- Create: `backend/modules/system/i18n/i18n_diagnostics_service.go`
- Create: `backend/modules/system/i18n/i18n_builtin_service.go`
- Modify: `backend/modules/system/iam/user/user_service.go`
- Create: `backend/modules/system/iam/user/user_role_service.go`
- Create: `backend/modules/system/iam/user/user_password_service.go`
- Create: `backend/modules/system/iam/user/user_import_export_service.go`
- Create: `backend/modules/system/iam/user/user_handler_test.go`
- Modify: `backend/modules/system/org/dept/dept_service.go`
- Create: `backend/modules/system/org/dept/dept_tree_service.go`
- Create: `backend/modules/system/org/dept/dept_governance_service.go`
- Modify: `backend/modules/system/config/dict/dict_service.go`
- Create: `backend/modules/system/config/dict/dict_type_service.go`
- Create: `backend/modules/system/config/dict/dict_item_service.go`

---

## Batch 0: Harness Task Packet

**Files:**
- Create: `docs/harness/tasks/2026-05-22-base-audit-remediation.task.md`
- Create later during execution: `.harness/evidence/2026-05-22-base-audit-remediation/*`

- [ ] **Step 1: Create the task packet**

Use this content:

```markdown
# Task Packet: base-audit-remediation

## Goal

Close verified audit findings from `docs/pantheon-base-analysis.md` and `docs/pantheon-base-audit-report.md` without broad unrelated rewrites.

## Primary Layer

platform

## Dependency Layers

- system/auth
- system/iam
- system/org
- system/config
- system/audit

## Contract Anchors

- `docs/contracts/PLATFORM_CONTRACT.md`
- `docs/contracts/SYSTEM_AUTH_CONTRACT.md`
- `docs/contracts/SYSTEM_IAM_CONTRACT.md`
- `docs/contracts/SYSTEM_ORG_CONTRACT.md`
- `docs/contracts/SYSTEM_CONFIG_CONTRACT.md`
- `docs/designs/DATABASE.md`
- `docs/acceptances/CODE_REVIEW_STANDARD.md`

## Scope

### In

- Security baseline hardening
- Database migration baseline and hot indexes
- Auth/i18n/user/dept/dict service decomposition
- Auth and user handler tests
- Harness evidence and review closure

### Out

- Moving `go.mod`
- Full frontend module physical migration
- Full docs directory restructuring
- Public route or response-envelope changes

## Verification Plan

- `go test ./...`
- `cd frontend && cmd /c npm run build`
- `cd frontend && cmd /c npm run test:smoke:system:api`
- `go run github.com/zricethezav/gitleaks/v8@latest detect --source . --redact`
- Migration dry-run against local MySQL or recorded exception

## Evidence Required

- command result summary
- migration command result or exception
- security gate result
- test result summary
- review summary
```

- [ ] **Step 2: Commit the task packet**

Run:

```powershell
git add docs/harness/tasks/2026-05-22-base-audit-remediation.task.md
git commit -m "docs: add base audit remediation task packet"
```

Expected: one docs-only commit.

---

## Batch 1: Security Baseline

### Task 1.1: CORS Whitelist

**Files:**
- Modify: `backend/internal/middleware/cors_middleware.go`
- Test: create or update `backend/internal/middleware/cors_middleware_test.go`

- [ ] **Step 1: Add failing tests**

Test cases:

- allowed origin gets echoed
- disallowed origin gets no `Access-Control-Allow-Origin`
- empty origin gets no CORS allow header
- OPTIONS still returns 204

Run:

```powershell
go test ./backend/internal/middleware -run TestCORSMiddleware -count=1
```

Expected: fail before implementation.

- [ ] **Step 2: Implement environment-driven whitelist**

Behavior:

- Read `PANTHEON_CORS_ALLOWED_ORIGINS`.
- Split by comma.
- Permit exact matches only.
- If unset, allow local dev origins only: `http://localhost:5173`, `http://127.0.0.1:5173`.
- Keep credentials true only for allowed origins.

- [ ] **Step 3: Verify**

Run:

```powershell
go test ./backend/internal/middleware -run TestCORSMiddleware -count=1
go test ./...
```

Expected: pass.

### Task 1.2: Secure Cookies

**Files:**
- Modify: `backend/pkg/common/cookie.go`
- Test: create or update `backend/pkg/common/cookie_test.go`

- [ ] **Step 1: Add failing tests**

Test cases:

- production env sets `Secure=true`
- non-production keeps local HTTP usable
- token cookies are HttpOnly
- CSRF cookie is not HttpOnly

Run:

```powershell
go test ./backend/pkg/common -run TestTokenCookieSecurity -count=1
```

- [ ] **Step 2: Implement environment-aware secure flag**

Use existing `common.IsProductionEnv()`.

Expected behavior:

- `Secure=true` in production.
- `SameSite=Strict` remains.
- Add `PANTHEON_COOKIE_SECURE=true|false` override only if needed for deployed non-production HTTPS environments.

- [ ] **Step 3: Verify**

Run:

```powershell
go test ./backend/pkg/common -count=1
```

### Task 1.3: CSRF Constant-Time Compare

**Files:**
- Modify: `backend/internal/middleware/csrf_middleware.go`
- Test: create or update `backend/internal/middleware/csrf_middleware_test.go`

- [ ] **Step 1: Add test for equal and unequal tokens**

Run:

```powershell
go test ./backend/internal/middleware -run TestCSRFMiddleware -count=1
```

- [ ] **Step 2: Replace string comparison**

Use:

```go
subtle.ConstantTimeCompare([]byte(csrfCookie), []byte(csrfHeader)) == 1
```

Only compare after checking both strings are non-empty and same length.

- [ ] **Step 3: Verify**

Run:

```powershell
go test ./backend/internal/middleware -run TestCSRFMiddleware -count=1
```

### Task 1.4: Operation Token Scope And Replay Control

**Files:**
- Modify: `backend/pkg/common/jwt.go`
- Modify: `backend/modules/auth/auth_service.go`
- Modify: `backend/internal/middleware/secure_action_middleware.go`
- Test: `backend/internal/middleware/secure_action_middleware_test.go`
- Test: `backend/modules/auth/auth_service_test.go`

- [ ] **Step 1: Add failing tests**

Test cases:

- operation token for `/system/user/reset-password` cannot be used on `/system/role`.
- operation token with wrong method fails.
- token with reused nonce fails when Redis is available.
- without Redis, scope/method/session/user checks still protect the request.

Run:

```powershell
go test ./backend/internal/middleware -run TestSecureActionMiddleware -count=1
go test ./backend/modules/auth -run TestAuthService_OperationToken -count=1
```

- [ ] **Step 2: Add operation claims**

Add claims:

- `OperationScope`
- `OperationMethod`
- `OperationPath`
- `Nonce`

Generate token for the requested operation, not generic `secure_action`.

- [ ] **Step 3: Enforce in middleware**

Middleware must compare:

- current user id
- current session id
- request method
- request path or route pattern
- optional Redis nonce one-time consume

- [ ] **Step 4: Verify**

Run:

```powershell
go test ./backend/internal/middleware ./backend/modules/auth -count=1
```

### Task 1.5: Request Body Limit And Graceful Shutdown

**Files:**
- Modify: `backend/cmd/server/main.go`
- Test: create `backend/cmd/server/main_test.go` if practical, otherwise verify with package tests and manual evidence.

- [ ] **Step 1: Extract server setup**

Create a function:

```go
func buildRouter(db *gorm.DB) *gin.Engine
```

Keep current route registration behavior unchanged.

- [ ] **Step 2: Add body size middleware**

Use configurable `PANTHEON_MAX_BODY_BYTES`, default `10485760`.

Return `413` for oversized requests.

- [ ] **Step 3: Replace `r.Run` with `http.Server`**

Handle `SIGINT` and `SIGTERM`.

Use `Shutdown(ctx)` with 10 second timeout.

- [ ] **Step 4: Verify**

Run:

```powershell
go test ./backend/cmd/server ./...
```

### Task 1.6: Secret Examples And Blocking Secret Gate

**Files:**
- Modify: `README.md`
- Modify: `README.en.md`
- Modify: `.github/workflows/security.yml`

- [ ] **Step 1: Replace concrete credentials**

Replace DSN and Redis password examples with placeholders:

```powershell
$env:PANTHEON_DSN='pantheon_user:<password>@tcp(127.0.0.1:3306)/pantheon_base?charset=utf8mb4&parseTime=True&loc=Local'
$env:PANTHEON_REDIS_PASSWORD='<redis-password>'
```

- [ ] **Step 2: Make gitleaks blocking for PRs**

In `security.yml`, keep report jobs if desired, but add a blocking step:

```yaml
- name: Block leaked secrets
  run: go run github.com/zricethezav/gitleaks/v8@latest detect --source . --redact --exit-code 1
```

Do not set `continue-on-error` for the blocking step.

- [ ] **Step 3: Verify**

Run:

```powershell
go run github.com/zricethezav/gitleaks/v8@latest detect --source . --redact
```

Expected: exit code 0.

---

## Batch 2: Migrations And Hot Indexes

### Task 2.1: Add Migration Baseline

**Files:**
- Create: `database/migrations/000001_baseline_schema.up.sql`
- Create: `database/migrations/000001_baseline_schema.down.sql`
- Modify: `docs/designs/DATABASE.md`
- Modify: `docs/designs/DATABASE.en.md`

- [ ] **Step 1: Create baseline migration**

Copy the current schema creation parts from `database/system_init.sql` into `000001_baseline_schema.up.sql`.

Keep seed data out of baseline unless it is required for a blank database boot.

- [ ] **Step 2: Create explicit down migration**

Drop tables in dependency-safe reverse order.

- [ ] **Step 3: Document migration workflow**

Add exact commands to `DATABASE.md`:

```powershell
go install github.com/golang-migrate/migrate/v4/cmd/migrate@latest
migrate -path database/migrations -database "$env:PANTHEON_DSN" up
migrate -path database/migrations -database "$env:PANTHEON_DSN" down 1
```

- [ ] **Step 4: Verify**

Run migration against a disposable local database or record an exception in harness evidence.

### Task 2.2: Add Audit And Session Index Migration

**Files:**
- Create: `database/migrations/000002_audit_session_indexes.up.sql`
- Create: `database/migrations/000002_audit_session_indexes.down.sql`
- Modify: `database/system_init.sql`

- [ ] **Step 1: Add up migration**

Indexes:

```sql
ALTER TABLE system_log_login ADD INDEX idx_system_log_login_time (login_time);
ALTER TABLE system_log_login ADD INDEX idx_system_log_login_username_time (username, login_time);
ALTER TABLE system_log_login ADD INDEX idx_system_log_login_status_time (status, login_time);

ALTER TABLE system_log_oper ADD INDEX idx_system_log_oper_time (oper_time);
ALTER TABLE system_log_oper ADD INDEX idx_system_log_oper_name_time (oper_name, oper_time);
ALTER TABLE system_log_oper ADD INDEX idx_system_log_oper_business_time (business_type, oper_time);

ALTER TABLE system_user_session ADD INDEX idx_system_user_session_user_status (user_id, revoked_at, refresh_expires_at);
ALTER TABLE system_user_session ADD INDEX idx_system_user_session_activity (last_activity_at);
```

- [ ] **Step 2: Add down migration**

Drop exactly the indexes created above.

- [ ] **Step 3: Mirror indexes into init SQL**

Update `database/system_init.sql` so fresh installs match migrations.

- [ ] **Step 4: Verify**

Run:

```powershell
go test ./backend/modules/system/audit ./backend/modules/auth -count=1
```

---

## Batch 3: Auth Service Decomposition

### Task 3.1: Add Auth Handler Characterization Tests

**Files:**
- Create: `backend/modules/auth/auth_handler_test.go`
- Modify: `backend/modules/auth/auth_service_test.go`

- [ ] **Step 1: Add handler tests before refactor**

Cover:

- login success without MFA
- login returns MFA challenge when MFA enabled
- MFA verify returns token pair
- session revoke requires authenticated user
- operation token endpoint returns scoped token

Run:

```powershell
go test ./backend/modules/auth -run "TestAuthHandler|TestAuthService" -count=1
```

Expected: pass before extraction.

### Task 3.2: Extract Session Lifecycle

**Files:**
- Create: `backend/modules/auth/session_service.go`
- Modify: `backend/modules/auth/auth_service.go`
- Test: `backend/modules/auth/auth_service_test.go`

- [ ] **Step 1: Move session-only methods**

Move:

- create session
- revoke session
- list current sessions
- admin list sessions
- cleanup expired/idle/historic sessions
- enforce max active sessions

- [ ] **Step 2: Keep AuthService facade**

Existing handler calls should still compile. `AuthService` may delegate to `SessionService`.

- [ ] **Step 3: Verify**

Run:

```powershell
go test ./backend/modules/auth -run Session -count=1
go test ./backend/modules/auth -count=1
```

### Task 3.3: Extract Login Logs And Security Policy

**Files:**
- Create: `backend/modules/auth/login_log_service.go`
- Create: `backend/modules/auth/security_policy_service.go`
- Modify: `backend/modules/auth/auth_service.go`
- Test: `backend/modules/auth/auth_service_test.go`

- [ ] **Step 1: Move login log methods**

Move:

- record login log
- list login logs
- delete login logs
- cleanup login logs
- login-log export preparation if present

- [ ] **Step 2: Move policy methods**

Move:

- password policy loading
- login lockout policy
- source throttling policy
- session idle/max-active settings

- [ ] **Step 3: Verify**

Run:

```powershell
go test ./backend/modules/auth -run "LoginLog|Policy|Throttle|Password" -count=1
```

### Task 3.4: Extract MFA And Preferences

**Files:**
- Create: `backend/modules/auth/mfa_service.go`
- Create: `backend/modules/auth/preferences_service.go`
- Modify: `backend/modules/auth/auth_service.go`
- Test: `backend/modules/auth/auth_service_test.go`
- Test: `backend/modules/auth/preferences_contract_test.go`

- [ ] **Step 1: Move MFA methods**

Move:

- TOTP challenge creation
- first-time binding
- MFA verification
- MFA secret encryption calls

- [ ] **Step 2: Move preference methods**

Move current-user preference read/write logic.

- [ ] **Step 3: Verify**

Run:

```powershell
go test ./backend/modules/auth -run "MFA|Preferences|Login" -count=1
```

---

## Batch 4: Other Large Service Decomposition

### Task 4.1: I18n Service Split

**Files:**
- Create: `backend/modules/system/i18n/i18n_lifecycle_service.go`
- Create: `backend/modules/system/i18n/i18n_diagnostics_service.go`
- Create: `backend/modules/system/i18n/i18n_builtin_service.go`
- Modify: `backend/modules/system/i18n/i18n_service.go`
- Test: `backend/modules/system/i18n/i18n_service_test.go`

- [ ] **Step 1: Run current tests**

```powershell
go test ./backend/modules/system/i18n -count=1
```

- [ ] **Step 2: Extract lifecycle/archive logic**

Move archive, cleanup, delete archived unused keys, lifecycle status changes.

- [ ] **Step 3: Extract diagnostics logic**

Move missing key detection, module diagnostics, rename preview.

- [ ] **Step 4: Extract builtin resource sync**

Move builtin locale resource loading and sync.

- [ ] **Step 5: Verify**

```powershell
go test ./backend/modules/system/i18n -count=1
```

### Task 4.2: User Service Split And Handler Tests

**Files:**
- Create: `backend/modules/system/iam/user/user_role_service.go`
- Create: `backend/modules/system/iam/user/user_password_service.go`
- Create: `backend/modules/system/iam/user/user_import_export_service.go`
- Create: `backend/modules/system/iam/user/user_handler_test.go`
- Modify: `backend/modules/system/iam/user/user_service.go`

- [ ] **Step 1: Add user handler tests**

Cover:

- create user parameter binding
- password policy failure response
- role assignment response
- reset password requires correct permission path setup
- list query binds page and filters

- [ ] **Step 2: Extract role assignment logic**

Move get/set user roles and permission-derived helpers.

- [ ] **Step 3: Extract password logic**

Move reset password, change password policy checks, password history if present.

- [ ] **Step 4: Extract import/export logic**

Move CSV template/import/export methods.

- [ ] **Step 5: Verify**

```powershell
go test ./backend/modules/system/iam/user -count=1
```

### Task 4.3: Dept And Dict Service Split

**Files:**
- Create: `backend/modules/system/org/dept/dept_tree_service.go`
- Create: `backend/modules/system/org/dept/dept_governance_service.go`
- Modify: `backend/modules/system/org/dept/dept_service.go`
- Create: `backend/modules/system/config/dict/dict_type_service.go`
- Create: `backend/modules/system/config/dict/dict_item_service.go`
- Modify: `backend/modules/system/config/dict/dict_service.go`

- [ ] **Step 1: Run current tests**

```powershell
go test ./backend/modules/system/org/dept ./backend/modules/system/config/dict -count=1
```

- [ ] **Step 2: Extract dept tree logic**

Move tree build, ancestor/path, recursive child lookup.

- [ ] **Step 3: Extract dept governance logic**

Move governance summary, leader/member/post constraints.

- [ ] **Step 4: Extract dict type and item logic**

Split type CRUD/cache from item CRUD/reorder/usage.

- [ ] **Step 5: Verify**

```powershell
go test ./backend/modules/system/org/dept ./backend/modules/system/config/dict -count=1
```

---

## Batch 5: CI, Cleanup, And Evidence Closure

### Task 5.1: CI Coverage Alignment

**Files:**
- Modify: `.github/workflows/quality.yml`
- Modify: `.github/workflows/security.yml`

- [ ] **Step 1: Add docs and harness checks where cheap**

Add:

```yaml
- name: Check docs frontmatter
  run: npm run check:docs-frontmatter
```

Add frontend prebuild checks are already included by `npm run build`; do not duplicate all Playwright smoke in PR by default.

- [ ] **Step 2: Keep Playwright smoke manual or nightly**

If CI time is acceptable, add a scheduled smoke job. Otherwise record the decision in the harness review.

### Task 5.2: Low-Risk Cleanup

**Files:**
- Delete empty directory: `backend/modules/system/menu/`
- Modify: `AGENTS.md`
- Modify: `DESIGN.md`

- [ ] **Step 1: Remove empty menu directory**

Only remove if still empty.

- [ ] **Step 2: Fix numbering gap**

Renumber item `44` to the correct sequence in both `AGENTS.md` and `DESIGN.md`, or add a note explaining historical numbering if stable references depend on it.

- [ ] **Step 3: Verify**

Run:

```powershell
npm run check:docs-frontmatter
```

### Task 5.3: Evidence And Review Closure

**Files:**
- Create: `.harness/evidence/2026-05-22-base-audit-remediation/commands.json`
- Create: `.harness/evidence/2026-05-22-base-audit-remediation/summary.md`
- Create: `.harness/evidence/2026-05-22-base-audit-remediation/review.md`

- [ ] **Step 1: Run final verification**

Run:

```powershell
go test ./...
cd frontend
cmd /c npm run build
cmd /c npm run test:smoke:system:api
cd ..
go run github.com/zricethezav/gitleaks/v8@latest detect --source . --redact
```

- [ ] **Step 2: Record commands**

Write each command, cwd, pass/fail status, duration if known, and notes into `commands.json`.

- [ ] **Step 3: Write summary**

Include:

- fixed findings
- downgraded or deferred findings
- migration status
- tests run
- known gaps

- [ ] **Step 4: Write review**

Include:

- behavior risks from refactors
- security residual risks
- DB migration rollback notes
- open follow-ups

---

## Parallelization Strategy

| Lane | Scope | Modules touched | Depends on |
|---|---|---|---|
| A | Security baseline | `backend/internal/middleware`, `backend/pkg/common`, `backend/cmd/server`, `.github` | Batch 0 |
| B | Migrations/indexes | `database`, `docs/designs/DATABASE*` | Batch 0 |
| C | Auth decomposition | `backend/modules/auth` | Batch 1 security token decisions |
| D | I18n/User decomposition | `backend/modules/system/i18n`, `backend/modules/system/iam/user` | Batch 0 |
| E | Dept/Dict decomposition | `backend/modules/system/org/dept`, `backend/modules/system/config/dict` | Batch 0 |
| F | Evidence closure | `.harness/evidence`, docs | A+B+C+D+E |

Recommended execution:

- Launch A and B first.
- Launch D and E in parallel after Batch 0 if no one is touching shared test setup.
- Start C after Task 1.4 operation-token decisions land.
- Run F only after all code lanes merge.

Conflict flags:

- Lane A and C both touch `backend/modules/auth` if operation token generation is inside auth service. Coordinate Task 1.4 before C.
- Lane B and any model-level migration additions may touch schema docs. Keep migration docs in Lane B.

## Verification Matrix

| Area | Command | Required |
|---|---|---|
| Backend all | `go test ./...` | yes |
| Auth | `go test ./backend/modules/auth -count=1` | yes |
| Middleware | `go test ./backend/internal/middleware -count=1` | yes |
| I18n | `go test ./backend/modules/system/i18n -count=1` | yes |
| User | `go test ./backend/modules/system/iam/user -count=1` | yes |
| Dept/Dict | `go test ./backend/modules/system/org/dept ./backend/modules/system/config/dict -count=1` | yes |
| Frontend build | `cd frontend && cmd /c npm run build` | yes |
| API smoke | `cd frontend && cmd /c npm run test:smoke:system:api` | yes |
| Secret scan | `go run github.com/zricethezav/gitleaks/v8@latest detect --source . --redact` | yes |
| Migration | `migrate -path database/migrations -database "$env:PANTHEON_DSN" up` | yes or documented exception |

## Completion Criteria

- All Batch 1 security tests pass.
- Migration baseline and index migration exist with documented rollback.
- `auth_service.go`, `i18n_service.go`, `user_service.go`, `dept_service.go`, and `dict_service.go` have each lost a meaningful responsibility to focused files without public API changes.
- Auth and user handler tests exist.
- CI contains a blocking secret scan path.
- Harness evidence and review artifacts exist and summarize final verification.

## Deferred Follow-Ups

- Frontend physical module migration into `system/iam`, `system/org`, `system/config`.
- Component-level frontend tests with Vitest.
- Full structured logger replacement.
- `go.mod` relocation.
- Docs directory taxonomy migration.
