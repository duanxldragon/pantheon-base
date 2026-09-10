# Verification Summary — 2026-09-10-release-gate-repair

## Task

Restore the two persistent red gates on main: **Release Gate** (Dependabot
Alerts + Candidate Checks) and **Security Gates** (Secret Scan).

## Root causes

1. **Dependabot Alerts (Release Gate)**: 5 open high/critical alerts, all in
   `backend/go.mod` — 4× `google.golang.org/grpc` v1.76.0 (CVE-2026-33186
   critical < 1.79.3; CVE-2026-84445 high < 1.82.2; CVE-2026-84304 high
   ≤ 1.83.0; GHSA-hrxh-6v49-42gf high < 1.82.1) + 1× `go-jose/go-jose/v3`
   v3.0.1 (CVE-2026-34986 high < 3.0.5).
2. **Candidate Checks (Release Gate)**: required check `SonarCloud Code
   Analysis` failing on main — quality gate `new_security_rating = 3`
   (threshold 1), caused by new code `k8s/backend/deployment.yaml`
   (kubernetes:S6865 automounted service account, created 2026-09-09).
3. **Secret Scan (Security Gates)**: 2 gitleaks `curl-auth-header` findings —
   `Authorization: Bearer YOUR_TOKEN` documentation placeholders in
   `k8s/README.md:208` and `.harness/tasks/2026-09-08-p1-k8s-manifests/task.md:448`,
   introduced by the v0.12.0 squash commit `b2e90791`. The `.gitleaksignore`
   already carried the identical findings under the original commit
   `178756d`; the squash changed the commit component of the fingerprint.

## Fixes

| Fix | File | Effect |
|-----|------|--------|
| grpc 1.76.0 → 1.83.1 (≥ all 4 patched thresholds), go-jose/v3 3.0.1 → 3.0.5, otlptracehttp 1.24.0 → 1.43.0 + transitives | `backend/go.mod`, `backend/go.sum` | All 5 high/critical alerts resolved by version match |
| `automountServiceAccountToken: false` (pod never calls the K8s API) | `k8s/backend/deployment.yaml` | Resolves kubernetes:S6865 → new_security_rating returns to 1 after re-scan |
| +2 fingerprints for commit `b2e90791` | `.gitleaksignore` | Secret Scan returns to 0 findings |

## Verification evidence

- `go build ./...`, `go vet ./modules/... ./internal/...`,
  `go test ./modules/... ./internal/...` — all pass after upgrade.
- gitleaks v8.30.1 (same version + command as CI): **2 findings before →
  0 findings after** the ignore append.
- smoke-core suite run live against a local backend rebuilt with grpc 1.83.1:
  21 passed / 3 skipped; the 2 specs that failed in the first round
  (auth error-toast, dept success-toast assertions) re-ran **7 passed /
  0 failed** — message-render timing races unrelated to the upgrade code paths.
- Dependabot alert resolution and SonarCloud re-scoring are post-merge CI
  effects; pre-merge verification is by exact patched-version match
  (`first_patched_version` from alert metadata) and the local scanner run.

## Residual gaps

- If SonarCloud still reports residual new issues after merge, they were not
  visible in the VULNERABILITY issue list at fix time (5 open, 4 dated
  2026-04/06 = previous-version baseline, 1 addressed here).
