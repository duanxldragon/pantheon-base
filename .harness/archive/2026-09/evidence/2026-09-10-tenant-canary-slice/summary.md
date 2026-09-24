# Evidence: 2026-09-10-tenant-canary-slice

## Canary resource & flag

- Resource: **dict** (`system_dict_type` / `system_dict_item`) — approved per [resource scope matrix](../../docs/designs/TENANT_RESOURCE_SCOPE_MATRIX.md) Phase-1 (low-risk config-class resource).
- Flag: `platform.tenant_mode` in `system/config` (`compat` default | `multi`), seeded with validator + i18n remark in all 5 locales. Fail-safe: unknown/missing value → `compat`; loader caches 5s TTL. Kill switch: set the setting back to `compat` (behavior fully restored without data loss — flag-off path covered by tests).
- Flag contract tests: `pkg/tenant/tenant_test.go` (normalize fail-safe, cache TTL, nil-loader).

## Implementation map (vertical slice)

| Layer | File | Change |
|-------|------|--------|
| platform | `backend/pkg/tenant/tenant.go` | Tenant context resolution (subject claim > platform-permission-gated header > compat fallback), deny-by-default sentinels, `WithTenantScope`/`WithTenantWrite` GORM helpers, cached ModeLoader |
| platform | `backend/pkg/tenant/membership.go` | Read-side `tenant_memberships` model + `HasActiveMembership` deny-by-default check; setting-backed flag loader glue |
| platform | `backend/pkg/tenant/clock.go` | TTL clock shim |
| platform | `backend/internal/middleware/tenant_context_middleware.go` | Resolves context after token auth; stores read-only in Gin; 403 `tenant.forbidden` / 500-class `tenant.context.missing` on multi-mode denial |
| database | `backend/pkg/database/migrations/000013_tenant_canary.{up,down}.sql` | `tenants` + `tenant_memberships` tables, global placeholder tenant 0 (`__global__`, archived), guarded tenant_id columns + tenant-scoped unique index on dict tables (information_schema guards per 000008/000010/000011 pattern) |
| system/config | `backend/modules/system/config/dict/dict_model.go` | `tenant_id NOT NULL DEFAULT 0`; global `dict_code` unique → `(tenant_id, dict_code)` (contract §2.2 tenant-local uniqueness) |
| system/config | `dict_service.go` | `WithTenantContext` binding; scope applied to **all** read paths (list/detail/count/stats/options/import lookups), write ownership from context only (`tenantOwnerID`), per-tenant option-cache namespacing (`t{tenantId}:{code}`), batch-status containment |
| system/config | `dict_handler.go` | Every handler binds the request tenant context via `boundService(c)` (incl. batch-delete callbacks + export/import) |
| system/config | `setting_seed.go` + `seed_data.yaml` | `platform.tenant_mode` seed + normalizer |
| routing | `modules/system/system_modules.go` | `TenantContextMiddleware` wired into dict protected routes; loader built from SettingService |

## Hostile two-tenant test results (10/10 pass, MySQL-backed)

`backend/modules/system/config/dict/dict_tenant_canary_test.go` — fixture: tenants **101** vs **202** + global tenant 0, same `dict_code` planted in both tenants and global.

1. `SameCodeCoexistence` — both tenants own `shared_code`; item-value duplicates allowed across tenants, conflict within a tenant. ✅
2. `CrossTenantReadDenied` — list invisible, cross-tenant detail update → not-found (no existence leak, contract §5). ✅
3. `IDTamperingContained` — delete/batch-status with a foreign ID fails; batch containing foreign ID rejected. ✅
4. `GlobalRowsNotLeaking` — multi-mode tenants never read tenant-0 rows; global view never contains tenant rows. ✅
5. `ExportFiltered` — export contains only the calling tenant's rows. ✅
6. `OptionCacheIsolated` — per-tenant cache keys; no cross-tenant cache hits. ✅
7. `FlagOffRegression` — nil/compat context reproduces legacy behavior byte-for-byte; flag-off creates stay `tenant_id=0`; multi-mode tenant cannot read tenant-0 rows. ✅
8. `ContextForgeryDenied` — forged header without permission, missing context in multi, and explicit tenant-0 claims all denied. ✅
9. `MembershipDenyByDefault` — empty table denies; disabled membership denies; only active membership allows. ✅
10. `HandlerBinding` — missing Gin context returns shared compat service; multi context yields tenant-bound view. ✅

## Runtime verification

- Full fresh boot on replica DB `tenant_canary_verify` via `go run ./cmd/server`: migration **version=13, dirty=0**, `tenants` global placeholder row present, `tenant_id` columns on both dict tables, `platform.tenant_mode=compat` seeded (43 settings), dict bootstrap rows intact. Verify DB dropped afterwards.
- `go test ./...` DSN-less: all green. DB-backed `./pkg/... ./internal/... ./modules/... -count=1`: all green.
- `gofmt` clean; `go build ./...` green; `go vet` green on touched packages.
- i18n audit: 5 locales × **2805** keys, missing=0 extra=0 (added `system.setting.remark.platform.tenant_mode`).
- Docs: frontmatter 0 errors, links 0 findings.

## Economics Watch

- Mode loader: 1 settings query per 5s per process (TTL cache) — no per-request DB cost.
- Tenant scope adds an equality predicate on indexed `tenant_id` columns (`idx_dict_type_tenant_code`, `idx_dict_item_tenant_code_value`) — no unbounded scans; batch operations validate against scoped reads before writes.
- Cache: single shared map, per-tenant key namespacing — no extra memory multiplier beyond distinct tenants.

## Human Gates

- **Flag-on approval**: `platform.tenant_mode` ships seeded `compat`; flipping to `multi` in any real deployment is the maintainer's gate (per task packet "canary resource and flag-on approval").
- **Isolation evidence review before extending beyond the canary**: this evidence + review.md constitute the input; core auth/iam + data-infra tasks must not start until reviewed.

## Gaps

- JWT `tenant_id` claim issuance at login (subject resolution source) belongs to `2026-09-10-tenant-core-auth-iam`; until then multi-mode requests need the platform-ops header path, and sessions carry no claim (deny-by-default covers the gap safely).
- Casbin domain enforcement (`tenant:<id>`) is contract-frozen but not exercised by this slice (dict routes gate via role-based Casbin only) — core auth/iam task wires domain checks.
- Upload object-key tenant prefix implemented in canary scope? No — dict resource does not touch uploads; the objectKey rule stays documented in the runbook §2.5 for the data-infra task.
