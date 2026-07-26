# Summary — 2026-07-26-sonar-go-s1192

126 backend SonarCloud OPEN findings fixed in code, none suppressed.

## go:S1192 (113)

Duplicated string literals extracted to package-level **unexported** constants
in the flagged file (or the package's existing const block), with role-derived
names following each package's existing conventions:

- handlers: `errParamInvalid`-style error keys (existing convention reused)
- system settings: `settingKeyXxx`
- i18n seeds (`i18n_seed.go` 24 findings): `moduleXxx` / `keyMenuXxx` prefixes
- SQL fragments in query builders: `condXxx` / `orderByXxx`
- permission workbench: existing `workbenchCoverageAPIGap` constant reused

String values are byte-identical; an audit pass confirmed every flagged
literal now appears at most once per file (its const definition).

## godre/misc (13)

- S8184 ×3: blank-import comments added stating the real reason (`_ "embed"`
  for `//go:embed`; golang-migrate MySQL driver registration)
- S8193 ×3: unnecessary variable declarations inlined into conditions
- S8209 ×3: consecutive same-type parameters grouped (no signature change)
- S1186 ×2: intentionally-empty functions documented (generator-managed
  registry placeholder; no-op unregister closure)
- S1871 ×1: `platform/health.go` identical degraded-branches merged — `db.DB()`
  then `PingContext` feed one shared error path; per-path outcomes identical
- S4144 ×1: `GetSecurityRuntimePolicy` now delegates to the byte-identical
  `GetAuthRuntimePolicy` (same RLock, same field mapping)

## Verification

- `gofmt -l .` — empty
- `go vet ./...` — pass
- `go build ./...` — pass
- `go test -short ./...` — pass (39 packages ok, 0 FAIL)
- Diff audit: `53 files changed, 1045 insertions(+), 889 deletions(-)`;
  changed-file set is exactly the union of the two frozen finding lists.
- (Local runs used `-buildvcs=false` — the sandboxed worktree shell cannot
  stamp VCS info; no source impact.)
