# Review — 2026-09-20-module-governance-flaky-timeout

## Reviewer disposition

Reviewed as test-only stabilization. The diff raises one test budget constant
(`test.setTimeout(120_000)`) plus an explanatory comment. No product code, no
contract, no permission/menu/i18n surface touched.

## Checks

| Question | Answer |
|---|---|
| Does the fix address the recorded root cause (#246/#284 lineage)? | Yes — budget now contains the spec's own retry block (60s toPass + 90s goto), removing the timeout inversion |
| Is the stabilization pattern in-repo? | Yes — same `test.setTimeout` pattern as `tenant-hostile-browser-matrix.spec.ts` |
| Any product behavior change? | No — smoke spec only |
| Real-flow runtime evidence? | Yes — local real generate→register→purge cycle passed (1 passed, 10.9s) against a node-capable backend |
| Environment findings surfaced during verification | The maintainer-started 8080 backend lacks `node` in PATH → generator preview 500 `module.generate.server_export_failed`; not a code defect, out of this PR's scope, reported to maintainer |
| Risk classification | Standard (test-only); one non-author approval sufficient |

## Residual risks

- CI Full Smoke Suite is the final arbiter for the 2-vCPU runner timing profile; local run used a warmed environment.
- The 8080 node/PATH finding could mislead future local smoke runs until the maintainer restarts that backend with node available; recorded in commands.json knownGaps.
