# Review — `2026-10-27-s3-role-data-scope-model`

Reviewed against the working tree (base `a053805b`). Role package diff:
**7 files, +54 / −75**, shared with the sibling tenant-scope conversion; the
model-specific delta is one deleted struct plus reference rewrites. Every path is
inside the packet's `expectedFiles`; `doNotTouch` (migrations, `permission/**`,
`database/**`) is untouched.

## Reviewer posture, item by item

| Posture item | Reading |
|---|---|
| Drift report compares every column and tag, not just the struct name | `model-diff.md` lists `TableName`, `ID`, `TenantID`, `RoleKey`, `Mode`, `DeptIDs` with full gorm tags; all identical. The only difference was comment wording. |
| No migration or DDL changed | Diff contains no migration path; `doNotTouch` holds. Schema-vs-model deltas (index naming, legacy columns) are recorded as future governance items. |
| Data-scope results unchanged for all five modes | `permission_data_scope.go` is untouched; role only references the same model. Existing permission data-scope tests (including the two-tenant regression) pass. |
| Any checker is deterministic and DB-free | No checker was added; the single authoritative model makes divergence impossible. No new gate to approve. |
| Delete path keeps writing the same tables | `deleteRoleDataScopes` still deletes from `system_role_data_scope` via the shared model and still guards/deletes the legacy `permission_role_data_scope_policy`. Behaviour unchanged. |
| No cycle introduced | `go list -deps ./modules/system/iam/permission` contains 0 role packages; role → permission import direction predates this wave. |

## Decision audit

The packet allowed either “share the model” or “keep the mirror + checker”. The
shared-model branch was chosen because the anti-import premise was already
stale, and the programme's minimal-complexity ladder prefers deleting a
duplicate over gating it. No human-gate exception is needed for deleting the
mirror; no gate script was added.

## Findings

- **P3, schema governance**: the unique-vs-non-unique index naming and legacy
  columns are pre-existing migration/model mismatches. They do not affect this
  change but should be closed by a migration packet; recorded in `model-diff.md`.
- **P3, shared-file attribution**: `role_service.go` carries both S3 waves, so
  per-wave line attribution is approximate; the model delta itself is a deletion
  plus mechanical rewrites.

## Machine Readable

```json
{
  "taskId": "2026-10-27-s3-role-data-scope-model",
  "verdict": "approved",
  "structuralReview": {
    "affectedSubgraph": [
      "backend/modules/system/iam/role/role_service.go",
      "backend/modules/system/iam/permission/permission_data_scope_model.go"
    ],
    "checks": ["cycle", "sensitive-flow"],
    "findings": [
      "P3 schema governance: migration index is non-unique idx_role_data_scope_tenant_role while both models declare unique uk_..., and legacy scope_defs/timestamps are unmapped; pre-existing and unchanged, recorded for a migration packet.",
      "P3 shared-file attribution: role_service.go carries both S3 waves, so per-wave line attribution is approximate; the model delta is one deletion plus mechanical rewrites."
    ],
    "notes": "Investigation-first wave: the two models were diffed field by field, then against the migration history. They were identical, so the mirror was deleted and role now uses permission.PermissionRoleDataScopePolicy - no table, migration, resolution or permission result changed. The delete branch (loop over both policies) and the legacy table write are untouched. Import direction role->permission already existed, and go list -deps proves permission does not depend on role, so no cycle. Verification is build/vet plus role+permission tests and the full 47-package suite; the only gap is that a live schema dump was unavailable locally, so migrations served as the schema source of truth."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-27-s3-role-data-scope-model/manifest.json",
    "evidence": ".harness/evidence/2026-10-27-s3-role-data-scope-model/commands.json",
    "reviewFile": ".harness/evidence/2026-10-27-s3-role-data-scope-model/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-27-codebase-simplification-program.task.md",
      "docs/designs/PERMISSION_MODEL.md"
    ]
  }
}
```
