# Tenant Core Auth IAM - Completion Status

Date: 2026-09-21  
Status: **Implementation Complete, Pending Production Gates**

## Delivered Slices

### ✅ Slice 1: Session/Token Tenant Claims (2026-09-11)
- `SessionData.TenantID` + `system_user_session.tenant_id` (additive migration)
- Multi-tenant login membership discovery and signing gate
- Single membership auto-resolution / no membership → platform layer / ambiguity rejection
- Casbin domain subject expansion (global precedence → `role:<key>@tenant:<id>`)
- 12 DB-backed hostile tests + flag-off regression passed

### ✅ Slice 2: Multi-Membership Login Selection (2026-09-12)
- `LoginReq.TenantId` explicit selection with membership gate
- Wrong-tenant rejection and ambiguity resolution
- `GET /auth/login-tenants` candidate list endpoint
- MFA challenge tenant value propagation
- Tenant-scoped Casbin policy write surface (per-tenant namespace uniqueness)
- 18 auth-gate + 6 middleware + 4 permission isolation tests passed

### ✅ Slice 3: Frontend Tenant Picker UI (2026-09-13)
- Password-verified tenant picker (candidates shown post-verification)
- Explicit `tenantId` retry with error data preservation
- MFA challenge tenant binding and divergence rejection
- 5 locale i18n resources
- Playwright picker E2E 3/3 + local MySQL dual-tenant HTTP probe passed

### ✅ Slice 4: Auth Log Tenant Columns (2026-09-13)
- Migration 000015/000016 additive tenant columns with indexes
- Auth log tenant-scoped list/detail/export/cleanup/batch
- Covered in tenant-core-data-infrastructure evidence

## Runtime Verification

- **Build**: `go build ./...` ✅
- **Unit tests**: `go test -short ./...` ✅ (37 packages green)
- **Type check**: `npm run type-check` ✅
- **Lint**: `npm run lint` ✅
- **Integration**: Playwright auth + tenant-picker smoke 7/7 + 1/1 ✅
- **Isolation**: 12 + 18 + 6 + 4 = 40 hostile tenant tests ✅
- **Regression**: Compat flag-off single-tenant smoke ✅

## Remaining Items (Runtime/Production Only)

These cannot be completed without production environment:

1. **Live browser/API smoke** - Requires production-like environment
2. **G2 gate (Production backup restore)** - Requires DBA + production backups
3. **G3 gate (Production maintenance window)** - Requires production sizing + staging rehearsal
4. **Performance baseline** - Requires production-scale staging
5. **Observability evidence** - Requires production monitoring setup

## Evidence Location

- Summary: `.harness/evidence/2026-09-10-tenant-core-auth-iam/summary.md`
- Review: `.harness/evidence/2026-09-10-tenant-core-auth-iam/review.md`
- Test results: Embedded in summary.md

## Human Gates Required

- ✅ Schema/migration approval - Granted (migrations 000015/000016 additive)
- ✅ Auth/session/token/MFA contract approval - Granted (Contract V1 frozen)
- ✅ Casbin domain approval - Granted (per-tenant namespace)
- ⏳ Staged rollout approval - Pending G2/G3 production gates

## Recommendation

**Implementation status**: COMPLETE for local/staging environments  
**Production readiness**: BLOCKED on G2/G3 human gates (DBA backup restore + production sizing)

The codebase is ready for controlled pilot in non-production environments. Production deployment requires maintainer execution of G2/G3 procedures documented in:
- `.harness/state/2026-09-10-tenant-verification-and-gray-gates/status.md`
- `docs/runbooks/PRODUCTION_BACKUP_RESTORE_DRILL_G2.md`
- `backend/cmd/tenantsizing` (for G3)
