# Review: visual-evidence observation gate wiring

## Summary

CI-governance-only change following the existing docs-governance advisory-step pattern: one npm script, one `continue-on-error: true` step with outcome reporting, no enforcement change. The step is explicitly excluded from the strict main/release block with an inline comment citing the promotion policy and HOT-001, so a future reader knows the exclusion is deliberate and what flips it.

## Findings

- No blocking findings.
- Scope check: changed files are exactly `package.json` + `.github/workflows/quality.yml` plus this task's harness artifacts — matches the manifest expectedFiles.
- The step cannot block any event: `continue-on-error: true` and absent from both enforcement conditionals.
- Self-review only (solo maintainer stage); findings-first format applied. Maintainer sign-off via PR approval.

## Decision

approved

## Machine Readable

```json
{
  "taskId": "2026-07-26-visual-evidence-observation-gate",
  "verdict": "approved",
  "methodReview": {
    "ownerLayer": "consumer-repository",
    "ratchetDecision": "sensor-added",
    "deferredCodeIssues": [],
    "consumerSpecificLeakage": "none"
  },
  "linkage": {
    "taskPacket": ".harness/tasks/2026-07-26-visual-evidence-observation-gate/manifest.json",
    "evidence": ".harness/evidence/2026-07-26-visual-evidence-observation-gate/commands.json",
    "reviewFile": ".harness/evidence/2026-07-26-visual-evidence-observation-gate/review.md",
    "changeRef": "none",
    "planRefs": []
  }
}
```
