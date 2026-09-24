# Runtime-Evidence Gaps — CI/Staging Feasibility Assessment

Date: 2026-09-18
Scope: the three runtime-evidence gaps named in
`.harness/evidence/2026-09-10-tenant-verification-and-gray/review.md` (findings #4/#5/#7)
and `summary.md` "Known Gaps". This assessment classifies each gap into
**CI-executable now / staging-only / human-only** and records what was already executed.

## Verdict table

| Gap (review finding) | Verdict | Basis |
|---|---|---|
| #7 CGO race testing | **CLOSED as a CI gap — race already runs in CI; Windows remains a local-dev-only limitation** | Evidence below |
| #5 S3 runtime probe | **CI-EXECUTABLE NOW — wired into the CI unit-tests job in this change** | The env-gated round-trip test exists and is CI-safe (per-run unique bucket, self-cleanup); it only needed a MinIO service + env |
| #4 perf/observability baseline | **CI can carry a recurring perf smoke; the production-like baseline itself is STAGING-ONLY** | Prometheus middleware + `/metrics` endpoint already exist; no perf job exists; CI hardware is not a production-representative signal source |

## Gap #7 — CGO race testing (review finding #7, Medium)

The review recorded `go test -short -race ./internal/middleware` as
"environment-blocked (Windows, cgo disabled)". That describes the **local Windows
workstation only**, and the repository's Linux CI has been running race all along:

- `ci.yml` unit-tests job (ubuntu-latest, cgo available):
  `go test -race -short -coverprofile=coverage.out -covermode=atomic ./...`
  — verified **success** on main run 35313881254 (job "Unit Tests", step
  "Run Go tests with coverage").
- `quality.yml` "Backend Tests" (every PR): `go test -race ./...` (full suite,
  no `-short`).

Local repro on this Windows workstation (2026-09-18) still fails identically
(`-race requires cgo; enable cgo by setting CGO_ENABLED=1`), matching the review
record. **Disposition**: update the review finding's wording when the state file is
next revised — the race requirement is satisfied in CI; the Windows gap is a
local-developer-experience note, not a release-evidence gap.

## Gap #5 — S3 runtime probe (review finding #5, Medium)

State before this change: authorization logic fully covered via the injected fake
(6 isolation tests, `s3-download-authorization.md`), plus one env-gated real-store
round-trip `TestServiceStoreUsesRealS3WhenConfigured`
(`backend/pkg/upload/service_test.go:228`) that **skipped everywhere** because
`PANTHEON_TEST_S3_*` was never configured — so no live S3-compatible server ever
exercised the store→stat→get path in this repository.

CI-safety review of the test (no changes needed):

- Creates a unique bucket per run: `pantheon-upload-it-<unixnano>` → no collision
  between concurrent jobs/reruns.
- Self-cleanup via `t.Cleanup` (RemoveObject + RemoveBucket).
- Skips cleanly when env is absent → safe to also run locally without docker.

Wired in this change (`.github/workflows/ci.yml` unit-tests job):

- New service `minio` (`minio/minio:RELEASE.2025-09-07T16-13-09Z`, pinned tag),
  per-run random root password (`minio-ci-<run_id>-<attempt>`, no literal
  credential — mirrors the MySQL service's secrets:S6697 pattern).
- No `--health-cmd`: recent minio images ship no curl and in-image probe
  mechanics vary; readiness is awaited runner-side via unauthenticated
  `/minio/health/live` (30 × 2s).
- New env: `PANTHEON_TEST_S3_ENDPOINT=http://127.0.0.1:9000`,
  `PANTHEON_TEST_S3_ACCESS_KEY`, `PANTHEON_TEST_S3_SECRET_KEY`,
  `PANTHEON_TEST_S3_REGION=us-east-1`.
- Endpoint normalization (`normalizeS3Endpoint`) accepts `http://host:port`,
  and minio-go uses path-style addressing against MinIO — no code change needed.

Remaining (not CI-able): a **real cloud-S3** (AWS/Aliyun) signature-v4 edge probe
stays optional/staging-only; MinIO covers the S3-compatible API surface the code
targets.

## Gap #4 — production-like perf/observability baseline (review finding #4, High)

What exists in-repo (verified 2026-09-18):

- Prometheus instrumentation: `backend/internal/middleware/prometheus_middleware.go`
  (HTTP metrics) and `/metrics` endpoint in `backend/cmd/server/main.go:137`
  (gated by `metricsAccessMiddleware()`).
- Only 3 Go benchmarks, all in `audit_benchmark_test.go` (ListOperationLogs
  variants). No benchmark/latency CI job exists.
- The 09-14 runtime matrix (`tenant-runtime-matrix.ps1` / `.json`) covered
  functional isolation, not latency/concurrency/error-rate baselines.

Why the **baseline itself** cannot come from CI: the review asks for
production-like latency/concurrency/cache-hit/error-rate/alert baselines. GitHub
runners are 2-4 vCPU shared VMs with noisy neighbors — numbers taken there are not
production-representative and would create false confidence. What CI **can** carry
(a follow-up, not in this change):

1. `go test -bench` smoke for the existing audit benchmarks on the linux runner,
   tracked over time as a **relative regression signal** (never as absolute
   capacity numbers).
2. The already-committed `tenant-runtime-matrix.ps1` + `/metrics` scrape run in a
   **staging environment** (k8s manifests exist under `k8s/`) with realistic data
   volume — that is the earliest point where "production-like" becomes honest.
3. Alert-rule definition review (rules file does not exist yet) — human +
   staging validation.

## Disposition

- #7 → treat as CI-closed (document here); keep the Windows note as DX.
- #5 → closed by this CI wiring; verify on the next main CI run (MinIO service
  green + round-trip test no longer skipped).
- #4 → staging-only for the baseline; optional CI `bench` smoke as follow-up
  work with its own task id.
