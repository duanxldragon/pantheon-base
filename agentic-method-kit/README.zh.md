# Agentic Method Kit

English version: [README.md](./README.md)

这是一个可移植的方法包，给希望在仓库里建立可重复 Harness Engineering 工作流的团队使用。

当你希望非 trivial 的 agent 或人工辅助交付有明确控制项时，就把这个目录复制进目标仓库。

它也内置了一条最小图审查收口路径：

- 从 task manifest 的 `structuralScope` 生成 `graphChecks` / `structuralReview` 骨架
- 把保存下来的 CodeGraph 风格输出整理成 `graph-review.json`
- 再把这个导入结果写回 evidence / review 收口件

在 `pantheon-base` 中采用本方法时，配合以下本地落地层使用：

- `docs/harness/` 下的仓库本地 harness 文档
- `docs/harness/AI_QUALITY_GOVERNANCE.md` 中的消费方质量治理
- `docs/harness/PANTHEON_BASE_DELIVERY_WORKFLOW.md` 中的多 agent 交付调度

## 这个方法包定义什么

- 工具无关的 harness 核心模型
- 一套 context-engineering 协议，用来定义 context surface 分层、渐进式检索、跨 session 恢复和敏感上下文边界
- 方法优先交付策略，避免流程尚未清楚时陷入生产代码修复
- 执行护栏，用来约束歧义处理、简单优先、外科式 diff 和可验证完成
- 最小复杂度阶梯，用来避免不必要代码、依赖和抽象，同时不削弱安全性
- 面向 guides、sensors、gates 和 failure capture 的覆盖模型
- 跨 agent ratchet 模型，把重复失败升级成可复用方法资产，同时避免绑定单一业务仓库
- 从设计、开发、QA 验收到 GitHub PR 治理和 ratchet closeout 的交付治理闭环
- 面向不同仓库形态的模板分类
- 工具适配矩阵，让具体工具可用，但不把它们变成方法前提
- 一套默认 playbook，覆盖 change 选择、task packet、实现、evidence 和 review
- task packet、evidence、review closure、failure registry entry 的可移植 schema 与模板
- 方法健康度、adoption、task packet 结构和治理漂移的可移植检查
- review artifact 的可移植闭环，以及 template/runtime/docs-integrity 的通用治理检查

## 这个方法包不要求什么

- 不要求某一个编辑器
- 不要求某一个托管 agent runtime
- 不要求某一个 MCP server
- 不要求某一个 skill bundle

具体工具可以被仓库推荐，但不能成为方法本身。

## 快速开始

1. 阅读 [README.zh.md](./README.zh.md)
2. 阅读 [HARNESS_CORE_MODEL.zh.md](./HARNESS_CORE_MODEL.zh.md)
3. 阅读 [EXECUTION_GUARDRAILS.zh.md](./EXECUTION_GUARDRAILS.zh.md)
4. 阅读 [CONTEXT_ENGINEERING_PROTOCOL.zh.md](./CONTEXT_ENGINEERING_PROTOCOL.zh.md)
5. 阅读 [METHOD_FIRST_DELIVERY_POLICY.zh.md](./METHOD_FIRST_DELIVERY_POLICY.zh.md)
6. 阅读 [MINIMAL_COMPLEXITY_LADDER.zh.md](./MINIMAL_COMPLEXITY_LADDER.zh.md)
7. 阅读 [HARNESS_COVERAGE_MODEL.zh.md](./HARNESS_COVERAGE_MODEL.zh.md)
8. 阅读 [CROSS_AGENT_RATCHET_MODEL.zh.md](./CROSS_AGENT_RATCHET_MODEL.zh.md)
9. 阅读 [DESIGN_DEV_QA_GITHUB_GOVERNANCE.zh.md](./DESIGN_DEV_QA_GITHUB_GOVERNANCE.zh.md)
10. 阅读 [HARNESS_TEMPLATE_TAXONOMY.zh.md](./HARNESS_TEMPLATE_TAXONOMY.zh.md)
11. 阅读 [TOOL_ADAPTER_MATRIX.zh.md](./TOOL_ADAPTER_MATRIX.zh.md)
12. 阅读 [METHOD_PLAYBOOK.zh.md](./METHOD_PLAYBOOK.zh.md)
13. 复制你需要的模板
14. 如果你的仓库路径约定不同，调整 [config/method.config.json](./config/method.config.json)
15. 运行 [scripts/](./scripts/) 下的可移植检查脚本

## 闭环

对于非 trivial 工作，可移植闭环是：

- change record
- task packet
- implementation
- verification evidence
- review artifact
- 如果仓库采用文档治理，则再加 governed docs

这个方法包存在的目的，就是把这条闭环显式化、可迁移化。

## Canonical 角色

`agentic-method-kit/` 是方法事实源。

仓库本地的 `docs/harness/*` 可以为本地执行投影或摘要这些方法，但如果出现漂移，应以这里的方法定义为准，再回同步下游投影层。

## 版本管理

当前版本：

- `1.0.0`

版本元数据：

- [VERSION](./VERSION)
- [METHOD_VERSION.json](./METHOD_VERSION.json)
- [CHANGELOG.md](./CHANGELOG.md)
- [UPGRADE.md](./UPGRADE.md)
