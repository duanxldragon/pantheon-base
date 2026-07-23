# Summary — Security-event cleanup permission chain + remove undesigned i18n table-head

## Problem 1: security-event 清空历史事件 looked frontend-only

Reported: the security-audit → security-events clear-history feature seemed to
have no backend. Investigation showed the whole chain exists (UI
`GovernanceCleanupBar` → `POST /system/security-event/cleanup` → Casbin +
SecureAction middleware → handler → service, with service tests). The real gap
is in the **permission chain**: `requiredAPIPoliciesByPermissionKey` (the
single source the permission workbench uses both to *report* and to
*one-click remediate* role API policies) only mapped
`system:security-event:list`. Granting `system:security-event:clear` or
`:acknowledge` to a non-admin role therefore never produced the Casbin rules,
the workbench reported "complete", and every cleanup call failed Casbin with
403 — surfacing in the UI as a generic 操作失败, i.e. "no backend".

Fix: register the missing mappings —

| Permission key | Required API policies |
|---|---|
| `system:security-event:acknowledge` | `POST /api/v1/system/security-event/:id/acknowledge`, `POST /api/v1/system/security-event/batch-acknowledge` |
| `system:security-event:clear` | `POST /api/v1/system/security-event/cleanup` |

The Casbin model matcher already uses `keyMatch2`, so the `:id` pattern is
enforced correctly. Admin was never affected (wildcard `/api/v1/*` seed).

## Problem 2: i18n 管理翻译表最上方的 "翻译详情" 标题

`I18nList.tsx` rendered a `system-list__table-head` block above the
translation table whose title reused the row-detail modal's key
`i18n.viewTitle` ("翻译详情"). No other page uses this block; it was never in
the design and bypassed the UI gate. Removed the whole block — the record
count it duplicated is already shown by the standard pagination
(`buildStandardPagination` showTotal). The `i18n.viewTitle` key stays: it is
still the (designed) row detail modal title.

## Verification

go build + permission workbench tests (incl. new
`TestPermissionWorkbenchRequiresSecurityEventActionPolicies`), tsc, eslint,
system page admission (16 entries), shell visual contract, i18n hardcode scan,
UI contract (0/228), smoke web-base + coverage contracts — all green. See
commands.json; rendered-screenshot omission reason recorded there.

## Residual risk

- login-log / session action permissions have the same missing-mapping class;
  deferred and documented in the task manifest.
- Existing roles that were already granted clear/acknowledge need one
  workbench "一键补全" run (or re-grant) to materialize the new policies.
