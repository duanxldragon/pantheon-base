---
title: Pantheon Base Task Packet Template
doc_type: Acceptance
layer: platform
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-07-08
---

# Task Packet: 2026-07-08-base-upload-default-types-release-sync

## Goal

Validate the base -> release -> ops foundation-release flow with a small shared upload change, then confirm ops consumes the new base release and remains aligned.

## Primary Layer

system/config

## Dependency Layers

- platform shared upload runtime
- pantheon-ops foundation-release consumer

## Harness Profile

- Template: admin-platform
- Overlay: pantheon-base
- Quality Profile: ci-workflow
- Portable Failure Class: task-boundary-gap
- Owner Layer: consumer-repository
- Coverage Dimensions:
  - behaviour
  - maintainability
  - architecture-fitness
  - runtime-quality
  - method-health

## Contract Anchors

- `pantheon-base/AGENTS.md`
- `pantheon-base/DESIGN.md`
- `pantheon-base/docs/README.md`
- `pantheon-base/docs/designs/DICT_AND_SETTING_DESIGN.md`
- `pantheon-base/docs/designs/UPLOAD_AND_STORAGE_DESIGN.md`
- `pantheon-base/docs/acceptances/AGENT_EXECUTION_CHECKLIST.md`

## Scope

### In

- expand the shared default upload type whitelist to include `gif` and `webp`
- update upload setting migration so legacy seeded values upgrade to the new default whitelist
- add or update unit coverage for the default whitelist and migration path
- cut a new base foundation release from the modified base tree
- let ops consume the new base release and re-run inheritance / sync validation
- keep base initialization seeds aligned with the new default upload whitelist

### Out

- any ops business module changes
- PR and branch cleanup
- schema or permission changes
- UI redesign work

## Assumptions and Open Questions

- Confirmed Facts: ops currently locks to `base-v0.8.10` and the local release mechanism already exists in both repos
- Working Assumptions: the smallest meaningful shared change is to align the upload default whitelist with the already-accepted frontend upload formats
- Open Questions: none

## Minimum Viable Approach

- change only the shared upload default whitelist and its migration seed path
- use existing Go tests to prove the new defaults and upgrade behavior
- use the existing foundation-release scripts rather than inventing a new publish path

## Success Criteria

- base tests prove the new upload defaults and legacy migration behavior
- a new foundation release directory / bundle is generated from the base change
- ops updates its lock to the new release and `check:inheritance` / `check:base-sync` stay green
- the result clearly records the base commit, release version, synchronized paths, and any deliberate gaps

## Structural Scope

- Affected Subgraph: `system/config setting seeds -> upload runtime config -> shared upload whitelist`
- Boundary Crossings: `system/config -> backend/pkg/upload -> base -> ops`
- Risk Nodes: `upload.allowed_types` migration and release consumer sync
- Graph Focus: `sensitive-input-flow`

## Expected Files

### Create

- `docs/harness/tasks/2026-07-08-base-upload-default-types-release-sync.task.md`
- `.harness/tasks/2026-07-08-base-upload-default-types-release-sync/manifest.json`
- `.harness/evidence/2026-07-08-base-upload-default-types-release-sync/commands.json`
- `.harness/evidence/2026-07-08-base-upload-default-types-release-sync/summary.md`
- `.harness/evidence/2026-07-08-base-upload-default-types-release-sync/review.md`

### Modify

- `backend/pkg/upload/service.go`
- `backend/pkg/upload/service_test.go`
- `backend/modules/system/config/setting/setting_service.go`
- `backend/modules/system/config/setting/setting_service_test.go`
- `backend/modules/system/config/setting/setting_seed.go`
- `backend/modules/system/config/setting/seed_data.yaml`
- `database/system_init.sql`

### Do Not Touch

- `pantheon-ops/frontend/tests/smoke/system/system-pages.spec.ts`
- `pantheon-ops/**` until the release is consumed

## Implementation Notes

- Keep the change surgical: align the shared upload whitelist and preserve existing local/S3 behavior.
- Mirror the new whitelist in the legacy migration so old seeds are upgraded consistently.
- Do not broaden the change into permissions, menu, auth, or UI work.

## Method Readiness

- Consumer-Specific Controls: `base foundation-release scripts` | `ops inheritance checks`
- Required Sensors: command | review
- Required Evidence: `go test ./backend/pkg/upload ./backend/modules/system/config/setting`, release manifest/bundle artifacts, ops inheritance and base-sync checks
- Minimal Complexity Rung: minimum-new-code
- Ratchet Decision: registry-only
- Deferred Code Issues: none

## Delivery Governance

- Design Gate: short boundary note
- Development Gate: expected files declared; do-not-touch declared
- QA Acceptance Gate: command and release artifact evidence
- GitHub Governance Gate: not-applicable

## Execution Roles

- Implementer Posture: implementer
- Reviewer Posture: mechanical

## Stop Points

- release cut failure
- ops sync failure
- unexpected scope expansion beyond shared upload defaults

## State Plan

- Checkpoint Expectation: `.harness/evidence/2026-07-08-base-upload-default-types-release-sync/summary.md`
- Resume Artifacts: `.harness/evidence/2026-07-08-base-upload-default-types-release-sync/commands.json`

## Verification Plan

### Backend

- `go test ./backend/pkg/upload ./backend/modules/system/config/setting`

### Frontend

- `none`

### Browser / Smoke

- `npm run check:inheritance`
- `npm run check:base-sync`
- `npm run check:base-sync:workspace`

### Runtime Evidence

- release artifact paths and lock update summary

## Linkage

- Task ID: `2026-07-08-base-upload-default-types-release-sync`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Evidence Directory: `.harness/evidence/2026-07-08-base-upload-default-types-release-sync/`
- Review File: `.harness/evidence/2026-07-08-base-upload-default-types-release-sync/review.md`

## Evidence Required

- command result summary
- release artifact summary
- review summary

## Human Gates

- none

## Sync expectation

- 本轮先改 base，再 cut foundation release，再让 ops 消费新 release
- 只记录共享路径同步，不碰 ops business overlay

## Completion Checklist

- [ ] Layer and boundary declared
- [ ] Contract anchors read
- [ ] Verification run or exception recorded
- [ ] Evidence saved or summarized
- [ ] Review completed
