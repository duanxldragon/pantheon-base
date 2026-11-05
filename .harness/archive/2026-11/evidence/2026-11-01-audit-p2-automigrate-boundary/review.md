# Review — 2026-11-01-audit-p2-automigrate-boundary

逐条对照 manifest `executionRoles.reviewerPosture`。

## 1. 平台表的 AutoMigrate 禁令没有被放宽 — ✅

新增的例外只覆盖"运行时才有 schema 的生成业务表"。文档里保留了两条硬边界：

- 平台表（`system_*` / `platform_*`）**只能**由 `backend/pkg/database/migrations/` 创建；
- 该禁令由 `PANTHEON_AUTO_MIGRATE` 控制，生产恒为 `false`。

代码侧没有放宽任何东西：`data_scope_middleware.go` 里那条 `ShouldAutoMigrate()` 分支一行未改，
`migrate.go` 的 `ShouldAutoMigrate()` 一行未改，`RegisterBackendModules` 的分支结构一行未改
（只改了日志文案与注释）。

反向检查：如果这次改动把"生产不得 AutoMigrate"整体放宽成"允许 AutoMigrate"，那么平台表也会被
覆盖，下次有人图省事直接给平台模型加 `AutoMigrate` 就不会有任何约束。现在的措辞没有给这个空间——
它把"谁创建哪张表"逐行写死了。

## 2. 例外边界可逐条核对，不是一句"低代码例外" — ✅

`DEPLOYMENT_GUIDE §3` 用的是三列表格：表类型 / 由谁创建 / 受哪个开关控制。
读的人可以拿自己的表名去对号入座，而不是靠"低代码算不算例外"的直觉。

另外补了一条容易混淆的辨析：`PANTHEON_ENABLE_DYNAMIC_MODULES` 管的是 HTTP 注册路由，
与本例外无关。这条不是补充说明，是本包执行中真实踩到过的误判（见 commands.json 第 1 条），
不写下来下一个人会重踩。

## 3. 日志文案与 bootstrap 阶段的实际行为一致 — ✅

原句 `skipping module AutoMigrate and running runtime bootstraps` 的问题是自相矛盾：
前半句断言"跳过 AutoMigrate"，后半句执行的动作里包含 AutoMigrate。

新句把两件事分开说：`module Migrate() skipped`（准确）+ `runtime bootstraps run instead`
（准确）+ note 明确指出 bootstrap 内部会建表并给出文档位置。实测输出见 commands.json 第 4 条。

## 4. 新用例不与既有用例重复，且负向验证能单独打红 — ✅

这一条是本包唯一"初版做错、被自己的负向验证推翻"的地方，值得记清楚。

**初版注释**：既有用例基于同时实现 `Migrate` 与 `Bootstrap` 的自定义类型，"所以删掉 bootstrap
阶段它们仍会通过"。**负向 B 实测**：删掉整个 bootstrap 阶段后，`PhasedExecution` **也红**。
注释里的因果是猜的。

**真实缺口**：既有用例无法区分"模块完整所以 bootstrap 跑了"与"只有 `BootstrapFunc` 也会
bootstrap"——而后者是 `FuncModule` 与生成模块的形状。**负向 A**（把 `FuncModule.Bootstrap`
改成要求 `MigrateFunc` 非空）只打红新用例、另两个保持绿，这才证明它有独立价值。

注释已按实测改写。这条与 W6 的 `000031.down` 是同一类错误：先写结论再验，验完才发现结论不成立。

## 5. 没有借机改生成器或业务模块 — ✅

改动清单：

| 文件 | 改动 |
| --- | --- |
| `docs/DEPLOYMENT_GUIDE.md` | §3 规则改写 + 边界表 + 两点操作后果 + 环境变量辨析；in-body 最后更新日期 |
| `docs/designs/MODULE_CONTRACT.md` | §4.3 接口补 `Migrate`、加执行时机表、说明 `BootstrapFunc`；`updated_at` → 2026-11-01 |
| `backend/pkg/contracts/module.go` | 启动日志改准；注释补一句"bootstrap 阶段不在禁止范围内" |
| `backend/pkg/contracts/module_test.go` | 新增 1 个用例 |

没碰：生成器模板、`generated_registry.go`、迁移链、`migrate.go`、任何业务模块、
`PANTHEON_AUTO_MIGRATE` 的语义、`VERSION`、`CHANGELOG.md`、`pantheon-ops`。

## 反向检查：这个例外会不会被当成万能挡箭牌

风险是有的，所以文档写了两条代价而不是只写权利：DDL 权限、列只增不减。
如果将来有人拿"生成业务表例外"去解释平台表为什么可以 AutoMigrate，表格第一行直接否掉。
把代价和边界一起写，是这条例外不被滥用的唯一保障。

## 遗留（不在本包可关闭范围）

1. `AUD-001c-ddl`（P3）：生成表 DDL 不在迁移链里，无 down 迁移。根治需生成器产出迁移文件，
   风险见 `summary.md` 的三选项表。
2. `AUD-001c-ops-doc`（P3）：下游 `pantheon-ops` 部署手册若抄过旧表述需自行同步。

两条均不阻断冻结。

## Machine Readable

```json
{
  "taskId": "2026-11-01-audit-p2-automigrate-boundary",
  "verdict": "approved",
  "verdictRationale": "The P2 is closed by choosing one of the two remedies the audit offered and writing down why the other two candidates were rejected, rather than by rewording until the contradiction stopped being visible. The first thing this packet did was check whether the conflict is even reachable, because PANTHEON_ENABLE_DYNAMIC_MODULES is pinned to false in production and that looks like it dissolves the problem. It does not: the guard sits on the /lowcode/dynamic-modules HTTP routes, while generated modules are compiled into the binary through generated_registry.go and registered statically, so they reach Bootstrap → service.Migrate() → AutoMigrate regardless of that variable. That finding is now written into the deployment guide, because the next reader will make the same mistake. The exception itself is not prose but a three-column table — which table, who creates it, which switch governs it — so platform tables (system_*, platform_*) stay strictly migration-only and only runtime-schema business tables are covered, with the cost stated alongside the permission: generated tables gain columns but never lose or retype them, so dropping a column requires an explicit migration rather than a regenerate. Two candidate fixes were rejected on failure-mode grounds rather than effort: CREATE TABLE IF NOT EXISTS does nothing when the table exists, so a low-code schema that gains a field would leave the column missing and fail at runtime, which is strictly worse than AutoMigrate; and emitting a real migration from the generator, though architecturally better because it would be reviewable and roll-backable, requires hand-written DDL to match the GORM model column for column — time.Time is datetime(3) on MySQL, not the DATETIME in the type table, and index names and m2m junction ordering must match too — where any divergence breaks queries with no AutoMigrate left to repair it. That option is recorded as AUD-001c-ddl for a later version rather than dismissed. Two materials that would have made the exception unreadable were also corrected: the startup log previously said it was skipping module AutoMigrate while running bootstraps that perform exactly that, which would mislead anyone debugging a missing table, and MODULE_CONTRACT §4.3 still documented an interface without Migrate and claimed migrations were a future extension. The new test was negative-verified twice, and the first verification overturned my own comment: I had written that the existing tests would still pass if the bootstrap phase were deleted, and they do not — PhasedExecution fails too. The real gap is narrower, namely that the existing tests use a bespoke type implementing both methods and so cannot distinguish a complete module from a FuncModule that carries only a BootstrapFunc, which is the shape generated modules actually have; the comment now says that instead. What this review does not claim: generated tables still get their DDL from AutoMigrate at startup rather than from a numbered migration, so column changes ship silently with a binary upgrade and have no down migration, which is an accepted cost written into the guide rather than a solved problem; and only the base repository's guide was updated, so a downstream copy of the old sentence in pantheon-ops would still conflict with this exception.",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-11-01-audit-p2-automigrate-boundary/manifest.json",
    "evidence": ".harness/evidence/2026-11-01-audit-p2-automigrate-boundary/commands.json",
    "reviewFile": ".harness/evidence/2026-11-01-audit-p2-automigrate-boundary/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-10-31.md",
      "docs/DEPLOYMENT_GUIDE.md"
    ]
  }
}
```
