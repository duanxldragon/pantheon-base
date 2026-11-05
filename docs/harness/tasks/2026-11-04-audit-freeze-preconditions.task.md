---
title: 冻结前置收口（FE-01b + DB-01 注释诚实，2026-11-04 审计 §9）
doc_type: Remediation
layer: platform
status: Archived
depends_on_layers:
  - system/iam
  - platform
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/DEPLOYMENT_GUIDE.md
updated_at: 2026-11-04
---

# Task Packet: 2026-11-04-audit-freeze-preconditions

## Goal

闭合 2026-11-04 全局审计 §9 里还没写完、且不是维护者门禁的两项。FE-01b：权限工作台角色下拉与预热只取一页 `pageSize: 100`，把 `result.items` 当全集；角色 >100 时静默缺项。复用已有 `fetchAllPages`，不要新造 helper。DB-01：工作区已去掉 `AutoMigrate`，但注释把 bootstrap DDL 说成与迁移链逐字相同——它不是。注释改成「bootstrap 只保证模型读写的列，不是 000001 的全形」，并写明未跑迁移的全新启动不是支持路径。不要改 000001/000002/000024，不要恢复 AutoMigrate。

本包不提交已有工作区整改，不签冻结宣告。2026-11-03 整改仍是未提交工作区，不得写成已合并。FE-01b 从未进入 W1 `2026-11-03-audit-p1-pagination-data-consistency` 的 scope.in。

## Priority

`high`

## Estimated Complexity

`simple`

## Primary Layer

system/iam

## Dependency Layers

- `platform`（data-scope bootstrap 注释所在的 middleware；不改迁移文件）

## Dependencies

- blockedBy: `none`
- blocks: `none`

## Harness Profile

- Template: admin-platform
- Overlay: pantheon-base
- Quality Profile: behaviour
- Portable Failure Class: silent-truncation
- Owner Layer: foundation-source
- Ratchet Decision: none
- Coverage Dimensions:
  - behaviour
  - architecture-fitness

交付层级：**L1**。两处收口，不改合同、不改 CI 阈值、不改迁移。

## Workspace Context

- Target Repository: pantheon-base
- Repository Role: foundation-source
- Upstream Dependencies: pantheon-harness
- Downstream Consumers: pantheon-ops
- Sync Expectation: none
- Release Requirement: foundation-release
- Downstream Sync Note: 不改共享签名。ops lock 仍钉 `pantheon-base-v0.18.2` / `a44ae4e0`，本包不推进 lock。

## Contract Anchors

- `docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-11-04.md` §9 第 2、3 项
- `docs/contracts/PLATFORM_CONTRACT.md`
- `docs/DEPLOYMENT_GUIDE.md`
- `backend/pkg/database/migrations/000024_tenant_core_tables_repair.up.sql`（`tenant_id` 与 `uk_role_data_scope_tenant_role` 在 :201-221，不是 000020）

## Scope

### In

- `frontend/src/modules/system/iam/permission/PermissionList.tsx` 约 :227-236 与 `frontend/src/modules/system/iam/permission/index.ts` 约 :41：两处角色列表改走已有 `fetchAllPages`。不要把 100 留着假装取全。
- `backend/internal/middleware/data_scope_middleware.go` bootstrap 注释：删掉「must stay identical / 与迁移链逐字相同」。写明 DDL 只覆盖模型读写列（`id, tenant_id, role_key, mode, dept_ids` + `uk_role_data_scope_tenant_role`），不是 000001 全形（缺 `scope_defs` / `created_at` / `updated_at`）。未跑迁移、只靠这次 bootstrap 起的新库不是支持路径。
- 可选、不阻断：`system_modules_route_groups_test.go` 补每组 Capability / DataScope / RefreshSync 布尔断言。删掉一处 `WithCapability()` 现在测不出来。不做也不算本包失败。

### Out

- 提交已有 2026-11-03 工作区整改（审计 §9 第 1 项，维护者提交，本包不代做）
- 冻结宣告、GOV-08 阈值、`000031` 是否在生产执行（审计 §9 第 5 项）
- 改 GOV-05 的 `continue-on-error`，改 CI 阈值
- 改 `000001` / `000002` / `000024`，恢复 AutoMigrate，给 bootstrap DDL 补 000001 的历史列
- 重开 W1。FE-01 / FE-02 原引用点已在工作区改完，本包只补 W1 从未列入的 FE-01b
- 新功能、大重构、批量删文档、改 pantheon-ops、打 release
- 把 DB-02 菜单模型缺 `tenant_id`、DB-03 提交后副作用升成冻结前置

## Structural Scope

### Scope Quantification

- Modules affected: 1（IAM 权限工作台）+ 1 处 middleware 注释
- Files: 2 必改，1 可选测试
- API endpoints: 0
- Database migrations: no

### Risk Nodes

1. 只改 `PermissionList.tsx` 不改 `permission/index.ts` 预热，首屏仍是单页 100 - Mitigation: 两处一起改，验证计划里两处都要出现 `fetchAllPages`
2. 注释改完仍把「未跑迁移的全新启动」写成支持路径 - Mitigation: 注释必须写明该路径不支持；不补列

### Legacy Fields (for compatibility)

- Affected Subgraph: `PermissionList 角色下拉 / permission index 预热 -> fetchAllPages`；`MigrateDataScopePolicy bootstrap DDL 注释`
- Boundary Crossings: `system/iam 前端 -> 已有分页聚合`；`middleware 注释 -> 迁移链 000001/000002/000024（只读，不改文件）`
- Risk Nodes: `PermissionList.tsx` | `permission/index.ts` | `data_scope_middleware.go` 注释
- Graph Focus: `sensitive-input-flow`（角色下拉缺项 = 权限分配选不全；过称注释 = 把不支持的冷启动当成支持）

## Expected Files

### Create

- `docs/harness/tasks/2026-11-04-audit-freeze-preconditions.task.md`
- `.harness/tasks/2026-11-04-audit-freeze-preconditions/manifest.json`

### Modify

- `frontend/src/modules/system/iam/permission/PermissionList.tsx`
- `frontend/src/modules/system/iam/permission/index.ts`
- `backend/internal/middleware/data_scope_middleware.go`（只改注释，不改 DDL，不恢复 AutoMigrate）

### Do Not Touch

- `backend/pkg/database/migrations/**`
- `frontend/src/shared/utils/fetchAllPages.ts`（复用，不改 helper 语义）
- `pantheon-ops/**`
- `VERSION`、`CHANGELOG.md`
- `.github/workflows/**`（不改 GOV-05/08）
- `docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-11-03.md` 与其草稿
- `docs/reviews/PANTHEON_BASE_MAINTENANCE_FREEZE_DECLARATION.md`（不代签）

## Implementation Notes

- 规划者不得改 `frontend/src` 与 `backend/`。本文件只是任务包。实现交给生成器。
- FE-01b 两处与 HEAD 无 diff。W1 manifest 的 scope.in 只有 `fetchAllPages.ts`、`useUserList.ts` 两处 9999、`DeptList.tsx` 两处 1000、`dept/index.ts` 两处 1000。不要把「W1 已完成」读成 FE-01b 已修。
- `tenant_id` 权威是 `000024:201-221`。2026-11-03 data-scope 任务包写的 000020 是错的，不要沿用，也不要回改那份已归档历史包。
- 注释方案选「写明不支持」，不选「补列」。补列会让 bootstrap 继续假装自己是迁移链。`CREATE TABLE IF NOT EXISTS` 对已迁移库是空操作，已迁移库不受影响。
- 可选路由组布尔断言不做也不失败。做了也不要改中间件链本身。

## Minimum Viable Approach

- Selected Rung: `reuse`（`fetchAllPages` 已在）+ 改一句注释
- Why This Is Enough: 审计把这两项标成冻结前仅剩的未写产品改动和注释过称。不需要新 helper，不需要新迁移
- Upgrade Trigger: 若维护者决定「未跑迁移的全新启动」必须支持，再单独立项补列，不在本包里做

## Success Criteria

- Behaviour Outcome: 权限角色下拉与预热在角色 >100 时不再只拿第一页。bootstrap 注释不再声称与迁移链逐字相同
- Verification Signal: 两处调用点出现 `fetchAllPages`；`data_scope_middleware.go` 无 `AutoMigrate`、无 “must stay identical”；`go test` 相关包与前端类型检查按验证计划跑过或记下缺口
- Regression Watch: 不改 API cap，不改迁移文件，不改 `fetchAllPages` 终止条件
- Economics Watch: `none`

## Context Strategy

- Entry Sources: `docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-11-04.md` §9
- Retrieval Order: `entry -> summary -> raw`
- Retrieval Helpers: 读 W1 归档 manifest 确认 FE-01b 不在 scope.in
- Promotion Target: `none`
- Response Budget: `terse`
- Sensitive Context: `none`

## Execution Roles

- Implementer Posture: 只改两处前端调用和一处注释。不提交、不签冻结、不改迁移
- Reviewer Posture: 核对 FE-01b 两处都走 `fetchAllPages`；注释不再过称；000001/000002/000024 无 diff；AutoMigrate 没有回来

## Stop Points

- 若 `fetchAllPages` 在工作区不存在（只存在于未提交文件被丢掉），停止，不要新造 helper
- 若实现者开始改迁移文件或恢复 AutoMigrate，停止

## Technical Debt

- technicalDebtFlag: `no`
- technicalDebtNote: 不补 bootstrap 列是故意的。未跑迁移的冷启动保持不支持，不产生第二套建表权威

## Rollback Plan

- Trigger Condition: 角色下拉聚合在 total 少报时提前返回，比单页 100 更差且可复现
- Rollback Steps:
  1. 还原 `PermissionList.tsx` 与 `permission/index.ts` 两处调用
  2. 注释可留：诚实注释没有运行时副作用
- Rollback Verification:
  - [ ] Functionality verified
  - [ ] Data integrity verified
  - [ ] No side effects observed

## State Plan

- Checkpoint Expectation: 本包保持 Active，直到生成器改完两处调用和注释并留下证据。不要在只有任务包时把 manifest 标 completed
- Resume Artifacts: `.harness/tasks/2026-11-04-audit-freeze-preconditions/manifest.json`

## Verification Plan

### Backend

- `cd backend && gofmt -l internal/middleware/data_scope_middleware.go`
- 确认该文件无 `AutoMigrate`，注释含「不是支持路径」或等价否定，且不含 `must stay identical`
- 不跑会改库的迁移。不执行 `000031`

### Frontend

- 两处调用点引用 `fetchAllPages`
- `frontend` 下 `./node_modules/.bin/tsc -b --pretty false`
- 不要求重跑 `fetchAllPages` 单测，除非 helper 被改（本包禁止改 helper）

### Browser / Smoke

- none（无浏览器环境要求。角色 >100 的静默缺项是静态可证的调用形态，不是本包要现场造数的运行时证明）

## Linkage

- Task ID: `2026-11-04-audit-freeze-preconditions`
- Task Manifest: `.harness/tasks/2026-11-04-audit-freeze-preconditions/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Plan References: `docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-11-04.md` §9
- Evidence Directory: `.harness/evidence/2026-11-04-audit-freeze-preconditions/`
- Review File: `.harness/evidence/2026-11-04-audit-freeze-preconditions/review.md`

## Evidence Required

- 实现完成后才写 `commands.json` / `summary.md` / `review.md`。本规划轮不写 summary，避免把未做的包标成完成
- summary 必须写明：工作区 2026-11-03 整改仍未合并；FE-01b 不在 W1；`tenant_id` 引用 000024 不是 000020

## Human Gates

- 提交已有工作区整改到 main：维护者。提交时不要把工作区说成已经冻结
- 冻结宣告、GOV-08 一句话、`000031` 是否在生产执行：维护者。GOV-05 保持现状
- 本包的两处代码改动不是门禁策略，生成器可直接做。规划者本轮不代改 `frontend/src` 与 `backend/`

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] FE-01b 两处都走 `fetchAllPages`，没有新 helper
- [x] DB-01 注释不再声称与迁移链逐字相同，并写明未跑迁移的全新启动不是支持路径
- [x] 000001/000002/000024 无 diff，AutoMigrate 未恢复
- [x] 未签冻结，未改 GOV-05/08，未执行 000031，未改 ops
- [x] 可选路由组布尔棘轮已补：删一处 `WithCapability()` / `WithDataScope()` 或改 refresh 布尔会失败。未改中间件链
