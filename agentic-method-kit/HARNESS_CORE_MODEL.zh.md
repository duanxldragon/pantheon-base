# Harness 核心模型

English version: [HARNESS_CORE_MODEL.md](./HARNESS_CORE_MODEL.md)

本文定义 Harness Engineering 的工具无关核心模型。

本方法不依赖 Claude Code、Codex、Cursor、Copilot、OpenHands、Aider 或任何单一 agent runtime。这些工具都是 adapter。Harness 是由仓库拥有的、围绕模型建立的控制系统。

## 1. 定义

在本方法中：

```text
coding agent = model + runtime + harness
```

模型提供语言和推理能力。

Runtime 提供工具执行、文件访问、shell、沙箱、浏览器、会话和可选的 agent 编排能力。

Harness 是项目拥有的 guides、sensors、state、gates、templates 和 review loops，用于把 runtime 稳定地引导到目标代码库状态。

## 2. 核心对象

### 2.1 Guides

Guides 是前馈控制，用于提高 agent 一开始就走对方向的概率。

例子：

- `AGENTS.md`、`CLAUDE.md`、`GEMINI.md` 或等价仓库入口文件
- 合同、设计文档、验收文档
- task packet 和 implementation plan
- 受影响子图说明、边界 crossing 摘要
- 架构地图和领域规则
- how-to 文档和项目本地 skill
- schema 快照、API 地图等生成参考

规则：

- 入口 guide 要短，深层信息通过链接展开。
- 持久 guide 必须有明确来源或事实源。
- 反复起作用的规则，最终应下沉为 sensor 或 gate。

### 2.2 Sensors

Sensors 是反馈控制，用于检测 agent 产出是否让仓库接近目标状态。

例子：

- 测试、类型检查、lint、静态分析、架构检查
- CodeGraph 辅助的结构性审查：cycle、hub、call-depth、sensitive-flow
- 浏览器 smoke、截图、console log、可访问性检查
- 可观测性查询、日志、trace、metric
- review agent、人工 review、架构 review、安全 review
- drift scan、dead-code scan、dependency scan

规则：

- 内循环优先使用快速、确定性的 sensor。
- 需要语义判断时使用 inferential sensor。
- 如果某类重复错误进入人工 review，应补 sensor 或改进现有 sensor。

### 2.3 State

State 是让人和 agent 能恢复工作的持久记忆。

例子：

- OpenSpec change 或等价变更身份
- task packet
- structural scope / affected subgraph 摘要
- evidence directory
- graphChecks 结果
- review artifact
- decision log
- completed plan 和 known technical debt

规则：

- State 必须存在于版本化仓库文件或明确 artifact 位置。
- State 必须能通过稳定 ID 串联。
- 长任务必须通过 state artifact 支撑 context reset。

### 2.4 Gates

Gates 决定任务是否可以继续推进。

例子：

- schema、权限、删除、依赖、安全边界的人类 gate
- task packet、evidence、review、文档链接的 mechanical gate
- 测试、lint、合同、静态检查的 CI gate
- 未解决 P0/P1 的 review gate

规则：

- Gate 必须显式，不靠默认约定。
- Gate 必须说明需要什么证据。
- Gate 应尽量左移，但不能早到阻断有效迭代。

### 2.5 Templates

Templates 为常见仓库拓扑打包 guides、sensors、gates 和 state 约定。

例子：

- 后台平台模板
- API 服务模板
- 事件处理服务模板
- 数据看板模板
- UI-heavy 产品模板

规则：

- Template 是起点，不是永久 fork。
- Template 必须版本化。
- Template drift 必须可见、可升级。

## 3. 控制面

Harness 分为六个控制面。

### 3.1 Instruction Plane

定义 agent 行动前应该知道什么。

典型 artifact：

- 仓库入口文件
- 架构地图
- 合同
- task packet
- skills 或 how-to guides

### 3.2 Task Plane

定义当前任务是什么，什么不在范围内。

典型 artifact：

- OpenSpec change 或等价对象
- task packet
- affected subgraph / boundary crossing 说明
- implementation plan
- sprint contract 或 done criteria

### 3.3 Execution Plane

定义工作如何执行。

典型 artifact：

- tool adapter
- shell command
- sandbox 配置
- worktree 策略
- 本地脚本

### 3.4 Verification Plane

定义产出如何被检查。

典型 artifact：

- test 和 smoke check
- static analysis
- graphChecks
- visual evidence
- observability query
- evidence summary

### 3.5 Review Plane

定义判断如何发生。

典型 artifact：

- findings-first review
- 分角色 review
- 结构性 findings：cycle、hub、call-depth、sensitive-flow
- human approval
- review artifact linkage

### 3.6 Governance Plane

定义 harness 自身如何保持一致。

典型 artifact：

- method version
- adoption check
- drift check
- documentation frontmatter check
- template upgrade note
- harness coverage review

## 4. 生命周期事件

本方法把 harness 执行视为生命周期，而不是一次 prompt。

```text
TaskIntake
  -> ContextResolved
  -> PlanAccepted
  -> WorkStarted
  -> SensorRun
  -> EvidenceAttached
  -> ReviewRequested
  -> ReviewClosed
  -> HandoffCompleted
  -> DriftObserved
  -> HarnessUpdated
```

不是每个任务都需要每个事件。Trivial 任务可在仓库规则允许时跳过 task packet，但仍要明确范围、验证和 known gaps。

## 5. Agent 角色

本方法支持这些角色，但不要求任何特定 runtime。

- Planner：把意图展开成有边界的 spec 或 plan。
- Generator：实现已约定的工作。
- Evaluator：按 done criteria 测试行为并探测边界。
- Reviewer：检查架构、安全、回归和证据质量。
- Janitor：扫描 drift 并提出清理任务。
- Human：负责目标、tradeoff、风险接受和高影响变更的最终判断。

一个工具可以扮演多个角色，但高风险任务应分离 generator 和 evaluator/reviewer。

## 6. Ratchet 规则

每个重复出现的 agent 失败都应分类。

```text
failure -> guide update | sensor update | gate update | template update | no action
```

不要预防性堆规则。规则应来自真实失败、硬性外部约束或已知高影响风险。

也不要默认永久保留规则。随着模型、工具和仓库结构演进，要定期检查每个 harness 组件是否仍然 load-bearing。

## 7. 工具无关映射

工具特性可以映射到本模型，但不能成为方法本身。

| Harness concept | 可能的工具形态 |
|---|---|
| Guide | `AGENTS.md`、`CLAUDE.md`、Cursor rules、skill docs、repo contracts |
| Sensor | tests、lints、browser tools、review agents、CI jobs |
| State | plans、task packets、evidence、reviews、OpenSpec changes |
| Gate | hooks、CI checks、approval prompts、PR rules |
| Adapter | Claude Code command、Codex skill、Cursor rule、shell script、human checklist |

可移植方法是上面的模型。工具只是实现选择。
