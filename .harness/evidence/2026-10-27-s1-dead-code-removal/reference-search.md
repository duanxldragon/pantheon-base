# Reference search — S1 `2026-10-27-s1-dead-code-removal`

Re-run of the five-location search at implementation time (2026-10-27, tree at main `b13e6b77`
plus W1 branch not yet merged — searches were run against `main` content), across
backend source, backend tests, frontend, scripts/CI config, and the `pantheon-ops` overlay.

Locations covered per search: `backend/**` (source + `_test.go`), `frontend/**`
(source + tests + scripts), `scripts/**`, `.github/workflows/**`, `pantheon-ops/**`
(backend + frontend + docs), plus the whole workspace via ripgrep where noted.

## RC-001 `backend/pkg/common/token.go` (whole file, 129 lines, 34 exports)

- Exports enumerated from the file: `TokenTypeAccess`, `TokenTypeRefresh`, `TokenTypeOperation`,
  `DefaultAccessTokenTTL`, `DefaultRefreshTokenTTL`, `AccessTokenTTL`, `RefreshTokenTTL`,
  `ErrTokenInvalid`, `ErrTokenExpired`, `ErrTokenType`, `TokenPair`, `TokenSessionData`,
  `OperationTokenData`, `SetTokenTTL`, `TokenSessionKey`, `TokenRefreshKey`,
  `TokenOperationKey`, `NewAccessToken`, `NewRefreshToken`, `NewOperationToken`,
  `TokenStoreSession`, `TokenValidateSession`, plus operation-token issue/parse wrappers.
- Pattern `common\.(TokenType|ErrToken|TokenSessionKey|TokenRefreshKey|TokenOperationKey|
  NewAccessToken|NewRefreshToken|NewOperationToken|TokenStoreSession|TokenValidateSession|
  DefaultAccessTokenTTL|DefaultRefreshTokenTTL|TokenPair|TokenSessionData|OperationTokenData|
  SetTokenTTL|AccessTokenTTL|RefreshTokenTTL|GenerateOperationToken|ParseOperationToken)`:
  **0 hits** across the whole workspace (`.go` files), including `pantheon-ops`.
- Authoritative check after deletion: `go build ./...` green in **both** `pantheon-base/backend`
  and `pantheon-ops/backend`.
- Note: `pkg/authtoken.SetTokenTTL` (pkg/authtoken/token.go:51) keeps its own definition; the
  packet puts `pkg/authtoken/**` in doNotTouch, so any orphaning there is out of scope.

## RC-002 `backend/internal/middleware/logging_middleware.go` (whole file)

- `StructuredLoggingMiddleware`: hits only in the file itself (base) and its mirror copy in
  `pantheon-ops/backend/internal/middleware/logging_middleware.go` (ops owns its own copy and
  the overlay does not rebuild base-owned internal packages from base), plus audit/review docs.
- No router or server registration found. Deletion compiled clean in both repos.

## RC-003 `common.ErrorResponse` (error.go:106-115)

- All `ErrorResponse` text hits in code are different symbols: `roleErrorResponse` (lowercase
  local func, `role_handler.go`) and test function names
  (`TestFailOnCSRFCookieErrorWritesErrorResponse`, `TestRoleErrorResponse*`). Zero
  constructions of the exported struct in backend, frontend, scripts, or `pantheon-ops`.
- The live envelope type is the private struct in `pkg/common/http/response.go` — untouched.

## RC-005 `database.SetEx` (redis.go:75-78)

- `SetEx\b` in `*.go`: only the definition. Zero callers in backend source, tests, or
  `pantheon-ops`. Neighbouring `Get`/`Set` helpers untouched.

## RC-009 `isForbiddenRequestError` (frontend/src/api/request.ts:241)

- Frontend-wide search (`ts,tsx,mjs,json`): only the definition. Not re-exported from
  `frontend/src/index.ts` (search returned no barrel hit), not imported by any module, not in
  `pantheon-ops` consumer code (ops overlay rebuilds base-owned paths but keeps its own
  `frontend/src` — the ops copy is refreshed from base releases; deleting here lands there on
  the next release sync with no local reference in either tree).

## RC-010 / RC-011 thirteen orphan scripts

- `capture-` across `package.json`, `frontend/package.json`, `.github/`, `scripts/`,
  `frontend/scripts/`: hits only inside the scripts' own usage comments, the audit docs
  (`CODEBASE_SIMPLIFICATION_AUDIT.md`, `REDUNDANT_CODE_CANDIDATES.md`,
  `CODE_SIMPLIFICATION_PLAN.md`) and the task manifests.
- `merge-coverage-to-lcov|migrate-spacing-tokens|run-request-error-utils-test`: same result —
  the only live-file mention is a historical comment in `run-api-unit-tests.mjs` noting it was
  generalized from `run-request-error-utils-test.mjs` ("generalized" provenance note, not a
  dependency).
- `migrate-spacing-tokens.mjs` was executable in the index (mode 100755); it is a completed
  one-off spacing-token migration per the audit.

## Human gate: capture-*.mjs manual visual walkthrough

- Delegated decision (auto-mode, subject to maintainer review): the scripts' own headers show
  they wrote one-off evidence for dated July/August 2026 audits
  (e.g. `capture-security-audit-fixes.mjs --out ../.harness/evidence/2026-07-18-security-audit-ui-fixes`),
  none is wired into any walkthrough flow since the smoke suite became the walkthrough vehicle
  (v0.17.1 notes: browser acceptance runs via smoke specs), and zero references exist anywhere.
  Deletion is reversible via git history; the delegated answer is "no longer used".
