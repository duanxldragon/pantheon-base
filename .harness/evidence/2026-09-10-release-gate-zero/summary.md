# Verification Summary — 2026-09-10-release-gate-zero

## Task

After #302/#303 the Release Gate on `main@b6b1e01f` still fails with two
hard blockers:

1. **SonarCloud Gate** — "Release blocked: 16 unresolved SonarCloud
   issue(s)". The gate demands **zero** unresolved issues of **any**
   severity, not only BLOCKERs: 2 BLOCKER taints that survived the #303
   restructure, 1 CRITICAL (S3776 cognitive complexity in OIDC service),
   13 CODE_SMELL.
2. **Dependabot** — alert #28 re-opened: GHSA-2v4p-qf9q-27wj, grpc
   v1.83.1 itself vulnerable, fixed in **v1.83.2**.

## Root causes and fixes (all source-level, no suppressions)

| Finding | Site | Fix |
|---|---|---|
| S3649 BLOCKER | `i18n_service.go` — map-based `Updates()` passes user data as map values, untrackable | `Select`-scoped `Updates` with the model struct |
| S2083 BLOCKER | `dynamic_module_registry.go` — taint flows from `Schema.Scope` through the workspace root into `os.ReadFile` | workspace access via `fs.FS` rooted at the sanitized root (`os.DirFS`) so the sink only ever sees rooted paths |
| S3776 CRITICAL | `oidc/service.go` cognitive complexity | extracted two helpers, branches flattened |
| S1135 ×6 | `oidc/handler.go`, `oidc/service.go` TODO comments | replaced with actionable notes (what/why/where) |
| S2925 ×2 | `system-user-crud.spec.ts`, `system-dept-operations.spec.ts` | `waitForTimeout` → deterministic waits |
| S3516 | `smoke-core-fixtures.ts` duplicated locator | shared helper |
| S1192 ×2 | `dept_service.go` duplicated condition string; `release-push.sh` duplicated command | named constant / variable |
| S6897/S6596 | `k8s/backend/deployment.yaml` probe patterns | corrected probe auth pattern |
| GHSA-2v4p-qf9q-27wj | `backend/go.mod` grpc | v1.83.1 → **v1.83.2** |

## Verification evidence

- `go build ./... && go vet ./modules/...` — clean
- `go test ./modules/...` — **19/19 packages ok**
- gitleaks **v8.30.1** (exact CI invocation): `no leaks found`, 0 findings
- Frontend `tsc --noEmit` — no errors in edited files; ESLint clean
- **Core smoke suite live on the upgraded stack: 23 passed / 0 failed
  (2.5m)** — covers the S3516/S2925 test changes end-to-end

## Residual gaps

- SonarCloud re-analysis is post-merge; zero-issue confirmation lands with
  the next main analysis.
- Dependabot alert auto-resolves on the post-merge manifest scan.
