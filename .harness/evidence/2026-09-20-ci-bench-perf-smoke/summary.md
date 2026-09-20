# Summary — 2026-09-20-ci-bench-perf-smoke

## Scope
Finding #4 follow-up from `runtime-gap-ci-feasibility-20260918.md`: wire the existing
audit list benchmarks into CI as an **advisory relative-regression signal**. The
production-like perf/observability baseline itself remains **staging-only** — runner
numbers are explicitly not capacity baselines.

## What was actually found and fixed
The three `BenchmarkAuditServiceListOperationLogs_*` benchmarks **could never run**:
`setupAuditTestDBForName` asserted `*testing.T`, so `testing.B` hit a fatal on entry
(`audit mysql test helper requires *testing.T`). The 2026-09-18 feasibility assessment
correctly noted "no benchmark CI job exists" but did not catch that the benchmarks were
themselves broken locally.

Fix (minimal, two files + workflow):
- `backend/pkg/testmysql/mysql.go`: new `OpenTB(tb testing.TB)`; `Open(t)` delegates to it (zero behavior change for tests).
- `backend/modules/system/audit/audit_export_test.go`: helper calls `testmysql.OpenTB(tb)`; `*testing.T` assertion removed.
- `.github/workflows/ci.yml`: new `bench-perf-smoke` job — MySQL service, single-iteration bench, output to job summary only. **Advisory/report-only**: not in `ci-summary` needs, cannot block merges.

## Verification (all green)
- Benchmarks execute: ~24-26ms/op @ 20k rows, ~57KB/op, ~1.2k allocs/op (local i5-13420H).
- No-DSN skip path stays clean (`PASS` with DSN unset) — safe for DSN-less environments.
- `go vet` / `gofmt` clean; audit + testmysql packages green with DSN.
- zizmor (workflow posture gate) profile unchanged: baseline 13 = changed 13 after
  setting `cache: false` on the new job's setup-go step.
- YAML syntax OK.

## Known gaps
- CI-level green arrives with the PR run (job itself advisory).
- Staging perf/observability baseline (latency/concurrency/cache-hit/error-rate/alerts)
  remains the authoritative production-like signal and is maintainer-side work.
- Advisory → blocking promotion is a future ratchet decision requiring a maintainer gate.
