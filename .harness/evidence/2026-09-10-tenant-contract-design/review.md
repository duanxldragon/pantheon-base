# Review: 2026-09-10-tenant-contract-design

Reviewer posture: auth/IAM/database reviewer; adversarially challenge hidden global scope.

## Adversarial checks

1. **Hidden global scope via admin role**: contract §2.2/§4 separates in-tenant roles from global IAM roles and requires domain-scoped Casbin checks — `role_key == "admin"` grants no cross-tenant authority. Platform admin APIs are an explicit, audited path (§3.3). ✅
2. **Context forgery**: `X-Tenant-Id` requires platform-level permission + audit (§3.1); JWT claim is issued only at login from a trusted resolution; untrusted client input can never establish tenancy. Deny-by-default on missing/conflicting context (§3.2). ✅
3. **Existence leak**: error-code table forbids distinguishing "not found" from "other tenant's" (§5, empty set or 404 only). ✅
4. **Compat regression baseline**: §6 promises zero-migration behavior for existing deployments; one-way switch prevents write-after-downgrade corruption. ✅
5. **Data-integrity**: no nullable `tenant_id`, no string-code foreign keys, mandatory scope-matrix registration before merge (§2.3, matrix T4 guardrail landed in Task 0). ✅
6. **Boundary crossing**: ownership table (§7) keeps auth from querying tenants directly, business from defining its own isolation — consistent with PLATFORM_CONTRACT domain rules. ✅

## Conditions

- Contract change process (§8) applies to any post-freeze modification.
- Casbin legacy-policy rewrite (runbook §3.4) remains gated behind the migration runbook G1–G4.

## Verdict

**Approved. Contract V1 frozen.**
