# 方法优先交付策略

English version: [METHOD_FIRST_DELIVERY_POLICY.md](./METHOD_FIRST_DELIVERY_POLICY.md)

本文防止 agentic work 在操作方法还没清楚前，就陷入代码报错和零散修复。

它适用于所有采用 Agentic Method Kit 的仓库。消费方仓库可以加更严格的规则，但不应弱化这个生命周期顺序。

## 1. 原则

非 trivial 工作先完善方法和流程，再修改生产代码。

默认顺序：

```text
method boundary
  -> task intake
  -> quality profile
  -> verification strategy
  -> review and ratchet plan
  -> workflow or sensor design
  -> code implementation
  -> evidence and closeout
```

代码修改放在最后，因为代码级失败经常只是任务边界不清、profile 缺失、verification 放错位置或 ratchet 决策缺失的症状。

## 2. 适用范围

当工作触碰以下内容时，适用本策略：

- 架构边界
- CI 或质量门禁
- 安全、权限、schema、数据完整性或发布流程
- 用户可见 UI 或运行时行为
- 跨仓继承或下游消费行为
- 之前 task、PR、session 或 agent 已经重复出现的失败

Trivial 工作只有在仓库 triviality policy 允许，且没有触碰风险边界时，才可以跳过完整方法优先流程。

## 3. 方法就绪条件

生产代码修改前，任务应具备：

- 清晰 owner layer：portable method、consumer template、consumer repository、agent adapter 或 no-action
- task packet 或等价任务边界 artifact
- 已选择 quality profile，或显式写 `none`
- 已知 contract anchors
- required sensors 和 evidence
- human gates，或显式写 `none`
- repeated failure 的 ratchet decision

如果任一项缺失，下一步应是澄清方法和流程，而不是编辑代码。

## 4. 先定位 Sensor，再实现 Sensor

不要在 lifecycle placement 清楚前新增 checker、test、smoke 或 CI gate。

先回答：

| 问题 | 必须回答 |
|---|---|
| 它捕获什么 failure？ | failure class 和 example |
| 它应该在哪运行？ | local、PR、scheduled、release、runtime、review |
| 它是 deterministic 还是 inferential？ | sensor type |
| false positive 风险多高？ | low、medium、high |
| 失败后发生什么？ | advisory、required gate、human review |
| 谁拥有它？ | portable method、consumer template、consumer repository、agent adapter |

慢或噪音高的 sensor 应先放 advisory 或 scheduled，直到证明有价值。

## 5. 先 Ratchet，再 Patch

当 failure 复发时，不要马上再次补代码。

先回答：

```text
这是 guide 缺失吗？
这是 task boundary 缺失吗？
这是 sensor 缺失或位置错误吗？
这是 gate 过载吗？
这是 handoff 时 agent adapter 丢失信息吗？
修复应该落在 portable method、consumer template、consumer repository，还是 agent adapter？
```

分类完成后，才进入实现。

## 6. 代码后置规则

如果方法/流程改进任务中发现生产代码已经失败，除非它阻塞方法验证，否则记录为 deferred。

Deferred code work 应包含：

- symptom
- suspected owner layer
- recommended profile
- required verification
- 是否需要新 task packet

这能防止方法工作被偶发 build、lint、smoke 或依赖失败吞掉。

## 7. 完成标准

方法优先任务完成时，应满足：

- lifecycle order 已文档化
- task intake 和 profile 要求清楚
- repeated failure 有 owner layer 和 ratchet decision
- code-level follow-up 不需要，或已记录为 deferred backlog
- verification evidence 覆盖方法/流程 artifact，而不是无关生产代码

除非实际运行了生产代码验证，否则不要声称生产代码质量已提升。
