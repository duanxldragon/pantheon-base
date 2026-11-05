---
title: system_role_data_scope 运行时 AutoMigrate 收口（DB-01，P2）
doc_type: Remediation
layer: platform
status: Archived
depends_on_layers:
  - system/iam
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/DEPLOYMENT_GUIDE.md
updated_at: 2026-11-03
---

# Task Packet: 2026-11-03-audit-p2-data-scope-automigrate

## Goal

收口 DB-01（P2）：`data_scope_middleware.go:61-62` 在 `ShouldAutoMigrate()` 门控内对 `SystemRoleDataScope` 单表做运行时 `AutoMigrate`。该表形状已由版本化迁移链完全持有（`000001` 建表、`000002` 补列、`000020` 加 `tenant_id` + 唯一索引），运行期 AutoMigrate 在 dev 模式可能重放模型形状造成与迁移链漂移。目标：迁移表成为唯一 schema 权威，运行时仅保留「表不存在才 CREATE IF NOT EXISTS」的兜底。

## Priority

`medium`

## Estimated Complexity

`simple`

## Primary Layer

system/iam

## Dependency Layers

- `platform`（database package、启动装配）

## Dependencies

- blockedBy: `none`
- blocks: `none`

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `architecture-fitness`
- Portable Failure Class: `migration-vs-automigrate-drift`
- Owner Layer: `foundation-source`
- Ratchet Decision: `gate-updated`
- Coverage Dimensions:
  - architecture-fitness
  - behaviour
  - runtime-quality

交付层级：**L2**（触碰数据库启动行为，虽为 dev-only 门控，仍属 gate-policy 邻近面）。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: none
- Release Requirement: foundation-release
- Downstream Sync Note: 本包只改 dev 模式行为（生产 `ShouldAutoMigrate()==false` 不受影响）；ops 生产部署无变化，dev 快照无迁移面。

## Contract Anchors

- `docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-11-03.md` §11（DB-01）
- `docs/contracts/PLATFORM_CONTRACT.md`（平台表禁止 AutoMigrate，见 DEPLOYMENT_GUIDE §3）
- `docs/DEPLOYMENT_GUIDE.md` §3（平台 schema 以版本化迁移为唯一权威）
- `backend/pkg/database/migrations/000001_init_schema.up.sql`（建表 at :367）、`backend/pkg/database/migrations/000002_align_runtime_schema.up.sql`（补列 :197）、`backend/pkg/database/migrations/000020_tenant_phase1_core_tables.up.sql`（tenant_id + 唯一索引 :562）

## Scope

### In

- 核对迁移链已持有 `system_role_data_scope` 最终形状（tenant_id + `uk_role_data_scope_tenant_role` 唯一索引 + 全部列）——先证后改
- 移除 `data_scope_middleware.go:61-62` 的 `ShouldAutoMigrate()` AutoMigrate 分支；保留 `!cachedHasTable` 分支的 `CREATE TABLE IF NOT EXISTS` 兜底（防冷启动建表后再走迁移）
- 结构断言测试：迁移后表形状 == `SystemRoleDataScope` 模型期望（列/索引/唯一键），防未来模型与迁移漂移
- 确认 `cachedHasTable` / `storeCachedTableExistence` 行为不变

### Out

- 修改迁移文件本身（`000001`/`000002`/`000020` 一律不动——历史迁移不可改写）
- 改动 `MigrateDataScopePolicy` 的非 AutoMigrate 逻辑（`cachedHasTable` 兜底路径）
- 改动其他任何表的 AutoMigrate（DB-01 只涉单表）
- 触碰 `pantheon-ops`、`VERSION`、`CHANGELOG.md`

## Structural Scope

### Scope Quantification

- Modules affected: 1（IAM 数据权限）
- Files: 约 3（middleware、测试、evidence）
- API endpoints: 0
- Database migrations: no（不新增/修改迁移文件）

### Risk Nodes

1. 移除 AutoMigrate 后若迁移链未持有某列，dev 冷启动表缺列 → 查询失败 - Mitigation: 先逐列比对迁移链持有形状，断言测试钉住
2. `CREATE TABLE IF NOT EXISTS` 兜底若与迁移顺序冲突 - Mitigation: 兜底只在表不存在时跑 CREATE（不含列变更），保留对已存在表零操作语义

### Legacy Fields (for compatibility)

- Affected Subgraph: `MigrateDataScopePolicy -> ShouldAutoMigrate 门控 / cachedHasTable 兜底`；`000001/000002/000020 迁移链`
- Boundary Crossings: `system/iam 数据权限 -> database 迁移层`
- Risk Nodes: `data_scope_middleware.go` | `SystemRoleDataScope` 模型 | 迁移 000003 内对 system_role_data_scope 的引用
- Graph Focus: `sensitive-input-flow`（行级策略表，缺列 = 权限读错）

## Expected Files

### Create

- `backend/internal/middleware/data_scope_migrate_test.go` 或等价：迁移形状 vs 模型形状断言

### Modify

- `backend/internal/middleware/data_scope_middleware.go`（移除 AutoMigrate 分支）
- `.harness/evidence/2026-11-03-audit-p2-data-scope-automigrate/{commands.json,summary.md,review.md}`

### Do Not Touch

- `backend/pkg/database/migrations/**`（历史迁移不可改写）
- `backend/pkg/database/migrate.go`（`ShouldAutoMigrate` 语义）
- `backend/modules/**` 其他表 AutoMigrate
- `docs/DEPLOYMENT_GUIDE.md`（IN:只核对，不扩散禁例）
- `pantheon-ops/**`、`VERSION`、`CHANGELOG.md`

## Implementation Notes

- 先读 `000001` 建表语句 + `000002` ALTER + `000020` tenant_id 列/索引，与 `SystemRoleDataScope` 模型字段逐一对应（`role_key` 长度 64 / `tenant_id` uint + 唯一索引 `uk_role_data_scope_tenant_role`），把比对表写进 evidence——**证先于改**。
- AutoMigrate 移除后，dev 冷启动路径：迁移链建表 → `cachedHasTable` 命 true 不再走 CREATE；若迁移未跑（`ShouldAutoMigrate` 模式）且表不存在 → CREATE IF NOT EXISTS 兜底。两条路径都自洽。
- 结构断言测试用 sqlite（`file::memory:`）或 mock migrator 跑 CREATE 后读 information_schema 形状，不依赖真实 MySQL（与既有 `migrate_down_shape_test.go` 风格一致）。
- `MigrateDataScopePolicy` 的调用点（若在启动链或 data_scope_middleware 初始化）保持不变，只在函数内部削分支。

## Minimum Viable Approach

- Selected Rung: `small local code`（削一个 if 分支 + 一个断言测试）
- Why This Is Enough: 迁移链已持有形状，削掉 dev-only AutoMigrate 是纯收敛，不需要新抽象
- Upgrade Trigger: 若未来表形状继续演进，迁移文件才是唯一改法（模型 side-effect 不再自动补列）

## Success Criteria

- Behaviour Outcome: dev 模式启动不再对 `system_role_data_scope` 跑 AutoMigrate；表形状由迁移链权威决定
- Verification Signal: `go build ./... && go vet ./... && go test ./... -short` 全绿 + 形状断言测试绿；grep `AutoMigrate` in `data_scope_middleware.go` 0 命中
- Regression Watch: 生产路径（`ShouldAutoMigrate()==false`）行为零变化；行级数据权限读取不变
- Economics Watch: `none`

## Context Strategy

- Entry Sources: 审计报告 §11（DB-01）、`data_scope_middleware.go`、三个迁移文件
- Retrieval Order: `entry -> summary -> raw`
- Retrieval Helpers: 读取迁移 SQL 与模型定义逐列对比
- Promotion Target: `none`
- Response Budget: `terse`
- Sensitive Context: `none`

## Execution Roles

- Implementer Posture: 先产出迁移链 vs 模型逐列比对表，再削分支；削后跑全量 test 与形状断言
- Reviewer Posture: 确认 AutoMigrate 分支确实被移除且兜底保留；比对表正确；无迁移文件被改

## Stop Points

- 若比对发现迁移链**未**持有某列/索引（模型比迁移新），停止并交维护者补迁移，不静默削分支

## Technical Debt

- technicalDebtFlag: `no`
- technicalDebtNote: 消除 dev 模式双 schema 权威；形状断言测试防挂表模型漂移，不产生新债

## Rollback Plan

**Required for destructive changes.**

- Trigger Condition: 移除 AutoMigrate 后 dev 冷启动建表缺列导致查询失败
- Rollback Steps:
  1. `git revert <commit-hash>`
  2. 恢复 AutoMigrate 分支（连同断言测试保留）
- Rollback Verification:
  - [ ] Functionality verified
  - [ ] Data integrity verified
  - [ ] No side effects observed

## State Plan

- Checkpoint Expectation: 形状比对表完成后再动手
- Resume Artifacts: `.harness/evidence/2026-11-03-audit-p2-data-scope-automigrate/summary.md`

## Verification Plan

### Backend

- `cd backend && go build ./... && go vet ./... && gofmt -l internal/middleware/`
- `cd backend && go test ./internal/middleware/ -run DataScope -v`（含形状断言）
- `cd backend && go test ./... -short`（46/46 包）
- `grep -n "AutoMigrate" backend/internal/middleware/data_scope_middleware.go` → 0 命中

### Frontend

- 不涉及

### Browser / Smoke

- none（无浏览器/真实 MySQL 环境；以形状断言 + 单测为 evidence）

## Linkage

- Task ID: `2026-11-03-audit-p2-data-scope-automigrate`
- Task Manifest: `.harness/tasks/2026-11-03-audit-p2-data-scope-automigrate/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Plan References: `docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-11-03.md` §11（DB-01）
- Evidence Directory: `.harness/evidence/2026-11-03-audit-p2-data-scope-automigrate/`
- Review File: `.harness/evidence/2026-11-03-audit-p2-data-scope-automigrate/review.md`

## Evidence Required

- `commands.json`：build/vet/test-short + 形状断言读数 + grep AutoMigrate 0 命中
- `summary.md`：迁移链 vs 模型逐列比对表、削分支前后对照
- `review.md`：逐条 reviewer posture；「生产路径零变化」的证明

## Human Gates

- dev 模式 AutoMigrate 收敛属 gate-policy 邻近动作：非作者 Reviewer 确认生产 `ShouldAutoMigrate()==false` 路径零变化。
- 若比对发现迁移链与模型不一致，交维护者决定（补迁移 vs 调整模型），不静默处理。

## Completion Checklist

- [ ] Layer and boundary declared
- [ ] Contract anchors read
- [ ] Verification run or exception recorded
- [ ] Evidence saved or summarized
- [ ] Review completed
- [ ] 形状比对表完成且迁移链持有全部列/索引
- [ ] AutoMigrate 分支已移除、CREATE IF NOT EXISTS 兜底保留
- [ ] 形状断言测试绿、grep 0 命中
- [ ] 无迁移文件被修改
- [ ] 生产路径零变化已证明