---
title: Permission Workbench Remediation Schema Compat Task Packet
doc_type: Acceptance
layer: system/iam
depends_on_layers:
  - platform
status: Approved
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/SYSTEM_IAM_CONTRACT.md
updated_at: 2026-06-17
---

# Task Packet: 2026-06-17-permission-workbench-remediation-schema-compat

## Goal

Align permission-workbench remediation tracking with the versioned remediation table and compat migrations so persisted pre-current databases can boot, migrate, and render governance status without manual schema repair.

## Primary Layer

system/iam

## Dependency Layers

- `platform`

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `permission-policy`
- Portable Failure Class: `static-sensor-gap`
- Owner Layer: `consumer-repository`
- Coverage Dimensions:
  - `behaviour`
  - `architecture-fitness`
  - `runtime-quality`
  - `method-health`

## Contract Anchors

- `pantheon-base/AGENTS.md`
- `pantheon-base/DESIGN.md`
- `pantheon-base/docs/README.md`
- `pantheon-base/docs/contracts/PLATFORM_CONTRACT.md`
- `pantheon-base/docs/contracts/SYSTEM_IAM_CONTRACT.md`
- `pantheon-base/docs/designs/PERMISSION_WORKBENCH_GOVERNANCE_DESIGN.md`
- `pantheon-base/docs/designs/QUALITY_AND_SECURITY_STRATEGY.md`
- `pantheon-base/docs/acceptances/AGENT_EXECUTION_CHECKLIST.md`

## Scope

### In

- point the remediation-event model at the versioned table `permission_workbench_remediation_event`
- extend current-schema bootstrap markers so legacy persisted databases do not get misclassified as fully current
- add an idempotent compat migration for old remediation-event table shapes
- add migration and permission-workbench regression coverage for the runtime schema path
- verify the fix with focused governance smoke against the local persisted database

### Out

- redesigning permission-workbench governance states or remediation semantics
- rewriting unrelated auth, security-header, or platform-preference work already present in the branch
- broad schema cleanup outside `permission_workbench_remediation_event`
- syncing `pantheon-ops`

## Structural Scope

- Affected Subgraph: `server startup -> bootstrapExistingCurrentSchema -> permission_workbench_remediation_event -> permission workbench governance summary`
- Boundary Crossings: `system/iam -> pkg/*`
- Risk Nodes: `migration bootstrap`, `permission workbench governance summary`, `legacy runtime schema`
- Graph Focus: `call-depth | hub-check`

## Expected Files

### Create

- `backend/pkg/database/migrations/000007_permission_workbench_remediation_compat.up.sql`
- `backend/pkg/database/migrations/000007_permission_workbench_remediation_compat.down.sql`
- `docs/harness/tasks/2026-06-17-permission-workbench-remediation-schema-compat.task.md`
- `.harness/evidence/2026-06-17-permission-workbench-remediation-schema-compat/summary.md`
- `.harness/evidence/2026-06-17-permission-workbench-remediation-schema-compat/commands.json`
- `.harness/evidence/2026-06-17-permission-workbench-remediation-schema-compat/review.md`

### Modify

- `backend/modules/system/iam/permission/permission_workbench_remediation_model.go`
- `backend/modules/system/iam/permission/permission_service_test.go`
- `backend/pkg/database/migrate.go`
- `backend/pkg/database/migrate_test.go`
- `docs/harness/failure-registry.md`

### Do Not Touch

- `frontend/src/**`
- `../pantheon-ops/**`
- unrelated auth, middleware, and CI workflow changes already present in the worktree

## Implementation Notes

- The real-world failure was not the table rename itself; it was current-schema bootstrap drift. Existing local databases with the old remediation table shape were classified as current, so versioned startup skipped the compat migration and governance reads later hit missing-column failures.
- The compat migration keeps old `detail` and `remediated` columns intact and only backfills the new fields conservatively when those old columns exist.
- Focused smoke evidence is enough for this packet because there is no new UI surface or visual change; the risk is runtime schema compatibility, not layout regression.

## Method Readiness

- Consumer-Specific Controls: `SYSTEM_IAM` contract, migration regression tests, focused permission-workbench smoke
- Required Sensors: `command`, `review`, `runtime evidence`
- Required Evidence: `command summary`, `smoke result`, `runtime logs`, `review summary`
- Ratchet Decision: `sensor-added`
- Deferred Code Issues: `legacy remediation rows backfill severity/detail into new fields conservatively; historical semantic perfection stays out of scope`

## Delivery Governance

- Design Gate: `short boundary note`
- Development Gate: `expected files declared`
- QA Acceptance Gate: `command`, `runtime`
- GitHub Governance Gate: `runtime-evidence-gate`

## Execution Roles

- Implementer Posture: `implementer`
- Reviewer Posture: `architecture | mechanical`

## Stop Points

- stop before widening migration semantics beyond remediation-event compatibility
- stop before changing permission-workbench API contracts or governance-state definitions

## State Plan

- Checkpoint Expectation: `.harness/evidence/2026-06-17-permission-workbench-remediation-schema-compat/summary.md`
- Resume Artifacts: `docs/harness/tasks/2026-06-17-permission-workbench-remediation-schema-compat.task.md`, `.harness/evidence/2026-06-17-permission-workbench-remediation-schema-compat/summary.md`, `.tmp/pantheon-base-server.stderr.log`

## Verification Plan

### Backend

- `go test ./backend/pkg/database -count=1`
- `go test ./backend/modules/system/iam/permission -count=1`

### Frontend

- `none`

### Browser / Smoke

- `cd frontend && node scripts/run-smoke-suite.mjs --host 127.0.0.1 --port 5173 --cleanup-fixtures all --config playwright.config.ts -- tests/smoke/system/governance/permission-workbench-remediation-real.spec.ts`

### Runtime Evidence

- `focused startup logs proving migration alignment`
- `focused governance smoke against the local persisted database`

## Linkage

- Task ID: `2026-06-17-permission-workbench-remediation-schema-compat`
- Task Manifest: `.harness/tasks/2026-06-17-permission-workbench-remediation-schema-compat/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Evidence Directory: `.harness/evidence/2026-06-17-permission-workbench-remediation-schema-compat/`
- Review File: `.harness/evidence/2026-06-17-permission-workbench-remediation-schema-compat/review.md`

## Evidence Required

- targeted migration and permission-workbench test output
- runtime log summary showing migration-state alignment and successful startup
- focused smoke result proving the permission-workbench remediation path works against the local persisted database
- review summary tied to the same task packet and evidence directory

## Human Gates

- schema or migration semantics outside remediation-event compatibility
- permission-workbench contract changes beyond the current runtime shape fix

## Sync expectation

- only `pantheon-base` changes in this packet
- no `base -> ops` sync is required because the fix is confined to the base-owned runtime migration path

## Completion Checklist

- [ ] Layer and boundary declared
- [ ] Quality profile declared
- [ ] Ratchet decision declared
- [ ] Delivery governance gates declared
- [ ] Contract anchors read
- [ ] Verification run or exception recorded
- [ ] Evidence saved or summarized
- [ ] Review completed
