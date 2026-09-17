# Review: 2026-09-10-tenant-verification-and-gray

Reviewer posture: independent security and release-gate evaluator. Findings are ordered by release impact.

## Findings

0. **Verification result — local executable scope passed, release scope remains blocked.** On September 14, 2026, the backend short suite, hostile two-tenant middleware matrix, concurrent tenant-boundary test, tenant-sensitive package tests, frontend type-check, frontend lint, whitespace gate, auth/tenant-picker browser smoke (7/7), protected-resource browser smoke (1/1), and the real local HTTP tenant runtime matrix (23/23) passed. The logout fix now deletes the current Redis access session and invalidates the middleware cache; the old access token was rejected immediately after logout. No cross-tenant leak was reproduced in those fixtures. This does not replace the missing production-like rollback, performance, observability, recovery, and human-gate evidence below.

1. **High — browser coverage does not mirror the complete HTTP matrix.** The password-verified login picker path and auth critical path have Playwright coverage (7/7), and a focused protected-resource smoke now passes 1/1 for dashboard/dictionary pages, dictionary list/export isolation, and ID/batch tampering. The real local HTTP probe covers 23 tenant checks including refresh, logout, CRUD-adjacent dictionary operations, export, audit, file namespace, and kill-switch. Browser/runtime proof for the remaining protected-resource, cache, async, and dynamic-module surfaces is still absent.
2. **High — production-like gray rollback remains unverified.** The local matrix exercised compat -> multi -> compat and kill-switch force expiry, but the task still lacks production-like rollback timing, distributed cache/session invalidation, post-rollback audit checks, and approved recovery evidence.
3. **High — production migration and recovery gates are open.** The migration rehearsal passed on disposable MySQL replica `tenant_rehearsal` (`rehearse-20260911_065959`), but G1 runbook approval, G2 backup/RPO-RTO proof, G3 production window, and G4 contract freeze confirmation remain human gates.
4. **High — observability and performance are not measured.** No production-like latency, concurrency, cache hit, error-rate, trace, alert, or tenant-cardinality baseline was captured, so regression and alerting readiness are unknown.
5. **Medium — S3 object download authorization is not covered.** The local storage path is tenant-scoped in the core-data evidence, but the repository does not provide a verified S3 presigned/download path.
6. **Medium — durable async coverage is incomplete.** Operation-log tenant propagation is tested, but there is no separate durable job framework to verify retry, replay, dead-letter, and tenant-context preservation.
7. **Medium — race testing is environment-blocked.** `go test -short -race ./internal/middleware` cannot run on the current Windows toolchain because cgo is disabled. A Linux/CGO-enabled run is still required for concurrency confidence.

8. **Resolved during this verification — logout access-token revocation gap.** The handler now deletes the current Redis access-token session and invokes the cache invalidator supplied by the auth module composition root. The runtime matrix confirmed the old access token receives `token.invalid` immediately after logout.

## Evidence

- Backend short suite and targeted hostile middleware tests passed on September 14, 2026.
- Frontend type-check and lint passed on September 14, 2026.
- `git diff --check` passed on September 14, 2026.
- Playwright core auth smoke passed 4/4; tenant picker E2E passed 3/3; login visual baselines passed 3/3 on September 14, 2026.
- Protected-resource Playwright smoke passed 1/1 on September 14, 2026 using independent tenant-101/tenant-202 browser contexts; cleanup restored `platform.tenant_mode=compat`.
- Auth plus tenant-picker smoke passed 7/7 on September 14, 2026; the local HTTP tenant matrix passed 23/23.
- Real local HTTP probe passed with reusable smoke tenants 101/202 and restored `platform.tenant_mode=compat` afterward; temporary dictionary fixtures and the kill-switch blacklist were removed.
- Rendered screenshots are stored under `.harness/evidence/2026-09-10-tenant-verification-and-gray/artifacts/browser/`.
- Dashboard and system-user-list visual baselines were run and remain unresolved at approximately 2% pixel difference; snapshots were not updated.
- Replica migration success/conflict/failure rollback rehearsal passed; see `.harness/evidence/2026-09-10-tenant-migration-runbook/rehearsal-log.md`.
- Tenant audit, settings, upload, auth-log, async operation-log, and generator guard slices have isolation tests; see `.harness/evidence/2026-09-10-tenant-core-data-infrastructure/`.
- Database-per-tenant is evaluated as a future Phase 3 optional dedicated/hybrid deployment mode; it does not change Tenant Contract V1 or approve a production switch.

## Inference

- The verified code slices provide a reasonable shared-schema foundation, but green unit tests do not establish release readiness for a runtime-sensitive multi-tenant rollout.
- Because the missing evidence covers direct data-leak and rollback failure modes, the safest release state is `blocked`, not `controlled pilot`.

## Unknowns

- Real two-tenant HTTP/browser behavior under production-like auth/session/cache/storage dependencies.
- Runtime feature-flag rollback timing and data/session/cache integrity after rollback.
- Production-scale migration duration, RPO/RTO, restore verification, and operational alert thresholds.
- S3 provider behavior and durable-job tenant propagation if those integrations are enabled.
- Race behavior in a CGO-enabled environment.

## Verdict

**blocked**

The task must remain `in-progress` until the runtime evidence and human gates are completed. No production migration, gray rollout, or claim of production readiness is authorized by this review.

## Machine Readable

```json
{
  "taskId": "2026-09-10-tenant-verification-and-gray",
  "verdict": "blocked",
  "findings": [
    "Full hostile two-tenant browser/API matrix is incomplete; login picker path is covered by Playwright and a local HTTP probe.",
    "Local flag-on/flag-off/kill-switch behavior passed, but production-like rollback timing and distributed cache/session recovery evidence remain open.",
    "Production migration and recovery gates G1-G4 remain open.",
    "No production-like performance or observability baseline.",
    "S3 download authorization and durable async jobs remain unverified.",
    "Race testing is blocked by missing cgo on Windows."
  ],
  "residualRisks": [
    "Production-like rollback failure and untested browser/resource paths are not ruled out.",
    "Production-scale migration, recovery, and alerting behavior are unknown.",
    "Dedicated database deployment is only a future Phase 3 option and is not approved."
  ],
  "structuralReview": {
    "affectedSubgraph": [
      "ingress -> auth/IAM -> tenant context -> protected resources/side effects -> audit/metrics -> release flag"
    ],
    "checks": [
      "cycle",
      "hub",
      "call-depth",
      "sensitive-flow"
    ],
    "findings": [],
    "notes": "CodeGraph index was up to date; this pass added evidence only."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-09-10-tenant-verification-and-gray/manifest.json",
    "evidence": ".harness/evidence/2026-09-10-tenant-verification-and-gray/commands.json",
    "reviewFile": ".harness/evidence/2026-09-10-tenant-verification-and-gray/review.md",
    "changeRef": "none",
    "planRefs": [
      ".harness/tasks/TENANT_EVOLUTION_MASTER_PLAN_20260910.md",
      ".harness/tasks/2026-09-10-tenant-core-auth-iam/task.md",
      ".harness/tasks/2026-09-10-tenant-core-data-infrastructure/task.md"
    ]
  }
}
```
