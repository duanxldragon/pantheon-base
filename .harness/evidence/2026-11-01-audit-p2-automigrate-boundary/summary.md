# Summary — 2026-11-01-audit-p2-automigrate-boundary

AUD-001c 是 W1 留下的 P2，审计对它的要求是"冻结前择一"。本包做完了这个"择"。

---

## 冲突到底是什么

`docs/DEPLOYMENT_GUIDE.md` 原文只有一句：

> 默认启动路径使用 migrations。仅开发环境可使用 `PANTHEON_AUTO_MIGRATE=true`；生产环境不得启用 GORM AutoMigrate。

而装配器的真实行为（`backend/pkg/contracts/module.go`）是：

| `PANTHEON_AUTO_MIGRATE` | 跑 `Migrate()` | 跑 `Bootstrap()` |
| --- | --- | --- |
| `true`（仅开发） | 是 | 否 |
| 未设 / `false`（默认、生产） | **否** | **是** |

生成业务模块的 `BootstrapFunc` 就是 `service.Migrate()`，而 `Migrate()` 内部是
`s.db.AutoMigrate(&Model{})`。也就是说：**生产不设 `PANTHEON_AUTO_MIGRATE`，生成业务表照样被
AutoMigrate 创建**。文档那句"不得启用"在默认路径下就已经被违反了。

---

## 差点被一个环境变量骗过去

第一反应是：`PANTHEON_ENABLE_DYNAMIC_MODULES` 生产固定 `false`，那不就没事了？

查了才清楚它不是这个作用域：

- `dynamicModuleEnabled()` 默认值是 `!IsProductionEnv()`——生产默认关，这是真的；
- 但 `DynamicModuleEnvGuard` 只挂在 `/lowcode/dynamic-modules/*` 这组 **HTTP 路由**上；
- 而生成模块是通过 `backend/modules/business/generated_registry.go` **编译进二进制**的，
  由 `InitGeneratedBusinessModules` 静态注册，根本不经过那组路由。

所以生产关掉动态模块，只挡住了"运行时通过 HTTP 注册"这条路；**编译进来的生成模块照样建表**。
冲突是真实的。这条辨析写进了文档，因为下一个人会踩同一个坑。

---

## 三个选项，为什么选第一个

| 选项 | 结论 | 判据 |
| --- | --- | --- |
| **文档加例外** | **采纳** | 唯一不改变运行时行为的选项；把代价显式写进文档即可 |
| 显式 `CREATE TABLE IF NOT EXISTS` | 拒绝 | 表已存在时它什么都不做。低代码 schema 加字段后重新生成模块，表**不会补列**，运行时报"列不存在"；`AutoMigrate` 会补。这是用"更弱的建表能力"换"更严格的文档措辞"，把文档问题转成运行时问题 |
| 生成器产出迁移文件 | 拒绝，记录待重估 | 生成器已有 `TYPE_MAPPING[].sql` / `getSQLType()`，技术上可行。但要逐列与 GORM 模型对齐：`time.Time` 在 MySQL 上是 `datetime(3)` 而不是映射表里写的 `DATETIME`；索引命名、m2m 关联表的主键与列顺序也要一致。**一旦不一致，查询直接失败，而那时已经没有 AutoMigrate 兜底**。冻结前不该引入这一类风险 |

第三个选项在原理上更好（可审查、可回滚），这一点不否认。拒绝它的理由不是"它不对"，而是
"它的失败模式比现状更糟，且工作量落在冻结前最不该承担的位置"。这个判断被登记为
`AUD-001c-ddl`（P3，待重估），而不是被说成"不需要做"。

---

## 例外被写成了什么形状

不是"低代码例外"这种一句话，而是一张可以逐条核对的表：

| 表 | 由谁创建 | 受 `PANTHEON_AUTO_MIGRATE` 控制 |
| --- | --- | --- |
| 平台表（`system_*` / `platform_*`） | 版本化迁移 | 是（生产恒 false，只走迁移） |
| 低代码生成的业务表及其关联表 | 生成模块的 `Migrate()`，经 `BootstrapFunc` 在启动时执行，内部为 `AutoMigrate` | **否**（始终 AutoMigrate） |

外加两点操作后果，因为例外不是免费的：

1. 应用账号需要建表/改表权限，启动日志会显示 `runtime bootstraps still run`——**这是预期行为，不是漏配**；
2. 生成表的列**只增不减**：`AutoMigrate` 从不删列、不改列类型。需要删列或改类型时必须另写显式迁移。

第 2 点是这个例外真正的代价，必须写在文档里，否则运维会以为"改 schema 就是重新生成一下"。

---

## 顺带修掉的两处"会让人读错这条规则"的材料

**1. 启动日志说的是反话。**

原句：`versioned migrations mode: skipping module AutoMigrate and running runtime bootstraps`

它先说"跳过 AutoMigrate"，紧接着去跑**会自动建表**的 bootstrap。排障时读到这句，会得出
"启动期没有任何 AutoMigrate"的错误结论。改为：

```
versioned migrations mode: module Migrate() skipped, runtime bootstraps run instead
note="generated business modules create their own tables via AutoMigrate inside Bootstrap; see docs/DEPLOYMENT_GUIDE.md §3"
```

日志是运维读取面，改它不是修饰。

**2. `MODULE_CONTRACT` §4.3 的接口清单是旧的。**

它列 `BackendModule` 时漏了 `Migrate`，下面还写着"如果后续需要数据库迁移，再扩展"——
而迁移早已落地，且 `FuncModule.BootstrapFunc` 根本不在文档里。模块作者从契约里读不到
"生产路径为什么会建表"。已补 `Migrate` 进接口、加执行时机表、说明 `BootstrapFunc` 的用途与边界。

---

## 新增的锁，以及它初版写错了什么

`TestRegisterBackendModules_DefaultModeRunsBootstrapForGeneratedModules`：只有 `BootstrapFunc` 的
模块仍被 bootstrap，只有 `MigrateFunc` 的模块不被 migrate。

**初版注释写错了。** 我当时写的是"既有用例基于同时实现两个方法的类型，所以删掉 bootstrap 阶段
它们仍会通过"。负向 B 一跑就推翻了：`PhasedExecution` 也会红。

真实的缺口是另一件事：既有用例用的是自定义类型，无法区分"模块完整所以 bootstrap 跑了"与
"只有 `BootstrapFunc` 也会 bootstrap"——而后者正是 `FuncModule` 与生成模块的形状。
负向 A（把 `FuncModule.Bootstrap` 改成要求 `MigrateFunc` 非空）能单独打红新用例、另两个保持绿，
这才是它的独立价值。注释已按实测改写。

> 教训与 W6 那次同源：**命令能跑通不等于结论成立**。断言写下去之后必须反向验一次，
> 否则注释里的因果就是猜的。

---

## 留下了什么

| ID | 级别 | 内容 |
| --- | --- | --- |
| `AUD-001c-ddl` | P3 | 生成业务表的 DDL 不在迁移链里，列变更随二进制升级静默生效、无 down 迁移。根治需生成器产出迁移，风险见上表 |
| `AUD-001c-ops-doc` | P3 | 下游 `pantheon-ops` 的部署手册若抄过旧表述，会在其仓内与本例外冲突（按约定不改 ops） |

两条都不阻断冻结，且都不是"没做完"，是"做完之后仍然存在的已知代价"。
