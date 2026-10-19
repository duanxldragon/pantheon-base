---
title: Tenant Contract V1 (Shared-Schema MVP)
doc_type: Contract
layer: platform / system/auth / system/iam / system/org / system/config
status: Approved
updated_at: 2026-10-13
---

# Tenant Contract V1 (Shared-Schema MVP)

Chinese version: [TENANT_CONTRACT_V1.md](./TENANT_CONTRACT_V1.md)

This contract is the frozen deliverable of the `2026-09-10-tenant-contract-design` task and provides the execution contract for the shared-schema MVP phase of the [P2 scale roadmap](../designs/P2_SCALE_ROADMAP.md). Design rationale: [tenant-ready single-tenant design](../designs/TENANT_READY_SINGLE_TENANT_DESIGN.md).

“Frozen” = the V1 **model, ownership boundaries, and invariants** are locked; concrete table-schema evolution is governed by the runbook (`2026-09-10-tenant-migration-runbook`).

---

## 1. Scope (In / Out)

### In

- Tenant master-data model and lifecycle (active / suspended / archived)
- TenantMembership: many-to-many user-tenant affiliation with in-tenant roles
- Tenant context: request-scoped tenant resolution, injection, propagation, validation
- Resource tenancy: business/system resources owned via `tenant_id`, constrained by the resource-scope matrix
- Casbin domain-based permission isolation (policies carry a tenant domain)
- Compat mode: a single-tenant compatibility switch so existing deployments keep running with zero migration

### Out

- Schema-per-tenant / database-per-tenant isolation (V1 is shared schema + `tenant_id` only)
- Tenant billing, plans, quotas (separate commercial workstream)
- Cross-tenant data sharing / federated queries
- Tenant custom domains, per-tenant deployment shapes

---

## 2. Core Model (frozen)

### 2.1 Tenant master data

```
tenants
  id            bigint PK          -- snowflake ID from the platform ID generator
  code          varchar(64)  UK    -- globally unique, immutable after creation
  name          varchar(128)
  status        varchar(16)        -- active | suspended | archived
  plan          varchar(32)        -- reserved: plan marker (not consumed in V1)
  created_at / updated_at / deleted_at
```

Invariants:
- `code` is immutable after creation; matches `^[a-z][a-z0-9-]{1,62}$`
- Status transitions: `active ↔ suspended`, and `active|suspended → archived`; `archived` is terminal
- `archived` tenants must not log in, must not receive new tokens, must not produce new business writes
- Deletion (`deleted_at`) is allowed only for `archived` tenants and is an ops action, never exposed on business APIs

### 2.2 TenantMembership

```
tenant_memberships
  id            bigint PK
  tenant_id     bigint       -- FK → tenants.id, part of the composite unique key
  user_id       bigint       -- FK → iam users.id, part of the composite unique key
  role          varchar(32)  -- owner | admin | member (in-tenant role, not a global role)
  status        varchar(16)  -- active | disabled
  created_at / updated_at
  UK(tenant_id, user_id)
```

Invariants:
- A user may belong to multiple tenants; `(tenant_id, user_id)` is unique
- Every non-archived tenant has at least one `owner`; owner transfer is an explicit API action
- Membership removal = `status=disabled` (soft-disable), never a physical delete, to keep the audit chain intact
- In-tenant roles (owner/admin/member) and global IAM roles (`iam roles`) are **namespace-separated** with no implicit mapping

### 2.3 Resource tenancy (`tenant_id` propagation)

- Tables that carry tenancy get `tenant_id bigint NOT NULL DEFAULT 0`:
  - `tenant_id = 0` is reserved for **platform-level / global resources** (existing data under compat mode)
  - `tenant_id > 0` marks tenant-private resources
- Which tables carry `tenant_id` and which stay global is registered in the [tenant resource-scope matrix](../designs/TENANT_RESOURCE_SCOPE_MATRIX.md); new tables must register before merge (acceptance matrix T4)
- **Forbidden**: nullable `tenant_id` (ambiguous NULL semantics); foreign keys on tenant code strings; business code querying `WHERE tenant_code = ?` directly

---

## 3. Tenant Context (frozen)

### 3.1 Resolution priority (high → low)

1. Explicit header `X-Tenant-Id` (platform ops / admin scenarios; requires platform-level permission + audit)
2. Authenticated subject (`tenant_id` claim in the JWT, issued at login from the user's default tenant or the requested tenant)
3. Platform-scope fallback: the request landed on a route **explicitly declared as a platform admin API**, the subject holds a platform-level grant, and the subject belongs to no tenant → `tenant_id = 0` (multi mode, see §3.4)
4. Compat-mode fallback: `tenant_id = 0`

> **V1.1 clarification (2026-10-13)**: V1 listed only items 1/2/4 and confined the fallback to compat mode, so under multi mode a "non-tenant (platform) subject" was classified as §3.2's "missing context" (500 `TENANT_CONTEXT_MISSING`) and the platform console was entirely unusable. The new item 3 lands §3.3's already-acknowledged "platform admin API (explicit, platform-permission-gated, audited)" in the resolution layer: **`multi` is a superset of `compat`**, and `tenant_id = 0` (platform-level / global, §2.3/§4) is a first-class scope in both modes. Items 1/2 keep their priority; the compat fallback keeps its meaning (only its number moved to 4).

### 3.2 Propagation rules

- Tenant context is resolved **after the auth middleware, before business handlers**, and is read-only afterwards
- Business code **reads** the context only; rewriting the current request's tenant context inside a handler is forbidden
- Background/async jobs must carry tenant context explicitly (worker messages carry `tenant_id`); process-level globals are forbidden
- Missing context outside compat mode → reject (500 class = configuration error; 401/403 = authn/authz classes, see §5). **Scope**: route groups that have not declared the platform scope; a route declared as a platform admin API resolves per §3.1 item 3 (see §3.4)

### 3.4 Platform-scope declaration (V1.1 clarification)

§3.3 requires the platform admin API to be "explicitly declared". The declaration carrier is the **route group**, and it is the enablement condition for §3.1 item 3:

- An **undeclared** route group keeps V1 semantics: under multi mode a claim-less subject is rejected (deny-by-default) and gets no platform-scope fallback.
- A **declared** route group gains one extra fallback, gated on two conditions that must both hold:
  1. The subject holds a **platform-level grant** — a global role (e.g. `platform_ops`) or a global (domain-less) Casbin policy allowing this route. An in-tenant role (`role:<key>@tenant:<id>`) is not a platform grant (§4: the two namespaces are never merged or implicitly escalated).
  2. The subject **belongs to no tenant** — no active membership. That subject is exactly the §3.1 item-2 "zero memberships → no claim issued" platform population, so both sides must agree.
- The fallback therefore never overrides items 1/2: a subject with a claim resolves via item 2, and a subject holding a membership reaches the platform scope only through the explicit header of item 1 (which requires the platform grant).
- The fallback decides the **context** only; it does not relax §3.3's read invariants: a request resolving to `tenant_id = 0` may only read and write platform/global rows.
- Reference implementation: `internal/middleware.PlatformScopeTenantContextMiddleware` (declaring side) and `internal/middleware.TenantContextMiddleware` (strict semantics for the undeclared side); resolution logic lives in `pkg/tenant.Resolve`.

### 3.3 Data-access invariants (most critical)

- Every query against a `tenant_id`-bearing table **must** include `tenant_id = ctx.tenant_id` (or get it injected via a unified scope helper / GORM scope)
- Hand-written raw queries bypassing the scope helper are forbidden in business code; cross-tenant reads are allowed only via:
  1. Platform admin APIs (explicit, platform-permission-gated, audited)
  2. Statistics/reporting aggregation (a platform-layer read-only channel)
- Write paths must inject `tenant_id` via the unified helper; taking `tenant_id` from the request body to decide ownership is forbidden (sole exception: platform admin APIs specifying it explicitly)

---

## 4. Casbin Domain Dimension (frozen)

- The Casbin policy domain field is `tenant:<tenant_id>`; global (compat/platform-level) uses `tenant:0`
- Role namespace: in-tenant roles map to `role:<name>@tenant:<tenant_id>`; global roles carry no domain
- Check order: global roles/permissions first (platform capabilities), then in-domain roles (tenant capabilities); the two are never merged or implicitly escalated
- Legacy policy migration: under compat mode everything is `tenant:0`; migration is executed by the runbook, never implicitly

---

## 5. Error Codes (frozen)

| Scenario | HTTP | code |
|----------|------|------|
| Header names a tenant but subject lacks platform permission | 403 | `TENANT_FORBIDDEN` |
| Subject has no membership, or membership disabled | 403 | `TENANT_FORBIDDEN` |
| Login or write against a suspended / archived tenant | 403 | `TENANT_SUSPENDED` / `TENANT_ARCHIVED` |
| Missing context (non-compat) | 500 | `TENANT_CONTEXT_MISSING` (configuration error, alert) |
| Resource not in current tenant (query returns empty; no existence leak) | 200/404 | no new code: empty set or 404; "not found" vs "other tenant" is not distinguished |

---

## 6. Compat Mode (frozen)

- Switch: a feature flag in `system/config` (`tenant.mode = compat | multi`, default `compat`); readable at runtime, changes follow the config change process
- `compat` mode promises:
  - Existing single-tenant deployments keep running with **zero migration**: `tenant_id = 0` semantics; resolution lands directly on §3.1 item 3
  - No membership checks; all Casbin domains are `tenant:0`
  - Existing tests and API behavior unchanged — this is the regression baseline during canary (`2026-09-10-tenant-canary-slice`)
- `multi` mode: fully enables §3/§4/§5
- **`multi` is a superset of `compat`** (V1.1 clarification): under multi, §3.1 item 4 (the compat fallback) no longer applies, but the platform-level/global scope (`tenant_id = 0`) remains a first-class scope (§3.1 item 3). Non-tenant (platform) subjects and tenant subjects therefore **coexist in one deployment**; `platform.tenant_mode` expresses "is the tenant dimension enabled", not "an all-or-nothing world switch"
- Mode switching is one-way (per deployment): compat → multi; rollback means data rollback per the runbook — running multi and flipping back to compat to continue writes is forbidden

---

## 7. Ownership Boundaries (frozen)

| Concern | Owning domain | Forbidden |
|---------|---------------|-----------|
| tenants CRUD, lifecycle | `system/org` (a tenant is an org entity) | auth/iam/business writing the tenants table directly |
| Membership management | `system/org` provides capability; `system/iam` consumes it (at login) | iam maintaining the memberships table |
| Login-time tenant resolution & claims issuance | `system/auth` | auth querying the tenants table directly (go through org's read interface) |
| Casbin domain rules | `system/iam` | auth or business modules defining their own domain rules |
| Feature flag `tenant.mode` | `system/config` | modules inventing their own switches |
| tenant_id scope helper | `platform` | domains copy-pasting private implementations |
| Business resource tenancy | `business/*` (registered in the matrix) | business defining its own isolation mechanism |

---

## 8. Acceptance Anchors

- The [tenant-readiness checks](../acceptances/BUSINESS_MODULE_ACCEPTANCE_MATRIX.md) (matrix T1–T4) apply to every change touching tenancy semantics
- The canary slice (task 3) is the first runtime validation of this contract's behavioral promises; its isolation tests are the contract's acceptance tests
- Contract changes: after V1 freeze, modifications follow the contract-change process (bump version + change log + sync runbook/matrix)

---

## 9. Change Log

| Version | Date | Change | Nature |
|---------|------|--------|--------|
| V1.1 | 2026-10-13 | §3.1 gains a new item 3 "platform-scope fallback" (the former item 3 becomes item 4 with unchanged meaning); new §3.4 "platform-scope declaration"; §3.2 notes the scope of the reject rule; §6 notes "multi is a superset of compat" | Clarification |

**Trigger and scope of this clarification**

- Trigger: task `2026-10-13-tenant-console-remediation`. Under multi mode, `dashboard` / `system/dict/*` / `system/setting/*` / `system/operation-log/*` / `auth/operation-verify` all returned `500 tenant.context.missing`, `X-Tenant-Id` was unusable for any role other than `platform_ops` (403), and the platform console was unusable as a whole. Because the settings page failed the same way, the UI could not switch back to compat either (§6 also forbids switching back).
- Gap located: §3.3 requires the platform admin API to be "explicitly declared", but §3.1 never said how a declared route resolves its context. The implementation granted the fallback to compat only, so a platform-level subject under multi fell into §3.2's "missing context".
- Scope of the clarification: only §3 resolution semantics and §6 mode semantics are completed. **§2 (model), §4 (Casbin domain), §5 (error codes) and §7 (ownership boundaries) are unchanged**; §3.1's priority order and the item 1/2 conditions are unchanged.
- Implementation: `pkg/tenant.Resolve` (the `platform-fallback` resolution source), `internal/middleware.PlatformScopeTenantContextMiddleware`, `pkg/tenant.IsPlatformPopulationUser`; the route-group declaration list is in the task packet `2026-10-13-tenant-console-remediation`.

> Governance note: this record means runbook `TENANT_MIGRATION_RUNBOOK.md` §8 gate G4 ("no open contract-change") no longer holds automatically. G4 is the maintainer's call; this clarification does not declare G4 granted. The production DDL/data-change ban is unaffected by this document.
