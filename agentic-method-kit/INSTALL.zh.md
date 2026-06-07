# Install Agentic Method Kit

English version: [INSTALL.md](./INSTALL.md)

这个方法包被设计成一个可整体复制到仓库根目录的单一文件夹。

## 0. 前置要求

必需：

- `git`
- `node` 20+

推荐：

- 如果你希望显式管理 change 生命周期，准备一套 OpenSpec 工作流或 CLI
- 如果你要做 UI evidence，准备一条浏览器测试路径

不要求：

- 预装仓库本地 skills
- 只支持 Codex 或只支持 Claude 的插件
- 某个特定 MCP server

## 版本文件

这个方法包会在以下文件中发布自己的版本信息：

- `VERSION`
- `METHOD_VERSION.json`
- `CHANGELOG.md`
- `UPGRADE.md`

## 1. 复制目录

把：

```text
agentic-method-kit/
```

复制到目标仓库根目录。

## 2. 创建或复用标准路径

默认配置期望这些位置存在：

- `docs/harness/tasks/`
- `.harness/evidence/`
- `.github/pull_request_template.md`
- `openspec/changes/`

如果你的仓库使用不同路径，请更新：

- `agentic-method-kit/config/method.config.json`

## 3. 接入模板

把这些模板作为仓库级源材料使用：

- `templates/task-packet.template.md`
- `templates/review.template.md`
- `templates/pr-template.md`

## 4. 接入检查脚本

典型命令：

```text
node agentic-method-kit/scripts/check-task-packet.mjs --root .
node agentic-method-kit/scripts/check-evidence.mjs --root . --strict
node agentic-method-kit/scripts/check-review.mjs --root . --strict
node agentic-method-kit/scripts/check-adoption.mjs --root .
node scripts/harness/check-method-health.mjs --root . --strict
```

## 4.1 日常怎么运行

典型 non-trivial 工作流：

1. 创建一个 OpenSpec change
2. 创建 `docs/harness/tasks/<task-id>.task.md`
3. 如果任务带有 `## Structural Scope`，先生成图审查闭环骨架：
   `node scripts/harness/scaffold-graph-review.mjs --write <task-id>`
4. 如果你保存了 CodeGraph 风格的审查输出，先整理再导入：
   `node scripts/harness/build-graph-review-import.mjs --source trace.json --write .harness/evidence/<task-id>/graph-review.json`
   `node scripts/harness/scaffold-graph-review.mjs --write --import .harness/evidence/<task-id>/graph-review.json <task-id>`
5. 实现
6. 保存 `.harness/evidence/<task-id>/commands.json`
7. 保存 `.harness/evidence/<task-id>/review.md`
8. 运行检查

示例导入文件：

- `agentic-method-kit/examples/minimal-repo/.harness/evidence/example/graph-review.json`

典型 trivial 工作流：

1. 直接实现
2. 运行最低限度 verification
3. 按仓库策略记录 evidence 或 known gaps

## 5. 推荐的仓库级 wrapper

如果目标仓库已经有本地 harness 脚本，建议让它们作为这个方法包的薄封装。

推荐 wrapper 名称：

- `check-task-packet`
- `check-evidence`
- `check-review`
- `check-adoption`

## 6. CI 建议

对于 non-trivial 变更，建议在 pull request 上运行全部四项检查。

如果触碰 UI，还应通过你常规的 QA 流程要求浏览器或截图 evidence。

## 7. Skill 安装建议

方法要正常工作，不需要安装特殊 skill 包。

如果你的 agent 平台支持 skills，推荐分工是：

- skills 用于工作流辅助
- 仓库契约与脚本作为可强制执行的事实源

推荐但可选的能力：

- planning / brainstorming
- disciplined execution
- UI quality review
- browser QA
