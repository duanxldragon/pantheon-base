---
title: S3 role data-scope 镜像模型去重任务包（删除副本，改用 permission 权威模型）
doc_type: Remediation
layer: system/iam
depends_on_layers: []
status: Active
linked_contracts:
  - docs/contracts/SYSTEM_IAM_CONTRACT.md
  - docs/designs/PERMISSION_MODEL.md
  - docs/reviews/ROLE_DATA_SCOPE_MODEL_DRIFT_2026-10-27.md
updated_at: 2026-10-28
---

# Task Packet: 2026-10-27-s3-role-data-scope-model

## Goal

`role_service.go` 自带一份 role data-scope policy 模型副本，注释写着「镜像另一目录的模型以
避免跨目录 import」，delete 路径同时写两张表。刻意重复也会漂移。本波次先做字段级 diff（模型
互比 + 对照迁移历史），证明两份定义仍完全一致；一致则把 role 包切到 permission 包的权威模型并
删除副本。结论：字段/tag 完全一致，role 包本就 import 了 permission 包（无环），删除副本严格
优于「保留 + 加 checker」。

## Primary Layer

system/iam

`system/iam` 内部（role ↔ permission 同层引用）。本波次不改任何表、迁移、data-scope 解析结果
或权限结果。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `not-required`
- Release Requirement: `none`
- Downstream Sync Note: 纯包内类型归并，无接口/DB/行为变化。

## Dependency Layers

- `system/iam`（role、permission）

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `permission-policy`
- Portable Failure Class: `model-drift`
- Owner Layer: `consumer-repository`
- Ratchet Decision: `sensor-added`（一致性由单一权威模型结构性保证，无需新增脚本 checker）
- Coverage Dimensions:
  - behaviour
  - maintainability
  - architecture-fitness

交付层级：**L1**（调查 + 机械去重；evidence + review 收口）。

## Contract Anchors

- `docs/contracts/SYSTEM_IAM_CONTRACT.md`
- `docs/designs/PERMISSION_MODEL.md`（data-scope 五模式语义）
- 迁移链：`000001` → `000002` → `000020`（`system_role_data_scope` 的演进）
- `docs/reviews/ROLE_DATA_SCOPE_MODEL_DRIFT_2026-10-27.md`（本波次交付的字段级 diff）

## Scope

### In

- 两份模型定义逐字段逐 tag 对照，并对照 live schema 的迁移定义
- 证伪/证实一致后：role 包改用 `permission.PermissionRoleDataScopePolicy`，删除本地副本
- 保持 delete 路径仍写同两张表

### Out

- 建表、删表、改表
- 新增或编辑迁移
- 改变 data-scope 解析或权限结果
- 把表跨包迁移当作 schema 变更
- 新增脚本 checker（单权威模型已消除漂移面，且新 gate 需维护者批准）

## Expected Files

### Create

- `docs/reviews/ROLE_DATA_SCOPE_MODEL_DRIFT_2026-10-27.md`

### Modify

- `backend/modules/system/iam/role/role_service.go`（删除镜像模型结构体，4+ 引用改
  `permission.PermissionRoleDataScopePolicy`）
- role 包内引用该类型的测试文件（`role_data_scope_tenant_test.go`、`role_service_test.go`、
  `role_data_scope_preserve_test.go`）

### Do Not Touch

- `backend/pkg/database/migrations/**`
- `backend/modules/system/iam/permission/**`（权威模型不动）
- `database/**`

## Implementation Notes

- 结论先行：diff 六字段 + gorm tag 完全一致（ID/TenantID/RoleID/RoleKey/DataScope/
  CreatedAt/UpdatedAt），唯一「差异」在迁移侧索引命名（`uk_` vs `idx_`）与历史遗留
  `scope_defs` 列，属 schema-vs-model 落差，不在本波次修（migrations 禁改）。
- role 包在 `role_service.go` 已 import permission（用于 data-scope 解析），因此改用权威模型
  不引入新依赖、不产生环。
- 删除副本后，role 的 delete 路径仍用同一表名对 `system_role_data_scope` 落操作，行为不变。

## Verification Plan

- `cd backend && go build ./...` → 0
- `cd backend && go vet ./...` → 0
- `cd backend && go test -count=1 ./modules/system/iam/role/... ./modules/system/iam/permission/...` → 全绿
- `grep -rn "roleDataScopePolicy" backend --include=*.go` → 0
- `grep -rn "role_data_scope_policy" backend --include=*.go` → 仅注释/迁移引用可接受

## Linkage

- Task ID: `2026-10-27-s3-role-data-scope-model`
- Task Manifest: `.harness/tasks/2026-10-27-s3-role-data-scope-model/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/harness/tasks/2026-10-27-codebase-simplification-program.task.md`、
  `docs/designs/PERMISSION_MODEL.md`
- Evidence Directory: `.harness/evidence/2026-10-27-s3-role-data-scope-model/`
- Review File: `.harness/evidence/2026-10-27-s3-role-data-scope-model/review.md`
- Parent: `docs/harness/tasks/2026-10-27-codebase-simplification-program.task.md`
- Depends On: `2026-10-27-s3-tenant-scope-unification`

## Evidence Required

- `.harness/evidence/2026-10-27-s3-role-data-scope-model/commands.json`
- `.harness/evidence/2026-10-27-s3-role-data-scope-model/model-diff.md`
- `.harness/evidence/2026-10-27-s3-role-data-scope-model/summary.md`（含 keep-or-move 决策）
- `.harness/evidence/2026-10-27-s3-role-data-scope-model/review.md`

## Human Gates

- 决策为「删除副本、改用权威模型」，而非「保留镜像 + 新增 checker」——已由本包记录理由
  （无环、单权威模型结构性消除漂移）。若维护者倾向独立 checker，可后续补。
- 未新增 gate 脚本，无需门禁变更审批。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] 字段级漂移报告存在（逐字段逐 tag）
- [x] 决策已记录：共享权威模型（删除镜像），无需 divergence checker
- [x] 无 schema、迁移或 data-scope 行为变化
