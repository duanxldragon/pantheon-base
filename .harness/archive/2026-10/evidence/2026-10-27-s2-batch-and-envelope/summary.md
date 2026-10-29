# S2-batch-and-envelope — summary

Task: 2026-10-27-s2-batch-and-envelope · Result: **completed with zero code diff** — every finding was already resolved before dispatch.

## Finding-by-finding disposition

### RC-023 — batch handler convergence: already converged

`common.BatchDelete(ids, deleteOne) BatchDeleteResp` (pkg/common/batch.go, with `MaxBatchIDs=1000`, id normalization, per-item failure tally) predates the audit — it landed with the #59 consolidation and was hardened in #181, and `batch_test.go` covers the tally semantics. All six handler families named by the packet already call it: role, dept, post, dict (both lists), user, permission (verified by caller grep across `modules/`, no test-only hits). The helper's design already matches the packet's requirement: authorization stays at the call site (each handler's permission check runs before the batch call), partial-failure counts come from the shared tally.

### RC-025 — tenant raw c.JSON: surface no longer exists

`grep -rn 'c.JSON(' modules/system/iam/tenant/` → zero matches. The nine raw `c.JSON` sites cited at tenant_handler.go:90…347 lived in a file that the tenant remediation program deleted (tenant_handler.go removed from main before the S2 waves started; the packet's expectedFiles still listed it). The surviving tenant surface (tenant_ops_handler.go, tenant_platform_handler.go) responds through `common.Success` / `common.Fail` / `common.FailWithError`. The frontend check demanded by the packet's implementationNotes is moot: no raw shape exists to parse.

### RC-030 — user_service double scope wrapper: false positive, dropped

The packet's own rule: "If the outer layer adds a dept or data-scope predicate, the item is a false positive and is dropped." Both surviving call sites compose deliberately:

- `ListUsers` (user_service.go:247): `s.scoped(s.db.Model(&SystemUser{})).Scopes(database.WithDataScope(dataScope))`
- `listUsersForExport` (user_export.go:408): same composition with `WithContext`

`database.WithDataScope` (pkg/database/scope.go:12, tested in scope_test.go) applies the operator's dept/data-scope predicate on top of the tenant scope — a tenant × data-scope intersection, not a duplicated wrapper. Dropped with proof.

## Verification

- Caller grep, history trace, and the two sed reads above are recorded in commands.json with real outputs.
- `node scripts/harness/check-task-packet.mjs --root .`: 66 file(s), 0 error(s), 41 warning(s) (baseline).
- No build/test deltas: no code changed in this wave; the branch carries only `.harness` bookkeeping.

## Expected-files drift

- `tenant_handler.go` in the packet's modify list no longer exists on main.
- `backend/pkg/common/batch_handler.go` + test (packet create list) were unnecessary: `batch.go` + `batch_test.go` already exist.
- No handler files modified.

## Program accounting

S2 remaining after this wave: **import-export-pipeline only** (maintainer gate recorded in the programme manifest; delegation recorded 2026-10-28).
