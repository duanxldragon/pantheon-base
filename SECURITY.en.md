# Security Policy

Chinese version: [SECURITY.md](./SECURITY.md)

## Supported Scope

Pantheon Base currently prioritizes:

- `platform`: application shell, route assembly, workbench aggregation
- `system/auth`: authentication, sessions, tokens, security center
- `system/iam`: users, roles, menus, permission points, role authorization
- `system/org`: departments, posts, organization hierarchy
- `system/config`: dictionaries, system settings, configuration cache

If a report concerns `business/*`, specify the concrete business module.

## Reporting a Vulnerability

Please do not disclose the following in a public issue:

- admin credentials or verification codes
- access or refresh tokens
- database DSNs, Redis passwords, or third-party secrets
- sensitive payloads that make exploitation directly reproducible

Preferred reporting flow:

1. contact the maintainers through email or a private channel
2. state the impacted layer: `platform`, `system/*`, or `business/*`
3. provide minimal repro steps, impact scope, and supporting logs or screenshots
4. if the issue is an authorization bypass, specify whether it breaks navigation, page, action, or API authorization

## Response Expectations

- issue ownership and impact boundaries will be confirmed first
- high-risk auth, authorization, and sensitive configuration issues are prioritized
- related tests and docs should be updated after the fix to prevent regression

## GitHub Security Surfaces

The repository's Security tab is the entry point for this project's security signals. Each surface has a handling rule:

| Surface | Current state | Handling rule |
| --- | --- | --- |
| Security policy | `SECURITY.md` (this file; Chinese version in `SECURITY.md`) | Update it in the same PR that changes a security control |
| Private vulnerability reporting | Enabled | Preferred private channel; email remains the fallback |
| Code scanning (CodeQL) | Analyzes every push to `main` and every PR | Fix, or dismiss with a recorded reason |
| Dependabot alerts | Enabled, security updates on | No unhandled high/critical alert may remain at release time |
| Secret scanning | Enabled with push protection | Rotate the credential when hit; never bypass push protection |
| SonarCloud | Automatic analysis | The release gate requires a green quality gate and zero unresolved issues |

A dismissal always leaves a trail. Each of `false positive`, `won't fix`, and `used in tests` must state its basis: why the code is safe and which file it covers. The `js/file-access-to-http` alerts in `frontend/scripts/tenant-matrix-fixture-setup.mjs` are exactly that case — the script replays the credentials this run generated in `.tmp/smoke-tenant-matrix.json` to a local API, which is the fixture's job, and the directory never ships. They are dismissed as `used in tests`.

## Runtime Security Baseline

- `system/auth` browser flows are cookie-first: `/api/v1/auth/login`, `/api/v1/auth/mfa/verify`, and `/api/v1/auth/refresh` set HttpOnly session cookies plus CSRF header/cookie and return session metadata; tokens live in Redis and are never exposed to the frontend.
- Cross-origin policy is application-layer allowlist based. Configure allowed origins via `PANTHEON_ALLOWED_ORIGINS`; unmatched `Origin` values never receive credentialed CORS.
- The application sets a minimal set of security response headers by default: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.
- `Strict-Transport-Security` is emitted by `SecurityHeadersMiddleware` (`max-age=31536000; includeSubDomains`), and `Content-Security-Policy` is emitted by `CSPMiddleware` as the single source: development allows `unsafe-eval` for Vite HMR, production removes it; `CSP_REPORT_URI` configures a violation reporting endpoint. Both middlewares are registered in `buildRouter` in `backend/cmd/server/main.go` and cover every HTTP response.
