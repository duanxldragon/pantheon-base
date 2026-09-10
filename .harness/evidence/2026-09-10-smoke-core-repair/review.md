# Review Artifact — smoke-core repair + 2 product defect fixes (#301)

- **Scope**: `frontend/tests/smoke-core/**` (7 specs + shared fixtures),
  `.github/workflows/smoke-core.yml`, `frontend/src/api/file.ts`,
  `backend/modules/system/iam/role/role_service.go` + pure regression test,
  `frontend/tests/smoke-core/README.md`, `.harness/CORE_SMOKE_TRIAGE.md`.
- **Change type**: test repair (stale assertions → current UI truth), gate
  reclassification (report-only), two defect fixes (frontend download headers,
  backend role-list nil-slice normalization).
- **Logic change**: backend change is contract normalization only (empty
  collections serialize as `[]` instead of `null`), matching the existing
  export path; no behavioral change for non-empty roles.
- **Contracts / permissions / DB / i18n / menu**: no permission, menu, seed,
  or i18n changes. Frontend `RoleRow` interface unchanged and now holds for
  empty roles.
- **Reviewer notes**: The two product defects were discovered by the repaired
  tests themselves (export 403, role edit crash) and are exactly the class of
  regression this suite exists to catch — supporting the report-only →
  blocking ratchet path. Backend fix is the minimal chokepoint
  (`buildRoleListItems`) with a regression test; frontend fix mirrors
  interceptor behavior with the shared clientSession helpers.
- **Risk classification**: high-risk per repo rules (system/iam contract +
  shared download path). Mitigations: pure-function regression test,
  smoke-core 23/3/0 twice, full 13-phase regression 279 passed / 0 failed,
  build green.
- **Follow-up**: rewrite `business-generated-basic.spec.ts` when lowcode
  environment is available; evaluate smoke-core promotion to blocking after
  multiple green rounds.

## Machine Readable

```json
{
  "taskId": "2026-09-10-smoke-core-repair",
  "verdict": "approved",
  "findings": [],
  "linkage": {
    "taskManifest": ".harness/tasks/2026-09-10-smoke-core-repair/manifest.json",
    "evidence": ".harness/evidence/2026-09-10-smoke-core-repair/commands.json",
    "reviewFile": ".harness/evidence/2026-09-10-smoke-core-repair/review.md",
    "changeRef": "none",
    "planRefs": []
  }
}
```
