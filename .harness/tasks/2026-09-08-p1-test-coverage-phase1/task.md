# Task Packet: P1 Test Coverage Phase 1 - Core Security Modules

## Goal

Increase test coverage of core security modules (auth, iam, audit) from current baseline to 60%+ to establish safety net for critical business logic.

## Priority

**P1 - High** (Quality foundation)

## Source

Cross-Review Report: Section 2.4 (Test Coverage) - "整体测试覆盖率仅12.2%，核心模块需优先提升至60%+"

DeepSeek Report: "建议把测试覆盖率提升列为第一优先级，6个月内存量代码覆盖率提升到40-50%，优先覆盖auth、iam、config、审计等高风险域"

## Primary Layer

backend/modules/{auth,system/{iam,audit}}

## Dependency Layers

- go-testing
- backend-services
- backend-repositories

## Harness Profile

- Template: test-coverage-improvement
- Coverage Dimensions:
  - unit-test-coverage
  - critical-path-coverage
  - regression-prevention
- Quality Profile: test-baseline
- Portable Failure Class: quality-debt
- Owner Layer: backend testing infrastructure
- Ratchet Decision: coverage-increase (11% → 30% → 60%)
- Delivery Governance: Phase 1 of 3-phase coverage improvement plan
- GitHub Signal: Coverage gate raised to 30% after completion

## Scope

### In

Phase 1 Target Modules (1 month):
- `backend/modules/auth/*`: Authentication, session, login logs
- `backend/modules/system/iam/*`: User, role, permission services
- `backend/modules/system/audit/*`: Operation logs, audit trails

Unit tests for:
- Service layer business logic
- Repository layer data access
- Critical security validations
- Error handling paths

### Out

- Integration tests (separate task)
- E2E smoke tests (already exist)
- Frontend tests (separate track)
- Non-critical utility functions
- Mock/fixture infrastructure overhaul

## Assumptions and Open Questions

**Current State** (from CHANGELOG):
- Overall coverage: 12.2%
- Coverage gate: 11% (prevent regression)
- New code standard: 80%
- Existing test files: 86 backend Go tests

**Assumptions**:
- Existing tests are passing
- Coverage tool: `go test -cover`
- CI already runs coverage checks

**Open Questions**:
1. Are there existing mocks for external dependencies?
2. Which specific functions have zero coverage?
3. Are there integration test requirements?

## Minimum Viable Approach

**Phase 1 Strategy** (1 month timeline):

Week 1: Analysis & Infrastructure
- Run coverage report: `go test -coverprofile=coverage.out ./...`
- Generate HTML report: `go tool cover -html=coverage.out`
- Identify zero-coverage critical functions
- Set up test fixtures/mocks if needed

Week 2-3: Core Security Modules
- Auth module: Login, refresh, logout, password validation, session management
- IAM module: Role assignment, permission checks, Casbin policy updates
- Audit module: Log recording, sensitive data masking

Week 4: Verification & Documentation
- Verify coverage increase (target: auth 60%, iam 50%, audit 50%)
- Update CI coverage threshold from 11% to 30%
- Document uncovered edge cases for Phase 2

## Success Criteria

**Coverage Targets** (Phase 1):
- `backend/modules/auth/*`: 60%+ (from ~20-30% estimated)
- `backend/modules/system/iam/*`: 50%+ (from ~15-25% estimated)
- `backend/modules/system/audit/*`: 50%+ (from ~10-20% estimated)
- Overall backend: 30%+ (from 12.2%)

**Quality Gates**:
- All new tests pass: `go test ./...`
- No existing tests broken
- Coverage reports generated and documented
- CI threshold updated to 30%
- Coverage badge updated in README

## Contract Anchors

- Cross-Review Report Section 2.4 (Test Coverage)
- `CHANGELOG.md` (coverage baseline: 12.2%)
- `scripts/harness/check-coverage.mjs` (coverage gate)
- Backend test conventions (if documented)

## Expected Files

### Create

- backend/modules/auth/auth_service_test.go (expand existing)
- backend/modules/auth/session_service_test.go (expand existing)
- backend/modules/auth/password_service_test.go (new)
- backend/modules/system/iam/role_service_test.go (expand)
- backend/modules/system/iam/permission_service_test.go (expand)
- backend/modules/system/audit/audit_service_test.go (expand)
- .harness/tasks/2026-09-08-p1-test-coverage-phase1/task.md
- .harness/tasks/2026-09-08-p1-test-coverage-phase1/manifest.json
- .harness/tasks/2026-09-08-p1-test-coverage-phase1/coverage-analysis.md
- .harness/evidence/2026-09-08-p1-test-coverage-phase1/coverage-before.html
- .harness/evidence/2026-09-08-p1-test-coverage-phase1/coverage-after.html
- .harness/evidence/2026-09-08-p1-test-coverage-phase1/test-summary.md

### Modify

- scripts/harness/check-coverage.mjs (raise threshold: 11% → 30%)
- README.md (update coverage badge if exists)
- Existing *_test.go files (expand coverage)

### Do Not Touch

- Production code logic (except fixing bugs discovered by tests)
- Frontend code
- Database migrations
- CI workflow files (unless updating threshold)

## Structural Scope

- Affected Subgraph: Test suite → Service layer → Repository layer
- Boundary Crossings: Test fixtures → Business logic → Data layer
- Risk Nodes: Over-mocking may hide integration issues
- Graph Focus: Unit test coverage, not integration testing

## Implementation Notes

**Test Writing Priorities**:

1. **Auth Module Critical Paths**:
   - Login success/failure
   - Password validation (bcrypt, history check)
   - Token generation/refresh/revocation
   - Session expiration handling
   - MFA/TOTP validation

2. **IAM Module Critical Paths**:
   - Role creation/update/deletion
   - Permission assignment
   - Casbin policy generation
   - Role-menu binding
   - Permission checking logic

3. **Audit Module Critical Paths**:
   - Operation log creation
   - Sensitive data masking
   - Log filtering by user/time/action
   - Retention policy enforcement

**Example Test Structure**:

```go
// backend/modules/auth/password_service_test.go
package auth

import (
    "testing"
    "github.com/stretchr/testify/assert"
)

func TestPasswordService_ValidatePassword(t *testing.T) {
    service := NewPasswordService()
    
    t.Run("valid password", func(t *testing.T) {
        err := service.ValidatePassword("ValidPass123!")
        assert.NoError(t, err)
    })
    
    t.Run("password too short", func(t *testing.T) {
        err := service.ValidatePassword("short")
        assert.Error(t, err)
        assert.Contains(t, err.Error(), "too short")
    })
    
    t.Run("password missing uppercase", func(t *testing.T) {
        err := service.ValidatePassword("nouppercasepass123!")
        assert.Error(t, err)
    })
    
    // ... more test cases
}

func TestPasswordService_CheckPasswordHistory(t *testing.T) {
    // Test password reuse prevention
    // ...
}
```

**Coverage Analysis Commands**:

```bash
# Generate coverage profile
cd backend
go test -coverprofile=coverage.out ./modules/auth/... ./modules/system/iam/... ./modules/system/audit/...

# View coverage by package
go tool cover -func=coverage.out

# Generate HTML report
go tool cover -html=coverage.out -o coverage.html

# Get overall percentage
go test -cover ./... | grep coverage
```

## Verification Plan

### Before (Baseline)
```bash
cd backend
go test -cover ./modules/auth/... > auth-coverage-before.txt
go test -cover ./modules/system/iam/... > iam-coverage-before.txt
go test -cover ./modules/system/audit/... > audit-coverage-before.txt
```

### After (Target)
```bash
# Same commands, expect 60%/50%/50%
go test -cover ./modules/auth/...
go test -cover ./modules/system/iam/...
go test -cover ./modules/system/audit/...

# Overall backend coverage
go test -cover ./... | grep -E "coverage:|ok"
```

### CI Integration
```bash
# Update coverage threshold
# In scripts/harness/check-coverage.mjs or CI config
# OLD: COVERAGE_THRESHOLD='11'
# NEW: COVERAGE_THRESHOLD='30'
```

## Evidence Required

1. Coverage report before (HTML + summary)
2. Coverage report after (HTML + summary)
3. Test execution logs (all passing)
4. List of added test cases
5. Coverage improvement delta per module
6. CI threshold update PR

## Human Gates

- Initial coverage analysis review
- Mid-point check (week 2): auth module 60% reached
- Final review: all targets met
- Code review of test quality (not just quantity)

## Completion Checklist

- [ ] Baseline coverage documented
- [ ] Auth module: 60%+ coverage
- [ ] IAM module: 50%+ coverage
- [ ] Audit module: 50%+ coverage
- [ ] Overall backend: 30%+ coverage
- [ ] All tests passing: `go test ./...`
- [ ] No existing tests broken
- [ ] Coverage reports generated
- [ ] CI threshold updated to 30%
- [ ] Evidence documented
- [ ] README badge updated (if exists)

## Follow-up Tasks

- **Phase 2** (Month 2-3): System domain other modules (org, i18n, dict, setting) to 40%
- **Phase 3** (Month 4-6): Platform layer and lowcode to 30%, overall to 40-50%

## Estimated Effort

- Coverage analysis: 4 hours
- Auth module tests: 16 hours
- IAM module tests: 12 hours
- Audit module tests: 8 hours
- CI integration: 2 hours
- Documentation: 2 hours
- **Total: 44 hours (~1 month with 40% time allocation)**

## Linkage

- Task ID: 2026-09-08-p1-test-coverage-phase1
- Parent Report: PANTHEON_BASE_CROSS_REVIEW_REPORT.md (Section 2.4)
- Blocked By:
  - 2026-09-08-p0-security-gates-enforcement (should complete first)
  - 2026-09-08-p0-csp-hsts-implementation (should complete first)
- Blocking:
  - 2026-09-08-p1-test-coverage-phase2 (next phase)
  - Safe refactoring of core modules
- Related Tasks:
  - 2026-09-08-p1-sso-oidc-design (parallel, can start together)
- Evidence Directory: `.harness/evidence/2026-09-08-p1-test-coverage-phase1/`
- Priority: P1 (High)
- Timeline: 1 month
