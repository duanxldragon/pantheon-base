# 跨 Agent Ratchet 模型

English version: [CROSS_AGENT_RATCHET_MODEL.md](./CROSS_AGENT_RATCHET_MODEL.md)

本文定义 Harness Engineering 如何把重复出现的 AI agent 失败，沉淀成跨工具、跨 agent、跨产品仓库复用的方法资产。

这个模型不绑定任何具体 coding agent、runtime、CI 平台或业务架构。产品仓库是方法消费者，不是方法事实源。

## 1. 可移植边界

Harness 资产分为两类。

| 类型 | 存放位置 | 目的 | 示例 |
|---|---|---|---|
| 可移植方法资产 | `agentic-method-kit/` | 跨 agent、跨仓库复用 | task packet schema、evidence schema、ratchet 规则、review artifact 格式、adapter contract |
| 消费方 overlay | 产品仓库 | 项目架构和质量控制 | admin-platform quality profile、权限策略测试、i18n hardcode 检查、smoke 路由 |

规则：

- 只有当 failure pattern 能在无关仓库或多个 agent runtime 中复发时，才应进入 portable method。
- 如果 failure pattern 依赖产品架构、领域合同、仓库布局或业务流程，应留在 consumer overlay。
- Portable 文档可以包含消费方示例，但必须标明只是示例，不能变成通用要求。

## 2. Failure Identity

任何重复失败在新增规则前，都应先有稳定身份。

最小字段：

```text
failure_id
failure_class
agent_runtime
repository
task_profile
trigger
missed_by
detected_by
recommended_promotion
owner_layer
```

推荐 `failure_class`：

- `instruction-gap`
- `task-boundary-gap`
- `architecture-drift`
- `test-gap`
- `static-sensor-gap`
- `runtime-evidence-gap`
- `security-boundary-gap`
- `ci-signal-noise`
- `method-health-gap`

`owner_layer` 必须是：

- `portable-method`
- `consumer-template`
- `consumer-repository`
- `agent-adapter`
- `no-action`

## 3. Promotion Ladder

使用能阻止复发的最小控制。

```text
observe repeated failure
  -> classify identity
  -> decide owner layer
  -> promote to guide, sensor, gate, template, adapter, or no-action
  -> measure recurrence
  -> retire or downgrade stale controls
```

升级规则：

- 第一次出现：记录到 evidence、review 或 closeout。
- 第二次出现：更新 guide、task packet profile、review checklist 或 template。
- 第三次出现：优先补 deterministic sensor。
- 高风险出现：涉及安全、权限、schema、数据完整性、发布安全或跨仓继承时，可以直接升级为 gate。

不要把产品特定规则提升到 portable method，除非满足至少一个条件：

- 适用于多个 repository template。
- 适用于多个 agent runtime。
- 描述的是通用生命周期控制，而不是产品约定。
- 能防止 handoff、review、resume 时的上下文丢失。

## 4. 多 Agent 兼容

Harness 必须能承受 agent 切换。Agent 特性只是 adapter。

Adapter 职责：

- 把 task packet 转成 agent 专用 prompt 或 workflow 时，不丢字段。
- 保留 evidence 和 review artifact 位置。
- 不支持的能力要显式记录，不能静默丢失。
- 把 planner、generator、evaluator、reviewer、janitor 映射到具体 runtime。
- 当 runtime 无法机械执行 human gate 时，仍要让 human gate 可见。

Portable method 不能依赖某一个 agent 的私有能力。如果控制项依赖 browser automation、subagents、CodeGraph 或 MCP tools，方法必须定义 fallback evidence。

## 5. 多业务系统兼容

消费方仓库应定义自己的 quality profile，同时继承 portable controls。

示例 overlay 类型：

- `admin-platform`
- `api-service`
- `event-processor`
- `dashboard`
- `ui-heavy-product`
- `custom`

每个 overlay 应定义：

```text
quality_profile
contract_anchors
required_sensors
optional_sensors
human_gates
runtime_evidence
promotion_target
```

产品特定示例应留在消费仓库。例如 admin platform 可能要求 permission-policy 测试，而 event processor 可能要求幂等和 replay 测试。两者继承同一个 ratchet 生命周期、evidence 格式和 review loop。

## 6. 最小采用合同

采用本方法的仓库至少应提供：

- repo-local failure registry
- task packet 或等价任务边界 artifact
- evidence 位置约定
- review artifact 约定
- 至少一个快速 deterministic inner-loop sensor
- 一条 ratchet 规则，把 repeated failure 转成 guide、sensor、gate、template、adapter 或 no-action 决策

这是可复用部分。业务特定检查不是。

## 7. 成效指标

跨仓库跟踪：

- promotion 后 repeated failure 复发率
- repeated failure 中有 owner layer 的比例
- promoted failure 中变成 deterministic sensor 的比例
- sensor false positive / false negative
- 从 failure observation 到 promotion 的中位时间
- 使用同一 task packet 和 evidence artifact 的 agent handoff 成功率
- 被错误提升到 portable method 的 consumer-specific control 数量

当新仓库能继承生命周期和 artifact 形状，而不会继承无关业务假设时，方法才是健康的。
