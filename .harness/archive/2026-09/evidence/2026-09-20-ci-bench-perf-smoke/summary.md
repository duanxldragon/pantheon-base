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

## Closeout (post-merge, 2026-09-20)

| Item | Fact |
|---|---|
| PR | https://github.com/duanxldragon/pantheon-base/pull/327 |
| Merge commit | `0b17c5d9d6e0c9aa0bc84b1fdeba3e570ceef3f6` |
| Merged at | 2026-09-20T01:37:39Z |
| Branch closure | `chore/ci-bench-perf-smoke` deleted from origin |
| PR signal | 27 success / 2 skipped / 1 failure — the single red was the advisory `Bench Perf Smoke` job this task added |
| Ratchet decision | none in this task; carried by #330 (`FR-010` + drift guard) |

The "CI-level green arrives with the PR run" gap above was resolved in the wrong
direction: the job landed **red on every run** (main pushes `0b17c5d9` and
`8c8ff37f`, plus PR #329's run) because its summary step read `bench.txt` from
the repository root while the benchmark step wrote it under `backend/`. The
measurement was always fine; the reporting was not. #330 fixed the working
directory and added the drift guard, and the job has reported success since.

This is the residual risk from `review.md` materialising within hours: an
advisory job in no `ci-summary` needs list can be red indefinitely without any
PR-path gate noticing. The same class showing up a second time (advisory
`Core Smoke`, red since at least 2026-09-05 behind a green workflow conclusion)
is tracked as `FR-011`.

Consolidated writeback record: `.harness/evidence/2026-09-20-merged-packet-closeout/`.
