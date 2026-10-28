# Tenant-scope trio — before/after snapshot

Task: `2026-10-27-s3-tenant-scope-unification`
Scope: 11 system services + 3 auth services, `backend/pkg/tenant`.

## What the trio was, per service (before)

Every service repeated the same three members:

```go
type XService struct {
    db *gorm.DB
    tenantCtx *tenant.Context // per-request binding
}

func (s *XService) WithTenantContext(ctx *tenant.Context) *XService {
    if ctx == nil { return s }
    bound := *s
    bound.tenantCtx = ctx
    return &bound
}

func (s *XService) scoped(db *gorm.DB) *gorm.DB {
    return db.Scopes(tenant.WithTenantScope(s.tenantCtx))
}

func (s *XService) tenantOwnerID() uint64 {
    if s.tenantCtx == nil || !s.tenantCtx.IsMulti() { return 0 }
    return s.tenantCtx.TenantID
}
```

(`user` additionally wrapped `scoped` behind `tenantScope()`, a second copy of the
same closure; `setting` used a wider read scope and `dashboard` a table whitelist —
both intentional, both kept.)

## What replaced it (after)

```go
// backend/pkg/tenant/scope_helper.go
type Scoper struct {
    TenantCtx *Context
}

func (s Scoper) Scoped(db *gorm.DB) *gorm.DB            { return db.Scopes(WithTenantScope(s.TenantCtx)) }
func (s Scoper) Scope() func(*gorm.DB) *gorm.DB        { return WithTenantScope(s.TenantCtx) }
func (s Scoper) TenantOwnerID() uint64                 { return OwnerTenantID(s.TenantCtx) }

func OwnerTenantID(ctx *Context) uint64 {
    if ctx == nil || !ctx.IsMulti() { return 0 }
    return ctx.TenantID
}
```

Services now embed `tenant.Scoper` and keep only the concrete-typed
`WithTenantContext` (required so the bound clone returns `*XService`, not the
embedded struct):

```go
type XService struct {
    db *gorm.DB
    tenant.Scoper
}

func (s *XService) WithTenantContext(ctx *tenant.Context) *XService {
    if ctx == nil { return s }
    bound := *s
    bound.TenantCtx = ctx
    return &bound
}
```

Call sites changed mechanically: `s.scoped(db)` → `s.Scoped(db)`,
`s.tenantScope()` → `s.Scope()`, `s.tenantOwnerID()` → `s.TenantOwnerID()`.

## The three contexts must never converge

| Context | Read SQL | Write owner | Why |
|---|---|---|---|
| `nil` (platform-internal) | unfiltered | 0 | internal callers need the whole population |
| compat (`!IsMulti`, explicit ctx) | `tenant_id = 0` | 0 | platform-global population; collapsing this into `nil` was the 2026-10-24 defect |
| multi | `tenant_id = <ctx.TenantID>` | `<ctx.TenantID>` | tenant isolation hot path |

## Snapshot test that pins the semantics (offline)

`backend/pkg/tenant/scope_helper_test.go`:

- `TestScoperScopeSemantics` builds the read SQL through GORM `DryRun` and asserts:
  - nil → generated SQL contains **no** `tenant_id` predicate;
  - compat → contains `tenant_id = 0`;
  - multi(101) → contains `tenant_id = 101`.
- `TestScoperOwnerTenantID` asserts owner 0 / 0 / 101 for the same three contexts,
  for both the method and the package function.

These run without a database and fail if any context loses its predicate or if
compat is folded back into nil.

## Two-tenant end-to-end case (real schema)

`backend/modules/system/iam/tenant_isolation_smoke_test.go` seeds tenants
A=101 and B=202 with fixed ids and runs each service with a multi context:

- A `list` / `get` / `update` / `delete` on A-owned rows: succeed;
- B exercising the same calls against A's ids: 404 / zero affected rows, with list
  counts unchanged;
- compat context sees only `tenant_id = 0` rows;
- write owner comes from the context, not from the request body (cross-tenant
  id injected into a create does not move the row to another tenant);
- setting override and dashboard totals assert the intentional variants.

Locally the case skips (no DSN); CI runs it with `PANTHEON_TEST_DSN_REQUIRED=true`.
Verbatim local output: `two-tenant-run.log`.

## Per-service outcome

| Service | Shared read filter | Shared owner | Intentional variant kept |
|---|---|---|---|
| role | yes | yes | — |
| post | yes | yes | — |
| dept | yes | yes | — |
| user | yes (double wrapper removed) | yes | — |
| dict | yes | yes | — |
| setting | owner yes; read scope kept | yes | `tenant_id IN (0, tenantID)` override-on-global |
| permission | yes | yes | — |
| dashboard | yes | yes | table whitelist (`scopedTable`) |
| login | yes | yes | login-tenant resolution kept |
| security | yes | yes | — |
| session | yes | yes | — |
| (login `Runtime`) | not converted | not converted | composition-root binding |

No query predicate other than the tenant predicate was touched.
