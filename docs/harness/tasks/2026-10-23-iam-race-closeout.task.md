---
title: v0.17.4 后残余收口任务包（同租户并发 provisioning + 替换式授权串行化 + 历史权限行回填 + race 证据 + notes 更正）
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

# Task Packet: 2026-10-23-iam-race-closeout

## Goal

v0.17.4 的 known-residual 登记了 5 项未收口内容，本包全部关闭：

1. **同租户并发 `ProvisionTenant`**（P2）：`provisionTenantRoles` 先查后插，
   `provisionTenantRootDept` / `provisionTenantAdminUser` / `provisionTenantAdminBinding`
   也是先查后写；两个并发调用会让输家命中
   `uk_system_role_tenant_key` / `uk_system_user_tenant_username` 并回滚整个 provisioning，
   根部门表无唯一键时还会写出两条根部门。事务提交后的平台默认设置/字典拷贝同样是先查后插，
   且 `system_dict_item` 没有唯一键，并发下会重复插入。
2. **`replaceRolePermissions` / `replaceUserRoles` 删除后重插**（P2）：并发替换会交错成
   合并集合（后来的 DELETE 看不到先前未提交的 INSERT），或在索引间隙上死锁。
3. **历史 `system_role_permission` 行的 `tenant_id = 0`**（P2）：v0.17.4 之前的 backfill
   把租户角色的授权写进平台命名空间；这些行对租户读路径不可见，租户角色实际丢权限。
4. **race 门禁证据缺失**（P2）：Windows 本机无法启动 TSan，需要用 CI 的
   `go test -race ./...` 作为权威证据。
5. **已发布 v0.17.3 notes 的过期表述**（P3）：`system_role_data_scope` 从未先查后写。

## Primary Layer

platform

改动集中在 `system/iam/tenant`（provisioning 串行化）与 `system/iam/role`、
`system/iam/user`（替换式授权串行化、历史行回填）。无 schema、路由、权限码、菜单 seed
或错误信封变更。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `required`
- Release Requirement: `foundation-release`
- Downstream Sync Note: 无 schema 变更（仍为 29）；并发与回填行为在进程内生效，
  `pantheon-ops` 只需在下一次 foundation release 后同步。

## Dependency Layers

- `system/iam/tenant`：`tenant_provision.go`（角色 upsert + 回读、租户行锁、管理员 upsert、
  绑定幂等写入）。
- `system/iam/role`：`role_helper.go`（角色行锁、历史权限行回填）。
- `system/iam/user`：`user_helper.go`（用户行锁）。

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

## Scope

### In

- `ProvisionTenant` 在事务开头锁住 `tenants` 行，同租户并发调用排队而不是竞争。
- `provisionTenantRoles` / `provisionTenantAdminUser` 改为 `OnConflict{DoNothing}` +
  `SELECT ... FOR UPDATE` 回读；管理员绑定与成员关系改为冲突容忍写入。
- `replaceRolePermissions` / `replaceUserRoles` 在 DELETE 前锁住父 `system_role` /
  `system_user` 行，替换以行锁串行化，最终集合是最后一个写者。
- `backfillRolePermissions` 在 seed 之前修复历史行：先删除与租户命名空间重复的
  `tenant_id = 0` 行，再把剩余行改写为角色所属租户；平台行与软删除角色不动。
- 真实 MySQL 回归：同租户并发 provisioning 收敛、两处行锁探针、历史权限行回填。
- 用 CI 的 race 门禁记录替本地 TSan 限制。
- v0.17.3 notes（仓库文件与 GitHub release body）追加带日期的勘误块，保留原文。

### Out

- 数据库 schema / migration（保持 29）。
- 路由、权限码、菜单 seed、错误信封。
- `.github/workflows/**` 与门禁阈值。
- 已发布的 tag 与资产（v0.17.3 body 仅追加勘误，不改 tag 与资产）。

## Expected Files

### Create

- `backend/modules/system/iam/role/role_replace_concurrency_test.go`
- `backend/pkg/testmysql/locking.go`
- `docs/harness/tasks/2026-10-23-iam-race-closeout.task.md`
- `.harness/tasks/2026-10-23-iam-race-closeout/manifest.json`
- `.harness/evidence/2026-10-23-iam-race-closeout/{summary.md,review.md,commands.json}`

### Modify

- `backend/modules/system/iam/tenant/{tenant_provision.go,tenant_provision_dicts_test.go,tenant_concurrency_test.go}`
- `backend/modules/system/iam/role/{role_helper.go,role_backfill_test.go}`
- `backend/modules/system/iam/user/{user_helper.go,user_concurrency_test.go}`
- `RELEASE_NOTES_v0.17.3.md`

### Do Not Touch

- `backend/pkg/database/migrations/**`
- `.github/workflows/**`
- 已发布的 tag 与资产

## Contract Anchors

- `docs/contracts/TENANT_CONTRACT_V1.md` §2.3 / §3.3 / §4：角色、用户、成员关系与权限行
  都以 `tenant_id` 参与自然键；同一租户的写路径必须收敛到这些键。
- `docs/contracts/PLATFORM_CONTRACT.md`：平台命名空间（tenant 0）与租户命名空间的边界；
  权限行不得从租户命名空间漂移到平台命名空间，反之亦然。

## Implementation Notes

- 同租户 provisioning 的根因是「读-写之间的窗口」，用父行锁关掉窗口比给每张表补唯一键更小、
  更贴合真实模型；根部门没有唯一键，只有锁能保证一条。
- 平台默认拷贝也在锁释放之后先查后插，且 `system_dict_item` 无唯一键：在第二个短事务里
  重新获取同一租户行锁，并把事务句柄传给拷贝函数，`settings` 事务与拷贝事务之间不留窗口。
- MySQL 在 REPEATABLE READ 下，等待过对方事务的 upsert 之后普通 SELECT 仍可能读到旧快照，
  所以 upsert 后的回读必须是加锁读（当前读）。
- 替换式写入的 `DELETE` 与 `INSERT` 必须在同一事务里持有父行锁；锁的粒度是父行，不是表。
- 历史行修复先删除与租户命名空间重复的 `tenant_id = 0` 行，再 UPDATE 剩余行，
  否则 UPDATE 会撞 `uk_role_permission_tenant`。
- 历史行修复放在 seed 查询之前、空 seed 提前返回之前，只有历史行需要修的库也要被修。
- v0.17.3 notes 的勘误同时落在仓库文件与 GitHub release body：保留原文、加日期与理由，
  tag 与资产不动。

## Verification Plan

- `gofmt -l` on touched Go files
- `go build ./...`
- `go vet ./...`
- `set -a; . ./.env.test; set +a; PANTHEON_TEST_DSN_REQUIRED=true PANTHEON_TEST_REDIS_REQUIRED=true go test ./...`（真实 MySQL/Redis）
- 新增用例单独运行：同租户并发 provisioning、两处行锁探针、历史权限行回填
- 修复前代码回跑同一批用例，确认用例能捕获缺陷
- CI：`quality.yml` `backend-tests` 的 `go test -race ./...`（MySQL 8 + Redis）
- `node scripts/frontmatter-check.mjs && node scripts/check-task-packet-template.mjs && node scripts/harness/check-task-packet.mjs --root . && node scripts/harness/check-structure-contract.mjs --root . --strict && node scripts/harness/check-generated.mjs --root . --strict && node scripts/harness/check-failure-registry.mjs --root . --strict`

## Linkage

- Task ID: `2026-10-23-iam-race-closeout`
- Task Manifest: `.harness/tasks/2026-10-23-iam-race-closeout/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `RELEASE_NOTES_v0.17.4.md` §Known residual、
  `.harness/evidence/2026-10-23-iam-residual-closeout/commands.json`
- Evidence Directory: `.harness/evidence/2026-10-23-iam-race-closeout/`
- Review File: `.harness/evidence/2026-10-23-iam-race-closeout/review.md`

## Evidence Required

- 新增/修改测试的真实 MySQL 通过输出。
- 修复前代码回跑同一批用例的失败输出（证明用例能捕获缺陷）。
- `go build`、`go vet`、`gofmt` 结果。
- 全量 `go test ./...` 结果（失败或环境限制逐条登记）。
- CI race 门禁 run id 与结论。
- 治理检查结果。

## Human Gates

- 维护者最终验收（是否作为下一次 foundation release 的内容）。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
