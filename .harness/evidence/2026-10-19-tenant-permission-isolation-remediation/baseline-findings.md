# Baseline findings — 2026-10-19 tenant acceptance

Captured **before any fix**, on a live stack (`platform.tenant_mode = multi`), commit `0fed4a39` + local changes.
This file is the frozen input for `.harness/tasks/2026-10-19-tenant-permission-isolation-remediation/`.

## Measurement

| Suite | Assertions | Passed | Failed |
|---|---:|---:|---:|
| `acceptance/tenant_acceptance.py` (A0–A13) | 136 | 130 | 6 |
| `acceptance/ui_walkthrough.cjs` (14 console pages) | 23 | 22 | 1 |
| `acceptance/cross_tenant_leak.py` (L0–L4, two-tenant) | 34 | 27 | 7 |
| **Total** | **193** | **179** | **14** |

Fixtures: tenant A = `acme-demo` (id 282, deliverable, 3 roles); tenant B = `beta-1019091846` (id 291, created for the probe).
Both tenants hold a role with the same `role_key` `dsp_1019091846` (A `self`, B `all`).

## The defect cluster in one sentence

`role_key` is treated as a cross-tenant global namespace. The tables (`system_role`, `system_role_permission`,
`system_role_data_scope`) already carry `tenant_id` and `(tenant_id, role_key)` unique keys, but five of six
code points that read or write them degrade to role_key-only, and the console write path drops the tenant into `tenant_id = 0`.

## Defects

### F1 — tenant-created user cannot log in (P0)

```http
POST /api/v1/system/user            → code 200, user appears in list with dept + roles
POST /api/v1/auth/login             → code 403 tenant.forbidden
```

Root cause: `CreateUser` writes `system_user` only; no `tenant_memberships` row, and `GateSessionIssuance` requires an active membership.
Workaround used during acceptance: platform admin calls `POST /system/tenant/:id/members`.

### F2 — 16-minute lockout after credential change (P1)

`RevokeUserTokens` → `BlacklistUser` sets `blacklist:<userID>` with TTL `AccessTokenTTL + 1m`; login never clears it.
Observed keys: `blacklist:731`, `blacklist:732`, `blacklist:733`. Every request during the window → `401 token.expired.force`.

### F3 — tenant role navigation grants are lost (P0)

`rbacbind.insertRoleMenuSQL = "INSERT INTO system_role_menu (role_id, menu_id) VALUES (?, ?)"` — no `tenant_id`.
`loadRoleMenus` reads under `s.scoped(...)` (tenant filtered), so the grant written at `tenant_id = 0` is invisible.
Updating an existing tenant role deletes the rows then fails to rewrite them → grants permanently wiped.
Contrast: `replaceRolePermissions` resolves `roleOwningTenantIDTx` and writes `TenantID` — which is why permission keys are correct.

### F4 — ghost memberships after delete (P2)

`tenant_memberships` rows stay `active` after user deletion; member list shows `__deleted_user_*`.

### F5 — two `tenant.platformOnly` toasts per page (P1)

`TenantViewpointSwitcher` uses `hasPerm('system:tenant:list')` as the platform-capability proxy; a tenant admin holds the full
console key set, so it calls `GET /system/tenant/list` and gets `403 tenant.platformOnly` (twice under StrictMode).

### F6 — department tree renders only the root (P1)

`DeptList.tsx` binds the nested tree with `pagination.total={data.length}` and no `expandable`/`childrenColumnName`.
API returns 2 levels; the page shows "总数 1".

### F7 — data-scope console lists other tenants' roles (P0)

```http
GET /api/v1/system/permission/data-scope        (as acmeadmin)
→ code 200, data.total = 53
→ items include roleKey = bleak_1019091846   (exists only in tenant 291)
```

Tenant A owns 3 roles. Root cause: `ListDataScopePolicies` queries `system_role` with only `deleted_at IS NULL`.

### F8 — cross-tenant data-scope write succeeds (P0)

```http
PUT /api/v1/system/permission/data-scope/bleak_1019091846   {"mode":"self"}
→ code 200 success
→ row: tenant_id=0, role_key=bleak_1019091846, mode=self
```

Root cause: `ensureRoleKeyExists` = `WHERE role_key = ? AND deleted_at IS NULL` — existence in **any** tenant passes.

### F9 — policy writes lose the tenant dimension (P1)

```
tenant_id | role_key       | mode
0         | dsp_1019091846 | self   ← permission console (no TenantID assigned, OnConflict on role_key)
282       | dsp_1019091846 | self   ← role module (correct)
291       | dsp_1019091846 | all    ← role module (correct)
```

### F10 — one tenant changes another tenant's visible rows (P0)

| Step | Action | B user `bob` visible rows |
|---|---|---|
| 1 | both tenants' shared key = `self` | **1** |
| 2 | A sets the shared key to `all` | — |
| 3 | `bob` lists users again | **3** |

Reverse direction identical (A user `amy` 1 → 3 after B's write). Stored rows during the run:
`[['0','all'], ['282','self'], ['291','self']]` — B's own policy was still `self`.

Root cause: `SystemRoleDataScope` has no `TenantID`; `loadRoleDataScopePolicies` filters on `role_key` only;
`resolveDataScopeMode` returns `all` if any matching row is `all`.

### F11 — custom deptIds are not tenant-validated (P1)

```http
PUT /api/v1/system/permission/data-scope/dsp_1019091846   {"mode":"custom","deptIds":[203]}   # 203 belongs to tenant 291
→ code 200; stored dept_ids = "203"
```

### F13 — role list echoes another tenant's dataScope (P1)

```
A list=self  stored(self) ; B list=self  stored(all)
snapshot(id,tenant,mode)=[['297','282','self'], ['298','291','all'], ['324','0','self']]
```

Root cause: `RoleService.loadRoleDataScopes` → `WHERE role_key IN (...)`.

### F14 — cross-tenant role reads return 500 (P2)

`GET /system/role/:id/users`, `/user-candidates`, `PUT /system/role/:id` → `code 500 request.failed` (expected 404/403).

## Confirmed safe (do not regress)

- Business data rows do not cross tenants (A11 8/8); `WithDataScope` only narrows inside the tenant scope.
- Role list is tenant-filtered; `X-Tenant-Id` switching by a tenant admin → `403 tenant.forbidden`.
- `system_role_permission` is correctly isolated by `(role_id, tenant_id)` (L2b 3/3).
- Casbin domain subjects carry `@tenant:` and are independent; cross-tenant policy creation is blocked by
  `403 permission.escalation.forbidden` (the reserved F12 does not exist).

## Reproduction

```bash
cd "C:/Users/xiaolong/WorkBuddy AI/2026-10-19-08-42-36/acceptance"
python tenant_acceptance.py
NODE_PATH=<frontend>/node_modules node ui_walkthrough.cjs
python cross_tenant_leak.py
```

Raw artifacts: `acceptance/{acceptance-run.log,ui-run.log,leak-run.log}`,
`acceptance/cross-tenant-result.json`, `acceptance/evidence/leak-*.json`.
