# S3 Download Authorization Slice — Evidence

**Task**: 2026-09-10-tenant-core-data-infrastructure (queue 5)
**Date**: 2026-09-15
**Scope**: Close the "S3 download path if enabled" remainder from the 2026-09-13 statusNote.

## Gap being closed

`ServeUploadedFile` previously failed closed for the `s3` storage driver
(`cfg.StorageDriver != "local"` → `upload.file.not_found`). S3-uploaded objects
were only reachable via their object-store URL — an unauthenticated path that
bypassed the tenant-namespace isolation the local driver enforces. Under multi
mode this was a cross-tenant read hole for any S3-backed deployment.

## Changes

| File | Change |
|------|--------|
| `backend/pkg/upload/service.go` | +`OpenS3Object(ctx, key)` (StatObject→GetObject, context-bound reader, 256 KiB chunked reads), +`EnforceTenantObjectScope(ctx, key)` (canonical `t{id}/` prefix guard, first-segment exact), +`minioObjectClient` adapter (minio-go `GetObject` returns concrete `*minio.Object`), +`SetObjectStorageClientFactory` test hook, interface extended with `GetScopedObject`/`StatScopedObject` |
| `backend/modules/system/config/setting/setting_handler.go` | `ServeUploadedFile` refactored: tenant guard moved to shared `EnforceTenantObjectScope` (resolved context only, never request fields); new `s3` branch → `serveS3Object` streaming with identical header policy (nosniff, attachment for non-images, Content-Length) |
| `backend/pkg/upload/service_test.go` | Fake client extended for the two new interface methods |
| `backend/modules/system/config/setting/upload_s3_download_authorization_test.go` | New isolation tests (6) |
| `backend/modules/system/audit/audit_cleanup_test.go` | Fixed 3 stale call sites (tenant-context param added by earlier queue-5 slice; test file had not been updated in that session) |
| `.harness/tasks/2026-09-10-tenant-core-data-infrastructure/manifest.json` | statusNote updated with delivery + durable-job gap disposition |

## Security semantics

- **Deny-before-store-call**: cross-tenant key → 404-class `upload.file.not_found` with zero object-store calls (no existence leak via StatObject timing/results).
- **Context-only tenancy**: prefix derived from `tenant.FromGin(c)` (set by `TenantContextMiddleware` after auth); `scope`/query/header fields cannot influence it.
- **Compat preserved**: `compat` mode and missing context keep the legacy tenantless keyspace (flag-off regression safe).
- **Lookalike prefixes rejected**: `t101x/…` ≠ `t101/…` (exact first-segment match).
- **No store internals leaked**: Stat/Get errors map to `not_found`.
- **Stream hygiene**: reader is request-context-bound (cancellation aborts), reads capped at 256 KiB chunks, explicit Close.

## Verification (2026-09-15, Windows, local MySQL 8.0.36 @3306 + Redis @6379)

```
DSN: root:***@tcp(127.0.0.1:3306)/pantheon_base (per-test isolated DBs via pkg/testmysql)

go build ./...                        → PASS
go vet ./...                          → PASS (0 findings)
gofmt -l .                            → clean
go test -short ./... (DSN-less)       → 40 packages ok, 0 FAIL
go test -short ./modules/... ./pkg/... (DB-backed) → 37 packages ok, 0 FAIL
```

Targeted isolation subset (DB-backed, -v):
`TestUploadScope*`, `TestEnforceTenantObjectScope`, `TestServeUploadedFileS3_*` (4),
`TestServeUploadedFile_LocalDriverStillServes`, `TestServeUploadedFileRejectsAnotherTenantNamespace`,
`TestServeUploadedFileAllowsOwnTenantNamespace`, `TestSettingTenantOverride*`, `TestUploadTenantScope*`,
`TestAuditTenantIsolation_*` → **26 PASS / 0 FAIL**

Key assertions evidenced:
- `TestServeUploadedFileS3_CrossTenantDenied`: t101 subject requesting `t202/…` → not_found, `statHit==false && getHit==false`
- `TestServeUploadedFileS3_OwnTenantServed`: 200, exact body, nosniff, Content-Length 18
- `TestServeUploadedFileS3_CompatServesWithoutTenantPrefix`: legacy key served under compat
- `TestServeUploadedFileS3_ObjectStoreErrorIsNotFound`: store error → not_found (no leak)
- `TestEnforceTenantObjectScope`: nil-context pass-through, compat pass-through, cross-tenant reject, own-tenant pass, lookalike-prefix reject
- `TestServeUploadedFile_LocalDriverStillServes`: local path unchanged after refactor

## Deferred (explicit gaps)

- Hostile two-tenant **browser/runtime** matrix incl. S3-backed runtime probe → `2026-09-10-tenant-verification-and-gray` (G1–G4 human gates open)
- Durable job framework: none exists in the codebase (only the operation-log in-process async queue, which preserves explicit `TenantID` — test `TestOperationLogStore_PersistsTenantContextThroughAsyncQueue`). Contract §3.2 already mandates worker `tenant_id` propagation. Recorded as future work, not an isolation hole.
- Real-MinIO round trip: covered by pre-existing `TestServiceStoreUsesRealS3WhenConfigured` (env-gated, skipped without live S3 config); the authorization logic itself is fully tested via the fake.
