# Evidence: 2026-09-10-tenant-core-data-infrastructure — audit + upload + settings slices

Date: 2026-09-12 · Branch: fix/i18n-s3649-zero · Flag default: `platform.tenant_mode=compat` (unchanged)

## Slices delivered this session

| Slice | Deliverable | Key files |
|-------|-------------|-----------|
| Audit — schema | `SystemLogOper.TenantID` column (uint64, NOT NULL DEFAULT 0, `idx_system_log_oper_tenant`), additive AutoMigrate, no data rewrite | `internal/middleware/operation_log_middleware.go` |
| Audit — stamping | Row built after `c.Next()`; `tenantIDForOperationLog` reads ONLY the resolved tenant context (set by `TenantContextMiddleware`) — never request body/header. Compat & no-middleware routes stamp 0 (platform population). | same |
| Audit — read boundary | `applyTenantScope` pins list/detail/export/batch-delete to the request tenant in multi mode; platform-global (nil ctx) keeps full visibility; the success-count aggregate honors the same scope; compat unchanged | `modules/system/audit/audit_service.go` |
| Audit — export boundary | Export shares the tenant scope; `tenantId` appended as the LAST CSV column (existing column indexes stable) | `audit_service.go` |
| Audit — cross-tenant query guard | `OperationLogQuery.TenantIDFilter` accepted only from platform-global subjects; tenant subjects get `tenant.forbidden`; even a leaked filter composes (AND) with the hard scope so it can only narrow | `modules/system/audit/audit_handler.go`, `audit_dto.go` |
| Cleanup stays global (deliberate) | `CleanupOperationLogs` / auto-retention remain platform janitor sweeps across all tenants — retention is not a tenant-scoped capability | `audit_service.go` (unchanged) |
| Upload — object-key namespacing | `uploadScope` prefixes `t<tenantID>/` to the scope in multi mode (from resolved context only); key layout becomes `t<id>/<scope>/<date>/<uuid>.<ext>` — no cross-tenant key collision possible; compat keeps the legacy layout | `modules/system/config/setting/setting_handler.go` |
| Dict cache | already tenant-namespaced by canary (`dictOptionCacheKey`, test `TestTenantCanary_OptionCacheIsolated`) — verified, no change needed | `dict_service.go` |

## Test results (all DB-backed, local MySQL)

New `modules/system/audit/audit_tenant_isolation_test.go` (6):

1. `ListPinnedToRequestTenant` — tenant 101 sees exactly its own row (never 202, never platform rows); aggregate tenant-scoped. ✅
2. `GetRejectsForeignRow` — 101 cannot read 202 detail; 202 and platform can. ✅
3. `DeleteAndBatchPinnedToTenant` — single delete of foreign row is a no-op; batch deletes only own ids. ✅
4. `ExportPinnedToTenant` — tenant 101 CSV contains zero 202 rows. ✅
5. `CompatUnchanged` — nil ctx ⇒ unfiltered (single-tenant regression guarantee). ✅
6. `TenantIDFilterGuard` — filter 202 under tenant-101 scope returns nothing; platform subject filter works. ✅

New `internal/middleware/operation_log_tenant_test.go` (3): stamp from resolved context (101 stamped even when request sends `X-Tenant-Id: 202`), compat stamps 0, no-context stamps 0.

New `modules/system/config/setting/upload_tenant_scope_test.go` (4): `t101/avatar` in multi mode; legacy layout under compat; default `general`; hostile `scope=../../202` stays under the `t101/` namespace prefix.

Pre-existing audit tests updated mechanically (nil ctx added; export header count 14→15).

## Runtime verification

- DB-backed: `go test -count=1 -short ./pkg/... ./internal/... ./modules/auth/... ./modules/system/...` — 0 FAIL (audit 11.0s incl. 6 isolation tests, middleware 2.2s, dict canary 9.1s still green, iam/org/auth all green).
- DSN-less: `go test -short ./pkg/... ./internal/... ./modules/...` — 0 FAIL.
- `go build ./...` green; `go vet` green on touched packages; `gofmt` clean.

## Economics Watch

- Audit stamping: zero extra queries (reads the context already resolved by the middleware).
- Audit reads: one additional `tenant_id = ?` predicate backed by `idx_system_log_oper_tenant`; platform subjects unchanged.
- Upload: zero extra queries (context read); key cardinality grows by one directory level per tenant (`t<id>/`), no collision possible across tenants.
- No new Redis keys, no new goroutines; async log queue unchanged.

## Human Gates

- Schema change (additive column on `system_log_oper`) and storage layout change (object-key prefix) are in scope of the manifest's "schema/storage/audit/export scope approval" gate — recorded here for maintainer review; both are no-ops while flag is compat.

## Slice 3 (2026-09-12): system_setting tenant override + uniqueness

| Deliverable | Key files |
|-------------|-----------|
| Schema | `system_setting.tenant_id` (BIGINT UNSIGNED NOT NULL DEFAULT 0) + composite unique `uk_system_setting_tenant_key (tenant_id, setting_key)` replacing the global-unique `idx_system_setting_setting_key` — exactly the scope matrix's "tenant-overridable: 组合键" registration; guarded migration 000014 (+down) follows the 000013 information_schema pattern | `pkg/database/migrations/000014_tenant_settings.{up,down}.sql`, `setting_model.go` |
| Override resolution | `GetByKey` scoped: multi mode reads global (0) + own tenant rows, override wins (`ORDER BY tenant_id asc`, last match); compat resolves global rows only | `setting_service.go` |
| Write semantics | tenant write updates the tenant override row when present, otherwise **creates a tenant-owned copy** (global row never mutated); platform write mutates the global row; ownership from context only (contract §3.3) | `updateSettingGroupItem` |
| Read scoping | `List` / `GetOverview` / `findAuditRows` scoped: multi = global + own tenant rows (foreign overrides invisible); compat = global only (explicit `tenant_id = 0` filter now that override rows exist) | `tenantScope()` |
| Cache isolation | list/group caches tenant-namespaced (`t<id>:...`, canary pattern) with shared lock state via extracted `settingCacheState` (fixes vet lock-copy finding); public cache stays platform-only | `setting_service.go`, `setting_seed.go` |
| Seed/legacy pins | seeds and legacy-value normalization pinned to `tenant_id = 0` (bootstrap-time platform operations) | `setting_service.go`, `setting_seed.go` |
| Route guard | `TenantContextMiddleware` added to the setting protected routes (audit/list/group/cache); audit read path (`ListAudit`/`ExportAudit`) pinned via `tenant.WithTenantScope` on `system_log_oper` | `system_modules.go`, `setting_audit.go` |

### Slice-3 test results (8, DB-backed)

`setting_tenant_override_test.go`: global default inheritance; override wins (101) while non-override tenant (202) inherits global; **foreign override never readable** (101 falls back to global, 202's value invisible); compat resolves global only (GetByKey + List); tenant write creates an override row without mutating the global row, second write updates in place, other tenants unaffected; composite uniqueness enforced (duplicate within a tenant rejected, per-tenant copies coexist); platform write mutates the global row; List/GetOverview scoped (no 202 leak).

### Slice-3 verification

- DB-backed full suite 0 FAIL; DSN-less 0 FAIL; build/vet/gofmt clean (vet lock-copy + unreachable-code findings fixed).

## Gaps (explicit)

- ~~**settings/dict tenant override + uniqueness**~~ → **closed in slice 3**: dict rows carry `tenant_id` with namespaced uniqueness (canary); `system_setting` override/inheritance + composite uniqueness delivered with migration 000014 and 8 isolation tests.
- **security-event / login-log rows** still lack tenant columns (they are separate tables from `system_log_oper`).
- **dashboard aggregates / async jobs / dynamic-module generator guardrails**: not yet tenant-aware; async context persistence belongs to the next slice.
- **Download authorization**: `ServeUploadedFile` remains public-route; tenant-privatized download authorization not implemented (object keys are now tenant-prefixed but the serve route does not yet check membership).
- Browser smoke of two-tenant audit/export/upload: deferred to task 6 verification matrix.
