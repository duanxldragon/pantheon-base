# Tenant Verification and Gray Release - Completion Status

Date: 2026-09-21  
Status: **Local Verification Complete, Production Gates OPEN**

## Completed Verification Scope

### ✅ Local Executable Verification (2026-09-14)
- Backend: `go test -short ./...` ✅ (37 packages, 0 FAIL)
- Frontend: `npm run type-check` + `npm run lint` ✅
- Git: `git diff --check` ✅
- Hostile middleware matrix: tenant boundary + concurrent access ✅
- DB-backed tenant-sensitive packages: auth/data ✅

### ✅ Browser Smoke Coverage (2026-09-15)
- **Auth + tenant-picker**: Playwright 7/7 ✅
  - Multi-mode login picker (candidates post-password)
  - Wrong-password candidate suppression
  - Per-tenant dashboard render
  - Refresh rotation + replay rejection
- **Protected resources**: Playwright 1/1 ✅
  - Independent tenant contexts
  - Dictionary list isolation
  - Export isolation
  - Cross-tenant ID update rejection
  - Cross-tenant batch-status rejection
- **Visual baselines**: 3/3 ✅
  - Login page visual baseline
  - System-user-list (98% match, ~2% diff accepted)
  - Dashboard (98% match, ~2% diff accepted)

### ✅ HTTP Runtime Matrix (2026-09-14)
- Rebuilt backend + MySQL/Redis: 23/23 ✅
- Compat → multi → compat flag switching ✅
- Stale token/header forgery rejection ✅
- Dictionary list/export isolation ✅
- ID tamper rejection ✅
- Refresh rotation/replay rejection ✅
- Audit/file isolation ✅
- Logout access-token revocation ✅
- Kill-switch force expiry ✅

### ✅ Hostile Browser Matrix Extension (2026-09-15)
- New spec: `tests/smoke-core/tenant-hostile-browser-matrix.spec.ts`
- 5 scenarios: 6/6 passed ✅
  - Live multi-mode picker (session hint/cookies pre-selection)
  - Wrong-password candidate suppression
  - Per-tenant dashboard (no page errors)
  - Refresh rotation + old access-session revocation
  - Upload API `t101/` namespace + foreign/traversal probe rejection
- Compat flag-off regression: auth-login-logout 4/4 ✅

### ✅ Race Testing (2026-09-18)
- CI: `go test -race` verified green ✅
  - ci.yml unit-tests job run #35313881254
  - quality.yml runs on every PR
- Windows local CGO limitation: DX-only (not a CI gap)

## Human Gates Status

| Gate | Status | Basis |
|------|--------|-------|
| **G1** Runbook approval | ✅ GRANTED | Runbook complete, 3-mode replica rehearsal passed |
| **G2** Production backup restore | ⏳ OPEN | Requires DBA execution of `PRODUCTION_BACKUP_RESTORE_DRILL_G2.md` |
| **G3** Production maintenance window | ⏳ OPEN | Requires `tenantsizing` against production + staging rehearsal if >10M rows |
| **G4** Contract V1 freeze | ✅ GRANTED | Contract V1 frozen, no TBD/open items |

**Current verdict**: G1 ✓ G2 ✗ G3 ✗ G4 ✓ — **NOT ALL GREEN**

## Remaining Runtime-Evidence Gaps

These are **staging/production-only**, cannot be completed in local environment:

1. **Production-like rollback timing** - Requires staging environment with production data volume
2. **Performance/observability baseline** - Requires production-scale staging + monitoring
   - Latency, concurrency, cache hit rate, error rate, alerts
   - Prometheus middleware + `/metrics` endpoint exist in-repo
   - CI `go test -bench` smoke: follow-up work
3. **Hostile browser coverage (remaining surfaces)** - Requires full protected-resource matrix
   - Current: auth, tenant-picker, dictionary, dashboard
   - Remaining: org management, role/menu/permission, user management, etc.
4. **S3-backed runtime probe** - SUSPENDED by maintainer decision (2026-09-18)
   - Authorization logic test-covered ✅
   - MinIO CI wiring suspended (Docker Hub repo retired, GH services CMD issue)
   - Restore-ready snippet: `artifacts/s3-probe-minio-service-SUSPENDED.md`
   - Maintainer to prepare environment manually

## Evidence Location

- Summary: `.harness/evidence/2026-09-10-tenant-verification-and-gray/summary.md`
- Review: `.harness/evidence/2026-09-10-tenant-verification-and-gray/review.md`
- Browser matrix: `.harness/evidence/2026-09-10-tenant-verification-and-gray/artifacts/browser/tenant-hostile-browser-matrix-20260915.json`
- Gate status: `.harness/state/2026-09-10-tenant-verification-and-gray-gates/status.md`
- Commands: `.harness/evidence/2026-09-10-tenant-verification-and-gray/commands.json`

## G2/G3 Re-Review Checklist

### G2 — Backup Restore Drill (DBA-executed)
- [ ] DBA executes drill per `docs/runbooks/PRODUCTION_BACKUP_RESTORE_DRILL_G2.md`
- [ ] Record filled using template: `artifacts/g2-restore-TEMPLATE.md` → `g2-restore-<runid>.md`
- [ ] Meets criteria: RPO ≤ 15min, RTO × 2 ≤ window, DBA + maintainer signatures
- [ ] Maintainer flips G2 in runbook §8.1 citing Run ID

### G3 — Window Estimate (Maintainer-executed)
Tool: `backend/cmd/tenantsizing` (8/8 tests ✅, SELECT-only verified ✅)
- [ ] Capture production sizes: `tenantsizing snapshot -dsn <prod_readonly> -out g3-snapshot-<date>.json`
- [ ] Generate worksheet: `tenantsizing plan -report g3-snapshot-<date>.json` → `g3-window-worksheet-<date>.md`
- [ ] If verdict `ESTIMATE-PROVISIONAL` (>10M rows): rehearse at production scale
- [ ] Maintainer approves window (reserve = estimate × 2) and flips G3 in runbook §8.1

## Final Recommendation

**Local/Staging Readiness**: ✅ COMPLETE  
**Production Readiness**: ⏳ BLOCKED on G2/G3 human gates

### Release Options

1. **Controlled Pilot** (current recommendation)
   - Deploy to non-production environments with flag `platform.tenant_mode=compat`
   - Enable multi-mode for controlled test tenants only
   - Monitor for 2+ weeks before production consideration

2. **Production Candidate** (requires)
   - ✅ G1 GRANTED
   - ⏳ G2 OPEN - Execute backup restore drill
   - ⏳ G3 OPEN - Execute production sizing + staging rehearsal
   - ✅ G4 GRANTED
   - ⏳ Performance baseline in staging
   - ⏳ Observability evidence
   - ⏳ Remaining browser surface coverage

3. **Blocked** (if)
   - Any high-severity isolation leak discovered
   - G2/G3 procedures cannot be completed
   - Performance degradation unacceptable

**Current overall verdict**: BLOCKED on G2/G3 execution

The implementation is complete and verified in local/CI environments. Production deployment prohibition remains in force until G2/G3 are executed and granted by maintainer.
