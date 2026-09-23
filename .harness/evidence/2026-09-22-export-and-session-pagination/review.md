# Review — 2026-09-22-export-and-session-pagination

## 结论

实现者视角：四条无上限的同步导出补上统一 cap（`impexp.MaxExportRows = 10000`，SQL 下推），
管理员会话列表从“全表 Scan + 内存过滤分页”改为 browser/OS/device 过滤下推为 `user_agent LIKE`、
`COUNT` 与 `SUM(CASE ...)` 聚合、`LIMIT/OFFSET` 全部在 SQL 完成；计数与分页共用同一个过滤器
构造器，因此按构造就一致。

评审视角：**这是把 O(全表) 的读路径换成 O(页) 的读路径，属于纯性能/资源收敛，未放宽任何可见性**。
过滤语义有一处需要 reviewer 特别确认（见关注点 1），已用测试锁死。

## 对照验收标准

| 验收标准 | 证据 | 判定 |
| --- | --- | --- |
| 所有同步导出都有硬上限 | setting audit / posts / i18n / dict 四条补齐 `Limit(MaxExportRows())`；login-log、operation-log、role、user 原本已有同模式 10000 上限 | 通过 |
| 会话过滤与分页由 SQL 支撑 | `TestListAllSessions_ClientFiltersPushedToSQL` PASS（Chrome=10 / Firefox=0 / Windows=10） | 通过 |
| 计数与页结果一致 | `TestListAllSessions_SQLPaginationConsistency`、`_RevokedCountsMatchPages` PASS；total 与 active/revoked 同源自 `base()` | 通过 |
| 索引与基准证据齐备 | 迁移 000018（`revoked_at` / `created_at` / `refresh_expires_at`）；benchmark 230ms/op（3x，10k 行） | 通过 |

## 评审关注点与处置

1. **`user_agent LIKE` 是否等价于原来的 `ParseClientInfo` 二次过滤？** 这是本任务最需要 reviewer
   确认的一点。实现把 `DetectBrowser/DetectOS/DetectDevice` 的判定 token 镜像成 SQL 条件
   （Android Phone/Tablet/Desktop 用 `android` + `mobile` 组合精确映射），并用测试固定了映射结果。
   等价性由 token 表与检测函数同源维护；新增浏览器/设备关键字时两处必须同步，属于已登记的
   维护点。
2. **计数是不是“页内计数”？** 不是。total / active / revoked 都基于整过滤集合的 SQL 聚合，
   与页数据同源，避免了旧的“内存过滤后集合”语义。
3. **导出被截断时对用户是否可见？** 目前不可见：超限时按“最近 N 行”语义返回，无 truncated 标记。
   已在 summary/knownGaps 中登记为显式 gap，需维护者决定是否新增响应字段（会改变导出契约）。
4. **索引落地方式**：开发库靠 AutoMigrate tag 兜底，生产由 000018 guarded ALTER 应用；本地验证时
   手工 ALTER 已回滚，索引归属迁移文件。EXPLAIN 前后对比来自实现时实库，本次 closeout 未重跑。

## 残余风险

- 截断不可识别：运维/用户无法从响应判断是否被 cap，需配合时间窗口分批导出（已文档化）。
- 客户端检测 token 与 SQL 条件双份维护，存在漂移可能；测试覆盖了当前取值，新增关键字需同步。
- cap 数值（10000）与“不引入截断标记”已于 2026-09-23 由维护者确认。
- `-race` 已在本地执行通过：modules/auth/session 4.896s、config/setting 12.244s、modules/system 6.016s、pkg/database 14.626s、modules/auth/login 239.678s，无 data race。

## Decision

approved with documented P2 follow-up

## Machine Readable

```json
{
  "taskId": "2026-09-22-export-and-session-pagination",
  "verdict": "approved with documented P2 follow-up",
  "structuralReview": {
    "affectedSubgraph": [
      "auth/session admin list query",
      "setting audit / post / i18n / dict export paths",
      "pkg/impexp shared export cap",
      "session pagination indexes and migration 000018"
    ],
    "checks": ["cycle", "hub", "call-depth", "sensitive-flow"],
    "findings": [],
    "notes": "Read paths moved from unbounded scans to bounded SQL. Counts and pages share one filter builder, so no visibility was widened and no counter can drift from its page. Residual risk is the duplicated browser/OS detection vocabulary (Go function + SQL tokens), which tests pin for the current keyword set."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-09-22-export-and-session-pagination/manifest.json",
    "evidence": ".harness/evidence/2026-09-22-export-and-session-pagination/commands.json",
    "reviewFile": ".harness/evidence/2026-09-22-export-and-session-pagination/review.md",
    "changeRef": "none",
    "planRefs": [".harness/ENTERPRISE_REMEDIATION_PLAN_2026-09-22.md"]
  }
}
```
