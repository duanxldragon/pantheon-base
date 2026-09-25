# Evidence — 2026-09-22-request-path-maintenance

## 变更摘要

把 session inventory、登录日志、安全事件、操作日志四类保留/治理操作从普通读请求路径移出，
统一交由后台维护器按节流策略执行；显式维护入口保持不变。

### 1. 新增统一维护器 `backend/pkg/maintenance`

- `Task{Name, Interval, Run}` + `Registry`：`Register`（同名幂等替换）、`RunDue`、`RunNow`、`Tasks`。
- **节流**：每个任务按自身 `Interval` 判重，未到期返回 `OutcomeSkipped`（不落库、不报错）。
- **互斥/单飞**：任务在飞行中再次被触发返回 `OutcomeOverlap`，不会并发跑同一次 purge；
  overlap 判定先于节流判定，保证“正在运行”是可行动信号。
- **失败隔离**：单个任务失败只记日志 + 计数，不中断同一轮其它任务；panic 被 `recover` 成
  `failed`，不会打死维护循环。
- **可观测**：`slog`/`zap` Info/Error 日志 + 新指标
  `pantheon_maintenance_runs_total{task,outcome}`（succeeded/failed/skipped/overlap）和
  `pantheon_maintenance_duration_seconds{task}`。
- `Run(ctx, registry, interval)`：启动即执行一轮，之后按 `interval` 循环，`ctx` 取消即退出。
- `Default()` 进程级注册表，模块装配时注册；`NewRegistry()` 供测试隔离。

### 2. 四个域改造成维护入口（原函数从读路径移除）

| 域 | 原行为（读请求内联 purge） | 现在 |
| --- | --- | --- |
| `auth/session` | `ListSessions` / `ListAllSessions` / `CleanupHistoricSessions` 调 `governSessionInventory` | 读路径不再 sweep；导出入口 `RunSessionInventoryGovernance()` + 任务 `auth.session_inventory`；显式清理端点仅按窗口删除 |
| `auth/login` | `ListLoginLogs` / `ExportLoginLogs` / `listLoginLogsForExport` / `RecordLoginLog` 调 `ensureAutomaticLoginLogRetention` | 读/写路径不再删除；导出 `RunLoginLogRetention() error` + 任务 `auth.login_log_retention` |
| `auth/security` | `ListSecurityEvents` 调 `ensureAutomaticSecurityEventRetention` | 读路径不再删除；导出 `RunSecurityEventRetention() error` + 任务 `auth.security_event_retention` |
| `system/audit` | `ListOperationLogs` / `GetOperationLog` / `ExportOperationLogs` 调 `ensureAutomaticOperationLogRetention` | 读路径不再删除；导出 `RunOperationLogRetention() error` + 任务 `audit.operation_log_retention` |

顺带移除三处自建节流状态（`autoCleanupState`、`lastCleanupAt` map、`autoCleanupMinInterval`）：
节流现在只有一处实现（registry），且 `LoginService`/`security.Service` 的租户 facade 浅拷贝
不再需要指针共享锁。登录请求中仍然保留的是**按用户**的 `CleanupUserOverflowSessions`
（`max_active_sessions_per_user` 语义，非全表 sweep）。

### 3. 装配与运行

- `modules/auth/module.go`：`authSvc.RegisterMaintenanceTasks(maintenance.Default())`。
- `modules/system/system_modules.go`：`auditSvc.RegisterMaintenanceTasks(maintenance.Default())`。
- `cmd/server/main.go`：`maintenance.Run(ctx, maintenance.Default(), interval)`，
  由 `PANTHEON_MAINTENANCE_ENABLED`（默认 true）与
  `PANTHEON_MAINTENANCE_INTERVAL_SECONDS`（默认 900）控制；`.env.example` 已登记。
- 失败告警策略：任务失败 → Error 日志 + `outcome="failed"` 计数；无需额外重试即满足
  “失败重试**或**明确告警”。读路径不再执行 purge，因此维护失败不会表现为“列表为空”。

### 4. 文档同步

`docs/designs/AUTH_MODULE_DESIGN.md` 新增“保留策略的维护模型”小节：任务清单、节流/单飞语义、
指标名、显式入口、职责边界；`.env.example` 增加两个维护开关。

## 测试改动（读路径契约反转）

- `TestRuntime_ListLoginLogsAppliesAutomaticRetention` → `TestRuntime_ListLoginLogsDoesNotPurge`
  + 新增 `TestRuntime_RunLoginLogRetentionDeletesExpiredAndReports`。
- `TestRuntime_ListAllSessionsPurgesHistoricSessions` → `TestRuntime_ListAllSessionsDoesNotPurgeHistoricSessions`
  （断言读请求不删、维护入口仍按 retention 清理）。
- `TestRuntime_ListAllSessionsCleansExpiredAndIdleSessions` → `TestRuntime_MaintenanceCleansExpiredAndIdleSessions`。
- `TestAuditService_ListOperationLogsAppliesAutomaticRetention` → `TestAuditService_ListOperationLogsDoesNotPurge`
  + 新增 `TestAuditService_RunOperationLogRetentionDeletesExpired`。
- `TestEnsureAutomaticSecurityEventRetention` → `TestRunSecurityEventRetention`（去掉任务内节流断言，
  改为先验证 list 不删、再验证维护入口 sweep；节流断言迁到 `pkg/maintenance` 单测）。
- 新增 `pkg/maintenance/maintenance_test.go`：节流、单飞、失败隔离、panic 恢复、RunNow、幂等注册、
  默认 interval、runner 随 ctx 退出。

## 验证证据

见 `commands.json`。关键结果：

```text
go build ./...                                                  → exit 0
go vet ./...                                                    → exit 0
gofmt -l .                                                      → 空
go test ./pkg/maintenance                                       → ok（cover 89.8%）
go test ./modules/auth/security ./modules/auth/session ./modules/system/audit → ok
go test ./modules/auth/login                                    → ok 100.4s
go test ./modules/auth/... ./modules/system/... ./pkg/maintenance ./pkg/metrics → 全绿
grep 旧 helper 名（ensureAutomatic*/governSessionInventory/autoCleanupState） → 无匹配
```

仓库门禁（本地）：

```text
check-structure-contract (strict)  → 0 finding / 1939 files
check-generated (strict)           → 0 finding / 11 artifacts
check-doc-links (strict)           → 0 finding
check-encoding (strict)            → 0 finding / 1731 files
frontmatter-check                  → passed（266 docs）
check-doc-inventory (strict)       → 0 finding
check-sync-drift (strict)          → 0 finding
check-boundaries --baseline        → exit 0（3 条 stale baseline warning 来自本轮之前未提交的 auth 解耦改动，非本任务引入）
check-duplication                  → PASS
check-method-health / adoption / template-health / failure-registry → 0 finding
check-task-packet-template         → OK
check-evidence / check-review（本任务文件）→ PASS
```

## 显式 Gap

1. **human gate 未走**：保留操作口径（是否接受“自动保留只在后台跑”）与维护间隔需维护者确认；
   见 `review.md`。
2. **无人为 runtime evidence**：纯后端行为变更，无 UI/路由/菜单/权限面；运行态证据以包测试 +
   新指标替代，未起真实进程。
3. ~~`-race` 本地不可用（cygwin cgo），由 CI 覆盖。~~ **已于 2026-09-23 关闭**：新增维护器的单飞/节流状态是最需要 race 验证的部分。项目内 `.tmp/mingw64`（MinGW-w64 GCC 16.2.0）下 `-race` 全绿：pkg/maintenance 1.118s、audit 11.951s、setting 12.244s、system 6.016s、platform 4.122s、cmd/server 1.141s、database 14.626s、authtoken 1.369s、middleware 2.503s、session 4.896s、login 239.678s，无 DATA RACE。
4. **pantheon-ops 同步延期**：`pantheon-ops/backend/modules/auth/{session,login}` 与
   `system/audit` 仍是旧的内联清理实现；按 workspace `Base-first` 规则，通过 foundation release
   同步，不在本任务手抄。
5. 前端未做改动；列表/导出接口的响应字段与语义未变，无需 i18n/菜单/权限同步。
6. **观测到的既存问题（非本任务引入）**：未接入 CI 的 `scripts/harness/check-task-packet.mjs` 对 `.harness/tasks/*/task.md`
   全量报“缺少 12 个必需章节”，包含整个 2026-09-22 任务轮与本任务。CI 实际运行的是
   `scripts/check-task-packet-template.mjs`（通过）。修复涉及全部任务包，应作为独立 ratchet，不在本任务内顺手改。
