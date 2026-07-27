# Review — CI API unit test wiring

## Findings

- No blocking finding in the focused diff.
- The workflow runs a repository-local npm script after the existing dependency installation and frontend coverage tests; no permissions, external action, or package dependency changed.
- The runner exits non-zero for a missing directory, unresolved relative import, or failed test suite, so CI cannot silently omit a broken API unit test.

## Residual Risk

- `actionlint` is CI-only in this environment. The PR must pass the existing `Lint Workflows` job before this batch can be considered merged.

## Decision

approved with documented P2 follow-up

## Machine Readable

```json
{
  "taskId": "2026-07-27-ci-api-unit-test-wiring",
  "verdict": "approved with documented P2 follow-up",
  "structuralReview": {
    "affectedSubgraph": ["tests/api", "frontend/scripts", "CI frontend test job"],
    "checks": ["cycle", "hub", "call-depth", "sensitive-flow"],
    "findings": [],
    "notes": "No production request or runtime import path changed."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-07-27-ci-api-unit-test-wiring/manifest.json",
    "evidence": ".harness/evidence/2026-07-27-ci-api-unit-test-wiring/commands.json",
    "reviewFile": ".harness/evidence/2026-07-27-ci-api-unit-test-wiring/review.md",
    "changeRef": "none",
    "planRefs": []
  }
}
```

