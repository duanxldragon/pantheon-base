# 执行护栏

English version: [EXECUTION_GUARDRAILS.md](./EXECUTION_GUARDRAILS.md)

本文为可移植的 Harness Engineering 方法补上一组小而硬的执行护栏。

这些护栏改写自 `multica-ai/andrej-karpathy-skills` 中受 Andrej Karpathy 观察启发的规则，但这里将其整理为仓库自有、工具无关的方法资产。

## 1. 编码前先澄清

不要在含糊前提下默默猜测并继续实现。

- 把已确认事实、工作假设和未决问题分开写。
- 如果歧义会影响 scope、安全、数据处理、架构或用户可见行为，就停下来问。
- 如果歧义只影响可逆的本地探索，先读仓库和事实源，再决定是否仍需升级给人。
- 如果存在多种合理解释，要记录下来，不要偷偷选一个。

Harness 对应落点：

- task packet 的 `## Assumptions and Open Questions`
- task packet 的 `## Contract Anchors`
- 只有真正需要人工输入时才写入 stop points

## 2. 简单优先

用最小、可承重的变更解决今天的问题。

- 新增本地抽象前，优先删除、复用、标准库、平台原生能力和既有依赖。
- 没有第二个真实用例前，不要提前加入可配置性、间接层或扩展点。
- 不要为周边系统根本不会产生的场景加防御性分支。
- 如果实现规模和任务不匹配，先收缩再继续。

Harness 对应落点：

- [MINIMAL_COMPLEXITY_LADDER.zh.md](./MINIMAL_COMPLEXITY_LADDER.zh.md)
- task packet 的 `## Minimum Viable Approach`

## 3. 外科式改动

只碰承载本次需求行为的文件和代码行。

- 每个改动文件都应能追溯到 scope、verification 或必需 evidence。
- 编辑前先声明 `Do Not Touch` 边界。
- 除非需求直接要求，否则沿用仓库现有风格。
- 只清理被你本次改动直接淘汰的死代码或 import。

Harness 对应落点：

- task packet 的 `## Scope`
- task packet 的 `## Expected Files`
- 跨边界时补 task packet 的 `## Structural Scope`

## 4. 目标驱动验证

把任务转成可证伪的成功条件。

- 修 bug 时优先采用先复现、再修复的循环。
- 明确什么可观察结果能证明任务完成。
- 明确哪些回归检查必须继续为绿。
- 没拿到验证信号，或没显式记录验证缺口前，不算完成。

Harness 对应落点：

- task packet 的 `## Success Criteria`
- task packet 的 `## Verification Plan`
- evidence 与 review 的链接闭环

## 5. 默认 Task Packet 增补

对 non-trivial 工作，默认 task packet 增加三段简短内容：

- `## Assumptions and Open Questions`
- `## Minimum Viable Approach`
- `## Success Criteria`

这些段落应该保持简短。它们的目的，是防止静默假设、过早抽象和模糊的完成定义。

## 6. Trivial 工作

Trivial 工作不需要加重流程，但仍应在心智上遵守这些护栏：

- 不要对高风险歧义靠猜
- 不要过度设计
- 不要无故扩大 diff
- 没有真实检查前不要宣称完成
