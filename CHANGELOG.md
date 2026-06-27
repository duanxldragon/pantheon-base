# Changelog

Pantheon Base 方法追踪记录。方法论本体位于 `pantheon-harness`。

格式灵感：[Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)

---

## [1.3.0] — 2026-06-27

### Changed
- **Migrated to pantheon-harness**: 所有方法论引用从 `harness-engineering/agentic-method-kit` 迁移到 `pantheon-harness`
- **文档路径更新**: 更新 AGENTS.md、docs/README.md、docs/harness/*.md 中的路径引用
- **脚本路径更新**: 更新 scripts/harness/*.mjs 中的方法包文件路径

### Removed
- **清理 agentic-method-kit/**: 删除 67 个文件，已迁移到 pantheon-harness
- **清理 agentic-repo-shell/**: 删除 92 个文件，已迁移到 pantheon-harness

### Synchronized from pantheon-harness
- ERROR_RECOVERY_STRATEGY.md
- HANDOFF_PROTOCOL.md

---

## [1.2.0] — 2026-06-26

### Changed
- **System modularization**: 系统模块化重构
- **Infrastructure improvements**: 基础设施改进

---

## [1.0.0] — 2026-06-15

### Added
- **Initial harness adoption**: 初始采纳 Harness Engineering 方法论
- **Task packet templates**: 任务包模板
- **Verification evidence specs**: 验证证据规范
- **Multi-agent delivery workflow**: 多 Agent 交付流程
- **Agent execution checklist**: Agent 执行清单
