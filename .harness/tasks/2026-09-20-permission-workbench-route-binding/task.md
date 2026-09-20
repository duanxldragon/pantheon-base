---
task_id: 2026-09-20-permission-workbench-route-binding
title: 权限工作台 API 权限映射收口（审计项 D）
created: 2026-09-20
status: in-progress
priority: P1
layer: system/iam
risk: high
---

# Task Packet — 2026-09-20-permission-workbench-route-binding

## 背景

`PANTHEON_BASE_DESIGN_SUPPLEMENT_AUDIT_20260910.md` §7.2 审计项 D（1.0 冻结前）：
`permission_workbench.go` 的 `requiredAPIRoutesByPermission` 手工维护
权限键 → API 路由映射（仅 12 条，全库约 200 条 route），建议改为从路由注册表派生。

## 实跑核实（比审计更进一步的事实）

逐条对照真实路由注册后发现**审计未捕捉的实际损害已发生**：
map 中 `system:user:create` 绑定的是 `POST /api/v1/system/user/create`，
而实际注册是 `systemProtected.POST("/user", ...)` 即 `POST /api/v1/system/user`。
由于权限工作台的「受控补齐」按此 map 生成 Casbin 策略，整改动作会创建指向
不存在路由的死策略，真实创建路由依旧 403——映射错误不只是覆盖面窄，而是
已经产生过一次错误指引。

## 方案取舍（为何不是「从 200 条 route 派生」）

审计建议的方向是正确的（单一真相源），但完整「从路由注册表派生」需要把
`gin.Engine` 的路由表在运行时导出给 permission 服务，引入 engine→service
依赖翻转（或全局注册表改造），改动面横跨全部模块注册函数，风险远超修复收益。

采用的最小收口：
1. **修正漂移条目**（`user/create` → `user`）。
2. **绑定表契约化**：注释写明治理契约（每条必须匹配真实注册路由；
   整改不得创建指向不存在路由的策略），导出只读访问器
   `RequiredAPIRoutesByPermission()`。
3. **漂移机械门禁**：`TestRequiredAPIRoutesExistOnEngine` 构建真实 gin
   engine（按活代码注册形状镜像受绑定表覆盖的 system/user、auth/security-event、
   lowcode/dynamic-modules、lowcode/generator 路由组），逐条断言绑定表条目
   存在于路由表；`TestRequiredAPIRouteProbeCoversEngineRoutes` 用哨兵路由
   防止探针自身腐化导致假绿。此后任何路由改名/改方法若不同步绑定表，CI 即红。

这把「12 条手工 map 无守护」升级为「绑定表受机械门禁守护、漂移即红灯」，
后续若做完整派生（engine 路由表导出），该测试即为现成的验收器。

## 边界

- 层级：system/iam（permission 子域）。高风险范围 → L2。
- 不触碰：Casbin 中间件、策略 CRUD/整改动作、前端、其他模块的路由注册。
- fixture 同步：两处测试 fixture 的 `user/create` 策略样本改为真实路由，
  pure test 的 join 断言同步。

## 验证集合（已执行）

| 验证 | 结果 |
|---|---|
| `go vet ./modules/system/iam/permission/` | clean |
| 新漂移守卫 + pure tests（无 DSN） | ok 0.038s |
| permission 包全量（DB-backed） | ok 7.9s |
| permission 包全量（无 DSN skip 路径） | ok 0.034s |
| 相邻域回归（iam menu/role/user、audit、contracts、middleware，DB-backed -short） | 全 ok |
| `gofmt -l` | clean |

## Human gate

- 权限工作台整改语义未变（仍是按绑定表受控补齐），无新权限面 → 无需新 gate；
  变更经 PR required checks + 非作者评审把关。

## 评审视角（Reviewer 检查点）

- [x] 是否只是把错误从一处搬到另一处？——漂移守卫使绑定表错误在 CI 可见，非搬运。
- [x] 探针引擎是否可能与真实注册脱节？——哨兵测试 + 注释要求同 patch 更新；完全
  防脱节需运行时派生（记录为后续方向，不在本任务）。
- [x] 已下发的死策略如何处理？——运行时修复属运维动作（删除 V1 不存在的 casbin 规则），
  Bootstrap 已有孤儿策略清理（按 role 存在性）；按路径存在性清理属后续 ratchet 候选。
