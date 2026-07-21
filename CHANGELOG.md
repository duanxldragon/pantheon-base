# Changelog

Pantheon Base 方法追踪记录。方法论本体位于 `pantheon-harness`。

格式灵感：[Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)

---

## [base-v0.9.0] — 2026-07-21

冻结版本，供 `pantheon-ops` 通过 foundation release 继承。

### Changed
- **Go module 重命名**: `pantheon-platform` → `pantheon-base`，覆盖 142 个 `.go` 文件 339 处 import，import 路径永不带 `backend/` 段（go.mod 在 `backend/` 内）
- **代码生成器模板同步**: `backendGenerator.ts` 生成的业务模块 Go import 改为 `pantheon-base/...`（消除 ops 新生成模块的隐形编译炸弹）
- **测试断言与脚本同步**: smoke 断言、`cleanup-generated-modules`、`triage-base-drift` 归一化逻辑同步新 module 名；`cleanup` 失效正则按当前真实形态规范化（去掉旧 `backend/` 段）

### Added
- **business/* 边界门禁（双层）**:
  - `golangci-lint depguard` 规则 `business-boundary`：禁止 `modules/business` import `modules/system|auth|platform` 内部，须走 `pkg/contracts`
  - `check-boundaries.mjs --strict --repo pantheon-base` 接入 CI `boundary-gate` job（新增 `--repo` 参数支持单仓扫描）
- **测试覆盖率门禁**: 新增 `scripts/harness/check-coverage.mjs` + CI `coverage-gate` job，初始阈值取现状实测（12.2%）的 90%（11%），后续版本 ratchet 抬升
- **MFA 生产强制安全基线**: `docs/DEPLOYMENT_GUIDE.md` 新增"强制安全基线（生产必选）"章节，`login.mfa_enabled=1` 等 5 项列为生产必选项

### Notes
- `VERSION` 文件维持 harness 方法论 shell 版本（1.4.0），不随产品线变更；base 产品线版本以 git tag 为载体
- 历史 CodeQL/Dependabot 分析临时文件未纳入本版本

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
