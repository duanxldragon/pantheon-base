---
title: 过度抽象与重复代码治理审查
doc_type: Assessment
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

# 过度抽象与重复代码治理审查

本文记录 2026-06-23 对 `pantheon-base` 的一次维护性审查。审查目标不是压低某个扫描器指标，而是识别两类长期风险：

- 为减少重复而形成的过细抽象、便利层和错误共享层。
- 真实重复代码继续存在，导致业务规则分叉、修复遗漏和模块边界漂移。

本审查只基于当前仓库代码和文档，不包含运行测试结论。

## 1. 治理判断原则

重复治理采用以下判断：

1. **重复语法可以暂时接受，重复业务决策不能接受。**
2. **抽象必须有清晰 owner。** 如果一个抽象没有明确属于平台、auth、iam、governance 或设计系统，就不应进入公共层。
3. **同一变化原因才抽象。** 只是长得像、参数类似、常量相同，不足以抽公共层。
4. **`pkg` 只承载稳定平台能力和跨域契约，不承载领域行为。**
5. **前端共享组件必须表达设计系统或产品语义，不能只是为了少写一层 JSX。**

## 2. 主要发现

### 2.1 高风险：`pkg/authsession` 正在吸收 auth 领域动作

证据：

- `backend/pkg/authsession/session_scope.go` 中既有 `ApplyActiveScope`、`CleanupInactiveSessions`、`CleanupUserOverflowSessions`、`PurgeHistoricSessions`、`LoadSessionIdleMinutes`。
- 当前工作区还出现 `RevokeUserSessions`、`DeleteUserSessions` 这类用户会话生命周期动作。
- `backend/modules/system/iam/user/user_service.go` 中用户重置密码、删除用户时调用这些动作。

判断：

- active session 查询条件和过期清理规则可作为过渡性共享能力存在。
- 吊销用户会话、删除用户会话属于 `system/auth/session` 的领域行为，不应长期放在 `pkg/authsession`。
- `system/iam/user` 不应直接知道 `system_user_session` 表，也不应通过 `pkg` 间接拥有 auth 行为。

### 2.2 高风险：`AuthService` 聚合过粗，真实重复治理被便利抽象绕开

证据：

- `backend/modules/auth/auth_service.go` 同时包含登录、MFA、会话、密码、登录日志、安全事件、运行时设置、清理策略等方法。
- 后端已经有 `backend/modules/auth/login/`、`mfa/`、`security/`、`session/` 子目录，但主服务仍保留大量跨职责行为。

判断：

- 这里的主要问题不是抽象过细，而是拆分不彻底。
- 若为了减少重复继续向 `pkg` 提公共函数，会绕开真正的领域拆分。

### 2.3 中高风险：前端总 barrel 导出弱化边界

证据：

- `frontend/src/components/index.ts` 同时导出 layout、feedback、governance、modal、table、hook、pagination 等能力。
- 业务页面大量从 `../../../components` 导入多类对象。

判断：

- 总出口降低了 import 重复，但也让调用方无法看出依赖的是设计系统、治理组件、反馈组件还是业务工具。
- 后续应按语义分出口，避免一个公共入口吞掉所有前端边界。

### 2.4 中风险：薄 UI 包装有压重复率倾向

证据：

- `PageContainer` 主要是 `div + page-container`。
- `PageActions` 主要是 Arco `Space size={8}`。
- `TABLE_ACTION_COLUMN_WIDTH` 只是操作列宽度常量。
- `RailSummary` 只包含类型定义。

判断：

- 这些抽象不是必须删除，但不能继续无边界扩张。
- 若保留，必须补充明确的设计系统契约，例如响应式、可访问性、密度、布局 slot、交互状态，而不是仅包装类名或数字。

### 2.5 中风险：预制通用 hook 缺少真实使用牵引

证据：

- `useRequest` 当前只发现定义和导出。
- `usePagination` 当前只发现定义。

判断：

- 这类 hook 如果没有真实页面采用，就是提前抽象。
- 后续要么纳入页面模板和生成器统一使用，要么删除，避免形成第二套无人维护的数据请求范式。

### 2.6 合理抽象：治理侧栏和平台契约

证据：

- `GovernanceRail`、`StandardRail`、`SideRail` 表达治理洞察、摘要、侧栏面板等产品语义。
- `pkg/contracts` 中 `BackendModule`、runtime settings reloader、route groups 表达模块化单体和平台运行契约。

判断：

- 这类抽象有明确 owner 和变化原因，属于可以保留并继续治理的方向。
- 但 `pkg/contracts` 不应继续下沉业务便利函数。

## 3. 风险清单

| 风险 | 严重性 | 当前表现 | 目标状态 |
| --- | --- | --- | --- |
| 公共包承载领域动作 | 高 | `pkg/authsession` 出现会话吊销/删除动作 | 领域动作回到 `auth/session`，跨域只通过契约调用 |
| Auth 主服务继续膨胀 | 高 | `auth_service.go` 承载多条业务链路 | 按 login/session/mfa/password/security/log 拆分 owner |
| 前端公共出口过宽 | 中高 | `components/index.ts` 导出所有共享能力 | 按 patterns/governance/feedback/table 分层导入 |
| 薄包装组件过多 | 中 | 组件只包类名、Space、常量 | 保留有设计契约的组件，删除或内联纯语法包装 |
| 提前抽象 hook | 中 | hook 定义后无真实调用 | 用真实页面牵引或移除 |
| 重复业务决策未显式治理 | 中 | 重复治理容易只看表面代码 | 用“重复业务决策”作为整改单位 |

## 4. 审查结论

当前代码库同时存在两种相反问题：

- 有些地方为了减少重复，抽象过细或归属错误。
- 有些核心域仍然聚合过粗，真实重复逻辑被留在大服务里。

后续治理不能回到“看到重复就抽公共函数”的路线，也不能接受重复代码无界增长。正确方向是：先按领域 owner 分清边界，再消除同一 owner 内的重复业务决策。

