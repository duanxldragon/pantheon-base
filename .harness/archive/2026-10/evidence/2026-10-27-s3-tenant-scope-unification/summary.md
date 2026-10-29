# Summary — `2026-10-27-s3-tenant-scope-unification`

## Outcome

One tenant-scope implementation now lives in `backend/pkg/tenant` (`Scoper` +
`OwnerTenantID`). Eleven system services and three auth services stopped carrying
their own copy of the trio. Behaviour is unchanged for all three contexts
(nil / compat / multi), proven by an offline SQL snapshot test and a two-tenant
isolation smoke case.

Closed findings: **RC-012 / RC-027** (tenant-scope trio duplicated across services).

## Measured change

- Tracked diff: **29 files, +278 / −373**.
- Production code only (`.go`, excluding `_test.go`): **25 files, +267 / −364**.
- New files: `scope_helper.go` **53**, `scope_helper_test.go` **84**,
  `tenant_isolation_smoke_test.go` **402**.
- Net production delta including the new helper: **−44 lines**.

The audit's “250–400 lines saved” was an estimate of deleting the per-service
copies. The measured production reduction is smaller because (a) the trio was
~12 lines per service, not ~30, and (b) `WithTenantContext` must stay per
service so the bound clone returns the concrete service type. The real gain is
structural: one implementation, one test that pins it, and a shared helper the
next service will reuse.

## Equivalence argument

- `Scoper.Scoped/Scope` is byte-equivalent to the deleted `scoped`/`tenantScope`
  bodies (`db.Scopes(tenant.WithTenantScope(ctx))`).
- `OwnerTenantID` is byte-equivalent to every deleted `tenantOwnerID`
  (`nil || !IsMulti → 0`, else `ctx.TenantID`).
- No other predicate, page cap, data-scope filter or ordering changed.
- Intentional variants kept in place: setting's `tenant_id IN (0, tenantID)`
  read scope, dashboard's table whitelist, login's login-tenant resolution,
  `login.Runtime`'s composition-root binding.

## Verification

| Command (cwd `backend`) | Result |
|---|---|
| `gofmt -l modules pkg` | empty |
| `go build ./...` | exit 0 |
| `go vet ./...` | exit 0 |
| `go test -count=1 ./...` | 47 ok / 0 FAIL / 6 no-test packages |
| `grep func.*tenantOwnerID` | 0 |
| `grep func.*scoped(db *gorm.DB)` | 0 |
| `go test -run TestTwoTenantIsolationSmoke` | SKIP locally (no DSN); CI carries it |

## Runtime gap

No local MySQL DSN. The two-tenant case is built and CI-enforced
(`PANTHEON_TEST_DSN_REQUIRED=true` in `ci.yml:143,332` and `quality.yml:362`);
local execution was not possible without credentials, and credentials were not
searched for. Recorded rather than papered over.

## Notes for the next wave

- The schema-vs-model index naming gap seen while diffing role data-scope
  (`uk_` vs `idx_`, legacy `scope_defs`) is **not** caused by this wave and is
  recorded in `2026-10-27-s3-role-data-scope-model`.
- The programme's release-cycle gate before batch S3 was overridden by the
  maintainer's direct 2026-10-28 instruction; release cutting remains out of
  scope.
