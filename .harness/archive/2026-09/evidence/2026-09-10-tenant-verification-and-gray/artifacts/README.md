# Artifacts

Reusable migration and database-per-tenant evaluation artifacts remain linked from `summary.md`.

## Gate G2/G3 preparation artifacts (added 2026-09-18)

- `g2-restore-TEMPLATE.md` — pre-filled record template extracted from the G2 drill
  procedure §5; the DBA copies it to `g2-restore-<runid>.md` when executing the drill.
  Until a filled record with DBA + maintainer signatures exists, G2 stays OPEN.
- `g3-toolchain-readiness-LOCAL-SAMPLE-20260918.md` — verification that the G3 sizing
  tool-chain works end-to-end (8/8 unit tests, read-only proof, local snapshot→plan run).
  LOCAL-SAMPLE numbers are explicitly NOT gate evidence; production capture steps for the
  DBA/maintainer are listed inside.
- Production capture outputs expected later: `g2-restore-<runid>.md`,
  `g3-snapshot-<date>.json`, `g3-window-worksheet-<date>.md`.

No screenshots, traces, dashboards, or production backup artifacts were generated.
