# Review — 2026-11-03-audit-p2-route-groups-unify

## 逐条核对

| Reviewer posture | 结论 |
|---|---|
| 每条路由的中间件组合是否与改前等价 | 是。逐组对照见 summary 的映射表：总数 1+2+3+6+1+1+1 = 15，与原文件 15 条链一一对应，无组合被合并或丢失 |
| 是否有路由被顺手删掉 | 没有。所有 `.GET/.POST/.PUT/.DELETE` 注册行未改动，只改了变量初始化那一行 |
| 顺序是否有变化 | 无。Capability 在 Casbin 之后、DataScope 之前、RefreshSync 最后，与原链一致；顺序断言在 `route_groups_system_test.go` 里逐项比对 |
| 是否改了任何中间件实现 | 没有。`internal/middleware/*` 一行未动，只新增 contracts 层组装助手 |
| 有没有为了过测试而放宽断言 | 没有。新测试是「钉死」，不是「放宽」；且新增源码 ratchet 反而更严（禁止再出现手写链） |
| `SystemTokenGroup` 是否被误加了租户上下文 | 没有。它是独立函数，链只有 1 个 handler，并有专门断言 |

## 风险点复核

- **静默权限差异**：原风险是「重排时漏挂 DataScope/PlatformCapability」。现在漏挂会在
  helper 链断言里红，或者在调用点显式少写 `WithDataScope()`（review 时一眼可见），
  且源码 ratchet 禁止回到手写链。
- **nil RefreshSync**：`SystemProtectedGroup` 只在 `opts.RefreshSync != nil` 时挂载，
  与改前「部分模块不挂 RefreshSync」等价（dict / setting / audit / i18n）。

## Machine Readable

```json
{
  "taskId": "2026-11-03-audit-p2-route-groups-unify",
  "verdict": "approved",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-11-03-audit-p2-route-groups-unify/manifest.json",
    "evidenceDir": ".harness/evidence/2026-11-03-audit-p2-route-groups-unify/",
    "evidence": ".harness/evidence/2026-11-03-audit-p2-route-groups-unify/commands.json",
    "reviewFile": ".harness/evidence/2026-11-03-audit-p2-route-groups-unify/review.md",
    "changeRef": "none",
    "planRefs": ["docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-11-03.md"]
  },
  "openDeviations": [
    "未做真实 router 快照：装配依赖 MySQL/Redis，以 helper 链断言与源码 ratchet 替代，运行期由 backend-tests 覆盖。"
  ]
}
```
