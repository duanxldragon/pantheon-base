# Review — 2026-09-20-bench-perf-smoke-summary-path

## Reviewer disposition

Reviewed as a CI-infrastructure defect fix with the `high-workflow` overlay
(`.github/workflows/*` touched) plus one new deterministic guard. No product
code, no contract, no permission/menu/i18n surface, no backend code.

## Checks

| Question | Answer |
|---|---|
| Is the root cause established from evidence, not inferred? | Yes — per-step conclusions from the PR #329 run (bench step success, summary step failure with `cat: bench.txt: No such file or directory`), reproduced in the same shape on both `main` runs after #327 |
| Does the fix address the cause rather than the symptom? | Yes — the reporter now runs in the same working-directory as the writer; the artifact contract between the two steps is explicit |
| Could the fix quietly change the job's gate weight? | No — the job stays report-only: name unchanged, `-benchtime 1x` unchanged, still absent from `ci-summary` needs, and the new guard asserts all three |
| Is the new guard real (not a tautology)? | Yes — negative control with the fix reverted fails with `["backend",""]`; with the fix it passes |
| Does the guard run in CI? | Yes — `npm run test:ci-bench-perf-smoke-workflow` added to the always-running `unit-tests` job's npm test list (same pattern as `test:release-gate-workflow`) |
| Ratchet policy satisfied for a repeated failure? | Yes — 3 red runs escalated to a feedback control (test) plus a failure-registry entry (`FR-010`, `sensor-added`), not just a one-line patch |
| Any risk to unrelated CI behaviour? | No other job, step order, or trigger changed; `yaml.safe_load` confirms the structure and the job list is identical |
| Failure registry row schema valid? | Yes — `check-failure-registry.mjs --root . --strict` PASS (0 errors, 0 warnings) |
| Residual risk recorded? | Yes — the visibility gap (no gate watches advisory jobs) is stated in summary.md and FR-010; the promotion decision stays a maintainer gate |
| Evidence gaps honest? | Yes — local npm/WSL shim and absent local MySQL are declared; end-to-end proof is delegated to the PR's job run |

## Verdict

Approve for PR. Blast radius is one workflow line plus an additive guard; the
advisory job's semantics are unchanged and its red-on-main baseline is restored.

## Machine Readable

```json
{
  "taskId": "2026-09-20-bench-perf-smoke-summary-path",
  "verdict": "approved",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-09-20-bench-perf-smoke-summary-path/manifest.json",
    "evidence": ".harness/evidence/2026-09-20-bench-perf-smoke-summary-path/commands.json",
    "reviewFile": ".harness/evidence/2026-09-20-bench-perf-smoke-summary-path/review.md",
    "changeRef": "none",
    "planRefs": [
      ".harness/tasks/2026-09-20-ci-bench-perf-smoke/task.md"
    ]
  }
}
```
