---
title: Isolate static and parameter business routes in authorization
doc_type: Remediation
layer: platform
linked_contracts:
  - docs/contracts/SYSTEM_AUTH_CONTRACT.md
status: Active
updated_at: 2026-11-24
---

# Task Packet: 2026-11-24-business-route-static-guard

## Goal

Close the shared route-matching gap that blocks business detail routes: a stored policy using a
`:param` segment must not authorise a static sibling route of the same method, and a static policy
must not authorise a parameter route. Keep explicit `*` wildcard grants working, and reuse the same
predicate in permission-workbench coverage and role API policy synchronization.

## Priority

P1; shared authorization contract and the upstream blocker for Ops T04 runtime tenant isolation.

## Primary Layer

platform

## Dependency Layers

- system/iam
- system/auth

## Workspace Context

- Target Repository: pantheon-base
- Repository Role: foundation-source
- Upstream Dependencies: pantheon-harness
- Downstream Consumers: pantheon-ops
- Sync Expectation: required
- Release Requirement: foundation-release
- Downstream Sync Note: Ops may register `GET /hosts/:id` and equivalent detail routes only after
  consuming a foundation release that contains this guard.

## Contract Anchors

- `docs/contracts/SYSTEM_AUTH_CONTRACT.md`
- `docs/harness/VERIFICATION_EVIDENCE_SPEC.md`
- `docs/harness/REVIEW_LOOP_SPEC.md`

## Harness Profile

- Template: admin-platform
- Overlay: pantheon-base
- Quality Profile: auth-security
- Portable Failure Class: authorization-boundary-gap
- Owner Layer: foundation-source
- Ratchet Decision: sensor-added
- Coverage Dimensions:
  - behaviour
  - maintainability
  - architecture-fitness

## Scope

### In

- Structural route/policy predicate in `backend/pkg/permissionroutes`.
- Business authorization uses the registered route template with a dedicated Casbin matcher.
- Permission-workbench coverage and role policy synchronization reuse the predicate.
- Unit, in-memory Casbin and real-MySQL regressions for detail/export siblings and wildcard grants.
- Contract text in `SYSTEM_AUTH_CONTRACT` (zh/en).

### Out

- System-domain Casbin matcher changes.
- Official foundation release and Ops lock consumption.
- Ops detail-route registration.
- Any change to UI, menus, i18n or seeds.

## Structural Scope

- Affected Subgraph: business middleware `c.FullPath()` -> `businessauth.Action.RouteTemplate` -> `ReadBusinessPolicy` dedicated enforcer -> `businessRouteCovers` -> role binding grant/deny.
- Boundary Crossings: HTTP request -> authorization decision; Base foundation -> Ops consumer.
- Risk Nodes: raw path vs template object, coverage false-positive, role policy sync de-duplication.
- Graph Focus: cycle, hub, call-depth and sensitive-flow checks through actual source/import/call-body review.

## Expected Files

### Create

- backend/pkg/permissionroutes/cover.go
- backend/pkg/permissionroutes/cover_test.go
- .harness/tasks/2026-11-24-business-route-static-guard/manifest.json
- .harness/tasks/2026-11-24-business-route-static-guard/plan.md
- .harness/evidence/2026-11-24-business-route-static-guard/commands.json
- .harness/evidence/2026-11-24-business-route-static-guard/summary.md
- .harness/evidence/2026-11-24-business-route-static-guard/review.md
- docs/harness/tasks/2026-11-24-business-route-static-guard.task.md

### Modify

- backend/pkg/database/business_policy.go
- backend/pkg/database/business_policy_test.go
- backend/modules/system/iam/permission/permission_workbench.go
- backend/modules/system/iam/role/role_policy_sync.go
- docs/contracts/SYSTEM_AUTH_CONTRACT.md
- docs/contracts/SYSTEM_AUTH_CONTRACT.en.md

### Do Not Touch

- The process-wide system Casbin model and middleware.
- Ops repository files, seeds, menus, UI or migrations.
- Release version files and published tags/assets.

## Assumptions and Open Questions

- Confirmed Facts: business middleware supplies `c.FullPath()` as `Action.RouteTemplate`; registered
  business policies store those templates.
- Working Assumptions: a trailing `*` segment is the only explicit wildcard form in business policies.
- Open Questions: none that block implementation.

## Minimum Viable Approach

Add one pure predicate, one dedicated model matcher and two call-site substitutions; no new package,
dependency or schema.

## Implementation Notes

- `permissionroutes` stays a leaf package so `database` and IAM packages keep their dependency direction.
- The dedicated business model changes only the object matcher; subject, action, effect and `g` are identical.
- Coverage and sync must share `Covers` or they will disagree with enforcement.

## Method Readiness

- Consumer-Specific Controls: Ops detail-route registration waits for a foundation release.
- Required Sensors: matcher table, in-memory Casbin regression, real-MySQL stored-policy regression.
- Required Evidence: actual commands, negative detail/export cases and wildcard positive case.
- Minimal Complexity Rung: reuse the existing route registry and Casbin adapter.
- Ratchet Decision: sensor-added through the two sibling regressions.
- Deferred Code Issues: system-domain matcher semantics are intentionally unchanged.

## Execution Roles

- Implementer Posture: primary Claude Code session owns scoped code and tests.
- Reviewer Posture: self-review with explicit independent-review gap because Codex is unavailable.

## Verification Plan

- `go build ./...`
- `go test ./pkg/permissionroutes/ ./pkg/database/`
- `PANTHEON_TEST_DSN_REQUIRED=true go test ./modules/system/iam/permission/ ./modules/system/iam/role/ ./modules/system/iam/tenant/ ./internal/middleware/ ./modules/auth/login/ ./pkg/database/ ./pkg/permissionroutes/`
- `node ../pantheon-harness/scripts/harness/check-task-packet.mjs --root .`
- `node ../pantheon-harness/scripts/harness/check-evidence.mjs --root .`
- `node ../pantheon-harness/scripts/harness/check-review.mjs --root .`
- `npm run check:docs-frontmatter`

Planned commands are not current verification results. Actual exits and source limits belong in commands.json.

## Success Criteria

- Detail and static sibling routes deny each other under the business enforcer.
- Trailing wildcard still grants covered routes.
- The real-MySQL stored-policy path exercises the predicate.
- Build and affected suites pass with required MySQL.
- Release and Ops consumption are recorded gaps, not implied completion.

## Context Strategy

- Entry Sources: AGENTS.md, auth contract, permission registry, business policy and middleware.
- Retrieval Order: contract -> registry -> enforcement path -> regressions.
- Retrieval Helpers: CodeGraph for affected symbols; actual source for edited files.
- Promotion Target: matcher and stored-policy regression tests.
- Sensitive Context: no credentials, DSNs or tokens in tracked evidence.

## Linkage

- Task ID: 2026-11-24-business-route-static-guard
- Task Manifest: .harness/tasks/2026-11-24-business-route-static-guard/manifest.json
- Evidence Directory: .harness/evidence/2026-11-24-business-route-static-guard/
- Review File: .harness/evidence/2026-11-24-business-route-static-guard/review.md
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: .harness/tasks/2026-11-24-business-route-static-guard/plan.md

## Evidence Required

- Matcher table output for detail/export sibling cases and wildcard grants.
- In-memory Casbin and real-MySQL stored-policy command exits.
- Affected package suite exits with MySQL required.
- Self-review with explicit independent-review gap.

## Human Gates

Official foundation release requires maintainer decision; Ops lock consumption follows that release.
Production mutation, gate policy changes and published-asset edits remain outside scope.

## Completion Checklist

- [x] Layer and boundary declared
- [x] Quality profile and contract anchors declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [ ] Foundation release cut
- [ ] Ops detail routes registered and runtime isolation verified

## Status

Source and local verification complete on `fix/business-route-static-guard`. Foundation release and
downstream consumption remain open, so this task is `in-progress`, not closed.
