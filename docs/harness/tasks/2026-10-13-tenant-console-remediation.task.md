---
title: 租户控制台修复任务包（保留行泄漏 / 失效搜索 / 未闭环状态维度 / multi 模式平台锁定）
doc_type: Remediation
layer: platform
depends_on_layers:
  - system/iam
  - system/config
  - system/auth
  - system/org
  - system/i18n
  - system/audit
status: Active
linked_contracts:
  - docs/contracts/TENANT_CONTRACT_V1.md
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/DOCUMENT_GOVERNANCE_CONTRACT.md
  - docs/designs/TENANT_RESOURCE_SCOPE_MATRIX.md
  - docs/designs/TENANT_READY_SINGLE_TENANT_DESIGN.md
  - docs/runbooks/TENANT_MIGRATION_RUNBOOK.md
updated_at: 2026-10-13
---

# Task Packet: 2026-10-13-tenant-console-remediation

## Goal

在 `platform.tenant_mode = multi` 的实机走查中，租户控制台暴露出一个跨三层的缺陷簇。本包一次性修完：
（1）模型/DTO/UI 都在写 `tenants.metadata`，但该列不存在，导致每次新建与编辑都 500；
（2）multi 模式下所有「无租户声明」的主体都被拒绝租户上下文，使整个平台控制台（工作台、字典、系统设置、
操作日志、操作校验）返回 500 `tenant.context.missing`，UI 因此连切回 compat 都做不到；
（3）保留的平台/全局占位行被写在 id 1 而不是 id 0，作为普通租户泄漏进控制台，产生了裸 `__global__`
行与零值时间戳。次级缺陷（装饰性搜索框、未闭环的状态维度、软删除行仍被列出、分页内自相矛盾的汇总计数、
缺失的 i18n 权限键、未格式化的 Go 文件）在同一次改动内关闭。

租户/非租户共存的决策为 **选项 b+c**：把回退同时绑定在「平台能力」与「路由显式声明平台作用域」两个条件上，
使 `multi` 成为 `compat` 的超集，两类主体共用同一套部署。

## Primary Layer

platform

缺陷根因分布在 `internal/middleware`、`pkg/tenant`、`pkg/database/migrations` 与 `modules/system/iam/tenant`，
但修复的判定权与契约归属都在 platform 层：本包修改的是租户上下文解析契约与平台管理面的声明方式，
而不是任何业务域行为。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `not-required`
- Release Requirement: `foundation-release`

## Dependency Layers

- `system/iam`：`tenants` 主数据与租户控制台（`modules/system/iam/tenant`）。本包在其中关闭保留行泄漏、搜索、状态维度与汇总口径。
- `system/config`：`platform.tenant_mode` 公共设置（`publicSettings`）与系统设置页。本包不改其值，只依赖它作为解析输入与菜单能力开关。
- `system/auth`：会话签发（`GateSessionIssuance`）产生「无成员关系的平台用户」，是 P0-2 的前提；`auth/*` 路由组同时被声明为平台作用域。
- `system/org`：契约 §7 把 tenants CRUD 归口到 `system/org`，控制台目前落在 `system/iam`。该错位早于本包，记录为后续项而非在此静默迁移。
- `system/i18n`：五套语言包补齐 `system.permission.tenant.*` 与新增展示键，直接决定 `check:menu-contract` 的红绿。
- `system/audit`：平台作用域声明同时决定审计行落哪个 `tenant_id`。

## Harness Profile

- Template: admin-platform
- Overlay: pantheon-base
- Quality Profile: platform-remediation
- Portable Failure Class: `tenant-context-resolution-gap`
- Owner Layer: platform
- Ratchet Decision: gate-updated（`check:menu-contract` 由红转绿：此前 10 处权限键缺失被当作既有形态，本包补齐语言包使其真正受约束）
- Coverage Dimensions:
  - behaviour
  - runtime-quality
  - maintainability

## Contract Anchors

- `docs/contracts/TENANT_CONTRACT_V1.md`（§2.3 保留 `tenant_id = 0`；§3.1 解析优先级；§3.2 传播与拒绝；§3.3 数据访问不变量与「平台管理 API 必须显式声明」；§3.4 本包新增的平台作用域声明；§4 Casbin 域；§5 错误码；§6 compat 模式与单向切换）
- `docs/contracts/TENANT_CONTRACT_V1.en.md`（英文镜像，与上同步）
- `docs/designs/TENANT_RESOURCE_SCOPE_MATRIX.md`（资源作用域矩阵，判定哪些面属于平台级）
- `docs/designs/TENANT_READY_SINGLE_TENANT_DESIGN.md`（compat 模式下的单租户退化形态）
- `docs/runbooks/TENANT_MIGRATION_RUNBOOK.md`（§8 门禁 G4「无未决契约变更」，本包使其不再自动成立）
- `docs/contracts/PLATFORM_CONTRACT.md`
- `docs/contracts/DOCUMENT_GOVERNANCE_CONTRACT.md`

## Scope

### In

- `backend/pkg/database/migrations/000023_tenant_metadata.up.sql` / `.down.sql`：新增 `tenants.metadata TEXT NULL`，并把保留占位行归一到 id 0。
- `backend/pkg/database/migrations/000022_tenant_mode_public.up.sql` / `.down.sql`：把 `platform.tenant_mode` 设为公开设置，使前端能读到模式（控制台需要它来在表格与 compat 引导态之间选择）。
- `backend/modules/system/config/setting/setting_seed.go`：`platform.tenant_mode` 的 `IsPublic` 0 -> 1，并补齐该设置项在五套语言包中的标签与选项文案。
- `backend/modules/system/seed.go`：租户控制台菜单树（`tenant` 菜单 + 五个 F 型权限行）。此前控制台只有 URL、没有菜单 seed。
- `backend/modules/system/i18n/seed_data.go` 与 `builtin_locale_resources.json`：`system.menu.tenant` 与五个 `system.permission.tenant.*` 的 seed 翻译。
- `backend/modules/system/iam/menu/component_registry.go`：登记 `system/tenant/TenantList` 组件。
- `backend/modules/system/iam/permission/permission_workbench.go`：声明七条 `system:tenant:*` 权限到路由的映射（控制台路由此前完全未映射，属权限契约缺口）。
- `frontend/src/core/router/modules.ts` 与 `componentRegistry.ts`：登记租户模块与 `TenantList` 组件。
- `frontend/src/core/setting/publicSettings.ts`：从公共设置载荷暴露 `tenantMode`（`'compat' | 'multi'`）。
- `backend/pkg/tenant/tenant.go`：`ResolveInput` / `Resolve` 增加平台作用域回退分支与 `ResolvedByPlatformFallback`；表头可显式指定 tenant 0。
- `backend/pkg/tenant/membership.go`：新增 `IsPlatformPopulationUser`（fail-closed 的成员关系探测）。
- `backend/internal/middleware/tenant_context_middleware.go`：新增 `PlatformScopeTenantContextMiddleware`，保留严格的 `TenantContextMiddleware`；平台能力探测覆盖全局 Casbin 策略。
- `backend/internal/middleware/tenant_platform_scope_test.go`：解析矩阵、成员守卫（真 MySQL）、失败信封。
- `backend/internal/middleware/tenant_hostile_smoke_test.go`：严格变体的对抗矩阵保持不动。
- `backend/modules/{auth,platform,lowcode,system}`：为 13 个管理控制台路由组声明平台作用域，其中租户控制台此前完全没有租户中间件。
- `backend/modules/system/iam/tenant`：列表/详情/删除排除保留行，支持 keyword/status/summary，读取与删除守卫 id 0，删除不存在的 id 返回未找到。
- `backend/pkg/tenant/tenant_test.go`：表头 0 在主体具备平台能力时固定到平台全局作用域。
- 前端租户模块：发送 keyword、汇总来自服务端 facets、闭环状态维度（筛选 + 编辑控件）、状态/套餐/角色键缺失时降级、渲染 compat 引导态。
- 前端核心：`useLayoutMenu` 增加 `tenantEnabled` 能力过滤（compat 下把 `system.tenant` 从侧边栏移除）；`dateTime` 把 Go 零值时间视为未设置。
- `backend/modules/system/seed.go`：在 `resolveMenuParentID` 的 `parentPaths` 映射中补 `tenant -> /system/tenant`，使租户权限行归到 `租户管理` 之下；并在 seed 声明了映射表未知的父键时打警告（静默回退到 `parent_id = 0` 正是 P1-6 的成因）。
- 前端 i18n：五套语言包补齐 `status.archived`、`summary.archived`、两个 compat 引导键与五个 `system.permission.tenant.*` 键。
- `docs/contracts/TENANT_CONTRACT_V1.md` 与 `.en.md`：V1.1 澄清（§3.1 第 3 条、新增 §3.4、§3.2 与 §6 附注、§9 变更记录）。
- 本任务的任务包与证据。

### Out

- 把 `platform.tenant_mode` 反向切回 compat。契约 §6 规定切换单向；部署保持 multi，这也是正确方向。
- 修改 `platform.tenant_mode` 的**值**。seed 默认仍是 `compat`，实机行仍是 `multi`。本包确实改了该设置的 `is_public` 标志（0 -> 1，经 000022 与 `setting_seed.go`）与其 i18n 文案，因为控制台不读模式就无法渲染 compat 引导态。这是可见性变更，不是模式变更。
- 给任何角色授予新的 Casbin 策略。本包为租户控制台新增菜单/权限**声明** seed 与 `system:tenant:*` 权限到路由的映射，但不做任何角色策略授予：控制台权限仍需经正常 IAM 流程分配。五个权限键在本包之前就已作为后端 action seed 声明，缺的是它们的 i18n 与菜单行。
- 编辑迁移 000013 或任何已应用的迁移。修复以 000023 追加，历史不可变。
- 让租户作用域变体（严格 `TenantContextMiddleware`）在原则上不可达：它仍是任何未声明平台作用域的路由组的默认拒绝策略。
- 放松成员守卫，使持有成员关系的主体也能隐式回退。此类主体只能经显式 `X-Tenant-Id` 覆盖到达 tenant 0。
- 把 tenants CRUD 的归属从 `system/iam` 迁到 `system/org`。契约 §7 如此规定、控制台违反之，但该问题早于本包，记录为后续项而非在此静默改归属。
- 与本次改动共享同一工作树的**无关工作流**：日志治理留存选项刷新，以及管理员会话与安全事件的 CSV 导出（见 Implementation Notes 的「交错工作流」说明）。其文件不在本包范围内，也不属于本包的证据。

## Expected Files

### Create

- `backend/pkg/database/migrations/000023_tenant_metadata.up.sql`
- `backend/pkg/database/migrations/000023_tenant_metadata.down.sql`
- `backend/pkg/database/migrations/000022_tenant_mode_public.up.sql`
- `backend/pkg/database/migrations/000022_tenant_mode_public.down.sql`
- `backend/internal/middleware/tenant_platform_scope_test.go`
- `backend/modules/system/iam/tenant/tenant_platform_handler.go`
- `backend/modules/system/iam/tenant/tenant_service_list_test.go`
- `.harness/tasks/2026-10-13-tenant-console-remediation/manifest.json`
- `.harness/evidence/2026-10-13-tenant-console-remediation/{commands.json,summary.md,review.md}`
- `docs/harness/tasks/2026-10-13-tenant-console-remediation.task.md`

### Modify

- `backend/pkg/tenant/tenant.go`、`backend/pkg/tenant/membership.go`、`backend/pkg/tenant/tenant_test.go`
- `backend/internal/middleware/tenant_context_middleware.go`
- `backend/modules/auth/module.go`、`backend/modules/platform/routes.go`
- `backend/modules/lowcode/generator/module.go`、`backend/modules/lowcode/dynamicmodule/module.go`
- `backend/modules/system/system_modules.go`
- `backend/modules/system/iam/tenant/tenant_model.go`、`backend/modules/system/iam/tenant/tenant_service.go`
- `backend/modules/system/seed.go`、`backend/modules/system/i18n/seed_data.go`、`backend/modules/system/i18n/builtin_locale_resources.json`
- `backend/modules/system/config/setting/setting_seed.go`
- `backend/modules/system/iam/menu/component_registry.go`
- `backend/modules/system/iam/permission/permission_workbench.go`
- `frontend/src/core/format/dateTime.ts`、`frontend/tests/unit/core/format/dateTime.test.ts`
- `frontend/src/core/layout/useLayoutMenu.tsx`、`frontend/src/core/layout/AppLayout.tsx`
- `frontend/src/core/router/modules.ts`、`frontend/src/core/router/componentRegistry.ts`
- `frontend/src/core/setting/publicSettings.ts`
- `frontend/src/modules/system/iam/tenant/{api.ts,TenantList.tsx}`
- `frontend/src/i18n/resources/{zh-CN,en-US,ja-JP,ko-KR,fr-FR}.ts`
- `docs/contracts/TENANT_CONTRACT_V1.md`、`docs/contracts/TENANT_CONTRACT_V1.en.md`

### Do Not Touch

- `backend/pkg/database/migrations/000013_*.sql` 及任何已应用迁移。
- `platform.tenant_mode` 的**值**（seed 默认与实机行都不动）。
- Casbin 策略数据与任何角色权限授予。
- `.github/workflows/release-gate.yml`、任何发布脚本与 `.sonarcloud.properties`。
- `.harness/archive/**` 与历史 evidence 目录。
- 严格变体 `TenantContextMiddleware` 的拒绝语义与其对抗测试。
- **无关工作流的文件**（同工作树内、不属于本包）：`backend/modules/auth/login/*`、`backend/modules/auth/security/security_service.go`、`backend/modules/auth/session/session_service.go`、`frontend/src/modules/auth/*`、`frontend/src/components/governance/GovernanceCleanupBar.tsx`、`frontend/src/modules/system/audit/OperationLogList.tsx`、`frontend/src/modules/system/config/setting/*`、`frontend/src/modules/system/iam/menu/MenuList.tsx`。

## Implementation Notes

- P0-1 采用前向修复而非改 000013。golang-migrate 按版本号顺序应用且 000013 已在每个环境落账，追加 000023 既保持已应用历史不可变，对新库同样安全。列定义与模型严格一致（`TEXT NULL`、无默认值），使 `Metadata string` 可完整往返。
- 保留行的归一必须用 DML 而非 DDL。MySQL 对 AUTO_INCREMENT 列里「插入 0」理解为「取下一个计数器值」，而 `UPDATE ... SET id = 0` 才真正赋 0；实验台表验证：插入 0 落在 id 2，UPDATE 落在 id 0。故迁移用带守卫的 UPDATE，且仅在 id 0 空槽时执行，不可能撞主键。
- 没有任何行以非零 id 引用该占位行，这是改 id 安全的前提：`tenant_memberships`、`system_setting`、会话与操作日志对该行的引用均为零行。写迁移前已核实。
- 选项 b+c 的形态：回退必须同时满足「路由组声明了平台作用域」「主体持有平台级授予」「主体无活跃成员关系」三条。三者缺一不可——仅声明会让租户主体自行扩权到全局；仅能力会让无声明的租户成员进入平台命名空间；成员探测才是阻止隐式回退遮蔽租户成员关系的那一环（答案不可得时 fail-closed）。
- 平台能力探测接受 canary 的 `platform_ops` 角色键，或任何允许当前请求路由的全局（无域）Casbin 策略。全局策略按构造即平台命名空间，故租户域授予（`role:<key>@tenant:<id>`）永远无法满足它，这正是契约 §4「永不合并、永不隐式提权」得以成立的原因。
- 每个管理控制台路由组都声明为平台作用域，因为在本 base 中它们都是平台管理面：`system/*`（user、role、menu、dept、post、dict、setting、i18n、audit、permission、tenant）、dashboard、`auth/*`、upload 与 lowcode 工具链。租户主体不受影响——来源 2（claim）优先于回退。本 base 不发布任何 `business/*` 路由，那才是真正租户作用域路由组该用严格变体的地方。
- 租户控制台路由组此前完全没有租户中间件，这正是它在其余控制台 500 时仍能工作的原因。现按契约 §3.3 声明为平台作用域：它跨全部租户读写 `tenants`，是教科书式的跨租户平台管理 API；该声明同时给它的审计行一个显式的平台全局 tenant id。
- 表头 `X-Tenant-Id: 0` 现被接受，这是刻意的语义变更：tenant 0 是保留的平台/全局作用域（§2.3/§4），表头是持有成员关系的主体到达它的唯一通路。之所以安全，是因为表头只对具备平台能力的主体生效。原先断言旧行为的 canary 测试被更新，而不是留着失败。
- 汇总计数由数据库以 facets 提供（除 `status` 外的每个筛选条件），因此与分页无关。`total` 保持旧语义（列表显示的筛选计数），`summary.deleted` 单独上报而不是并入它。
- keyword 的 LIKE 模式转义 `%`、`_` 与反斜杠本身，依赖反斜杠是 MySQL 默认的 LIKE 转义符（生产成立）；基于 SQLite 的单元测试刻意避开元字符输入，该行为改由对 MySQL 的端到端覆盖。
- Go 零值时间在共享格式化器中被视为「未设置」，因此修复覆盖每一个渲染时间戳的页面，而不只是租户控制台。
- UI 选项 3 的最终形态（维护者细化后）：`platform.tenant_mode` 同时约束**可发现性**与行为。compat（单租户）下 `租户管理` 菜单从 `访问控制` 移除；multi（多租户）下保留。页面本身在 compat 下仍渲染引导态（含跳转平台设置的链接）而非表格，因此直接 URL 访问或旧书签不会看到空表。隐藏菜单与页面兜底是两个独立决策，都刻意保留。
- P1-6（菜单父级解析）：`resolveMenuParentID` 用硬编码的 `parentPaths` 映射把 seed 的 `ParentKey` 解析成 `parent_id`，而该映射**没有 `tenant` 条目**。`tenantMenuSeeds` 声明 `ParentKey: "tenant"`，查找落空后**静默返回 0**，于是五个 F 型权限行全部 `parent_id = 0`，在菜单管理里渲染成顶级条目。父行 `租户管理` 本身是对的（`parent_id = 1`），因为 `access` 在映射里。修复只需补一个映射项：`ensureSingleMenuSeed` 会按 perms 找到既有行并调用 `updateSeedMenu` 重写 `parent_id`，所以**启动时的常规 re-seed 就修好了存量数据，不需要数据迁移**。已把每个 seed 用到的 `ParentKey` 与映射表逐一比对，`tenant` 是唯一遗漏项；并在映射落空时改为打警告而非静默返回 0——静默回退正是这个缺陷能穿过评审的原因。
- 两处既有的 gofmt 违规在同一次改动内修复，因为那些文件本来就要碰。
- **交错工作流（范围诚实性说明）**：本包验证时所在的工作树同时承载**两个互不相关的改动集**。本包拥有租户控制台这一改动。同一棵树里还有第二个未提交的工作流：日志治理留存选项刷新，以及管理员会话与安全事件的 CSV 导出（`backend/modules/auth/login/*`、`backend/modules/auth/security/security_service.go`、`backend/modules/auth/session/session_service.go`、`system:session:export` 与 `system:security-event:export` 权限行、`frontend/src/modules/auth/*`、`frontend/src/components/governance/GovernanceCleanupBar.tsx`、`frontend/src/modules/system/audit/OperationLogList.tsx`、`frontend/src/modules/system/config/setting/*`，以及 `frontend/src/modules/system/iam/menu/MenuList.tsx` 里一处 hero key 改名）。这些文件不属于本包，也不在本包证据覆盖范围内。有两个文件确实被两者共同改动：`backend/modules/auth/module.go`（本包把 `TenantContextMiddleware` 换成平台作用域变体；另一工作流新增两条导出路由）与 `backend/modules/system/iam/permission/permission_workbench.go`（本包新增七条 `system:tenant:*` 路由映射；另一工作流新增两条导出映射）。读者不应把本包证据当作对导出工作流的验证。
- 租户控制台菜单必须新建 seed，因为它此前不存在：本包之前控制台只有 URL、菜单里没有入口，其五个权限键只有后端 action seed、没有菜单行也没有翻译。本包补齐菜单树、权限行与翻译——这就是 `seed.go`、`seed_data.go`、`builtin_locale_resources.json` 与 `component_registry.go` 在范围内的原因。本包不向任何角色授予 Casbin 策略。
- `platform.tenant_mode` 被设为公开（`is_public` 0 -> 1，以 000022 追加并在 `setting_seed.go` 镜像），因为前端不读模式就无法在租户表格与 compat 引导态之间选择。该设置的**值**未被触碰：seed 默认仍是 `compat`，实机行仍是 `multi`，与指示一致。

## Structural Scope

- Affected Subgraph: `HTTP 请求 -> TokenAuthMiddleware -> PlatformScopeTenantContextMiddleware -> pkg/tenant.Resolve -> tenant.Context -> CasbinMiddleware -> handler`；`GateSessionIssuance（无声明签发）-> 平台用户群体 -> IsPlatformPopulationUser（请求侧复核）`；`tenants 主表 -> ListTenants/GetTenantByID/DeleteTenant -> 租户控制台 -> 前端租户模块`；`公共设置（platform.tenant_mode）-> 菜单能力过滤 -> 租户控制台可见性`
- Boundary Crossings: `internal/middleware -> pkg/tenant`（解析逻辑从中间件下沉到契约包）；`modules/{auth,platform,lowcode,system} -> internal/middleware`（路由组选择性加入平台作用域）；`backend/pkg/database/migrations -> tenants DDL`（新列 + 保留行归一）；`docs/contracts -> backend`（契约澄清是代码改动的唯一依据）
- Risk Nodes: ① 放宽上下文解析可能把平台全局作用域交给租户主体——由「平台级授予 + 零成员关系」双重 fail-closed 约束，解析矩阵测试固定每个条件与「主体 claim 优先于回退」；② 把占位行归一到 id 0 会改主键——由 id 0 空槽守卫与「无表引用旧 id」的核实兜底；③ 给本该保持严格的路由组声明平台作用域会静默放宽——只声明管理控制台面，且严格变体仍是未声明组的默认；④ 列表响应新增 `summary` 属增量且客户端可选，`total` 语义不变；⑤ 把 Go 零值时间视为未设置会改变跨页共享格式化器——仅影响此前被渲染成伪造时间戳的值
- Graph Focus: 同一套租户上下文必须同时服务「无租户的平台操作者」与「租户主体」，且任一方向都不得进入对方的作用域

## Execution Roles

- Implementer Posture: 契约先行。编辑前先读 §2.3/§3.1/§3.2/§3.3/§4/§6 与资源作用域矩阵，再改契约、让代码与之匹配。每个缺陷都在实机 multi 栈上做修复前/修复后复现；宁可用探针，也不用断言。
- Reviewer Posture:
  - 核验回退无法被持有成员关系或缺平台级授予的主体触达。
  - 核验保留占位行已从每条读路径（列表、详情、删除）消失，且 id 0 无法被软删除。
  - 核验契约修订未触碰 §2/§4/§5/§7，且 §3.1 第 1/2 条含义不变。
  - 核验未向任何角色授予新 Casbin 策略，且 `platform.tenant_mode` 的**值**未被修改（`is_public` 由 0 改为 1 是范围内且已声明）。
  - 核验新增的菜单/权限 seed 与 `system:tenant:*` 路由映射只是**声明**，没有顺带授予角色权限。
  - 核验本包证据没有被误读为覆盖同工作树内的导出/留存工作流。
  - 核验被改动的 canary 断言（表头 0）由契约文本支撑，而不是为了「让测试通过」。
- 实现前先读 `docs/contracts/TENANT_CONTRACT_V1.md`、`docs/designs/TENANT_RESOURCE_SCOPE_MATRIX.md` 与 `docs/runbooks/TENANT_MIGRATION_RUNBOOK.md`。

## Dependency Plan

| Wave | 优先级 | 工作项 | 依赖 | 关闭条件 |
| --- | --- | --- | --- | --- |
| 0 | P0 | 在实机 multi 栈复现全部缺陷；读契约 §2.3/§3.1/§3.2/§3.3/§4/§6 与资源作用域矩阵 | 无 | 每个 P0 有可复现的失败证据；b+c 的判定依据有契约条款支撑 |
| 1 | P0 | 契约 V1.1 澄清（§3.1 第 3 条、新增 §3.4、§3.2/§6 附注、§9）中英同步 | Wave 0 | 中英一致；§2/§4/§5/§7 未动 |
| 2 | P0 | 迁移 000023（metadata 列 + 保留行归一）；`pkg/tenant` 回退分支与成员守卫；中间件平台作用域变体 | Wave 1 | `go build ./...` 通过；解析矩阵与成员守卫测试通过 |
| 3 | P0 | 13 个路由组声明平台作用域；租户控制台后端（排除保留行、keyword/status/summary、id 0 守卫） | Wave 2 | 实机探针：此前失败的平台端点全部 200；保留行从列表消失 |
| 4 | P1 | 前端租户模块（keyword、服务端汇总、状态维度闭环、compat 引导态）；核心（菜单可见性、零值时间）；五套语言包 | Wave 3 | 前端 13 道门禁全绿；`tsc -b` 通过；dateTime 单测通过 |
| 5 | P1 | 任务包、证据、复核记录；跑 harness 门禁 | Wave 4 | `check-task-packet` / `check-evidence --strict` / `check-adoption` 全绿；未执行项显式声明 |

## Verification Plan

- 静态：`cd backend && go build ./...`；`gofmt -l modules/ internal/ pkg/` 应无输出；`go vet ./pkg/tenant/... ./internal/middleware/...`。
- 单测：`cd backend && go test ./pkg/tenant/... -count=1`；`go test ./internal/middleware/... -count=1`；`go test ./modules/auth/... -count=1`。
- 真 MySQL 守卫：`PANTHEON_TEST_DSN=... go test ./internal/middleware/ -run TestPlatformScopeTenantContextMiddleware_MembershipBlocksImplicitFallback -count=1 -v`。
- 实机探针：`python .tmp/verify_tenant_remediation.py`（multi 模式 30 项检查，覆盖平台端点可达性、保留行排除、keyword、status 维度、summary 自洽、软删除、id 0 守卫）。
- 菜单修复探针：`python .tmp/verify_tenant_menu_fix.py`（18 项检查：`/system/tenant` 是否嵌在 `/system/access` 下、五个租户权限行是否为 `租户管理` 的子节点、根节点是否无租户权限行、以及复刻前端能力过滤后 compat 是否移除 `租户管理` 而 multi 保留）。
- 前端门禁：`cd frontend && node ./scripts/check-*.mjs`（13 道）；`node ./node_modules/typescript/bin/tsc -b`；`node ./node_modules/vitest/vitest.mjs run tests/unit/core/format/dateTime.test.ts`。
- 仓库门禁：`node scripts/harness/check-task-packet.mjs --root .`；`node scripts/harness/check-evidence.mjs --root . --strict`；`node scripts/harness/check-adoption.mjs --root .`。
- 文档门禁：`node scripts/harness/check-doc-frontmatter.mjs --root .`；`node scripts/harness/check-doc-links.mjs --root .`；`node scripts/harness/check-doc-inventory.mjs --root .`。

## Evidence Required

- `.harness/evidence/2026-10-13-tenant-console-remediation/commands.json`：每条命令的执行目录、状态与真实输出摘要；未执行项必须标 `not-run` 或 `failed` 并写明原因。
- `.harness/evidence/2026-10-13-tenant-console-remediation/summary.md`：三层根因、选项 b+c 的推理与残余风险。
- `.harness/evidence/2026-10-13-tenant-console-remediation/review.md`：复核结论，含「本机无法执行」项的显式声明。
- 实机证据：multi 模式下平台端点修复前/后对照；租户控制台修复前/后对照；`schema_migrations` 22 -> 23 与占位行 id 1 -> 0。

## Human Gates

- 是否保持 `platform.tenant_mode = multi` 属维护者决策；本包保持不动，依据契约 §6 单向规则与「保持 multi 不动」的明确指示。
- 契约修订使 runbook §8 门禁 G4（「无未决契约变更」）不再自动成立。只有维护者能决定是否重新授予 G4；本包不声明其已授予，生产 DDL/数据变更禁令不受影响。
- 是否把 tenants CRUD 从 `system/iam` 迁到 `system/org`（契约 §7）是独立的结构性决策，本包刻意不做。
- compat 下 `租户管理` 菜单是否可见是产品决策。最初按「两种模式都可见」（UI 选项 3）实现，随后维护者细化为「compat 隐藏、multi 可见」，当前实现遵循细化后的决定，且去掉 `tenantEnabled` 门即可回退。

## Linkage

- Task ID: `2026-10-13-tenant-console-remediation`
- Task Manifest: `.harness/tasks/2026-10-13-tenant-console-remediation/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Evidence Directory: `.harness/evidence/2026-10-13-tenant-console-remediation/`
- Review File: `.harness/evidence/2026-10-13-tenant-console-remediation/review.md`
- Plan References: `docs/contracts/TENANT_CONTRACT_V1.md`、`docs/designs/TENANT_RESOURCE_SCOPE_MATRIX.md`、`docs/runbooks/TENANT_MIGRATION_RUNBOOK.md`
- Assessment: `docs/harness/tasks/2026-10-13-tenant-console-remediation.task.md`

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] 契约 V1.1 澄清先于实现完成，且中英同步
- [x] P0-1 metadata 列以追加迁移落地，新建与编辑实机验证通过
- [x] P0-2 multi 模式下每个此前失败的平台端点均实机可达
- [x] P0-3 保留占位行归一到 id 0 并从列表/详情/删除排除
- [x] P1-1..P1-5 与 P2-1/P2-2 关闭，并有测试或实机探针覆盖
- [x] 前端门禁、TypeScript 构建与 dateTime 单测全绿
- [x] 任务包、证据与复核已记录；未执行项连同原因显式声明
- [x] P1-6 菜单父级解析修复：五个租户权限行已归到「访问控制 → 租户管理」之下（实机 18/18 校验）
- [x] P1-7 compat 下「租户管理」菜单从「访问控制」移除，multi 下保留
