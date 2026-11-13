Both failures have specific causes. No files were changed, and no tests or cleanup operations were run.

1. **Race failure: a Base-owned, source-dependent test fixture defect.**

   The [test](/D:/workspace/go/pantheon-platform/audit-artifacts/task-closeout-2026-11-06/ops-rebuilt/backend/modules/lowcode/dynamicmodule/dynamic_module_service_test.go:1056) seeds four active translations and expects all four to enter observation. Its [workspace helper](/D:/workspace/go/pantheon-platform/audit-artifacts/task-closeout-2026-11-06/ops-rebuilt/backend/modules/lowcode/dynamicmodule/dynamic_module_service_test.go:1384) creates a temporary workspace, but does not set `PANTHEON_WORKSPACE_ROOT`.

   Source removal uses `DynamicModuleService.workspaceRoot`; the subsequent [i18n lifecycle call](/D:/workspace/go/pantheon-platform/audit-artifacts/task-closeout-2026-11-06/ops-rebuilt/backend/modules/lowcode/dynamicmodule/dynamic_module_lifecycle.go:311) constructs an i18n service without passing that root. The [scanner](/D:/workspace/go/pantheon-platform/audit-artifacts/task-closeout-2026-11-06/ops-rebuilt/backend/modules/system/i18n/i18n_helper.go:1249) therefore falls back to the actual consumer checkout.

   In that checkout, `business.cmdb.host.title` remains referenced by [CmdbHostList.tsx](/D:/workspace/go/pantheon-platform/audit-artifacts/task-closeout-2026-11-06/ops-rebuilt/frontend/src/modules/business/cmdb/host/CmdbHostList.tsx:521) and [CMDB seed code](/D:/workspace/go/pantheon-platform/audit-artifacts/task-closeout-2026-11-06/ops-rebuilt/backend/modules/business/cmdb/module.go:307). The [lifecycle implementation](/D:/workspace/go/pantheon-platform/audit-artifacts/task-closeout-2026-11-06/ops-rebuilt/backend/modules/system/i18n/i18n_helper.go:382) excludes referenced keys from unused-key transitions. Consequently:

   - `business.cmdb.title`: two rows enter observing.
   - `business.cmdb.host.title`: two rows remain active.
   - `ObservedRows`: **2**, matching the [failure log](/D:/workspace/go/pantheon-platform/pantheon-base/.harness/evidence/2026-11-05-base-freeze-release/retry3-race-success.log:6875).

   Read-only scanning found neither key referenced in Base or the official release’s eligible source files. Test, lifecycle, scanner and database-helper bytes are identical across Base, official release, rebuilt consumer and Ops. The official `repo.tar` also matches the consumer test and scanner bytes. This is **not consumer drift**.

   Smoke cleanup is not the causal explanation: [testmysql.Open](/D:/workspace/go/pantheon-platform/audit-artifacts/task-closeout-2026-11-06/ops-rebuilt/backend/pkg/testmysql/mysql.go:103) creates a separate database per test, and purge removes source from the temporary workspace. The persistent consumer references fully explain the result.

   **Bounded repair:** in Base, set `t.Setenv("PANTHEON_WORKSPACE_ROOT", workspaceRoot)` immediately after this test creates its workspace. Keep the four-row expectation and lifecycle assertions. Add a companion fixture with a surviving external reference and verify that its translations remain active. Do not force referenced keys into observation or lower the expectation to two.

   **Verification:** run both focused fixtures in Base and the rebuilt consumer, then repeat the full CGO race command with mandatory MySQL and dedicated Redis.

2. **Browser smoke: the runtime’s dynamic-module guard rejected preview generation.**

   The original `trace.zip` records:

   - `1-trace.network:318`: `POST http://127.0.0.1:24573/api/v1/lowcode/generator/preview-files` → **403**.
   - Response resource `resources/6e5e623b422a097f6aa8e209ac59c9bc37350a30.json`:
     ```json
     { "code": 403, "data": null, "message": "module.dynamic.disabled" }
     ```
   - `0-trace.network:3`: preliminary module cleanup against API **24480** returned the same response.
   - Datasource and table-list requests succeeded; the datasource response identified `closeout_runtime`.

   The backend independently records the [preview request’s 403](/D:/workspace/go/pantheon-platform/audit-artifacts/task-closeout-2026-11-06/services/backend-ready-stdout.log:17107). The route explicitly applies [DynamicModuleEnvGuard](/D:/workspace/go/pantheon-platform/audit-artifacts/task-closeout-2026-11-06/ops-rebuilt/backend/modules/lowcode/generator/module.go:43), whose [implementation](/D:/workspace/go/pantheon-platform/audit-artifacts/task-closeout-2026-11-06/ops-rebuilt/backend/modules/lowcode/dynamicmodule/module.go:18) reads `PANTHEON_ENABLE_DYNAMIC_MODULES` and otherwise defaults according to production detection.

   [ModuleWizard.handleGenerate](/D:/workspace/go/pantheon-platform/audit-artifacts/task-closeout-2026-11-06/ops-rebuilt/frontend/src/modules/lowcode/generator/pages/ModuleWizard.tsx:999) advances to the generated-files step only after preview succeeds. The 403 explains why `共生成 10 个文件` never appears. Registration at test line 162 was never reached; **no generated-file count was returned to assess**.

   This was not backend readiness: [startup evidence](/D:/workspace/go/pantheon-platform/audit-artifacts/task-closeout-2026-11-06/services/backend-ready-stderr.log:2) confirms MySQL, migrations, Redis and listening on 24480 before the request. Relevant frontend/backend files match the release. Dependency junctions and the absent root `node_modules` cannot explain this application-level denial.

   **Bounded repair:** configure the dedicated, non-production generation-smoke backend with explicit `PANTHEON_ENABLE_DYNAMIC_MODULES=true`, retaining required secrets, Redis and authorization controls. Keep production defaults and guards intact. The captured artifacts establish the effective disabled guard; they do not distinguish an explicit false override from the production default.

   **Verification:** repeat the unchanged governance smoke, capture preview HTTP 200 with ten files, then verify registration, generated artifacts, readiness and purge. Treat the current result as a failed smoke precondition requiring correction and rerun—not a waived environment gap.

There is also a separate runtime defect: [backend-ready-stderr.log:15](/D:/workspace/go/pantheon-platform/audit-artifacts/task-closeout-2026-11-06/services/backend-ready-stderr.log:15) reports missing `closeout_runtime.biz_deploy_task_attempt`. It did not cause the guarded preview denial, but must remain recorded as a real defect requiring separate diagnosis.

The original error-context and trace were read. The trace subsequently disappeared before screenshot inspection completed; no visual-polish claim or repair verification is made.
