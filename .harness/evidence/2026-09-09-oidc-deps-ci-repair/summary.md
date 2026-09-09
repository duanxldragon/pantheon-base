# Verification Summary — 2026-09-09-oidc-deps-ci-repair

## Goal

Repair failing CI on PR #298 (release/v0.11.2 → main, v0.12.0 release vehicle):
missing OIDC module deps, gofmt violation, and high-severity grpc
vulnerability alert.

## Root causes found

1. `modules/auth/oidc/provider.go` imports `github.com/coreos/go-oidc/v3/oidc`
   and `golang.org/x/oauth2`, but neither was in go.mod/go.sum → vet, unit
   tests, backend tests, CI summary all failed with
   `no required module provides package github.com/coreos/go-oidc/v3/oidc`.
2. `modules/auth/oidc/handler.go` had a gofmt misalignment → Go Lint failed.
3. `google.golang.org/grpc v1.61.2` → Dependabot alert #28 (high): gRPC-Go xDS
   servers DoS via crash due to missing `:authority` and `Host` headers →
   Dependency Vulnerabilities gate failed.

## Fixes applied (branch release/v0.11.2)

- Commit 025dc3af: port go.mod/go.sum OIDC deps from local main (9b049bdf) +
  gofmt fix for oidc/handler.go (equivalent of 9e1057ce).
- Commit 3459678b: `go get google.golang.org/grpc@v1.76.0` + `go mod tidy`
  (also bumps golang.org/x/oauth2 → v0.30.0, github.com/golang/protobuf →
  v1.5.4, genproto/googleapis/api).

## Commands run and observed results

| Command | Expected | Observed |
|---|---|---|
| `cd backend && go build ./...` | exit 0 | BUILD_OK |
| `cd backend && go vet ./...` | no missing-module errors | VET_OK |
| `cd backend && gofmt -l .` | empty | GOFMT_CLEAN |
| `cd backend && go test ./modules/auth/...` | ok | ok (login/mfa/security/session); oidc has no test files |
| `cd backend && go test ./modules/... ./internal/middleware/...` | no failures | no failed packages |
| `git push origin release/v0.11.2` | push accepted | 66a4141a..025dc3af, 025dc3af..3459678b |

## Environment note

Direct `github.com:443` connections time out on this network (DNS resolves to
20.205.243.166, unreachable). Pushes succeeded through local proxy
`http://127.0.0.1:7897` via one-shot `-c http.proxy=...`; no git config was
persistently modified.

## Round 2 — new-code gate failures on 3459678b/44e945a2

CI round 1 exposed two gates that lint/check **PR-scoped new code**
(`--new-from-rev=<pr-base>`), so failures traced to the v0.12.0 feature
commits themselves:

1. **Docs Governance / frontmatter**: `docs/designs/SSO_OIDC_DESIGN.md` had no
   frontmatter but is referenced by `docs/contracts/SYSTEM_AUTH_CONTRACT.md`.
   Added frontmatter (Design / system/auth / Draft, linked to
   SYSTEM_AUTH_CONTRACT). Local check: passed (256 docs, 202 with frontmatter).
2. **Go Lint (new-code scope)**: 10 findings fixed:
   - revive stutter: renamed `OIDCConfig→Config`, `OIDCProvider→Provider`,
     `OIDCService→Service`, `OIDCUserInfo→UserInfo` inside
     `modules/auth/oidc` (no external importers existed; the `User.OIDCProvider`
     gorm field and function names `LoadOIDCConfig`/`NewOIDCService`/etc. kept).
   - staticcheck SA1012: nil Context in login test → `context.TODO()`.
   - staticcheck SA9003 ×2: empty branches in oidc service are deliberate
     TODO scaffolding → documented + `//nolint:staticcheck` with rationale.
   - unused: removed dead test helper `assertHandlerSuccess`.
   - goconst ×2: test literals → constants `errInvalidTestSentinel`,
     `roleSortFieldTestName`.
   Local verification: `golangci-lint v2.6.2 --new-from-rev=<pr-base> ./...`
   → 0 issues; gofmt clean; go build/vet pass; go test auth+iam+middleware green.

## Known gaps

- Final GitHub Actions conclusions on 3459678b were still in progress when this
  summary was written; see PR #298 checks for the authoritative result.
- `govulncheck` was not executed locally; alert #28 closure is assessed from the
  Dependabot advisory and the grpc v1.76.0 release notes, to be confirmed by the
  Dependency Vulnerabilities gate.
