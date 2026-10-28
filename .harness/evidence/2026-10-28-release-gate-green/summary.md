# Summary — 2026-10-28-release-gate-green

## What was red

`Release Gate` on `main` was failing in two of its jobs, and both failures
blocked the summary:

| Job | Baseline reading | Blocking rule |
| --- | --- | --- |
| `dependabot-alerts` | 1 open alert: `GHSA-mgcc-cww5-fp2q` / `CVE-2026-116587`, high, `github.com/go-jose/go-jose/v3` | any open high/critical alert |
| `sonarcloud-gate` | 5 unresolved issues on branch `main` | `total > 0` |

The Sonar rows, verbatim from the API:

- `go:S1135` `backend/modules/auth/oidc/handler.go:70` — TODO marker
- `go:S3776` `backend/modules/system/iam/tenant_isolation_smoke_test.go:85` — complexity 53 → 15
- `go:S3776` `backend/pkg/tenant/scope_helper_test.go:14` — complexity 22 → 15
- `godre:S8209` `backend/pkg/database/notfound.go:16` — consecutive same-type parameters
- `typescript:S3776` `frontend/src/modules/system/iam/tenant/TenantList.tsx:116` — complexity 16 → 15

## Dependency fix

`go-jose/v3` was never a direct dependency. It arrived through
`github.com/coreos/go-oidc/v3 v3.9.0`, and the v3 line has no patched release —
the advisory's only remediation is the `v4` line. `go-oidc` began depending on
`go-jose/v4` at v3.14, so the package was upgraded to `v3.21.0`; `go mod tidy`
then settled the tree on `github.com/go-jose/go-jose/v4 v4.1.6`.

After the move:

- `go.mod` line 44 is the only go-jose entry: `v4.1.6 // indirect`.
- `go.sum` lines 56-57 are the two v4.1.6 hashes; no v3 line survives.
- `go mod graph | grep go-jose` shows three edges, all `/v4` (the two `v4.1.4`
  requirements from go-oidc and grpc resolve up to 4.1.6 through MVS).
- `govulncheck`: code affected by 0 vulnerabilities; 0 in imported packages.

The module path stayed `v3`, so no import path changed, and the OIDC module is
still dormant (no routes, no consumers) — the upgrade has no runtime surface to
regress.

## Sonar fixes

Every fix is a real change to the code; nothing was suppressed, excluded or
deleted.

1. **`go:S1135` (handler.go)** — the comment above the interim callback payload
   said "see the TODO below". It now states the same pending work ("session
   creation against the existing session service is still pending") without a
   marker. Comment-only diff; the response body is untouched.
2. **`godre:S8209` (notfound.go)** — `TranslateNotFound(err error, replacement
   error)` became `TranslateNotFound(err, replacement error)`. Same name, same
   argument order, same body; every call site already passed two errors.
3. **`go:S3776` (tenant_isolation_smoke_test.go, 53)** — the eleven subtests
   moved out of the single `TestTwoTenantIsolationSmoke` literal into a table of
   named functions (`smokeRoleIsolation` … `smokeDashboardIsolation`). Each
   function starts with `t.Helper()`; subtest names, assertion order, fixed seed
   ids and expected row counts are unchanged. The largest extracted helper now
   carries 9 if/loop/boolean-operator sites, comfortably under 15.
4. **`go:S3776` (scope_helper_test.go, 22)** — the SQL rendering and assertions
   inside the table loop moved into `assertScopeSQL` plus a `carriesUint64`
   helper. The three contexts (nil / compat / multi) and both invariants (nil
   renders no `tenant_id` predicate; compat pins 0, multi pins the claim) are
   byte-identical to before.
5. **`typescript:S3776` (TenantList.tsx, 16)** — the five
   `isAdmin || hasPerm('...')` sequences collapsed into one local
   `can(perm)` helper, removing five boolean-sequence increments from the
   component. `can` is evaluated during render only, so `canCreate` … and
   `canBrowseUsers` remain plain stable booleans and `loadMemberCandidates`'
   `useCallback` dependency is unchanged.

## Verification

| Command | Readout |
| --- | --- |
| `gofmt -l` (4 files) | no output |
| `go vet` (4 packages) | clean |
| `go build ./...` | ok |
| `CGO_ENABLED=1 go test -race ./...` | 47 ok, 0 FAIL, 6 no-test packages |
| `go test -run TestTwoTenantIsolationSmoke -v ./modules/system/iam/` | compiles, SKIP (no local DSN) |
| `govulncheck ./...` | 0 reachable vulnerabilities |
| `go mod graph \| grep go-jose` | only `/v4` edges, selected 4.1.6 |
| frontend `lint` / `type-check` / `build` | clean / clean / built in 1.47s |
| `check:task-packet`, `check:structure`, `check:harness-encoding`, `check:docs-frontmatter` | PASS, 0/2882, 0/2534, 392 docs |
| `check-doc-links`, `check-doc-inventory`, `check:generated`, `check:ui-quality-gate` | 0, 0, 0/11, 0 |

Measured change surface: 8 tracked files, +332/−294 — two dependency files, one
comment, one signature, two test refactors, one 11-line component extraction and
the STATUS entry.

## Explicit gaps

- SonarCloud and Dependabot only move after this branch merges and the next
  `main` analysis / dependency-graph refresh runs. Local proof is structural
  (thresholds cleared, module graph clean) rather than a green gate run.
- The isolation smoke skips locally without a DSN; CI runs it with
  `PANTHEON_TEST_DSN_REQUIRED=true`.
- `govulncheck` still lists three advisories in required-but-uncalled modules
  (`x/net` html coalescing ×2, `x/crypto` openpgp). None has a Dependabot alert
  and none is reachable from base code; recorded so a future advisory refresh is
  expected.
- `go test -race` on this machine needs `CGO_ENABLED=1` and `mingw64/bin` on
  `PATH`; without both, `cgo.exe` exits 2 and every package reports a
  diagnostic-free `[build failed]`.
