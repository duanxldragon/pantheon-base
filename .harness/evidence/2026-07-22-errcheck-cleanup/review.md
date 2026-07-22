# Review — errcheck Historical Unchecked Errors Cleanup

## Reviewer: Qi (Delivery Director)
## Date: 2026-07-22

### Scope check
- In-scope: 13 errcheck sites, pure error-handling annotation. ✅
- Out-of-scope guarded: no lint-rule change, no logic change, no SonarCloud work, no ops work. ✅

### Convention adherence
The repo `.golangci.yml` explicitly states: *"check-blank: false — idiomatic `_ = err` for deliberately ignored errors is allowed (cleanup/best-effort paths). Avoids no-op ignoreError() helpers."* All 13 fixes follow this; none introduce a private `ignoreError()` helper, none broaden `exclude-functions`. ✅

### Correctness
- Two-value returns handled with `_, _ =`: `(*migrate.Migrate).Close()` → `(source error, database error)`; `operationLogWriter.body.Write` → `(int, error)`; `ReadCSV` → `([][]string, error)`. ✅
- Single-value returns handled with `_ =`. ✅
- Type assertion at operation_log_middleware.go:306 uses `payload, _ =` (comma-ok ignore) — acceptable per "deliberately ignored" convention for a best-effort sensitive-payload mask. ✅

### Build / gate evidence
- `go build ./...` EXIT 0
- `go vet ./...` EXIT 0 (vet compiles `_test.go`, validating the two test-file fixes)
- `golangci-lint run --enable-only errcheck ./...` → 0 issues

### Risk
- Lowest possible: best-effort/cleanup paths only; ignoring Close/Rollback errors is the established idiom and matches the file's existing `schemaFile.Close()`-style ignores. No control-flow or return-value semantics altered.
- No new dependencies. No API surface change.

### Verdict
APPROVED. Ready to open governance PR and merge after Quality Gates (SonarCloud red is non-blocking per repo ruleset; it is tracked separately in PR #194).
