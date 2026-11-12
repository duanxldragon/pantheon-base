---
title: Base shared-contract task closeout 2026-11-12
doc_type: Evidence
layer: platform
status: Active
updated_at: 2026-11-12
---

Parent task: `docs/harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps.task.md`. Manifest: `.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/manifest.json`.

## Scope closed locally

The task's four local acceptance criteria are satisfied on the working source:

1. Shared operational UI: controlled `ConditionBuilder` editing contract and `ExecutionStepRail` theme/status-label fixes with unit tests (`conditionEditing.test.tsx`) and rendered desktop/mobile light/dark captures (`condition-lifecycle-browser/`, `condition-stable-browser/`, `resume-editor-visual/`).
2. Provider-owned permission routes: `backend/pkg/permissionroutes` registry (validated, atomic, fail-closed, conflict-detecting) consumed by role synchronization (`TestRoleService_ProviderRoutesGrantAndRevoke`) and workbench coverage (`RequiredAPIRoutesByPermission` / `requiredAPIPoliciesByPermissionKey`), with no business import into `system/*`.
3. Dashboard extension: `OperationalDashboardWidgets.tsx` with bounded permission-aware data contract, unit tests and rendered states (`dashboard-rendered-final/`, `dashboard-retry-browser/`).
4. Consumer governance artifacts: `config/foundation-consumer-artifacts.json`, sealed candidate producer/descriptor tooling, tenant generator contract (`TestTenantGeneratorContract`) and provider registries (`TestBusinessProviderRegistryStartupOnly`, `TestBusinessGroupFailsClosedAndHasAdditiveChain`), plus the permission-cache revocation repair (`verification/auth-permission-cache-repair-20261112/`).

Four test paths forecast in the manifest (`internal/scaffold/contract_test.go`, `internal/scaffold/types_test.go`, `modules/auth/module_test.go`, `modules/system/system_modules_test.go`) were delivered as consolidated coverage instead of duplicate files: the v2 tenant generator contract lives in `internal/scaffold/workspace_test.go:227` and the provider registry/seal behavior in `pkg/contracts/business_tenant_groups_test.go` and `pkg/contracts/module_required_test.go`.

## Verification 2026-11-12

| Check                                                                                                                                                                                                 | Result                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `go test -race -p 1 ./modules/auth/... ./pkg/permissionroutes/ ./modules/system/iam/... ./pkg/contracts/... ./pkg/tenant/... ./pkg/auditpolicy/... ./internal/middleware/... ./internal/scaffold/...` | exit 0, 17 packages ok (auth/login 248.148s), no data race |
| `go test` same set without race                                                                                                                                                                       | exit 0                                                     |
| `go vet` auth/iam/permissionroutes/contracts                                                                                                                                                          | exit 0                                                     |
| `go build ./...`                                                                                                                                                                                      | exit 0                                                     |
| `gofmt -l` changed files                                                                                                                                                                              | clean                                                      |
| frontend `eslint .`                                                                                                                                                                                   | exit 0                                                     |
| frontend `tsc -b`                                                                                                                                                                                     | exit 0                                                     |
| frontend `vitest run`                                                                                                                                                                                 | 240 passed                                                 |
| frontend `vite build`                                                                                                                                                                                 | exit 0                                                     |
| `check:task-packet`, `check:task-packet-template`, `check:docs-frontmatter`, `check:harness-encoding`, `check:harness-evidence`, `check:harness-review`                                               | rerun after closeout edits                                 |

Environment: Go 1.26.10 windows/amd64, CGO 1, MinGW `D:/msys64/mingw64/bin` on PATH; MySQL `127.0.0.1:33316` isolated per-test schemas; task-owned Redis `127.0.0.1:26317` DB 3; shared preview Redis 6379 and shared Redis 26316 untouched.

## Residual gates (not satisfied, not waived)

- Independent installed CODE/ARCH review of this final source was unavailable (model-provider 503 lanes); no independent approval is inferred.
- No normal combined candidate was assembled or published, no official immutable release exists for these repairs, and Ops has not consumed them; the official Ops foundation lock is unchanged at v0.18.6.
- Final visual/functional maintainer acceptance is not performed.
- Ops-side product acceptance (CMDB key-only public run, O2/O3/O4 combination, D2 policy) remains open; the consumed CMDB R3 run is not replayed and its product-versus-oracle classification is unresolved.
- Base-side real S3 provider skip remains unwaived and the maintenance freeze is unsigned, as recorded in the release task.
