# Task Packet: Tenant Verification and Gray Release

## Goal

用双租户 hostile smoke、迁移/回滚演练、性能和观测证据验证租户 MVP，并给出受控灰度或停止结论。

## Priority

`critical`

## Estimated Complexity

`complex`

## Primary Layer

platform

## Dependency Layers

- system/auth
- system/iam
- system/config
- platform audit/dashboard/observability
- database and storage

## Dependencies

- blockedBy: `2026-09-10-tenant-core-auth-iam`, `2026-09-10-tenant-core-data-infrastructure`
- blocks: `none`

## Harness Profile

- Template: `custom`
- Overlay: `gray-release`
- Coverage Dimensions:
  - behaviour
  - runtime-quality
  - architecture-fitness
  - method-health

## Contract Anchors

- `docs/designs/TENANT_CONTRACT_V1.md`
- `docs/runbooks/TENANT_MIGRATION_RUNBOOK.md`
- `docs/contracts/SYSTEM_AUTH_CONTRACT.md`
- `docs/contracts/SYSTEM_IAM_CONTRACT.md`
- `docs/contracts/SYSTEM_CONFIG_CONTRACT.md`
- `docs/harness/VERIFICATION_EVIDENCE_SPEC.md`

## Scope

### In

- 两租户 runtime smoke：登录/切换/刷新/注销、CRUD、ID tampering、claim/header forgery、batch/export/count/aggregate。
- session/MFA/role/menu/Casbin/DataScope、audit、cache、file/object、async 和 dynamic module 隔离。
- 并发访问、性能基线、日志/指标/追踪、异常告警和审计检索。
- migration rehearsal、backup/restore、rollback rehearsal、feature flag 灰度和 kill switch。
- 输出 production candidate / controlled pilot / blocked 三选一结论。

### Out

- 不在本任务新增功能或补隐含实现。
- 不在没有所有证据时宣称“多租户生产就绪”。
- 不执行未经批准的生产数据迁移或扩大灰度。

## Assumptions and Open Questions

- Confirmed Facts: 前置 auth/IAM 与 data infrastructure 任务必须各自提供隔离 evidence，本任务只做集成验证和发布判定。
- Working Assumptions: 可获得两个隔离租户 fixture、可观测环境和可恢复数据库副本。
- Open Questions: 生产容量、灰度比例、RPO/RTO 和维护窗口由最终 human gate 冻结。

## Minimum Viable Approach

- Selected Rung: `reuse`
- Why This Is Enough: 复用现有 smoke、审计、metrics、backup/restore 和 release gate，增加租户 hostile 场景及发布判定。
- Upgrade Trigger: 任何未知泄漏路径都先补前置任务，不以放宽 smoke 代替修复。

## Success Criteria

- Behaviour Outcome: 双租户 hostile matrix 全通过，失败场景可观测、可回滚；单租户兼容回归通过。
- Verification Signal: smoke JSON、test logs、migration/rollback report、performance/observability evidence 和独立 reviewer sign-off。
- Regression Watch: 不允许出现默认 allow、跨租户导出/文件、缓存串租户、异步丢 context 或审计缺失。
- Economics Watch: 记录测试耗时、查询/导出性能、缓存命中率、错误率和灰度资源成本。

## Structural Scope

- Affected Subgraph: ingress -> auth/IAM -> tenant context -> all protected resources/side effects -> audit/metrics -> release flag
- Boundary Crossings: platform -> system/* -> database/cache/storage/async -> release governance
- Risk Nodes: untested path; observability blind spot; rollback failure; performance regression
- Graph Focus: sensitive-input-flow, hub-check and cycle-check

## Expected Files

### Create

- `.harness/tasks/2026-09-10-tenant-verification-and-gray/manifest.json`
- `.harness/evidence/2026-09-10-tenant-verification-and-gray/summary.md`
- `.harness/evidence/2026-09-10-tenant-verification-and-gray/review.md`
- hostile smoke specs, reports, dashboards/alerts and rollback records

### Modify

- smoke configuration and release gate only when required by evidence
- observability checks and runbook links

### Do Not Touch

- product behavior to hide failed evidence
- production data without explicit release approval
- `pantheon-ops` consumer code in this task

## Implementation Notes

- Test matrix must include same IDs, same names, batch requests, exports, aggregates, stale tokens, revoked membership and concurrent requests across tenants.
- “通过” requires evidence artifacts, not just a green unit-test command.
- A single high-severity leak blocks gray release and reopens the responsible task.

## Execution Roles

- Implementer Posture: QA/release engineer; evidence-first, no feature invention
- Reviewer Posture: independent security/release evaluator; decide production candidate vs blocked

## Stop Points

- 任一高危隔离失败、回滚失败、观测盲区或性能退化超过 gate 时停止灰度。
- evidence 不完整时只能输出 controlled pilot 或 blocked。

## Rollback Plan

- Trigger Condition: hostile smoke failure, production-like alert, migration restore failure or leak signal.
- Rollback Steps:
  1. trigger kill switch and return to single-tenant compatibility mode
  2. revoke affected sessions, invalidate caches/files and restore database snapshot if needed
  3. preserve all logs/traces and reopen the responsible task packet
- Rollback Verification:
  - [ ] Smoke and audit retrieval pass after rollback
  - [ ] Data/session/cache/file integrity verified
  - [ ] Incident and residual-risk record exists

## Verification Plan

### Backend

- `go test ./...`
- full tenant isolation and concurrency suite

### Frontend

- `npm run type-check` and `npm run lint`

### Browser / Smoke

- hostile two-tenant Playwright/API smoke with flag-on, flag-off and rollback paths

## Linkage

- Task ID: `2026-09-10-tenant-verification-and-gray`
- Task Manifest: `.harness/tasks/2026-09-10-tenant-verification-and-gray/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Plan References: `.harness/tasks/TENANT_EVOLUTION_MASTER_PLAN_20260910.md`; `.harness/tasks/2026-09-10-tenant-core-auth-iam/task.md`; `.harness/tasks/2026-09-10-tenant-core-data-infrastructure/task.md`
- Evidence Directory: `.harness/evidence/2026-09-10-tenant-verification-and-gray/`
- Review File: `.harness/evidence/2026-09-10-tenant-verification-and-gray/review.md`

## Evidence Required

- hostile smoke JSON and runtime logs/traces
- migration/backup/restore/rollback report
- performance and observability dashboards/alerts
- independent final review with release recommendation and residual risks

## Human Gates

- gray release approval
- final production candidate or blocked decision
- any production migration or rollout approval

## Completion Checklist

- [ ] Layer and boundary declared
- [ ] Contract anchors read
- [ ] Tests or checks updated
- [ ] Verification run or exception recorded
- [ ] Evidence saved or summarized
- [ ] Review completed
