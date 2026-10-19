# Architecture review — tenant permission isolation

Reviewed against `docs/contracts/TENANT_CONTRACT_V1.md` §2.3 / §4 / §7 and
`docs/designs/TENANT_RESOURCE_SCOPE_MATRIX.md`, on the 2026-10-19 baseline.

## 1. Why this is one cluster, not thirteen bugs

The 13 defects split into three mechanisms that share a single missing property — **tenant_id is present in the
schema but not enforced on the path**:

| Mechanism | Defects | Shape |
|---|---|---|
| **A. Global namespace** — `role_key` used as an identifier across tenants | F7, F8, F13 | read/validate by key, never by `(tenant, key)` |
| **B. Lost write dimension** — writes default to `tenant_id = 0` | F9, F3 | insert without the tenant column, so the row becomes global |
| **C. Missing read predicate** — reads ignore the tenant column that exists | F10, F11, F7 | `WHERE role_key IN (...)` on a table that has `tenant_id` |

F1/F4/F2/F5/F6 are independent but ride the same acceptance run; they are sequenced after the cluster because
they touch different files and would otherwise obscure the cluster review.

## 2. Predicate coverage matrix (baseline)

`system_role_data_scope` is the only table in the cluster whose tenant column is ignored on **both** sides.

| Code point | File | Reads/Writes | Tenant predicate (baseline) | Verdict |
|---|---|---|---|---|
| `ListDataScopePolicies` | `permission/permission_data_scope.go:23` | R (`system_role`) | ✗ `deleted_at IS NULL` only | leak (F7) |
| `UpdateDataScopePolicy` | `permission/permission_data_scope.go:80` | W | ✗ no `TenantID`, conflict on `role_key` | leak (F8/F9) |
| `ensureRoleKeyExists` | `permission/permission_service.go:762` | R | ✗ any tenant | leak (F8) |
| `loadRoleDataScopePolicies` (permission) | `permission/permission_data_scope.go:130` | R | ✗ `role_key IN` | leak |
| `SystemRoleDataScope` + `loadRoleDataScopePolicies` (middleware) | `middleware/data_scope_middleware.go:37,205` | R | ✗ no `TenantID` field at all | leak (F10) |
| `RoleService.loadRoleDataScopes` | `role/role_service.go:759` | R | ✗ `role_key IN` | leak (F13) |
| `RoleService.upsertRoleDataScopePolicy` | `role/role_service.go:740` | W | ✓ `TenantID` + `(tenant_id, role_key)` | correct |
| `replaceRolePermissions` | `role/role_helper.go` | W | ✓ `roleOwningTenantIDTx` | correct |
| `InsertRoleMenus` | `pkg/rbacbind/rbacbind.go` | W | ✗ no tenant column | leak (F3) |
| `loadRoleMenus` | `role/role_menu.go` | R | ✓ `s.scoped(...)` | correct |
| `resolvePolicySubject` | `permission/permission_service.go:748` | W | ✓ honours `tenantId`, domain subject | correct |
| `CasbinDomainPolicySubjects` | `pkg/tenant/authz.go:368` | R | ✓ global + `@tenant` variants | correct |

**Reading of the matrix**: the "correct" rows are exactly the ones that resolve the tenant from the **owning row**
(`roleOwningTenantIDTx`) or from an explicit argument. Every "leak" row either has no tenant concept at all
(the middleware struct) or resolves nothing and hopes the key is unique. That is the invariant to enforce:
*resolve the tenant from the owning entity, never from the identifier alone.*

## 3. Blast radius and ordering

| Wave | Blast radius | Why this order |
|---|---|---|
| W0 | none (docs + tests) | establishes the review rule before code moves |
| W1 | every data-scope-governed request (hot path) | highest risk and highest value; doing it first means later waves write code under the new convention |
| W2 | user creation / deletion | independent, high customer visibility |
| W3 | role create/update | shares `system/iam` with W2, reviewable together |
| W4 | login / token lifecycle | security-sensitive ordering (clear only after auth) |
| W5 | console only | can be inserted anywhere after W0 |

## 4. Non-obvious risks

1. **Fail-closed must survive the predicate.** `rolePoliciesCoverAll` currently denies when a role has no policy row.
   Adding `tenant_id = ?` narrows the result set; if the coverage check is relaxed at the same time, a missing row
   silently becomes `all` — the exact opposite of the intended behaviour. W1 must keep a dedicated test.
2. **`tenant_id = 0` is overloaded.** It is both "platform/global scope" and "the value a buggy writer produced".
   After the fix, a `0` row is legitimate for platform roles (`admin`) and illegitimate for tenant roles. The migration
   must therefore classify rather than blanket-update.
3. **The middleware struct is the real defect site, not the query.** `SystemRoleDataScope` has no `TenantID` field, so
   GORM cannot even express the predicate. Adding the field is a schema-visible change to the struct that mirrors the
   table; the query fix is trivial afterwards.
4. **The console is the only write entry point, so removing it removes the attack surface.** Until W1 lands, revoking
   `system:permission:data-scope` from tenant roles is a complete mitigation (report §5.6).
5. **`ensureRoleKeyExists` is shared by three call sites** (`UpdateDataScopePolicy`, `CreatePolicy`,
   `validatePolicyPayload`). Adding a tenant parameter changes all three; `CreatePolicy` legitimately needs the
   platform path (`tenantId = 0` body field), so the signature must distinguish "platform caller" from "tenant caller"
   rather than defaulting to the resolved tenant.

## 5. What is explicitly not wrong

- `pkg/database/scope.go` — `WithDataScope` narrows correctly; the defect is the scope fed into it.
- `pkg/tenant/authz.go` — domain subject construction and the global-then-domain consult order are correct, and the
  `permission.escalation.forbidden` guard already blocks cross-tenant policy creation.
- `system_role_permission` — already keyed by `(tenant_id, role_id, permission_key)` and written with the owning tenant.

## 6. Verdict

The cluster is **fixable in one migration plus five function signatures**, with no schema redesign:
add `TenantID` to the middleware struct, thread the resolved tenant through three read paths, assign it on the write
path, and give `InsertRoleMenus` the tenant argument its sibling already has. The risk is concentrated in W1's hot path,
which is why W0 lands the failing tests first.

## 7. Post-remediation verification (2026-10-19)

All seven waves ran. The invariant from §2 was applied consistently:

- **W1** — every data-scope read takes an explicit tenant; the write stamps `tenantOwnerID()` and conflicts on
  `(tenant_id, role_key)`; fail-closed still denies a missing row.
- **W2** — the membership is written from the user row's resolved tenant in the same transaction as the user;
  deactivation, not deletion, on delete.
- **W3** — the menu grant is stamped from the **role row** (`roleOwningTenantIDTx`), matching the pre-existing
  `replaceRolePermissions` pattern. This is the strongest confirmation that the invariant is the right one:
  where the codebase already resolved the owning entity, it was already correct.
- **W4** — the user-level blacklist is cleared only after issuance; session-level markers keep pre-change tokens dead.
- **W5** — platform capability now comes from `/auth/tenants/current` scope, not from a permission key; the department
  table paginates flat rows.

Final measurement: 136/136 + 23/23 + 34/34 = 193/193. F14 is the only residual (P2 error shape, no data disclosure).

### Residual architectural notes

1. `tenant_id = 0` remains overloaded (platform scope vs. legacy defect value). The migrations classify by ownership
   instead of blanket-rewriting, which keeps platform rows authoritative for platform roles.
2. Platform scope still reads all tenants' roles. W5 makes the scope visible, but a platform-scope read of a tenant
   role's menu/data scope remains empty because those reads filter on tenant 0. This is consistent with the contract
   (§3.3 keeps platform and tenant scopes distinct) and is not a leak; it is a usability gap.
3. The static-check idea from W0 (lint against a `role_key` query without `tenant_id`) is still not implemented;
   enforcement currently rests on the contract clause plus the regression tests.

## Machine Readable

```json
{
  "taskId": "2026-10-19-tenant-permission-isolation-remediation",
  "verdict": "approved with documented P2 follow-up",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-19-tenant-permission-isolation-remediation/manifest.json",
    "evidence": ".harness/evidence/2026-10-19-tenant-permission-isolation-remediation/commands.json",
    "reviewFile": ".harness/evidence/2026-10-19-tenant-permission-isolation-remediation/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-19-tenant-permission-isolation-remediation.task.md",
      "docs/contracts/TENANT_CONTRACT_V1.md"
    ]
  }
}
```
