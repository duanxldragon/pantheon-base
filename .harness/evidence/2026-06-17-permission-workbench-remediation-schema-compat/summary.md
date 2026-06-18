# Verification Summary: 2026-06-17-permission-workbench-remediation-schema-compat

## Scope

- Primary layer: `system/iam`
- Changed files:
  - `backend/modules/system/iam/permission/permission_workbench_remediation_model.go`
  - `backend/modules/system/iam/permission/permission_service_test.go`
  - `backend/pkg/database/migrate.go`
  - `backend/pkg/database/migrate_test.go`
  - `backend/pkg/database/migrations/000007_permission_workbench_remediation_compat.up.sql`
  - `backend/pkg/database/migrations/000007_permission_workbench_remediation_compat.down.sql`
  - `docs/harness/tasks/2026-06-17-permission-workbench-remediation-schema-compat.task.md`
  - `.harness/evidence/2026-06-17-permission-workbench-remediation-schema-compat/summary.md`
  - `.harness/evidence/2026-06-17-permission-workbench-remediation-schema-compat/commands.json`
  - `.harness/evidence/2026-06-17-permission-workbench-remediation-schema-compat/review.md`
  - `docs/harness/failure-registry.md`

## Commands

| Command | CWD | Result | Notes |
|---|---|---|---|
| `go test ./backend/pkg/database -count=1` | `pantheon-base` | passed | covers current-schema bootstrap alignment, compat migration replay, and runtime write assertions for `permission_workbench_remediation_event` |
| `go test ./backend/modules/system/iam/permission -count=1` | `pantheon-base` | passed | covers versioned remediation table name, governance status aggregation, and permission-workbench service behavior |
| `node scripts/run-smoke-suite.mjs --host 127.0.0.1 --port 5173 --cleanup-fixtures all --config playwright.config.ts -- tests/smoke/system/governance/permission-workbench-remediation-real.spec.ts` | `pantheon-base/frontend` | passed | exercises the real local stack after backend restart; permission workbench governance endpoints read the migrated remediation-event table successfully |
| `node scripts/frontmatter-check.mjs` | `pantheon-base` | passed | docs governance still accepts the new task packet and evidence linkage |
| `node scripts/check-task-packet-template.mjs` | `pantheon-base` | passed | task packet shape remains compatible with repo-local harness checks |

## Graph Checks

- Used CodeGraph: no
- Affected subgraph: `server startup -> bootstrapExistingCurrentSchema -> permission_workbench_remediation_event -> permission workbench governance summary`
- Structural checks: `call-depth`, `hub`
- Findings: none

## Browser Evidence

- `permission-workbench-remediation-real.spec.ts` exercised the governance workflow against `/system/permission`; no screenshot artifact was retained because this packet closed a runtime schema defect, not a UI visual change.

## Known Gaps

- runtime proof is still workstation-local; CI does not yet replay a persisted pre-current database through `bootstrapExistingCurrentSchema`
- compat backfill maps legacy `detail` and `remediated` into the new fields conservatively, so historical rows may read as `legacy`/`unknown` when old data lacked richer semantics

## Completion Status

complete
