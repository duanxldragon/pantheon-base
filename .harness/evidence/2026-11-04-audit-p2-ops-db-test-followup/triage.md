# PB-010 逐项裁定：Ops 既有真实 DB 测试失败

裁定日期：2026-11-05。范围：`pantheon-ops` 最终候选与 `1c057ee` HEAD 同环境复现的 9 个顶层用例 / 12 个失败节点（含 3 个子测试、4 个包级失败）。方法：对照 [comparison.json](./comparison.json) 原始断言，逐个读取测试与被测实现，判定责任在测试 fixture/期望、业务实现或合同。**本轮不改 Ops 主工作树、不改业务实现、不放宽 SSRF/鉴权**；修复登记为 Ops 独立任务。

## 结论总览

| 判定 | 顶层用例 | 失败节点 | 处理方 |
| --- | --- | --- | --- |
| 测试 fixture / 期望过期 | 8 | 11 | Ops 测试侧 |
| 业务实现缺口 | 1 | 1 | Ops 业务侧（需独立任务） |
| 合同本身有误 | 0 | 0 | — |

12 个节点不是 12 个独立故障：其中 3 个是 `TestBizScopeDeleteRejectsNonCMDBReferences` 的子测试，4 个是包级汇总。

## 逐项裁定

### 1. bizscope（2 用例 / 5 节点）— 测试 fixture 未接线能力

- `TestBizScopeDeleteRejectsNonCMDBReferences/{application,k8s_cluster,deploy_task}` 与父测试
- `TestBizScopeDeleteIgnoresSoftDeletedReferences`

实际断言：`expected business.bizscope.inUse ..., got business.cmdb.capability.notConfigured`。

根因：两个用例用 `NewService(db)`（`bizscope_service_test.go:404`、`:440`），未传 `ServiceDependencies`。`Delete` 先调用 `cmdbOwnership().WithBusinessScopeOwnershipLock`（`bizscope_service.go:307`）与 `cmdbHosts().HasBusinessScopeReferences`（`:315`），依赖为 nil 时桩返回 `business.cmdb.capability.notConfigured`（`:476-517`），根本走不到非 CMDB 引用计数。同文件已有现成接线 `newBizScopeServiceWithCMDB`（`:286`），其他用例均通过。

裁定：**fixture 过期**。修复 = 用例改用既有 helper；不涉及业务逻辑。

### 2. cmdb/host（1 用例 / 1 节点）— 业务实现缺口：新建主机无可用的 state_version

`TestHostStateTransitionsUseCompatibilityProjectionAndCAS`：期望 stale retire 被拒为 `cmdbhost.state.stale`，实际 `cmdbhost.state.invalid`。

根因链：`Host.StateVersion` 列默认 0（`host_model.go:26`），`Create` 不赋值（`host_service.go:161-182`）；`TransitionState` 在 `ExpectedStateVersion == 0` 时视为“不校验”（`host_state.go:52`、`:64-66`）。测试第二次 retire 传入 `created.StateVersion == 0`，CAS 被跳过，于 assigned 主机上先命中状态机拒绝（`host_state.go:104-109`）返回 `state.invalid`。assign 后 `state_version` 才变为 1。

合同依据：`pantheon-ops/docs/designs/BUSINESS_FUNCTIONAL_DESIGN.md:84` 明确 CMDB 主机生命周期使用 `state_version` 乐观锁。新建主机版本为 0 且 0 等于“不校验”，意味着客户端创建后无法做 CAS，乐观锁在最需要的创建窗口失效。

裁定：**业务实现缺口**，不是测试错误，也不应改测试期望。最小修复（Ops 独立任务）：创建时写 `state_version = 1`（或把 0 定义为非法版本并在 DTO 中暴露）。风险：其他读路径若依赖 0 需同步，改动小且可用现有 host 包回归覆盖。

### 3. deploy（4 用例 / 4 节点）— 3 个测试期望过期、1 个 fixture 未跟随租约机制

**3.1 `TestMarkHostResultDefersTerminalTaskUntilActiveAttemptFinishes`（`load task host: record not found`）**

`CreateTask` 只落 `biz_deploy_task`（`deploy_service.go:464-506`、`buildCreateTask:595-647`）；`biz_deploy_task_host` 与租约在启动认领事务中创建（`claim` `:1176-1198`，`createTaskHostRow:1202-1225`）。用例在 `CreateTask` 后立即查询任务主机（`deploy_reliability_test.go:55`）。

裁定：**fixture 过期**（先于认领式建行）。修复 = 用例先 StartTask 或显式种入 host/attempt 行，再断言延迟终态语义。

**3.2 `TestStartDeployTaskPersistsCanonicalSSHRunnerErrors`（`start task: business.deploy.task.sshConnectFailed`）**

`StartTask` 对派发错误直接返回（`deploy_service.go:1106-1108`），而合同把 `business.deploy.task.sshConnectFailed` 列为 Start 的关键错误（`pantheon-ops/docs/designs/BUSINESS_DEPLOY_MODULE_DESIGN.md:491`）。用例断言 `err == nil` 且主机错误已持久化（`deploy_service_test.go:1073-1085`）。

裁定：**期望过期**。修复 = 断言返回规范错误，再读取持久化的 host 失败状态，两件事都覆盖。

**3.3 `TestDeployTemplateTaskSSHExecutorFailsOnScriptPrecheck`**

同一根因：返回错误文本已包含 `precheck failed`（`deploy_service_test.go:2265-2269`），用例却先 `t.Fatalf("start task: %v")`。

裁定：**期望过期**。修复 = 接受返回错误并继续校验 host 失败、脚本只执行 precheck、`step_failed` trace。

**3.4 `TestDeleteDeployTaskReconcilesStaleRunningTask`（`invalidDeleteState`）**

启动认领会通过 `createTaskHostRow → acquireHostLease` 写入未过期租约（`deploy_service.go:1202-1205`）；`DeleteTask` 的陈旧任务回收要求 active attempts 与未过期 leases 同时为 0（`:1006-1029`），否则按运行中保护拒绝。用例只把 `deploy_task.updated_at` 改到 6 分钟前（`deploy_service_test.go:2968-2973`），租约仍有效。

裁定：**fixture 未跟随租约机制**，删除保护是正确行为。修复 = 用例先将 attempt/leases 置为过期（或删除），再验证回收+删除。

### 4. observability（2 用例 / 2 节点）— fixture 与现行 SSRF 策略冲突，不放宽策略

`TestDatasourceDefaultCanMoveAndClear`、`TestDatasourceQueriesLokiAndTempo`：`observability.datasource_invalid_url: ssrf: port <fixture> not allowed`。

数据源服务用 `ssrf.DefaultValidator()` 并限定端口 {80,443,8080,9090,3000,3100,16686}（`datasource_service.go:30-34`），`Update` 校验（`:137-143`），查询/连接路径同样校验（`:430-433`）。fixture 使用 `http://127.0.0.1:1`（`datasource_service_test.go:20-21`）和 httptest 随机端口（`:134`），必然被拒。

裁定：**fixture 与策略冲突**。不得为变绿放宽 SSRF 端口（审计已明确）。用例与服务同包，可在用例内注入仅允许本地测试端点的 validator；同时把“数据源是否应允许自定义内部端口/私网地址”登记为维护者策略问题（当前允许清单会阻止指向 3100/9090 以外端口的真实 Prometheus/Loki），**不在本轮修改**。

## 需要 Ops 独立任务承接的修复清单

1. 测试侧（8 用例 / 11 节点）：bizscope 两用例改 `newBizScopeServiceWithCMDB`；deploy 3 个期望对齐“Start 返回规范错误 + 持久化失败”；deploy 陈旧删除用例先过期租约；observability 两用例注入测试 validator。
2. 业务侧（1 用例 / 1 节点）：host 创建初始化 `state_version`，保持 CAS 语义与合同一致。
3. 策略裁定（维护者）：observability 端口/私网允许范围是否按部署形态可配置。

做完 1、2 后必须在独立 Ops 任务里以真实隔离 MySQL/Redis 重跑 `./modules/business/...`，通过后才关闭 PB-010 与下游验收。本轮维持 `failed-pre-existing`，不把裁定写成修复完成，也不把构建/前端通过替代业务门禁。
