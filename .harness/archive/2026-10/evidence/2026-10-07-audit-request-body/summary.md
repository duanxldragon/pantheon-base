# Summary — audit-request-body (F05)

## Changes

- `backend/internal/middleware/operation_log_middleware.go`
  - New audit-specific body cap `defaultOperationLogAuditBodyLimit = 16KiB`
    (env `PANTHEON_OPERATION_LOG_AUDIT_BODY_LIMIT`; invalid values fall back to
    the default) — independent of the upload size limit.
  - `readAndRestoreBody`: persists only the capped prefix; restores the FULL
    body via `io.MultiReader` so handlers still read the complete stream.
  - `buildAuditParamFallback` + `shouldAllowlistMultipartParam` +
    `multipartAuditMetadata`: `multipart/form-data` requests store only
    allowlisted metadata (`files: {field: [{filename, size}]}`, `fieldCount`)
    — secret field values and file bytes never reach `system_log_oper`;
    unreadable forms store a minimal marker.

## Tests added

- `internal/middleware/operation_log_request_body_guard_test.go` — 4 tests:
  multipart allowlist (secret `s3cr3t-probe-value` + file payload marker must
  be absent), oversized-body cap, full-body restore, env override/fallback.

## Verification

See `commands.json`. Manifest verification commands pass. JSON masking and
`SetAuditParam` override paths unchanged (existing tests still green).

## Acceptance mapping

1. Multipart/binary allowlisted metadata only, secret + bytes absent — PASS (probe test).
2. Audit-specific body cap independent of upload limit — PASS (cap + env tests).
3. JSON masking + request/audit correlation intact — PASS (existing suite green; request-id paths untouched).
