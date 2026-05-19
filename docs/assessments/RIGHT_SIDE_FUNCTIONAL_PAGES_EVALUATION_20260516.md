---
title: 右侧功能页面布局与功能性系统评估报告
doc_type: Assessment
layer: platform
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-05-16
---

# 右侧功能页面布局与功能性系统评估报告

English version: [RIGHT_SIDE_FUNCTIONAL_PAGES_EVALUATION_20260516.en.md](./RIGHT_SIDE_FUNCTIONAL_PAGES_EVALUATION_20260516.en.md)

## 1. 评估目标

本报告面向登录后的右侧功能页面体系，评估两个维度：

- 布局质量：信息层级、壳层一致性、过滤区/功能栏/表格区节奏、响应式安全性、状态页完整性。
- 功能性：页面是否具备稳定的任务闭环、高频操作是否顺手、复杂页面是否存在明显的交互负担或治理风险。

本报告最初作为优化评估输出；2026-05-16 已按实施结果完成一次执行回写，落地状态见第 10 节。

## 2. 评估范围

本轮覆盖 18 个右侧功能页面：

- `/dashboard`
- `/auth/security`
- `/system/profile`
- `/system/user`
- `/system/user/1`
- `/system/role`
- `/system/menu`
- `/system/permission`
- `/system/operation-log`
- `/system/dept`
- `/system/post`
- `/system/dict`
- `/system/setting`
- `/system/i18n`
- `/system/login-log`
- `/system/session`
- `/system/modules`
- `/system/generator`

页面清单基于：

- [full-system-pages.spec.ts](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/tests/smoke/platform/full-system-pages.spec.ts)
- [system-pages.spec.ts](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/tests/smoke/system/system-pages.spec.ts)
- [system-page-admission.json](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/config/system-page-admission.json)

## 3. 方法与证据

本次评估采用两条证据链并行：

1. `impeccable` 视角的 UI 质量门禁
   - 检查页面类型、骨架一致性、布局节奏、状态页、响应式与视觉契约。
2. `qa-only` 视角的报告型验证
   - 以现有 Playwright smoke 与视觉契约用例作为渲染证据，不做实现变更。

已纳入的核心证据：

- `full-system-pages.spec.ts`：**57 passed**
  - 覆盖 `pc 1440x900`、`pad 1024x768`、`phone 390x844`
  - 验证 18 个页面可达、标题可见、无 broken state、无运行时错误
- `system-pages.spec.ts`：**55 passed**
  - 覆盖系统治理、设置、i18n、权限、会话、语言偏好、跨页选择等关键流程
- `backoffice-ui-visual.spec.ts + shell-visual-contract.spec.ts`：**26 passed / 2 failed**
  - 其中 `backoffice-ui-visual.spec.ts` 全绿
  - 两个失败均来自 `shell-visual-contract.spec.ts`

源码层交叉核验表明，系统治理类页面已经大面积收敛到同一工作台骨架：

- `PageContainer`
- `FilterPanel`
- `ListHeaderActions`
- `TableBatchActionBar`
- `GovernanceInsightDrawer`
- `PageLoading / PageEmpty / PageError`

对应样本可见于：

- [UserList.tsx](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/modules/system/user/UserList.tsx)
- [RoleList.tsx](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/modules/system/role/RoleList.tsx)
- [MenuList.tsx](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/modules/system/menu/MenuList.tsx)
- [PermissionList.tsx](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/modules/system/permission/PermissionList.tsx)
- [DeptList.tsx](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/modules/system/dept/DeptList.tsx)
- [PostList.tsx](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/modules/system/post/PostList.tsx)
- [DictPage.tsx](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/modules/system/dict/DictPage.tsx)
- [I18nList.tsx](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/modules/system/i18n/I18nList.tsx)

## 4. 总体结论

当前右侧功能页体系已经具备较成熟的壳层一致性和功能稳定性，优化重点应从“重构布局”转向“收紧视觉契约、补深关键场景覆盖、规范高频交互模式”。

从专业角度判断：

- 不建议再对整体布局骨架做大改。
- 现阶段最有价值的优化，不是重做页面，而是收敛细节标准和补齐关键页面的任务深度。
- 右侧页面整体已处于“可定稿并进入精修治理”的阶段。

## 5. 分组评估

### 5.1 平台与个人工作台

覆盖页面：

- `/dashboard`
- `/auth/security`
- `/system/profile`
- `/system/user/1`

评估结论：

- 布局方向正确。`Dashboard` 偏总览，`SecurityCenter` 采用 `PageSplitLayout`，`ProfileCenter` 保持轻量资料工作台，信息结构符合页面职责。
- 页面状态完整性良好，已覆盖 loading / empty / error 等基础状态。
- 风险不在布局，而在功能场景深度。相较治理页，这组页面的自动化验证更多停留在“可达且可显示”，深任务链验证偏少。

结论等级：**稳定，但需要补深关键任务路径**

### 5.2 治理工作台

覆盖页面：

- `/system/user`
- `/system/role`
- `/system/menu`
- `/system/permission`
- `/system/dept`
- `/system/post`
- `/system/dict`
- `/system/i18n`

评估结论：

- 这是当前最成熟的一组页面。
- 骨架高度统一，过滤区、功能栏、批量条、治理抽屉、表格卡片的组合已经形成稳定范式。
- 用户、角色、菜单、权限、部门、岗位、字典、国际化都已具备明确的任务闭环。
- 主要问题不是缺功能，而是存在少量视觉契约漂移，以及行内操作模式尚未完全标准化。

结论等级：**成熟，可作为平台后台页面标准模板**

### 5.3 审计控制台

覆盖页面：

- `/system/login-log`
- `/system/session`
- `/system/operation-log`

评估结论：

- 页面结构与治理页保持一致，便于运维与审计类任务快速切换。
- 列表页心智成本低，审计摘要抽屉与筛选器位置稳定，适合高频排查。
- 后续优化重点应放在筛选密度、响应性能与长表格信息扫描效率，而不是布局改造。

结论等级：**稳定，适合持续做密度和检索效率优化**

### 5.4 配置与低代码工作区

覆盖页面：

- `/system/setting`
- `/system/modules`
- `/system/generator`

评估结论：

- `系统设置` 已接近成熟配置工作区，分组导航与配置内容区的关系清晰。
- `模块注册表` 保持工作台风格，结构稳定。
- `模块生成器` 功能强，但信息密度高、单页复杂度大，更容易在窄屏和长流程下累积使用负担。

结论等级：**设置成熟，低代码页可用但需要持续控复杂度**

## 6. 关键发现

### P1: 过滤控件高度出现正式契约漂移

这是本轮最明确、最可量化的布局问题。

在 `shell-visual-contract.spec.ts` 中，过滤区首个控件与操作按钮需要满足共享变量 `--shell-filter-control-min-height` 的最小高度约束。当前稳定失败的两个场景显示：

- 用户管理过滤区
- 字典管理双 tab 过滤区

根症状一致：

- 实际首个控件高度：**32px**
- 契约最小高度：**34px**

这说明问题不是页面结构错误，而是公共视觉节奏被个别控件打破。它会导致：

- 同类治理页在视觉上“差一点整齐”
- 过滤区与功能栏的正式感下降
- 后续继续扩页时，样式漂移风险被复制

处理建议：

- 以公共过滤控件高度契约为唯一来源，禁止页面级私有覆写。
- 修复顺序先从 `/system/user` 与 `/system/dict` 开始，再做一次治理页全量回归。

### P2: 平台型页面的功能验证深度弱于治理页

`/dashboard`、`/auth/security`、`/system/profile`、`/system/user/1` 的当前证据更偏向：

- 页面可达
- 标题正确
- 主体已渲染
- 无明显错误态

但相比 `/system/setting`、`/system/i18n`、治理页矩阵，它们缺少更多任务链验证，例如：

- 安全中心多区块之间的跳转与刷新节奏
- 个人中心资料更新后的回显与持久化体验
- 用户详情的导航闭环与上下文返回体验
- 工作台卡片的空态、权限态与窄屏重排

这不是线上缺陷证据，但属于测试覆盖不均衡带来的盲区。

处理建议：

- 将该组页面纳入“任务链补测”而不是“布局重做”。
- 优先补安全中心、个人中心、用户详情三页的深任务 smoke。

### P2: 高频行内操作已可用，但标准化程度还不够

从 [UserList.tsx](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/modules/system/user/UserList.tsx)、[RoleList.tsx](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/modules/system/role/RoleList.tsx)、[MenuList.tsx](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/modules/system/menu/MenuList.tsx)、[PermissionList.tsx](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/modules/system/permission/PermissionList.tsx)、[DeptList.tsx](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/modules/system/dept/DeptList.tsx)、[PostList.tsx](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/modules/system/post/PostList.tsx) 可以看到，多数组件仍是各页自行拼装 `Space + Popconfirm + Button` 的行内操作。

这带来两个问题：

- 操作文案、危险动作位置、更多操作折叠策略容易逐页分叉
- 后续做权限、禁用态、loading 态收敛时，改动面会偏大

当前它不是阻塞问题，但已经值得进入治理清单。

处理建议：

- 为治理类列表统一定义“主操作 + 次操作 + 危险操作”的行级模式。
- 优先规范用户、角色、部门、岗位四类高频管理页。

### P3: 状态重页面复杂度高，后续要防止继续堆叠

`字典管理`、`国际化管理`、`系统设置`、`模块生成器` 都属于状态密集型页面。当前它们已经可用，但复杂度累积风险明显高于普通列表页。

尤其是：

- `DictPage` 双 tab 主从结构
- `I18nList` 导入导出、批量操作、重命名、发布流
- `Setting` 配置分组与内容区联动
- `ModuleWizard` 长流程、多步骤、多配置输入

处理建议：

- 对这类页面的优化目标应是“减认知负担”，不是“加更多卡片或信息块”。
- 每次新增功能都应优先审查是否破坏原有主任务路径。

## 7. 优化优先级建议

### 第一阶段：收紧正式契约

目标：先把已经暴露出来的显性不一致收口。

- 修复治理页过滤控件最小高度漂移
- 对 `/system/user`、`/system/dict`、`/system/role`、`/system/post` 做一次过滤区节奏复核
- 让 `shell-visual-contract` 重新全绿

### 第二阶段：补齐任务链验证

目标：把“能打开”提升为“关键工作可稳定完成”。

- 为 `/auth/security` 补多区块操作 smoke
- 为 `/system/profile` 补资料更新与回显 smoke
- 为 `/system/user/1` 补详情页返回与上下文链 smoke
- 为 `/dashboard` 补空态、权限态、窄屏重排 smoke

### 第三阶段：统一高频交互模式

目标：减少未来扩页时的分叉成本。

- 统一治理类列表行级操作模式
- 统一“更多操作”折叠规则
- 统一危险操作确认文案、禁用态与加载态表达

### 第四阶段：控制复杂页面继续膨胀

目标：防止状态密集页演变成难维护工作台。

- 字典、国际化、设置、生成器新增需求前先审查主任务路径
- 复杂页优先拆职责，不优先堆视觉层
- 对低代码页持续补窄屏与长流程场景验证

## 8. 结论摘要

如果只给一个专业判断：

**当前右侧功能页面体系可以定性为“骨架成熟、功能稳定、进入精修治理阶段”。**

最重要的不是继续改页面结构，而是：

1. 修掉已经被视觉契约明确捕获的细节漂移。
2. 补深平台型页面的任务链验证。
3. 统一治理类高频交互模式。
4. 控制状态密集页的复杂度增长。

在没有新增业务目标的前提下，不建议再发起大范围布局重构。

## 9. 已知剩余风险

本轮已完成计划内优化与最小验证集回归，当前不存在阻塞性交付问题；剩余风险主要是后续维护风险，而不是当前质量缺口：

- `system-pages.spec.ts` 中对 `dict` 双 tab 数量、`generator` 四步流程数量存在结构性断言；若页面结构未来扩展，测试需要同步维护。
- `setting smoke: logout clears explicit theme and falls back to default theme` 曾在一次全量烟测中出现过单次波动，后续独立重跑与最终回归均通过，当前仅记录为低概率波动观察项。
- Playwright 在 Windows 下关闭额外 browser context 时曾出现一次产物清理 `ENOENT`，已在当前 spec 内做窄范围收口，不影响业务断言，但后续如升级 Playwright 仍建议观察。
- 本报告仍以自动化渲染与契约证据为主，未追加人工逐页视觉审阅附录。

因此，本报告可作为当前阶段的收口依据，但不应被解读为后续演进已完全无维护成本。

## 10. 执行回写（2026-05-16）

### 10.1 优化项闭环状态

- `P1` 过滤控件高度契约漂移：**已关闭**
  - 已补齐共享过滤控件样式契约，覆盖 `input.arco-input` 场景，治理页过滤区与功能栏节奏重新收口。
- `P2` 平台型页面任务链覆盖偏浅：**已关闭**
  - 已为 `/dashboard`、`/auth/security`、`/system/profile`、`/system/user/1` 增补浅工作流可达性与任务深度 smoke。
- `P2` 高频行内操作标准化不足：**第一阶段已关闭**
  - 已抽出统一的 `SystemRowActions` 模式，并落到用户、角色、部门、岗位四类高频治理页。
  - 本阶段只统一呈现语法，不额外发明业务动作。
- `P3` 状态重页面复杂度缺少防回归护栏：**已关闭**
  - 已为 `dict`、`i18n`、`setting`、`generator` 增加结构性 guardrail，约束主任务面优先级、摘要位置、辅助动作从属关系和窄屏可读性。

### 10.2 最终验证结果

以下结果均为 2026-05-16 的 fresh verification：

- `cmd /c npm run type-check`：**passed**
- `cmd /c npm run test:smoke:shell-visual-contract`：**20 passed**
- `cmd /c npm run test:smoke:system:pages`：**66 passed**
- `cmd /c npm run test:smoke:backoffice-ui`：**20 passed**

其中，Task 4 的规范复审也已完成，当前无剩余 spec gap。

### 10.3 本次回写涉及的主要实现

- 共享过滤契约修复：
  - [frontend/src/index.css](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/index.css)
- 行内操作标准化：
  - [frontend/src/components/patterns/SystemRowActions.tsx](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/components/patterns/SystemRowActions.tsx)
  - [frontend/src/modules/system/user/UserList.tsx](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/modules/system/user/UserList.tsx)
  - [frontend/src/modules/system/role/RoleList.tsx](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/modules/system/role/RoleList.tsx)
  - [frontend/src/modules/system/dept/DeptList.tsx](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/modules/system/dept/DeptList.tsx)
  - [frontend/src/modules/system/post/PostList.tsx](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/modules/system/post/PostList.tsx)
- 任务深度与复杂页护栏：
  - [frontend/tests/smoke/system/system-workspace-task-depth.ts](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/tests/smoke/system/system-workspace-task-depth.ts)
  - [frontend/tests/smoke/system/system-pages.spec.ts](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/tests/smoke/system/system-pages.spec.ts)
  - [frontend/tests/smoke/platform/backoffice-ui-visual.spec.ts](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/tests/smoke/platform/backoffice-ui-visual.spec.ts)
