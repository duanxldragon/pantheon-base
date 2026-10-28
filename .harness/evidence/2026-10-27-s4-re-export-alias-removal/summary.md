# Summary — S4 alias removal `2026-10-27-s4-re-export-alias-removal`

Branch `refactor/s4-re-export-alias-removal-2026-10-27` (from merged #446).
Deletes exactly the ten zero-consumer aliases from
`backend/pkg/common/re_export.go`; the eight consumed aliases and every
underlying function stay.

## Diff

`re_export.go`: 112 → 52 lines (−60). Removed: `FailWithData`,
`SetAccessTokenCookie`, `SetRefreshTokenCookie`, `ClearTokenCookies`,
`SetCSRFCookie` (+ now-unused `net/http` import), `DefaultDevSecrets`,
`IsProductionEnv`, `ResolveSecret`, `ValidateRequiredProductionSecret`,
`GenerateRandomSecret`. Kept: `Response` type, six code consts, three cookie
consts, four request-context consts, `Success`, `SuccessWithStatus`, `Fail`,
`FailWithError`, `FailWithCode`, `GetRequestID`, `InitSecurityConfig`.

Per-symbol counts (fresh, both repos) in
[reference-search.md](reference-search.md): all ten deleted aliases 0 base / 0
ops qualified references; kept aliases 25/22/16/4/2/2/1/1 base and
48/44/37/4/5/5/1/1 ops.

## Verification matrix

| Check | Result |
|---|---|
| `go build ./...`（base backend） | OK |
| `go vet ./pkg/common/...` | OK |
| `go build ./...`（pantheon-ops/backend） | OK |
| `go test -count=1 ./...`（DSN, full base suite） | GO_TEST_EXIT=0, 46 packages ok |
| `check-task-packet.mjs --root .` | recorded in commands.json |

No runtime evidence required by the packet: declaration-only deletions are
proven by both modules compiling and the suite staying green.

## Scope decisions

- The eight consumed aliases stay untouched (packet Out; S4 keeps them until a
  future wave measures them zero-consumer).
- Cookie/request-context const blocks are not part of the 18 measured aliases
  and stay.
- No frontend file touched (`frontend/src/index.ts` is Out).
