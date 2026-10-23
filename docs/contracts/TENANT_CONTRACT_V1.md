---
title: 租户合同 V1（共享 schema MVP）
doc_type: Contract
layer: platform / system/auth / system/iam / system/org / system/config
status: Approved
related_designs:
  - docs/designs/TENANT_READY_SINGLE_TENANT_DESIGN.md
  - docs/designs/TENANT_RESOURCE_SCOPE_MATRIX.md
  - docs/designs/P2_SCALE_ROADMAP.md
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/SYSTEM_AUTH_CONTRACT.md
  - docs/contracts/SYSTEM_IAM_CONTRACT.md
  - docs/contracts/SYSTEM_ORG_CONTRACT.md
  - docs/contracts/SYSTEM_CONFIG_CONTRACT.md
updated_at: 2026-10-23
---

# 租户合同 V1（共享 schema MVP）

English version: [TENANT_CONTRACT_V1.en.md](./TENANT_CONTRACT_V1.en.md)

本合同是 `2026-09-10-tenant-contract-design` 任务的冻结交付物，为 [P2 规模化路线图](../designs/P2_SCALE_ROADMAP.md) 的租户化阶段提供共享 schema MVP 的执行契约。设计依据见 [单租户先行、租户就绪设计](../designs/TENANT_READY_SINGLE_TENANT_DESIGN.md)。

冻结 = 冻结 V1 的 **模型、所有权边界、不变量**；具体表结构演进由 runbook（`2026-09-10-tenant-migration-runbook`）约束。

关联设计：
- `docs/designs/TENANT_READY_SINGLE_TENANT_DESIGN.md`
- `docs/designs/TENANT_RESOURCE_SCOPE_MATRIX.md`
- `docs/designs/P2_SCALE_ROADMAP.md`

---

## 1. 范围（In / Out）

### In

- 租户（Tenant）主数据模型与生命周期（active / suspended / archived）
- 租户成员（TenantMembership）：用户与租户的多对多归属及成员角色
- 租户上下文（Tenant Context）：请求级租户解析、注入、传播与校验
- 资源租户归属：业务/系统资源通过 `tenant_id` 归属租户，配 resource scope 矩阵约束
- Casbin domain 维度的权限隔离（policy 带 tenant domain）
- Compat 模式：单租户兼容开关，保证现有单租户部署零迁移继续运行

### Out

- 独立 schema / 独立 database 隔离模型（V1 仅共享 schema + `tenant_id`）
- 租户计费、套餐、配额（归商业域，另行立项）
- 跨租户数据共享/联邦查询
- 租户级自定义域名、独立部署形态

---

## 2. 核心模型（冻结）

### 2.1 Tenant 主数据

```
tenants
  id            bigint PK          -- 雪花 ID，由 ID 生成器分配
  code          varchar(64)  UK    -- 租户编码，全局唯一，创建后不可变
  name          varchar(128)       -- 显示名
  status        varchar(16)        -- active | suspended | archived | deleted（墓碑，见不变量）
  plan          varchar(32)        -- 预留：套餐标记（V1 不消费）
  created_at / updated_at
  deleted_at                       -- 预留列，当前实现不写入（见不变量）
```

不变量：
- `code` 创建后不可变；匹配 `^[a-z][a-z0-9-]{1,62}$`
- `status` 流转仅允许：`active ↔ suspended`，`active|suspended → archived`；`archived` 终态不可逆
- `archived` 租户禁止登录、禁止发放新 token、禁止产生新业务写入
- 删除仅允许对 `archived` 租户执行，且为运维动作，不暴露给业务 API
- `deleted` 是**墓碑（tombstone）**，不是生命周期状态（V1.3 澄清）：只由删除动作在 `archived`
  之后写入，与释放 `code` 在同一事务内完成；它没有出边，**不得作为创建或更新的输入**，也不出现在
  默认列表里（仅显式状态过滤可见）。按 id 或 `code` 寻址已删除租户一律视为不存在（与 §5
  「缺失与他租户不可区分」一致），因此已删除租户无法被重新激活、无法新增成员、也无法重新初始化。
- 删除 `archived` 租户时，其剩余成员关系在同一事务内被置为停用：§2.2 的 owner 要求只约束
  **非归档**租户，归档后成员关系不再构成删除的阻碍（V1.3 澄清）。
- 删除标记是 `status = 'deleted'`，**不是** `deleted_at`：该列在表结构中预留，当前实现不写入，
  查询也不以它过滤。两套标记并存会让「是否已删除」出现两个可能不一致的答案。

### 2.2 TenantMembership

```
tenant_memberships
  id            bigint PK
  tenant_id     bigint       -- FK → tenants.id，复合唯一键前缀
  user_id       bigint       -- FK → iam users.id，复合唯一键前缀
  role          varchar(32)  -- owner | admin | member（租户内角色，非全局角色）
  status        varchar(16)  -- active | disabled
  created_at / updated_at
  UK(tenant_id, user_id)
```

不变量：
- 一个 user 可属于多个 tenant；同一 `(tenant_id, user_id)` 唯一
- 每个非 archived 租户至少一个 `owner`；转移 owner 是显式 API 动作
- membership 删除 = `status=disabled`（软禁用），不物理删除，保证审计链完整
- 租户内角色（owner/admin/member）与全局 IAM 角色（`iam roles`）**命名空间分离**，不做隐式映射

### 2.3 资源租户归属（tenant_id 传播）

- 需要租户归属的表统一增加 `tenant_id bigint NOT NULL DEFAULT 0`：
  - `tenant_id = 0` 保留给 **平台级 / 全局资源**（compat 模式下的存量数据即全局资源）
  - `tenant_id > 0` 表示租户私有资源
- 哪些表带 `tenant_id`、哪些保持全局，由 [租户资源 scope 矩阵](../designs/TENANT_RESOURCE_SCOPE_MATRIX.md) 登记，新增表必须在登记表注册后才允许合入（见验收矩阵 T4）
- **禁止**：`tenant_id` 可空（NULL 语义歧义）；用字符串租户编码做外键；业务代码直接 `WHERE tenant_code = ?`

#### 2.3.1 读写义务（V1.2 补充，2026-10-19）

`tenant_id` 是**行的身份**，不是装饰字段。带 `tenant_id` 的表，任何读写代码必须同时满足下列三条；三条各自可被 reviewer 单独引用驳回。

1. **读必须带租户谓词。** 查询必须附加 `tenant_id = ctx.tenant_id`（或经 §3.3 的 scope helper 注入）。
   「租户内唯一」的业务键（`role_key`、`username`、`dept_code`、`post_code` 等）在库里的唯一约束是
   `(tenant_id, key)`，**不是全局唯一**。因此 `WHERE role_key = ?` 本身就是跨租户读取，
   即使加了 `LIMIT 1`、即使只用来回显一个字段。
2. **写必须由上下文赋值租户。** `tenant_id` 只能来自请求上下文（§3.2），不得来自请求体；
   upsert 的冲突键 / `ON CONFLICT` 必须包含 `tenant_id`。以裸键作为冲突键会把租户私有行**改写成
   `tenant_id = 0` 的平台行**，而平台行对所有租户生效——这是最隐蔽的一种放大，因为写入方看到的只是「保存成功」。
3. **按裸键做存在性或归属校验同样算读。** 「这个 `role_key` 存在吗」「这些 `dept_id` 是我的吗」
   这类判断必须带租户谓词。否则一个租户可以用猜到的键，给另一个租户的资源建策略，
   或把另一个租户的主数据 id 写进自己的配置（`dept_id`、`post_id` 是全局序列，同一数字在不同租户指不同对象）。

**唯一的两个放行面**（对应 §3.3 的 cross-tenant 两条路径）：

| 作用域 | 可以读写 | 不因此获得 |
|---|---|---|
| 平台作用域（`ctx.tenant_id = 0`，需 §3.4 声明 + 平台能力） | `tenant_id = 0` 的全局行 | 按裸键操作**租户私有行**的权力 |
| 租户作用域（`ctx.tenant_id > 0`） | 自己那一份 | 任何其他租户的行，包括「同名」行 |

上下文缺失且非 compat → 按 §3.2 拒绝，**不得退化为「读全部」**；策略/配置读不到时的默认行为是 fail-closed，
而不是回到最宽松的一档。

> 可引用条款：reviewer 驳回一个 `WHERE role_key = ?` 时引用「§2.3.1 第 1 条」；驳回一个
> `ON CONFLICT(role_key)` 时引用「§2.3.1 第 2 条」；驳回一个不带租户的 `Count()` 归属校验时引用「§2.3.1 第 3 条」。
> 本条款的回归测试：`backend/internal/middleware/data_scope_tenant_test.go`、
> `backend/modules/system/iam/permission/permission_data_scope_tenant_test.go`。

---

## 3. 租户上下文（冻结）

### 3.1 解析优先级（从高到低）

1. 显式 header `X-Tenant-Id`（平台运维/后台管理场景，要求平台级权限 + 审计）
2. 认证主体（JWT claims 中的 `tenant_id`，登录时根据"用户默认租户"或登录请求指定租户签发）
3. 平台作用域兜底：请求落在**显式声明为平台管理 API 的路由**上，且主体具平台级能力、且不属于任何租户 → `tenant_id = 0`（multi 模式，见 §3.4）
4. Compat 模式兜底：`tenant_id = 0`

> **V1.1 澄清（2026-10-13）**：V1 原文只有第 1/2/4 条，且把兜底限定在 compat 模式，于是 multi 模式下"非租户（平台）主体"被判为 §3.2 的"上下文缺失"（500 `TENANT_CONTEXT_MISSING`），平台控制台在 multi 下整体不可用。新增的第 3 条把 §3.3 早已承认的"平台管理 API（显式声明，要求平台权限，落审计）"落到解析层：**`multi` 是 `compat` 的超集**，`tenant_id = 0`（平台级/全局，§2.3/§4）在两种模式下都是一等作用域。第 1/2 条优先级不变，原 compat 兜底语义不变（仅编号后移为第 4 条）。

### 3.2 传播规则

- 租户上下文在 **认证中间件之后、业务 handler 之前** 确定，随后只读
- 业务代码 **只读** 上下文，不允许在 handler 内改写当前请求的租户上下文
- 后台/异步任务必须显式携带租户上下文（worker 消息带 `tenant_id`），禁止依赖进程级全局
- 上下文缺失且非 compat 模式 → 请求拒绝（500 分类为配置错误，401/403 分类为认证/授权错误，见 §5）。**适用范围**：未声明平台作用域的路由组；已声明为平台管理 API 的路由按 §3.1 第 3 条解析（见 §3.4）

### 3.4 平台作用域声明（V1.1 澄清）

§3.3 要求平台管理 API 必须"显式声明"。声明的载体是**路由组**，也是 §3.1 第 3 条兜底的启用条件：

- **未声明**的路由组保持 V1 语义：multi 模式下无 claim 即拒绝（deny-by-default），不享有平台作用域兜底。
- **已声明**的路由组额外获得一条兜底，但需同时满足两个条件，缺一不可：
  1. 主体具**平台级能力** —— 全局角色（如 `platform_ops`）或全局（无 domain）Casbin policy 允许该路由；租户域内角色（`role:<key>@tenant:<id>`）不构成平台能力（§4：两个命名空间不合并、不隐式提升）。
  2. 主体**不属于任何租户** —— 无 active membership。该主体正是 §3.1 第 2 条里"零成员 → 无 claim 签发"的平台人群，两侧判定必须一致。
- 因此兜底永不覆盖第 1/2 条：有 claim 的主体走第 2 条；有 membership 的主体只能通过第 1 条显式 header 落到平台作用域（需平台级能力）。
- 兜底只决定**上下文**，不放宽 §3.3 的读取不变量：解析到 `tenant_id = 0` 的请求只能读写平台/全局行。
- 参考实现：`internal/middleware.PlatformScopeTenantContextMiddleware`（声明侧）与 `internal/middleware.TenantContextMiddleware`（未声明侧的严格语义），解析逻辑在 `pkg/tenant.Resolve`。

### 3.3 数据访问不变量（最关键）

- 所有带 `tenant_id` 的表，业务查询 **必须** 附加 `tenant_id = ctx.tenant_id`（或经统一 scope helper / GORM scope 注入）
- 禁止业务代码手写裸查询绕过 scope helper；cross-tenant 读取仅允许两种路径：
  1. 平台管理 API（显式声明，要求平台权限，落审计）
  2. 统计/报表聚合（经 platform 层专用通道，只读副本或只读事务）
- 写路径必须经统一 helper 注入 `tenant_id`，禁止从请求体读取 `tenant_id` 决定写入归属（唯一例外：平台管理 API 显式指定）

---

## 4. Casbin domain 维度（冻结）

- Casbin policy 的 domain 字段取 `tenant:<tenant_id>`；全局（compat/平台级）用 `tenant:0`
- 角色命名空间：租户内角色映射为 `role:<name>@tenant:<tenant_id>`；全局角色不携带 domain
- 权限检查顺序：先全局角色/权限（平台能力），再 domain 内角色（租户能力）；二者不合并、不隐式提升
- 存量 policy 迁移：compat 模式下全部视为 `tenant:0`，迁移由 runbook 执行，不做隐式转换

---

## 5. 错误码（冻结）

| 场景 | HTTP | code |
|------|------|------|
| header 指定租户但主体无平台权限 | 403 | `TENANT_FORBIDDEN` |
| 主体无该租户 membership 或 membership disabled | 403 | `TENANT_FORBIDDEN` |
| 租户 suspended / archived 时登录或写入 | 403 | `TENANT_SUSPENDED` / `TENANT_ARCHIVED` |
| 上下文缺失（非 compat） | 500 | `TENANT_CONTEXT_MISSING`（配置错误，告警） |
| 资源不属于当前租户（查询返回空，不泄露存在性） | 200/404 | 不引入新码：返回空集或 404，不区分"不存在"与"他租户" |

---

## 6. Compat 模式（冻结）

- 开关：`system/config` 的 feature flag（`tenant.mode = compat | multi`，默认 `compat`），运行时可读、变更走 config 变更流程
- `compat` 模式行为承诺：
  - 现有单租户部署 **零迁移** 继续运行：`tenant_id = 0` 语义，解析优先级直接落 §3.1 第 3 条
  - 不校验 membership； Casbin 全部 `tenant:0`
  - 存量测试、存量 API 行为不变 —— 这是 canary 期（`2026-09-10-tenant-canary-slice`）的回归底线
- `multi` 模式行为：完整启用 §3/§4/§5
- **`multi` 是 `compat` 的超集**（V1.1 澄清）：multi 下 §3.1 第 4 条（compat 兜底）不再生效，但平台级/全局作用域（`tenant_id = 0`）依然是一等作用域（§3.1 第 3 条）。因此**同一部署内非租户（平台）主体与租户主体并存**，`platform.tenant_mode` 表达的是"是否启用租户维度"，而不是"整站二选一的世界开关"
- 模式切换只允许 compat → multi 单向（per 部署），回退 = 数据回滚（runbook），禁止 multi 运行后直接改回 compat 继续写入

---

## 7. 所有权边界（冻结）

| 关注点 | 归属域 | 禁止 |
|--------|--------|------|
| tenants 主数据 CRUD、生命周期 | `system/org`（租户即组织实体） | auth/iam/business 直接写 tenants 表 |
| membership 管理 | `system/org` 提供能力，`system/iam` 消费（登录时读取） | iam 维护 memberships 表 |
| 登录时租户解析与 claims 签发 | `system/auth` | auth 直查 tenants 表（经 org 的读接口/gRPC/进程内接口） |
| Casbin domain 规则 | `system/iam` | auth 或业务模块自建 domain 规则 |
| feature flag `tenant.mode` | `system/config` | 各模块自造开关 |
| tenant_id scope helper | `platform` | 各域复制粘贴私有实现 |
| 业务资源租户归属 | `business/*`（按矩阵登记） | business 定义自己的隔离机制 |

---

## 8. 验收锚点

- [租户就绪四项检查](../acceptances/BUSINESS_MODULE_ACCEPTANCE_MATRIX.md)（矩阵 T1–T4）适用于所有触碰租户语义的变更
- canary 切片（任务 3）是本合同行为承诺的首个运行态验证，其隔离测试即合同验收测试
- 合同变更：V1 冻结后修改需走 contract-change 流程（改版本号 + 变更记录 + 对应 runbook/matrix 同步）

---

## 9. 变更记录

| 版本 | 日期 | 变更 | 性质 |
|------|------|------|------|
| V1.1 | 2026-10-13 | §3.1 新增第 3 条「平台作用域兜底」（原第 3 条顺延为第 4 条，语义不变）；新增 §3.4「平台作用域声明」；§3.2 补注拒绝规则的适用范围；§6 补注「multi 是 compat 的超集」 | 澄清（Clarification） |
| V1.2 | 2026-10-19 | 新增 §2.3.1「读写义务」：读必须带租户谓词、写必须由上下文赋值且冲突键含租户、按裸键的归属校验同样算读；给出唯一两个放行面与 fail-closed 默认 | 澄清（Clarification） |
| V1.3 | 2026-10-23 | §2.1 补入第四态：`deleted` 是墓碑而非生命周期状态、不可作为输入、按 id/code 寻址视为不存在；明确删除标记是 `status` 而非预留的 `deleted_at`；明确删除归档租户时其成员关系同事务停用（§2.2 的 owner 要求只约束非归档租户） | 澄清（Clarification） |

**V1.3 的触发与范围**

- 触发：2026-10-22 的交付验收把「`deleted` 未进合同」登记为 P3 残余；补写时实测发现该缺口背后
  有一个真实缺陷：`tenantStatusTransitionAllowed` 对未知的当前状态走 `default: return true`，
  而 `UpdateTenant` 读取租户行时不过滤墓碑，于是一个 `PUT {"status":"active"}` 就能把已删除的租户
  **复活**——它会带着删除时写入的合成 code（`__deleted_tenant_<id>`，违反本节的 `code` 正则）
  回到活跃列表，成员关系却仍是停用状态。同一条路径还允许给墓碑新增成员、对墓碑重新初始化。
- 缺口定位：§2.1 只列了三个状态与「删除仅允许对 archived 执行」，没有说清删除在存储层留下什么、
  留下之后是否还能被寻址。实现选择了 `status = 'deleted'` 的墓碑语义，合同没有承认它，于是
  「墓碑不是生命周期状态」这条约束既没被写下来、也没被状态机执行。
- 澄清范围：只在 §2.1 增加状态取值说明与三条不变量，**不新增概念、不改任何既有条款的语义**。
  §2.2 的 owner 要求原文不动（V1.3 只是明确它约束的是非归档租户，这正是原文「every non-archived
  tenant」的字面含义）；§3（上下文）、§4（Casbin domain）、§5（错误码）、§6（模式）、§7（归属边界）
  均未改动。删除仍只允许对 `archived` 执行，仍是运维动作。
- 配套实现与回归测试：`tenantStatusTransitionAllowed` 增加 `deleted` 分支、`GetTenantByID` 把墓碑
  视为不存在；`backend/modules/system/iam/tenant/tenant_lifecycle_guard_test.go`
  （`TestDeletedTenantCannotBeRevivedByUpdate`、`TestDeletedTenantRefusesNewMembers`、
  `TestDeletedTenantCannotBeReprovisioned`）。

**V1.2 的触发与范围**

- 触发：任务 `2026-10-19-tenant-permission-isolation-remediation` 的 W0。2026-10-19 的租户交付验收在实机测出
  6 个同源缺陷（F7/F8/F9/F10/F11/F13）：`system_role_data_scope` 早已带 `tenant_id` 与 `(tenant_id, role_key)` 唯一键，
  但读、写、校验三条路径里有一半按裸 `role_key` 工作，实测一个租户能列出 53 个角色（自己只有 3 个）、
  能给另一租户独有的角色写数据范围、且改写后让另一租户的普通用户可见行数从 1 变成 3。
- 缺口定位：§3.3 已经要求「所有带 `tenant_id` 的表必须附加租户谓词」，但它写在**上下文**一章，
  描述的是「查询」；§2.3 讲归属时只说了「哪些表带 `tenant_id`」，没有说「带了之后读写各有什么义务」。
  于是「表里有没有这一列」被当成合规判据，而「路径上有没有用这一列」没人检查。
- 范围：只在 §2.3 增加一个子节，**不新增概念、不改任何既有条款的语义**；§3.3 的 cross-tenant 两条路径、
  §4 的 Casbin domain、§5 的错误码、§7 的归属边界均未改动。本条把 §3.3 的义务**前移**到归属模型里，
  使「列存在但路径忽略」在模型层就可被判定为违规。
- 配套实现与回归测试：`2026-10-19-w1-data-scope-tenant-dimension`（W1），
  `backend/internal/middleware/data_scope_tenant_test.go` 与
  `backend/modules/system/iam/permission/permission_data_scope_tenant_test.go`。

**本次澄清的触发与范围**

- 触发：任务 `2026-10-13-tenant-console-remediation`。实测 multi 模式下 `dashboard` / `system/dict/*` / `system/setting/*` / `system/operation-log/*` / `auth/operation-verify` 全部 `500 tenant.context.missing`，`X-Tenant-Id` 对非 `platform_ops` 角色无效（403），平台控制台整体不可用；且因系统设置页同样 500，UI 内无法切回 compat（§6 亦禁止回切）。
- 缺口定位：§3.3 要求平台管理 API「显式声明」，但 §3.1 没有给出**声明之后如何解析上下文**——实现把兜底只留给了 compat，于是 multi 下的平台级主体落入 §3.2 的「上下文缺失」。
- 澄清范围：只补齐 §3 的解析语义与 §6 的模式语义。**§2（模型）、§4（Casbin domain）、§5（错误码）、§7（归属边界）均未改动**；§3.1 的优先级次序与第 1/2 条判定条件未改动。
- 配套实现：`pkg/tenant.Resolve`（`platform-fallback` 解析来源）、`internal/middleware.PlatformScopeTenantContextMiddleware`、`pkg/tenant.IsPlatformPopulationUser`；路由组声明清单见任务包 `2026-10-13-tenant-console-remediation`。

> 治理提示：本记录使 runbook `TENANT_MIGRATION_RUNBOOK.md` §8 的 G4（「无未闭合 contract-change」）不再自动成立。G4 的放行判定权在维护者，本澄清不自行宣告 G4 通过；生产 DDL/数据变更禁令不受本文件影响。
