# Evidence: 2026-09-08-p0-csp-hsts-implementation

## Pre-existing state (verified before this session)

- `backend/internal/middleware/security_headers_middleware.go` already implemented: HSTS (`max-age=31536000; includeSubDomains`), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.
- `backend/internal/middleware/csp_middleware.go` already implemented CSP as a single source: base directives (`default-src 'self'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`, etc.), dev allows `unsafe-eval` for Vite HMR, prod removes it, `CSP_REPORT_URI` optional.
- Both middlewares already registered in `backend/cmd/server/main.go` `buildRouter()` (lines 118-119).

## Changes made (2026-09-08)

| File | Change |
| --- | --- |
| `backend/internal/middleware/csp_middleware_test.go` | NEW: 4 tests — header presence, base directives, env-dependent script-src (dev `unsafe-eval` / prod without), report-uri |
| `backend/internal/middleware/security_headers_middleware_test.go` | Expanded: 4 tests — original minimal headers, HSTS value, Permissions-Policy value, CSP non-duplication (single ownership) |
| `SECURITY.md` / `SECURITY.en.md` | Removed "后续收口项 / future item" disclaimer; documented CSP/HSTS as implemented with middleware ownership and env behavior |
| `docs/designs/QUALITY_AND_SECURITY_STRATEGY.md` / `.en.md` | Documented the 2026-09-08 ruleset enforcement (see P0-2 evidence) |

## Test evidence

```
$ cd backend && go test ./internal/middleware/ -run 'TestSecurityHeaders|TestCSP|TestBuildCSPPolicy' -v
--- PASS: TestCSPMiddlewareSetsHeader
--- PASS: TestCSPMiddlewareBaseDirectives
--- PASS: TestBuildCSPPolicyScriptSrcByEnv
--- PASS: TestBuildCSPPolicyReportURI
--- PASS: TestSecurityHeadersMiddlewareSetsMinimalHeaders
--- PASS: TestSecurityHeadersMiddlewareSetsHSTS
--- PASS: TestSecurityHeadersMiddlewareSetsPermissionsPolicy
--- PASS: TestSecurityHeadersMiddlewareDoesNotSetCSP
PASS  ok  github.com/duanxldragon/pantheon-base/backend/internal/middleware  0.048s
```

`gofmt -l` on both directories: clean.

## Success criteria check

- [x] CSP header middleware implemented and registered (pre-existing, now test-covered)
- [x] HSTS header middleware implemented and registered (pre-existing, now test-covered)
- [x] Unit tests validate header presence and values (8 tests)
- [x] SECURITY.md updated to reflect implementation
- [ ] Browser DevTools validation / securityheaders.com rating — requires a running HTTPS deployment; explicit gap, deferred to runtime smoke. Headers are validated at the unit level; no HTTP-response behavior changed this session.
- [ ] CSP nonce hardening — intentionally out of scope (P1 follow-up `2026-09-08-p1-csp-nonce-hardening`)

## Task manifest

`status` updated to `completed` with the runtime-evidence gap recorded above.
