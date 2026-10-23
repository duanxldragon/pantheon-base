---
title: v0.17.4 发布收口任务包（IAM 残余修复发布：导入租户隔离 + 重复键竞态 + 授权幂等）
doc_type: Remediation
layer: platform
depends_on_layers:
  - system/iam
status: Active
linked_contracts:
  - docs/designs/FOUNDATION_RELEASE_MODEL.md
  - docs/contracts/TENANT_CONTRACT_V1.md
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-10-23
---

# Task Packet: 2026-10-23-v0174-release-closeout

## Goal

v0.17.3 的 known-residual 只登记了一项「`system_role_data_scope` /
`system_role_permission` 写入仍先查后插」。按实际代码复核后范围更大，且有一项从未登记。
修复已随 PR #417 合入主干（`a9fffac8`），本包把它发布为 `v0.17.4`，让下一份可消费资产
实际携带这些修复：

1. **用户 CSV 导入跨租户读写（P1，未登记）**：`loadUserImportLookups` 的同名用户、角色 key、
   部门路径、岗位编码四类查找全部未加租户过滤；建号路径也没有写 `tenant_id` 与成员关系。
   租户 A 导入与租户 B 同名的用户会更新 B 的用户；新建用户落进平台命名空间，导入者看不到、
   也登不进。现四类查找按调用方租户过滤，建号从请求上下文写 `tenant_id` 并在同一事务写
   active membership。
2. **重复键竞态（P2）**：`CreateUser` / `CreateRole` / `UpdateRole` 先查后插，并发下都通过
   预检，输家命中 UNIQUE 索引后把 MySQL 1062 当 500 抛出。现统一经
   `database.IsDuplicateKey` 整形为既有 409。
3. **授权写入先查后插（P2）**：`grantTenantRolePermissions` / `grantTenantRoleMenus` 逐行
   `Create`，并发修复会重复插入。现改为批量 `CreateInBatches` + `clause.OnConflict{DoNothing:true}`。
4. **bootstrap 回填归属与去重（P2）**：`backfillRolePermissions` 的 select 没有 join
   `system_role`，租户角色的权限行全部盖成 `tenant_id = 0`；同一 key 被多个菜单暴露时会重复
   seed。现 join 取租户归属、排除软删除角色、按自然键去重后幂等批量写入。

本发布无 schema 变更（仍为 29），无路由、权限码、菜单 seed 或错误信封变化。唯一响应变化是
竞态输家由 500 变为既有 409。

## Primary Layer

platform

代码改动集中在 `system/iam/user`（导入与建号）、`system/iam/role`（冲突整形与回填）、
`system/iam/tenant`（授权幂等写入）；本包只发布已合入的修复并补齐版本材料。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `required`
- Release Requirement: `foundation-release`
- Downstream Sync Note: 无 schema 变更（仍为 29）；导入行为与竞态错误码变化，
  `pantheon-ops` 在下一次 foundation release 后同步即可，无需迁移步骤。

## Dependency Layers

- `system/iam/user`：`user_export.go`（导入查找与建号）、`user_helper.go`（四类查找）、
  `user_service.go`（CreateUser 冲突整形）。
- `system/iam/role`：`role_service.go`（Create/Update 冲突整形）、`role_helper.go`（backfill）。
- `system/iam/tenant`：`tenant_provision.go`（permission/menu 授权幂等写入）。
- 文档层：`CHANGELOG.md`、`RELEASE_NOTES_v0.17.4.md`、`README(.en).md`、`.harness/STATUS.md`、`VERSION`。

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

## Contract Anchors

- `docs/contracts/TENANT_CONTRACT_V1.md` §2.3 / §3.3 / §4：用户、角色 key、部门路径、岗位编码
  的租户归属与写路径；权限行以 `(tenant_id, role_id, permission_key)` 为自然键。
- `docs/contracts/PLATFORM_CONTRACT.md`：平台命名空间与租户命名空间的边界；导入导出不得跨租户读写。
- `docs/designs/FOUNDATION_RELEASE_MODEL.md` §2.2 / §4：release 是消费接口，最低定义含四件资产。
- `docs/harness/VERIFICATION_EVIDENCE_SPEC.md`：证据必须对应实际执行的命令与结果。

## Scope

### In

- 发布 PR #417 已合入的四条 IAM 修复与对应真实 MySQL 回归。
- 版本材料：`VERSION` → 0.17.4、`CHANGELOG.md`、`RELEASE_NOTES_v0.17.4.md`、
  `README.md`、`README.en.md`、`.harness/STATUS.md`。
- 按 `docs/VERSION_MANAGEMENT_GUIDE.md` §6 发布 `pantheon-base-v0.17.4` 四件资产。

### Out

- 任何新的生产运行时逻辑；本包不再修改 `backend/**`。
- 数据库 schema、迁移（保持 29）、路由、权限码、菜单 seed、错误信封。
- 追溯修改已发布的 v0.17.0 / v0.17.1 / v0.17.2 / v0.17.3 tag 与资产。
- 放宽任何门禁阈值、跳过测试或以 suppression 换取绿灯。

## Expected Files

### Create

- `RELEASE_NOTES_v0.17.4.md`
- `docs/harness/tasks/2026-10-23-v0174-release-closeout.task.md`
- `.harness/tasks/2026-10-23-v0174-release-closeout/manifest.json`
- `.harness/evidence/2026-10-23-v0174-release-closeout/{summary.md,review.md,commands.json}`

### Modify

- `VERSION`
- `CHANGELOG.md`
- `README.md`
- `README.en.md`
- `.harness/STATUS.md`

### Do Not Touch

- `backend/**` 生产代码（修复已随 PR #417 合入，本包不再修改）
- `backend/pkg/database/migrations/**`
- `.github/workflows/**`
- 已发布的 v0.17.0 / v0.17.1 / v0.17.2 / v0.17.3 tag 与资产

## Implementation Notes

- 发布说明只陈述 v0.17.3 之后实际合入的变更（`a9fffac8`，以及 `fe23d798` 的 STATUS 事实记录），
  不把 v0.17.3 的修复重复计入。
- `cut-foundation-release.mjs` 不自动读取 `RELEASE_NOTES_*.md`，必须显式传 `--release-notes`、
  `--upgrade-notes`、`--consumer-impact`。
- 发布门禁保持 `Release Gate Summary` 在目标提交上 success 的硬前置；凭据预检在打标之前运行。
- 发布资产不可回滚，因此验证证据在打标前保存，发布后只追加事实。
- v0.17.3 notes 已发布且不可改写；`system_role_data_scope` 的过期描述在 v0.17.4 notes 中
  以前向更正登记。

## Verification Plan

- `cd backend && go build ./... && go vet ./... && gofmt -l .`
- `cd backend && set -a; . ../.env.test; set +a; PANTHEON_TEST_DSN_REQUIRED=true PANTHEON_TEST_REDIS_REQUIRED=true go test -count=1 ./...`（真实 MySQL/Redis）
- `cd backend && go test -count=1 -coverprofile ... -run <new tests> ./modules/system/iam/{user,role,tenant}`
- `npm run -s check:docs-frontmatter && npm run -s check:task-packet && npm run -s check:structure && npm run -s check:generated`
- `node scripts/harness/check-failure-registry.mjs`
- `node scripts/foundation-release/cut-foundation-release.mjs --release-version pantheon-base-v0.17.4 --release-line release/0.17 --base-commit <merge-sha> --release-notes <file> --upgrade-notes <text> --consumer-impact <text>`
- `node scripts/foundation-release/check-release-secrets.mjs --release-version pantheon-base-v0.17.4`
- `node scripts/foundation-release/publish-foundation-release.mjs --release-version pantheon-base-v0.17.4 --release-line release/0.17 --base-commit <merge-sha> --repo duanxldragon/pantheon-base`
- `node scripts/foundation-release/check-release-assets.mjs --release-version pantheon-base-v0.17.4 --repo duanxldragon/pantheon-base`
- `gh release view pantheon-base-v0.17.4 --repo duanxldragon/pantheon-base --json assets,tagName,isDraft,isPrerelease`

## Linkage

- Task ID: `2026-10-23-v0174-release-closeout`
- Task Manifest: `.harness/tasks/2026-10-23-v0174-release-closeout/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/VERSION_MANAGEMENT_GUIDE.md` §6、
  `.harness/evidence/2026-10-23-iam-residual-closeout/review.md`
- Evidence Directory: `.harness/evidence/2026-10-23-v0174-release-closeout/`
- Review File: `.harness/evidence/2026-10-23-v0174-release-closeout/review.md`

## Evidence Required

- 全量真库套件与新增用例的通过输出，含 coverprofile 对重复键分支的命中记录。
- `go build`、`go vet`、`gofmt` 结果。
- 治理检查（frontmatter / task packet / structure / generated / failure registry）结果。
- `Release Gate Summary` 在合并提交上的结论。
- 凭据预检结果（文件数、0 命中，脱敏）。
- 四件资产的 SHA-256、`check-release-assets` 输出与 `Foundation Release Verify` run。

## Human Gates

- 维护者最终验收（版本号与发布说明口径）。
- 发布动作（tag / Release 资产）按仓库治理执行。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
