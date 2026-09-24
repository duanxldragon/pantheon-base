# Task Packet: Tenant Contract Design

## Goal

冻结 Tenant master、membership、可信 tenant context、资源 scope、Casbin domain 和单租户兼容模式，使后续实现不依赖隐含假设。

## Priority

`critical`

## Estimated Complexity

`complex`

## Primary Layer

platform

## Dependency Layers

- system/auth
- system/iam
- system/org
- system/config
- database contract

## Dependencies

- blockedBy: `2026-09-10-tenant-ready-guardrails`
- blocks: `2026-09-10-tenant-migration-runbook`, `2026-09-10-tenant-canary-slice`, `2026-09-10-tenant-core-auth-iam`

## Harness Profile

- Template: `api-service`
- Overlay: `tenant-contract`
- Coverage Dimensions:
  - architecture-fitness
  - maintainability
  - runtime-quality
  - method-health

## Contract Anchors

- `docs/contracts/PLATFORM_CONTRACT.md`
- `docs/contracts/SYSTEM_AUTH_CONTRACT.md`
- `docs/contracts/SYSTEM_IAM_CONTRACT.md`
- `docs/contracts/SYSTEM_ORG_CONTRACT.md`
- `docs/contracts/SYSTEM_CONFIG_CONTRACT.md`
- `docs/designs/MULTI_TENANT_DESIGN.md`
- `docs/designs/TENANT_READY_SINGLE_TENANT_DESIGN.md`
- `docs/designs/P2_SCALE_ROADMAP.md`

## Scope

### In

- 定义 Tenant master 的 id/code/status/lifecycle/soft-delete/administrator 边界。
- 定义用户与 tenant membership、多租户登录发现、tenant context 来源/缺失/冲突行为、session/token/MFA/security event 语义。
- 建立 platform-global、tenant-owned、tenant-overridable、derived 四类资源矩阵，覆盖 user/role/dept/post/menu/permission/config/dict/audit/export/upload/task/dashboard/dynamic module。
- 定义租户过滤、部门 DataScope、Casbin subject/domain、平台管理员显式跨租户权限和单租户兼容模式退出条件。
- 输出可供 migration、canary 和 auth/IAM 实现引用的合同与 fixture 规则。

### Out

- 不建表、不写 migration、不改 token/session/auth middleware。
- 不实现域名发现、套餐/计费、独立 schema/database、自助注册。
- 不在合同未批准前选择第二种 tenant resolution 来源。

## Assumptions and Open Questions

- Confirmed Facts: 当前 token/session、Casbin role key 和 DataScope 都没有租户语义；设计文档对 resolution 方式存在多路描述。
- Working Assumptions: Phase 1 采用共享 schema，并只保留一种经合同批准的可信 context 来源。
- Open Questions: 用户是否可加入多个租户、平台管理员是否可跨租户、兼容模式期限必须由维护者 gate 冻结。

## Minimum Viable Approach

- Selected Rung: `reuse`
- Why This Is Enough: 以现有 auth/IAM/org/config 合同为锚，只新增一个租户合同、矩阵和 fixtures，不提前发明 runtime abstraction。
- Upgrade Trigger: 若共享 schema 无法满足合规/容量目标，再另开隔离架构任务，不在本任务扩大范围。

## Success Criteria

- Behaviour Outcome: 实现者可以从合同唯一判断每类资源是否需要 tenant context、过滤和租户内唯一。
- Verification Signal: 合同审查通过；双租户 fixture 能描述同名对象、claim/header 篡改和管理员边界的预期结果。
- Regression Watch: 单租户兼容模式、现有 platform-global 资源和 ops 继承边界保持清晰。
- Economics Watch: none

## Structural Scope

- Affected Subgraph: tenant master -> membership -> auth/session/token -> IAM/Casbin/DataScope -> resource scope matrix
- Boundary Crossings: platform -> system/auth -> system/iam -> system/org -> system/config
- Risk Nodes: tenant resolution; admin bypass; global unique keys; async context propagation
- Graph Focus: sensitive-input-flow and boundary-crossing

## Expected Files

### Create

- `.harness/tasks/2026-09-10-tenant-contract-design/manifest.json`
- `.harness/evidence/2026-09-10-tenant-contract-design/summary.md`
- `.harness/evidence/2026-09-10-tenant-contract-design/review.md`
- `docs/designs/TENANT_CONTRACT_V1.md`
- tenant scope matrix and two-tenant fixture specification under `docs/`

### Modify

- `docs/designs/MULTI_TENANT_DESIGN.md` only to reconcile status/estimate and link the approved contract
- `docs/designs/P2_SCALE_ROADMAP.md` only to link the decision and gate

### Do Not Touch

- backend schema, migrations, token/session, Casbin policies, auth handlers
- frontend runtime and `pantheon-ops`

## Implementation Notes

- Contract must explicitly distinguish tenant isolation from department data scope.
- A missing, conflicting or untrusted tenant context is deny-by-default for tenant resources.
- `role_key == "admin"` cannot by itself mean cross-tenant authority.
- Every decision records owner, status, evidence needed and revisit trigger.

## Execution Roles

- Implementer Posture: architecture/contract author; no runtime implementation
- Reviewer Posture: auth/IAM/database reviewer; adversarially challenge hidden global scope

## Stop Points

- 未冻结多租户用户关系、resolution、resource scope、Casbin domain 或兼容模式时停止。
- 任何合同变更需要新增 schema/auth 行为时转入 human gate。

## Rollback Plan

- Trigger Condition: contract review rejects a scope or resolution decision.
- Rollback Steps:
  1. mark the draft contract superseded
  2. retain the prior single-tenant guardrail documents as active
  3. reopen only the rejected decision with evidence
- Rollback Verification:
  - [ ] Single-tenant guardrails remain authoritative
  - [ ] No runtime code references the rejected contract

## Verification Plan

### Backend

- `go test ./...` (no production code expected to change)

### Frontend

- none; verify no UI capability claims were added

### Browser / Smoke

- none; two-tenant fixture review is static at this stage

## Linkage

- Task ID: `2026-09-10-tenant-contract-design`
- Task Manifest: `.harness/tasks/2026-09-10-tenant-contract-design/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Plan References: `.harness/tasks/TENANT_EVOLUTION_MASTER_PLAN_20260910.md`; `docs/reviews/PANTHEON_BASE_INDEPENDENT_AUDIT_PLAN_20260910.md`
- Evidence Directory: `.harness/evidence/2026-09-10-tenant-contract-design/`
- Review File: `.harness/evidence/2026-09-10-tenant-contract-design/review.md`

## Evidence Required

- approved tenant contract and scope matrix
- decision log for resolution, membership, admin and compatibility mode
- two-tenant fixture and hostile-case expectations
- reviewer summary with unresolved questions (must be none before implementation)

## Human Gates

- contract freeze by maintainer before any schema/auth/IAM implementation

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Tests or checks updated
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
