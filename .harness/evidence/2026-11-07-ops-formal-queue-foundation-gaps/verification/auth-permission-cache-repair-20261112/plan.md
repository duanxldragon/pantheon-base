# Current permission cache revocation repair

Parent L2: 2026-11-07-ops-formal-queue-foundation-gaps; consumer dependency: Ops O2/O4/D3 and CMDB key-only acceptance. Owner: system/auth. Implementer: assigned Generator; independent CODE and ARCH reviewers remain separate. Quality Profile: auth-security, permission-policy. Minimum complexity: reuse authoritative native database query; remove stale permission-cache fast path.

## Evidence and scope

The consumed CMDB R3 run returned successful public empty-role update and exact empty-role readback, then failed its original-session /auth/me permission assertion. The raw failed permission array was not retained; the cause for that single response is a high-confidence inference. Native source definitively reads user_perms:<id> before ordinary permissions from the database, writes positive entries for five minutes, and has no caller of InvalidateUserPermCache after role/user updates. Enforcer.LoadPolicy updates API policies but does not invalidate that permission array. Root will not weaken the current-permission oracle or replay the consumed run.

## Minimal design

Remove only Redis permission-array reads and writes from Runtime.GetUserPerms. Every call uses the existing owning-tenant lookup, distinct user-role/role-permission join, merge and platform-only filtering; existing database errors remain errors. No IAM-to-auth import, callback, new dependency, environment setting, schema or registry. Existing public cache-invalidation compatibility surface may remain; no cached value authorizes or populates current permissions. Do not introduce one-shot DEL as a substitute: concurrent refill can recreate stale state.

A read that began before a transaction commits may observe the old committed state. A subsequent read after commit must reflect grants/revocations; no Redis refill can prolong old authority. Database failure must not fall back to old cache. Existing tenant/platform restrictions, role inheritance/API engine, authentication/session/CSRF contracts and DataScope behavior are retained.

## Verification and completion

Preserve native failed-before witnesses. Test actual native role permission grant/revoke/current-user reads with a stale Redis permission entry, including empty revocation, regrant and user-role unlink; test tenant filtering and database error with a stale entry. Use existing testmysql and authorized isolated Redis fixture through Root-only secret injection, CGO1/MinGW/Go1.26.10. Run native gopls and appropriate targeted race before exact source review. Keep draft and old evidence separate; do not modify an already frozen O2 draft.

After fresh source CODE/ARCH approval, Root applies approved Base inputs, generates and consumes a normal combined candidate, builds a fresh isolated runtime, and executes a separately reviewed fresh CMDB request proving original-session immediate revocation and zero retained grants. Old PID28876 cannot prove this repair. Final stable full gates and formal release consumption remain required. No parent P0 closeout, preview restart, old-resource cleanup or Velero work follows from this plan.

## Implementation status — 2026-11-12

Implemented in `backend/modules/auth/login/login_runtime.go`: `GetUserPerms` no longer reads or writes the Redis permission array and `dropStalePlatformOnlyPerms` is removed; `InvalidateUserPermCache` remains only as a legacy-leftover clearing surface. Regression `permission_cache_revocation_test.go` seeds a stale entry in a real Redis, deletes the grant in MySQL and asserts the revoked key is absent, the stale entry is neither read nor rewritten, and a regrant is immediately visible.

Evidence: [result.json](./result.json). Red witness on the pre-repair source: `revoked permission survived through the cache: [system:user:list system:user:delete]`; the repaired source passes. `go test` over auth/login, permissionroutes, iam/role, iam/permission and contracts passes (`254.286s` for login), `go vet` and `go build ./...` pass. Environment: MySQL `127.0.0.1:33316` isolated testmysql schemas, task-owned Redis `127.0.0.1:26317` DB 3, CGO 1, Go 1.26.10; shared Redis 6379/26316 untouched.

Still open: full `./...` CGO race, independent CODE/ARCH review, normal combined candidate, fresh isolated runtime CMDB request, official release publication and Ops consumption. The consumed R3 run is not replayed and its product-versus-oracle classification remains open.
