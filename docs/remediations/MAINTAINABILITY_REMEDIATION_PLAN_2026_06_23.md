---
title: 可维护性与重复代码整改计划
doc_type: Remediation
layer: platform
depends_on_layers:
  - system/auth
  - system/iam
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/SYSTEM_AUTH_CONTRACT.md
  - docs/contracts/SYSTEM_IAM_CONTRACT.md
updated_at: 2026-06-23
---

# 可维护性与重复代码整改计划

本文承接 [过度抽象与重复代码治理审查](../assessments/ABSTRACTION_AND_DUPLICATION_AUDIT_2026_06_23.md)，用于指导后续代码整改。

本计划不以 Sonar 或其他单一工具指标为目标。代码重复率仍然需要治理，但治理目标是维护性、边界清晰度和业务规则一致性。

## 1. 整改目标

1. 消除重复业务决策，避免同一规则在多个文件各自演化。
2. 收口错误抽象，避免公共层吸收领域行为。
3. 让前后端模块结构能对照，便于长期维护。
4. 保留必要重复，避免为了少几行代码引入无 owner 的抽象。

## 2. 非目标

- 不为了压低数字抽象叶子 JSX、常量或一次性辅助函数。
- 不新增依赖来替代当前代码结构问题。
- 不一次性全仓重构。
- 不把 `pkg` 扩张为业务工具箱。

## 3. 整改顺序

### P0：冻结错误方向

目标：阻止新债务继续进入公共层。

- `pkg/authsession` 不再新增领域动作。
- 新增跨域调用必须先说明 owner：平台契约、auth/session、iam/user、governance、design system。
- 前端新增共享组件必须说明设计契约，不允许只包装一个类名、数字或第三方组件默认参数。
- 大 barrel 新增导出前必须确认是否有更窄的语义出口。

验收：

- 代码评审中能指出新增抽象的 owner 和变化原因。
- 涉及 auth/session 的改动不再新增 `pkg/authsession` 领域函数。

### P1：修正 auth/session 与 iam/user 边界

目标：用户管理可以触发会话生命周期变化，但不拥有会话实现。

整改项：

1. 在 `system/auth/session` 内定义会话生命周期服务，承载 revoke/delete/cleanup 等领域动作。
2. 为 `system/iam/user` 提供窄契约，例如 `RevokeSessionsForUser`、`DeleteSessionsForUser`。
3. `system/iam/user` 删除对 `system_user_session` 表结构和 `pkg/authsession` 领域动作的依赖。
4. `pkg/authsession` 只保留过渡期的 active scope / cleanup 查询规则；若 session 服务接管后无外部必要性，再继续收口。

验收：

- 重置密码、禁用用户、删除用户仍能正确吊销或清理会话。
- `iam/user` 不直接写 `system_user_session`。
- `pkg/authsession` 不包含用户会话生命周期命令式动作。

### P2：拆分 `AuthService` 的真实职责

目标：用领域内拆分消除重复和大服务膨胀，而不是继续提公共函数。

建议拆分 owner：

- `auth/login`：登录、来源/IP 节流、失败记录。
- `auth/session`：创建、刷新、吊销、活动时间、管理员会话治理。
- `auth/mfa`：challenge、TOTP 因子、密钥加解密接入。
- `auth/password`：修改密码、历史密码、过期判断。
- `auth/security`：安全事件、安全中心汇总。
- `auth/log`：登录日志查询、导出、清理。
- `auth/settings`：认证运行时策略读取和刷新。

验收：

- `auth_service.go` 只保留编排或 facade，不继续承载所有私有函数。
- 同一业务规则只有一个 owner，例如 session idle、max active sessions、password history。
- 原有 auth 测试迁移到对应子域，覆盖主链路。

### P3：前端共享层收口

目标：共享组件表达稳定界面语义，而不是只减少 import 或 JSX 重复。

整改项：

1. 将 `components/index.ts` 的新增导出冻结，逐步引导页面使用窄出口：
   - `components/patterns/layout`
   - `components/patterns/table`
   - `components/patterns/modals`
   - `components/governance`
   - `components/feedback`
2. 评估薄包装组件：
   - `PageContainer`：若要保留，补齐页面布局契约；否则允许局部 `div className="page-container"`。
   - `PageActions`：若只包 `Space size=8`，优先内联或合并到更有语义的 header/action 组件。
   - `TableAction`：改名为设计 token 或并入表格列规范，不继续堆业务常量。
3. `useRequest`、`usePagination` 必须由真实页面模板采用；若没有采用计划，删除。

验收：

- 新页面导入路径能反映依赖语义。
- 薄组件要么具备设计契约，要么被删除或内联。
- hook 不保留未使用的预制抽象。

### P4：建立重复代码分类审查

目标：重复治理有统一尺度。

分类：

| 类型 | 处理方式 |
| --- | --- |
| 重复业务决策 | 必须收口到领域 owner |
| 重复安全/权限/认证规则 | 必须收口并补测试 |
| 重复 API 协议转换 | 优先收口到 DTO/mapper/template |
| 重复页面模板结构 | 进入页面模板或生成器 |
| 重复 JSX 布局语法 | 可接受，除非已形成稳定设计系统模式 |
| 重复常量数字 | 只有成为设计 token 或协议常量时才抽象 |

验收：

- 每个整改 PR 说明消除的是哪类重复。
- 不再用“重复率下降”单独证明整改正确。

## 4. 建议任务切分

| 批次 | 范围 | 输出 |
| --- | --- | --- |
| Batch 1 | auth/session 与 iam/user 边界 | 契约 + 服务迁移 + 测试 |
| Batch 2 | AuthService 子域拆分 | login/session/password/mfa/security/log owner 清晰 |
| Batch 3 | 前端公共出口收口 | 窄出口导入、薄组件决策 |
| Batch 4 | 生成器和页面模板 | 重复页面结构进入模板，不散落页面 |
| Batch 5 | 重复分类检查 | 文档和 review checklist 固化 |

## 5. 验证要求

- 后端变更：至少运行受影响包测试；涉及 auth/iam 时运行对应模块测试。
- 前端变更：至少运行 lint/build；涉及页面结构时补页面 smoke 或人工验收记录。
- 文档变更：运行 frontmatter/link 检查。
- 若某项验证无法运行，必须记录原因和替代证据。

