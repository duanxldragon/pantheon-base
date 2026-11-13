# Activity writer implementation and handoff notes

This is implementer evidence, not independent review or approval. Review and publication remain outside the executor adapter scope.

## Changed behavior

`RefreshSessionActivity` preserves its exported signature. It rejects an uninitialized store, nil context/data, canceled context, missing session, invalid/null JSON, different user/username/session/original tenant/ordered roles, and Redis failures. After reading and validating identity in Go, the Lua script compares the exact raw value again, requires positive PTTL, and conditionally writes with XX/KEEPTTL. There is no AccessTokenTTL fallback. The existing issuance helper, legacy middleware cache/default routes and session lifecycle are unchanged.

The raw compare also rejects a same-identity payload changed during the read/write interval. This deliberately makes activity tracking best effort under contention, as existing middleware already treats unsuccessful activity updates. There is no retry or issuance fallback. KEEPTTL retains the absolute expiry rather than rounding or recomputing it. Go comparison keeps uint64 claims exact, including adjacent IDs above 2^53.

## Deterministic regression cases

- `TestRefreshSessionActivityRejectsMissingAfterRead`: real Redis deletion and server expiration after earlier validation; explicit ErrNotFound, independent ValidateSession denial and absent key.
- `TestRefreshSessionActivityRejectsPersistentOrInvalidPayload`: no-TTL, malformed and null payloads; explicit ErrInvalid and unchanged payload/absolute expiry.
- `TestRefreshSessionActivityRejectsDifferentIdentity`: user, adjacent large user, session, username, tenant, adjacent large tenant, roles and primary-role order; stale activity cannot overwrite the replacement.
- `TestRefreshSessionActivityPreservesMillisecondExpiration`: same-session update in tenant 0, tenant 7 and large tenant; exact PEXPIRETIME equality and nonextended positive PTTL, followed by independent payload validation.
- `TestRefreshSessionActivityRejectsNilAndStoreErrors`: nil store/data/context, canceled context, closed client and Redis WRONGTYPE; explicit error and unchanged stored value/expiration.
- `TestRefreshSessionActivityAtomicReadWriteInterleaving`: actual Redis GET finishes, then a separate connection deletes, expires, persists or replaces the key; cancellation/closed writer also occur after GET. The subsequent write rejects the changed state. Hook assertions prove the interleaving actually ran.
- `TestLegacyTokenActivityCannotResurrectBeforeFreshValidation`: existing resolve/cache/activity path with a login-tenants request context; deleted/expired keys remain absent, cache activity does not advance, independent ValidateSession checks reject entry/release continuations and provider-like counters remain zero.

## Evidence interpretation and remaining gates

`resume-token-red.jsonl` / receipt record actual Redis failures before the production fix, pinned to the original token.go hash. The initial green logs precede stronger cancellation/store-boundary and unchanged-value assertions; the final race logs and before/after scoped source manifest are authoritative for the final tests. Skipped tests must be reported separately, never accepted as pass. A package with no test files is likewise reported separately.

Scope covers the auth token package, middleware and all existing auth subpackages. Full backend/frontend suites, new BusinessTokenAuthMiddleware, RefreshPrincipal, full login-tenants HTTP integration, actual provider/history release checks, downstream Base-to-Ops consumption, independent review and release gates remain open. These regression fixtures prove the current primitive boundary; they do not claim implementation of the planned tenant architecture or external runtime acceptance.

Parent scope and authorization are recorded in `resume-token-scope.md`. No commit, push, release, lock/baseline edit or remote mutation is performed.
