# Review — 2026-09-22-tenant-public-settings-scope

## 结论

实现者视角：`/setting/public` 的查询与进程内缓存都按租户上下文隔离；multi 模式解析
「global 默认 + 当前租户覆盖」，compat 只读 global；缓存 key 带租户 namespace；补齐了 setting
自身进程缓存缺失的跨实例失效订阅。

评审视角：**这是一个真实的隔离缺陷修复，而不是防御性加固**。修复前 `publicCache` 是单实例
`*PublicSettingResp`，多租户模式下 A 租户的首个请求会把结果喂给 B 租户——`TestPublicSettings_TenantCacheIsolation`
在旧实现下必红。修复方向正确。

## 对照验收标准

| 验收标准 | 证据 | 判定 |
| --- | --- | --- |
| multi 模式查询使用租户作用域 | `TestPublicSettings_TenantOverridesResolvePerTenant`、`_TenantWithoutOverrideInheritsGlobal` PASS | 通过 |
| 缓存 key 包含租户命名空间 | `TestPublicSettings_TenantCacheIsolation` PASS（旧实现必红） | 通过 |
| 存在租户 A/B 隔离回归 | 上述 3 个测试锁定 A/B 各自解析、继承与缓存不串 | 通过 |
| refresh 失效被覆盖并测试 | `TestPublicSettings_InvalidateClearsAllTenantEntries` PASS；新增 `WatchSettingsInvalidation()` 订阅 `settings:refresh` 清空全部租户 namespace | 通过 |

## 评审关注点与处置

1. **公开路由不挂 TenantContextMiddleware 是否等于未隔离？** 不是。公开路由的租户视图来自
   subject claim（`tenant.FromGin` 在无中间件时返回 nil → compat/global）；未放宽 header 权限，
   匿名请求仍拿 global 视图。这是有意的边界，写入 summary.md 供维护者确认。
2. **缓存失效一致性**：`invalidateSettingCache*` 改为全量清空，覆盖所有租户 namespace，避免了
   “只清当前租户导致其它租户读到旧值”的新问题；代价是全量清空，对 setting 这种低频写、小基数
   缓存可接受。
3. **跨实例语义**：`WatchSettingsInvalidation()` 复用既有 `settings:refresh` 频道，与 auth Runtime
   的 watcher 同源；`watcherOnce` 保证重复 Migrate 不重复订阅。
4. **错误码与响应形状未变**（`setting.public.error`），前端无需同步。

## 残余风险

- 跨实例 pubsub 行为未做双实例运行时验证（本地单实例）；机制与 auth watcher 相同，风险低但有残余。
- 全量清空缓存在极端高频改设置场景会增加回源次数；setting 写路径有审计与节流，暂不设防。
- 租户隔离契约已于 2026-09-23 由维护者确认（multi = global(0) + 当前租户覆盖；compat = 仅 global；公开路由继续不挂 TenantContextMiddleware）。
- `-race` 已在本地执行通过：modules/system/config/setting 12.244s、pkg/tenant 1.091s，无 data race。

## Decision

approved with documented P2 follow-up

## Machine Readable

```json
{
  "taskId": "2026-09-22-tenant-public-settings-scope",
  "verdict": "approved with documented P2 follow-up",
  "structuralReview": {
    "affectedSubgraph": [
      "system/config/setting public read path and process cache",
      "system/config/setting pubsub invalidation watcher",
      "pkg/tenant scope helpers"
    ],
    "checks": ["cycle", "hub", "call-depth", "sensitive-flow"],
    "findings": [],
    "notes": "No new package edge. The public handler now uses boundService(c), so scope derives only from the resolved tenant context; request parameters cannot widen it. The fixed defect is a real cross-tenant cache leak, evidenced by a test that fails on the pre-fix implementation."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-09-22-tenant-public-settings-scope/manifest.json",
    "evidence": ".harness/evidence/2026-09-22-tenant-public-settings-scope/commands.json",
    "reviewFile": ".harness/evidence/2026-09-22-tenant-public-settings-scope/review.md",
    "changeRef": "none",
    "planRefs": [".harness/ENTERPRISE_REMEDIATION_PLAN_2026-09-22.md"]
  }
}
```
