# Response diff — S2-batch-and-envelope

No HTTP-observable change was produced by this wave (zero code diff). This document records the equivalence verification for the three findings against the current tree (`refactor/s2-error-mapping` branch point, which carries no tenant/batch diff relative to `origin/main`).

## RC-023 — batch handlers

Shared implementation: `common.BatchDelete` (pkg/common/batch.go).

| Packet requirement | Current tree |
|---|---|
| Parse ID list, reject empty input | `BatchDeleteReq{IDs []uint64 binding:"required"}` + `NormalizeUint64IDs` (drops zero/duplicates) |
| Invoke the service | `BatchDelete(ids []uint64, deleteOne func(uint64) error)` |
| Collect per-item failures | `BatchDeleteFailure{ID, Reason}` with `ResolveErrorMessageKey(err, "request.failed")` per item |
| Preserve permission checks | each handler runs its own authorization before calling the helper (helper holds no authorization) |
| Partial-failure semantics | shared tally: `deletedCount` / `failedCount` / `failures[]`; >1000 ids reject whole batch with `request.batch.too_large` |

Callers (all six families, non-test): `role_handler.go`, `dept_handler.go`, `post_handler.go`, `dict_handler.go` (two lists), `user_handler.go`, `permission_handler.go`.

## RC-025 — tenant envelope

Current tenant handler responses (grep `c.JSON(` = 0 matches): every handler path responds via `common.Success` / `common.Fail` / `common.FailWithError`, so the frontend parses one envelope shape. The nine cited raw sites were in `tenant_handler.go`, which no longer exists — its routes were re-homed during the tenant remediation waves (W8, #443) with their own evidence.

## RC-030 — user double wrapper

```
s.scoped(db)                          → tenant scope (tenant.WithTenantScope)
   .Scopes(database.WithDataScope(dataScope)) → dept/data-scope predicate
```

The outer wrapper is load-bearing in both `ListUsers` and `listUsersForExport`. Removing the "inner" one (as the packet's scope.in line contemplated before the proof) would have stripped tenant isolation; removing the outer one would strip data-scope. Neither is redundant — the packet's false-positive rule applies and the item is dropped.

## Net envelope delta

None. No response body, status, code or key changed in this wave.
