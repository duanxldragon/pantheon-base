---
title: Main Sonar Remediation Runbook
doc_type: Remediation
layer: platform
status: Superseded
superseded_by: docs/remediations/MAINTAINABILITY_REMEDIATION_PLAN_2026_06_23.md
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/DOCUMENT_GOVERNANCE_CONTRACT.md
updated_at: 2026-06-23
---

# Main Sonar Remediation Runbook

English version: [MAIN_SONAR_REMEDIATION_RUNBOOK_20260603.en.md](./MAIN_SONAR_REMEDIATION_RUNBOOK_20260603.en.md)

> 当前状态：已弃用。本文仅作为历史整改记录保留，不再作为代码质量或重复代码治理入口。新的维护性与重复代码整改以 [可维护性与重复代码整改计划](./MAINTAINABILITY_REMEDIATION_PLAN_2026_06_23.md) 为准。

## 1. 整改流程（三步）

```
本地 CI gates 通过 → 写测试/重构 → 合并后触发远端 Sonar
```

**Step 1 — 确定修复范围**

每次只修一个层或一个域，不要一次修所有 Sonar issues：

- `pkg/`、`system/auth`、`system/iam`、`system/config`、`system/org`
- 前端共享组件、真实页面（非 fixture/smoke）

**Step 2 — 修复 + 验证**

```bash
# 跑本地 CI gates（quality.yml 的门禁子集）
npm ci
go test ./...                  # 后端测试
cd frontend && npm ci && npm run lint && npm run build   # 前端构建
```

修复原则：

- 补测试优先于重构代码（覆盖率从 3.5% 起步，每一行新测试都直接改善指标）
- 改 Sonar issues 时要附带对应包的测试，不要只删代码不补覆盖
- 前端重复率通过提取共享组件治理，不做无意义的抽象

**Step 3 — 合并后触发 Sonar**

```bash
gh workflow run sonar.yml --ref main
```

远端 Sonar 完成后，workflow 会自动抓取最新报告并上传 artifact / evidence。直接根据该报告确认结果；如果质量门仍为 ERROR，记录具体恶化指标并进入下一轮，不再手工回 SonarCloud 页面找报告。

## 2. 证据要求

每轮整改只需一个文件：`.harness/evidence/<task-id>/summary.md`，包含：

- 本轮修了哪些 issues
- 覆盖率和重复率变化
- 还有哪些已知 gap

不再需要 `commands.json` + `review.md` + 分 phase logs。如果修复涉及运行时敏感变更（登录、权限、导入导出），补一条简单的 runtime evidence 说明即可。

## 3. 环境准备

### 本地 Sonar（可选）

```bash
# 1. 复制模板，填入 token
cp pantheon-sonarcloud.env.example pantheon-sonarcloud.env
# 编辑填入 SONAR_TOKEN

# 2. 安装 SonarScanner CLI
# 参考 https://docs.sonarsource.com/sonarcloud/advanced-setup/cli/

# 3. 扫描
pwsh -File scripts/run-sonar.ps1
```

日常不要求本地 Sonar。CI 上的 PR Sonar 分析已提供足够反馈；如果需要本地闭环，请优先使用 `npm run run:sonar-remediation -- --group local-sonar --execute`，它会在扫描后自动抓取最新报告并写入 evidence。`scripts/run-sonar.ps1` 仍可作为更低层的扫描调试入口。

### Windows 说明

`go test -race` 在 Windows 不支持，本地用 `go test ./...`。含 race 的测试以 Ubuntu CI 为准，已由 `quality.yml` 覆盖。
