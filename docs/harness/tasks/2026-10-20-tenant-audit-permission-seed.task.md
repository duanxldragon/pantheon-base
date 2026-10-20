---
title: 审计页面权限键播种修复任务包（租户控制台 403）
doc_type: Remediation
layer: platform
depends_on_layers:
  - system/iam
  - system/auth
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/TENANT_CONTRACT_V1.md
  - docs/contracts/DOCUMENT_GOVERNANCE_CONTRACT.md
updated_at: 2026-10-20
---

# Task Packet: 2026-10-20-tenant-audit-permission-seed

## Goal

让 `Tenant Smoke (multi-mode advisory)` 在主干恢复绿，并修掉它暴露出的真实缺陷。

现象：租户管理员登录后侧边栏有「登录日志」，点进去是
`403 你没有访问当前页面的权限`。上一轮（`2026-10-20-sonarcloud-zero-issues`）补写了
`system_role_menu`，所以导航有了；但**页面鉴权看的是 `system_role_permission`**，而那一半从来没写。

根因不在租户侧，而在平台侧的播种：`backend/modules/auth/login/login_menu.go` 的
`SeedAuthModuleMenus` 只写菜单与 `system_role_menu`，不写 `system_role_permission`；
`backend/modules/system/seed.go` 的 `bindSeedMenuAdminRole` 两半都写。于是
`system:login-log:*`、`system:session:*`、`system:security-event:*` 这 12 个键
**平台管理员自己也没有**，而租户开通是「把平台管理员的键集复制一份」，缺失被原样放大到每个租户。

CI 证据：租户 204 的 `tenant_admin` 拿到 85 个键（与平台管理员一致），
其中 `system:operation-log:*` 在、`system:login-log:*` / `system:security-event:*` / `system:session:*` 全缺。

触发缺陷的检查是 `.github/workflows/smoke-core.yml` 的 `smoke-tenant` 作业，失败用例
`tenant-hostile-browser-matrix-phase2.spec.ts:77`
（`assertProtectedPage(page, '/system/login-log', '.auth-login-log-page__table-card')`）。
相邻任务包：`2026-10-20-sonarcloud-zero-issues`（补 `system_role_menu` 播种）、
`2026-10-19-tenant-permission-isolation-remediation`（租户维度下沉）。

## Primary Layer

platform

改动落在 `backend/pkg/rbacbind`（共享授权写入）、`backend/modules/auth/login`（播种）、
`backend/modules/system`（复用同一实现）与两个测试夹具。
判定权在 platform 层：本包**不改变任何业务规则**，只补齐「播种一个菜单时必须同时播种它的权限键」
这一既有约定；`system_role_menu` / `system_role_permission` 的表结构与租户模型不变。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `not-required`
- Release Requirement: `foundation-release`

## Dependency Layers

- `platform`：`pkg/rbacbind` 是授权写入的唯一入口，两个播种器共用它。
- `system/iam`：租户开通复制平台管理员键集（`tenant_provision.go`）。
- `system/auth`：`SeedAuthModuleMenus` 是缺口的产生地。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `ci-workflow`
- Portable Failure Class: `split-write-grant`
- Owner Layer: `consumer-repository`
- Ratchet Decision: no new gate（本包不新增门禁；缺陷由既有 `smoke-tenant` 与新增的两条 Go 用例共同锁死）
- Coverage Dimensions:
  - behaviour
  - runtime-quality
  - architecture-fitness

## Contract Anchors

- `docs/contracts/PLATFORM_CONTRACT.md`：菜单与权限是两张表，授权必须成对写入。
- `docs/contracts/TENANT_CONTRACT_V1.md` §4：租户角色的键集来源于平台管理员，收敛靠租户域而非裁剪键集。
- `docs/contracts/DOCUMENT_GOVERNANCE_CONTRACT.md`：任务包与证据目录的必填结构。
- `backend/pkg/database/migrations/000020_tenant_phase1_core_tables.up.sql`：
  `system_role_permission` 的 `tenant_id` 与 `uk_role_permission_tenant`。

## Scope

### In

- `pkg/rbacbind` 新增 `EnsureRolePermission`：按 `(tenant_id, role_id, permission_key)` 幂等写入，
  与既有 `EnsureRoleMenu` 成对，且显式携带 `tenant_id`。
- `login_menu.go`：`ensureSingleMenuSeed` 在绑定菜单之后，补写该菜单的 `PagePerm` 与 `Perms`。
- `seed.go`：`ensureAdminPermissionSeed` 改为委托 `rbacbind.EnsureRolePermission`，
  两处播种从此只有一份实现。
- 测试：`login_menu_test.go` 断言平台管理员拿到 12 个审计键且重复播种不重复；
  `tenant_provision_menus_test.go` 断言租户管理员与只读成员分别继承正确的键集。
- 夹具修正：`seed_test.go`、`tenant_service_test.go`、`login_menu_test.go` 的
  `system_role_permission` DDL 补 `tenant_id`，与生产表对齐。

### Out

- 不改 `system_role_permission` / `system_role_menu` 的表结构或迁移。
- 不改租户菜单可见性模型（`system_menu` 仍无租户维度）。
- 不为已存在的租户做全库自动回填：那会把租户主动收回的键重新授出去，
  属于产品决策而非缺陷修复（见 Human Gates）。
- 不动 `.github/workflows/**`、`.sonarcloud.properties`、`release-gate.yml`。
- 不恢复 v0.17.0 发布包。

## Expected Files

### Create

- `docs/harness/tasks/2026-10-20-tenant-audit-permission-seed.task.md`
- `.harness/tasks/2026-10-20-tenant-audit-permission-seed/manifest.json`
- `.harness/evidence/2026-10-20-tenant-audit-permission-seed/{commands.json,summary.md,review.md}`

### Modify

- `backend/pkg/rbacbind/rbacbind.go`
- `backend/modules/auth/login/{login_menu.go,login_menu_test.go}`
- `backend/modules/system/{seed.go,seed_test.go}`
- `backend/modules/system/iam/tenant/{tenant_provision_menus_test.go,tenant_service_test.go}`

### Do Not Touch

- `backend/pkg/database/migrations/**`（本包无 schema 改动）。
- `backend/modules/system/iam/tenant/tenant_provision.go`（复制逻辑本身是对的，缺的是上游键集）。
- `frontend/**`（前端只消费 `perms`，无需改动）。
- `.harness/archive/**` 与历史 evidence 目录。

## Implementation Notes

- **为什么修上游而不是给租户补键**：`provisionTenantRoleBindings` 的行为是「平台管理员有什么就复制什么」，
  这是契约 §4 的收敛方式。在租户侧补 12 个键只会让下一个新租户继续缺，
  而且平台管理员自己的控制台仍然是坏的（同一批页面同样 403）。
- **为什么不合并两个 `ensureMenuSeeds`**：`system` 与 `auth` 各自持有一份菜单种子表（键名、父子关系不同），
  合并会把两个模块的菜单数据耦在一起。只共享**写入原语**（`rbacbind`），不共享数据。
- **`tenant_id` 必须显式写**：登录时的权限加载器按 `system_role_permission.tenant_id = <登录租户>` 过滤，
  不带 `tenant_id` 的写入会落在 0，租户主体永远读不到。这正是 `rbacbind` 里 `insertRoleMenuSQL`
  注释记录过的同一个坑（acceptance F3）。
- **夹具为什么必须补 `tenant_id`**：旧夹具的 `system_role_permission` 只有 `(role_id, permission_key)`，
  所以旧实现「不带 tenant_id 也能过」。夹具与生产表不一致，正是这个缺陷能长期不被测试发现的原因。
- **成员角色仍是只读**：`isReadOnlyPermissionKey` 未改，`tenant_member` 只拿到 `:list/:detail/:view/:tree/:export`。

## Structural Scope

- Affected Subgraph: `module menu seeder -> system_role_menu + system_role_permission -> tenant provisioning copy -> login permission loader -> route guard`
- Boundary Crossings: 有。播种在 `system/auth`，复制在 `system/iam`，读取在 `auth/login`，
  写入原语下沉到 `pkg/rbacbind`；职责划分不变，只是把「只写一半」补成「成对写」。
- Risk Nodes: 若 `EnsureRolePermission` 漏写 `tenant_id`，租户侧仍然读不到（已用共享 SQL 常量 + 测试锁死）；
  若给成员角色放开写键，会渲染出服务端会拒绝的按钮（`isReadOnlyPermissionKey` 保证不放开）。
- Graph Focus: 「导航可见」与「页面可进」是两个判定，任何只写一半的授权都是缺陷。

## Execution Roles

- Implementer Posture: 先定位缺口的产生地（播种器）再动手，不在症状处（租户键集）打补丁。
- Reviewer Posture: 复核 `EnsureRolePermission` 的幂等键与生产唯一键一致、两个播种器的键集是否真的对齐、
  成员角色是否仍只读、以及夹具改动是否只是补列而没有放宽断言。
- 实现前先读 `.github/workflows/smoke-core.yml` 的 `smoke-tenant` 作业与 CI 后端日志里的实际 INSERT 语句。

## Dependency Plan

| Wave | 优先级 | 工作项 | 依赖 | 关闭条件 |
| --- | --- | --- | --- | --- |
| 0 | P0 | 从 CI 日志定位缺口：平台管理员键集 vs 租户复制结果 | 无 | 确认缺失的 12 个键，并定位到 `SeedAuthModuleMenus` |
| 1 | P0 | `rbacbind.EnsureRolePermission` + 两个播种器收敛 | Wave 0 | `go build` / `go vet` / 新测试全绿 |
| 2 | P0 | 夹具补 `tenant_id`，跑受影响包 | Wave 1 | `modules/system`、`modules/system/iam/**`、`modules/auth/**` 全绿 |
| 3 | P1 | 任务包 + 证据 + PR | Wave 2 | `check:task-packet`、`check:evidence --strict`、`check:review --strict` 通过 |
| 4 | P1 | CI 实跑 | Wave 3 | `Tenant Smoke (multi-mode advisory)` 绿，其余检查不回归 |

## Verification Plan

- Static: `cd backend && go build ./... && go vet ./...`；
  `golangci-lint run --new-from-rev=<base> ./...`。
- Unit（MySQL-backed）: `go test -count=1 ./pkg/rbacbind/... ./modules/system/ ./modules/system/iam/... ./modules/auth/...`。
- 新增用例：
  - `TestSeedAuthModuleMenusGrantsAdminPermissionKeys`：平台管理员 12 个审计键齐备 + 重复播种不重复。
  - `TestProvisionTenant_CopiesPlatformAdminPermissionKeys`：租户管理员继承全部平台键，成员只继承只读键。
- Repo gates: `npm run check:task-packet`、`check:docs-frontmatter`、`check:structure`、`check:harness-encoding`。
- CI: `smoke-tenant` 作业的 Playwright 断言（本机无法执行，见 Evidence Required）。

## Evidence Required

- `.harness/evidence/2026-10-20-tenant-audit-permission-seed/commands.json`：
  每条命令的目录、状态与真实输出摘要，含改前基线（CI 日志里 85 个键的复制结果）。
- `summary.md`：缺失键清单、修法、影响面、残余风险（存量租户需重新开通）。
- `review.md`：结论与复核要点，含「Playwright 本机不可执行」的显式声明。
- 静态推断与运行复现分别标记；本机未执行的项目不得写成已通过。

## Human Gates

- 存量租户是否需要在升级时统一重新开通（或提供一个受控的回填命令）由维护者决定。
  本包选择不自动回填：租户管理员可以主动收回键，自动回填会把它授回去。
- 是否把 `system:login-log:*` / `system:session:*` 补进 `requiredAPIRoutesByPermission`
  （权限工作台的「受控补齐」数据表）属于产品范围，本包不做。
- v0.17.0 发布是否继续，不在本包范围内。

## Linkage

- Task ID: `2026-10-20-tenant-audit-permission-seed`
- Task Manifest: `.harness/tasks/2026-10-20-tenant-audit-permission-seed/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Evidence Directory: `.harness/evidence/2026-10-20-tenant-audit-permission-seed/`
- Review File: `.harness/evidence/2026-10-20-tenant-audit-permission-seed/review.md`
- Plan References: `.github/workflows/smoke-core.yml`、`docs/contracts/TENANT_CONTRACT_V1.md`
- Assessment: `docs/harness/tasks/2026-10-20-tenant-audit-permission-seed.task.md`

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] 缺口定位到 `SeedAuthModuleMenus`（只写菜单、不写权限键），有 CI 日志 INSERT 证据
- [x] `rbacbind.EnsureRolePermission` 落地，显式携带 `tenant_id`，与生产唯一键一致
- [x] 两个播种器共用同一实现，平台管理员补齐 12 个审计键
- [x] 租户管理员继承全部平台键、成员角色只继承只读键，各有用例
- [x] 夹具 `system_role_permission` DDL 与生产表对齐（补 `tenant_id`）
- [ ] CI 实跑确认：`Tenant Smoke (multi-mode advisory)` 转绿
