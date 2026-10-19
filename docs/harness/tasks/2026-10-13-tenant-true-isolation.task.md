---
title: 租户真隔离任务包（建租户即初始化 / IAM 全量隔离 / 租户切换 / 租户管理员）
doc_type: Remediation
layer: platform
depends_on_layers:
  - system/iam
  - system/config
  - system/auth
  - system/org
  - system/audit
status: Active
linked_contracts:
  - docs/contracts/TENANT_CONTRACT_V1.md
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/DOCUMENT_GOVERNANCE_CONTRACT.md
  - docs/designs/TENANT_RESOURCE_SCOPE_MATRIX.md
  - docs/designs/TENANT_READY_SINGLE_TENANT_DESIGN.md
updated_at: 2026-10-13
---

# Task Packet: 2026-10-13-tenant-true-isolation

## Goal

`docs/TENANT_INITIALIZATION_FINDINGS_2026-10-13.md` 的实机复验结论是：multi 模式提供的是一套
**「租户声明（claim）管道」而非「租户隔离」**。本包把管道补成隔离，落地维护者已确认的三项产品决策：

1. **用户名租户内唯一**（唯一键 `(tenant_id, username)`），即"真多租户"——每个租户都可以有自己的 `admin`；
2. **租户管理员 = 全量控制台，自动限定在本租户**（授权面不裁剪，收窄靠数据层）；
3. **隔离范围 = IAM 全量**（用户 / 角色 / 部门 / 岗位 / 权限），`tenant_id` 落到 18 张核心表。

为此需要：给 IAM 全量补 `tenant_id`（迁移）、让每个 IAM 服务按租户读写（含写入落租户）、
把 membership 角色桥接到 Casbin 域主体、建租户时一次性完成初始化、提供会话级租户切换、
校验 `X-Tenant-Id`，并把租户管理控制台收回平台能力。

## Primary Layer

platform

缺陷根因分布在 `modules/system/iam/{user,role,org}`、`modules/auth/login`、`modules/platform`、
`internal/middleware`、`pkg/tenant` 与 `pkg/database/migrations`，但判定权与契约归属都在 platform 层：
本包修改的是**租户上下文的解析、传播与数据访问不变量**，而不是任何业务域行为。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `not-required`
- Release Requirement: `foundation-release`

## Dependency Layers

- `system/iam`：本包主体。租户控制台（`modules/system/iam/tenant`）承担初始化；用户/角色/部门/岗位服务
  （`modules/system/iam/{user,role}`、`modules/system/org/{dept,post}`）改为租户作用域读写。
- `system/config`：`platform.tenant_mode` 作为解析输入；租户初始化复制 `system_setting` 时需与其列定义一致。
- `system/auth`：登录凭证解析改为租户内查找；会话新增租户切换；`auth/*` 仍声明为平台作用域。
- `system/org`：契约 §7 把 tenants CRUD 归口 `system/org`，控制台实际落在 `system/iam`。该错位早于本包，
  记录为后续项，不在本包静默迁移。
- `system/audit`：租户作用域同时决定审计行落哪个 `tenant_id`（实测：租户管理员的操作日志落本租户）。

## Harness Profile

- Template: admin-platform
- Overlay: pantheon-base
- Quality Profile: platform-remediation
- Portable Failure Class: `tenant-isolation-not-enforced`
- Owner Layer: platform
- Ratchet Decision: gate-updated（新增 34 项实机隔离断言作为常驻证据；`gofmt` 由红转绿）
- Coverage Dimensions:
  - behaviour
  - runtime-quality
  - maintainability

## Contract Anchors

- `docs/contracts/TENANT_CONTRACT_V1.md`（§2.1 生命周期；§2.2 成员关系与角色；§2.3 `tenant_id` 语义与保留 0；
  §3.1 解析优先级；§3.2 传播与拒绝；§3.3 数据访问不变量与"平台管理 API 必须显式声明"；§4 Casbin 域；
  §5 错误码；§6 compat 模式）
- `docs/designs/TENANT_RESOURCE_SCOPE_MATRIX.md`（资源作用域矩阵，判定租户管理控制台属平台级）
- `docs/designs/TENANT_READY_SINGLE_TENANT_DESIGN.md`（compat 退化形态）
- `docs/contracts/PLATFORM_CONTRACT.md`
- `docs/contracts/DOCUMENT_GOVERNANCE_CONTRACT.md`

## Scope

### In

**迁移（Phase A）**

- `backend/pkg/database/migrations/000024_tenant_core_tables_repair.up.sql` / `.down.sql`：为 18 张核心表补
  `tenant_id BIGINT UNSIGNED NOT NULL DEFAULT 0`（带 `information_schema` 守卫，幂等），
  并给 `system_user` 建唯一键 `(tenant_id, username)`、给 `system_role` 建 `(tenant_id, role_key)`。

**初始化（Phase C）**

- `backend/modules/system/iam/tenant/tenant_provision.go`：新增 `ProvisionTenant`——单事务产出租户内角色、
  租户管理员用户、角色绑定、`owner` membership；事务外补 Casbin 域策略与平台设置副本。幂等，可重跑修复。
- `backend/modules/system/iam/tenant/tenant_model.go`：`CreateTenantDTO` 增加 `admin_username` /
  `admin_password` / `admin_nickname`（snake_case）。
- `backend/modules/system/iam/tenant/tenant_service.go`：`CreateTenant` 改为建行后调用 `ProvisionTenant`；
  `InitializeTenantDefaults` 由 no-op 改为委派 `ProvisionTenant`（成为修复入口）。

**Casbin 桥接（Phase B）**

- `backend/pkg/tenant/authz.go`：新增 `TenantRoleAdminKey` / `TenantRoleMemberKey` 常量与 `RoleSubject` 用法；
  membership 角色 → `role:<key>@tenant:<id>` 域主体。

**数据隔离（Phase D）**

- `backend/modules/system/iam/user/{user_service,user_helper,user_handler,user_export}.go`：
  `tenantCtx` + `WithTenantContext` + `scoped(db)` + `tenantOwnerID()`；读全部按租户过滤，写落租户；
  用户名唯一性校验限定租户内；`loadUserRoles` join 钉在同租户。
- `backend/modules/system/iam/role/{role_service,role_helper,role_menu,role_handler,role_export}.go`：同上，
  并让 `system_role_data_scope` 的 upsert 以 `(tenant_id, role_key)` 冲突键写入。
- `backend/modules/system/org/dept/{dept_service,dept_tree,dept_governance,dept_handler}.go`：同上。
- `backend/modules/system/org/post/{post_service,post_handler}.go`：同上。
- `backend/modules/system/system_modules.go`：为 user / role / dept / post 路由组补
  `PlatformScopeTenantContextMiddleware`（此前只有 TokenAuth + Casbin）。
- `backend/modules/platform/dashboard_service.go`：`OrgGovernanceTaskLoader` 接口带租户上下文；
  以 `tenantScopedTables` 映射替代 4 表 `switch`，覆盖 18 张租户表。
- `backend/modules/platform/routes.go`：dashboard 路由组补 `CasbinMiddleware`。
- `backend/cmd/server/platform_org_governance.go`：把租户上下文透传给 dept 服务。

**租户切换与头部校验（Phase E）**

- `backend/pkg/tenant/membership.go`：`ListActiveMemberships`、`ValidateExplicitTenant`。
- `backend/internal/middleware/tenant_context_middleware.go`：`X-Tenant-Id` 经真实租户校验；
  新增 `PlatformCapabilityMiddleware`。
- `backend/modules/auth/session/session_service.go`：`SwitchSessionTenant`（保留 sessionId，重签令牌对）
  与 `TenantRoleLoader` 可选端口。
- `backend/modules/auth/login/login_runtime.go`：`roleTenantID` 优先显式多租户上下文。
- `backend/modules/auth/login/login_tenant_switch.go`（新建）：`/auth/tenants/{switchable,current,switch}`。
- `backend/modules/auth/module.go`：注册 `authTenants` 组（TokenAuth + 租户上下文，**刻意不挂 Casbin**——
  权限来源是 membership 表本身）。
- `backend/modules/system/iam/tenant/tenant_switch.go`：删除（死代码，从未注册）。

**登录凭证解析（本轮新增，修真实缺陷）**

- `backend/pkg/contracts/authuser/authuser.go`：新增可选端口 `TenantScopedRepository`。
- `backend/modules/system/iam/user/auth_repository.go`：实现 `FindByUsernameInTenant`；
  `FindByUsername` 加确定性排序（平台主体优先）。
- `backend/modules/auth/login/login_service.go`：命名租户时按 `(tenant_id, username)` 解析。

**租户管理员可用性（本轮新增，修真实缺陷）**

- `backend/internal/middleware/data_scope_middleware.go`：`hasAdminRole` → `hasAdministrativeRole`，
  同时认平台 `admin` 与 `tenant_admin`。
- `backend/modules/system/iam/tenant/tenant_service.go`：`activeTenantMemberPredicate` 限定表名，
  并修正 `copyPlatformSettingsToTenant` 的列集（漏 `group_key`）。

**前端（Phase F）**

- `frontend/src/modules/system/iam/tenant/{api.ts,TenantList.tsx}`：建租户表单增加管理员三字段
  （snake_case 上线）。
- `frontend/src/modules/auth/tenant/{api.ts,TenantSwitcher.tsx}`（新建）：租户切换器，读
  `/auth/tenants/switchable`，仅当可切换租户 ≥ 2 时显示。
- `frontend/src/core/layout/AppLayout.tsx` + `index.css`：把切换器挂到头部，multi 模式且 ≥ 2 租户时可见。
- `frontend/src/i18n/resources/{zh-CN,en-US,fr-FR,ja-JP,ko-KR}.ts`：租户管理员字段与切换器文案。

**测试与证据**

- `backend/modules/system/iam/user/auth_repository_test.go`：租户内解析、跨租户未命中、平台优先。
- `backend/internal/middleware/data_scope_middleware_test.go`：租户管理员不受限；非管理角色仍 fail-closed。
- `backend/modules/system/iam/user/user_service_test.go`：fixture 补 `tenant_id` 列。
- `.tmp/verify_tenant_isolation_phase_g.py`（新建）：34 项实机隔离断言，自带清理。
- 本任务包与证据。

### Out

- 把 `platform.tenant_mode` 切回 `compat`，或修改其**值**。契约 §6 规定单向；部署保持 multi。
- 编辑任何已应用的迁移（000013..000023）。本包以 000024 追加。
- 把 tenants CRUD 从 `system/iam` 迁到 `system/org`（契约 §7）。该错位早于本包，记录为后续项。
- 给平台 `admin` 角色增删任何 Casbin 策略。租户角色策略由 `ProvisionTenant` 按租户新建，与平台角色无关。
- 让租户管理员进入租户管理控制台。该控制台是平台能力，本包显式关闭该路径。
- 让 `X-Tenant-Id` 对非平台主体生效。头部只对平台能力主体有效，这是契约 §3.1 来源 1 的既有约束。
- 修改严格变体 `TenantContextMiddleware` 的拒绝语义。

## Expected Files

### Create

- `backend/pkg/database/migrations/000024_tenant_core_tables_repair.up.sql`
- `backend/pkg/database/migrations/000024_tenant_core_tables_repair.down.sql`
- `backend/modules/system/iam/tenant/tenant_provision.go`
- `backend/modules/auth/login/login_tenant_switch.go`
- `frontend/src/modules/auth/tenant/api.ts`
- `frontend/src/modules/auth/tenant/TenantSwitcher.tsx`
- `.tmp/verify_tenant_isolation_phase_g.py`
- `.harness/tasks/2026-10-13-tenant-true-isolation/manifest.json`
- `.harness/evidence/2026-10-13-tenant-true-isolation/{commands.json,summary.md,review.md}`
- `docs/harness/tasks/2026-10-13-tenant-true-isolation.task.md`

### Modify

- `backend/pkg/tenant/{authz.go,membership.go}`
- `backend/pkg/contracts/authuser/authuser.go`
- `backend/internal/middleware/{tenant_context_middleware.go,data_scope_middleware.go}`
- `backend/modules/auth/{module.go,login/login_runtime.go,login/login_service.go,session/session_service.go}`
- `backend/modules/system/iam/tenant/{tenant_model.go,tenant_service.go}`
- `backend/modules/system/iam/user/{user_service,user_helper,user_handler,user_export,auth_repository}.go`
- `backend/modules/system/iam/role/{role_service,role_helper,role_menu,role_handler,role_export}.go`
- `backend/modules/system/org/dept/{dept_service,dept_tree,dept_governance,dept_handler}.go`
- `backend/modules/system/org/post/{post_service,post_handler}.go`
- `backend/modules/system/system_modules.go`
- `backend/modules/platform/{dashboard_service.go,routes.go}`
- `backend/cmd/server/platform_org_governance.go`
- `frontend/src/modules/system/iam/tenant/{api.ts,TenantList.tsx}`
- `frontend/src/core/layout/AppLayout.tsx`、`frontend/src/core/layout/index.css`
- `frontend/src/i18n/resources/{zh-CN,en-US,fr-FR,ja-JP,ko-KR}.ts`
- `docs/TENANT_INITIALIZATION_GUIDE.md`（v2.0）、`docs/TENANT_INITIALIZATION_FINDINGS_2026-10-13.md`（订正）
- `docs/TENANT_MATURITY_FINAL_2026-09-29.md`（评分订正）

### Do Not Touch

- `backend/pkg/database/migrations/000013..000023_*.sql` 及任何已应用迁移。
- `platform.tenant_mode` 的值。
- 平台 `admin` 的 Casbin 策略数据。
- 严格变体 `TenantContextMiddleware` 的拒绝语义与其对抗测试。
- `.github/workflows/**`、发布脚本、`.sonarcloud.properties`。
- `.harness/archive/**` 与历史 evidence 目录。

## Implementation Notes

- **迁移只加列不加约束的取舍**：`tenant_id` 一律 `NOT NULL DEFAULT 0`，存量行自动落到平台全局作用域，
  compat 行为不变。唯一键只在 `system_user`/`system_role` 上建——这是"租户内唯一"的落点；其余表不加，
  因为同租户内允许多行同名（如部门）。
- **GORM 语句复用是本次最容易踩的坑**。把 `s.scoped(db)` 的结果在多个 `Where`/`Table` 调用间共享会串味：
  GORM 复用 statement，把前一次的表名与条件带到下一次。实测症状是
  `Unknown column 'parent_id' in 'where clause'`（dept 删除守卫）与 `loadDeletableRole` 的用户计数查询。
  修复方式是**每次查询都从原始 `tx` 重新派生一个 scoped 句柄**。
- **Phase C 的初始版本在建租户时整体失败**：`copyPlatformSettingsToTenant` 的 `INSERT ... SELECT` 列集漏了
  `group_key`（`NOT NULL` 且无默认值），MySQL 报 1364，整个 `CreateTenant` 回滚失败。
  修复：复制完整描述性列集（`group_key`/`module`/`label_key`/`description`/`value_type`/`sort`/`remark`/`is_readonly`），
  这样租户设置不仅插得进去，还能正常渲染分组与类型。
- **`activeTenantMemberPredicate` 表名限定是必需的**：Phase A 给 `system_user` 加了 `tenant_id` 之后，
  成员列表的 `LEFT JOIN system_user` 让未限定的 `tenant_id` 变成歧义列，MySQL 报 1052，
  成员列表接口 500（实测：`/system/tenant/22/members` → `tenant.members.error`）。
  修复：谓词写成 `tenant_memberships.tenant_id = ? AND tenant_memberships.status = ?`。
- **登录必须按租户解析凭证**。`FindByUsername` 原先 `Where("username = ?").First()` 取首行；
  Phase A 之后同名用户跨租户存在，租户 `admin`（id 527）永远输给平台 `admin`（id 1），
  表现为"密码错误"——这是整个"真多租户"决策的成败点。修复分两半：
  (a) 命名租户时走 `FindByUsernameInTenant`（`(tenant_id, username)`）；
  (b) 未命名租户时给全局查找加确定性排序，平台主体（`tenant_id = 0`）优先，避免依赖行序。
  端口扩展用**可选接口**（`TenantScopedRepository`）而不是改 `Repository`，这样现有测试替身不受影响，
  与 `session.TenantRoleLoader` 的既有模式一致。
- **数据范围中间件必须认租户管理员**。`hasAdminRole` 只认平台 `admin`，而 `tenant_admin` 没有
  `system_role_data_scope` 行，`rolePoliciesCoverAll` 返回 false，策略回退成 custom + 空部门集，
  结果是**租户管理员看不到任何数据**（实测：用户列表 0 行，尽管库里明明有）。修复：改名为
  `hasAdministrativeRole`，同时认两个键。这不会削弱隔离——`IsAdmin` 只用于跳过行级策略，
  租户收窄由 `WithTenantScope` 无条件施加，两者正交。
- **租户管理控制台是平台能力，必须显式挡住租户管理员**。`tenant_admin` 的
  `role:tenant_admin@tenant:<id>` 覆盖 `/api/v1/*`，能通过 Casbin，于是可以 `GET /system/tenant/list`
  枚举全部租户（实测：拿到 3 行）。新增 `PlatformCapabilityMiddleware` 挂在该路由组上，
  用既有的 `subjectHasPlatformCapability` 判定：全局（无域）策略才算平台能力，
  租户域主体永远不满足。这是"先全局角色/权限，再 domain 内角色"（契约 §4）的自然推论。
- **`X-Tenant-Id` 校验不能只看格式**。此前只解析数字，不校验租户是否存在/可用，
  于是 `X-Tenant-Id: 999999999` 会被接受成一个不存在的上下文。修复：对显式头部走
  `ValidateExplicitTenant`（存在 + 活跃），失败 403 而不是静默回退。
- **切换租户不能重开登录会话**。`SwitchSessionTenant` 保留 `session_id`、重签 access/refresh 对，
  因此客户端不需要重新登录；同时强制"目标必须是活跃租户 + 我是活跃成员"，
  并拒绝同租户空切换。前端切换后整页 reload——菜单树、角色与权限都随租户变化，
  只有重建 shell 才能保证一致。
- **`/auth/tenants/*` 刻意不挂 Casbin**：权限来源是 membership 表本身（契约 §2.2），
  不是角色策略。挂 Casbin 会让"有成员关系但角色策略未授予"的主体无法切换，而成员关系本身就是授权。
- **前端建租户字段必须 snake_case**。`CreateTenantDTO` 绑 `admin_username` / `admin_password` /
  `admin_nickname`，而初版前端发的是 camelCase，会被 Gin **静默忽略**——表单看起来填了，
  结果是没管理员的租户。这是本轮实测抓到的真实缺陷，已在 api.ts 的注释里钉住。
- 租户切换器只在 `tenantMode === 'multi'` 且可切换租户 ≥ 2 时渲染，单租户部署看不到死控件。

## Structural Scope

- Affected Subgraph: `HTTP 请求 -> TokenAuthMiddleware -> PlatformScopeTenantContextMiddleware
  -> pkg/tenant.Resolve -> tenant.Context -> CasbinMiddleware -> DataScopeMiddleware -> handler
  -> service.WithTenantContext -> tenant.WithTenantScope -> SQL`；
  `POST /system/tenant -> ProvisionTenant -> {system_role, system_user, system_user_role,
  tenant_memberships} + Casbin 域策略 + system_setting 副本`；
  `POST /auth/tenants/switch -> SwitchSessionTenant -> 会话重签 + 角色按租户重解析`
- Boundary Crossings: `pkg/contracts/authuser -> modules/system/iam/user`（租户内凭证解析经端口，
  auth 不直接 import system）；`internal/middleware -> pkg/tenant`（平台能力与租户角色键常量下沉）；
  `modules/system/iam/tenant -> pkg/tenant`（租户角色键单一来源）；
  `frontend/core/layout -> modules/auth/tenant`（切换器作为认证域能力挂到 shell）
- Risk Nodes: ① 迁移加 `tenant_id` 会让既有查询的 join 出现歧义列——已由表名限定与实机 34 项断言兜住；
  ② 放宽数据范围可能让非管理员看到全量——保留 `TestDataScopeMiddlewareStillFailsClosedForPlainRoles`
  钉住 fail-closed 的另一半；③ 租户管理员获得 `/api/v1/*` 可能越权到平台面——由
  `PlatformCapabilityMiddleware` + 租户作用域双重约束；④ 登录改为租户内解析可能让平台主体登录失败——
  未命名租户仍走全局查找且平台优先，平台主体路径未变；⑤ 建租户复制设置可能再漏列——本轮把列集补全，
  但列集仍是手写清单，若 `system_setting` 再加 NOT NULL 无默认值列会重演，需在迁移评审时对照
- Graph Focus: 同一个租户上下文必须同时服务"无租户的平台操作者"与"租户主体"，
  且租户主体在任何路径上都不得读到其他租户的行

## Execution Roles

- Implementer Posture: 契约先行 + 实机复现。编辑前先读 §2.2/§2.3/§3.1/§3.3/§4；
  每个缺陷都在 multi 栈上做修复前/修复后对照，宁可用探针也不用断言。
- Reviewer Posture:
  - 核验租户管理员的每一条读路径都被租户作用域约束，且无法经任何头部越权。
  - 核验租户管理控制台对租户管理员返回 403，且该判定用的是全局策略而非角色名硬编码。
  - 核验未命名租户的登录路径仍能让平台主体登录（回归），且同名跨租户不会互相命中。
  - 核验迁移只加列/键，不修改任何已应用迁移，且 `down` 可回滚。
  - 核验 `ProvisionTenant` 幂等：对既有租户重跑只补缺失部分。
  - 核验数据范围放宽只作用于管理角色，非管理角色仍 fail-closed。
- 实现前先读 `docs/contracts/TENANT_CONTRACT_V1.md`、`docs/designs/TENANT_RESOURCE_SCOPE_MATRIX.md`。

## Dependency Plan

| Wave | 优先级 | 工作项 | 依赖 | 关闭条件 |
| --- | --- | --- | --- | --- |
| 0 | P0 | 在 multi 栈复现缺口；读契约 §2.2/§2.3/§3.1/§3.3/§4 | 无 | 每个缺口有可复现失败证据；三项产品决策有契约条款支撑 |
| 1 | P0 | Phase A：迁移 000024 补 18 张表 `tenant_id` + 两个唯一键 | Wave 0 | 迁移双向可跑；`schema_migrations` = 24；`system_user` 唯一键就位 |
| 2 | P0 | Phase B：membership 角色 → Casbin 域主体；租户角色键常量下沉 | Wave 1 | 租户管理员能通过 Casbin 调用控制台 |
| 3 | P0 | Phase C：`ProvisionTenant`；`CreateTenant` 委派；`InitializeTenantDefaults` 成为修复入口 | Wave 2 | 建租户一步产出可登录的租户管理员；幂等重跑只补缺失 |
| 4 | P0 | Phase D：IAM 全量服务租户作用域；dashboard 租户过滤与 Casbin 门；4 个路由组补租户中间件 | Wave 3 | 实机：租户管理员只看本租户；跨租户读/写不可见 |
| 5 | P0 | Phase E：`X-Tenant-Id` 校验；会话级切换；登录租户内凭证解析；租户控制台平台能力门 | Wave 4 | 34 项实机断言全绿 |
| 6 | P1 | Phase F：前端建租户管理员字段（snake_case）+ 租户切换器 | Wave 5 | `tsc -b` 与 eslint 通过；shell 视觉契约通过 |
| 7 | P1 | Phase G：回归测试、文档订正、任务包与证据 | Wave 6 | 目标包单测通过；`gofmt` 无输出；三份文档订正 |

## Verification Plan

- 静态：`cd backend && go build ./...`；`gofmt -l internal/ modules/ pkg/` 应无输出。
- 单测（真 MySQL，`PANTHEON_TEST_DSN` 指向测试库）：
  `go test -count=1 ./internal/middleware/... ./modules/system/iam/user/... ./modules/system/iam/role/... ./modules/system/org/... ./modules/platform/... ./pkg/tenant/...`
  ——**本机例外**：该合并跑需新编译，在本机会无限阻塞（实测 `go vet` 5 分钟仅耗 0.03s user CPU），
  已在 evidence 中标 `not-run`；热缓存下已单独通过 user / role / dept / post / platform / `pkg/tenant` / `pkg/rbacbind`。
- 实机探针：`python .tmp/verify_tenant_isolation_phase_g.py`（34 项，自带清理，覆盖 Phase C/B/D/E/F）。
- 前端：`cd frontend && npx tsc -b`；`npx eslint src/modules/auth/tenant/ src/modules/system/iam/tenant/ src/core/layout/AppLayout.tsx`；
  `npm run check:shell-visual-contract`。
- 文档：`docs/TENANT_INITIALIZATION_GUIDE.md` 的 API 段与实机路由表逐条对齐。

## Evidence Required

- `.harness/evidence/2026-10-13-tenant-true-isolation/commands.json`：每条命令的执行目录、状态与真实输出摘要；
  未执行项必须标 `not-run` 或 `failed` 并写明原因。
- `.harness/evidence/2026-10-13-tenant-true-isolation/summary.md`：四层根因、三项产品决策的落地方式与残余风险。
- `.harness/evidence/2026-10-13-tenant-true-isolation/review.md`：复核结论，含"本机无法执行"项的显式声明。
- 实机证据：`verify_tenant_isolation_phase_g.py` 的 34/34 输出；6 个缺陷（D1–D6）的修复前/后对照；
  `schema_migrations` 23 -> 24 与 18 张表的 `tenant_id` 计数。

## Human Gates

- `platform.tenant_mode` 是否保持 multi 属维护者决策；本包保持不动。
- 租户管理员的能力边界（全量控制台 + 自动收窄）是维护者已确认的产品决策；本包按此实现。
- 用户名租户内唯一是维护者已确认的产品决策；本包按 `(tenant_id, username)` 落地。
- 是否把 tenants CRUD 从 `system/iam` 迁到 `system/org`（契约 §7）是独立的结构性决策，本包刻意不做。
- `system_setting` 若新增 NOT NULL 无默认值列，`copyPlatformSettingsToTenant` 的手写列集需同步评审。

## Linkage

- Task ID: `2026-10-13-tenant-true-isolation`
- Task Manifest: `.harness/tasks/2026-10-13-tenant-true-isolation/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Evidence Directory: `.harness/evidence/2026-10-13-tenant-true-isolation/`
- Review File: `.harness/evidence/2026-10-13-tenant-true-isolation/review.md`
- Plan References: `docs/contracts/TENANT_CONTRACT_V1.md`、`docs/designs/TENANT_RESOURCE_SCOPE_MATRIX.md`、
  `docs/TENANT_INITIALIZATION_FINDINGS_2026-10-13.md`
- Assessment: `docs/harness/tasks/2026-10-13-tenant-true-isolation.task.md`

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] Phase A：18 张表带 `tenant_id`，`system_user` 唯一键 `(tenant_id, username)`
- [x] Phase B：membership 角色桥接到 Casbin 域主体
- [x] Phase C：建租户即完成初始化，幂等可重跑
- [x] Phase D：IAM 全量租户作用域读写；dashboard 租户过滤 + Casbin 门
- [x] Phase E：`X-Tenant-Id` 真实租户校验；会话级租户切换；登录租户内凭证解析
- [x] Phase F：前端建租户管理员字段（snake_case）与租户切换器
- [x] Phase G：34 项实机隔离断言全绿；`gofmt -l` 无输出；目标包单测在热缓存下通过（user / role / dept / post / platform / `pkg/tenant` / `pkg/rbacbind`）；`go vet` 与合并单测跑因本机「新编译/tool 调用阻塞」未能完成，已记入 `runtimeGap` 与 evidence（`not-run`，非静默省略）
- [x] 三份文档订正（指南 v2.0、findings 订正表、成熟度评分订正）
- [x] 6 个本轮新暴露的真实缺陷（D1–D6）已修复，并有回归测试或实机证据
