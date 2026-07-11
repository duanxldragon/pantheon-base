# 改进路线图 (IMPROVEMENT_ROADMAP)

> 生成日期：2026-07-09
> 排序：P0（阻塞/紧急）> P1（规模化前必做）> P2（持续改进）> P3（优化/清理）
> 每项含：问题 · 文件位置 · 修改方案 · 对现有功能影响 · 是否需人工确认
> 原则：不为"最佳实践"重构。已合理者不列入。涉及权限设计/DB schema/API/前端路由/模块拆分者标注【需确认】。

---

## P0 — 阻塞 / 紧急

**无 P0 项。** 当前代码无致命缺陷，单实例部署可安全投产。`go vet` 零告警、无 SQL 注入、无 XSS、安全基线完备。

---

## P1 — 规模化 / 安全前必做

> **状态更新（2026-07-10，经代码核实）**：本节大部分已在代码中落地，roadmap（2026-07-09）已落后于代码。
>
> - **P1-1 ✅ 已完成**：`permission_service.go` 的 `canWritePolicy` / `ensurePolicyWriteAllowed(operatorRoleKeys, path)` 防提权守卫已应用于 Create/Update/Delete/Import 全部写路径，handler 经 `common.GetRoleKeys(c)` 传入操作者 roleKeys，越权返回 `permission.escalation.forbidden`；测试 `TestPermissionService_PolicyWriteProtection`、`TestProtectedManagementPolicyGuard` 覆盖。
> - **P1-2 ✅ 已完成**：`backend/pkg/database/casbin_watcher.go` 完整 Redis Watcher（`PANTHEON_CASBIN_WATCHER` 开关，默认关），`casbin.go` 已 `SetWatcher`，`reloadPermissionPolicies()` 写后 `NotifyCasbinWatcher()` 广播；会话缓存 `token_middleware.go` TTL≤0 可禁用。
> - **P1-3 ✅ 本次修复**：`docker-compose.yml` 移除陈旧 `system_init.sql` 挂载，schema 统一到 golang-migrate（见 `database/README.md`）。剩余：`docker-compose up` bring-up smoke 待跑确认。

### P1-1 · 权限管理 API 增加防自提权纵深校验 【需确认：权限设计】 — ✅ 已完成

- **问题**：权限/角色写 API 无"防自提权/防改高权角色"校验，安全依赖运维纪律。若普通角色被误授 `/system/permission*` 或 `/system/role*` 写策略，可提权到近似 admin。
- **位置**：`backend/modules/system/iam/permission/permission_service.go:115,146,183`（CreatePolicy/UpdatePolicy/DeletePolicy）；`backend/modules/system/iam/role/role_service.go:248,298`。
- **方案**：在写路径注入操作者 roleKeys 上下文，校验"非 admin 操作者不得授予超出自身已有策略集的接口权限"；高敏授权动作（授予他人管理端策略）强制走 `SecureActionMiddleware`（基建已存在，`secure_action_middleware.go`）。
- **影响**：admin 操作不受影响（通配恒满足）；非 admin 若本就无管理端策略则行为不变（默认 seed 即如此）。前端权限页需接入二次验证弹窗（已有基建）。
- **验证**：新增 `permission_service_test.go` 用例（低权角色尝试提权应被拒）。

### P1-2 · 多实例一致性：Casbin Watcher + 会话缓存 【需确认：架构/部署形态】

- **问题**：① Casbin 无 Watcher，多副本策略不同步；② Token 60s 进程内内存缓存（`token_middleware.go:24-26`），多实例下登出后有窗口。仅在水平扩展时才是问题。
- **位置**：`backend/pkg/database/casbin.go:45`；`backend/internal/middleware/token_middleware.go:24-26`。
- **方案**：① 引入 Casbin Redis Watcher（复用现有 Redis），策略写入后广播其他实例 `LoadPolicy`；② 会话缓存改为可关闭（多实例下禁用内存缓存或缩短 TTL），或依赖黑名单强制下线路径（已实现）覆盖强吊销场景。
- **影响**：单实例可保持现状（默认不启用 Watcher）；多实例开启后策略/会话一致性达标。
- **前置性**：**水平扩展前必须完成**，否则会出现权限/会话一致性事故。

### P1-3 · 数据库 schema 单源化 【需确认：DB schema】

- **问题**：`database/system_init.sql`（16 表，已标 DEPRECATED）与权威迁移（29 表）分歧，误用会得到残缺过时 schema。
- **位置**：`database/system_init.sql`（尤其缺 13 张表、`avatar`/`data_scope` 等列差异）；权威源 `backend/pkg/database/migrations/000001_init_schema.up.sql`。
- **方案**：将 system_init.sql 的**建表部分**移除或整体归档到 `docs/archive/`，仅保留 seed 数据供参考；文档与脚本统一建库路径到 golang-migrate。
- **影响**：不影响运行时（运行时已走迁移）；消除新人/脚本踩坑。**注意**：本仓库当前 `system_init.sql` 已有在途未提交改动，需与在途作者协调后再动。

---

## P2 — 持续改进

### P2-1 · 深分页保护 / 游标优化

- **问题**：`Offset((page-1)*pageSize)` 对 page 无上限，大表深分页全扫描。
- **位置**：`backend/modules/system/iam/user/user_helper.go:32-34` 及各 List Service；`role_service.go:509`（NOT EXISTS + offset）。
- **方案**：加最大 offset 保护（如 page*pageSize > 10万 拒绝或降级）；对大表列表提供 `id`/时间游标分页。
- **影响**：小规模无感；大数据量列表页性能显著改善。

### P2-2 · 连接池配置化 + 处理 error

- **问题**：`sqlDB, _ := DB.DB()` 忽略 error；池参数硬编码 magic number。
- **位置**：`backend/pkg/database/gorm.go:96-99`。
- **方案**：处理 `DB.DB()` error 并记日志；MaxOpen/MaxIdle/Lifetime/IdleTime 改环境变量可配（默认值不变）。
- **影响**：向后兼容（默认值保持 100/10/1h）。

### P2-3 · 统一 AutoMigrate 环境守卫

- **问题**：`refresh_sync.go:47`、`dynamic_module_sync.go:24,165` 的 AutoMigrate 无 `ShouldAutoMigrate()` 守卫。
- **位置**：上述文件。
- **方案**：加 `if ShouldAutoMigrate()` 守卫，或将对应表纳入版本化迁移。
- **影响**：避免版本化迁移模式下的 schema 漂移；需确认这些表已在迁移中定义。

### P2-4 · Casbin 策略 reload 失败显式告警

- **问题**：策略 DB 写与内存 reload 非事务，reload 失败静默，出现数据/运行态不一致窗口。
- **位置**：`backend/modules/system/iam/permission/permission_service.go:130-135,167-170,187-190`；`role_service.go:397`。
- **方案**：reload 失败时记 error 日志 + 返回提示"策略已保存，运行态同步失败，请重试或重启"。
- **影响**：无功能变更，仅增强可观测性。

### P2-5 · Casbin 策略变更审计快照

- **问题**：策略变更走统一 OperationLog，但未记策略前后快照。
- **位置**：permission/role 写路径。
- **方案**：对齐已有 `permission_workbench_remediation_event` 表模式，记录 casbin_rule 变更前后。
- **影响**：增强安全审计可追溯性。

### P2-6 · 前端 `core/layout/index.tsx` 拆分 【需确认：前端结构】

- **问题**：2103 行 God Object，承载布局+菜单渲染+tab+主题+面包屑。
- **位置**：`frontend/src/core/layout/index.tsx`。
- **方案**：按关注点拆分（MenuRenderer / TabManager / ThemeSwitcher / Breadcrumb 子组件/hook）。
- **影响**：纯重构，需完整回归（布局是全局壳层，风险中）。**建议先补 smoke 覆盖再拆**。

### P2-7 · 数据权限覆盖面按需扩展

- **问题**：数据权限仅覆盖用户列表/导出，其他 system 列表未接。
- **位置**：`backend/modules/system/system_modules.go:128,143-144`（仅 user 走 `systemDataScoped`）。
- **方案**：按业务需要为组织/审计类列表接入 `systemDataScoped`（样板见 `business/cmdb/host`）。
- **影响**：按需推进，非全量。

---

## P3 — 优化 / 清理

### P3-1 · 其余前端超大组件拆分 【需确认：前端结构】

- `ModuleWizard.tsx`(2235)、`I18nList.tsx`(2145)、`DeptList.tsx`(1818)、`RoleList.tsx`(1356) 等，按 tab/step 拆分。低优先，逐步进行。

### P3-2 · 前端权限判断去重

- App/Guard/hook 三处重复实现权限判断（逻辑一致）。抽 `checkPermission(userInfo, perm)` 单一函数。
- 位置：`App.tsx`、`RoutePermissionGuard.tsx:29`、`usePermission.ts:6-11`。

### P3-3 · 批量插入优化

- 角色成员/权限/菜单逐条 INSERT 改 `CreateInBatches`（对齐 `replaceUserRoles`）。
- 位置：`role_service.go:196-209`、`role_helper.go:174-181`、`role_menu.go:57`。

### P3-4 · Casbin `g` 死配置加注释

- `casbin.go:26` 加注释说明"角色继承未启用，多角色叠加在中间件层 OR 实现"。

### P3-5 · 文档漂移修正

- `docs/designs/PERMISSION_MODEL.md §17`"当前不实现数据权限"与 `DATA_PERMISSION_HOOK.md` 现状矛盾，更新为"数据权限 P2 基线已落地，覆盖面持续扩展"。

### P3-6 · 上传/文件服务安全回归 【需确认】

- 确认 `settingHandler.ServeUploadedFile`（目录穿越）与 `UploadFile`（scope 白名单 + 文件类型）有单测覆盖；若缺则补穿越/越权用例。
- 位置：`system_modules.go:316,321`。

---

## 执行建议

1. **先做 P1-3（schema 单源化）与 P3-5（文档修正）**——低风险、防踩坑，但 P1-3 需与在途 `system_init.sql` 改动作者协调。
2. **P1-1（越权校验）优先级最高**——安全实质短板，但需你确认权限模型行为变更方案后再实施。
3. **P1-2 仅在计划水平扩展时启动**——单实例可暂缓。
4. **P2/P3 随迭代插入**，前端拆分类（P2-6/P3-1）务必先补 smoke 再动。

> 所有【需确认】项在获得你批准前不会执行。本次 Review 仅自动修复了 3 个 gofmt 文件（纯格式化）。
