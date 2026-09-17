# Task Packet: Tenant Core Data Infrastructure

## Goal

在 auth/IAM tenant 语义稳定后，逐切片隔离配置、字典、审计、导出、上传、缓存、dashboard、后台任务和动态模块。

## Priority

`high`

## Estimated Complexity

`epic`

## Primary Layer

system/config

## Dependency Layers

- system/auth and system/iam
- platform dashboard and audit
- upload/storage and dynamic module generator
- tenant migration runbook

## Dependencies

- blockedBy: `2026-09-10-tenant-core-auth-iam`
- blocks: `2026-09-10-tenant-verification-and-gray`

## Harness Profile

- Template: `api-service`
- Overlay: `cross-cutting-isolation`
- Coverage Dimensions:
  - behaviour
  - runtime-quality
  - architecture-fitness
  - maintainability

## Contract Anchors

- `docs/designs/TENANT_CONTRACT_V1.md`
- `docs/designs/DICT_AND_SETTING_DESIGN.md`
- `docs/designs/UPLOAD_AND_STORAGE_DESIGN.md`
- `docs/designs/PLATFORM_DASHBOARD_DESIGN.md`
- `docs/contracts/SYSTEM_CONFIG_CONTRACT.md`
- `docs/contracts/PLATFORM_CONTRACT.md`

## Scope

### In

- 按 scope 矩阵实现 settings/dict 的 tenant override、继承和唯一键。
- 审计、操作日志、安全事件、导入导出按 tenant filter 和授权检索。
- 上传对象 key、下载授权、Redis/cache prefix、session-adjacent cache 按 tenant 隔离。
- dashboard aggregate、后台任务、异步回调和动态模块/生成器的 tenant context 传递。
- 每个切片补 migration、contract/isolation tests、回滚说明和 runtime evidence。

### Out

- 不新增套餐、计费、License、域名、自助注册或独立数据库。
- 不覆盖未在 scope 矩阵批准的业务表。
- 不以“调用者记得加 tenant_id”作为唯一安全措施。

## Assumptions and Open Questions

- Confirmed Facts: 现有 settings/dict/audit/export/upload/dashboard/cache/生成器路径并不天然带 tenant 维度。
- Working Assumptions: auth/IAM 提供统一 context 和默认拒绝入口，data slices 复用该入口。
- Open Questions: 大型 dashboard aggregate 和异步任务的性能容量需以验证任务测量后决定。

## Minimum Viable Approach

- Selected Rung: `small local code`
- Why This Is Enough: 按跨切片边界逐项补隔离、负向测试和观测，不做全仓手工加字段的单次大改。
- Upgrade Trigger: 性能或容量证据不足时另开专项，不用降低隔离要求。

## Success Criteria

- Behaviour Outcome: 租户用户只能看到被授权租户的配置、日志、导出、文件和聚合；platform-global 资源的跨租户行为均显式记录和授权。
- Verification Signal: 每类 cross-cutting path 均有 tenant isolation tests、runtime logs/metrics 和 reviewer sign-off。
- Regression Watch: 审计可检索性、导入导出、下载、dashboard、动态模块和单租户兼容行为保持可用。
- Economics Watch: 记录导出行数、aggregate 查询耗时、缓存命中率、对象存储 key cardinality。

## Structural Scope

- Affected Subgraph: tenant context -> config/dict/audit/export/upload/cache/dashboard/async/generator -> response/side effect
- Boundary Crossings: system/auth -> system/config -> platform -> storage/queue/lowcode
- Risk Nodes: export leakage; cache/file collision; async context loss; aggregate cross-tenant joins
- Graph Focus: sensitive-input-flow, call-depth and hub-check

## Expected Files

### Create

- `.harness/tasks/2026-09-10-tenant-core-data-infrastructure/manifest.json`
- `.harness/evidence/2026-09-10-tenant-core-data-infrastructure/summary.md`
- `.harness/evidence/2026-09-10-tenant-core-data-infrastructure/review.md`
- slice migrations, isolation tests, smoke and observability fixtures

### Modify

- approved config/dict/audit/export/upload/cache/dashboard/task/dynamic-module paths
- related API, repository, job and generator tests

### Do Not Touch

- auth/IAM contract and token semantics except consumed interfaces
- unapproved business tables and `pantheon-ops`

## Implementation Notes

- Export/count/aggregate/batch paths receive the same tenant context as list/detail paths.
- Cache and object keys must include canonical tenant identity and be covered by collision tests.
- Async jobs persist tenant context explicitly; ambient request context is not sufficient.
- Dynamic module templates must reject tenant-unaware generated access paths.

## Execution Roles

- Implementer Posture: cross-cutting data isolation implementer; slice-by-slice delivery
- Reviewer Posture: data leakage/performance reviewer; inspect joins, exports, async and storage paths

## Stop Points

- 发现导出、聚合、缓存、文件或异步任一路径无法证明 tenant boundary 时停止该 slice。
- 需要修改 auth/IAM contract 时回到前置任务，不在本任务旁路。

## Rollback Plan

- Trigger Condition: data/export/cache/file leakage, async context loss or unacceptable performance regression.
- Rollback Steps:
  1. disable the affected slice flag
  2. invalidate tenant-prefixed cache and quarantine affected object fixtures
  3. restore slice migration snapshot and rerun audit/export integrity checks
- Rollback Verification:
  - [ ] No cross-tenant artifact is downloadable or queryable
  - [ ] Single-tenant paths pass
  - [ ] Audit records identify rollback and affected slice

## Verification Plan

### Backend

- `go test ./...`
- focused isolation/contract tests for each slice
- export, aggregate, cache, object-key and async tests

### Frontend

- `npm run type-check` and `npm run lint` when config/dashboard/generator UI changes

### Browser / Smoke

- two-tenant settings/dict/audit/export/upload/dashboard/dynamic-module smoke

## Linkage

- Task ID: `2026-09-10-tenant-core-data-infrastructure`
- Task Manifest: `.harness/tasks/2026-09-10-tenant-core-data-infrastructure/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Plan References: `.harness/tasks/TENANT_EVOLUTION_MASTER_PLAN_20260910.md`; `.harness/tasks/2026-09-10-tenant-core-auth-iam/task.md`
- Evidence Directory: `.harness/evidence/2026-09-10-tenant-core-data-infrastructure/`
- Review File: `.harness/evidence/2026-09-10-tenant-core-data-infrastructure/review.md`

## Evidence Required

- per-slice migration and rollback evidence
- tenant isolation tests for read/write/batch/export/aggregate/async
- cache/file/object-key collision and authorization evidence
- runtime metrics/logs and reviewer summary

## Human Gates

- each schema/storage/audit/export scope change
- dashboard/async production rollout approval
- cross-cutting isolation review before gray release

## Completion Checklist

- [ ] Layer and boundary declared
- [ ] Contract anchors read
- [ ] Tests or checks updated
- [ ] Verification run or exception recorded
- [ ] Evidence saved or summarized
- [ ] Review completed
