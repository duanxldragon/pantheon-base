# Upgrade Guide

English version: [UPGRADE.md](./UPGRADE.md)

当你要更新一个已经包含以下内容的现有仓库时，使用这份指南：

- `agentic-method-kit/`
- 基于 `agentic-repo-shell/` 派生出来的仓库本地文件

## 升级策略

- 先升级 `agentic-method-kit/`
- 再对齐仓库本地 shell 文件
- 然后重新运行 harness checks

## 1.0.0

基线版本。

升级后的推荐验证命令：

```text
node agentic-method-kit/scripts/check-task-packet.mjs --root .
node agentic-method-kit/scripts/check-evidence.mjs --root . --strict
node agentic-method-kit/scripts/check-review.mjs --root . --strict
node agentic-method-kit/scripts/check-adoption.mjs --root .
```

