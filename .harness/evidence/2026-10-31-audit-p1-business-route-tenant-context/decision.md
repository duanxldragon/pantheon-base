# 业务域租户语义决策（AUD-002）

- **任务包**：`2026-10-31-audit-p1-business-route-tenant-context`
- **决策日期**：2026-10-31
- **决策人**：维护者（本会话明确选择方案 C）
- **结论**：**方案 C——显式声明"业务域在 V1 内不参与租户隔离"，并把代码、合同、README 三处口径统一**

---

## 1. 决策前的事实

| 事实 | 读数 |
|---|---|
| `ProtectedGroup` / `DataScopedGroup` 的中间件链 | `TokenAuth → Casbin`（`DataScopedGroup` 再追加 `DataScope`），**无租户中间件** |
| base 内生产代码调用点 | **0** |
| 下游 `pantheon-ops` 调用点 | **14**（13 × `DataScopedGroup` + 1 × `ProtectedGroup`） |
| 下游业务域 `TenantID` 命中 | **0** |
| 下游业务域 `tenant_id` 命中 | **1**，且是 `retired_modules_test.go:110` 的 DDL 测试夹具，非模型字段 |
| `tenant.FromGin` 无上下文时 | 返回 `nil` |
| `tenant.WithTenantScope(nil)` | 原样返回查询，不过滤 |
| 生成器对 `tenant` 数据域 | `internal/scaffold/contract.go:74` 明确 `"tenant" is intentionally rejected` |
| 入口文档 | `README.md:31` 宣称"完整数据隔离" |

**注意**：审计报告曾写"下游 25 处调用"。本次执行逐条列出后确认是 **14**——25 把 `pkg/contracts/route_groups.go` 副本里的 3 行定义和文档提及一起计入了。数字已更正，结论不变。

## 2. 三方案与被选理由

| 方案 | 做法 | 代价 | 结论 |
|---|---|---|---|
| A | 给助手挂 `PlatformScopeTenantContextMiddleware` | 业务表**没有 `tenant_id` 可过滤**，挂中间件只会在 multi 模式下把所有业务请求变成 `TENANT_CONTEXT_MISSING`；等于把静默问题升级为显式故障 | 否 |
| B | 删除助手，业务模块显式声明作用域 | 需要 ops 14 处同批改写 + foundation release + 弃用期；收益仅是"少一个便利函数" | 否 |
| C | 合同增补"业务域不参与租户隔离"，代码注释与 README 对齐 | 缩小对外承诺范围（README 从"完整隔离"改为"系统域隔离、业务域单租户"） | **采纳** |

**为什么 C 是唯一诚实且低成本的选项**：业务域从来没有租户建模——这不是"隔离没做好"，而是"从来没打算做"。把它写成条款，是把既有事实显性化，运行行为零变化；A 会产生真实故障，B 会为消除一个便利函数付出双仓改造成本，而两者都要动 14 个下游调用点。

## 3. 落地内容

| 文件 | 改动 |
|---|---|
| `docs/contracts/TENANT_CONTRACT_V1.md` | 新增 **§2.6 业务域租户语义**（结论、四条事实、§3.2 不适用的理由、禁止宣称、V2 四项前置条件、回归锚点）；§1 Out 登记该边界；§7 表格"业务资源租户归属"改为 V1 不适用；§9 追加 V1.10（性质：Clarification）；`updated_at` → 2026-10-31 |
| `docs/contracts/TENANT_CONTRACT_V1.en.md` | 同步上述四处；补一条翻译注记（V1.7–V1.9 变更记录仅存于中文版） |
| `backend/pkg/contracts/route_groups.go` | 三个导出函数补文档注释：说明**不挂租户中间件是合同要求**，并明确"不要用追加 `TenantContextMiddleware` 的方式修它"及其后果 |
| `backend/pkg/contracts/route_groups_test.go`（新增） | 结构断言中间件链：长度 + 顺序 + **不含租户中间件**；作为该条款唯一的机械保障 |
| `docs/designs/MODULE_CONTRACT.md` §10 | 业务模块接入契约新增两条：不参与租户隔离；不得在业务域宣称租户隔离 |
| `README.md:31` | "完整数据隔离" → 系统域隔离 + 业务域单租户语义（附合同链接）；同句"配额强制" → 配额度量与展示（超限不拒绝写入） |

## 4. 为什么把 README 也放在本包改

任务包原设计是"W2 定语义、W3 写文档"，但 README:31 那一行**同时**含两处失实（租户隔离、配额强制），而租户隔离正是本包的结论。如果 W2 只改合同、W3 再改 README，同一行会被编辑两次，且中间态是"合同说单租户、README 说完整隔离"——比不改更糟。因此本包整行改完，并在 W3 任务文档里把该行标记为"已由 W2 处置"，W3 只保留版本表、CONTRIBUTING 声明、`docs/README` 构建步骤等其余项。

## 5. 为什么测试要断言"不含租户中间件"

方案 C 的最大风险不是"改错"，而是"下一个人觉得这里漏了租户，好心补上"。这种改动看起来像修 bug，实际会造成 multi 模式下业务域全量 500。因此把"不含"写成断言：任何追加都会让测试先红，并给出指向 §2.6 的失败信息。该测试已做负向验证（注入中间件 → 如期 FAIL → 还原 → PASS）。

## 6. 未做什么

- 未改 `pkg/tenant` 解析优先级、未改 `TenantContextMiddleware` / `PlatformScopeTenantContextMiddleware`。
- 未改 `DataScopeMiddleware` 的 fail-closed 行为。
- 未给业务表加 `tenant_id`，未新增迁移（属 V2，四项前置条件已写进合同）。
- 未改 `pantheon-ops`（14 处调用点无需改动：语义只是被写清楚，行为不变）。
- 未动 `DESIGN.md` 的租户章（AUD-004，归 W3；当前 DESIGN 第 375 行的表述与方案 C 一致，不冲突）。

## 7. 残留

- `docs/designs/TENANT_RESOURCE_SCOPE_MATRIX.md` §3 唯一键表里有一行 `biz_*`「新增时逐表登记 / 按评审」。
  **它不是现状登记，是 V2 的预留入口**——§2 的 scope 表里没有任何业务表条目。合同 §2.6 已按这个准确表述写
  （初稿曾写成"矩阵只登记系统域表"，核对矩阵原文后更正）。矩阵里补一句"预留入口 / 当前为空"归 W5
  （AUD-009 同轮处理），已写进 W5 任务文档。
- 下游 `pantheon-ops` 若在自己的 README 里宣称租户隔离，需在 ops 仓单独修（本包不改 ops）。
