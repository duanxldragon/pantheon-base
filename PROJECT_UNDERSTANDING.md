# Pantheon Base — 项目理解报告 (PROJECT_UNDERSTANDING)

> 生成日期：2026-07-09
> 目的：在企业级 Review 之前，先建立对整体架构、模块边界、权限模型、请求链路、数据流、Coding Style 的准确理解。
> 所有结论均基于实际代码与设计文档，并标注 `文件:行号`。

---

## 0. 一句话定位

Pantheon Base 是一个 **面向企业后台的模块化单体（Modular Monolith）底座**，把认证、IAM、组织、配置、审计、i18n、动态菜单与受控低代码沉淀在 `platform + system/*`，通过统一模块契约接入 `business/*`。它不是"登录 + CRUD 壳"，而是一套系统域/业务域解耦、AI 友好的可持续演进平台底座（`README.md`、`docs/designs/PANTHEON_BASE_ARCHITECTURE_OVERVIEW.md`）。

---

## 1. 系统架构

### 1.1 分层（三大层）

| 层              | 职责                                        | 后端物理落点                                            | 前端物理落点                                               |
| :-------------- | :------------------------------------------ | :------------------------------------------------------ | :--------------------------------------------------------- |
| **platform**    | 应用壳层、路由装配、跨域聚合、工作台/仪表盘 | `backend/modules/platform`、`backend/modules/dashboard` | `frontend/src/core`、`frontend/src/modules/platform`       |
| **system/\***   | 底座公共能力（4 子域）                      | `backend/modules/system/*`、`backend/modules/auth`      | `frontend/src/modules/system`、`frontend/src/modules/auth` |
| **business/\*** | 业务领域扩展位                              | `backend/modules/business/*`                            | `frontend/src/modules/business`                            |

system 域进一步拆四块（`ARCHITECTURE_OVERVIEW.md §3.2`）：

- `system/auth`：登录 / refresh / logout / me / 会话 / 登录日志 / 安全中心 / MFA（`backend/modules/auth`）
- `system/iam`：用户 / 角色 / 菜单 / 页面权限 / 按钮权限 / 接口权限 / 权限工作台（`backend/modules/system/iam/{user,role,menu,permission}`）
- `system/org`：部门 / 岗位 / 组织树（`backend/modules/system/org/{dept,post}`）
- `system/config`：字典 / 系统设置 / i18n / 上传 / 动态模块治理 / 生成器 / 审计（`backend/modules/system/{config,i18n,audit}`、`backend/modules/lowcode/{dynamicmodule,generator}`）

### 1.2 模块化单体核心思想

- 统一从 `backend/cmd/server/main.go` 启动，单进程接入 Gin / DB / Redis / Casbin（`main.go:28-142`）。
- 策略：**先把模块边界做清楚，再通过契约与治理降低耦合，不过早拆微服务**（`ARCHITECTURE_OVERVIEW.md §2.2`）。
- 硬边界（`agents.md`）：`modules/business/*` 不可直接依赖 `modules/system/*` 的 Service/Repository；认证、用户、角色、菜单、权限、组织、配置不得混成一个模块。

---

## 2. 技术栈

| 层级     | 技术                                               | 版本证据                                         |
| :------- | :------------------------------------------------- | :----------------------------------------------- |
| 后端语言 | Go 1.25                                            | `go version go1.25.10`                           |
| Web 框架 | Gin                                                | `main.go:21`                                     |
| ORM      | GORM (mysql driver)                                | `pkg/database/gorm.go`                           |
| 授权     | Casbin v2 (SyncedEnforcer)                         | `pkg/database/casbin.go:12,45`                   |
| 鉴权     | **Redis 不透明 token**（非 JWT）                   | `pkg/authtoken/token.go:86`                      |
| 数据库   | MySQL 8.0+（运行时已收敛，SQLite 已移除）          | `BACKEND.md §4`                                  |
| 缓存     | Redis（可选）                                      | `main.go:92-94`                                  |
| 迁移     | golang-migrate（SQL 版本化）                       | `pkg/database/migrate.go:20-21,59`               |
| 可观测   | zap 日志 + OpenTelemetry + Prometheus              | `main.go:30-114`                                 |
| 前端框架 | React 19 + TypeScript + Vite 8                     | `frontend/package.json`                          |
| UI       | Arco Design 2.66                                   | `frontend/package.json`                          |
| 状态     | Zustand 5                                          | `store/useAuthStore.ts`、`store/useMenuStore.ts` |
| i18n     | i18next 26 + react-i18next                         | `frontend/src/i18n`                              |
| 路由     | react-router-dom 7                                 | `frontend/src/App.tsx`                           |
| 工程     | Docker Compose、Playwright、GitHub Actions、CodeQL | `.github/workflows`                              |

---

## 3. 后端框架细节

### 3.1 启动流程（`backend/cmd/server/main.go:28-142`）

1. `logging.InitLogger(env)` — zap 结构化日志（`main.go:35`）
2. `telemetry.InitTracer` — 若设置 `OTEL_EXPORTER_OTLP_ENDPOINT`（`main.go:47-64`）
3. `common.InitSecurityConfig()` — **生产强制校验密钥**，失败即退出（`main.go:68`）
4. `database.InitDB(dsn)` — `PANTHEON_DSN` 必填（`main.go:74-89`）
5. 迁移分支：默认 `RunMigrations`（golang-migrate）；`PANTHEON_AUTO_MIGRATE=true` 走 GORM AutoMigrate（`main.go:80-89`）
6. `database.InitRedis` — 可选（`main.go:92-94`）
7. `database.InitCasbin(database.DB)` — 加载策略 + seed admin 通配（`main.go:96`）
8. Gin 装配 + 全局中间件（`main.go:99-107`）
9. 5 个模块注册（`main.go:117-122`）
10. `http.Server` 启动，超时配置齐全（ReadHeader 5s / Read 15s / Write 30s / Idle 60s，`main.go:129-141`）

### 3.2 Router 装配

- 统一根组 `/api/v1`（`main.go:117`）。
- **无单一全局 RegisterRoutes**；每模块暴露 init 函数接收 `(*gin.RouterGroup, *gorm.DB)`：
  - `platform.RegisterPlatformRoutes`（`modules/platform/routes.go:41`）
  - `lowcode.InitLowcodeModule`（`modules/lowcode/lowcode.go:11`）
  - `system.InitSystemModule`（`modules/system/system.go:11`）
  - `auth.InitAuthModule`（`modules/auth/module.go:18`）
  - `business.InitBusinessModules`（`modules/business/business.go:8`）
- 模块抽象：`contracts.FuncModule{ModuleName, MigrateFunc, SeedMenusFunc, Register}`，统一由 `contracts.RegisterBackendModules` 装配（`system/system.go:19-27`）。
- 受保护组工厂：`contracts.ProtectedGroupWithRedis`（Token+Casbin）、`DataScopedGroup`（再加 DataScope）（`pkg/contracts/route_groups.go:16-25`）。

### 3.3 Middleware（全局链，`main.go:99-107`）

顺序：`gin Logger` → `gin Recovery` → `SecurityHeaders` → `CSP` → `BodySizeLimit(10MB)` → `CORS` → `otelgin` → `Prometheus` → `RequestContext(reqID+30s超时)` → `OperationLog(异步)` → `CSRF`。

> **重要**：`TokenAuth`、`Casbin`、`RateLimit`、`DataScope` **不在全局链**，而是在各模块路由组按需挂载（`system_modules.go:127-128`、`auth/module.go`、`route_groups.go:18`）。

| 中间件          | 文件                                                    | 说明                                                                       |
| :-------------- | :------------------------------------------------------ | :------------------------------------------------------------------------- |
| SecurityHeaders | `internal/middleware/security_headers_middleware.go:11` | CSP/HSTS/X-Frame-Options:DENY/X-Content-Type-Options/Referrer-Policy       |
| CSP             | `csp_middleware.go:11`                                  | 按环境动态构造；生产移除 `unsafe-eval`                                     |
| BodySizeLimit   | `body_limit_middleware.go:11`                           | 默认 10MB                                                                  |
| CORS            | `cors_middleware.go:49`                                 | **白名单**（非 AllowAll），命中才回显 origin + Credentials                 |
| RequestContext  | `request_context_middleware.go:17`                      | 生成/透传 `X-Request-ID`/`X-Trace-ID`，回写响应头 + 30s ctx 超时           |
| OperationLog    | `operation_log_middleware.go:152`                       | 异步写 `system_log_oper`，递归脱敏 password/token/secret/apikey/credential |
| CSRF            | `csrf_middleware.go:33`                                 | double-submit cookie；安全方法与 login/refresh/mfa 豁免                    |
| TokenAuth       | `token_middleware.go:102`                               | Redis token + 60s 内存缓存 + 黑名单 + 空闲超时                             |
| Casbin          | `casbin_middleware.go:12`                               | 角色×路径×方法授权 + 自助白名单短路                                        |
| DataScope       | `data_scope_middleware.go:85`                           | 行级数据范围（构造 `DataScopeReq`）                                        |
| RateLimit       | `rate_limit_middleware.go:31`                           | 可插拔（Redis Lua / 内存），仅挂 auth 端点                                 |
| SecureAction    | `secure_action_middleware.go:12`                        | 高敏操作二次验证 `X-Operation-Token`                                       |

### 3.4 Config

- 全部通过 **环境变量**（无 viper/config 文件），前缀 `PANTHEON_*`：`PANTHEON_DSN`（必填）、`PANTHEON_REDIS_ADDR`、`PANTHEON_ENV`、`PANTHEON_PORT`、`PANTHEON_ALLOWED_ORIGINS`、`PANTHEON_*_SECRET` 等。
- 密钥治理：`pkg/common/security/config.go`。生产强制显式配置且 ≥32 字节，否则拒绝启动（`config.go:57-73`、`InitSecurityConfig:81-104`）。dev fallback 不可用于生产。

### 3.5 Logger

- zap 结构化日志 `pkg/logging`（`main.go:35`）。
- 全局请求日志由 `gin.Default()` 内置 Logger 承担；`StructuredLoggingMiddleware`（`logging_middleware.go:13`）存在但未在 main 挂载。
- RequestID/TraceID 贯穿：审计落 `request_id`，日志关联走 OTel context（`logging_middleware.go:27`）。

### 3.6 Cache

- Redis 用途：token 会话存储（`session:<token>`）、黑名单（`blacklist:<userID>`）、限流计数、i18n 语言包、字典 options 缓存。
- 应用内内存缓存：token 会话 60s 缓存（`token_middleware.go:24-26`）、session idle 分钟数 1 分钟缓存（`token_middleware.go:186-215`）。

### 3.7 Build

- Go module（根 `go.mod`），embed 迁移 SQL（`//go:embed migrations/*.sql`）。
- CI：GitHub Actions + CodeQL 为主门禁（`docs/designs/QUALITY_AND_SECURITY_STRATEGY.md`）。

---

## 4. 前端框架细节

### 4.1 入口装配（`frontend/src/main.tsx:12-24`）

`initializePublicSettings + initializePantheonTheme`（并行预初始化）→ `initI18n` → `React.StrictMode` → `BrowserRouter` → `App`。先加载配置/主题/i18n 再 render，避免首屏闪烁。运行于 React 19（引入 Arco `react-19-adapter`）。无 Redux/QueryClient Provider（Zustand 无需 Provider）。

### 4.2 路由系统（`frontend/src/core/router/`）

- **静态模块注册 + 后端菜单驱动导航（混合）**：路由表编译期静态注册（`modules.ts:20-41`），组件走 `componentRegistry`（key→lazy import，`componentRegistry.ts:18-63`，`satisfies` 类型安全）。后端 `MenuNode` 只驱动侧边栏渲染与首页重定向目标，不驱动路由表。
- **两层守卫**：
  - `AuthGuard`（登录态）：`token || hasAuthSession()`，否则 `<Navigate to="/login">`（`App.tsx:30-36`）
  - `RoutePermissionGuard`（页面级权限）：`isAdmin || userInfo.perms.includes(permission)`，否则 `<PageForbidden>`（`RoutePermissionGuard.tsx:11-33`）

### 4.3 状态管理（`frontend/src/store/`，Zustand）

- 仅 2 个 store：`useAuthStore`（token/userInfo/roles/perms）、`useMenuStore`（menuTree + 并发去重）。
- **Token 存 HttpOnly Cookie**，前端不持有真实 token；Zustand `token` 是占位符 `_cookie`（`sessionSnapshot.ts:5`）。
- localStorage 仅存：session hint、csrf token、userInfo 快照（免闪烁）；sessionStorage 存二次验证 op token。

### 4.4 API 封装（`frontend/src/api/request.ts`）

- axios 实例：`baseURL:/api/v1`、`timeout:10000`、`withCredentials:true`（`request.ts:56-60`）。
- 请求拦截器：非幂等请求带 `X-CSRF-Token`、有 op token 带 `X-Operation-Token`、统一 `Accept-Language`（`request.ts:359-379`）。
- 响应拦截器：`code===200` 拆包返回 data；**401 单例 Promise 刷新 token 并重放**（`request.ts:128-160`）；403 二次验证弹窗重放（`request.ts:399-447`）；`session.idle_timeout` 跳登录。

### 4.5 权限消费

- Hook `usePermission()`：`hasPerm/hasAnyPerm`，admin 兜底 + perms 精确匹配（`hooks/usePermission.ts:3-13`，22 文件使用）。
- 组件 `PermissionAction`：无权限**禁用+Tooltip**（`components/patterns/PermissionAction.tsx:10-25`）。
- 菜单：`getMenuTree({scope:'nav'})` 后端按权限过滤，前端按 capabilities 二次过滤后递归渲染（`layout/index.tsx:326-401`）。

### 4.6 TS 类型质量

- 全库 `: any` 仅 1 处（jszip 动态 import，已 eslint-disable）；`dangerouslySetInnerHTML` 0 处；API 响应全类型化，泛型 `apiRequest<T>`。

---

## 5. 权限模型（四层 + 数据权限）

设计权威：`docs/designs/PERMISSION_MODEL.md`、`docs/designs/DATA_PERMISSION_HOOK.md`。

| 层  | 名称     | 控制           | 数据源                                         | 落地                                            |
| :-- | :------- | :------------- | :--------------------------------------------- | :---------------------------------------------- |
| L1  | 导航权限 | 侧边栏菜单可见 | `system_menu` + `system_role_menu`             | `GET /system/menu/tree?scope=nav`               |
| L2  | 页面权限 | 路由能否进入   | `system_role_permission`(pagePerm)             | `RoutePermissionGuard` + `route.pagePermission` |
| L3  | 操作权限 | 按钮能否点     | `system_menu.perms` + `system_role_permission` | `usePermission` / `PermissionAction`            |
| L4  | 接口权限 | API 能否调     | `casbin_rule`                                  | `CasbinMiddleware`                              |
| L5  | 数据权限 | 行级可见范围   | `system_role_data_scope`                       | `DataScopeMiddleware` + `WithDataScope`         |

**双轨模型**：菜单/按钮权限走 `system_menu`+`system_role_menu`+`system_role_permission`；接口权限走 `casbin_rule`。角色保存时按"已知权限点→API 策略"映射自动同步可推导的 `casbin_rule`（`role_helper.go:174-266`）。

**命名规范**：`{scope}:{resource}:{action}`（system/auth）、`business:{module}:{resource}:{action}`（business）。禁止 `biz:*`。

**Admin 规则**：内置超管，默认全权限，不可停用/删除/移除内置管理员绑定（`role_helper.go:96-98`、`role_service.go:360-362`）。

> ⚠️ **文档漂移**：`PERMISSION_MODEL.md §17` 写"当前不实现数据权限"，但更晚的 `DATA_PERMISSION_HOOK.md`（2026-05-05）说数据权限 P2 基线已落地（中间件注入、策略页、业务样板、部门树展开）。以代码为准：数据权限已实现但覆盖面窄。

---

## 6. ORM / Repository 模式

- **无独立 Repository 层**，采用 **Service 直接持有 `*gorm.DB`** 模式（`user_service.go:24-44`）。数据访问写在 Service 内，链式 GORM + 手写 Join/IN。
- 无 GORM Preload/association（无 FK/association tag），列表用"主查 + 批量 IN 加载"避免 N+1（`ListUsers` `user_service.go:170-240`，`ListRoles` `role_service.go:69-142`）。
- 事务：跨表写用 `db.Transaction`（创建/更新/删除用户、角色 CRUD、删角色清 casbin，`role_service.go:196,266,319,373`）。
- 分页：count + offset/limit，pageSize 上限 100（`user_helper.go:32-34`）。
- 连接池：硬编码 MaxIdle=10 / MaxOpen=100 / Lifetime=1h（`gorm.go:96-99`）。
- 软删除：业务主表有 `deleted_at`；关联表/日志/casbin 无（物理删除）。
- 外键：**全库 0 FK**，引用完整性靠应用层校验。

---

## 7. 数据库结构（29 张表，权威源 = 迁移）

> ⚠️ **权威 schema = `backend/pkg/database/migrations/000001_init_schema.up.sql`（29 表）**；`database/system_init.sql`（16 表）**已标注 DEPRECATED**（`system_init.sql:1-15`），只作历史 seed 参考，**切勿用它建库**。

核心表：`system_user`、`system_role`、`system_menu`、`system_dept`、`system_post`、`system_user_role`、`system_role_menu`、`system_role_permission`、`system_role_data_scope`、`system_user_session`、`casbin_rule`、`system_i18n`、`system_setting`、`system_setting_audit_log`、`system_dict_type`、`system_dict_item`、`system_log_login`、`system_log_oper`、`system_auth_factor`、`system_auth_mfa_challenge`、`system_auth_security_event`、`system_login_throttle`、`system_user_password_history`、`system_user_profile_ext`、`system_refresh_version`、`module_registration`、`generator_datasource`、`permission_workbench_remediation_event`、`permission_role_data_scope_policy`。

---

## 8. Casbin 权限引擎（最高优先级摘要）

- **Model**（代码内 string，`casbin.go:22-33`）：RBAC + 角色继承 `g`，matcher = `(r.sub==p.sub || g(r.sub,p.sub)) && keyMatch2(r.obj,p.obj) && r.act==p.act`。
- **sub = 角色 key**（非用户）；用户→角色映射走 DB `system_user_role`，登录时解析进 session。
- **`g` 策略实际为 0 条**（角色继承未使用）。
- **Enforcer**：`casbin.NewSyncedEnforcer` + 自定义 GORM adapter（`casbin.go:45`、`casbin_adapter.go:26-37`）。
- **策略加载**：启动时一次性全量 `LoadPolicy()`；**非每请求加载**。策略写入绕过 Enforcer（直接 GORM 写 `casbin_rule` 表）后全量 `LoadPolicy()` 重载。
- **无 Watcher / Dispatcher**：多实例部署时策略不自动同步（单进程 OK）。
- **策略规模极小**：seed 仅 5 条 admin 通配（`system_init.sql:381-386`），其余运行时动态写入。
- **admin 通配**：`admin, /api/v1/*, {method}`，靠正常 Enforce（无硬编码放行）。
- **数据权限 admin 短路**：`scope.go:14` `if req.IsAdmin { return db }`。

---

## 9. 完整请求调用链

```text
Browser (React 19 + Arco + Zustand)
  │  axios withCredentials, X-CSRF-Token, Accept-Language
  ▼
[HttpOnly Cookie: access_token / refresh_token / csrf_token]
  │
  ▼  HTTP  →  Gin Engine (/api/v1)
  ├─ gin Logger
  ├─ gin Recovery (panic → 500)
  ├─ SecurityHeaders (HSTS / X-Frame-Options: DENY ...)
  ├─ CSP (env-aware)
  ├─ BodySizeLimit (10MB)
  ├─ CORS (白名单校验)
  ├─ otelgin (trace span)
  ├─ Prometheus (metrics)
  ├─ RequestContext (X-Request-ID / X-Trace-ID + 30s ctx timeout)
  ├─ OperationLog (异步写 system_log_oper, 敏感脱敏)
  ├─ CSRF (double-submit cookie)
  │
  ▼  模块受保护路由组
  ├─ TokenAuthMiddleware
  │     ├─ extractToken (Cookie → Bearer)
  │     ├─ 60s 内存缓存 / Redis session:<token> 校验
  │     ├─ blacklist:<userID> 检查
  │     ├─ 空闲超时检查 (默认 30min)
  │     └─ set ctx: userId / username / roleKeys / sessionId
  │
  ▼
  ├─ CasbinMiddleware
  │     ├─ 自助白名单 short-circuit (me / logout / profile / sessions ...)
  │     ├─ readRoleKeysFromContext (缺省 guest)
  │     └─ Enforcer.Enforce(roleKey, URL.Path, Method)  [任一角色命中即放行]
  │           └─ keyMatch2(obj) + act 精确匹配 (内存策略)
  │
  ▼
  ├─ [部分路由] DataScopeMiddleware → 构造 DataScopeReq (all/self/dept/dept_and_children/custom)
  ├─ [部分路由] RefreshSyncMiddleware / SecureActionMiddleware (二次验证)
  │
  ▼
  Handler (参数绑定 / ShouldBind)
  │
  ▼
  Service (业务逻辑 + 事务 + 权限计算)
  │     └─ [数据读] db.Scopes(WithDataScope) 行级过滤
  │
  ▼
  GORM (链式 + 批量 IN, 无 Preload)  →  MySQL
  │
  ▼
  common.Success / common.Fail  →  HTTP 200 + body { code, data, message }
  │
  ▼
Browser 响应拦截器
  ├─ code===200 → 拆包返回 data
  ├─ 401 → 单例刷新 token 重放 / 跳登录
  ├─ 403 verification_required → 二次验证弹窗重放
  └─ i18n key → translateMessage
```

**登录链路细节**：`POST /auth/login` → 密码 bcrypt 校验 → （若 `mfa_enabled` 返回 challenge）→ 签发 Redis 会话 → RoleKeys 从 `JOIN system_user_role` 查得（`login_runtime.go:268-271`）→ 写入 session → 前端存 cookie + session hint。

---

## 10. Coding Style（编码风格）

### 后端

- **垂直切片**（`BACKEND.md §2`）：每功能包自包含 `*_model.go / *_dto.go / *_service.go / *_handler.go / *_helper.go`，严禁水平切包。
- 分层职责：Model 只对齐 DB；DTO 屏蔽敏感字段（不返回 Password）；Service 是唯一业务流程中心 + 事务；Handler 只做绑定 + `common.Success/Fail`。
- 统一响应 `{code, data, message}`，message 走 i18n key；`Fail` 返回 HTTP 200 + body code，`FailWithCode` 用真实 HTTP 状态码（`response.go:47-109`）。
- 错误处理：`common.NewConflict` 等语义化错误；GORM 裸错误经 `FailWithError` 记日志 + i18n 兜底。
- gofmt 基本干净（仅 3 文件对齐差异）；`go vet ./...` **0 告警**。

### 前端

- 模块化：`core/`（壳层）+ `modules/`（域页面）+ `components/patterns/`（复用 CRUD 模式：table/modal/drawer/layout/actions/rails）。
- 严格 TS（几乎零 `any`）；所有展示文本走 i18n `t()`；权限统一走 `usePermission`。
- 页面必须覆盖 loading / empty / error / forbidden / submitting 状态（`agents.md`）。
- ⚠️ 存在超大组件：`ModuleWizard.tsx`(2235)、`I18nList.tsx`(2145)、`core/layout/index.tsx`(2103)、`DeptList.tsx`(1818) 等（详见 Review 报告）。

---

## 11. 理解阶段结论

Pantheon Base 是一个**成熟度显著高于常见后台底座**的项目：文档体系完备（`docs/designs/` 60+ 设计文档 + contracts + acceptances）、安全姿态强（CSP/CSRF/HSTS/密钥治理/审计脱敏/二次验证/限流全覆盖）、类型安全、测试与 CI 门禁齐全、模块边界清晰。

后续 Review 将聚焦少数**真实存在的架构/安全/性能风险点**（而非机械最佳实践），重点为 Casbin 授权纵深、多实例策略同步、数据权限覆盖面、超大前端组件、Casbin 写入与 reload 的一致性窗口等。凡当前实现已合理者，将在报告中明确"无需修改"。
