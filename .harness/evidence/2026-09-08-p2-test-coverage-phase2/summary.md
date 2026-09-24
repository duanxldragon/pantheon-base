# Summary — 2026-09-08 p2 test-coverage-phase2

Retroactive accounting: the master plan's phase-2 coverage targets
(org/i18n/dict/setting ≥ 40%, overall ≥ 40%) were already met by the DB-backed
suites; the packet directory simply never existed. No code change belongs to
this packet — the closure is a measurement plus the CI ratchet that keeps it.

## What was verified

| Target | Measured (2026-09-24, statement-weighted) | Bar | Result |
| --- | --- | --- | --- |
| org | 62.2% (dept 62.8%, post 61.2%) | 40% | ✅ |
| i18n | 68.7% (1014/1476) | 40% | ✅ |
| dict | 45.3% (433/955) | 40% | ✅ |
| setting | 62.8% (492/783) | 40% | ✅ |
| overall | 56.0% (`go tool cover -func` total) | 40% | ✅ |
| CI ratchet | `ci.yml:431` `check-coverage --threshold 50` — executed locally: `OK: total coverage 56.0% meets threshold 50%` | — | ✅ |

## Explicit gap

The numbers are a local 2026-09-24 snapshot; continuous enforcement is the CI
gate. dict has the least headroom above the per-domain bar. Profiles
(`backend/coverage_p2.txt`, `cov_func_p2.txt`) are transient and deleted in
cleanup — the figures live in this evidence and in the packet's statusNote.

## Residual risks

- A per-domain regression below 40% would not trip the 50%-overall CI gate;
  only the per-package suite failures or a future per-domain check would notice.
- The generator package (26.3%) is deliberately out of this packet's scope and
  tracked by phase 3.
