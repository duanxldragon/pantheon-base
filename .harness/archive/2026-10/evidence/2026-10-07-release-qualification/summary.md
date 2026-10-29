# Release Qualification Evidence

Date: 2026-10-08
Candidate SHA: `edaf6c08eb729506f44299d61e8ab66ed4f20fcc`

## Local results

- Backend `go vet ./...`: passed.
- Backend `go test ./...`: all non-tenant packages passed; `modules/system/iam/tenant` remains blocked by the installed Windows cgo toolchain (`runtime/cgo ... cgo.exe: exit status 2`) even with MSYS2 MinGW configured. Cygwin is incompatible with native Windows cgo.
- Frontend `npm run type-check`: passed.
- Frontend `npm run lint`: passed.
- Frontend `npm run test:unit`: 21 files / 163 tests passed.
- Frontend `npm run build`: passed, including all prebuild contract checks.
- `npm run check:harness-adoption`: passed with 0 findings and 0 warnings.
- `golang.org/x/net` was upgraded to v0.60.0. The current local Go 1.26.6 toolchain still reports 13 standard-library vulnerabilities fixed in Go 1.26.9; `backend/go.mod` now requires Go 1.26.9 so hosted setup-go can enforce the patched toolchain.
- `npm audit --audit-level=high`: blocked by the configured `registry.npmmirror.com` audit endpoint returning HTTP 404 `NOT_IMPLEMENTED`; prior local evidence recorded 0 high/critical and 6 moderate dev-tool findings, but this run could not refresh that result.

## Explicit gaps

- Tenant SQLite tests and `go test -race` require a native MinGW cgo toolchain; the installed Cygwin compiler cannot build the Windows cgo runtime.
- Candidate-SHA hosted GitHub required checks, Release Gate and Sonar issue classification are not available from this local run.
- Authenticated browser evidence is now available: 77 full-smoke tests passed across 1440x900, 1024x768 and 390x844; screenshots and the console/state matrix are indexed by frontend/test-results/full-page-audit/findings.json, with zero console errors.
- MySQL evidence is now available in the performance and upgrade-runbook evidence: current row counts, EXPLAIN, `max_connections=151`, `Threads_connected=1`, `Max_used_connections=39`, dashboard summary timing P95 1.18s setup-inclusive on 10 disposable schemas, and v12→v21→v12 rollback rehearsal. Ordinary-enterprise load, hosted checks and browser evidence remain open.
- Existing historical evidence files still fail the current strict evidence schema; this qualification record uses the current format but does not rewrite unrelated history.

## Decision

Qualification remains `in-progress`; no release or closeout claim is made until the hosted, browser, database and migration gaps are closed by the appropriate environment or maintainer gate.
