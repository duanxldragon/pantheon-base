# Task Packet: 2026-09-08-p2-multi-tenant-design

## Goal

Produce the multi-tenant isolation design and tenant DB routing design (design-only, explicitly not implementation). The design deliverable exists: `docs/designs/MULTI_TENANT_DESIGN.md` was authored and later superseded by the frozen `docs/contracts/TENANT_CONTRACT_V1.md`, with implementation landing through the 2026-09-10 tenant queue. This packet is back-filled on 2026-09-24 as accounting for that completed design track.

## Primary Layer

platform

## Dependency Layers

- platform governance tooling
- backend-services (auth/iam/session tenant scope)
- backend-repositories

## Harness Profile

- Template: api-service
- Overlay: design-first
- Coverage Dimensions:
  - architecture-fitness
  - behaviour
  - maintainability

## Contract Anchors

- `docs/designs/MULTI_TENANT_DESIGN.md`
- `docs/contracts/TENANT_CONTRACT_V1.md`
- `docs/runbooks/TENANT_MIGRATION_RUNBOOK.md`
- `.harness/tasks/TASK_MASTER_PLAN.md`

## Scope

### In

- Tenant isolation design document and tenant DB routing considerations (design only)
- Supersession linkage: the design doc's Status field points to the frozen contract that replaced it
- Evidence that the design track is closed and handed to the tenant implementation queue

### Out

- Tenant implementation (delivered by the 2026-09-10 tenant-* packets: contract design, core auth/iam, data infrastructure, migration runbook, guardrails, verification)
- Any schema, permission, menu, or API change in this packet
- Re-opening the frozen contract

## Expected Files

### Create

- `.harness/tasks/2026-09-08-p2-multi-tenant-design/task.md`
- `.harness/tasks/2026-09-08-p2-multi-tenant-design/manifest.json`
- `.harness/evidence/2026-09-08-p2-multi-tenant-design/commands.json`
- `.harness/evidence/2026-09-08-p2-multi-tenant-design/summary.md`
- `.harness/evidence/2026-09-08-p2-multi-tenant-design/review.md`

### Modify

- none — the design artifacts already exist and are not edited by this packet

### Do Not Touch

- `docs/contracts/TENANT_CONTRACT_V1.md` (frozen)
- `backend/modules/**`, `frontend/src/**`
- database migrations

## Implementation Notes

Closure evidence:

- `docs/designs/MULTI_TENANT_DESIGN.md` exists with Status `Superseded by docs/contracts/TENANT_CONTRACT_V1.md`.
- `docs/contracts/TENANT_CONTRACT_V1.md` is the frozen tenant contract (§3.1 session claim wiring is visible in `token_middleware.go` `applyTokenContext`).
- Implementation followed in the 2026-09-10 tenant queue (tenant-contract-design, tenant-core-auth-iam, tenant-core-data-infrastructure, tenant-migration-runbook, tenant-ready-guardrails, tenant-verification-and-gray) plus migrations 000013-000017.
- K8s deployment surface exists at `k8s/` (tenant-relevant configmap/secret examples included).

The master plan scoped this item as "Design only, not implementation" — design delivered, supersession recorded, implementation tracked by its own completed packets, so this packet closes as completed.

## Verification Plan

- `grep -n "Superseded" docs/designs/MULTI_TENANT_DESIGN.md`
- `ls docs/contracts/TENANT_CONTRACT_V1.md docs/runbooks/TENANT_MIGRATION_RUNBOOK.md k8s/`
- `ls .harness/tasks/2026-09-10-tenant-*/manifest.json` (implementation queue completed)
- `node scripts/harness/check-task-packet.mjs --root . .harness/tasks/2026-09-08-p2-multi-tenant-design/task.md`

## Linkage

- Task ID: 2026-09-08-p2-multi-tenant-design
- Task Manifest: `.harness/tasks/2026-09-08-p2-multi-tenant-design/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `.harness/tasks/TASK_MASTER_PLAN.md`
- Evidence Directory: `.harness/evidence/2026-09-08-p2-multi-tenant-design/`
- Review File: `.harness/evidence/2026-09-08-p2-multi-tenant-design/review.md`

## Evidence Required

- Supersession line from `MULTI_TENANT_DESIGN.md` pointing at the frozen contract
- List of the completed tenant implementation packets that consumed the design
- Review disposition confirming design-only scope was respected (no code change in this packet)

## Human Gates

- none required (design accounting only; the frozen contract itself was gated by its own tenant packets) — evidence review only

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
