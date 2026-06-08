# 工具适配矩阵

English version: [TOOL_ADAPTER_MATRIX.md](./TOOL_ADAPTER_MATRIX.md)

这个矩阵用于保持方法工具无关，同时保留实际执行选项。

具体仓库可以推荐工具，但工具不能定义方法。如果某个工具不可用，应使用另一个满足同一 harness capability 的 adapter。

| Harness capability | Required outcome | Possible adapters |
|---|---|---|
| Change identity | 非 trivial 工作有稳定变更引用 | OpenSpec、issue ID、仅 task packet、人工维护 change log |
| Planning | 工作有明确 scope、步骤、风险和验证 | superpowers planning、Claude/Codex/Cursor prompt workflow、人工 plan |
| Execution | 按 plan 实现工作 | Codex、Claude Code、Cursor、Copilot、OpenHands、Aider、人工工程师 |
| UI quality | 视觉、交互、可访问性和状态质量被检查 | impeccable、design review agent、人工设计 review、Playwright 加 checklist |
| Browser evidence | 在运行应用中检查用户流程 | gstack browse、Playwright、Chrome DevTools MCP、人工浏览器截图 |
| Runtime evidence | log、metric、trace 和性能信号对 agent 可见 | 本地可观测性栈、CLI logs、云观测 API、人工导出 |
| Review | findings-first review 检查回归和证据 | review agent、人工 reviewer、CI report、pair review |
| Mechanical closure | artifact 结构有效且互相链接 | repo-local scripts、CI、pre-commit hooks、人工 checklist |

## Adapter 规则

引入新工具时，只记录：

- 它满足哪个 harness capability
- 它读取和写入哪些 artifact
- 它产生什么 evidence
- 它不可用时的 fallback 是什么

不要把方法规则迁移到仅某个工具可见的配置里。
