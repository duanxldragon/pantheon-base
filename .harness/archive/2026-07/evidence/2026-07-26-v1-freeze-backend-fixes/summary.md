# Summary — 2026-07-26-v1-freeze-backend-fixes

All 12 backend findings from the V1 freeze deep review fixed across three
stacked branches (maintainer decision: every known issue fixed before the
V1 release). Codex relay remained 401-unavailable; implemented directly per
maintainer precedent (2026-07-23), noted in each commit body.

## PR 1 — fix/v1-freeze-delete-integrity (6 commits)

1. Role delete purges `system_role_data_scope` (+ legacy
   `permission_role_data_scope_policy` when present) inside the tx; the
   protected-role and member-count guards moved into the tx with a
   `SELECT ... FOR UPDATE` row lock. Regression test proves a re-created
   role_key no longer inherits the dead role's `custom` scope, plus a
   rollback test (forced mid-tx failure leaves the role undeleted).
2. User delete cascades: `system_user_profile_ext`,
   `system_user_password_history`, `system_auth_factor` (MFA TOTP secret),
   `system_auth_mfa_challenge` via a new `SessionLifecycle.
   PurgeUserAuthArtifacts` seam (HasTable-guarded, runs in the delete tx).
   Deviation from the audit note: `system_login_throttle` keys are
   `ip:<addr>` only (`buildLoginSourceKey`), there are no user-keyed rows,
   so throttle purge is N/A. Login/oper logs kept for audit retention.
3. Menu delete removes `system_role_permission` rows only when the deleted
   menu was the key's last live owner (shared keys survive — tests cover
   both directions).
4. Dept delete (previously no tx at all) and post delete pre-checks moved
   inside transactions with row locks; error keys unchanged; existing
   contract tests pass unmodified. Residual documented: a concurrent child
   INSERT is not blocked by the parent row lock under REPEATABLE READ.
5. Dynamic module unregister wraps menu/permission cleanup + status update
   in one tx; DROP TABLE (implicit-commit DDL) runs after commit and a
   failure is retryable via purge with the registration intact. Failure-
   injection tests for both directions.
6. Migration 000011 adds `idx_system_user_dept_id` / `idx_system_user_post_id`
   (000009 idempotent guard pattern) + matching gorm tags.

## PR 2 — fix/v1-freeze-token-revocation (2 commits)

- `blacklist:<uid>` was read by TokenAuthMiddleware on every request
  (including session-cache hits — verified at token_middleware.go:155-165)
  but never written. `authtoken.BlacklistUser` writes it with
  TTL = AccessTokenTTL + 1 min margin; `LifecycleService.RevokeUserTokens`
  blacklists + cascade-revokes session-bound refresh tokens. Wired to:
  user delete, single-user disable (UpdateUser transition), batch disable,
  and admin password reset. Middleware literal replaced by the shared
  key builder.
- DEPLOYMENT_GUIDE upgraded Redis to required (token session store; all
  authenticated requests 401 without it) and the misleading startup
  warning fixed.

## PR 3 — fix/v1-freeze-runtime-robustness (3 commits)

- Operation-log queue overflow now drops with
  `pantheon_operation_log_dropped_total` + rate-limited warn instead of
  falling back to synchronous DB writes (the one realistic stall path
  under sustained write load). `ShutdownOperationLog` drains on exit.
- Graceful shutdown: signal.NotifyContext → server.Shutdown
  (PANTHEON_SHUTDOWN_TIMEOUT_SECONDS, default 15s) → oplog drain.
- General per-IP rate limiter on /api/v1 (6000/min default;
  PANTHEON_API_RATE_LIMIT_MAX/_WINDOW_SECONDS/_ENABLED). Memory-store
  eviction past 10k keys. GeneralAPIRateLimitMiddleware documented as
  downstream-only (group middleware runs before token auth; user-keyed
  limits cannot apply there).
- user/role/dept CSV exports capped at 10000 rows (log-export parity) and
  run WithContext so the 30s request timeout actually cancels them.

## Verification

- `gofmt -l .` empty; `go vet ./...` pass; `go build ./...` pass (each PR).
- Full backend suite vs real MySQL: **42 packages ok** on PR 1;
  on PR 2/3 with local shared Redis enabled, 40 ok + 2 failures
  (`TestSecureActionMiddlewareAllowsMatchingSession`,
  `TestRuntime_MFAChallengeSetupAndVerify`) that **reproduce identically on
  clean main with the same env** — pre-existing local-Redis state
  pollution, not regressions; CI uses a fresh Redis service.
- New tests: role data-scope purge + rollback, user cascade (incl. MFA
  secret + other-user isolation), menu orphan-key both directions,
  lifecycle purge/revoke (real Redis), module failure injection ×2,
  oplog drop/drain, memory-store limit + eviction, export caps + ctx
  cancellation.
- `node frontend/scripts/check-menu-contract.mjs`: 16 menus, 20 routes,
  89 permissions, 20 component keys — pass.
