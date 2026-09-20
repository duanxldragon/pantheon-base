# Summary — 2026-09-20-bench-perf-smoke-summary-path

## Root cause

The advisory `bench-perf-smoke` job added in #327 (`2026-09-20-ci-bench-perf-smoke`)
was red on **every run since it landed** — two `main` pushes (`0b17c5d9`, `8c8ff37f`)
and PR #329's run. Step-level data shows why:

| Step | Conclusion |
|---|---|
| Run DB-backed benchmarks (single iteration) | **success** (all three audit benchmarks sampled ns/op) |
| Append benchmark results to job summary | **failure** — `cat: bench.txt: No such file or directory` |

The benchmark step declares `working-directory: backend` and writes
`backend/bench.txt`; the summary step declared none, so it ran `cat bench.txt`
from the repository root. The measurement worked, the reporting did not, and
because the job is report-only (not in `ci-summary` needs) nothing stopped it
from sitting red.

## Fix

`.github/workflows/ci.yml` — the summary step now declares the same
`working-directory: backend` as the writer, with a comment recording why the two
must stay aligned.

## Ratchet

Per `docs/harness/FAILURE_RATCHET_POLICY.md`, a repeated failure is expected to
buy a feedback control, not just a patch:

- `tests/scripts/ci-bench-perf-smoke-workflow.test.mjs` — drift guard: every step
  touching `bench.txt` must pin a `working-directory`, and all of them must agree;
  plus a second test asserting the job stays advisory (label, `-benchtime 1x`,
  absent from `ci-summary`).
- Wired into CI through `npm run test:ci-bench-perf-smoke-workflow` in the
  always-running `unit-tests` job (millisecond cost).
- `docs/harness/failure-registry.md` — new `FR-010` (runtime-quality /
  ci-signal-noise) recording that an advisory job can fail silently, promotion
  decision `sensor-added`; review date refreshed to 2026-09-20.

## Verification

| Check | Result |
|---|---|
| Guard with the fix (`node --test …`) | 2/2 pass |
| Guard as negative control (summary `working-directory` removed) | fails as designed (`["backend",""]`) — it would have caught the original defect |
| `yaml.safe_load` on ci.yml + step inspection | parses; bench job step working-directories `['-','-','backend','backend']`; unit-tests list includes the new script |
| `check-failure-registry.mjs --root . --strict` | PASS (0 errors, 0 warnings) |

## Gaps

- No local end-to-end replay of the `bench.txt` → `$GITHUB_STEP_SUMMARY` chain:
  local `npm` is intercepted by a WSL shim and no MySQL is listening on
  `127.0.0.1:3306`. The authoritative run is this PR's
  `Bench Perf Smoke (advisory)` job, which should now report green with the
  benchmark numbers in its summary.
- The visibility gap itself is **not** closed: by design no gate watches an
  advisory job, so a future silent red is only caught by a human reading main's
  run list. `FR-010` records this as an accepted residual risk; promoting the job
  to blocking remains a maintainer decision (explicitly Out of scope in #327).

## Closeout (post-merge, 2026-09-20)

| Item | Fact |
|---|---|
| PR | https://github.com/duanxldragon/pantheon-base/pull/330 |
| Merge commit | `b3350be37bd61078530588180331592632f8069a` |
| Merged at | 2026-09-20T05:56:27Z |
| Branch closure | `fix/bench-perf-smoke-summary-path` deleted from origin |
| PR signal | 32 success / 6 skipped / **0 failure** — advisory `Bench Perf Smoke` included |
| Main-tip signal (`b3350be3`) | `Bench Perf Smoke (advisory)` = **success** (run 35492933695, job 106030897699) |
| Ratchet decision | sensor-added (drift guard + `FR-010`) |

Gap closed by the merge: the missing local end-to-end replay of the
`bench.txt` → `$GITHUB_STEP_SUMMARY` chain (local npm shim + no MySQL) is now
answered by a real CI run — the job is green and its summary carries the
benchmark numbers, which was the entire point of the fix.

Gap still open by design: nothing watches advisory jobs. Walking main's run list
during this writeback surfaced the second instance of exactly that class —
advisory `Core Smoke` has been red since at least 2026-09-05 while its workflow
conclusion stays green (`continue-on-error: true`). Recorded as `FR-011`
(registry-only); fixing or re-scoping that job is deliberately not part of this
task (Out of scope here and in #327).

Consolidated writeback record: `.harness/evidence/2026-09-20-merged-packet-closeout/`.
