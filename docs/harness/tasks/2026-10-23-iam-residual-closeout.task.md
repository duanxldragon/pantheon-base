---
title: v0.17.3 后残余收口任务包（用户导入租户越界 + 授权写入幂等 + 重复键竞态）
doc_type: Remediation
layer: platform
depends_on_layers:
  - system/iam
status: Active
linked_contracts:
  - docs/contracts/TENANT_CONTRACT_V1.md
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-10-23
---

# Task Packet: 2026-10-23-iam-residual-closeout

## Goal

v0.17.3 的 known-residual 只登记了「`system_role_data_scope` / `system_role_permission`
写入仍先查后写，竞态失败会 500」。按实际代码复核后，范围比登记的大，且有一项从未登记：

1. **用户 CSV 导入跨租户读写**（未登记，P1）：`loadUserImportLookups` 的四类查找
   （同名用户、角色 key、部门路径、岗位编码）全部未加租户过滤；建号路径也没有写
   `tenant_id`，也没有写成员关系。租户 A 导入一个与租户 B 同名的用户，会更新 B 的用户；
   新建用户则落进平台命名空间，导入者看不到、也登不进。
2. **角色/用户创建的重复键竞态**（P2）：key/username 先查后插，并发下都通过预检，
   输家命中 UNIQUE 索引后把 MySQL 1062 当成 500 抛出。
3. **授权写入先查后插**（P2）：`grantTenantRolePermissions` / `grantTenantRoleMenus`
   逐行 `Create`，并发修复会重复插入；`backfillRolePermissions` 的 select 没有 join
   `system_role`，租户角色的权限行全部盖成 `tenant_id = 0`，且同一 key 被多个菜单
   暴露时会重复 seed。
4. **登记文案过期**（P3）：`upsertRoleDataScopePolicy` 早已使用
   `clause.OnConflict`，v0.17.3 notes 仍称其「先查后写」；本轮修复后
   `system_role_permission` 也不再属于该残留。

本包把 1–3 变成代码修复 + 真实 MySQL 回归，4 记录为文案更正。

## Primary Layer

platform

改动集中在 `system/iam/user`（导入与建号）与 `system/iam/role`、`system/iam/tenant`
（授权写入）。无 schema、路由、权限码、菜单 seed 或错误信封变更；唯一响应变化是
竞态输家由 500 变为既有 409。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `required`
- Release Requirement: `foundation-release`
- Downstream Sync Note: 无 schema 变更（仍为 29）；导入行为与竞态错误码变化，
  `pantheon-ops` 可在下一次 foundation release 后同步。

## Dependency Layers

- `system/iam/user`：`user_export.go`（导入查找与建号）、`user_helper.go`（四类查找）、
  `user_service.go`（CreateUser 冲突整形）。
- `system/iam/role`：`role_service.go`（Create/Update 冲突整形）、`role_helper.go`（backfill）。
- `system/iam/tenant`：`tenant_provision.go`（permission/menu 授权幂等写入）。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `permission-policy`
- Portable Failure Class: `tenant-scope-escape` / `unique-key-race` / `non-idempotent-repair`
- Owner Layer: `consumer-repository`
- Ratchet Decision: `test-added`
- Coverage Dimensions:
  - behaviour
  - runtime-quality
  - architecture-fitness

## Scope

### In

- 用户导入的四类查找全部按调用方租户过滤；导入新建用户写入 `tenantOwnerID()` 并
  在同一个事务里写 active membership。
- `CreateUser` / `CreateRole` / `UpdateRole` 的事务错误经 `database.IsDuplicateKey`
  整形为既有 409 冲突。
- `grantTenantRolePermissions` / `grantTenantRoleMenus` 改为批量
  `CreateInBatches` + `clause.OnConflict{DoNothing:true}`。
- `backfillRolePermissions` join `system_role` 取 `tenant_id`、排除软删除角色、
  按自然键去重后用 `OnConflict` 批量写入。
- 新增真实 MySQL 回归：跨租户导入隔离、并发创建/改名冲突、授权幂等、backfill
  租户归属与去重。

### Out

- 数据库 schema / migration（保持 29）。
- 路由、权限码、菜单 seed、错误信封。
- 既有发布流程、门禁阈值或前端行为。
- 已发布的 v0.17.3 tag 与资产。

## Expected Files

### Create

- `backend/modules/system/iam/user/user_import_tenant_test.go`
- `backend/modules/system/iam/user/user_concurrency_test.go`
- `backend/modules/system/iam/role/role_concurrency_test.go`
- `backend/modules/system/iam/role/role_backfill_test.go`
- `backend/modules/system/iam/tenant/tenant_provision_permissions_test.go`
- `docs/harness/tasks/2026-10-23-iam-residual-closeout.task.md`
- `.harness/tasks/2026-10-23-iam-residual-closeout/manifest.json`
- `.harness/evidence/2026-10-23-iam-residual-closeout/{summary.md,review.md,commands.json}`

### Modify

- `backend/modules/system/iam/user/{user_export.go,user_helper.go,user_service.go}`
- `backend/modules/system/iam/role/{role_helper.go,role_service.go}`
- `backend/modules/system/iam/tenant/tenant_provision.go`

### Do Not Touch

- `backend/pkg/database/migrations/**`
- `.github/workflows/**`
- 已发布的 v0.17.3 tag 与资产

## Contract Anchors

- `docs/contracts/TENANT_CONTRACT_V1.md` §2.3 / §3.3 / §4：用户、角色 key、部门路径、岗位编码
  的租户归属与写路径；权限行以 `(tenant_id, role_id, permission_key)` 为自然键。
- `docs/contracts/PLATFORM_CONTRACT.md`：平台命名空间与租户命名空间的边界；
  导入导出不得跨租户读写。

## Implementation Notes

- 租户写归属只来自请求上下文：导入建号不再接受 CSV 中的任何租户信息。
- 唯一索引是并发下的最终裁决；预检保留为快速路径，输家统一走 `IsDuplicateKey`。
- `clause.OnConflict{DoNothing:true}` 在 MySQL 下编译为
  `ON DUPLICATE KEY UPDATE <column>=<column>`；授权与 backfill 都依赖复合唯一键，
  不再依赖「先查后插」的时序。
- backfill 的 join 同时排除软删除角色：已删角色的菜单行不应再产生权限。
- v0.17.3 notes 已发布，不回写；文案更正在本包 evidence 中登记，供下一次 release
  notes 引用。

## Verification Plan

- `gofmt -l` on touched Go files
- `go build ./...`
- `go vet ./...`
- `set -a; . ./.env.test; set +a; PANTHEON_TEST_DSN_REQUIRED=true go test ./...`（真实 MySQL/Redis）
- `CGO_ENABLED=1 go test -race -p 1 ./...`（TSan 在 Windows 下并行包会耗尽地址空间，
  串行执行；无法执行时记录环境限制）
- `go test -coverprofile ... -run <new tests>` 验证重复键分支实际命中
- `npm run -s check:docs-frontmatter && npm run -s check:task-packet && npm run -s check:structure && npm run -s check:generated`
- `node scripts/harness/check-failure-registry.mjs`

## Linkage

- Task ID: `2026-10-23-iam-residual-closeout`
- Task Manifest: `.harness/tasks/2026-10-23-iam-residual-closeout/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `RELEASE_NOTES_v0.17.3.md` §Known residual、
  `.harness/evidence/2026-10-23-residual-closeout/review.md`
- Evidence Directory: `.harness/evidence/2026-10-23-iam-residual-closeout/`
- Review File: `.harness/evidence/2026-10-23-iam-residual-closeout/review.md`

## Evidence Required

- 新增/修改测试的真实 MySQL 通过输出，含新增用例单独运行结果。
- 重复键分支的 coverprofile 命中记录。
- `go build`、`go vet`、`gofmt` 结果。
- 全量 `go test ./...` 结果（失败或环境限制逐条登记）。
- 治理检查结果。

## Human Gates

- 维护者最终验收（是否作为下一次 foundation release 的内容）。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
