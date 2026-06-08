# Review: 2026-06-03-main-sonar-batch-2-backend-i18n-coverage

## Machine Readable

```json
{
  "taskId": "2026-06-03-main-sonar-batch-2-backend-i18n-coverage",
  "verdict": "approved with documented P2 follow-up",
  "structuralReview": {
    "affectedSubgraph": [
      "I18nHandler -> I18nService -> locale cache/seed helpers"
    ],
    "checks": [
      "call-depth",
      "hub"
    ],
    "findings": [],
    "notes": "scaffolded from task packet Structural Scope; replace after graph review"
  },
  "linkage": {
    "taskPacket": "docs/harness/tasks/2026-06-03-main-sonar-batch-2-backend-i18n-coverage.task.md",
    "evidence": ".harness/evidence/2026-06-03-main-sonar-batch-2-backend-i18n-coverage/commands.json",
    "reviewFile": ".harness/evidence/2026-06-03-main-sonar-batch-2-backend-i18n-coverage/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/superpowers/plans/2026-06-03-main-sonar-priority-batches.md"
    ]
  }
}
```

## Findings

1. `backend/modules/system/i18n/i18n_service_fast_test.go`
   This batch adds self-contained fast tests for service paths that do not require a live MySQL fixture. That directly addresses the CI/Sonar blind spot where most existing `I18nService` coverage tests were being skipped because `PANTHEON_TEST_DSN` is unset in `quality.yml` and `sonar.yml`.

2. `backend/modules/system/i18n/i18n_service.go`
   The new tests cover builtin locale helper loading, cache-backed `GetLangPack` merge behavior, nil-db guard paths for overview/audit/missing-locale APIs, and normalization helpers. No production code paths or runtime contracts changed in this batch.

3. `quality.yml` / parent remediation backend phase
   Repository-wide backend verification remained green after the test-only change. The parent remediation evidence still records the Windows-specific downgrade from `go test -race ./...` to `go test ./...`, so this batch improves visible coverage without weakening the existing merge-gate contract.

## Assumptions

- this batch is intentionally coverage-only and does not claim to replace the existing MySQL fixture suite
- a fresh SonarCloud run is still needed to convert the local `12.6%` package coverage improvement into updated dashboard evidence

## Status

- Fast unit coverage for CI/Sonar-visible paths: complete
- Repository-wide backend regression check: complete
- MySQL-backed service suite portability: still open
- Fresh SonarCloud measurement: pending
