---
title: Auth Service Split Task Packet
doc_type: Acceptance
layer: system/auth
depends_on_layers:
  - platform
status: Approved
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/SYSTEM_AUTH_CONTRACT.md
updated_at: 2026-06-23
---

# Task Packet: 2026-06-21-auth-service-split

## Goal

Split the legacy monolithic `backend/modules/auth/auth_service.go` into focused internal auth subservices while keeping the `AuthService` public facade and auth HTTP contract stable.

## Primary Layer

system/auth

## Dependency Layers

- `platform`

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `auth-maintainability`
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
- `docs/contracts/SYSTEM_AUTH_CONTRACT.md`
- `docs/designs/AUTH_MODULE_DESIGN.md`

## Scope

### In

- split login, MFA, security-event, and login-log responsibilities out of the legacy auth service into focused internal subservices
- keep `AuthService` public methods and route wiring backward compatible while delegating to the new internal services
- preserve existing auth DTO shapes, handler entry points, and focused auth tests while the service internals are reorganized

### Out

- changing browser auth cookie or token semantics
- introducing new auth features or policy branches beyond the service split
- syncing downstream consumer repositories such as `pantheon-ops`

## Assumptions and Open Questions

- Confirmed Facts: `auth_service.go` was carrying multiple responsibility clusters, and session/password logic already provided the reference pattern for focused subservice extraction.
- Working Assumptions: `AuthService` remains the module facade while the new internal services stay unexported.
- Open Questions: `none`

## Expected Files

### Create

- `backend/modules/auth/auth_login_service.go`
- `backend/modules/auth/auth_mfa_service.go`
- `backend/modules/auth/auth_security_service.go`
- `docs/harness/tasks/2026-06-21-auth-service-split.task.md`
- `.harness/evidence/2026-06-21-auth-service-split/summary.md`
- `.harness/evidence/2026-06-21-auth-service-split/commands.json`
- `.harness/evidence/2026-06-21-auth-service-split/review.md`

### Modify

- `backend/modules/auth/auth_service.go`
- `backend/modules/auth/auth_dto.go`
- `backend/modules/auth/auth_handler.go`
- `backend/modules/auth/auth_handler_test.go`
- `backend/modules/auth/module.go`
- `backend/modules/auth/auth_service_test.go`
- `backend/modules/auth/module_test.go`
- `backend/modules/auth/preferences_contract_test.go`
- `backend/modules/auth/smoke_test.go`

### Do Not Touch

- `frontend/**`
- `../pantheon-ops/**`
- unrelated IAM, org, and config modules

## Implementation Notes

- The split is internal-only: `AuthService` remains the module facade and should delegate to unexported child services.
- The smallest successful cut keeps constructor wiring, handler signatures, and tests stable while moving cohesive method clusters behind internal service structs.
- Existing partially split services such as password and session remain the reference pattern for the new shards.

## Minimum Viable Approach

- Selected Rung: `small local code`
- Why This Is Enough: `the repository already has the auth facade, DTOs, handlers, and partial service shards, so the remaining work is a focused internal split rather than a new abstraction or dependency`
- Upgrade Trigger: `if the split still leaves auth orchestration as a large cross-domain hub, promote the next cut into package-level boundaries rather than adding more helpers to one file`

## Success Criteria

- Behaviour Outcome: `AuthService public methods and routes continue to work while login, MFA, and security flows are delegated through focused internal services`
- Verification Signal: `go build ./backend/cmd/server`, `go test -race ./backend/modules/auth/...`, and `go vet ./backend/...` all pass without introducing new auth contract regressions
- Regression Watch: `auth DTO shape, route registration, and existing auth tests stay backward compatible`

## Context Strategy

- Entry Sources: `AGENTS.md`, `DESIGN.md`, `docs/README.md`, current task packet, `docs/designs/AUTH_MODULE_DESIGN.md`
- Retrieval Order: `entry -> summary -> raw`
- Sensitive Context: `none`

## Method Readiness

- Consumer-Specific Controls: `auth module design`, `auth facade compatibility`, `focused auth build/test commands`
- Required Sensors: `command`, `review`
- Required Evidence: `command summary`, `review summary`
- Ratchet Decision: `template-updated`
- Deferred Code Issues: `none`

## Delivery Governance

- Design Gate: `short boundary note`
- Development Gate: `expected files declared`
- QA Acceptance Gate: `command`
- GitHub Governance Gate: `repo-quality-gate`

## Structural Scope

- Affected Subgraph: `auth handlers -> AuthService facade -> login|mfa|security subservices -> persistence and audit side effects`
- Boundary Crossings: `system/auth -> pkg/*`
- Risk Nodes: `AuthService facade`, `login orchestration`, `MFA challenge flow`, `security event and login-log paths`
- Graph Focus: `call-depth | hub-check`

## Execution Roles

- Implementer Posture: `implementer`
- Reviewer Posture: `architecture | mechanical`

## Stop Points

- stop before changing public auth API, cookie, or token semantics
- stop before widening the refactor into unrelated IAM, org, or downstream repository synchronization

## State Plan

- Checkpoint Expectation: `none`
- Resume Artifacts: `docs/harness/tasks/2026-06-21-auth-service-split.task.md`

## Verification Plan

- `go build ./backend/cmd/server`
- `go test -race ./backend/modules/auth/...`
- `go vet ./backend/...`

## Linkage

- Task ID: `2026-06-21-auth-service-split`
- Task Manifest: `.harness/tasks/2026-06-21-auth-service-split/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Evidence Directory: `.harness/evidence/2026-06-21-auth-service-split/`
- Review File: `none`

## Evidence Required

- targeted auth build, race-test, and vet command summaries
- explicit note if the final split shape differs from the original root-file proposal
- review summary tied back to the same task boundary

## Human Gates

- public auth API contract changes beyond the internal service split

## Completion Checklist

- [ ] Layer and boundary declared
- [ ] Quality profile or explicit `none` declared
- [ ] Ratchet decision declared for repeated failures
- [ ] Delivery governance gates declared
- [ ] Contract anchors read
- [ ] Verification run or exception recorded
- [ ] Evidence saved or summarized
- [ ] Review completed
