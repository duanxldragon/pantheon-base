# Task Packet: Tenant Migration Runbook

## Goal

为共享 schema 租户 MVP 产出可演练的表、索引、唯一键、缓存、文件、审计和回滚迁移 runbook，不执行生产迁移。

## Priority

`critical`

## Estimated Complexity

`complex`

## Primary Layer

platform

## Dependency Layers

- database and migration tooling
- system/auth, system/iam, system/org, system/config
- tenant contract

## Dependencies

- blockedBy: `2026-09-10-tenant-contract-design`
- blocks: `2026-09-10-tenant-canary-slice`, `2026-09-10-tenant-core-auth-iam`

## Harness Profile

- Template: `api-service`
- Overlay: `migration-safety`
- Coverage Dimensions:
  - architecture-fitness
  - runtime-quality
  - maintainability
  - method-health

## Contract Anchors

- `docs/designs/TENANT_CONTRACT_V1.md`
- `docs/designs/MULTI_TENANT_DESIGN.md`
- `docs/contracts/DATABASE.md`
- `docs/contracts/SYSTEM_AUTH_CONTRACT.md`
- `docs/contracts/SYSTEM_IAM_CONTRACT.md`
- `docs/contracts/SYSTEM_CONFIG_CONTRACT.md`

## Scope

### In

- 盘点真实表、外键、索引、全局唯一键、直接查询入口、Redis/cache key、upload object key、audit/export/async paths。
- 定义默认租户回填、重复值冲突处理、nullable -> backfill -> validate -> NOT NULL/unique 的顺序和锁/窗口策略。
- 定义双写/灰度开关、备份恢复、失败检测、回滚、数据校验和观测指标。
- 在副本数据库完成至少一次成功、一次冲突、一次失败回滚演练，并记录证据。

### Out

- 不在生产数据库执行 DDL、回填、NOT NULL、外键或唯一索引变更。
- 不修改业务查询、认证、权限、缓存或上传 runtime。
- 不把未确认的独立 schema/database 方案混入共享 schema MVP。

## Assumptions and Open Questions

- Confirmed Facts: 当前用户、角色、岗位、设置、字典等存在全局唯一键，且没有 tenant_id migration。
- Working Assumptions: Phase 1 使用共享 schema；默认租户只作为明确的兼容迁移策略，不是隐式永久绕过。
- Open Questions: 线上数据库规模、可用维护窗口、备份 RPO/RTO 由发布 gate 补齐。

## Minimum Viable Approach

- Selected Rung: `reuse`
- Why This Is Enough: 复用现有 migration、备份、schema 检查和 smoke 工具，先形成可复制 runbook，不提前改生产结构。
- Upgrade Trigger: 副本演练暴露锁/容量问题时，另开 online migration 或拆分表任务。

## Success Criteria

- Behaviour Outcome: 任何实现者都能按 runbook 在副本完成回填、冲突、校验、失败恢复和回滚。
- Verification Signal: runbook rehearsal logs、row counts/checksums/index validation 和 rollback report 齐全。
- Regression Watch: 现有单租户数据可恢复，原有全局唯一约束和登录行为在兼容阶段不改变。
- Economics Watch: 记录演练耗时、锁等待、扫描行数和预计生产窗口。

## Structural Scope

- Affected Subgraph: schema/migrations -> unique indexes/foreign keys -> auth/IAM/config data -> Redis/files/audit/export
- Boundary Crossings: database -> system/* -> platform observability
- Risk Nodes: backfill conflicts; unique index rewrite; rollback restore; async/cache side effects
- Graph Focus: call-depth, sensitive-input-flow and data-integrity

## Expected Files

### Create

- `.harness/tasks/2026-09-10-tenant-migration-runbook/manifest.json`
- `.harness/evidence/2026-09-10-tenant-migration-runbook/summary.md`
- `.harness/evidence/2026-09-10-tenant-migration-runbook/review.md`
- `docs/runbooks/TENANT_MIGRATION_RUNBOOK.md`
- table/index/unique-key inventory and rehearsal fixtures under `.harness/evidence/`

### Modify

- only migration documentation or rehearsal helpers approved by the runbook reviewer

### Do Not Touch

- production schema/migrations
- auth/IAM/runtime query code
- production data or `pantheon-ops`

## Implementation Notes

- Inventory must include tables without obvious business names and every export/aggregate/background path.
- Unique-key changes require duplicate report and deterministic conflict resolution before index DDL.
- Rollback is incomplete unless data restore, cache invalidation, file/object consistency and audit trace are verified.

## Execution Roles

- Implementer Posture: migration/runbook engineer; rehearsal only
- Reviewer Posture: database reliability and security reviewer; challenge irreversibility and hidden side effects

## Stop Points

- 副本无可恢复备份、冲突无法确定性处理或回滚无法验证时停止。
- 发现必须先改 runtime contract 时回到 tenant-contract-design，不用临时 SQL 绕过。

## Rollback Plan

- Trigger Condition: rehearsal loses rows, violates uniqueness, or cannot restore previous state.
- Rollback Steps:
  1. stop the rehearsal and capture logs/checksums
  2. restore the replica backup and invalidate rehearsal cache/file fixtures
  3. mark the runbook blocked and reopen the failed migration step
- Rollback Verification:
  - [ ] Row counts and checksums match baseline
  - [ ] Unique and foreign-key checks pass
  - [ ] Audit/rehearsal trace records the rollback

## Verification Plan

### Backend

- `go test ./...` for unchanged runtime
- migration/schema validation command documented by the runbook

### Frontend

- none

### Browser / Smoke

- replica smoke only; no production data

## Linkage

- Task ID: `2026-09-10-tenant-migration-runbook`
- Task Manifest: `.harness/tasks/2026-09-10-tenant-migration-runbook/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Plan References: `.harness/tasks/TENANT_EVOLUTION_MASTER_PLAN_20260910.md`; `docs/reviews/PANTHEON_BASE_INDEPENDENT_AUDIT_PLAN_20260910.md`
- Evidence Directory: `.harness/evidence/2026-09-10-tenant-migration-runbook/`
- Review File: `.harness/evidence/2026-09-10-tenant-migration-runbook/review.md`

## Evidence Required

- table/index/unique-key/cache/file/audit inventory
- successful, conflict and failed rollback rehearsal logs
- backup/restore and integrity verification
- reviewer report with explicit production-execution prohibition until gate

## Human Gates

- migration runbook approval before any schema or data migration task
- backup/RPO/RTO and production window approval before execution

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Tests or checks updated
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
