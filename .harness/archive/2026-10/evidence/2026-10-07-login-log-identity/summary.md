# Summary — login-log-identity (F04)

## Change

- `backend/modules/auth/login/login_service.go` — `scopedLoginLogQuery`: when
  the filter comes from the own-log path (`filterUsername` = authenticated
  subject from `c.GetString("username")`), the query is an exact match
  (`username = ?`) instead of `username LIKE '%…%'`. The admin list path
  (`ListLoginLogs`) keeps its intentional substring filter.
- Handler entry unchanged (`GetOwnLoginLogs` passes the token-resolved username;
  tenant scope applied via `WithTenantContext`).

## Tests added

- `modules/auth/login/login_log_identity_test.go` — 4 tests: exact identity
  match (alice / alice_admin / xalice), no client-side LIKE smuggling through
  the own-log query (`LoginLogQuery.Username` cannot widen it), tenant
  isolation (101/202/platform), admin LIKE filter intact.

## Verification

See `commands.json`; manifest command `go test ./modules/auth/login/...` green.

## Acceptance mapping

1. Stable exact authenticated identity — PASS.
2. Similar usernames + different tenants cannot read each other's IP/device/time — PASS.
3. Admin filtering intentionally supported and tested — PASS.
