---
title: v0.17.5 发布收口任务包（IAM 并发收口发布：同租户 provisioning + replace 串行化 + 历史权限行）
doc_type: Remediation
layer: platform
depends_on_layers:
  - system/iam
status: Active
linked_contracts:
  - docs/designs/FOUNDATION_RELEASE_MODEL.md
  - docs/contracts/TENANT_CONTRACT_V1.md
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-10-24
---

# Task Packet: 2026-10-24-v0175-release-closeout

## Goal

v0.17.4 发布后登记了 5 项 IAM 残留。修复已随 PR #420 合入主干（`45aa7389`），本包把它发布为
`v0.17.5`，让下一份可消费资产实际携带这些修复：

1. **同租户 provisioning 先查后写（P2）**：`ProvisionTenant` 的角色、管理员、根部门、绑定
   与成员关系都是先查后插。并发调用同一租户时双方都看不到角色行，输家命中
   `uk_system_role_tenant_key` / `uk_system_user_tenant_username` 后整个事务失败。现在事务
   开头锁 `tenants` 行，角色与管理员用 `ON DUPLICATE KEY UPDATE` 写入并以 locking read 读回，
   其余写入在同一租户锁下收敛。
2. **平台默认拷贝在锁外（P2）**：settings / dict type / dict item 的拷贝同样是先查后插。
   `system_setting` 与 `system_dict_type` 有唯一键，输家会得到 500；`system_dict_item` 没有
   唯一键，输家会静默地重复整份数据。现在拷贝在同一租户锁的第二个短事务内执行，并接收该
   事务句柄。
3. **replace 式授权交错（P2）**：`replaceRolePermissions` / `replaceUserRoles` 先删除再重插且
   不持有父行。两个写入者都先删除后，后者看不到前者的未提交插入，最终留下并集；索引间隙还
   可能死锁。现在先锁 `system_role` / `system_user` 父行。
4. **历史 `tenant_id = 0` 权限行（P2）**：pre-v0.17.4 回填写入的租户角色权限行停留在平台
   命名空间，租户侧读取永远看不到。现在回填先删除会撞 `uk_role_permission_tenant` 的旧副本，
   再把剩余旧行回填到角色所属租户；平台行与软删角色行不动，重复执行幂等。
5. **race 证据与 v0.17.3 说明（P2/P3）**：本机 Windows TSan 无法启动（error 87），race 门禁
   改由 CI Linux 的 `go test -race ./...` 提供权威证据；已发布 v0.17.3 notes 中关于
   `system_role_data_scope` 的过期表述在仓库文件与可变 release body 中以前向勘误更正。

本发布无 schema 变更（仍为 29），无路由、权限码、菜单 seed 或错误信封变化。竞争下的锁等待
超时沿用既有事务错误，不新增响应形状。

## Primary Layer

platform

代码改动集中在 `system/iam/tenant`（provisioning 与默认拷贝）、`system/iam/role`
（replace 父行锁与历史行修复）、`system/iam/user`（replace 父行锁）；本包只发布已合入的
修复并补齐版本材料。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `required`
- Release Requirement: `foundation-release`
- Downstream Sync Note: 无 schema 变更（仍为 29）；锁语义变化对消费方透明，
  `pantheon-ops` 在下一次 foundation release 后同步即可，无需迁移步骤。

## Dependency Layers

- `system/iam/tenant`：`tenant_provision.go`（租户行锁、收敛写入、锁内拷贝）。
- `system/iam/role`：`role_helper.go`（父行锁、历史权限行修复）。
- `system/iam/user`：`user_helper.go`（父行锁）。
- `backend/pkg/testmysql/locking.go`：共享 NOWAIT 探针与串行化写入测试脚手架。
- 文档层：`CHANGELOG.md`、`RELEASE_NOTES_v0.17.5.md`、`README(.en).md`、
  `.harness/STATUS.md`、`VERSION`。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `permission-policy`
- Portable Failure Class: `unique-key-race` / `non-idempotent-repair` / `lost-update`
- Owner Layer: `consumer-repository`
- Ratchet Decision: `sensor-added`
- Coverage Dimensions:
  - behaviour
  - runtime-quality
  - architecture-fitness

## Contract Anchors

- `docs/contracts/TENANT_CONTRACT_V1.md` §2.3 / §3.3 / §4：角色、用户、成员关系与权限行
  以 `tenant_id` 参与自然键；同一租户的写路径必须收敛到这些键。
- `docs/contracts/PLATFORM_CONTRACT.md`：平台命名空间（tenant 0）与租户命名空间的边界；
  权限行不得从租户命名空间漂移到平台命名空间，反之亦然。
- `docs/designs/FOUNDATION_RELEASE_MODEL.md` §2.2 / §4：release 是消费接口，最低定义含四件资产。
- `docs/harness/VERIFICATION_EVIDENCE_SPEC.md`：证据必须对应实际执行的命令与结果。

## Scope

### In

- 发布 PR #420 已合入的五项 IAM 收口与对应真实 MySQL 回归。
- 版本材料：`VERSION` → 0.17.5、`CHANGELOG.md`、`RELEASE_NOTES_v0.17.5.md`、
  `README.md`、`README.en.md`、`.harness/STATUS.md`。
- 按 `docs/VERSION_MANAGEMENT_GUIDE.md` §6 发布 `pantheon-base-v0.17.5` 四件资产。

### Out

- 任何新的生产运行时逻辑；本包不再修改 `backend/**`。
- 数据库 schema、迁移（保持 29）、路由、权限码、菜单 seed、错误信封。
- 追溯修改已发布的 v0.17.0 / v0.17.1 / v0.17.2 / v0.17.3 / v0.17.4 tag 与资产。
- 放宽任何门禁阈值、跳过测试或以 suppression 换取绿灯。

## Expected Files

### Create

- `RELEASE_NOTES_v0.17.5.md`
- `docs/harness/tasks/2026-10-24-v0175-release-closeout.task.md`
- `.harness/tasks/2026-10-24-v0175-release-closeout/manifest.json`
- `.harness/evidence/2026-10-24-v0175-release-closeout/{summary.md,review.md,commands.json}`

### Modify

- `VERSION`
- `CHANGELOG.md`
- `README.md`
- `README.en.md`
- `.harness/STATUS.md`

### Do Not Touch

- `backend/**` 生产代码（修复已随 PR #420 合入，本包不再修改）
- `backend/pkg/database/migrations/**`
- `.github/workflows/**`
- 已发布的 v0.17.0 / v0.17.1 / v0.17.2 / v0.17.3 / v0.17.4 tag 与资产

## Implementation Notes

- 发布说明只陈述 v0.17.4 之后实际合入的变更（`45aa7389`），不把 v0.17.4 的修复重复计入。
- `cut-foundation-release.mjs` 不自动读取 `RELEASE_NOTES_*.md`，必须显式传 `--release-notes`、
  `--upgrade-notes`、`--consumer-impact`。
- 发布门禁保持 `Release Gate Summary` 在目标提交上 success 的硬前置；凭据预检在打标之前运行。
- 发布资产不可回滚，因此验证证据在打标前保存，发布后只追加事实。
- 本机 TSan 无法启动；race 证据取 CI Linux run `39970863908` 的 Backend Tests（head
  `973f5be2` 与最终合并提交同代码树）。
- 已发布 v0.17.3 notes 不回写；勘误只追加到仓库文件与可变 release body。

## Verification Plan

- `cd backend && go build ./... && go vet ./... && gofmt -l .`
- `cd backend && set -a; . ../.env.test; set +a; PANTHEON_TEST_DSN_REQUIRED=true PANTHEON_TEST_REDIS_REQUIRED=true go test -count=1 ./...`（真实 MySQL/Redis）
- `cd backend && go test -count=1 -run 'TestConcurrentProvisioningOfTheSameTenantIsConvergent|TestCopyPlatformDefaultsRunOnTheLockedTenantRow|TestConcurrentReplaceRolePermissionsSerialisesOnTheRoleRow|TestConcurrentReplaceUserRolesSerialisesOnTheUserRow|TestBackfillRolePermissionsRepairsPlatformNamespaceGrants' ./modules/system/iam/...`
- `npm run -s check:docs-frontmatter && npm run -s check:task-packet && npm run -s check:structure && npm run -s check:generated`
- `node scripts/harness/check-failure-registry.mjs`
- `node scripts/harness/check-evidence.mjs --strict .harness/evidence/2026-10-24-v0175-release-closeout/commands.json`
- `node scripts/harness/check-review.mjs --strict .harness/evidence/2026-10-24-v0175-release-closeout/review.md`
- `node scripts/foundation-release/cut-foundation-release.mjs --release-version pantheon-base-v0.17.5 --release-line release/0.17 --base-commit <merge-sha> --release-notes <file> --upgrade-notes <text> --consumer-impact <text>`
- `node scripts/foundation-release/check-release-secrets.mjs --release-version pantheon-base-v0.17.5`
- `node scripts/foundation-release/publish-foundation-release.mjs --release-version pantheon-base-v0.17.5 --release-line release/0.17 --base-commit <merge-sha> --repo duanxldragon/pantheon-base`
- `node scripts/foundation-release/check-release-assets.mjs --release-version pantheon-base-v0.17.5 --repo duanxldragon/pantheon-base`
- `gh release view pantheon-base-v0.17.5 --repo duanxldragon/pantheon-base --json assets,tagName,isDraft,isPrerelease`

## Linkage

- Task ID: `2026-10-24-v0175-release-closeout`
- Task Manifest: `.harness/tasks/2026-10-24-v0175-release-closeout/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/VERSION_MANAGEMENT_GUIDE.md` §6、
  `.harness/evidence/2026-10-23-iam-race-closeout/review.md`
- Evidence Directory: `.harness/evidence/2026-10-24-v0175-release-closeout/`
- Review File: `.harness/evidence/2026-10-24-v0175-release-closeout/review.md`

## Evidence Required

- 全量真库套件与五项回归的通过输出。
- `go build`、`go vet`、`gofmt` 结果。
- 治理检查（frontmatter / task packet / structure / generated / failure registry）结果。
- `Release Gate Summary` 在合并提交上的结论。
- 凭据预检结果（文件数、0 命中，脱敏）。
- 四件资产的 SHA-256、`check-release-assets` 输出与 `Foundation Release Verify` run。

## Human Gates

- 维护者最终验收（版本号与发布说明口径）。
- 发布动作（tag / Release 资产）按仓库治理执行。

## Completion Checklist

- [ ] Layer and boundary declared
- [ ] Contract anchors read
- [ ] Verification run or exception recorded
- [ ] Evidence saved or summarized
- [ ] Review completed
