# 迁移说明

English version: [MIGRATION.md](./MIGRATION.md)

这个 kit 的目标，是在仓库迁移和工具切换后仍然可持续使用。

## 可迁移的事实来源

方法本身应尽量收敛在当前目录：

- playbook
- templates
- schemas
- portable checks

不要把某个单一工具专属配置变成方法定义本身，例如只属于 Claude、Codex、Cursor 或 MCP 的配置。

## 应保留在目标仓库本地的内容

以下内容不应塞回 kit，而应留在每个目标仓库自己的执行层：

- 实际任务包
- 实际验证证据
- 实际评审产物
- 仓库特有的 CI 工作流
- 仓库特有的包装脚本

## 推荐迁移步骤

迁移到新仓库时：

1. 复制 `agentic-method-kit/`
2. 如果路径不同，调整 `config/method.config.json`
3. 重建包装脚本或 CI wiring
4. 预置一个示例 task packet、evidence 目录和 review artifact
5. 在声明接入完成前，跑通全部 portable checks
