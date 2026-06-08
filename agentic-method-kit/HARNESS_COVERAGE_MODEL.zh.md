# Harness 覆盖模型

English version: [HARNESS_COVERAGE_MODEL.md](./HARNESS_COVERAGE_MODEL.md)

本文定义如何评估 harness 是否真正有用，而不仅是流程完整。

Task packet、evidence、review artifact 和检查脚本能证明工作流存在。覆盖分析要回答的是：这套工作流是否能抓住真正重要的失败模式。

## 1. 覆盖维度

从五个维度评估 harness 覆盖。

| 维度 | 问题 |
|---|---|
| Behaviour | 应用是否真的满足用户需要？ |
| Maintainability | 代码库是否仍然容易被人和 agent 修改？ |
| Architecture fitness | 边界、依赖和非功能要求是否保持稳定？ |
| Runtime quality | 日志、指标、trace、性能和可靠性是否对 agent 可见？ |
| Method health | Harness 自身是否一致、不过期、不过重？ |

## 2. 失败注册表

每个仓库都应维护或派生 failure registry。

最小字段：

```text
failure_id
category
example
impact
current_guide
current_sensor
current_gate
detected_by
missed_by
recommended_harness_change
status
```

注册表可以先用 Markdown 表格维护。必要时再升级成 JSON 或数据库。

## 3. Sensor 类型

### 3.1 Computational Sensors

这类 sensor 确定、通常便宜。

例子：

- 单元测试
- 类型检查
- lint
- 依赖扫描
- 结构测试
- 架构 import 规则
- 合同检查
- schema drift 检查

适用场景：

- 每次提交
- 本地内循环
- CI gate
- 重复出现的结构性失败

### 3.2 Inferential Sensors

这类 sensor 依赖模型判断或人工判断。

例子：

- agent review
- 设计批评
- 产品感 review
- 需要上下文的安全 review
- 架构 tradeoff review

适用场景：

- 语义重复
- 过度设计
- 产品行为差
- UI 质量
- tradeoff 不清
- 确定性测试不足以覆盖的行为 review

### 3.3 Runtime Sensors

这类 sensor 让 agent 能检查运行中的软件。

例子：

- 浏览器自动化
- 截图
- console error
- log
- metric
- trace
- synthetic journey

适用场景：

- UI 流程
- 性能
- 可靠性
- 事故复现
- 用户旅程验证

## 4. 覆盖矩阵

对每个重要失败模式，映射当前控制。

| Failure mode | Feedforward guide | Feedback sensor | Gate | Current gap |
|---|---|---|---|---|
| Agent 改错层级 | architecture contract | import rule 或 review | task packet layer field | 增加静态层级检查 |
| UI 太泛 | design principles | evaluator 或 screenshot review | visual gate | 校准 evaluator 样例 |
| 生成测试太弱 | testing guide | mutation 或 review | review gate | 增加 approved fixtures |
| 文档漂移 | doc ownership guide | doc drift scan | CI doc check | 增加定时 janitor task |

矩阵的价值不是追求大而全，而是看清哪些地方仍然只靠人工注意力。

## 5. Sensor 有效性

跟踪 sensor 是否真的有用。

有用信号：

- 人工 review 前抓住的缺陷数量
- false positive 数量
- 后续发现的 false negative 数量
- sensor 反馈后的平均修复时间
- 加 sensor 后重复失败是否下降
- 从未触发的 sensor

解释：

- sensor 从不触发，可能说明代码库健康。
- 也可能说明 sensor 太弱、太窄或运行阶段不对。
- false positive 很多的 sensor，应先作为 advisory 或继续收紧，再成为 gate。

## 6. 生命周期位置

把 sensor 放在成本和价值匹配的位置。

| 阶段 | 典型 sensors |
|---|---|
| 实现前 | architecture map、task packet、done criteria |
| 实现中 | typecheck、focused tests、lint、本地脚本 |
| PR 前 | 更广测试、smoke、evidence check、review |
| CI | 重跑快检查、集成检查、合同检查 |
| 定时 | drift scan、dead-code scan、dependency review、doc gardening |
| 运行态 | logs、metrics、traces、SLO checks、anomaly scans |

快速可靠的反馈应左移。昂贵或噪声大的 sensor 放到更后面。

## 7. Ratchet Loop

Harness 覆盖通过 ratchet loop 改进。

```text
observe failure
  -> classify failure
  -> decide guide/sensor/gate/template change
  -> implement the smallest useful control
  -> measure whether recurrence drops
  -> remove or downgrade controls that stop carrying weight
```

Ratchet 应防止重复错误，但不能把 harness 变成规则堆。

## 8. 最小覆盖复盘

定期或在重大模型/工具升级后运行这项复盘。

检查项：

- 哪些失败不止一次进入人工 review？
- 哪些失败只被 inferential sensor 抓住，能否下沉为确定性检查？
- 哪些确定性检查在当前阶段太慢？
- 哪些 guide 很长，但没有 sensor 支撑？
- 哪些 gate 经常阻塞，却没有防住真实缺陷？
- 哪些 harness 组件编码了当前模型可能已经不再需要的假设？
- 哪些运行态信号对 agent 不可见？

输出应是一小组 harness 改进，而不是大范围重写。
