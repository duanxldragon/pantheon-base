---
title: Pantheon Base Audit And QA Task Packet
doc_type: Acceptance
layer: platform
depends_on_layers:
  - system/auth
  - system/org
  - system/config
status: Approved
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/SYSTEM_AUTH_CONTRACT.md
  - docs/contracts/SYSTEM_ORG_CONTRACT.md
  - docs/contracts/SYSTEM_CONFIG_CONTRACT.md
updated_at: 2026-06-05
---

# Task Packet: 2026-05-18-pantheon-base-audit-and-qa

## Goal

Close the base repository audit-and-QA acceptance loop for shared platform and system pages, with smoke, visual contract, and frontend failure-path behavior verified against the current Pantheon Base contracts.

## Primary Layer

platform

## Dependency Layers

- `system/auth`
- `system/org`
- `system/config`

## Harness Profile

- Template: `admin-platform`
- Overlay: `audit-and-qa`
- Coverage Dimensions:
  - `behaviour`
  - `runtime-quality`
  - `method-health`

## Contract Anchors

- `DESIGN.md`
- `docs/README.md`
- `docs/contracts/PLATFORM_CONTRACT.md`
- `docs/contracts/SYSTEM_AUTH_CONTRACT.md`
- `docs/contracts/SYSTEM_ORG_CONTRACT.md`
- `docs/contracts/SYSTEM_CONFIG_CONTRACT.md`
- `docs/acceptances/ACCEPTANCE_CHECKLIST.md`
- `docs/acceptances/CODE_REVIEW_STANDARD.md`
- `docs/acceptances/AGENT_EXECUTION_CHECKLIST.md`

## Scope

### In

- verify build, backend baseline, and shared platform/system smoke coverage
- align brittle smoke and visual assertions with the current role-name and shell DOM contracts
- close frontend failure-path promise bubbling in shared auth, audit, and system list flows

### Out

- redesigning shared shell layout or route ownership
- backend API or schema changes unrelated to the acceptance failures
- silencing browser dev-only warnings that do not block smoke acceptance

## Expected Files

### Create

- `docs/harness/tasks/2026-05-18-pantheon-base-audit-and-qa.task.md`
- `.harness/evidence/2026-05-18-pantheon-base-audit-and-qa/summary.md`
- `.harness/evidence/2026-05-18-pantheon-base-audit-and-qa/commands.json`
- `.harness/evidence/2026-05-18-pantheon-base-audit-and-qa/review.md`

### Modify

- `frontend/src/index.css`
- `frontend/src/modules/auth/SessionList.tsx`
- `frontend/src/modules/auth/LoginLogList.tsx`
- `frontend/src/modules/system/audit/OperationLogList.tsx`
- `frontend/src/modules/system/user/UserList.tsx`
- `frontend/src/modules/system/role/RoleList.tsx`
- `frontend/src/modules/system/menu/MenuList.tsx`
- `frontend/src/modules/system/dept/DeptList.tsx`
- `frontend/src/modules/system/dict/DictTypeTab.tsx`
- `frontend/src/modules/system/post/PostList.tsx`
- `frontend/src/modules/system/permission/PermissionList.tsx`
- `frontend/tests/smoke/system/system-workspace-task-depth.ts`
- `frontend/tests/smoke/platform/shell-visual-contract.spec.ts`

### Do Not Touch

- `backend/modules/**` unless a verified shared acceptance blocker requires it
- `sonar-project.properties`
- `.github/workflows/**`

## Implementation Notes

- Keep the audit centered on shared platform/system contracts rather than one-off page tweaks.
- Treat Playwright green test cases as the primary signal even when wrapper teardown is noisy.
- Record browser warnings and environment skips as residual evidence instead of silently dropping them.

## Structural Scope

- Affected Subgraph: `shared list page -> form action handler -> smoke/visual contract`
- Boundary Crossings: `platform -> system/auth | system/org | system/config`
- Risk Nodes: `shared list actions | shell visual contract | smoke assertions`
- Graph Focus: `hub-check | call-depth`

## Verification Plan

### Backend

- `go test ./...`

### Frontend

- `cd frontend && cmd /c npm run build`

### Browser / Smoke

- `cd frontend && cmd /c npm run test:smoke:system:pages`
- `cd frontend && cmd /c npm run test:smoke:system:auth`
- `cd frontend && cmd /c npm run test:smoke:system:ui`
- `cd frontend && cmd /c npm run test:smoke:system:api`
- `cd frontend && cmd /c npm run test:smoke:system:governance`
- `cd frontend && cmd /c npm run test:smoke:system:shell`

## Linkage

- Task ID: `2026-05-18-pantheon-base-audit-and-qa`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Evidence Directory: `.harness/evidence/2026-05-18-pantheon-base-audit-and-qa/`
- Review File: `.harness/evidence/2026-05-18-pantheon-base-audit-and-qa/review.md`

## Evidence Required

- command baseline for build, backend, and smoke acceptance
- browser evidence for at least one representative system page
- review notes describing contract-alignment fixes and residual environment noise

## Human Gates

- approve before broad shell redesign or shared design-language changes
- approve before changing backend APIs only to satisfy frontend smoke
- approve before dropping noisy-but-nonblocking browser warnings from evidence

## Completion Checklist

- [ ] Layer and boundary declared
- [ ] Contract anchors read
- [ ] Verification run or exception recorded
- [ ] Evidence saved or summarized
- [ ] Review completed
