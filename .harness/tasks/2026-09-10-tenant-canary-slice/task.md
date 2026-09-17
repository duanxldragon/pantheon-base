# Task Packet: Tenant Canary Slice

## Goal

在 feature flag/可回退边界内，为一个真实低风险资源实现端到端租户隔离垂直切片，并用双租户 hostile tests 证明合同可行。

## Priority

`critical`

## Estimated Complexity

`epic`

## Primary Layer

system/config

## Dependency Layers

- tenant contract
- migration runbook
- system/auth and system/iam
- database, cache and file boundary

## Dependencies

- blockedBy: `2026-09-10-tenant-ready-guardrails`, `2026-09-10-tenant-contract-design`, `2026-09-10-tenant-migration-runbook`
- blocks: `2026-09-10-tenant-core-auth-iam`, `2026-09-10-tenant-core-data-infrastructure`

## Harness Profile

- Template: `api-service`
- Overlay: `tenant-canary`
- Coverage Dimensions:
  - behaviour
  - runtime-quality
  - architecture-fitness
  - maintainability

## Contract Anchors

- `docs/designs/TENANT_CONTRACT_V1.md`
- `docs/runbooks/TENANT_MIGRATION_RUNBOOK.md`
- `docs/contracts/SYSTEM_CONFIG_CONTRACT.md`
- `docs/designs/DICT_AND_SETTING_DESIGN.md`
- `docs/designs/TENANT_READY_SINGLE_TENANT_DESIGN.md`

## Scope

### In

- 选择一个经 scope 矩阵批准的低风险 config/setting 类资源作为 canary。
- 实现可信 tenant context 到 query、write、update、delete、batch、export 的完整传递。
- 实现 tenant-local uniqueness、租户过滤与部门 DataScope 的组合授权。
- 覆盖审计事件、Redis key、文件/object key（若资源涉及）和异步任务边界。
- 使用两个租户 fixture 验证 ID 篡改、伪造 Header/claim、批量与导出、并发和单租户兼容模式。
- 全程 feature flag 或等价可回退开关，记录开关默认值和 kill switch。

### Out

- 不迁移全仓 system_user/role/dept/post 或全部业务表。
- 不新增第二种 tenant resolution，不启用域名发现、计费、套餐、独立 schema/database。
- 不把 canary 结果直接解释为全系统生产就绪。

## Assumptions and Open Questions

- Confirmed Facts: 当前系统没有统一 tenant context；现有 DataScope 不能替代租户过滤。
- Working Assumptions: canary 资源可在隔离 fixture 中验证，不需要生产数据迁移。
- Open Questions: 具体资源由合同 reviewer 从 scope 矩阵批准；未批准前不得编码。

## Minimum Viable Approach

- Selected Rung: `small local code`
- Why This Is Enough: 只实现一个真实垂直切片，验证端到端契约和默认拒绝，避免全仓横切改造。
- Upgrade Trigger: 只有 canary 证据通过后才允许拆分核心 auth/IAM/data 任务。

## Success Criteria

- Behaviour Outcome: 两个租户可拥有规则允许的同名数据，任意跨租户读取/写入/导出/缓存命中均被拒绝或隔离。
- Verification Signal: 双租户 integration/contract tests、runtime smoke、audit/cache/file evidence 全部通过。
- Regression Watch: flag 关闭时单租户行为、API 响应和数据权限保持兼容。
- Economics Watch: 记录每次查询过滤、批量和导出的性能基线，不允许无界扫描。

## Structural Scope

- Affected Subgraph: request auth -> tenant context -> config repository/service -> audit/export/cache/file -> response
- Boundary Crossings: system/auth -> system/config -> platform observability
- Risk Nodes: context spoofing; missing filter; batch/export path; cache/file key collision
- Graph Focus: sensitive-input-flow, call-depth and hub-check

## Expected Files

### Create

- `.harness/tasks/2026-09-10-tenant-canary-slice/manifest.json`
- `.harness/evidence/2026-09-10-tenant-canary-slice/summary.md`
- `.harness/evidence/2026-09-10-tenant-canary-slice/review.md`
- canary fixtures, isolation tests and feature-flag contract tests

### Modify

- only the approved canary resource's handler/service/repository/schema/test paths
- feature flag and runtime smoke configuration

### Do Not Touch

- unrelated system tables and global auth/IAM paths
- production migration execution
- `pantheon-ops`

## Implementation Notes

- Tenant context must be derived from the approved trusted source, not an arbitrary client Header.
- Missing or conflicting context is deny-by-default for tenant resources.
- Every read and write path must be tested, including count, joins, batch, export and async callbacks.
- Flag-off path must be covered before flag-on rollout.

## Execution Roles

- Implementer Posture: vertical-slice implementer; keep diff narrow and reversible
- Reviewer Posture: adversarial isolation reviewer; attempt cross-tenant reads/writes and context forgery

## Stop Points

- 任一跨租户泄漏、默认放行、缓存/文件串租户或不可回退行为出现时立即关闭 flag 并回到合同阶段。
- 需要修改全仓 schema/auth/IAM 才能继续时拆分新任务，不扩大 canary。

## Rollback Plan

- Trigger Condition: any isolation test or runtime smoke detects leakage or flag-off regression.
- Rollback Steps:
  1. disable the canary feature flag
  2. restore canary fixture/schema snapshot and invalidate cache/file fixtures
  3. revert only the canary change and preserve evidence
- Rollback Verification:
  - [ ] Cross-tenant access is denied after rollback
  - [ ] Single-tenant smoke passes with flag off
  - [ ] No fixture/data side effects remain

## Verification Plan

### Backend

- `go test ./...`
- focused canary integration and cross-tenant tests

### Frontend

- `npm run type-check` and `npm run lint` if canary API/UI is exposed

### Browser / Smoke

- two-tenant login/list/detail/create/update/delete/batch/export smoke with flag on and off

## Linkage

- Task ID: `2026-09-10-tenant-canary-slice`
- Task Manifest: `.harness/tasks/2026-09-10-tenant-canary-slice/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Plan References: `.harness/tasks/TENANT_EVOLUTION_MASTER_PLAN_20260910.md`; `.harness/tasks/2026-09-10-tenant-contract-design/task.md`; `.harness/tasks/2026-09-10-tenant-migration-runbook/task.md`
- Evidence Directory: `.harness/evidence/2026-09-10-tenant-canary-slice/`
- Review File: `.harness/evidence/2026-09-10-tenant-canary-slice/review.md`

## Evidence Required

- flag-on/flag-off runtime logs and smoke JSON
- cross-tenant negative tests, batch/export/concurrency evidence
- audit/cache/file boundary evidence where applicable
- performance signal and reviewer report

## Human Gates

- canary resource and flag-on approval
- isolation evidence review before extending beyond the canary

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Tests or checks updated
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
