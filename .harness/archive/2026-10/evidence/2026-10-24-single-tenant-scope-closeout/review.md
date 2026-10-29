# Review — 2026-10-24 单租户（compat）租户作用域收口

Reviewed against `main` in the working tree (branch cut for this change). The diff is 21 backend
files plus one new dept regression test and the task/evidence packet; no migration, workflow,
frontend or release asset is touched.

## Scope audit

- `git diff --stat` (code only): 21 files, 203 insertions, 64 deletions before the packet; the
  largest change is `dict_service.go` (binding + 4 reorder call sites) and `post_service.go`
  (path map + tenant stamping).
- `git diff --name-only | grep -E "migrations|\\.github/workflows|frontend/src"` returns nothing.
- Schema stays at 29. Routes, permission codes, menu seeds and error envelopes are unchanged.
- The new `dept_compat_scope_test.go` is the only new Go file; all other files are edits.
- The two tenant-picker PNGs and `frontend/src/modules/generated/system.ts`, which browser suites
  rewrite, were restored to HEAD before packaging.

## Claim audit

| Claim | Evidence |
|---|---|
| compat is non-nil and was being discarded | `tenant.Resolve` returns `{TenantID: 0, Mode: ModeCompat}`; `ResolveForCanary("multi", ...)` tests cover resolution. Six `WithTenantContext` implementations changed from `ctx == nil || !ctx.IsMulti()` to `ctx == nil`. |
| Dict delete is fixed in single-tenant mode | `TestTenantCanary_CompatPinsGlobalScope` (compat hides tenant rows, creates/deletes same-code dict) and the 26-test browser config/org suite both pass against real MySQL and the real UI. |
| Dept delete is fixed in single-tenant mode | `TestDeptCompatScopePinsGlobalPopulation` (foreign root invisible, foreign delete not found, own dept create/delete) plus the dept browser smoke. |
| No cross-tenant leak in either direction | `TestTenantCanary_*` (same code coexistence, cross-tenant read, ID tampering, global rows not leaking, export filtering, option cache isolation) and `TestTenantCanary_ContextForgeryDenied` pass. |
| Reorder is not an IDOR | `TestTenantCanary_ReorderContained`: tenant B cannot reorder A's item; compat cannot reorder a tenant item; own reorder still works. |
| Dept import stays in the caller's tree | `TestDeptImportCompatStaysInGlobalTree`: imported row has `tenant_id = 0` and parent = tenant-0 root even when a tenant root has the same name. |
| Post import stamps the request tenant | `TestPostService_ImportPostsStampsRequestTenant`: `TenantID = 77`, `DeptID` resolves to tenant 77's dept. |
| One orphan ancestor cannot block import/export | `TestBuildDeptPathMaps_OrphanParentIsPathBoundary`: no error, healthy path resolves, orphan becomes its own root. |
| Generator failures are environmental | Manual `frontend/scripts/export-generated-module.mjs` exits 0 with the same schema; `exec.LookPath("node")` returns "not found" in the server launcher env; setting `PANTHEON_NODE_BIN`/`PANTHEON_WORKSPACE_ROOT` makes 3/5 specs pass and the other 2 pass with their `--setup` scripts. |
| The change is green | gofmt/build/vet clean; targeted Go packages pass on real MySQL with 0 FAIL/0 SKIP; API smoke 11/11; system browser 26/26 + 63/63; generated suites 3/3 + 1/1 + 1/1. |

## Findings

No blocking finding. Residual/environment items carried forward:

- **R1 (P3, environment)**: the Go server cannot resolve `node` from Git Bash on Windows
  (`exec.LookPath` fails because PATH contains `/d/nodejs`). The documented fix is to start the
  server with `PANTHEON_NODE_BIN` (absolute) and `PANTHEON_WORKSPACE_ROOT`. No code change was made;
  hardening this would require an OS-specific fallback and is out of scope.
- **R2 (P3, environment)**: seven multi-tenant-only browser specs are not applicable under compat
  and fail with 401/missing switcher. They belong to the multi-tenant acceptance run.
- **R3 (P3, test orchestration)**: `run-smoke-suite.mjs` exits 0 even when Playwright reports
  failures; results were parsed from the suite output. `business-generated-basic` and its chain skip
  when generated modules are 0.
- **R4 (P3, dev data)**: the local database had one orphan dept row (id 235). It was repaired with a
  bounded UPDATE and the code now tolerates the shape; other environments may still carry similar
  residue but will not fail imports.
- **R5 (P3, known design)**: `system_dict_item` still has no unique key; reorder is serialized by
  the existing transaction and tenant scope, and concurrent ordering is not a supported operation.

## Machine Readable

```json
{
  "taskId": "2026-10-24-single-tenant-scope-closeout",
  "verdict": "approved",
  "structuralReview": {
    "affectedSubgraph": [
      "system/config/dict",
      "system/org/dept",
      "system/org/post",
      "system/iam/user",
      "system/iam/role",
      "system/iam/permission",
      "pkg/impexp"
    ],
    "checks": ["cycle", "hub", "sensitive-flow"],
    "findings": [],
    "notes": "The change only tightens existing read/write filters to the resolved tenant context and reuses the existing tenantScope/scoped helpers. No new cross-module edge is introduced: pkg/impexp stays a leaf helper (its only change is treating a missing parent as a path boundary), and the services keep calling the same tenant package. Scoping cannot create a lock-order cycle because no new locks are taken; reorder swaps remain inside the existing transaction."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-24-single-tenant-scope-closeout/manifest.json",
    "evidence": ".harness/evidence/2026-10-24-single-tenant-scope-closeout/commands.json",
    "reviewFile": ".harness/evidence/2026-10-24-single-tenant-scope-closeout/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/contracts/TENANT_CONTRACT_V1.md",
      ".harness/evidence/2026-10-23-iam-race-closeout/review.md"
    ]
  }
}
```
