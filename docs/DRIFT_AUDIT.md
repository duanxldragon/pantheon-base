# Pantheon Base Drift Audit

更新时间：2026-05-18

类型：Audit
归属层：platform / system/auth / system/iam / system/config / business/*
状态：Active

关联设计：
- `designs/PANTHEON_BASE_ARCHITECTURE_OVERVIEW.md`
- `designs/P2_SCALE_ROADMAP.md`
- `designs/AUTH_PROVIDER_ABSTRACTION.md`
- `designs/NOTICE_CENTER_DESIGN.md`
- `designs/USER_PREFERENCE_DESIGN.md`
- `designs/TASK_CENTER_DESIGN.md`
- `designs/APPROVAL_WORKFLOW_DESIGN.md`
- `designs/SCHEDULER_CENTER_DESIGN.md`
- `designs/REPORT_CENTER_DESIGN.md`
- `designs/ALERT_MONITORING_CENTER_DESIGN.md`

关联合同：
- `contracts/PLATFORM_CONTRACT.md`
- `contracts/SYSTEM_IAM_CONTRACT.md`
- `contracts/SYSTEM_CONFIG_CONTRACT.md`

---

本文不是 `pantheon-base` 与某个业务仓库的逐文件 diff 报告，而是当前底座状态下的一次治理型 drift audit。

这里的 “drift” 指的是：

- 路线图已声明，但缺少设计锚点
- 合同已约束，但实现和验收闭环尚未形成
- 平台层 / 系统域 / 业务域边界容易再次漂移

## 1. TL;DR

截至 2026-05-18，`pantheon-base` 的整体判断是：

- 主架构骨架已成型
- `platform / system/* / business/*` 分层语言清晰
- P2 路线已经明确
- 关键缺口不再是“没有方向”，而是“部分方向只有路线图，没有稳定骨架或验收闭环”

本轮审计已确认并收口的结果：

1. `auth-scale` 缺失的 provider 抽象设计已补齐
2. `platform-ops` 缺失的通知中心、用户偏好、任务中心设计已补齐
3. `enterprise-backoffice` 缺失的审批流、调度中心、报表中心、监控告警中心骨架设计已补齐
4. 明显中间产物目录已清理，避免过程噪音继续留在仓库中

当前最主要的剩余 gap 已经从“缺设计”转为“缺实现闭环与验收资产”。

## 2. Methodology

本次审计采用只读检查与治理归纳，不对现有业务实现脏改动做覆盖。

使用方法：

1. 检查当前设计版图：`docs/designs/*`
2. 对照主锚点文档：
   - `designs/P2_SCALE_ROADMAP.md`
   - `designs/PANTHEON_BASE_ARCHITECTURE_OVERVIEW.md`
   - `contracts/PLATFORM_CONTRACT.md`
3. 核对已声明能力是否具备独立设计锚点
4. 识别明显中间产物目录，仅删除无业务含义的空目录或临时目录
5. 不触碰现有实现层未收口改动，不对脏工作区做大范围重写

## 3. Current Classification

### 3.1 已稳定的基线能力

以下能力已具备较稳定的底座地位：

- 模块化单体总架构
- `platform / system/* / business/*` 语言边界
- 菜单、权限、i18n、模块接入主链路
- `system/auth` 主链路：登录、会话、安全中心、MFA
- `system/iam` 主链路：用户、角色、菜单、权限工作台
- `system/org` 与 `system/config` 基础治理框架
- 数据权限基础能力与部分业务样板

结论：

- 这部分不是当前主要 drift 源
- 后续重点应放在“治理深化”和“产品位补齐”，而不是重做主架构叙事

### 3.2 本轮已补齐的设计 drift

以下项目此前已在路线图或总览中出现，但缺少明确设计锚点；现已补齐：

- `system/auth`
  - `AUTH_PROVIDER_ABSTRACTION.md`
- `platform`
  - `NOTICE_CENTER_DESIGN.md`
  - `USER_PREFERENCE_DESIGN.md`
  - `TASK_CENTER_DESIGN.md`
- `platform / business/*`
  - `APPROVAL_WORKFLOW_DESIGN.md`
  - `REPORT_CENTER_DESIGN.md`
- `platform / system/config / business/*`
  - `SCHEDULER_CENTER_DESIGN.md`
  - `ALERT_MONITORING_CENTER_DESIGN.md`

结论：

- P2 关键产品位已不再只是路线图条目
- 后续实现可以回挂到明确设计，而不是继续凭口头理解扩散

### 3.3 仍未完成的实现 drift

以下问题不是“缺文档”，而是“还缺真实落地闭环”：

#### A. `auth-scale` 仍停留在 ready 边界

现状：

- 已有 `sso-ready / captcha-ready / risk-ready` 方向
- 已补 provider 抽象设计

仍缺：

- 明确的 provider 注册接口与配置模型落地
- 外部身份绑定数据结构与迁移
- 至少一条真实 provider 的接入样板或 mock acceptance

审计判断：

- 这是可控的设计先行状态，不是问题本身
- 风险在于后续若直接在业务里硬接身份源，会重新打破 `system/auth` 边界

#### B. `platform-ops` 缺真实产品化落地

现状：

- 通知中心、用户偏好、任务中心设计已具备

仍缺：

- 统一消息模型代码落地
- 用户偏好持久化字段与会话覆盖的完整接口对齐
- dashboard / 壳层 / 通知 / 任务摘要的统一消费链路

审计判断：

- 这是近期最适合转实现的方向
- 因为它能直接增强平台壳层的真实产品感，同时不会强迫引入大引擎

#### C. `enterprise-backoffice` 仍停留在模块位骨架

现状：

- 审批流、调度中心、报表中心、监控告警中心的边界已定义

仍缺：

- 至少一个真实样板域接入每条产品线
- 最小菜单、权限、审计、跳转链路
- smoke 或回归用例

审计判断：

- 这是“产品位已立、样板未接”的状态
- 若长期停留在这里，未来最容易变成一批空导航或伪入口

### 3.4 验收 drift

现状：

- P2 路线强调自动化验证、smoke、审计和回滚/禁用策略

仍缺：

- 新补骨架设计对应的 acceptance matrix
- 各产品位的最小 smoke 脚本
- 跨 `platform / system/* / business/*` 的统一 evidence 归档

审计判断：

- 当前最容易被忽略的不是设计，而是 machine-verifiable acceptance
- 如果没有这层，后续实现会再次回到“页面做出来了，但无法判断是否符合底座约束”

## 4. Noise And Cleanup

本轮确认并清理的过程性噪音包括：

- `.tmp/`
- `.tmp-trace-user/`
- `test-results/`
- `tmp/cmdb-qa/`
- 空 `tmp/` 目录

未删除项：

- `uploads/profile/`

原因：

- 它更像运行时或样本数据，不应被武断视为中间产物

## 5. Execution Plan

建议按两阶段推进：

### PR-1 已完成

目标：

- 补齐 P2 关键设计骨架

结果：

- 8 份新增设计文档已提交

提交：

- `8543f49 docs(design): add p2 backoffice capability skeletons`

### PR-2 下一阶段建议

目标：

- 把“有设计骨架”推进为“有最小实现闭环”

推荐顺序：

1. `platform-ops`
   - 优先做通知中心 + 用户偏好 + 任务摘要统一链路
2. `auth-scale`
   - 落地 provider 注册接口与外部身份绑定模型
3. `enterprise-backoffice`
   - 选择一个真实样板域接入审批或任务
4. acceptance
   - 为上述能力补 smoke、evidence 和最小验收矩阵

## 6. Risk Notes

主要风险有 4 类：

1. 只补设计不补样板，产品位会长期停留在“空壳能力”
2. 真实实现如果绕过新设计锚点，会把边界再次打散
3. 验收资产缺失会导致“做了但无法证明做对了”
4. 在现有脏工作区里混做大范围文档重写，容易覆盖正在进行的实现工作

## 7. Recommendation

当前 `pantheon-base` 最值得继续推进的不是再写更多路线图，而是把以下闭环补实：

1. 通知中心 / 任务中心 / 用户偏好的最小真实实现
2. provider abstraction 对应的接口与数据模型
3. 至少一个审批或调度样板
4. 与这些能力绑定的 smoke / acceptance / evidence

如果这四项补上，`pantheon-base` 就会从“架构方法和设计都很完整”进一步进入“真正可复制的企业后台底座”状态。

## 8. Timestamp

- 审计时间：2026-05-18
- 审计范围：`pantheon-base` 当前仓库状态
- 审计方式：治理型文档审计 + 设计锚点核对 + 过程产物清理
