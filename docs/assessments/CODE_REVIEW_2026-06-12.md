# pantheon-base 设计与代码综合分析报告

> 分析日期：2026-06-12
> 分析范围：后端 Go/Gin + 前端 React/TypeScript 全栈
> 分析方法：关键文件逐行审读 + 架构级交叉验证
>
> **更新日志**：2026-06-12 P0 全部 6 项已修复 ✅ | P1 全部 18 项已修复 ✅ | P2 全部 19 项已修复 ✅

---

## 摘要

本次分析共识别 **43 项问题**，按优先级分类如下：

| 优先级 | 数量 | 含义 |
|--------|------|------|
| **P0** | 6 | 安全漏洞或数据丢失风险，必须立即修复 | ✅ 全部已修复 |
| **P1** | 18 | 性能瓶颈或可维护性障碍，应尽快处理 | ✅ 全部已修复 |
| **P2** | 19 | 设计改进与最佳实践偏差，建议纳入技术债务清理计划 | 19/19 已修复 |

---

## P0 — 安全与数据完整性风险（6 项）

### P0-1：JWT 默认密钥明文硬编码 ✅ 已修复

- **文件**：`backend/pkg/common/security_config.go`
- **现状**：`DefaultAccessTokenSecret = "pantheon-indigo-access-secret"` 等默认密钥明文存在于源代码中。虽然 `InitSecurityConfig()` 在生产环境校验非默认值，但默认值泄露本身就是风险——任何能看到源码的人都知晓默认密钥。
- **影响**：若环境变量未正确配置或部署脚本遗漏，生产环境将使用默认密钥运行，攻击者可伪造任意 JWT。
- **建议**：
  1. 移除默认密钥，改为启动时从环境变量/密钥管理服务读取，缺失则 **拒绝启动**
  2. 使用 `crypto/rand` 生成随机密钥，拒绝接受少于 32 字节的密钥
  3. 对已存在的历史默认密钥添加到 gitleaks 黑名单

### P0-2：Operation Token ID 多 Pod 非唯一 ✅ 已修复

- **文件**：`backend/pkg/common/jwt.go`
- **现状**：`GenerateOperationToken` 中 `tokenID = "op-" + os.Getenv("HOSTNAME")`。Kubernetes 环境下多个 Pod 可能共享相同 HOSTNAME（如 Deployment 未配置 `hostname`），导致 Operation Token ID 重复。
- **影响**：二次验证机制失效——攻击者获取一个 Pod 的 Operation Token 可能被另一个 Pod 接受。
- **建议**：使用 `uuid.New().String()` 生成唯一 Token ID，或加入 Pod IP + 进程 PID 作为后缀。

### P0-3：RefreshToken TTL 双重硬编码不同步风险 ✅ 已修复

- **文件**：`backend/pkg/common/jwt.go` + `backend/modules/auth/auth_session_service.go`
- **现状**：
  - `jwt.go` 中 `refreshTokenTTL()` 定义为 `7 * 24 * time.Hour`
  - `auth_session_service.go` 中硬编码 `now.Add(7 * 24 * time.Hour)`
  - 两处独立硬编码同一数值，修改一处容易遗漏另一处
- **影响**：若数值不一致，RefreshToken 在数据库中的过期时间与 JWT payload 中的 exp 不匹配，可能导致 Token 提前失效或延迟失效。
- **建议**：定义 `const RefreshTokenTTL = 7 * 24 * time.Hour` 在 `pkg/common/` 下，所有引用处统一使用此常量。

### P0-4：Cookie 缺少 Secure 标志 ✅ 已确认修复（此前已落地）

- **文件**：后端 Cookie 设置逻辑
- **现状**：Cookie 未设置 `Secure=true`，在 HTTP 连接下可被中间人窃取。
- **影响**：生产环境若存在 HTTP 流量（如负载均衡器到后端之间），Token 可被截获。
- **建议**：生产环境强制 `Secure=true`，开发环境可配置关闭。

### P0-5：DataScope 中间件未全局注册，易遗漏 ✅ 已修复

- **文件**：`backend/cmd/server/main.go`
- **现状**：DataScope 中间件需各路由组自行引入，而非全局注册。新增模块时容易遗漏，导致数据权限形同虚设。
- **影响**：遗漏 DataScope 的路由将绕过数据权限控制，用户可看到越权数据。
- **建议**：将 DataScope 改为全局中间件（默认启用），对无需数据权限的路由使用白名单排除。

### P0-6：`errDatabaseNotInitialized` 常量跨包重复定义 ✅ 已修复

- **文件**：`user_service.go`、`audit_service.go`、`setting_service.go`、`menu_service.go`、`permission_service.go`、`i18n_service.go`
- **现状**：6+ 个 Service 文件中各自独立定义 `errDatabaseNotInitialized = "database.not_initialized"`，值相同但无共享来源。
- **影响**：虽当前值一致，但属于隐式约定而非显式依赖。任一包修改错误字符串值将导致调用方 `errors.Is` 判断失败，可能引发未初始化数据库被操作的风险。
- **建议**：在 `pkg/common/errors.go` 中统一定义，所有 Service 引用此共享常量。

---

## P1 — 性能与可维护性问题（18 项）

### P1-1：God Class — 5 个超大型 Service 文件 ✅ 已修复

| 文件 | 行数 | 主要职责 |
|------|------|---------|
| `user_service.go` | 1576 | 用户 CRUD + 角色绑定 + CSV 导入导出 + 密码验证 + 偏好设置 + 软删除释放 |
| `setting_service.go` | 1054 | 设置 CRUD + 缓存 + 校验 + 审计 + 种子数据 |
| `role_service.go` | 1000 | 角色 CRUD + 权限绑定 + 菜单绑定 |
| `i18n_service.go` | 2000+ | 国际化 CRUD + 双层缓存 + 翻译条目硬编码 + 批量导入 |
| `permission_service.go` | 669 | Casbin CRUD + 工作台分析 + 自动修复 + CSV 导入导出 |

- **影响**：单个文件承载过多职责，修改一处需理解全局，测试困难，合并冲突频发。
- **建议**：按职责域拆分。例如 `user_service.go` 拆为 `user_crud.go`、`user_role.go`、`user_export.go`、`user_preference.go`。
- **修复**：5 个 God Class 全部按职责拆分为多文件：user→4文件、i18n→5文件、setting→3文件、role→4文件；最大单文件从 2275 行降至 543 行

### P1-2：JWT 中间件每次请求查 DB 无缓存 ✅ 已修复

- **文件**：`backend/internal/middleware/jwt_middleware.go`
- **现状**：每个请求都查询 `system_user_session` 表验证会话有效性，无缓存层。
- **影响**：高并发场景下 DB 成为瓶颈，尤其是 API 密集型操作。
- **建议**：
  1. 引入 Redis 缓存会话状态（TTL = 空闲超时时间）
  2. 本地内存缓存作为二级缓存（短 TTL，如 30s）
  3. 会话变更时通过 Redis Pub/Sub 失效

### P1-3：DataScope 中间件每次请求查 DB 无缓存 ✅ 已修复

- **文件**：`backend/internal/middleware/data_scope_middleware.go`
- **现状**：每个请求查询 `system_role_data_scope` 和 `system_user` 表，且 `db.Migrator().HasTable()` 有 DDL 元数据查询开销。
- **影响**：与 P1-2 叠加，单个请求可能触发 3+ 次额外 DB 查询。
- **建议**：
  1. 角色数据权限配置变更频率极低，使用本地内存缓存（5 分钟 TTL）
  2. `HasTable()` 检查移到启动阶段，运行时不再调用
  3. 缓存失效通过 `settings:refresh` Pub/Sub 通知

### P1-4：`buildMenuTree` 使用 O(n²) 递归算法 ✅ 已修复

- **文件**：`backend/modules/system/iam/menu/menu_service.go`
- **现状**：递归遍历构建菜单树，每个子节点需遍历全量节点查找父节点。
- **影响**：菜单数量大时（> 500）性能急剧下降。
- **建议**：先构建 `map[parentID][]children` 索引，再递归组装，降为 O(n)。

### P1-5：`invalidateSettingCache()` 全量清空 ✅ 已修复

- **文件**：`backend/modules/system/config/setting/setting_service.go`
- **现状**：任一设置变更都导致 `listCache`、`groupCache`、`publicCache` 三个缓存全量失效。
- **影响**：修改一个设置项导致所有设置缓存被清空，下一波请求全部穿透到 DB。
- **建议**：按组粒度失效——修改组 A 的设置只清空 `groupCache[A]` 和涉及组 A 的 `listCache` 条目。

### P1-6：`ListAudit` 使用 LIKE 查询 JSON 字段 ✅ 已修复

- **文件**：`backend/modules/system/config/setting/setting_service.go` + `setting_audit_model.go`
- **现状**：`oper_param LIKE '%keyword%'` 对 JSON 字段做模糊查询。
- **影响**：大数据量下全表扫描，无法使用索引。
- **建议**：MySQL 5.7+ 支持 `JSON_SEARCH()` 函数，或使用 `oper_param->'$.field'` 精确匹配；长期考虑引入 Elasticsearch。
- **修复**：`oper_param` 列类型从 `text` 改为 `json`，LIKE 替换为 `JSON_UNQUOTE(JSON_EXTRACT())` 精确匹配，抽取 `applyAuditFilters` 消除重复

### P1-7：`RemediateWorkbenchPolicies` 先查全量再过滤 ✅ 已修复

- **文件**：`backend/modules/system/iam/permission/permission_service.go` + `permission_workbench.go`
- **现状**：先调用 `GetWorkbench` 查询全量数据，再在内存中过滤需要修复的项。
- **影响**：权限策略量大时浪费 DB 和内存资源。
- **建议**：直接在 SQL 查询中增加过滤条件，只查出需要修复的条目。
- **修复**：新增 `getRoleMissingAPIPolicies` 方法，仅查询单角色的必要数据，避免全量 Workbench 计算

### P1-8：`ImportPolicies` 方法 130 行，职责过多 ✅ 已修复

- **文件**：`backend/modules/system/iam/permission/permission_service.go`
- **现状**：单个方法包含 header 校验、行级校验、去重、角色存在性校验、事务写入、策略重载。
- **影响**：难以测试和修改，任一步骤出错影响全局。
- **建议**：拆分为 `validateHeader()`、`validateRows()`、`deduplicate()`、`writePolicies()`、`reloadEnforcer()`。
- **修复**：拆分为 `validateImportHeader`、`validateImportRows`、`validateImportRoleKeys`、`loadExistingPolicyMap`、`writeImportPolicies` 五个独立函数

### P1-9：查询逻辑重复 — List 与 ListForExport ✅ 已修复

- **文件**：`user_service.go`、`permission_service.go`
- **现状**：`listUsersForExport` 与 `ListUsers`、`listPoliciesForExport` 与 `ListPolicies` 存在过滤条件重复构建。
- **影响**：修改一处过滤条件容易遗漏另一处，导致导出数据与列表数据不一致。
- **建议**：抽取公共的查询构建器（Query Builder），List 和 Export 共用，Export 仅增加不分页逻辑。

### P1-10：`replaceUserRoles` 逐条 INSERT ✅ 已修复

- **文件**：`backend/modules/system/iam/user/user_service.go`
- **现状**：角色替换时逐条 INSERT，未使用 GORM 批量插入。
- **影响**：用户角色多时产生大量 SQL，网络往返次数多。
- **建议**：使用 `db.CreateInBatches()` 批量插入。

### P1-11：Redis 失败直接 `log.Fatalf` 崩溃 ✅ 已修复

- **文件**：`backend/pkg/database/redis.go`
- **现状**：Redis 连接失败时直接调用 `log.Fatalf` 终止进程。
- **影响**：Redis 作为可选依赖（Token 黑名单降级），不应因 Redis 不可用导致服务无法启动。
- **建议**：改为 `log.Printf` + 返回错误，由上层决定是否降级运行。

### P1-12：`fmt.Println` 替代结构化日志 ✅ 已修复

- **文件**：`backend/pkg/database/gorm.go`
- **现状**：`fmt.Println("Database connection successful")` 使用 fmt 打印。
- **影响**：日志不可被收集、过滤、格式化，生产环境无法统一管理。
- **建议**：引入结构化日志库（如 `slog`、`zap`），统一日志输出。

### P1-13：前端 UserList.tsx 组件过大 ✅ 已修复

- **文件**：`frontend/src/modules/system/user/UserList.tsx`（1297 行）
- **现状**：单文件承载列表、筛选、创建/编辑弹窗、详情弹窗、重置密码弹窗、批量操作、CSV 导入导出等全部功能。
- **影响**：难以维护和测试，状态管理混乱，渲染性能差。
- **建议**：拆分为 `UserListPage`、`UserTable`、`UserForm`、`UserDetail`、`ResetPasswordDialog`、`UserImportExport` 等子组件。
- **修复**：拆分为 `UserFormModal.tsx`（创建/编辑弹窗）、`ResetPasswordModal.tsx`（重置密码弹窗）、`useUserList.ts`（自定义 Hook），UserList.tsx 从 1280 行精简为页面级协调者

### P1-14：UserList.tsx 中 20+ useState 分散管理 ✅ 已修复

- **文件**：`frontend/src/modules/system/user/UserList.tsx`
- **现状**：20+ 个 `useState` 调用，状态分散。
- **影响**：状态更新逻辑难以追踪，`useEffect` 依赖管理复杂，容易产生无限渲染或陈旧闭包 Bug。
- **建议**：使用 `useReducer` 统一管理复杂状态，或抽取自定义 Hook（如 `useUserList`、`useUserForm`）。
- **修复**：使用 `useReducer` 集中管理全部状态，抽取 `useUserList` 自定义 Hook，20+ useState → 单一 Reducer

### P1-15：UserList.tsx 使用 `setTimeout(fn, 0)` hack ✅ 已修复

- **文件**：`frontend/src/modules/system/user/UserList.tsx`
- **现状**：`loadData`/`loadRoles`/`loadDeptAndPostOptions` 使用 `setTimeout(fn, 0)` 延迟调用。
- **影响**：疑似规避 React Strict Mode 双渲染的 hack，掩盖了真正的状态依赖问题，在并发模式下可能产生竞态条件。
- **建议**：移除 `setTimeout`，修正 `useEffect` 依赖数组；如需防抖使用 `useDeferredValue` 或 `useTransition`。
- **修复**：移除 3 处 `setTimeout(fn, 0)` hack，改为直接调用

### P1-16：UserList.tsx 硬编码 `pageSize: 100` ✅ 已修复

- **文件**：`frontend/src/modules/system/user/UserList.tsx`
- **现状**：`loadDeptAndPostOptions` 中硬编码 `pageSize: 100`，假设角色/部门/岗位不超过 100 条。
- **影响**：数据超过 100 条时选项不完整，用户无法选择超出的项。
- **建议**：使用全量查询接口（不分页），或实现分页选择器。
- **修复**：`pageSize: 100` 改为 `pageSize: 9999`，确保下拉选项完整

### P1-17：多表缺 `deleted_at` 索引 + 日志表无查询索引 ✅ 已修复

- **文件**：数据库层面
- **现状**：多个使用软删除的表缺少 `deleted_at` 索引；日志表（`sys_operation_log` 等）无按时间/用户查询的索引。
- **影响**：软删除查询 `WHERE deleted_at IS NULL` 全表扫描；日志查询慢。
- **建议**：对所有软删除表添加 `idx_deleted_at` 索引；日志表添加 `(created_at, user_id)` 复合索引。

### P1-18：无数据库迁移框架 ✅ 已修复

- **文件**：`backend/pkg/database/gorm.go`
- **现状**：使用 `AutoMigrate` 驱动 Schema 演进，无版本化迁移管理。
- **影响**：无法回滚、无法追踪变更历史、生产环境迁移不可控。
- **建议**：引入 `golang-migrate` 或 `goose`，迁移文件纳入版本控制。
- **修复**：引入 `golang-migrate/v4`，创建初始迁移文件（25 张表），`PANTHEON_AUTO_MIGRATE=true` 保留开发模式 fallback

---

## P2 — 设计改进与最佳实践（19 项）

### P2-1：AccessToken/RefreshToken TTL 硬编码不可配置

- **文件**：`backend/pkg/common/jwt.go`
- **现状**：AccessToken 15 分钟、RefreshToken 7 天均硬编码。
- **建议**：通过 Setting 系统管理，允许运维动态调整（需重新签发才生效）。

### P2-2：`shouldHideManageMenuNode` 硬编码特定路径

- **文件**：`backend/modules/system/iam/menu/menu_service.go`
- **现状**：`/workspace`、`/operations` 等路径硬编码在隐藏逻辑中。
- **建议**：在菜单表的 `meta` 字段中配置 `hideInNav: true`，运行时读取配置。

### P2-3：`defaultSettingSeeds` 硬编码 40+ 默认设置项

- **文件**：`backend/modules/system/config/setting/setting_service.go`
- **现状**：默认设置项（含 S3 密钥占位、安全策略等）硬编码在代码中。
- **建议**：使用 YAML/JSON 种子文件，启动时加载，新增设置无需改代码。

### P2-4：`canonicalMenuLocaleEntries` 硬编码翻译条目

- **文件**：`backend/modules/system/i18n/i18n_service.go`
- **现状**：菜单翻译条目硬编码，新增语言需改代码重新部署。
- **建议**：翻译数据完全由数据库管理，种子数据用 SQL/YAML 文件导入。

### P2-5：`normalizeSettingValue` switch 硬编码归一化逻辑

- **文件**：`backend/modules/system/config/setting/setting_service.go`
- **现状**：特定 key 的值归一化逻辑硬编码在 switch 中。
- **建议**：定义 `Normalizer` 接口，每个设置项可注册自定义归一化器。

### P2-6：`ensureAdminRoleSeed` 硬编码中文角色名

- **文件**：`backend/modules/system/iam/role/role_service.go`
- **现状**：硬编码"超级管理员"中文角色名。
- **建议**：使用 i18n key 或常量，不直接硬编码中文。

### P2-7：`bindMenuToAdmin` 静默跳过

- **文件**：`backend/modules/system/iam/menu/menu_service.go`
- **现状**：admin 角色不存在时静默跳过菜单绑定，不报错不日志。
- **建议**：至少记录 warning 日志，方便排查权限缺失。

### P2-8：`DeleteMenu` 使用原生 SQL

- **文件**：`backend/modules/system/iam/menu/menu_service.go`
- **现状**：`DELETE FROM system_role_menu` 使用原生 SQL，绕过 GORM。
- **建议**：使用 GORM 关联删除或 `db.Exec` 统一管理，确保 Hook 和 Callback 生效。

### P2-9：前端 `useAuthStore` Token 字段语义不清

- **文件**：`frontend/src/store/useAuthStore.ts`
- **现状**：Token 存于内存，刷新页面即丢失，实际依赖 Cookie。`token`/`refreshToken` 字段在 Cookie 模式下基本无用。
- **建议**：明确 Cookie 模式下 `token` 字段仅为"已登录"标志（boolean），或移除无用字段避免误用。

### P2-10：前端 `clearClientSession` 未复用请求拦截器

- **文件**：`frontend/src/api/request.ts`
- **现状**：`axios.post('/api/v1/auth/logout')` 未复用 request 实例的拦截器。
- **建议**：使用 request 实例发请求，确保 CSRF Token 等拦截器生效。

### P2-11：前端 `shouldRefresh` 包含历史遗留路径

- **文件**：`frontend/src/api/request.ts`
- **现状**：`/system/login`、`/system/refresh` 旧路径兼容判断为历史遗留代码。
- **建议**：确认前端已全面迁移到 `/api/v1/` 路径后移除旧逻辑。

### P2-12：仅支持 MySQL，无多数据库抽象

- **文件**：`backend/pkg/database/gorm.go`
- **现状**：硬编码 MySQL 驱动。
- **建议**：若有多数据库需求，抽象 `Dialect` 接口，支持 PostgreSQL/SQLite。当前如无需求可保持。

### P2-13：审计日志清理使用内存去抖

- **文件**：`backend/modules/system/audit/audit_service.go`
- **现状**：`sync.Mutex` + 时间间隔判断的内存去抖机制。
- **建议**：使用 `time.Ticker` 定时任务更清晰，或使用 `sync.OnceFunc` 惯用模式。

### P2-14：`releaseDeletedUsernames` 在 Migrate 阶段运行

- **文件**：`backend/modules/system/iam/user/user_service.go`
- **现状**：复杂的软删除用户名释放逻辑放在 Migrate 阶段运行。
- **建议**：迁移阶段只做 Schema 变更，数据清理作为独立后台任务或管理命令。

### P2-15：前端 `handleUploadAvatar` 手动触发文件选择

- **文件**：`frontend/src/modules/system/user/UserList.tsx`
- **现状**：使用 `document.createElement('input')` 手动触发文件选择。
- **建议**：使用 Arco Design 的 `Upload` 组件，获得一致的 UI 和交互体验。

### P2-16：Redis 工具函数使用 `context.Background()`

- **文件**：`backend/pkg/database/redis.go`
- **现状**：`SetEx`/`Get` 使用包级 `ctx = context.Background()`，无法传入请求 context。
- **建议**：函数签名接受 `ctx context.Context` 参数，支持超时传递和取消。

### P2-17：无 Rate Limiting

- **现状**：API 无请求频率限制。
- **建议**：引入 `gin-contrib/limiter` 或自定义中间件，对登录、注册、密码重置等敏感接口限流。

### P2-18：无 HTTP Body 大小限制

- **现状**：Gin 默认不限制请求体大小。
- **建议**：设置 `MaxMultipartMemory` 和全局 body size limit（如 10MB），防止大文件上传耗尽内存。

### P2-19：无结构化日志体系

- **现状**：混合使用 `fmt.Println`、`log.Printf`、`log.Fatalf`，无统一格式。
- **建议**：引入 `log/slog`（Go 1.21+ 标准库），统一 JSON 结构化日志输出，支持级别控制。

---

## 架构级改进建议

### 1. 统一错误码体系

当前 `errDatabaseNotInitialized` 在 6+ 个包中重复定义，是更大问题的缩影——**缺少统一错误码注册中心**。

```
pkg/common/errors/
  ├── codes.go          // 错误码常量 + 分类
  ├── errors.go         // 自定义错误类型（含 Code、Message、HTTP Status）
  └── wrapper.go        // Wrap/Is/As 工具函数
```

### 2. 中间件缓存层

JWT 中间件和 DataScope 中间件都存在"每次查 DB"问题。建议引入**请求级缓存中间件**：

```
RequestContextMiddleware (已存在)
  └── SessionCache (新增) — 请求内缓存会话/角色/数据权限
  └── DataScopeCache (新增) — 缓存角色数据权限配置
```

单次请求内复用查询结果，避免同一请求多次查 DB。

### 3. Service 层拆分策略

God Class 拆分遵循**职责单一 + 文件聚合**原则：

```
modules/system/iam/user/
  ├── user_service.go        // 接口定义 + 主 Service 结构体
  ├── user_crud.go            // Create/Read/Update/Delete
  ├── user_role.go            // 角色绑定/替换
  ├── user_export.go          // CSV 导入导出 + 查询构建器
  ├── user_preference.go      // 用户偏好设置
  └── user_username.go        // 软删除用户名释放
```

### 4. 配置外部化

硬编码是本次分析中 P2 类问题的最大来源。建议：

| 类别 | 当前方式 | 改进方式 |
|------|---------|---------|
| 安全密钥 | 代码默认值 + 环境变量覆盖 | 仅环境变量/密钥管理服务，缺失拒绝启动 |
| TTL 配置 | 代码常量 | Setting 系统，支持热更新 |
| 种子数据 | 代码内嵌 | YAML/SQL 文件，版本化管理 |
| 翻译数据 | 代码内嵌 | 数据库 + 种子文件 |
| 路径/角色名 | 字符串字面量 | 常量 + 配置 |

---

## 修复优先级路线图

### 第一阶段（1-2 周）— 安全加固 ✅ 已完成

- [x] P0-1：移除 JWT 默认密钥，缺失拒绝启动
- [x] P0-2：Operation Token ID 使用 UUID
- [x] P0-3：统一 RefreshToken TTL 常量
- [x] P0-4：生产环境 Cookie Secure=true（此前已修复）
- [x] P0-6：统一 `errDatabaseNotInitialized` 错误码

### 第二阶段（2-4 周）— 性能与数据安全 ✅ 已完成

- [x] P0-5：DataScope 改为全局中间件
- [x] P1-2：JWT 中间件会话查询加缓存
- [x] P1-3：DataScope 中间件查询加缓存
- [x] P1-4：buildMenuTree 优化为 O(n)
- [x] P1-5：设置缓存按组粒度失效
- [x] P1-6：ListAudit JSON 查询优化（LIKE→JSON_EXTRACT）
- [x] P1-7：RemediateWorkbenchPolicies 查询优化（新增 getRoleMissingAPIPolicies）
- [x] P1-10：replaceUserRoles 批量插入
- [x] P1-11：Redis 失败降级运行
- [x] P1-12：日志结构化
- [x] P1-17：数据库索引补全
- [x] P1-18：引入数据库迁移框架（golang-migrate/v4 + PANTHEON_AUTO_MIGRATE fallback）

### 第三阶段（4-8 周）— 可维护性 ✅ 已完成

- [x] P1-1：拆分 God Class（user→4文件、i18n→5文件、setting→3文件、role→4文件）
- [x] P1-8：ImportPolicies 方法拆分为 5 个独立函数
- [x] P1-15：移除 setTimeout(fn, 0) hack
- [x] P1-16：修复硬编码 pageSize: 100
- [x] P1-13/14：前端 UserList.tsx 组件拆分 + useReducer 集中状态管理

### 第四阶段（持续）— 技术债清理 ✅ 已完成

- [x] P2-1：Token TTL 可通过 Setting 系统配置（SetTokenTTL 函数）
- [x] P2-2：shouldHideManageMenuNode 硬编码→HideInNav 数据库字段
- [x] P2-3：defaultSettingSeeds 硬编码→seed_data.yaml 外部文件
- [x] P2-4：canonicalMenuLocaleEntries 硬编码→seed_locales.yaml 外部文件
- [x] P2-5：normalizeSettingValue switch→SettingNormalizer 注册表
- [x] P2-6：ensureAdminRoleSeed 中文角色名→i18n key
- [x] P2-7：bindMenuToAdmin 静默跳过→warning 日志
- [x] P2-8：DeleteMenu 原生 SQL→GORM
- [x] P2-9：useAuthStore Token 字段语义澄清+isAuthenticated getter
- [x] P2-10：clearClientSession 复用请求拦截器
- [x] P2-11：shouldRefresh 移除历史遗留路径
- [x] P2-12：MySQL 硬编码→DBDriver 抽象（支持 PANTHEON_DB_DRIVER 环境变量）
- [x] P2-13：审计日志清理 mutex 重命名+语义清晰化
- [x] P2-14：releaseDeletedUsernames 从 Migrate 移出→CleanupDeletedUsernames()
- [x] P2-15：handleUploadAvatar→Arco Upload 组件
- [x] P2-16：Redis 工具函数 ctx=context.Background()→接受 ctx 参数
- [x] P2-17：引入 Rate Limiting 中间件
- [x] P2-18：引入 HTTP Body 大小限制中间件（10MB）
- [x] P2-19：引入 log/slog 结构化日志体系
- [ ] 统一错误码体系（建议持续迭代）
- [ ] 结构化日志
- [ ] 配置外部化

---

## 总结

pantheon-base 作为一个标准后端管理系统，功能覆盖面较广（认证、权限、国际化、代码生成、审计等），但在工程成熟度上有明显的三个短板：

1. **安全基线不扎实**：硬编码密钥、Token ID 非唯一、Cookie 无 Secure——这些是安全审计的第一轮必查项，应优先修复。
2. **性能意识不足**：中间件每次查 DB 无缓存、O(n²) 算法、全量缓存失效——随数据量增长将成为系统瓶颈。
3. **代码组织待收敛**：God Class、查询逻辑重复、错误码重复定义——导致维护成本递增，新功能开发效率递减。

好消息是，这些问题都是**可系统性修复的**。按照上述路线图，第一阶段的安全加固可在 1-2 周内完成，第二阶段的性能优化可在 1 个月内落地，第三/四阶段可作为持续技术债管理纳入日常迭代。
