---
title: Auth 平台偏好边界收敛 Task Packet
doc_type: Acceptance
layer: system/auth
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/SYSTEM_AUTH_CONTRACT.md
  - docs/contracts/SYSTEM_IAM_CONTRACT.md
updated_at: 2026-06-17
---

# Task Packet: 2026-06-17-auth-platform-preference-boundary

## Goal

Extract platform-shell preference parsing and normalization into a shared base-owned contract so `system/auth` no longer depends on `system/iam/user` preference DTO and helpers directly.

## Primary Layer

system/auth

## Dependency Layers

- `platform`
- `system/iam`

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `auth-security`
- Portable Failure Class: `architecture-drift`
- Owner Layer: `consumer-repository`
- Coverage Dimensions:
  - `behaviour`
  - `maintainability`
  - `architecture-fitness`

## Contract Anchors

- `pantheon-base/AGENTS.md`
- `pantheon-base/DESIGN.md`
- `pantheon-base/docs/README.md`
- `pantheon-base/docs/contracts/PLATFORM_CONTRACT.md`
- `pantheon-base/docs/contracts/SYSTEM_AUTH_CONTRACT.md`
- `pantheon-base/docs/contracts/SYSTEM_IAM_CONTRACT.md`
- `pantheon-base/docs/designs/AUTH_MODULE_DESIGN.md`
- `pantheon-base/docs/assessments/CURRENT_GOVERNANCE_AND_CODE_AUDIT_2026-06-17.md`

## Scope

### In

- create a shared package for platform-shell preference contract and helper functions
- update `system/auth` to consume the shared contract instead of `system/iam/user` preference DTO/helper
- preserve `system/iam/user` compatibility via a local shim so existing callers stay stable
- keep `preference_json` persistence format and auth audit payload shape unchanged

### Out

- removing `system/auth` dependence on `user.SystemUser`
- changing `/api/v1/auth/me/preferences` request or response semantics
- changing frontend preference behavior
- changing `pantheon-ops`

## Structural Scope

- Affected Subgraph: `auth/me/preferences -> shared platform preference contract -> system_user.preference_json`
- Boundary Crossings: `system/auth -> pkg/*`, `system/iam -> pkg/*`
- Risk Nodes: `auth service`, `auth handler`, `iam user bootstrap`
- Graph Focus: `hub-check`

## Expected Files

### Create

- `backend/pkg/platformprefs/preferences.go`
- `backend/pkg/platformprefs/preferences_test.go`
- `docs/harness/tasks/2026-06-17-auth-platform-preference-boundary.task.md`

### Modify

- `backend/modules/auth/auth_dto.go`
- `backend/modules/auth/auth_handler.go`
- `backend/modules/auth/auth_service.go`
- `backend/modules/system/iam/user/user_preferences.go`

### Do Not Touch

- `backend/cmd/server/main.go`
- `backend/internal/middleware/*`
- `frontend/src/**`
- `../pantheon-ops/**`

## Method Readiness

- Consumer-Specific Controls: `pantheon-base` contract
- Required Sensors: `command`
- Required Evidence: `command summary`
- Ratchet Decision: `guide-updated`
- Deferred Code Issues: `remaining auth/user entity coupling stays for later slice`

## Delivery Governance

- Design Gate: `short boundary note`
- Development Gate: `expected files declared`
- QA Acceptance Gate: `command`
- GitHub Governance Gate: `repo-quality-gate`

## Execution Roles

- Implementer Posture: `implementer`
- Reviewer Posture: `architecture`

## Stop Points

- `none`

## State Plan

- Checkpoint Expectation: `docs/harness/tasks/2026-06-17-auth-platform-preference-boundary.task.md`
- Resume Artifacts: `docs/assessments/CURRENT_GOVERNANCE_AND_CODE_AUDIT_2026-06-17.md`

## Verification Plan

### Backend

- `go test ./backend/pkg/platformprefs -count=1`
- `go test ./backend/modules/auth -run Preference -count=1`
- `go test ./backend/modules/system/iam/user -run Preference -count=1`

### Frontend

- `none`

### Browser / Smoke

- `none`

### Runtime Evidence

- `none`

## Linkage

- Task ID: `2026-06-17-auth-platform-preference-boundary`
- Task Manifest: `.harness/tasks/2026-06-17-auth-platform-preference-boundary/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Evidence Directory: `none`
- Review File: `none`

## Evidence Required

- failing shared-package test before implementation
- passing shared-package, auth, and iam preference tests after implementation
- summary of remaining auth/iam coupling

## Human Gates

- `none`

## Sync expectation

- 仅修改 `pantheon-base`
- `pantheon-ops` 后续复用该共享契约改造，不在本轮同步

## Completion Checklist

- [ ] Layer and boundary declared
- [ ] Quality profile declared
- [ ] Ratchet decision declared
- [ ] Delivery governance gates declared
- [ ] Contract anchors read
- [ ] Verification run or exception recorded
- [ ] Evidence summarized
- [ ] Review completed
