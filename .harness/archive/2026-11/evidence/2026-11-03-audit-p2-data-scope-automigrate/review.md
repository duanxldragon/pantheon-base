# Review — 2026-11-03-audit-p2-data-scope-automigrate

## 逐条核对

| Reviewer posture | 结论 |
|---|---|
| AutoMigrate 分支是否真的被移除，而不是被注释掉 | 移除。`grep -c AutoMigrate` 为 0，函数体只剩兜底建表 |
| 兜底是否保留 | 保留，且只在 `!cachedHasTable` 时执行；DDL 提为常量后与迁移链逐列一致 |
| 迁移链是否被改写 | 没有。`000001` / `000002` / `000024` 一行未动（历史迁移不可改写） |
| `cachedHasTable` / `storeCachedTableExistence` 行为是否变化 | 无变化：建表成功后仍写缓存；命中缓存仍直接返回 |
| 生产路径是否零变化 | 是。生产 `PANTHEON_AUTO_MIGRATE` 不为 true，`ShouldAutoMigrate()` 为 false，改动前走的就是 `else if !cachedHasTable` 分支；删除的是 dev-only 分支 |
| 行级权限读取是否受影响 | 无。`loadRoleDataScopePolicies` / `resolveDataScopeMode` 未改动，fail-closed 语义保留 |
| 断言是否只是「重复实现」而没有约束力 | 有约束力：反射遍历模型字段使「加字段不加列」必红；函数体禁止 AutoMigrate 使回退必红 |

## 反向验证（防断言空转）

`TestMigrateDataScopePolicyDoesNotAutoMigrate` 读的是源文件而不是运行结果，
所以在把 AutoMigrate 调用加回去时必须变红——这是它存在的理由。
`TestDataScopeModelMatchesMigrationChain` 的字段映射表是手写的，故意不自动推导新字段名：
新增字段时映射缺失，测试会红在「has no column mapping」，强制一次显式决策。

## Machine Readable

```json
{
  "taskId": "2026-11-03-audit-p2-data-scope-automigrate",
  "verdict": "approved",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-11-03-audit-p2-data-scope-automigrate/manifest.json",
    "evidenceDir": ".harness/evidence/2026-11-03-audit-p2-data-scope-automigrate/",
    "evidence": ".harness/evidence/2026-11-03-audit-p2-data-scope-automigrate/commands.json",
    "reviewFile": ".harness/evidence/2026-11-03-audit-p2-data-scope-automigrate/review.md",
    "changeRef": "none",
    "planRefs": ["docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-11-03.md"]
  },
  "openDeviations": [
    "形状断言是静态比对，未在真实 MySQL 上跑迁移后 information_schema 对比（本机无 testmysql 实例）。",
    "dev 老库若表已存在但缺列，兜底不会再补列；需重建或跑迁移（收口的预期代价）。"
  ]
}
```
