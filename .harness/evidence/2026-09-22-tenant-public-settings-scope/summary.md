# Evidence — 2026-09-22-tenant-public-settings-scope

## 变更摘要

公开设置查询与缓存严格按租户上下文隔离（`backend/modules/system/config/setting/`）：

1. `setting_service.go`
   - `GetPublicSettings`：查询加 `tenantScope()`（multi = global(0) + 当前租户行，compat = 仅 global），`ORDER BY tenant_id asc` 使租户覆盖行最后解析（与 `GetByKey` 同一规则）。
   - `publicCache` 从单实例 `*PublicSettingResp` 改为 `map[string]*PublicSettingResp`，key 为租户 namespace（`t<id>:public`；compat 共享 `public`），杜绝多租户模式下进程级缓存跨租户复用。
   - `settingCacheState` 增加 `watcherOnce sync.Once`。
   - 新增 `WatchSettingsInvalidation()`：订阅 `settings:refresh` pubsub，收到消息清空本进程 setting 缓存（list/group/public 全部租户 namespace）。补齐了原先只有 auth Runtime 订阅、setting 自身进程缓存无跨实例失效的缺口；`notifyRuntimeSettingsChanged` 的 publish channel 抽为共享常量 `settingsRefreshChannel`。
2. `setting_seed.go`
   - `invalidateSettingCache` / `invalidateSettingCacheForGroup` 适配 map（全量清空，覆盖所有租户 namespace）。
3. `setting_handler.go`
   - `GetPublicSettings` 从 `h.service` 切换到 `h.boundService(c)`，公开路由也绑定 per-request 租户上下文（compat 返回共享视图，行为不变）。
4. `modules/system/system_modules.go`
   - setting 模块 `MigrateFunc` 迁移完成后调用 `WatchSettingsInvalidation()`。

## 合同语义（供维护者确认）

- `/setting/public` 行为：multi 模式下返回「global 默认 + 当前租户覆盖」的合并视图；无 tenant header 时按 subject claim 解析；匿名/compat 请求保持原有 global 视图。
- 错误码不变（`setting.public.error`）。
- 租户 header 语义未改动：公开路由未挂 `TenantContextMiddleware`，`tenant.FromGin` 返回 nil → compat 路径（global 行）。multi 模式下前端登录后的请求带 subject claim，公开设置页通过已认证路由或后续接入 TenantContextMiddleware 获得租户视图——当前实现不放宽 header 权限。

## 验证证据

```text
env: PANTHEON_TEST_DSN=root:***@tcp(127.0.0.1:3306)/pantheon_base, REDIS_ADDR=127.0.0.1:6379

go build ./...                                        → PASS
go test ./modules/system/config/setting/...            → ok 6.940s（含 5 个新回归测试）
go test ./modules/system/config/setting ./internal/middleware ./pkg/tenant → ok
go vet ./modules/system/config/setting ./internal/middleware ./pkg/tenant → exit 0
```

新增测试（`setting_public_tenant_scope_test.go`）：

- `TestPublicSettings_TenantOverridesResolvePerTenant` — A/B 租户同名 public setting 各自解析。
- `TestPublicSettings_TenantWithoutOverrideInheritsGlobal` — 无覆盖租户继承 global。
- `TestPublicSettings_TenantCacheIsolation` — 共享 publicCache 不再跨租户泄漏（旧实现此测试必红）。
- `TestPublicSettings_CompatSeesGlobalOnly` — compat 行为兼容。
- `TestPublicSettings_InvalidateClearsAllTenantEntries` — 全量失效覆盖所有租户 namespace。

## 显式 Gap

1. 跨实例 pubsub 失效的运行时双实例验证未做（本地单实例）；单元层以 invalidate 路径测试覆盖，双实例行为依赖与 auth watcher 相同的既有 pubsub 机制。
2. human gate（多租户隔离语义确认）留给维护者。
3. ~~`go test -race` 本地不可用（cygwin cgo 限制），CI 覆盖。~~ **已于 2026-09-23 关闭**：项目内 `.tmp/mingw64`（MinGW-w64 GCC 16.2.0）下 `-race` 通过 —— config/setting 12.244s、pkg/tenant 1.091s，无 DATA RACE。
