# Review — 2026-09-20-ci-bench-perf-smoke

## Reviewer disposition

Reviewed as CI-infrastructure + test-infrastructure change with an explicit
high-risk overlay (`.github/workflows/*`). Risk accepted at **standard with
workflow-posture verification**: zizmor baseline compared before merge, the new
job is advisory-only, and benchmark output is summary-scoped (no artifact
publication, no cache surface).

## Checks

| Question | Answer |
|---|---|
| Does the change deliver the finding #4 follow-up as scoped? | Yes — bench smoke wired; staging-only boundary preserved and restated in summary/PR body |
| Could runner numbers be mistaken for capacity baselines? | Guarded: job name says "advisory", summary header says "not a capacity baseline", task packet and PR body restate it |
| Can the job block merges? | No — not in `ci-summary` needs; report-only by construction |
| zizmor/workflow-posture impact? | Zero new findings (13 baseline = 13 after `cache: false`; `cache: true` would have added 1 cache-poisoning Low/High) |
| Does `OpenTB` change existing test behavior? | No — `Open` delegates to `OpenTB`; same DSN resolution/naming/cleanup; verified green with and without DSN |
| Was the misread-of-scope risk (secrets, prod DSN) handled? | Yes — job uses per-run random MySQL password pattern already used by unit-tests; no literal credentials |
| Benchmark scope creep? | None — no new benchmarks; only existing audit benchmarks wired |

## Residual risks

- The advisory job could silently stay red without anyone noticing (no gate);
  acceptable for a smoke signal. Promotion to blocking needs a maintainer gate.
- `-benchtime 1x` samples are noisy; trend-watching requires multiple runs.
- The `*testing.T` assertion breakage shows benchmarks were unexercised since
  introduction; other packages may harbor similar latent benchmark issues
  (out of scope, no other Benchmark funcs exist in-repo today).
