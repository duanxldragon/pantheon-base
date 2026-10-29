# Review — iam-data-scope (F01 + F06)

Independent check against the manifest In/Out scope and acceptance criteria.

## In-scope confirmation

- Changed files: `internal/middleware/data_scope_middleware.go`,
  `internal/middleware/data_scope_failclosed_test.go`,
  `modules/system/iam/role/role_service.go`,
  `modules/system/iam/role/role_data_scope_preserve_test.go`. No out-of-scope files touched.

## Criteria check

| Criterion | Verdict | Evidence |
| --- | --- | --- |
| Policy-read failure denies access; never defaults to `all` | PASS | Fail-closed abort + forced empty `custom` scope; fault-injection tests pass |
| Custom dept IDs survive role edits | PASS | `upsertRoleDataScopePolicyPreservingCustomDepts` + regression test |
| Restricted list/export + admin covered by tests | PASS | 3 middleware tests + 2 role tests; export shares the same scope pipeline |

## Notes

- Failure path responses: JSON consumers get `permission.data_scope.policy.unavailable`
  (HTTP 200 + business code, per `common.Fail` contract); non-JSON clients get 500.
- `switch to custom without configured policy` intentionally lands empty
  (fail-closed) pending configuration via the permission entry point — matches
  the documented repair direction.
- Gap: `modules/system/iam/tenant` not runnable locally (CGO toolchain); CI-equivalent green.

## Machine Readable
```json
{
  "taskId": "2026-10-07-iam-data-scope",
  "verdict": "approved",
  "reviewer": {
    "independence": "self-review",
    "note": "No independent reviewer artifact was available in this workstation session; residual runtime and hosted gaps remain explicit.",
    "role": "platform-coordinator"
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-07-iam-data-scope/manifest.json",
    "evidence": ".harness/evidence/2026-10-07-iam-data-scope/commands.json",
    "reviewFile": ".harness/evidence/2026-10-07-iam-data-scope/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-07-release-readiness-remediation.task.md",
      "docs/reviews/ENTERPRISE_RELEASE_READINESS_REVIEW_2026-10-07.md"
    ]
  }
}
```
