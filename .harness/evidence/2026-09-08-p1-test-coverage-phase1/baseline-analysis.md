# P1-1 Test Coverage Phase 1 - Baseline Analysis

**Task ID**: 2026-09-08-p1-test-coverage-phase1  
**Status**: 🔄 IN PROGRESS - Baseline Established  
**Started At**: 2026-09-08  
**Estimated Duration**: 44 hours (1 month)

---

## Current Coverage Baseline (2026-09-08)

### Module Coverage Summary

| Module | Current Coverage | Target | Gap | Priority |
|--------|-----------------|--------|-----|----------|
| **Auth** | ~15% | 60% | +45% | **HIGH** |
| - auth (main) | 0.0% | 50% | +50% | Critical |
| - auth/login | 8.9% | 60% | +51.1% | Critical |
| - auth/mfa | 23.7% | 60% | +36.3% | High |
| - auth/security | 6.0% | 60% | +54% | Critical |
| - auth/session | 32.5% | 60% | +27.5% | Medium |
| **IAM** | ~9% | 50% | +41% | **HIGH** |
| - iam/menu | 12.8% | 50% | +37.2% | High |
| - iam/permission | 5.5% | 50% | +44.5% | Critical |
| - iam/role | 7.3% | 50% | +42.7% | Critical |
| - iam/user | 10.8% | 50% | +39.2% | Critical |
| **Audit** | 26.5% | 50% | +23.5% | **MEDIUM** |
| **Overall Backend** | 12.2% | 30% | +17.8% | Target |

### Existing Test Files

Auth module tests found:
- `modules/auth/login/*.go` (8.9% coverage)
- `modules/auth/mfa/*.go` (23.7% coverage - best in auth)
- `modules/auth/security/*.go` (6.0% coverage)
- `modules/auth/session/*.go` (32.5% coverage - best in auth)

IAM module tests found:
- `modules/system/iam/menu/*.go` (12.8% coverage - best in iam)
- `modules/system/iam/permission/*.go` (5.5% coverage)
- `modules/system/iam/role/*.go` (7.3% coverage)
- `modules/system/iam/user/*.go` (10.8% coverage)

Audit module tests found:
- `modules/system/audit/*.go` (26.5% coverage)

---

## Phase 1 Execution Plan (44 hours / 1 month)

### Week 1: Infrastructure & Analysis (4 hours)

**Day 1-2: Coverage Analysis**
- [x] Generate baseline coverage report
- [x] Identify zero-coverage critical functions
- [ ] List high-risk functions requiring tests
- [ ] Set up test fixtures/mocks

**Deliverables**:
- Baseline coverage report (this document)
- Function-level coverage analysis
- Test infrastructure assessment

### Week 2: Auth Module (16 hours)

**Target**: Auth overall 60%+ (from ~15%)

**Day 3-4: auth/security module** (6 hours)
- Password validation logic
- Password history checks
- Security event recording
- MFA enforcement logic
- Target: 60%+ coverage

**Day 5-6: auth/login module** (5 hours)
- Login flow (success/failure)
- Account lockout logic
- Login attempt recording
- Credential validation
- Target: 60%+ coverage

**Day 7-8: auth/session module** (3 hours)
- Session creation/refresh/revocation
- Token generation
- Session expiration handling
- Target: 60%+ coverage (from 32.5%)

**Day 9: auth main package** (2 hours)
- Module initialization
- Route registration
- Target: 50%+ coverage (from 0%)

### Week 3: IAM Module (12 hours)

**Target**: IAM overall 50%+ (from ~9%)

**Day 10-11: iam/role module** (4 hours)
- Role CRUD operations
- Role-menu binding
- Role-permission assignment
- Casbin policy generation
- Target: 50%+ coverage (from 7.3%)

**Day 12-13: iam/permission module** (4 hours)
- Permission CRUD
- Permission checking logic
- Resource-action mapping
- Target: 50%+ coverage (from 5.5%)

**Day 14: iam/user module** (2 hours)
- User service business logic
- User-role assignment
- Password change workflows
- Target: 50%+ coverage (from 10.8%)

**Day 15: iam/menu module** (2 hours)
- Menu tree building
- Permission-menu association
- Target: 50%+ coverage (from 12.8%)

### Week 4: Audit Module & Verification (8 hours)

**Day 16-17: audit module** (4 hours)
- Operation log creation
- Sensitive data masking
- Log query/filtering
- Retention policy
- Target: 50%+ coverage (from 26.5%)

**Day 18-19: Integration & Verification** (4 hours)
- Run full test suite
- Generate final coverage report
- Compare against baseline
- Document uncovered edge cases
- Update CI coverage threshold: 11% → 30%

---

## Critical Functions to Test (Priority Order)

### Auth Module - Critical Path

**auth/security**:
- [ ] `ValidatePassword()` - Password strength rules
- [ ] `CheckPasswordHistory()` - Password reuse prevention
- [ ] `EnforceMFA()` - MFA requirement logic
- [ ] `RecordSecurityEvent()` - Security audit trail

**auth/login**:
- [ ] `Login()` - Main authentication flow
- [ ] `ValidateCredentials()` - Credential checking
- [ ] `HandleLoginFailure()` - Failed attempt handling
- [ ] `CheckAccountLockout()` - Account lock logic
- [ ] `RecordLoginAttempt()` - Login log creation

**auth/session**:
- [ ] `CreateSession()` - Session initialization
- [ ] `RefreshSession()` - Token refresh logic
- [ ] `RevokeSession()` - Session invalidation
- [ ] `ValidateSession()` - Session verification
- [ ] `CleanupExpiredSessions()` - Cleanup logic

### IAM Module - Critical Path

**iam/role**:
- [ ] `CreateRole()` - Role creation with validation
- [ ] `AssignMenusToRole()` - Role-menu binding
- [ ] `AssignPermissionsToRole()` - Role-permission binding
- [ ] `UpdateCasbinPolicies()` - Casbin policy sync
- [ ] `DeleteRole()` - Cascade delete logic

**iam/permission**:
- [ ] `CheckPermission()` - Permission verification
- [ ] `CreatePermission()` - Permission creation
- [ ] `GetPermissionsByRole()` - Permission query
- [ ] `ValidateResourceAction()` - Resource-action validation

**iam/user**:
- [ ] `CreateUser()` - User creation with defaults
- [ ] `AssignRoleToUser()` - User-role binding
- [ ] `ChangePassword()` - Password change workflow
- [ ] `DeactivateUser()` - User deactivation logic

### Audit Module - Critical Path

**audit**:
- [ ] `CreateOperationLog()` - Log entry creation
- [ ] `MaskSensitiveData()` - Data masking logic
- [ ] `QueryLogs()` - Log filtering and pagination
- [ ] `ApplyRetentionPolicy()` - Log retention cleanup

---

## Test Infrastructure Requirements

### Mocks Needed
- [ ] Database mock (GORM)
- [ ] Redis mock (session storage)
- [ ] Casbin mock (policy enforcement)
- [ ] HTTP context mock (Gin)
- [ ] Time mock (for expiration tests)

### Test Fixtures
- [ ] User fixtures (various roles/states)
- [ ] Role fixtures (different permission sets)
- [ ] Permission fixtures (resource-action pairs)
- [ ] Session fixtures (valid/expired/revoked)

### Test Utilities
- [ ] Helper: Create test DB connection
- [ ] Helper: Seed test data
- [ ] Helper: Assert error types
- [ ] Helper: Mock HTTP requests

---

## Success Criteria Checklist

### Coverage Targets
- [ ] Auth module: 60%+ (currently ~15%)
- [ ] IAM module: 50%+ (currently ~9%)
- [ ] Audit module: 50%+ (currently 26.5%)
- [ ] Overall backend: 30%+ (currently 12.2%)

### Quality Gates
- [ ] All new tests pass
- [ ] No existing tests broken
- [ ] Coverage reports generated
- [ ] CI threshold updated to 30%
- [ ] Coverage badge updated in README

### Documentation
- [ ] Baseline coverage documented
- [ ] Test writing patterns documented
- [ ] Uncovered edge cases listed for Phase 2
- [ ] Mock/fixture usage documented

---

## Risk Assessment

### High Risk - Underestimated Effort
**Likelihood**: Medium  
**Impact**: High

**Indicators**:
- Auth module has 0% coverage in main package
- Permission checking may require complex Casbin mocks
- Session tests may need Redis integration

**Mitigation**:
- Re-evaluate at Week 2 end (16 hours in)
- If Auth module < 40% by Day 9, extend timeline
- Prioritize critical paths over 100% coverage

### Medium Risk - Test Infrastructure Complexity
**Likelihood**: Medium  
**Impact**: Medium

**Indicators**:
- No existing mock infrastructure visible
- Casbin mocking may be complex
- Database transactions in tests

**Mitigation**:
- Spend full Week 1 on infrastructure
- Use `testify/mock` for complex dependencies
- Consider in-memory SQLite for integration tests

---

## Next Actions

### Immediate (Today)
1. [x] Generate baseline coverage report
2. [ ] Identify test infrastructure gaps
3. [ ] Create test fixture templates
4. [ ] Set up mock scaffolding

### This Week (Week 1)
1. [ ] Complete coverage analysis
2. [ ] Document zero-coverage functions
3. [ ] Create test writing guide
4. [ ] Set up CI test environment

### Week 2 (Auth Module Sprint)
1. [ ] Start with auth/security (highest risk, lowest coverage)
2. [ ] Move to auth/login (critical path)
3. [ ] Finish with auth/session (already 32.5%)
4. [ ] Mid-sprint review at Day 6

---

## Estimated Timeline

**Start Date**: 2026-09-08  
**End Date**: 2026-10-08 (30 days)  
**Total Effort**: 44 hours  
**Weekly Allocation**: ~11 hours/week (40% time)

**Milestones**:
- Week 1 (Day 7): Infrastructure ready
- Week 2 (Day 14): Auth module 60%+
- Week 3 (Day 21): IAM module 50%+
- Week 4 (Day 28): Audit 50%+, CI updated

---

## Evidence Collection Plan

### Per-Week Snapshots
- Week 1: Infrastructure setup report
- Week 2: Auth coverage report + test files
- Week 3: IAM coverage report + test files
- Week 4: Final coverage comparison

### Final Deliverables
- Before/after coverage HTML reports
- Test execution logs (all passing)
- List of added test cases
- Coverage delta per module
- Updated CI configuration
- README badge update PR

---

**Status**: Baseline established. Ready to begin Week 1 infrastructure work.

**Blocker**: None. This is a 1-month task requiring sustained effort.

**Recommendation**: Due to the 44-hour duration, this task should be executed in parallel with smaller P1 tasks (K8s manifests, SSO design) to maintain momentum.
