# 架构 Review

> 生成日期：2026-07-09
> 范围：架构优点 / 缺点 / 未来两年支撑力 / 技术债
> 原则：基于 pantheon-base 当前设计目标（模块化单体、系统域/业务域解耦、AI 友好）评估，不为"最佳实践"强行重构。

---

## 1. 当前架构优点

### 1.1 模块边界与分层清晰（强项）

- 三层 `platform / system/* / business/*` 边界明确，`system` 进一步拆 `auth/iam/org/config` 四子域，避免"大 system 杂物间"（`ARCHITECTURE_OVERVIEW.md §3`）。
- **垂直切片**落地扎实：每功能包自包含 `model/dto/service/handler/helper`（`BACKEND.md §2`，实际见 `modules/system/iam/role/` 8 文件）。严禁水平切包的约束被遵守。
- 硬边界规则明文化并被工具治理：`business/*` 不得依赖 `system/*` 内部 Service/Repository（`agents.md`）。

### 1.2 契约驱动装配（强项）

- 模块通过 `contracts.FuncModule{Migrate/Bootstrap/SeedMenus/SeedI18n/Register}` 统一注册（`system_modules.go`），`contracts.RegisterBackendModules` 编排（`system.go:19-27`）。新增模块只需实现契约，**装配一致性由框架保证**。
- 受保护路由工厂 `ProtectedGroupWithRedis` / `DataScopedGroup`（`route_groups.go:16-25`）统一鉴权装配，减少每模块手写中间件链出错概率。

### 1.3 安全姿态成熟（显著强项）

- 中间件全覆盖：SecurityHeaders / CSP（env-aware）/ CSRF（double-submit）/ CORS（白名单）/ BodyLimit / RateLimit / RequestContext / OperationLog（脱敏）/ SecureAction（二次验证）。
- 密钥治理：生产强制显式配置 + ≥32 字节，否则拒启（`security/config.go:57-104`）。
- 审计递归脱敏 password/token/secret/apikey/credential（`operation_log_middleware.go:338`）。
- 鉴权用 Redis 不透明 token（非 JWT），支持黑名单、空闲超时、会话轮换——**吊销能力强于无状态 JWT**。

### 1.4 可观测性完备（强项）

- zap 结构化日志 + OpenTelemetry 追踪 + Prometheus 指标（含 DB 连接池指标）+ RequestID/TraceID 贯穿 + 审计落 request_id。**线上定位问题的基建齐全**（详见 ENTERPRISE_REVIEW_REPORT §7）。

### 1.5 工程与文档治理（罕见的高成熟度）

- `docs/designs/` 60+ 设计文档 + `docs/contracts/` 契约 + `docs/acceptances/` 验收清单，中英双语。
- CodeQL + GitHub Actions 门禁，`go vet ./...` 零告警，gofmt 基本干净，前端严格 TS（近零 any）、零 `dangerouslySetInnerHTML`。
- harness 方法论（`.harness/`、`.agents/skills/`）沉淀 AI 协作治理。

### 1.6 前端架构清晰

- `core`（壳层）+ `modules`（域）+ `components/patterns`（复用 CRUD 模式）分层；静态路由注册 + 后端菜单驱动导航的混合模式，兼顾类型安全与动态权限。

---

## 2. 当前架构缺点 / 风险

> 均为**真实存在**的问题，按对项目的实际影响排序。

### 2.1 权限管理 API 缺纵深防御（中风险）

权限/角色写 API 无"防自提权/防改高权角色"校验，安全依赖运维纪律（详见 `CASBIN_REVIEW.md §4`）。这是当前架构最实质的安全短板。

### 2.2 多实例水平扩展未就绪（中风险，取决于部署形态）

- Casbin 无 Watcher，多副本策略不同步（`CASBIN_REVIEW.md §5.2`）。
- Token 会话 60s **进程内内存缓存**（`token_middleware.go:24-26`）：多实例下，实例 A 吊销会话后，实例 B 的内存缓存最多 60s 仍放行（黑名单检查可缓解强制下线，但普通登出有窗口）。
- session idle 分钟数进程内缓存（`token_middleware.go:186-215`）——配置变更多实例最多滞后 1 分钟，影响小。
- **影响**：当前单实例无问题；若水平扩展需先解决 Watcher + 缓存一致性。属"架构就绪度"缺口而非当前缺陷。

### 2.3 数据库 schema 双源风险（中风险，易踩坑）

- 权威源是 `migrations/000001_init_schema.up.sql`（29 表），但 `database/system_init.sql`（16 表）仍在仓库，已标 DEPRECATED 却缺 13 张表、列定义分歧（`avatar` 255 vs 512、`system_role` 缺 data_scope 等）。
- **影响**：新人/脚本误用 system_init.sql 建库会得到**残缺且过时**的 schema，运行时报错难排查。
- **建议 P1**：明确 system_init.sql 只保留 seed 数据部分或整体归档到 `docs/archive/`，建库路径唯一化到迁移。

### 2.4 部分模块 AutoMigrate 无环境守卫（低风险）

`refresh_sync.go:47`、`dynamic_module_sync.go:24/165` 的 `AutoMigrate` 无 `ShouldAutoMigrate()` 守卫，即使版本化迁移模式也执行。可能与版本化迁移产生 schema 漂移。**建议 P2**：统一加守卫或纳入迁移。

### 2.5 前端超大组件（中风险，维护性）

多个页面 900–2235 行，`core/layout/index.tsx` 2103 行承载布局+菜单+tab+主题+面包屑全部逻辑（`ModuleWizard.tsx` 2235、`I18nList.tsx` 2145、`DeptList.tsx` 1818）。**影响维护性与协作**，是前端最大的技术债信号。**建议 P2**：优先拆 `core/layout/index.tsx`（架构核心）。

### 2.6 连接池不可配置 + 忽略 error（低风险）

`gorm.go:96-99` 硬编码 MaxIdle=10/MaxOpen=100/Lifetime=1h，且 `sqlDB, _ := DB.DB()` 忽略 error。**建议 P2**：改为环境变量可配 + 处理 error（详见 ENTERPRISE_REVIEW_REPORT §4）。

### 2.7 无独立 Repository 层（设计权衡，非缺陷）

Service 直接持 `*gorm.DB`，无 Repository 抽象。**这是有意的简化**（避免过度分层），当前查询已用批量 IN 避免 N+1、事务规范。**结论：符合项目"最小复杂度阶梯"设计，无需引入 Repository**。仅在未来需要多数据源/单元测试 mock 时再评估。

---

## 3. 未来两年是否还能支撑

### 3.1 结论：**能支撑，前提是补齐多实例就绪与权限纵深两块**

| 演进方向                  | 支撑力      | 说明                                                                                               |
| :------------------------ | :---------- | :------------------------------------------------------------------------------------------------- |
| **业务模块增长**          | ✅ 强       | 垂直切片 + 契约 + 生成器（`lowcode/generator`）+ 数据权限钩子，新增业务域成本低，边界不污染底座    |
| **团队规模扩大**          | ⚠️ 中       | 文档/契约/门禁支持多人协作；但前端超大组件与硬编码白名单会成为协作摩擦点                           |
| **数据量增长**            | ⚠️ 中       | 列表已防 N+1，但深分页无游标优化（offset 无上限），大表列表页有隐患（ENTERPRISE_REVIEW_REPORT §6） |
| **水平扩展/高可用**       | ❌ 需改造   | Watcher + 会话缓存一致性是硬前置（§2.2）                                                           |
| **多租户**                | ✅ 就绪度高 | 钩子完善，设计文档齐全，改造路径清晰                                                               |
| **认证演进（SSO/OAuth）** | ✅ 强       | 认证/授权解耦，抽象已设计                                                                          |

### 3.2 关键判断

- 架构**没有根本性错误**，模块化单体选型对"企业后台底座"是正确的（避免过早微服务化的复杂度）。
- 两年内主要压力来自**规模化**（多实例、大数据量、多人协作），而非架构范式。这些都是**增量改造可解决**的，不需要推倒重来。
- 风险在于：若在未解决 §2.2 的情况下贸然水平扩展，会出现权限/会话一致性事故。这是需要**在扩展前主动补齐**的架构债。

---

## 4. 技术债清单（按影响排序）

| #     | 技术债                                          | 位置                                       | 影响        |     优先级     |
| :---- | :---------------------------------------------- | :----------------------------------------- | :---------- | :------------: |
| TD-1  | 权限管理 API 无防自提权纵深校验                 | `permission_service.go`、`role_service.go` | 安全        |       P1       |
| TD-2  | 多实例未就绪（Casbin Watcher + 会话缓存一致性） | `casbin.go`、`token_middleware.go:24`      | 高可用      | P1（扩展前置） |
| TD-3  | DB schema 双源（system_init.sql 过时残缺）      | `database/system_init.sql`                 | 建库踩坑    |       P1       |
| TD-4  | 前端超大组件（layout 2103 行等）                | `core/layout/index.tsx` 等                 | 维护性      |       P2       |
| TD-5  | 深分页无游标优化                                | `user_helper.go:32`、各 List               | 大数据性能  |       P2       |
| TD-6  | 连接池不可配 + 忽略 error                       | `gorm.go:96-99`                            | 运维弹性    |       P2       |
| TD-7  | 部分 AutoMigrate 无环境守卫                     | `refresh_sync.go:47` 等                    | schema 漂移 |       P2       |
| TD-8  | 策略 reload 与 DB 写非事务                      | `permission_service.go:130`                | 一致性窗口  |       P2       |
| TD-9  | Casbin `g` 死配置无注释                         | `casbin.go:26`                             | 可读性      |       P3       |
| TD-10 | PERMISSION_MODEL §17 与数据权限现状文档漂移     | `docs/designs/PERMISSION_MODEL.md`         | 文档准确性  |       P3       |

---

## 5. 架构 Review 结论

Pantheon Base 是一个**架构判断成熟、工程治理优秀**的企业后台底座。核心设计（模块化单体、垂直切片、契约装配、域解耦、安全分层、可观测性）在其目标下均为正确选择，**明确无需为"最佳实践"重构**（尤其：无 Repository 层是合理权衡、单体不应拆微服务、allow-only Casbin 合理）。

真正需要投入的是围绕**规模化就绪**的增量改造：权限纵深防御（P1）、多实例一致性（P1，扩展前置）、schema 单源化（P1）、前端大组件拆分与深分页优化（P2）。这些是"成长的烦恼"，不是架构缺陷。按 `IMPROVEMENT_ROADMAP.md` 的 P0-P3 推进即可让底座稳健支撑未来两年演进。
