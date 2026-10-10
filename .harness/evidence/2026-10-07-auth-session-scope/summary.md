# Summary — auth-session-scope (F02 + F03)

## Changes

- F02 `backend/modules/auth/login/login_handler.go`
  - Self-service `DELETE /auth/sessions/:id` (`RevokeSession` handler) now calls
    `RevokeOwnedSession(userID, currentSessionID, target)` which verifies
    session ownership (SQL `session_id = ? AND user_id = ?`) and rejects the
    current session (that path is `/logout`). Previously it revoked by ID only.
- F03 `backend/modules/auth/session/session_service.go`
  - `Service` gains `tenantCtx` + `WithTenantContext` + `scoped()` (same clone
    pattern as LoginService/security.Service).
  - `ListAllSessions`: base query (count, active/revoked aggregates, rows) is
    tenant-scoped — a multi-mode manager only sees/counts own-tenant sessions.
  - `BatchRevokeSessions`: candidate IDs are resolved inside the tenant scope
    first (`Pluck session_id`), so cross-tenant IDs can neither be revoked nor
    have their Redis artifacts blacklisted; only actually-revoked rows get
    `RevokeSessionArtifacts`.
  - `RevokeAnySession`: scoped UPDATE; artifacts invalidated only when a row
    was actually revoked.
  - Compat (platform-global) context keeps the unfiltered view = the explicit
    platform operator exception.
- F03 `backend/modules/auth/login/login_runtime.go`
  - `Runtime.WithTenantContext` now wires `sessionSvc` into the tenant facade
    (it previously only wired login/security services).
- F03 handlers: `GetSessionList`, `BatchRevokeSessions`, `RevokeAnySession` use
  `h.service.WithTenantContext(tenant.FromGin(c))`.

## Tests added

- `modules/auth/session/session_tenant_scope_test.go` — 6 hostile tests
  (two-user F02, two-tenant F03, compat exception) with full DB+Redis closure
  assertions (row state, blacklist key, refresh-token validity).

## Verification

See `commands.json`; manifest verification command green.

## Acceptance mapping

1. Self-service revoke rejects foreign session + current-session rule — PASS.
2. Tenant-scoped managers cannot list/count/revoke/batch-revoke other tenants; explicit platform exception tested — PASS.
3. Two-user + two-tenant hostile tests pass; route→policy mapping reviewed — PASS (see review.md).
