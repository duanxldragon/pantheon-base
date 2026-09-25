# Task Packet: Tenant Core Auth and IAM

## Goal

在 canary 和覆盖率对账通过后，实现 tenant-aware membership、session/token/MFA、角色组织关系、Casbin domain、数据权限和管理员边界。

## Priority

`critical`

## Estimated Complexity

`epic`

## Primary Layer

system/auth

## Dependency Layers

- system/iam
- system/org
- tenant contract and migration runbook
- auth/IAM test coverage baseline

## Dependencies

- blockedBy: `2026-09-10-tenant-contract-design`, `2026-09-10-tenant-migration-runbook`, `2026-09-10-tenant-canary-slice`, `2026-09-08-p1-test-coverage-phase1`
- blocks: `2026-09-10-tenant-core-data-infrastructure`, `2026-09-10-tenant-verification-and-gray`

## Harness Profile

- Template: `api-service`
- Overlay: `security-sensitive`
- Coverage Dimensions:
  - behaviour
  - runtime-quality
  - architecture-fitness
  - method-health

## Contract Anchors

- `docs/designs/TENANT_CONTRACT_V1.md`
- `docs/contracts/SYSTEM_AUTH_CONTRACT.md`
- `docs/contracts/SYSTEM_IAM_CONTRACT.md`
- `docs/contracts/SYSTEM_ORG_CONTRACT.md`
- `backend/pkg/authtoken/token.go`
- `backend/modules/auth/session/session_model.go`
- `backend/pkg/common/data_scope.go`

## Scope

### In

- Tenant master/membership 状态与用户访问边界，登录选择/发现和会话撤销语义。
- token/session/MFA/security event 的 tenant claim、切换、失效和审计。
- role/menu/permission/org/dept/post 的作用域，Casbin subject/domain，显式平台跨租户权限。
- 租户过滤、部门 DataScope、管理员权限的组合顺序和默认拒绝。
- 单租户兼容模式、双租户隔离、篡改 claim/header、并发切换和会话失效测试。
- migration 按 runbook 分批执行并保留回滚开关。

### Out

- 配置/字典/上传/导出/动态模块等非 auth/IAM cross-cutting 资源（后续任务）。
- 域名、套餐、计费、独立数据库和自助注册。
- 没有 evidence 的全仓一次性重写。

## Assumptions and Open Questions

- Confirmed Facts: 当前 token/session 没有 tenant claim，Casbin role key 和 DataScope 为全局/部门维度。
- Working Assumptions: 只实现合同批准的 membership/resolution 模型，保留明确兼容期限。
- Open Questions: 生产 MFA/session 迁移窗口和平台管理员审批人必须在 human gate 确认。

## Minimum Viable Approach

- Selected Rung: `small local code`
- Why This Is Enough: 复用现有 auth/session/Casbin/DataScope 结构，按垂直切片增加 tenant 维度和负向测试。
- Upgrade Trigger: 若 Casbin domain 或 session store 需要新依赖/外部服务，另开依赖与迁移评审任务。

## Success Criteria

- Behaviour Outcome: 同一用户可按合同访问其 membership 租户；无 membership、过期 membership、伪造 claim/header 和跨租户 ID 均拒绝；平台跨租户操作必须显式授权。
- Verification Signal: auth/IAM focused tests、two-tenant runtime smoke、MFA/session invalidation、Casbin/data-scope evidence 全通过。
- Regression Watch: 单租户登录、刷新、注销、MFA、管理员和现有部门权限不回归。
- Economics Watch: 记录 token/session lookup、policy evaluation 和登录/切换延迟。

## Structural Scope

- Affected Subgraph: login -> token/session/MFA -> membership -> Casbin -> role/data scope -> protected resource
- Boundary Crossings: system/auth -> system/iam -> system/org -> pkg/authtoken/database
- Risk Nodes: admin bypass; stale membership/session; forged tenant claim; policy cache collision
- Graph Focus: sensitive-input-flow, hub-check and call-depth

## Expected Files

### Create

- `.harness/tasks/2026-09-10-tenant-core-auth-iam/manifest.json`
- `.harness/evidence/2026-09-10-tenant-core-auth-iam/summary.md`
- `.harness/evidence/2026-09-10-tenant-core-auth-iam/review.md`
- migrations, fixtures, contract tests and isolation smoke artifacts approved by gate

### Modify

- auth/session/token/MFA paths
- IAM/org/Casbin/data-scope paths
- migration and runtime tests

### Do Not Touch

- unrelated config/dict/upload/dynamic module paths
- production rollout without migration/rollback approval
- `pantheon-ops`

## Implementation Notes

- Tenant context is not inferred from a user-supplied Header when a trusted claim/session is required.
- Admin bypass must be an explicit platform permission, not a role-name string shortcut.
- Membership changes must invalidate affected sessions/tokens according to the contract.
- Every policy/cache key includes the approved tenant domain where applicable.

## Execution Roles

- Implementer Posture: security-sensitive auth/IAM implementer; test-first and migration-aware
- Reviewer Posture: independent authorization reviewer; adversarially challenge default allow and stale state

## Stop Points

- 任何 token/session/MFA/Casbin 语义无法和合同一致时停止。
- 双租户、claim/header tampering、membership revoke 或单租户回归任一失败时停止放量。

## Rollback Plan

- Trigger Condition: auth isolation failure, session leak, policy bypass, or migration rollback signal.
- Rollback Steps:
  1. disable tenant-aware auth/IAM flag and force compatibility mode
  2. revoke affected sessions/tokens and restore migration snapshot per runbook
  3. invalidate policy/session caches and rerun single-tenant smoke
- Rollback Verification:
  - [ ] No cross-tenant auth or policy access remains
  - [ ] Existing users can log in under compatibility mode
  - [ ] Migration/data integrity checks pass

## Verification Plan

### Backend

- `go test ./...`
- auth/IAM focused coverage and adversarial tests
- migration contract tests against a two-tenant fixture

### Frontend

- `npm run type-check` and `npm run lint` for login/tenant switch surfaces

### Browser / Smoke

- login, tenant selection/switch, refresh, logout, MFA, role/menu and forbidden flows for two tenants

## Linkage

- Task ID: `2026-09-10-tenant-core-auth-iam`
- Task Manifest: `.harness/tasks/2026-09-10-tenant-core-auth-iam/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Plan References: `.harness/tasks/TENANT_EVOLUTION_MASTER_PLAN_20260910.md`; `.harness/tasks/2026-09-08-p1-test-coverage-phase1/task.md`
- Evidence Directory: `.harness/evidence/2026-09-10-tenant-core-auth-iam/`
- Review File: `.harness/evidence/2026-09-10-tenant-core-auth-iam/review.md`

## Evidence Required

- migration and rollback rehearsal
- auth/IAM test and coverage deltas
- runtime login/session/MFA/Casbin smoke and negative cases
- security reviewer report and observability signals

## Human Gates

- schema/migration approval
- auth/session/token/MFA contract approval
- permission/Casbin and administrator-boundary approval
- staged rollout approval

## Completion Checklist

- [ ] Layer and boundary declared
- [ ] Contract anchors read
- [ ] Tests or checks updated
- [ ] Verification run or exception recorded
- [ ] Evidence saved or summarized
- [ ] Review completed
