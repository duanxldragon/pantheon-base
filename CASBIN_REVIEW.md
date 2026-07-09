# CASBIN 权限体系深度 Review

> 生成日期：2026-07-09 · 优先级：最高
> 范围：Casbin Model / Policy / Middleware / 权限管理 API 越权 / 性能 / 数据权限
> 原则：基于实际代码与策略规模评估，不机械推荐 CachedEnforcer/Watcher。所有结论标注 `文件:行号`。

---

## 1. 模型分析（Model）

### 1.1 model.conf 是否合理

Model 以 **代码内 string** 定义，无 `.conf` 文件（`backend/pkg/database/casbin.go:22-33`）：

```conf
[request_definition]  r = sub, obj, act
[policy_definition]   p = sub, obj, act
[role_definition]     g = _, _
[policy_effect]       e = some(where (p.eft == allow))
[matchers]            m = (r.sub == p.sub || g(r.sub, p.sub)) && keyMatch2(r.obj, p.obj) && r.act == p.act
```

**评估：模型本身对当前"接口级 RBAC"目标是合理的，无需修改。**

- `sub = 角色 key`（非用户），用户→角色映射走 DB `system_user_role`，登录时解析进 Redis session（`login_runtime.go:268-271`）。这是刻意设计：Casbin 只做"角色→接口"，用户→角色由业务表管理。**合理**，避免 Casbin `g` 策略与业务用户表双写。
- `keyMatch2(r.obj, p.obj)`：支持 `:param` 与 `/*`。admin 用 `/api/v1/*` 通配、具体策略用 `/api/v1/system/user/:id`。**匹配方式与 RESTful 路由契合，正确**。
- `r.act == p.act`：方法精确等值。**正确**。
- `policy_effect = some(where (p.eft == allow))`：**只有 allow-only 语义，无 deny**。与 `DATA_PERMISSION_HOOK.md §3.1`"不引入 deny 语义"的设计一致。**当前合理**。

### 1.2 潜在模型层问题

| 编号 | 问题                                                              | 位置                  | 风险 | 结论                                                                                                                                                                                          |
| :--- | :---------------------------------------------------------------- | :-------------------- | :--- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M-1  | `g = _, _` 定义存在但**全库 0 条 `g` 策略**，角色继承链完全未使用 | `casbin.go:26` + seed | 低   | 死配置。当前用户可多角色（`roleKeys []string`，任一命中即放行），已覆盖多数场景。**保留占位可接受**，但应在注释中说明"角色继承未启用，多角色叠加在中间件层用 OR 实现"，避免后人误以为有继承。 |
| M-2  | `keyMatch2` 对 `/api/v1/*` 的匹配语义                             | `casbin.go:31`        | 低   | keyMatch2 将 `/*` 转 `/.*` 正则，`/api/v1/*` 可匹配 `/api/v1/system/user/list` 等任意深度子路径。admin 通配按预期工作，**正确**。                                                             |
| M-3  | 无 `keyGet`/域（domain）维度                                      | —                     | —    | 当前单租户，无需 domain。多租户扩展时再引入 `dom` 维度（见 §6）。**当前无需修改**。                                                                                                           |

---

## 2. 策略分析（Policy）

### 2.1 策略来源与规模

- **Seed 仅 5 条**（全 admin 通配，`database/system_init.sql:381-386`）：
  ```sql
  ('p','admin','/api/v1/*','GET'), ('p','admin','/api/v1/*','POST'),
  ('p','admin','/api/v1/*','PUT'), ('p','admin','/api/v1/*','PATCH'),
  ('p','admin','/api/v1/*','DELETE')
  ```
- **启动时幂等补种**同样 5 条（`casbin.go:56-65`）。
- **`g` 策略 0 条**。
- 其余策略由角色保存时按"已知权限点→API 策略"映射**自动同步**（`role_helper.go` 系列），以及权限管理 API 手动维护。

### 2.2 冗余 / 冲突 / 默认允许 / 默认拒绝

| 检查项           | 结论                                                                                                                                                                                                                                                                                                        | 证据                      |
| :--------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------ |
| **冗余策略**     | 低风险。`casbin_rule` 有唯一索引 `(ptype,v0..v5)`（`up.sql:417`），DB 层防重复。admin 5 条 + 具体策略无覆盖冗余（具体策略与 admin 通配虽逻辑重叠，但 admin 是独立角色，不构成同角色内冗余）。                                                                                                               | `up.sql:417`              |
| **冲突策略**     | 无。allow-only 模型无 allow/deny 冲突可能。                                                                                                                                                                                                                                                                 | `casbin.go:29`            |
| **默认允许风险** | ✅ **无默认允许**。matcher 要求显式 `p` 命中；无策略即拒绝（`authorizeRoleKeys` 返回 false → 403，`casbin_middleware.go:33-36`）。                                                                                                                                                                          | `casbin_middleware.go`    |
| **默认拒绝**     | ✅ **默认拒绝正确**。未匹配任何策略 → `permission.denied` 403。                                                                                                                                                                                                                                             | `casbin_middleware.go:33` |
| **guest 回退**   | `roleKeys` 为空时回退 `["guest"]`（`casbin_middleware.go:29`）。由于 Casbin 组必先经 TokenAuth（每个 `.Use(CasbinMiddleware())` 前都有 `.Use(TokenAuthMiddleware())`，见 `system_modules.go:127` 等），未认证请求已被拦截，guest 分支是**死代码/纵深防御**，无 `guest` 策略故一律拒绝。**无风险，可保留**。 |

**结论：策略层健康，无冗余/冲突/默认允许风险，默认拒绝正确。**

---

## 3. 权限链路（Middleware 覆盖）

### 3.1 是否所有接口经过 Casbin

**不是全部——但这是有意的分层设计**，需区分三类：

**① 完全公开（无 Token 无 Casbin）** — 有意公开：

| 接口                                                    | 位置                    | 安全性                                                                     |
| :------------------------------------------------------ | :---------------------- | :------------------------------------------------------------------------- |
| `GET /system/dict/options`                              | `system_modules.go:278` | 只读已启用字典，无敏感数据 ✅                                              |
| `GET /system/setting/public`                            | `system_modules.go:315` | **过滤 `is_encrypted=1`**，敏感配置即使误配公开也不返回 ✅（`BACKEND.md`） |
| `GET /system/upload/files/*filepath`                    | `system_modules.go:316` | 受 `upload.local_path` 约束 + 阻止目录穿越 ✅（需验证，见 S-1）            |
| `GET /system/i18n/pack`                                 | `system_modules.go:350` | 语言包，公开合理 ✅                                                        |
| `GET /api/v1/health`                                    | platform                | 健康检查 ✅                                                                |
| `POST /auth/login`、`/auth/refresh`、`/auth/mfa/verify` | auth                    | 登录入口，带限流 ✅                                                        |

**② 仅登录（Token，无 Casbin）** — 自助接口：

| 接口                                                       | 位置                         | 评估                                                                                                                 |
| :--------------------------------------------------------- | :--------------------------- | :------------------------------------------------------------------------------------------------------------------- |
| `POST /system/upload`                                      | `system_modules.go:321`      | 登录用户可上传（头像等）。**建议**：确认 handler 内对 `scope` 做白名单校验，防止任意登录用户写非头像目录（见 S-2）。 |
| 自助白名单（me/logout/profile/sessions/menu-tree(nav)...） | `casbin_middleware.go:68-99` | 通过 `isSelfServiceRouteBySignature` 短路。列表清晰、语义正确（都是"当前用户自己的资源"）✅                          |

**③ Token + Casbin（受保护）** — 绝大多数 system/iam/org/config 管理接口，全部经 `systemProtected`/`systemDataScoped`（`system_modules.go:127-128,153,167,196,226,251,281,324,353,391`）✅

### 3.2 遗漏接口审计

**未发现"应受保护却裸奔"的接口**。自助白名单（`casbin_middleware.go:68-99`）逐条核对均为当前用户自有资源，无越权读取他人数据的口子。

⚠️ **需持续治理的隐患**：白名单用 **硬编码 `switch c.FullPath()`**（`casbin_middleware.go:70`）。新增自助接口时若忘记加入白名单，会被 Casbin 拦截（fail-safe，偏保守，可接受）；反之若误加入过宽的 FullPath，会绕过授权。**建议**：白名单接口配套 `casbin_middleware_test.go` 断言（已有测试文件），确保清单变更可回归。

---

## 4. 权限管理 API 越权风险（重点）

### 4.1 风险确认：存在自提权敞口

权限/角色管理 API（`system_modules.go:166-213`）全部挂 `systemProtected`（Token+Casbin），但 **Service 层无"防自提权/防改高权角色"的纵深校验**：

- `PermissionService.CreatePolicy/UpdatePolicy/DeletePolicy` 仅校验 `roleKey` 存在（`ensureRoleKeyExists`）、方法合法、唯一性（`permission_service.go:115/146/183/664-673`），**不校验目标角色是否高于操作者、不校验是否给自己提权**。
- `RoleService` 角色 CRUD、成员分配（`role_service.go:248/298/164`）同样无"操作者不能编辑权限≥自己的角色"约束。
- **唯一保护是 admin 角色自身**：禁改名/禁停用/禁删/禁移除内置管理员绑定（`role_helper.go:96-98`、`role_service.go:230-236,360-362`）——这些只防 admin 被破坏，**不防低权角色自我提权**。

### 4.2 影响分析

**当前实际风险等级：中（取决于策略配置纪律）。**

- 攻击路径：若某个非 admin 角色被授予了 `POST /api/v1/system/permission` 或 `PUT /api/v1/system/role/:id` 的 Casbin 策略，则拥有该角色的用户可给**任意角色（含自身）分配任意接口策略**，实现提权到近似 admin。
- 缓解现状：默认 seed 只有 admin 拥有这些管理端策略，普通角色默认无权。**安全完全依赖"不要给普通角色授予 `/system/permission*`、`/system/role*` 写策略"这一运维纪律**，系统未做代码级纵深防御。

### 4.3 建议（需人工确认——涉及权限设计）

> 以下涉及权限模型行为变更，**不自动修复**，列入 roadmap 待确认：

1. **P1**：在 `PermissionService.CreatePolicy/UpdatePolicy` 与 `RoleService` 写路径增加"权限边界校验"：非 admin 操作者不得为任何角色授予"超出自己已有策略集"的接口权限（防止提权到高于自身）。影响：需在 Service 注入操作者 roleKeys 上下文；对现有 admin 操作无影响（admin 通配恒满足）。
2. **P1**：对"授予他人管理端策略（`/system/permission*`、`/system/role*`）"这一高敏动作，强制走 `SecureActionMiddleware` 二次验证（当前该中间件已用于批量删除、设置更新，`system_modules.go:289,338` 等，扩展到权限授予一致）。影响：前端权限页需接入二次验证弹窗（已有基建）。
3. **P2**：审计强化——权限/角色写操作已走统一 `OperationLog`，建议对 `casbin_rule` 变更额外记录变更前后策略快照（对齐 `permission_workbench_remediation_event` 表已有模式）。

---

## 5. 性能分析（基于实际策略规模）

### 5.1 是否每次请求重新 LoadPolicy

**否。** 策略在启动时一次性全量 `LoadPolicy()`（`casbin.go:50`），请求路径仅调用内存 `Enforcer.Enforce()`（`casbin_middleware.go:31`）。**无每请求 IO，性能良好**。

策略写入（Create/Update/Delete/Import）后调用全量 `LoadPolicy()` 重载（`permission_service.go:719-722`、`role_helper.go:262-265`）——写操作低频，**可接受**。

### 5.2 是否需要 CachedEnforcer / Watcher / Dispatcher

> 按当前策略规模决策，不机械推荐：

- **策略规模极小**（seed 5 条 + 运行时数百条量级）。`SyncedEnforcer` 内存匹配 O(策略数) 对数百条策略 **微秒级**，**不需要 CachedEnforcer**。引入 CachedEnforcer 反而带来"策略变更后缓存失效"复杂度，得不偿失。**结论：无需修改**。
- **Watcher / Dispatcher**：
  - 当前是**单进程模块化单体**，`LoadPolicy()` 重载即全局生效，**单实例无需 Watcher**。
  - ⚠️ **多实例部署时的真实缺口**：无 Watcher 意味着实例 A 通过 API 改策略后，实例 B/C 的内存策略不会同步，出现"改了权限但部分节点仍用旧策略"的窗口。**若未来水平扩展（多副本），必须引入 Watcher**（Redis Watcher，复用现有 Redis：`casbin-redis-watcher`），让任一实例 `SavePolicy`/`LoadPolicy` 后广播其他实例重载。
  - **结论**：单实例当前无需修改；**多实例是 P1 前置条件**，列入 roadmap（见 §6 与 IMPROVEMENT_ROADMAP P1-2）。

### 5.3 一致性窗口（DB 写与内存 reload 非事务）

策略写入 `casbin_rule` 表提交后，再调 `reloadPermissionPolicies()`（`permission_service.go:130-135,167-170,187-190`）。若 reload 失败，**DB 已写入但内存未更新**，出现数据/运行态不一致窗口。同类问题见删角色 `reloadRolePolicies()` 在事务外（`role_service.go:397`）。

- 风险等级：低（reload 失败罕见，且下次重载/重启会自愈）。
- **建议 P2**：reload 失败时记录明确告警日志并返回错误提示"策略已保存，运行态同步失败，请重试或重启"，避免静默不一致。

---

## 6. 数据权限分析（四层 + 数据权限现状）

### 6.1 当前支持能力

| 能力           | 状态                  | 证据                                                            |
| :------------- | :-------------------- | :-------------------------------------------------------------- |
| 菜单权限（L1） | ✅ 完整               | `system_menu` + `system_role_menu` + `GET /menu/tree?scope=nav` |
| 按钮权限（L3） | ✅ 完整               | `system_menu.perms` + `usePermission` + `PermissionAction`      |
| API 权限（L4） | ✅ 完整               | `casbin_rule` + `CasbinMiddleware`                              |
| 数据权限（L5） | ⚠️ **已实现但覆盖窄** | `DataScopeMiddleware` + `WithDataScope`                         |

### 6.2 数据权限实现细节

- 中间件构造 `DataScopeReq{UserID, RoleKeys, Mode, IsAdmin, DeptID, DeptIDs}`（`data_scope_middleware.go:85-106`）。
- GORM Scope `WithDataScope`（`scope.go:12-48`）：`all` / `dept`（`dept_id=?`）/ `dept_and_children`（`dept_id IN ?`，递归 `ancestors`，`data_scope_middleware.go:253-282`）/ `custom`（自定义部门集）/ `self`（`created_by`/`id`，`scope.go:50-76`）。
- 策略表 `system_role_data_scope`；多角色取最宽 mode（`resolveDataScopeMode:297-330`）。
- **admin 短路**：`scope.go:14`、`data_scope_middleware.go:99`。
- **安全兜底**：`dept`/`dept_and_children`/`custom` 缺部门上下文时返回空结果，避免 `dept_id=0` 被解释为"全部数据"（`DATA_PERMISSION_HOOK.md §3`）✅。

### 6.3 缺少的能力

| 缺口                  | 影响                                                                                                                                          | 建议优先级                                                              |
| :-------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------- |
| **覆盖面窄**          | 仅用户列表/导出走 `systemDataScoped`（`system_modules.go:128,143-144`），其他 system 模块（角色、部门、岗位、日志、审计）列表**未接数据权限** | P2：按需为组织/审计类列表接入（业务样板已存在于 `business/cmdb/host`）  |
| **无字段级/列级权限** | 无法控制"能看用户但看不到手机号"                                                                                                              | P3：按需，当前 DTO 屏蔽已覆盖敏感字段                                   |
| **无 deny/交集语义**  | 当前只有 allow 叠加（取最宽范围）                                                                                                             | P3：`DATA_PERMISSION_HOOK.md §3.1` 已明确"如需 deny 应新增独立策略类型" |
| **无租户维度**        | 单租户，`tenant_id` 未注入                                                                                                                    | P2（多租户前置，见 §7）                                                 |

**结论：数据权限架构钩子设计优秀（预留完善），但生产覆盖面仍是样板级，需按业务需要逐步铺开。当前对系统域自身影响可控。**

---

## 7. 未来扩展建议

| 扩展                   | 当前就绪度                                                                          | 关键动作                                                                                                              |
| :--------------------- | :---------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------- |
| **多租户**             | 钩子已预留（`DATA_PERMISSION_HOOK.md §3` + `TENANT_READY_SINGLE_TENANT_DESIGN.md`） | ① Casbin model 增加 `dom`（租户）维度或在 obj 前缀租户；② `WithDataScope` 注入 `tenant_id=?`；③ session 携带 tenantID |
| **多实例水平扩展**     | ❌ 缺 Watcher                                                                       | 引入 Redis Watcher，复用现有 Redis（P1 前置）                                                                         |
| **OAuth / SSO / OIDC** | 设计已存在（`SSO_OIDC_DESIGN.md`、`AUTH_PROVIDER_ABSTRACTION.md`）                  | 认证层抽象已考虑，Casbin 层无需改（授权与认证解耦，角色来源可换）                                                     |
| **细粒度对象级授权**   | ❌ 当前仅路径级                                                                     | 若需 ABAC，在 matcher 引入条件表达式或 `keyGet` 提取资源属性（`DATA_PERMISSION_HOOK.md §3.2` 已提及评估映射）         |

---

## 8. Casbin Review 总结

| 维度       | 评分 | 结论                                                                   |
| :--------- | :--: | :--------------------------------------------------------------------- |
| 模型合理性 | 9/10 | 接口级 RBAC 模型正确、简洁，keyMatch2 契合 RESTful。`g` 死配置扣分     |
| 策略健康   | 9/10 | 无冗余/冲突/默认允许，默认拒绝正确，唯一索引防重                       |
| 中间件覆盖 | 8/10 | 分层清晰，公开/自助/受保护三类边界明确；白名单硬编码需测试守护         |
| 越权防护   | 6/10 | **主要短板**：权限管理 API 无防自提权纵深校验，依赖运维纪律            |
| 性能       | 9/10 | 启动加载 + 内存匹配，策略规模小，无需 CachedEnforcer；多实例缺 Watcher |
| 数据权限   | 7/10 | 架构钩子优秀，覆盖面窄                                                 |

**最高优先建议（需人工确认，不自动改）**：

1. **P1**：权限管理 API 增加防自提权边界校验 + 高敏授权动作二次验证（§4.3）。
2. **P1（多实例前置）**：引入 Casbin Redis Watcher（§5.2）。
3. **P2**：策略 reload 失败显式告警（§5.3）；数据权限覆盖面按需扩展（§6.3）。
4. **文档**：`g` 死配置加注释说明角色继承未启用（§1.2 M-1）。

> **明确无需修改项**：Model 结构、allow-only effect、SyncedEnforcer 选型、启动加载策略、默认拒绝语义、公开/自助路由分层——这些在当前单体单租户目标下均为正确设计。
