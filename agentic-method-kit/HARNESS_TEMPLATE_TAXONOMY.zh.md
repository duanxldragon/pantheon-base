# Harness 模板分类

English version: [HARNESS_TEMPLATE_TAXONOMY.md](./HARNESS_TEMPLATE_TAXONOMY.md)

本文定义可移植 harness template 分类。

Harness template 是面向常见仓库拓扑的 guides、sensors、gates、state conventions 和 bootstrap files 的版本化组合。Template 不应把仓库绑定到某个 agent 工具。

## 1. Template 原则

- Template 编码系统拓扑，不编码厂商偏好。
- Template 同时包含 feedforward guides 和 feedback sensors。
- Template 必须说明它调节什么、不调节什么。
- Template 应足够小，便于采用，再通过 overlay 扩展。
- Template 必须版本化且可升级。

## 2. Template 层

每个 template 有五层。

| Layer | Purpose |
|---|---|
| Entry | 简短仓库入口 guide 和阅读地图 |
| Contracts | 架构、领域、API、安全和验收规则 |
| Sensors | 测试、静态检查、smoke 和 review 规则 |
| State | Task packet、evidence、review 和 decision artifact |
| Adapter | 可选 runtime-specific 映射 |

只有 adapter 层是工具特定的。

## 3. 基础模板

### 3.1 Admin Platform Template

适用：

- 内部后台平台
- 模块化单体后台系统
- 有权限、菜单、审计、i18n 和配置治理的系统

默认 guides：

- platform/domain boundary map
- permission/menu/audit/i18n contracts
- UI state 和 design constraints
- page template rules

默认 sensors：

- auth、IAM、config、audit 后端测试
- 前端 typecheck/build
- menu 和 i18n contract checks
- 核心路由 browser smoke
- shell 和重复页面模式的 visual quality gate

高风险缺口：

- smoke 只查 render path 时，行为正确性可能不足
- 缺少用户旅程检查时，UI 治理可能过度规则化

### 3.2 API Service Template

适用：

- HTTP 或 RPC 服务
- 有稳定合同的服务边界
- 没有大 UI 表面的业务 API

默认 guides：

- API contract
- error semantics
- schema 和 migration rules
- observability requirements
- security 和 auth policy

默认 sensors：

- unit 和 integration tests
- contract tests
- schema migration checks
- static dependency rules
- key path 的 log/metric/trace checks

高风险缺口：

- 生成测试可能错过真实 consumer 行为
- backward compatibility 需要明确 contract fixtures

### 3.3 Event Processor Template

适用：

- worker
- queue consumer
- stream processor
- scheduled job

默认 guides：

- event schema contract
- idempotency policy
- retry 和 dead-letter policy
- observability rules
- operational runbook

默认 sensors：

- fixture-based event replay
- idempotency tests
- failure 和 retry tests
- latency 和 throughput checks
- log 和 trace checks

高风险缺口：

- happy path 测试可能漏掉 poison message
- backlog 和 retry storm 需要接近生产的运行态信号

### 3.4 Dashboard Template

适用：

- reporting dashboard
- analytics surface
- data-heavy operational view

默认 guides：

- data source contract
- metric definition dictionary
- freshness 和 latency rules
- chart 和 table design rules
- permission 和 data visibility policy

默认 sensors：

- query tests
- data fixture comparisons
- chart render smoke
- accessibility 和 responsive checks
- stale-data checks

高风险缺口：

- 图表渲染通过，不代表指标语义正确
- 数据新鲜度需要运行态可观测性

### 3.5 UI-Heavy Product Template

适用：

- 功能丰富的前端应用
- editor-like experience
- 主观质量和交互深度重要的工作流

默认 guides：

- product principles
- design quality criteria
- interaction contracts
- accessibility rules
- browser-supported workflow list

默认 sensors：

- Playwright 或等价 journey tests
- screenshot evidence
- 视觉和交互质量 evaluator review
- accessibility checks
- performance checks

高风险缺口：

- evaluator 判断需要校准
- 只看截图会漏掉交互质量

## 4. Overlays

Overlay 为基础 template 增加领域约束。

例子：

- Pantheon overlay：base/business 继承、platform/system/business 边界、drift checks
- 监管领域 overlay：审计保留、approval gates、evidence retention
- 高安全 overlay：更严格的 secrets、dependency、permission gates

Overlay 规则：

- overlay 不能静默重定义 base template
- overlay 必须声明新增 guides、sensors 和 gates
- base template 变更时，overlay 必须有升级路径

## 5. Template 选择

选择覆盖真实拓扑的最小 template。

决策参考：

| Repository shape | Starting template |
|---|---|
| 带 auth/IAM/menu/audit 的后台 | Admin Platform |
| 稳定 API 的 headless service | API Service |
| Worker 或 stream processor | Event Processor |
| 数据产品或报表 UI | Dashboard |
| 富交互前端 | UI-Heavy Product |
| 混合系统 | 选择 primary template 并叠加 overlay |

风险不需要时，不要从最严格 template 开始。

## 6. Template 健康度

定期 review 每个 template。

检查项：

- 入口 guide 是否仍然短？
- sensor 是否映射到已知失败模式？
- gate 是否防住真实缺陷，还是只拖慢变更？
- template 假设对当前模型和 runtime 是否仍然成立？
- 下游仓库是否偏离 template？
- template upgrade 是否容易应用？

输出应是版本化 template update，或明确保留当前版本的决策。
