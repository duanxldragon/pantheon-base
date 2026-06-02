---
title: 代码质量与安全治理策略
doc_type: Design
layer: platform
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/DOCUMENT_GOVERNANCE_CONTRACT.md
updated_at: 2026-06-01
---

# 代码质量与安全治理策略

English version: [QUALITY_AND_SECURITY_STRATEGY.en.md](./QUALITY_AND_SECURITY_STRATEGY.en.md)

本文定义 Pantheon 的代码质量、安全扫描和第三方工具使用策略。目标是建立可持续的质量体系，而不是让 Sonar、CodeQL、Codacy 同时抢合并权，拖慢日常开发。

## 1. 总原则

1. **只保留一个主门禁体系**：GitHub Actions + Branch Protection 是合并依据。
2. **只保留一个主安全信号**：CodeQL 是代码安全分析的主信号。
3. **Sonar 只做辅助**：用于重复率、热点、长期技术债趋势和阶段性复核，不进入 required checks。
4. **Codacy 只做参考**：如果仓库已启用 Codacy，它只能作为对比仪表盘，不作为 required check，不覆盖 GitHub/CodeQL/Sonar 的结论。
5. **风险优先，不追求零噪音**：只阻塞会影响安全、正确性、共享底座稳定性或可回归性的事项。纯风格、低风险重复和无可达风险的建议进入 backlog。

当工具结论冲突时，优先级固定为：

```text
功能正确性：GitHub Actions 测试/构建/契约检查
安全可达性：CodeQL + secret/dependency/workflow posture
质量趋势：Sonar
外部对比：Codacy
```

## 2. 仓库分层

### 2.1 pantheon-base

`pantheon-base` 是后续业务仓库的底座，策略必须更严格。

必须阻塞合并的情况：

- GitHub required checks 未通过。
- CodeQL 命中可达的高危安全问题。
- `system/auth`、`system/iam`、`system/config`、权限、审计、共享 `pkg/*`、生成器、CI、凭据处理出现未解释的高风险变更。
- New Code 出现 `Blocker / Critical` 且没有明确的误报依据。
- Security Hotspots 未 review。

目标阈值：

- New Code 重复率低于 `3%`。
- New Code 覆盖率默认不低于 `80%`，例外必须在 PR 中说明补测计划。
- 高风险改动至少 `2` 个非作者 approval，其中一个来自域负责人、安全 reviewer 或架构 reviewer。

前端重复率是当前主要热点。治理顺序固定为：

1. 优先治理真实运行时页面、共享组件、布局、表单、表格和生成模板。
2. 其次治理 smoke、fixture、示例代码中的重复，避免它们被误当成生产代码或反复触发安全扫描。
3. 不为了压低数字盲目抽象业务叶子逻辑；只有当重复影响维护、安全或生成模板时才抽公共层。

### 2.2 pantheon-ops

`pantheon-ops` 是业务仓库，继承 base 的安全和架构底线，但不复制 base 的所有治理文档。

必须坚持：

- 通用后台底座问题回流到 `pantheon-base`。
- 业务模块只在 `business/*` 内演进，不能反向侵入系统域。
- 触达 auth、IAM、配置、权限、审计、CI、凭据的变更按 base 高风险标准执行。

建议阈值：

- New Code 重复率默认低于 `5%`。
- 核心业务链路新增或修改时必须有测试、smoke 或验收记录。
- 业务叶子模块的低风险重复可以先记录 backlog，但不能扩散到共享包、平台壳层或系统域。

## 3. 工具职责

### 3.1 GitHub Actions

GitHub Actions 是主门禁，负责：

- 后端测试。
- 前端 lint、build、契约检查。
- 文档、菜单、i18n、generated module 等项目专项检查。
- PR 和 merge queue 的 required checks。

Branch Protection 只要求 GitHub-native checks。不要把 SonarCloud 或 Codacy 的外部 check 加入 required checks。

### 3.2 CodeQL

CodeQL 是主安全信号，负责代码级安全分析。

- `pantheon-base` 上 CodeQL finding 默认按阻塞项处理，除非确认误报并留下依据。
- `pantheon-ops` 上业务域 finding 可按风险分级处理，但触达高风险域时必须按 base 标准处理。
- CodeQL 发现的高危问题优先于 Sonar/Codacy 的质量建议。

### 3.3 Dependency、Secret、Workflow Posture

依赖、密钥和 GitHub Actions 工作流态势扫描是供应链和 CI 安全补充。

- 新增依赖、升级依赖、修改 workflow、触达密钥处理时必须看这些报告。
- 非可达、开发依赖或低风险噪音可进入 backlog，但必须说明为什么不阻塞。
- 真实 secret 泄露、可达高危依赖漏洞和危险 workflow 权限必须立即处理。

### 3.4 Sonar

Sonar 保留为辅助工具，适合做：

- 重复率趋势跟踪。
- Security Hotspots review。
- 复杂度和长期技术债观察。
- 大批量 AI 生成代码之后的二次扫描。

Sonar 不做：

- 不进入 required checks。
- 不替代 CodeQL 的安全结论。
- 不替代 GitHub Actions 的测试/构建结论。
- 不因低风险 maintainability 建议阻塞常规业务开发。

推荐使用时机：

- 大 PR 合并前。
- 阶段收口前。
- 前端重复率治理批次结束后。
- 每周或每个里程碑做一次趋势复核。

### 3.5 Codacy

Codacy 如果保留，只能作为第三方对比视角：

- 不加入 required checks。
- 不作为安全主信号。
- 不要求逐条清零。
- 仅当它指出了 GitHub/CodeQL/Sonar 未覆盖的真实风险时，才转成 PR finding。

如果 Codacy 和 Sonar 对同一问题给出不同严重度，以 CodeQL 的安全判断和 Sonar 的重复率/热点趋势为准。

## 4. 例外处理

允许例外，但必须轻量留痕：

- PR 描述写明例外原因。
- 标明是否影响 `pantheon-base` 底座稳定性。
- 给出补测、重构或清理计划。
- 高风险例外必须有第二审批人。

禁止的例外：

- 已确认可达的高危漏洞。
- 未 review 的 Security Hotspot。
- 真实 secret 泄露。
- 破坏权限、认证、审计或配置安全边界的变更。

## 5. 快速开发保护

质量治理不能变成开发阻力。默认执行以下规则：

- 先修阻塞风险，再处理趋势问题。
- 前端重复率优先通过共享组件、页面模板和生成模板治理。
- 后端重复只在共享包、系统域、高风险链路或真实维护成本出现时治理。
- 生成代码、smoke 代码和 fixture 代码必须能清理、隔离或明确排除，避免长期污染运行时代码质量。
- 对低风险质量建议使用 backlog，不在功能 PR 里无限扩张重构范围。

## 6. PR 留痕

PR 至少记录：

- GitHub required checks 结果。
- CodeQL 结果或链接。
- 是否运行 Sonar；如果运行，附报告链接和结论。
- 如果 Codacy 出现，说明它仅作为参考，是否转化为真实 finding。
- 是否触达高风险域。
- 如果触达高风险域，第二审批人是谁。
