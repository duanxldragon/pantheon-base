# Review: 2026-09-10-tenant-canary-slice

Reviewer posture: adversarial isolation reviewer (attempt cross-tenant reads/writes and context forgery).

## Adversarial attempts & outcomes

| Attempt | Vector | Outcome |
|---------|--------|---------|
| Read other tenant's dict by list filtering | `shared_code` exists in A, B, and global | B's list shows only B rows ✅ |
| Read by stolen ID | A's `secret_code` type ID used against tenant B service | not-found, no existence leak ✅ |
| Delete by stolen ID | `DeleteDictItem(aItem.ID)` as B | not-found ✅ |
| Batch smuggling | batch-status `[own, foreign]` as B | rejected — scoped read count mismatch ✅ |
| Export leak | export as A with B rows present | only A rows in CSV ✅ |
| Cache collision | warm A's cache then query B for same code | per-tenant cache keys prevent hit ✅ |
| Global escalation via tenant_id=0 in header | `X-Tenant-Id: 0` with `multi` | forbidden — 0 never selectable ✅ |
| Header forgery without platform role | `X-Tenant-Id: 43`, subject lacks platform override | forbidden ✅ |
| Unresolved context in multi mode | no claim, no header | `tenant.context.missing` deny-by-default ✅ |
| Write ownership forgery | crafting request body with tenant fields | ignored — ownership from context only (`tenantOwnerID`) ✅ |
| Membership bypass | no membership row / disabled row | `HasActiveMembership` denies both ✅ |
| Flag flip-back corruption | multi → compat data semantics | compat reads/writes tenant-0 population; one-way switch per contract §6 prevents write-after-downgrade by policy ✅ |

## Findings

1. **Scope coverage**: all read paths scoped (list/detail/count/stats/options/import lookups), all writes stamped from context, batch containment enforced, export filtered, cache namespaced — matches the task packet's full-passage requirement (query/write/update/delete/batch/export/cache). ✅
2. **Flag-off regression**: dedicated test proves compat path reproduces legacy behavior including row stamping (`tenant_id=0`). ✅
3. **Partial-schema safety**: 000013 uses the established information_schema guard pattern; bootstrap-scenario migration tests (3 variants) + fresh-run test all pass. ✅
4. **Diff discipline**: changes confined to `pkg/tenant`, `internal/middleware` (new file), dict canary paths, seed/flag, migration 13, and route wiring — no unrelated system tables or global auth/IAM paths touched. `pantheon-ops` untouched. ✅
5. **Stop-point check**: no cross-tenant leak, no default-allow, no cache/file cross-tenant hit, fully reversible via flag. No stop condition triggered. ✅

## Conditions / Notes

- Subject-claim resolution is wired but inert until the core auth/iam task issues `tenantId` at login — safe (deny-by-default), noted as explicit gap.
- Casbin domain enforcement is contract-frozen but outside this slice's resource (no dict-domain checks needed); core task must wire it for auth/IAM resources.
- Flag-on in a real deployment remains a maintainer gate; tests cover both flag states so flip risk is bounded.

## Verdict

**Approved. Canary slice passes all hostile isolation attempts with flag-off regression intact. Extension beyond the canary (core auth/iam, data-infra) may proceed after maintainer acknowledges the isolation evidence per the master plan.**
