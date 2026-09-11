# Evidence Summary — 2026-09-10-tenant-ready-guardrails

Date: 2026-09-10
Implementer: Generator (Codebuff/Buffy session)
Scope: task 0 of `TENANT_EVOLUTION_MASTER_PLAN_20260910.md` — pseudo-capability retirement, tenant-readiness guardrails, coverage measurement reconciliation. Single-tenant runtime unchanged.

## Human Gates Resolved (per maintainer, session kickoff)

1. **Execution scope**: maintainer selected "queue 0-3" (guardrails + contract design + migration runbook + canary slice), explicitly accepting canary work ahead of formal contract freeze per master-plan stop-condition exception.
2. **Coverage reconciliation approach**: maintainer selected "add MySQL/Redis services to the CI unit-tests job" (gate policy change approved). Threshold values set from measured readings (below), not local-only claims.

## Deliverable 1: Generator pseudo-capability retired (8/8 touchpoints)

| # | Touchpoint | Change |
| --- | --- | --- |
| 1 | `backend/internal/scaffold/contract.go` (`isValidDataScopeMode`) | `tenant` removed from accepted modes; doc comment names runtime truth source and master plan |
| 2 | `frontend/src/modules/lowcode/generator/schema.ts` (`DataScopeMode` type) | `'tenant'` removed from union; comment documents the retirement rationale |
| 3 | `frontend/src/modules/lowcode/generator/pages/ModuleWizard.tsx` | tenant `<Select.Option>` removed |
| 4-8 | `frontend/src/i18n/resources/{zh-CN,en-US,ja-JP,ko-KR,fr-FR}.ts` | `generator.wizard.dataScopeMode.tenant` key removed from all five locales |

Backend regression test added: `TestValidateRegisterRequestRejectsInvalidGovernanceContract/tenant_data_scope_mode_is_not_implemented_and_must_be_rejected` (workspace_test.go) — asserts `tenant` data scope now fails registration with `module.generate.invalid_data_scope`.

## Deliverable 2: Tenant-readiness guardrails in governance docs

- `docs/acceptances/BUSINESS_MODULE_ACCEPTANCE_MATRIX.md` (+ `.en.md`): new section 1.1 — four mandatory DDL-review questions (tenant field, tenant-local uniqueness, query/export/aggregate filter injection point, audit dimension) with disposition rules; notes runtime truth source `backend/pkg/common/data_scope.go`.
- `docs/designs/TENANT_RESOURCE_SCOPE_MATRIX.md` (+ `.en.md`): new template — resource scope classes (`platform-global` / `tenant-owned` / `tenant-overridable` / `derived`), initial inventory (uncertain items marked pending contract freeze), global unique-key registry, and tenant-identification methods all explicitly "pending decision, no implementation".

## Deliverable 3: Coverage measurement reconciliation (CI bridge built)

Root cause (per plan): evidence numbers were measured locally with MySQL+Redis; CI `unit-tests` had no DB services and measured the DSN-less path (auth/login 8.9%, auth/security 6.0%, iam/permission 5.5%, iam/user 10.8%, audit 26.5%) — two disconnected measurement lines.

Change (`.github/workflows/ci.yml`, unit-tests job):

- Added `mysql:8.0` and `redis:7-alpine` service containers with health checks.
- Added job env `PANTHEON_TEST_DSN` (root:pantheon@tcp(127.0.0.1:3306)/pantheon_test) and `PANTHEON_TEST_REDIS_ADDR` (127.0.0.1:6379). CI containers have no password, matching `pkg/testmysql` / `pkg/testredis` helpers, which create isolated per-test databases and skip when unset (DSN-less path preserved for local dev).
- `timeout-minutes` raised 10 → 20 (recorded as Economics Watch item).
- Backend coverage threshold raised 11 → 50 (see measured value below; `vars.COVERAGE_THRESHOLD` repo variable still overrides).

Frontend threshold intentionally untouched (still `vars.FE_COVERAGE_THRESHOLD || 0`).

### Measured readings

DB-backed (`-short -coverprofile`, MySQL 8.0.36 + Redis local, per-package average):

| Package | DB-backed |
| --- | --- |
| modules/auth/login | 77.3% |
| modules/auth/session | 50.7% |
| modules/auth/security | 40.9% |
| modules/system/iam/menu | 67.1% |
| modules/system/iam/permission | 66.6% |
| modules/system/iam/role | 61.1% |
| modules/system/iam/user | 67.0% |
| modules/system/audit | 65.7% |
| **overall** | **55.6%** |

Threshold = 50 chosen with headroom below measured 55.6; CI must be re-checked on first CI run (gap G1).

DSN-less re-check after the guardrail change: full backend suite still green (DB-backed helpers skip cleanly when DSN unset).

### coverage-phase1 manifest alignment

`.harness/tasks/2026-09-08-p1-test-coverage-phase1/manifest.json`: `status` `in-progress` → `done`, with a `reconciliation` note recording the approved approach, the re-measured numbers, and the threshold rationale. Not done earlier precisely because the CI bridge did not exist; now both measurement lines agree. (Approved in the same maintainer gate as the CI change.)

## Verification Evidence

| Check | Command | Result |
| --- | --- | --- |
| Scaffold contract tests | `go test ./internal/scaffold/... -run TestValidateRegisterRequest*` | PASS (incl. new tenant-rejection case) |
| Full backend suite (DSN-less) | `go test ./...` from `backend/` | PASS, 0 failures |
| Full backend suite (DB-backed, -race -short) | `PANTHEON_TEST_DSN=... PANTHEON_TEST_REDIS_ADDR=... go test -race -short ./...` | PASS, 0 failures (one local-Redis password env var required locally; CI provides passwordless services) |
| Frontend type-check | `tsc --noEmit` (direct node invocation; `npm run type-check` script shim broken on this Windows host — WSL message) | PASS, exit 0 |
| Frontend lint | `eslint src --max-warnings 0` | PASS, exit 0 |
| i18n locale audit | `node scripts/audit-i18n-locales.mjs` | all five locales `keys=2804 missing=0 extra=0` (was 2805; tenant key removed in sync) |
| Doc frontmatter | `node scripts/harness/check-doc-frontmatter.mjs --root .` | 0 errors (report-only, 11 pre-existing legacy warnings) |
| Doc links | `node scripts/harness/check-doc-links.mjs --root . --strict` | 0 findings |
| CI YAML parse | `js-yaml` parse of `ci.yml` | OK |
| Task-packet checker | `node scripts/harness/check-task-packet.mjs` | 166 errors / 47 warnings — verified identical on stashed baseline (pre-existing, scoped to legacy `docs/harness/tasks` files, not this change) |

## Runtime Evidence & Gaps

- Single-tenant regression: generator contract tests + full suite pass; no runtime behavior change (only an invalid mode is now rejected). Browser smoke not run — no UI behavior change beyond removing an option; recorded as **explicit runtime gap G0** (option removal not visually verified).
- **G1**: threshold 50 and timeout 20 are derived from local DB-backed measurement; first CI run on the branch must confirm the gate is green (CI cannot be executed from this session).
- **G2**: repo variable `COVERAGE_THRESHOLD` (if set in GitHub repo settings) overrides the new default 50; if the repo has it pinned at 11, the gate stays loose — maintainer should remove/update the variable at next gate review.

## Economics Watch

- unit-tests `timeout-minutes` 10 → 20 (services + DB-backed tests). Actual CI duration to be recorded at G1.
