# Review — 2026-09-22-request-path-maintenance

## 评审视角结论

实现者视角：读路径不再执行任何 retention/治理 purge；四类保留策略由单一维护器按 interval
节流、单飞执行，失败可见；显式清理端点未改动。

评审视角：**方向正确、边界收窄、未削弱保留要求**。需维护者确认的只有保留口径与间隔两项（human gate）。

## 对照验收标准

| 验收标准 | 证据 | 判定 |
| --- | --- | --- |
| 普通列表请求不执行全量 cleanup/purge | 4 个包测试断言 list/export 后行数不变；旧 helper 名 grep 无残留 | 通过 |
| 维护任务具备互斥、节流、失败重试或明确告警策略 | registry 单飞（`OutcomeOverlap`）+ `Interval` 节流（`OutcomeSkipped`）+ 失败 Error 日志与 failed 计数 | 通过 |
| 保留策略仍可通过显式维护入口执行 | `POST /system/session\|login-log\|security-event\|operation-log/cleanup` 未改动；域内 `Run*` 入口可独立调用 | 通过 |
| 请求路径和后台维护路径分别有测试与日志/指标证据 | 读路径反转测试 + `pkg/maintenance` 单测；日志 + `pantheon_maintenance_runs_total` / `_duration_seconds` | 通过 |
| 维护失败不会伪装成列表数据为空 | 读路径不再写库；失败只体现在日志/指标，不能改变列表结果 | 通过 |

## 评审关注点与处置

1. **是否削弱了保留要求？** 未削弱。删除语义、窗口、默认值（登录 90 天、安全事件 180 天、
   操作日志 180 天、会话 90 天）全部保持；只是执行时机从“读请求内联”改为“后台按间隔”。
2. **后台维护关闭会怎样？** `PANTHEON_MAINTENANCE_ENABLED=false` 时自动清理停止，但显式清理端点仍可用；
   这是运维逃生舱，已在 `.env.example` 与设计文档写明。
3. **是否引入新的并发风险？** 单进程内节流/单飞由 registry 互斥保护；显式清理端点与后台任务可能并发，
   但两者的 DELETE 都是幂等条件删除（`login_time < cutoff`、`oper_time < cutoff`、
   `revoked_at IS NOT NULL`），并发不会产生越界删除；未引入锁顺序或共享可变状态。
4. **登录链路是否变慢/变快？** 变快：登录写日志不再顺带全表 DELETE 扫描。
   `max_active_sessions_per_user` 语义由按用户的 `CleanupUserOverflowSessions` 保留，未被外移。
5. **任务间是否互相影响？** `RunDue` 顺序执行、单任务失败不影响后续任务；panic 被 recover 为 failed。
6. **新的全局注册表是否污染测试？** 模块装配注册用 `Default()`；测试用 `NewRegistry()` 隔离。
   `Register` 同名幂等，重复装配不产生重复任务。

## 残余风险

- 维护间隔内（默认 15 分钟）过期数据仍可见/仍占空间，属可接受权衡；间隔可配置。
- 首次登录/首次启动不再“顺手清理”，依赖后台维护器已启动；未启动即无自动清理，已文档化。
- ops 侧未同步，仍为旧内联实现（延期，见 summary 显式 Gap 4）。
- 多副本部署下每个副本都会跑同一批 sweep（无分布式单飞）；DELETE 条件幂等，代价是带宽而非正确性，
  已记入 manifest 的 technicalDebtNote。
- 既存问题（非本任务引入）：未接入 CI 的 `scripts/harness/check-task-packet.mjs` 对 `.harness/tasks/*/task.md`
  全量报缺少必需章节，覆盖整个 2026-09-22 轮次；修它需要动全部任务包，属于独立 ratchet。

## human gate（2026-09-23 已由维护者确认）

维护者授权：2026-09-23「A 轮剩余的，我授权给你直接完成」。

1. ✅ 确认“自动保留只在后台维护器执行、读请求绝不 purge”。
2. ✅ 默认维护间隔 900 秒接受为默认值（可用 `PANTHEON_MAINTENANCE_ENABLED=false` 关闭或调整间隔）。
3. ✅ 不新增显式“立即执行”管理端点，继续复用四个 cleanup 端点（避免新增路由/权限/i18n 面）。

本地缺口同步关闭：`-race` 已在项目内 MinGW-w64 工具链下全绿（pkg/maintenance 及全部被改动包，无 data race）。

## Decision

approved with documented P2 follow-up

## Machine Readable

```json
{
  "taskId": "2026-09-22-request-path-maintenance",
  "verdict": "approved with documented P2 follow-up",
  "structuralReview": {
    "affectedSubgraph": [
      "backend/pkg/maintenance registry and runner",
      "auth session inventory governance entry point",
      "auth login-log / security-event retention entry points",
      "system audit operation-log retention entry point",
      "cmd/server background runner startup"
    ],
    "checks": ["cycle", "hub", "call-depth", "sensitive-flow"],
    "findings": [],
    "notes": "pkg/maintenance is a leaf package (logging + metrics only), so the new edges from auth/session and system/audit cannot create a cycle. No request parameter reaches the maintenance entry points; retention windows come from server-side settings, and the read paths lost their write side-effect, shrinking the sensitive surface rather than growing it."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-09-22-request-path-maintenance/manifest.json",
    "evidence": ".harness/evidence/2026-09-22-request-path-maintenance/commands.json",
    "reviewFile": ".harness/evidence/2026-09-22-request-path-maintenance/review.md",
    "changeRef": "none",
    "planRefs": [".harness/ENTERPRISE_REMEDIATION_PLAN_2026-09-22.md"]
  }
}
```
