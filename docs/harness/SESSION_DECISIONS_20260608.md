---
title: Session Decisions 2026-06-08
doc_type: Remediation
layer: platform
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-06-08
---

# Session Decisions — 2026-06-08

本轮完成架构审查、Harness 基建修复、Sonar 覆盖率改造、多 Agent 流程落地和模型层级配置。

## 1. Architecture Audit

完整报告：`.harness/evidence/2026-06-08-architecture-audit/audit-report.md`

| 维度 | 评分 | 说明 |
|---|---|---|
| 合同→代码对齐 | PASS | 5 份 system contract 与代码结构一致 |
| 业务解耦 | PASS | business 未依赖 system Service/Repository |
| 视觉反模式 | CLEAN | 无渐变、无非标准字重、无旧壳层类名 |
| CI 门禁 | PASS | 5 required + 2 auxiliary |
| Harness 方法 | 14/14 PASS | 补齐 agentic-repo-shell 后全部通过 |

总分：**7.5 → 8.5/10**

## 2. P0/P1/P2 决议

### P0（已完成）
- **补齐 agentic-repo-shell**：从 `harness-engineering/agentic-repo-shell/` 复制到 `pantheon-base/agentic-repo-shell/`，恢复所有 14 个 harness 检查脚本
- **修复 DCB-002**：`npm run check:docs-frontmatter` 通过（237 docs, 217 with frontmatter）

### P1（已完成）
- **全量 harness 检查**：14/14 脚本通过
- **DCB-001**：`cookie.go` trailing whitespace 已不存在（自动修复）
- **DCB-003**：root-level CI checks 全部通过
- **合约文档绝对路径修复**：10 文件，doc-links findings 209→3
- **文档索引补齐**：`scripts/harness/README.md`（新建）+ `docs/README.md` 补全 Harness 条目

### P2（讨论后决议）

| 事项 | 决议 | 理由 |
|---|---|---|
| system/ 物理拆分 | **不做** | 保持嵌套结构便于整体解耦；contract 追加内部引用约束 |
| base→ops 继承同步检查 | **不做** | 等实际 drift 触发 failure registry ratchet loop |
| Sonar task packets 清理 | batch-1/2 → Completed，父 → Batched |

## 3. Sonar Coverage 改造

### 问题
`sonar.coverage.exclusions` 排除了所有有意义代码，覆盖率显示 ~3.5%（假数据）。

### 修改

**`sonar-project.properties`**：
- 移除 `backend/modules/**`, `backend/internal/**`, `backend/pkg/**`, `frontend/**` 排除
- 新增 `sonar.typescript.lcov.reportPaths=coverage/frontend/lcov.info`

**前端覆盖率工具链**：
- `vite-plugin-istanbul` + `nyc` — Vite dev server 插桩
- `tests/fixtures/coverage.ts` — Playwright page fixture，每个 test 后提取 `window.__coverage__`
- `scripts/merge-coverage-to-lcov.mjs` — 合并 JSON → lcov.info
- 12 个 platform + system smoke spec 改用 coverage fixture import
- `.github/workflows/sonar.yml` — 新增 Node + Playwright + smoke coverage 步骤

**特性**：
- 覆盖率只在 `PANTHEON_COLLECT_COVERAGE=1` 时采集（仅 Sonar workflow 触发）
- 本地开发零影响
- 前端利用已有 30 个 Playwright e2e spec，不新写测试

## 4. 多 Agent 交付流程加固

### A: AGENTS.md 纪律约束

新增规则（第 17 行）：

> Claude 不直接修改 `backend/` 和 `frontend/src/` 下的业务代码。计划批准后实现统一通过 `codex exec` 交给 Codex 执行。

### C: Codex Executor 流程

Codex CLI v0.137.0 已验证可用。标准流程：

```
Human Goal → Claude 规划（Plan → Task Packet）
           → Human 确认
           → Claude 构造 codex exec 命令 → Codex 实现
           → Claude Review（findings-first）
           → Codex 修复（按需）
           → Closeout
```

Claude 白名单（可直接编辑）：
- `docs/harness/`、`.harness/`
- `CLAUDE.md`、`AGENTS.md`、`DESIGN.md`
- `sonar-project.properties`、`.gitignore`、`package.json`（scripts only）
- `.github/workflows/`

## 5. Codex 模型层级

配置文件：`.codex/model-tiers.json`——模型迭代时只改这一个文件。

| Tier | 模型 | Reasoning | 用途 | 成本 |
|---|---|---|---|---|
| **quick** | gpt-5.4-mini | medium | 只读探索、文档修改 | 低 |
| **standard** | gpt-5.4 | high | 常规功能、Bug 修复、测试 | 中 |
| **deep** | gpt-5.5 | xhigh | Auth/安全/权限/Schema/生成器 | 高 |

**自动选择规则**：
- 只读探索 → quick
- 触碰 auth / 权限 / schema / middleware / 生成器 → deep
- 其余 → standard

**手动覆盖**：说 "use quick" / "use standard" / "use deep"。

## 6. Task Packet 状态

| Task Packet | 状态 |
|---|---|
| `2026-06-03-main-sonar-batch-1-i18n-resource-dedup` | Completed |
| `2026-06-03-main-sonar-batch-2-backend-i18n-coverage` | Completed |
| `2026-06-03-main-sonar-remediation` | Batched |
| `2026-05-18-pantheon-base-audit-and-qa` | Approved（不变） |
