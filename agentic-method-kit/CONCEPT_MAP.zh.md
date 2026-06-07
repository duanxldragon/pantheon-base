# Agent 工具最佳实践到 Harness 的概念映射

English version: [CONCEPT_MAP.md](./CONCEPT_MAP.md)

这个文档说明：本 kit 借鉴现代 coding agent 工具的架构思想，并把它翻译成可移植 harness 模式。

代表性参考来源：

- GitHub 仓库概览：https://github.com/shanraisshan/claude-code-best-practice
- Harness engineering for coding agent users: https://martinfowler.com/articles/harness-engineering.html
- Agent Harness Engineering: https://addyosmani.com/blog/agent-harness-engineering/
- OpenAI Codex harness engineering: https://openai.com/index/harness-engineering/

## 映射后的核心思想

### 1. Commands 对应工作流入口

现代 agent 工具把 commands 当作稳定的工作流入口。

可移植等价物：

- 稳定的 playbook 章节
- 可复用的 prompt 进入方式
- 标准化 task packet 模板

### 2. Skills 对应方法模块

Agent 工具强调 skills 或可复用能力块。

可移植等价物：

- method modules
- project how-to guides
- repo-local scripts
- tool adapters

关键不是“依赖一个神奇系统”，而是“把多个专长模块组合成默认方法”。

### 3. Subagents 对应专职执行者

Agent 工具越来越强调 planner、generator、evaluator、reviewer 和 janitor 的角色分离。

可移植等价物：

- 角色化工作合同
- 分离 implementation 和 evaluation
- 支持时并行执行有界子任务
- human 负责目标和 tradeoff 的最终判断

### 4. Hooks 对应 Mechanical Gates 和 Sensors

Agent 工具大量使用 hooks 和 lifecycle scripts。

可移植等价物：

- 仓库本地检查脚本
- CI gate
- 模板强制关联
- runtime 或 browser sensors
- review gates

这种做法比依赖单一工具的 hook 运行时更可迁移。

### 5. Memory 对应仓库工件

Agent 工具使用 memory scopes、resumable sessions、context compaction 和 handoff artifacts。

在可迁移方法里，对应为：

- OpenSpec 变更工件
- task packet
- evidence
- 归档后的 plan / spec

这些内容可检查、可复制，也不会因为切换工具而丢失。

### 6. Guides 和 Sensors 是一等对象

Harness engineering 区分 feedforward guides 和 feedback sensors。

可移植等价物：

- guides：repo rules、contracts、specs、task packets、plans
- sensors：tests、static checks、browser evidence、observability、review
- gates：明确 pass/fail 或 approval decision

### 7. MCP 和外部工具保持可选

Agent 工具包含 MCP servers、plugins、browser tools 或 hosted sandboxes。

这里的可迁移规则是：

- 方法本身不应依赖某一个 MCP 才能成立
- 如果工具存在，它们只是接入同一工作流，而不是重新定义方法

## 最重要的翻译结论

最大的可迁移经验是：

- 不要把工具本身当成方法
- 先把方法显式写清楚，再把不同工具映射进来

这也是为什么本 kit 的中心是：

- playbook
- templates
- schemas
- mechanical closure scripts

而不是某一个工具专属配置文件。

另见：

- [HARNESS_CORE_MODEL.zh.md](./HARNESS_CORE_MODEL.zh.md)
- [HARNESS_COVERAGE_MODEL.zh.md](./HARNESS_COVERAGE_MODEL.zh.md)
- [HARNESS_TEMPLATE_TAXONOMY.zh.md](./HARNESS_TEMPLATE_TAXONOMY.zh.md)
- [TOOL_ADAPTER_MATRIX.zh.md](./TOOL_ADAPTER_MATRIX.zh.md)
