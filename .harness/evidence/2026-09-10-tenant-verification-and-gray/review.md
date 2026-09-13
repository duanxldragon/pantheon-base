# Review: 2026-09-10-tenant-verification-and-gray

Reviewer posture: independent security and release-gate evaluator. Findings are ordered by release impact.

## Findings

0. **Verification result — local executable scope passed, release scope remains blocked.** On September 13, 2026, the backend short suite, hostile two-tenant middleware matrix, concurrent tenant-boundary test, tenant-sensitive package tests, frontend type-check, frontend lint, and whitespace gate passed. No cross-tenant leak was reproduced in those fixtures. This does not replace the missing live HTTP/browser, rollback, performance, observability, recovery, and human-gate evidence below.

1. **High — full hostile two-tenant browser/API matrix remains incomplete.** The password-verified login picker path now has Playwright coverage (3/3) and a real local HTTP probe with temporary tenants 101/202. The broader matrix still lacks browser/runtime proof for refresh, logout, CRUD, batch/export/count/aggregate, cache, file, async, and dynamic-module flows across tenant boundaries.
2. **High — gray flag and rollback path are unverified at runtime.** The task requires flag-on, flag-off, kill-switch, session/cache invalidation, and post-rollback audit checks. Only code-level and replica migration evidence exists.
3. **High — production migration and recovery gates are open.** The migration rehearsal passed on disposable MySQL replica `tenant_rehearsal` (`rehearse-20260911_065959`), but G1 runbook approval, G2 backup/RPO-RTO proof, G3 production window, and G4 contract freeze confirmation remain human gates.
4. **High — observability and performance are not measured.** No production-like latency, concurrency, cache hit, error-rate, trace, alert, or tenant-cardinality baseline was captured, so regression and alerting readiness are unknown.
5. **Medium — S3 object download authorization is not covered.** The local storage path is tenant-scoped in the core-data evidence, but the repository does not provide a verified S3 presigned/download path.
6. **Medium — durable async coverage is incomplete.** Operation-log tenant propagation is tested, but there is no separate durable job framework to verify retry, replay, dead-letter, and tenant-context preservation.
7. **Medium — race testing is environment-blocked.** `go test -short -race ./internal/middleware` cannot run on the current Windows toolchain because cgo is disabled. A Linux/CGO-enabled run is still required for concurrency confidence.

## Evidence

- Backend short suite and targeted hostile middleware tests passed on 2026-09-13.
- Frontend type-check and lint passed on 2026-09-13.
- `git diff --check` passed on 2026-09-13.
- Playwright core auth smoke passed 4/4; tenant picker E2E passed 3/3; login visual baselines passed 3/3 on 2026-09-13.
- Real local HTTP probe passed with temporary tenant fixtures 101/202 and restored `platform.tenant_mode=compat` afterward.
- Rendered screenshots are stored under `.harness/evidence/2026-09-10-tenant-verification-and-gray/artifacts/browser/`.
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
    "No complete flag-on/flag-off/kill-switch rollback runtime evidence.",
    "Production migration and recovery gates G1-G4 remain open.",
    "No production-like performance or observability baseline.",
    "S3 download authorization and durable async jobs remain unverified.",
    "Race testing is blocked by missing cgo on Windows."
  ],
  "residualRisks": [
    "Runtime tenant leakage and rollback failure are not ruled out.",
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
