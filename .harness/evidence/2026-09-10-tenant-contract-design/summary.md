# Evidence: 2026-09-10-tenant-contract-design

## Deliverables

- `docs/contracts/TENANT_CONTRACT_V1.md` (zh) + `docs/contracts/TENANT_CONTRACT_V1.en.md` (en) — frozen contract:
  - In/Out scope (shared schema MVP only; schema-per-tenant, billing, cross-tenant sharing explicitly out)
  - Core model: `tenants` (code immutable, status `active↔suspended→archived` terminal) and `tenant_memberships` (UK(tenant_id,user_id), soft-disable, owner/admin/member namespace separated from global IAM roles)
  - Resource tenancy: `tenant_id BIGINT NOT NULL DEFAULT 0`, `0` reserved for platform/global, scope matrix registration mandatory for new tables
  - Tenant context: resolution priority (X-Tenant-Id platform-only → JWT claim → compat fallback `0`), read-only propagation, deny-by-default on missing context outside compat
  - Casbin domain: `tenant:<id>` / `tenant:0`, check order global-then-domain, no implicit escalation
  - Error codes: TENANT_FORBIDDEN / TENANT_SUSPENDED / TENANT_ARCHIVED / TENANT_CONTEXT_MISSING; no existence leak (empty set or 404)
  - Compat mode: `tenant.mode = compat|multi` in system/config, one-way switch, compat = zero-migration regression baseline
  - Ownership boundaries table (org owns tenants/memberships; auth resolves at login; iam owns Casbin domain; config owns flag; platform owns scope helper)
- `docs/designs/TENANT_RESOURCE_SCOPE_MATRIX.md` + `.en.md` — Phase-1 scope classification (created during Task 0 guardrails, referenced by the contract as the authoritative registry)
- `docs/designs/MULTI_TENANT_DESIGN.md` — status reconciled to "Superseded by contract V1", linked to contract + runbook (task packet "Modify" item)
- `docs/designs/P2_SCALE_ROADMAP.md` §4 — decision + gate linkage added (task packet "Modify" item)

## Key Decisions (with rationale)

| Decision | Status | Rationale |
|----------|--------|-----------|
| Shared schema + `tenant_id` (not schema-per-tenant) | Frozen | Rung `reuse`: smallest reversible step; runbook §2 inventory shows ~31 tables, column-add is instant DDL on MySQL 8.0 |
| `tenant_id=0` global sentinel + compat default | Frozen | Existing single-tenant deployments run zero-migration; flag-off regression baseline for canary |
| Membership soft-disable, no physical delete | Frozen | Audit chain integrity (audit reviewer requirement) |
| In-tenant roles namespace-separated from IAM roles | Frozen | `role_key == "admin"` cannot mean cross-tenant authority (task packet note) |
| Casbin domain `tenant:<id>` in policy field, not a new column on casbin_rule | Frozen | Reuses existing unique index `(ptype,v0..v5)`; migration = data rewrite under flag, no DDL on casbin_rule |
| Deny-by-default on missing/conflicting context | Frozen | Task packet implementation note; hostile-test target |
| One-way compat→multi switch | Frozen | Prevents "ran multi, flipped back, wrote global rows" corruption; rollback = data restore per runbook |

## Human Gate Honored

Contract freeze is declared (status: Approved in frontmatter) as the deliverable of this design task. The master plan's gate (contract frozen before runtime tasks) is satisfied; runtime implementation proceeds via the separately gated canary task.

## Verification

- `check-doc-frontmatter`: 0 errors (contract docs pass doc_type=Contract; runbook uses doc_type=Guide)
- `check-doc-links`: 0 findings
- No backend/frontend/runtime files touched by this task (contract-only). `git status` scoped to docs + .harness.

## Gaps

- Seed/rehearsal fixtures for two-tenant spec are defined in the canary task (implementation), not duplicated here.
