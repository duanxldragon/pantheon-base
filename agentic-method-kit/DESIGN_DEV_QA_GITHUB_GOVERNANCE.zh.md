# 设计、开发、QA 与 GitHub 治理

English version: [DESIGN_DEV_QA_GITHUB_GOVERNANCE.md](./DESIGN_DEV_QA_GITHUB_GOVERNANCE.md)

本文定义一条轻量的交付治理闭环，适用于 AI 辅助或人工辅助开发的仓库。

它是可移植方法，不绑定具体业务系统。消费仓库负责自己的质量画像、业务验收标准、CI job 和发布审批。

## 治理闭环

```text
Design Gate
  -> Development Gate
  -> QA Acceptance Gate
  -> GitHub Governance Gate
  -> Ratchet Closeout
```

## 1. Design Gate

目的：避免任务边界不清时直接进入实现。

最小进入条件：

- 任务已判断为 trivial 或 non-trivial
- 目标用户、系统结果或方法结果已说明
- 关键 contract、design 或 architecture anchor 已命名
- 需要验证的假设可见

最小退出证据：

- design/spec 引用，或显式 `none`
- 验收假设，或显式 `none`
- out-of-scope 列表

不要把每个小任务都变成大型设计流程。简单任务的 design gate 可以只是一段话。

## 2. Development Gate

目的：约束代码生成和跨 agent 交接。

最小进入条件：

- expected files 和 do-not-touch files 已声明
- owner layer 已选择
- required sensors 和 evidence 已选择
- 实现可以在不改变方法边界的情况下开始

最小退出证据：

- commands、tests、static checks，或显式 gaps
- 如果方法工作暴露了无关代码失败，记录 deferred code issues
- 如果实现越过 task packet 边界，记录 scope 变化

## 3. QA Acceptance Gate

目的：在没有专职 QA 时，提供最低验收替代。

最小进入条件：

- QA 路径已选择：command、browser、runtime、human review，或显式 `none`
- UI 或 runtime-sensitive 工作已声明所需 evidence 类型
- closeout 前记录 known gaps

最小退出证据：

- command summary、screenshot、browser smoke、runtime logs/metrics/traces、human acceptance note，或显式 gap
- residual risk statement

## 4. GitHub Governance Gate

目的：分类处理 PR 和 CI 失败，避免所有红灯都变成泛化代码清理。

最小 PR 分类：

- `method-gate`：task、evidence、review、linkage 或 ratchet 元数据缺失
- `repo-quality-gate`：仓库测试、lint、静态分析、安全或覆盖率失败
- `runtime-evidence-gate`：缺少必需的 browser、smoke、log、metric 或 trace evidence
- `external-flaky`：外部基础设施或工具不稳定阻塞验证
- `not-applicable`：任务为 trivial，且仓库策略允许跳过

合并就绪需要：

- 必需的方法 artifact 已链接
- known gaps 已记录
- CI 失败已分类
- 未解决 P0/P1 issue 已阻断，或已由 human gate 显式接受

## 5. Ratchet Closeout

目的：避免重复失败只通过反复补代码解决。

Closeout 应说明：

- failure 是首次还是重复
- failure class
- owner layer
- 已知 occurrence count
- promotion decision
- promotion 应落在 portable method、consumer template、consumer repository 还是 agent adapter

使用最小有效控制。优先更新 guide 或 template，再考虑增加慢速或高噪声 gate。

## 什么留在消费仓库

这些内容应留在消费仓库：

- 产品特定 smoke route
- 业务验收清单
- 领域权限规则
- 具体 CI job 名称
- 质量阈值
- 发布审批

只有跨仓库或跨 agent 适用的生命周期控制与 failure class，才应上移到 portable method。
