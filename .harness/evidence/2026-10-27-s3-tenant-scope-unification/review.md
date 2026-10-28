# Review — `2026-10-27-s3-tenant-scope-unification`

Reviewed against the working tree (base `a053805b`). Measured diff: **29 files,
+278 / −373** (production-only 25 files, +267 / −364; three new files, 539
lines). Every path is inside the packet's `expectedFiles`, with two path
corrections recorded in `commands.json → knownGaps` (dashboard lives at
`modules/platform/`, dept/post under `modules/system/org/`). `doNotTouch`
(`pkg/tenant/authz.go`, `pkg/database/scope.go`, migrations, data-scope
middleware, routes/permissions/menus/i18n/seeds) is untouched.

## Reviewer posture, item by item

| Posture item | Reading |
|---|---|
| One implementation exists and is tested | `pkg/tenant/scope_helper.go` holds `Scoper` + `OwnerTenantID`. `scope_helper_test.go` pins all three contexts through GORM `DryRun` SQL, so the test fails the moment a predicate is lost. |
| All 14 services use the helper; copies are zero | `grep func.*tenantOwnerID` → 0 and `grep func.*scoped(db *gorm.DB)` → 0 across `backend`. The two intentional variants (setting read scope, dashboard whitelist) keep custom queries but take owner from the helper. |
| nil / compat / multi semantics unchanged | Snapshot test asserts: nil = no `tenant_id` predicate, compat = `tenant_id = 0`, multi = `tenant_id = 101`; owner 0/0/101. This is exactly the 2026-10-24 regression guard (compat must not collapse into nil). |
| No query lost its tenant predicate | Mechanical replacement only: `s.scoped` → `s.Scoped`, `s.tenantScope()` → `s.Scope()`, `s.tenantOwnerID()` → `s.TenantOwnerID()`. Full suite green (47 ok). |
| Two-tenant case exercises both directions | `tenant_isolation_smoke_test.go` seeds A=101/B=202; A succeeds on its rows, B's same calls yield not-found/zero rows, listing counts unchanged; compat sees only tenant 0; write owner comes from context. |
| No schema, route, permission or envelope change | `git diff` touches only service plumbing, helper, tests, docs and task bookkeeping. Migrations and the data-scope middleware are not in the diff. |

## Deliberate non-conversions

- `login.Runtime` (`login_runtime.go`) keeps its own `tenantCtx`: it is the
  composition root that binds the request context once, not a per-request
  service copy. Converting it would have moved the binding site, not removed a
  duplicate.
- setting's `tenant_id IN (0, tenantID)` and dashboard's whitelist are
  per-module policy values, not duplicated mechanism; the programme's
  implementation notes explicitly keep those per module.

## Findings

- **P3, runtime evidence local gap**: the two-tenant case skips without a DSN.
  CI enforces it (`PANTHEON_TEST_DSN_REQUIRED=true`); local execution was not
  possible and credentials were not guessed. Recorded in `two-tenant-run.log`.
- **P3, line-count gap vs audit estimate**: net production −44 lines versus the
  audit's 250–400 estimate. The estimate assumed a chubbier trio; the helper's
  value is one implementation and one pinning test, not raw deletion. Recorded
  in `summary.md` rather than inflated.
- **P3, sample scope**: the E2E case is service-layer, not HTTP. Middleware and
  handler wiring are covered by existing handler tests; adding an HTTP harness
  would belong to an integration-testing packet, not this refactor.

## Machine Readable

```json
{
  "taskId": "2026-10-27-s3-tenant-scope-unification",
  "verdict": "approved",
  "structuralReview": {
    "affectedSubgraph": [
      "backend/pkg/tenant/scope_helper.go",
      "backend/modules/system/iam/role/role_service.go",
      "backend/modules/system/iam/user/user_service.go",
      "backend/modules/system/iam/permission/permission_service.go",
      "backend/modules/system/org/dept/dept_service.go",
      "backend/modules/system/org/post/post_service.go",
      "backend/modules/system/config/dict/dict_service.go",
      "backend/modules/system/config/setting/setting_service.go",
      "backend/modules/platform/dashboard_service.go",
      "backend/modules/auth/login/login_service.go",
      "backend/modules/auth/security/security_service.go",
      "backend/modules/auth/session/session_service.go"
    ],
    "checks": ["cycle", "sensitive-flow"],
    "findings": [
      "P3 runtime evidence local gap: the two-tenant smoke skips without a MySQL DSN; CI enforces it with PANTHEON_TEST_DSN_REQUIRED=true, and credentials were deliberately not searched for.",
      "P3 line-count gap vs audit estimate: production net is -44 lines, not 250-400; the value is one implementation plus one pinning test, recorded rather than inflated.",
      "P3 sample scope: the two-tenant case is service-layer, not an HTTP round-trip; handler wiring stays covered by existing handler tests."
    ],
    "notes": "The change is mechanical: the per-service trio bodies were byte-equivalent, so the shared Scoper reproduces them exactly. The hot-path risk is covered from two directions - an offline DryRun test asserts nil/compat/multi SQL and owner semantics (the 2026-10-24 compat-collapse regression), and a two-tenant case on a real schema asserts A-succeeds/B-blocked plus context-sourced write owners. Two intentional per-module variants (setting override-on-global read scope, dashboard table whitelist) keep their custom queries and only share the owner helper. No route, permission, menu, i18n key, envelope, schema or migration moved; build, vet, gofmt and the full 47-package suite are green, with the only runtime gap being the local MySQL DSN."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-27-s3-tenant-scope-unification/manifest.json",
    "evidence": ".harness/evidence/2026-10-27-s3-tenant-scope-unification/commands.json",
    "reviewFile": ".harness/evidence/2026-10-27-s3-tenant-scope-unification/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-27-codebase-simplification-program.task.md",
      "docs/contracts/TENANT_CONTRACT_V1.md"
    ]
  }
}
```
