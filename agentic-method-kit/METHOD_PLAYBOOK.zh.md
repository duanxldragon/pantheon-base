# Method Playbook

English version: [METHOD_PLAYBOOK.md](./METHOD_PLAYBOOK.md)

这份 playbook 用来把一组工具收敛成一套统一的方法。

先阅读这些方法基础：

1. [HARNESS_CORE_MODEL.zh.md](./HARNESS_CORE_MODEL.zh.md)
2. [CONTEXT_ENGINEERING_PROTOCOL.zh.md](./CONTEXT_ENGINEERING_PROTOCOL.zh.md)
3. [METHOD_FIRST_DELIVERY_POLICY.zh.md](./METHOD_FIRST_DELIVERY_POLICY.zh.md)
4. [MINIMAL_COMPLEXITY_LADDER.zh.md](./MINIMAL_COMPLEXITY_LADDER.zh.md)
5. [HARNESS_COVERAGE_MODEL.zh.md](./HARNESS_COVERAGE_MODEL.zh.md)
6. [CROSS_AGENT_RATCHET_MODEL.zh.md](./CROSS_AGENT_RATCHET_MODEL.zh.md)
7. [DESIGN_DEV_QA_GITHUB_GOVERNANCE.zh.md](./DESIGN_DEV_QA_GITHUB_GOVERNANCE.zh.md)
8. [HARNESS_TEMPLATE_TAXONOMY.zh.md](./HARNESS_TEMPLATE_TAXONOMY.zh.md)
9. [TOOL_ADAPTER_MATRIX.zh.md](./TOOL_ADAPTER_MATRIX.zh.md)

## 默认技术栈

- 变更管理层：change identity、proposal、design、tasks、archive
- 计划/执行层：brainstorming、planning、execution、debugging、verification
- UI 质量层：视觉、交互、可访问性和状态质量门
- 浏览器/运行态证据层：浏览器 evidence、QA、可观测性、review
- 本地 harness checks：task packet、evidence、adoption

## 默认工作流

默认工作流是方法优先。非 trivial 工作在 intake、profile、verification、review 和 ratchet plan 清楚前，不应开始生产代码修改。

### 0. 协同协议

每个非 trivial 任务先建立轻量协同协议，避免人、planner、executor、reviewer 之间反复丢上下文。

- 明确 human 要回答的问题：目标、不可接受风险、验收口径、必须停下来的 high-impact gate。
- 明确 agent 要承担的搬运工作：读取仓库事实源、整理 task packet、执行命令、保存 evidence、把 review 结果转成可决策摘要。
- 明确 stop points：缺少权限、需要生产/外部系统操作、要删除或迁移数据、要扩大 scope、验证证据不足或 reviewer 与 implementer 结论冲突。
- 明确 handoff artifact：task packet、evidence directory、review artifact 和 decision log 必须互相链接。
- 明确轻量路径：trivial 或 L0/L1 任务可以不建完整闭环，但仍要写清 scope、验证和 known gaps。

### 0.1 最小复杂度

实现前应用 [MINIMAL_COMPLEXITY_LADDER.zh.md](./MINIMAL_COMPLEXITY_LADDER.zh.md)：

- 记录能满足任务的最高 rung：跳过、复用、标准库、平台原生、已安装依赖、一条局部表达式，或最小新增代码。
- 新抽象或新依赖之前，优先删除、复用、标准库、平台原生能力和既有依赖。
- 信任边界校验、鉴权、审计、可访问性、i18n、运行态证据和用户明确要求，不属于简化目标。
- 非 trivial 逻辑应留下最小可运行检查，确保行为退化时会失败。
- 如果简化方案有已知上限，用 `minimal-complexity:` 注释或等价 debt ledger 条目记录触发条件。

### 0.2 执行护栏

实现前应用 [EXECUTION_GUARDRAILS.zh.md](./EXECUTION_GUARDRAILS.zh.md)：

- 存在歧义时，先写出已确认事实、工作假设和未决问题。
- 引入新抽象或新依赖前，先记录最小可行方案。
- 编辑前先收紧预期 diff，避免顺手扩大改动面。
- 写代码前先把“完成”翻译成可观察的成功信号。

### 0.3 Context Strategy

实现前应用 [CONTEXT_ENGINEERING_PROTOCOL.zh.md](./CONTEXT_ENGINEERING_PROTOCOL.zh.md)：

- 先决定这次任务真正受哪些入口源约束，不要大范围回放历史
- 优先按 `entry -> summary -> raw` 顺序取回上下文，而不是先开原始日志
- 如果任务携带敏感或不可留存输入，在保存 evidence 前先写清脱敏或 local-only 处理规则
- 如果 runtime 支持 checkpoint 或 rewind，可用于可逆探索；选定路径后要写回 repo state

### 1. Intake

- 判断当前工作是 `trivial` 还是 `non-trivial`
- 如果仓库提供 triviality policy，按该策略判断；否则默认按 `non-trivial`
- 如果是 non-trivial，先创建或选择一个变更身份，例如 OpenSpec change
- 选择最小适用的 harness template 或 overlay
- 判断当前任务是方法/流程工作，还是生产代码工作。方法/流程工作中发现的代码级失败，除非阻塞方法验证，否则应记录为 deferred backlog。

### 2. Design

- 使用结构化 brainstorming 或设计工作流
- 产出 design / spec 结果
- 明确 scope 边界
- 应用 [DESIGN_DEV_QA_GITHUB_GOVERNANCE.zh.md](./DESIGN_DEV_QA_GITHUB_GOVERNANCE.zh.md) 中的 Design Gate；小任务可以只写一段边界说明，不需要大型文档

### 3. Planning

- 使用结构化 planning 工作流
- 产出可执行的具体实现计划

### 4. Task Packet

- 根据 plan 创建 task packet
- 选择 quality profile，或显式写 `none`
- 当任务处理 repeated failure 时，记录 portable failure class 和 ratchet decision
- 除非任务确实 trivial，否则补上 `Assumptions and Open Questions`、`Minimum Viable Approach` 和 `Success Criteria` 三段短内容
- 对长任务、高上下文任务、跨 session 任务或涉及敏感信息的任务，补一个简短 `Context Strategy` section，显式说明检索顺序和隐私边界
- 填写 linkage 字段：
  - task id
  - openspec change
  - evidence directory
  - review file
- 对 `non-trivial`、跨层、runtime-sensitive、权限/菜单/i18n/审计/生成器/动态模块相关任务，记录最小 `Structural Scope`：
  - affected subgraph
  - boundary crossings
  - risk nodes
  - graph focus
- 如果仓库合同要求，还要记录实现者视角、评审者视角和 stop points

### 5. Implementation

- 只有方法就绪条件清楚后才开始实现；如果方法就绪条件缺失，回到 intake 或 task packet refinement
- 按 plan 进行纪律化执行
- 如果进入调试，转入 `systematic-debugging`
- 把实现视为 generator loop，而不是 approval 本身
- 保持 diff 外科式收敛；如果某个文件无法被 scope、verification 或 evidence closure 正当化，就不要修改它
- 如果仓库已启用 CodeGraph，用图谱把改动约束在受影响子图；不要为小改维护全仓图

### 6. UI Quality

- 如果触碰 UI，运行仓库定义的 UI quality gate
- 如果浏览器路径重要，采集浏览器或运行态 evidence
- 没有专职 QA 时，把 UI、browser、runtime 或 human acceptance evidence 作为 QA Acceptance Gate

### 7. Evidence

- 把命令结果保存到 `.harness/evidence/<task-id>/commands.json`
- 把人类可读摘要保存到 `summary.md`
- 把 review 输出保存到 `review.md`
- `review.md` 必须包含嵌入式 machine-readable JSON block
- 对结构性、高风险或跨层改动，在 evidence 里补 `graphChecks`，说明审查了哪条链路、做了哪些结构性检查、发现了什么

### 8. Mechanical Checks

- 运行：
  - `check-task-packet`
  - `check-evidence`
  - `check-review`
  - `check-adoption`
  - `check-template-health`
  - `check-runtime-evidence`
  - `check-doc-links`
  - `check-doc-inventory`
  - `check-sync-drift`
- 方法维护时，定期按 [HARNESS_COVERAGE_MODEL.zh.md](./HARNESS_COVERAGE_MODEL.zh.md) 做 harness coverage review

### 9. Review

- 采用 findings-first 风格
- review 必须指向同一份 task packet 和 evidence
- 对 non-trivial 任务，默认使用外部评估者视角；如果只能 self-review，要记录原因和 residual risk
- 对结构性、高风险或跨层任务，review 至少说明：
  - 本轮实际修改的是哪条受影响子图
  - 是否引入新循环依赖或扩大循环簇
  - 是否制造了新的 hub 节点
  - 是否让关键调用链明显变深
  - 是否让未验证输入穿过关键边界直达敏感操作

### 10. Close

- 合并或发布
- 将 PR 或 CI 失败分类为 `method-gate`、`repo-quality-gate`、`runtime-evidence-gate`、`external-flaky` 或 `not-applicable`
- 完成后归档 OpenSpec change
- 如果同类 failure pattern 再次出现，不要只补代码，要把它升级成 guide、template、sensor 或 gate
- 使用 [CROSS_AGENT_RATCHET_MODEL.zh.md](./CROSS_AGENT_RATCHET_MODEL.zh.md) 判断升级应落在 portable method、consumer template、consumer repository 还是 agent adapter
- 在重大模型或工具升级后，复核哪些旧 harness workaround 可以降级、替换或删除

## 最小 Machine-Readable 闭环

每个 non-trivial 任务都应当具备：

- 一个变更身份，或显式写 `none`
- 一个 task packet
- 一个 evidence directory
- 一个 review artifact

这四者必须通过显式字段互相引用，而不是只靠文件名约定。

可移植的最小闭环包括：

- task packet 的 `## Linkage`
- task packet 的 `## Structural Scope`，如果任务需要结构性审查
- evidence 的 `linkage`
- evidence 的 `graphChecks`，如果任务需要结构性审查
- review 的 `## Machine Readable` JSON block
