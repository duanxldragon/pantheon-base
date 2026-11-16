# Pantheon Base v0.18.9

The v0.18.9 patch delivers the OpenTelemetry security fix to the shared
backend dependency graph. `go.opentelemetry.io/otel`, `otel/sdk` and `otel/trace`
(held in lockstep with `otel/metric` and the otlp exporters) upgrade from
v1.45.0 to v1.47.0, resolving GHSA-q7gw-24fr-5p69 (`AttributeValueLengthLimit`
fully bypassed by valid U+FFFD runes, CVSS 5.3). `go mod tidy` also prunes
unreferenced stale direct deps (`coreos/go-oidc`, `golang.org/x/oauth2`,
`go-jose/go-jose`). It also includes the CI governance archive hardening,
README history archive and Core Smoke assertion commits merged since v0.18.8.

The [GitHub Release](https://github.com/duanxldragon/pantheon-base/releases/tag/pantheon-base-v0.18.9)
establishes the immutable tag and its four foundation assets.

## Upgrade notes

Consumers acquire the four immutable assets and rebuild through the standard
foundation pipeline, then re-run `go mod tidy` in `backend/` so the generated
`backend/go.mod` / `go.sum` settle on `go.opentelemetry.io/otel` v1.47.0. No
database migration, API, permission, menu, i18n or frontend contract change is
introduced; Node/Playwright minimums are unchanged.

## Validation status

Base PR #519 (otel 1.47.0) and the v0.18.9 preparation commit merged into main;
exact-main CI, Quality Gates, Security Gates, Actionlint, Full Smoke, SonarCloud
and Release Gate checks passed on the release commit.

## Explicit residuals

FR028 oversized audit storage deferred; real S3 provider coverage unwaived;
maintenance freeze unsigned. Production migration, legacy-auth retirement and
separate Ops product acceptance remain independently tracked.
