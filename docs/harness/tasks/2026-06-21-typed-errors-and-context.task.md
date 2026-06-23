---
title: Typed Errors And Context Propagation Task Packet
doc_type: Acceptance
layer: platform
depends_on_layers:
  - system/auth
  - system/iam
  - system/org
  - system/config
status: Approved
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-06-23
---

# Task Packet: 2026-06-21-typed-errors-and-context

## Goal

Establish typed error sentinels and request-context propagation on the core HTTP request path so handlers, services, and persistence boundaries can classify failures and respect cancellation or timeout signals consistently.

## Primary Layer

platform

## Dependency Layers

- `system/auth`
- `system/iam`
- `system/org`
- `system/config`

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `platform-correctness`
- Portable Failure Class: `architecture-drift`
- Owner Layer: `consumer-repository`
- Coverage Dimensions:
  - behaviour
  - maintainability
  - architecture-fitness
  - runtime-quality
  - method-health

## Contract Anchors

- `AGENTS.md`
- `DESIGN.md`
- `docs/README.md`
- `docs/contracts/PLATFORM_CONTRACT.md`
- `docs/designs/QUALITY_AND_SECURITY_STRATEGY.md`
- `backend/pkg/common/error.go`
- `backend/internal/middleware/request_context_middleware.go`
- `backend/cmd/server/main.go`

## Scope

### In

- define and use typed common or module-local error sentinels so callers can rely on `errors.Is`
- propagate `c.Request.Context()` and timeout-wrapped request contexts from middleware through selected handler, service, and database boundaries
- roll the change out incrementally, starting with auth and high-churn system modules rather than forcing an all-package rewrite in one cut

### Out

- redesigning the full user-facing error taxonomy or i18n contract in one pass
- converting every background job, async worker, or helper package to request-bound contexts
- broad service API redesign beyond the context-first or typed-error boundary

## Assumptions and Open Questions

- Confirmed Facts: by 2026-06-23 `backend/pkg/common/error.go` already carried shared typed errors and `RequestContextMiddleware` already wrapped requests with a timeout, which confirms the historical direction of this task.
- Working Assumptions: the task packet should capture the intended cross-cutting migration boundary while acknowledging that service-level propagation can land incrementally by module.
- Open Questions: `none`

## Expected Files

### Create

- `backend/modules/auth/errors.go`
- `backend/modules/system/iam/user/errors.go`
- `backend/modules/system/iam/role/errors.go`
- `backend/modules/system/org/dept/errors.go`
- `docs/harness/tasks/2026-06-21-typed-errors-and-context.task.md`
- `.harness/evidence/2026-06-21-typed-errors-and-context/summary.md`
- `.harness/evidence/2026-06-21-typed-errors-and-context/commands.json`
- `.harness/evidence/2026-06-21-typed-errors-and-context/review.md`

### Modify

- `backend/pkg/common/error.go`
- `backend/internal/middleware/request_context_middleware.go`
- `backend/modules/auth/**/*.go`
- `backend/modules/system/iam/user/user_service.go`
- `backend/modules/system/iam/role/role_service.go`
- `backend/modules/system/org/dept/dept_service.go`
- `backend/modules/system/config/setting/**/*.go`

### Do Not Touch

- `frontend/**`
- `../pantheon-ops/**`
- unrelated code-generation or deployment automation

## Implementation Notes

- Shared sentinels belong in `backend/pkg/common/error.go`; module-local error keys stay close to the domain service that emits them.
- Request context should enter once in middleware and then flow through handler and persistence boundaries with `WithContext` rather than ad hoc background contexts.
- The safe rollout is staged: tighten the core request path first, then expand into less central modules only when the signature churn is justified.

## Minimum Viable Approach

- Selected Rung: `stdlib`
- Why This Is Enough: `typed errors and context propagation rely on existing Go stdlib primitives plus the repository's current handler and GORM patterns`
- Upgrade Trigger: `if cross-module signature churn becomes too disruptive, formalize a narrower migration program per subsystem instead of forcing one repo-wide sweep`

## Success Criteria

- Behaviour Outcome: `handlers and services can classify core failure modes with typed errors and honor request cancellation or timeout signals on the selected HTTP request path`
- Verification Signal: `go build ./backend/cmd/server`, `go test -race ./backend/...`, and `go vet ./backend/...` pass for the staged rollout`
- Regression Watch: `existing auth and system request flows keep their current outward behavior while the internal error and context contracts become more explicit`

## Context Strategy

- Entry Sources: `AGENTS.md`, `DESIGN.md`, `docs/README.md`, current task packet, `docs/designs/QUALITY_AND_SECURITY_STRATEGY.md`
- Retrieval Order: `entry -> summary -> raw`
- Sensitive Context: `none`

## Method Readiness

- Consumer-Specific Controls: `typed error contract`, `request timeout middleware`, `context-aware persistence calls`
- Required Sensors: `command`, `review`, `runtime evidence`
- Required Evidence: `command summary`, `runtime gap`, `review summary`
- Ratchet Decision: `gate-updated`
- Deferred Code Issues: `full-repository context propagation remains incremental and should not be misreported as complete from one packet alone`

## Delivery Governance

- Design Gate: `short boundary note`
- Development Gate: `expected files declared`
- QA Acceptance Gate: `command`, `runtime`
- GitHub Governance Gate: `repo-quality-gate`

## Structural Scope

- Affected Subgraph: `HTTP request -> request-context middleware -> handler -> service -> GORM or Redis call; typed error source -> service boundary -> HTTP response mapping`
- Boundary Crossings: `platform -> system/auth`, `platform -> system/iam`, `service -> datastore`
- Risk Nodes: `request timeout wrapper`, `service method signature churn`, `typed error mapping`, `persistence calls without context`
- Graph Focus: `call-depth | hub-check`

## Execution Roles

- Implementer Posture: `implementer`
- Reviewer Posture: `architecture | mechanical`

## Stop Points

- stop before forcing a repository-wide service signature rewrite in one unreviewable patch
- stop before changing external API payloads or error-response semantics beyond the typed-error boundary

## State Plan

- Checkpoint Expectation: `none`
- Resume Artifacts: `docs/harness/tasks/2026-06-21-typed-errors-and-context.task.md`

## Verification Plan

- `go build ./backend/cmd/server`
- `go test -race ./backend/...`
- `go vet ./backend/...`

## Linkage

- Task ID: `2026-06-21-typed-errors-and-context`
- Task Manifest: `.harness/tasks/2026-06-21-typed-errors-and-context/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Evidence Directory: `.harness/evidence/2026-06-21-typed-errors-and-context/`
- Review File: `none`

## Evidence Required

- targeted build, test, and vet command summaries for the staged rollout
- explicit note about which modules received typed-error or context propagation in this slice
- review summary tied back to the same task boundary

## Human Gates

- broad cross-module service signature churn that would materially expand review scope

## Completion Checklist

- [ ] Layer and boundary declared
- [ ] Quality profile or explicit `none` declared
- [ ] Ratchet decision declared for repeated failures
- [ ] Delivery governance gates declared
- [ ] Contract anchors read
- [ ] Verification run or exception recorded
- [ ] Evidence saved or summarized
- [ ] Review completed
