# Review — 2026-10-23 IAM residual closeout

## Verdict

Approve for PR. The three code paths named in the packet are fixed at the right layer, the tests
exercise the changed branches against real MySQL, and no schema/route/permission/menu contract
moved.

## Scope review

- `system/iam/user`: import lookups are tenant-scoped; imported users are stamped from the request
  context and get a membership in the same transaction; CreateUser shapes duplicate-key errors.
- `system/iam/role`: Create/Update shape duplicate-key errors; bootstrap backfill joins the owning
  role, deduplicates and inserts idempotently.
- `system/iam/tenant`: permission/menu grants use `ON CONFLICT DO NOTHING` instead of
  read-then-insert.
- No changes outside `system/iam`, tests, and the task/evidence packet.

## Correctness review

- **Tenant source of truth**: `TenantID: s.tenantOwnerID()` reads middleware-resolved context; the
  import CSV has no tenant column to trust. `ensureTenantMembership` is called with
  `user.TenantID`, so the row and the membership agree by construction.
- **Scope helpers**: `s.scoped(s.db.Table("system_post"))` and friends qualify the tenant column
  with the statement table, so the predicates are unambiguous in single-table queries.
- **Duplicate-key seam**: `database.IsDuplicateKey` recognizes `gorm.ErrDuplicatedKey` and MySQL
  1062; mapping happens only after the transaction failed, so a rollback has already removed any
  partial role/menu/permission writes.
- **Grant idempotency**: the composite keys are `(tenant_id, role_id, permission_key)` and
  `(tenant_id, role_id, menu_id)`; `OnConflict{DoNothing:true}` makes the index the arbiter. The
  read remains as a fast path but is no longer correctness-relevant.
- **Backfill**: the explicit `system_role.deleted_at IS NULL` join predicate is necessary because
  GORM does not apply the soft-delete scope to a raw JOIN. Deduplication happens before the batch
  so the insert does not rely on `ON DUPLICATE KEY UPDATE` for its own input.
- **R5**: notes were not rewritten. The stale sentence is corrected forward, consistent with the
  repository's treatment of published release material.

## Evidence review

- New tests pass individually and as part of the three IAM packages against real MySQL
  (`PANTHEON_TEST_DSN_REQUIRED=true`).
- Coverprofiles show the duplicate-key branch bodies executed in the race tests, so the tests would
  fail on the previous 500 behaviour.
- Full-suite and race results are recorded in `commands.json`; any environment limitation is
  explicit rather than silently skipped.

## Residual risk

- Concurrent same-tenant provisioning remains outside this packet: roles are still created with a
  read-then-insert, so two simultaneous `ProvisionTenant` calls for one tenant can still conflict
  before they reach the grant code. Normal provisioning is serialized per tenant creation; repair
  runs are sequential.
- `replaceRolePermissions` and `replaceUserRoles` still delete-then-insert. They do not pre-check
  and their inputs are deduplicated, so the failure mode is limited to a concurrent writer on the
  same role/user, which is not a supported workflow.
- The published v0.17.3 notes keep the old residual sentence by design; the correction is in this
  packet.


## Machine Readable

```json
{
  "taskId": "2026-10-23-iam-residual-closeout",
  "verdict": "approved",
  "verdictRationale": "Approve for PR: the three named code paths are fixed at the right layer and tested against real MySQL.",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-23-iam-residual-closeout/manifest.json",
    "evidence": ".harness/evidence/2026-10-23-iam-residual-closeout/commands.json",
    "reviewFile": ".harness/evidence/2026-10-23-iam-residual-closeout/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-23-iam-residual-closeout.task.md"
    ]
  }
}
```

> This block was backfilled on 2026-10-26 during the governance-schema repair round. It restates the verdict already written above in machine-readable form and links the artifacts that existed for this task; no conclusion, finding or verification claim was added, removed or reworded. The prose remains authoritative.
