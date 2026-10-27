# Review — S1 `2026-10-27-s1-api-surface-narrowing`（收窄导出面）

Reviewed against the working tree on branch `refactor/s1-api-surface-narrowing-2026-10-27`
(stacked on the S1 deletion commit; base `main b13e6b77`). Measured diff for this wave:
**3 files, +11 / −9**.

## Reviewer posture, item by item

| Posture item | Reading |
|---|---|
| No exported symbol lost an external consumer | The unexports are compile-time probes: `go build ./...` fails if any package outside the owning package still used `IsI18nMessageKey`, `InsertRoleMenu` or `InsertUserRole`. It is green in base and in the `pantheon-ops` overlay. `rbacbind_test.go` uses the plural batch variants (`InsertRoleMenus`/`InsertUserRoles`), which keep their exported names and their test coverage. |
| Permission error responses still carry `common.CodeForError`'s mapping | RC-029 was **not** executed as written: `permission_handler_test.go:22` calls `permissionServiceErrorCode` by name, a call site the packet's "single call site" claim missed. The programme's Out list forbids editing test assertions to admit a refactor, so the wrapper is restored with a comment stating why it exists. `go test ./modules/system/iam/permission/...` passes unchanged (10.708s). This is the honest closure: a false positive, not a forced deletion. |
| `route_groups.go` and `migrate.go` unchanged | `git diff --stat` for the wave lists exactly `error.go`, `rbacbind.go`, `permission_handler.go`. RC-006 (`RunAutoMigrate`) and RC-008 (`ProtectedGroupWithRedis`) are decision records in `summary.md`, not code changes — the packet's own default for RunAutoMigrate is keep, and the delegated gate answer follows that default. |
| Equivalence | The two renames are mechanical (`sed` on 4 declaration/call lines each); grep confirms the new names appear only inside their owning packages and the old names are gone. No behaviour can change through a rename; the false-positive restore changes nothing at all. |

## What the wave refused to do

- No merge of `pkg/common` and `pkg/common/http` message-key logic (RC-019 belongs to S2 and
  needs its own equivalence tests).
- No test edited or deleted — the RC-029 wrapper survives precisely because of this rule.
- No doc rewritten; the audit docs keep their statements, the programme closeout reconciles.

## Verdict

Small, exactly scoped, with one honest deviation (RC-029 → false positive) recorded rather than
forced. Ready to merge once the S1 deletion wave it is stacked on merges.
