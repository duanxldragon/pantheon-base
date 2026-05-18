# IAM Remediation And Config Governance Design

更新时间：2026-05-12

类型：Design
主层：system/iam
依赖层：system/config
状态：Approved
索引分组：superpowers-specs
保留原因：作为 `system/iam` 整改治理与 `system/config` 高敏页面收口的跨模块设计锚点保留

关联合同：
- `docs/contracts/SYSTEM_IAM_CONTRACT.md`
- `docs/contracts/SYSTEM_CONFIG_CONTRACT.md`
- `docs/designs/PANTHEON_BASE_ARCHITECTURE_OVERVIEW.md`
- `docs/designs/FRONTEND_UI_SPEC.md`

---

## 1. 目标

本轮只做两件事：

1. 把 `system/iam` 的权限工作台从“发现型治理”推进到“整改型治理”
2. 把 `system/config` 下高敏能力页面收敛到统一的页面准入和导航壳

本轮不做新的“统一治理中心”，不重做整套 IA，不把 `system/config` 再拆成新系统域。

---

## 2. 范围边界

### 2.1 主层：`system/iam`

本轮只处理 `frontend/src/modules/system/permission/*` 与 `backend/modules/system/iam/permission/*`。

目标不是重写权限模型，而是把现有 `workbench / remediate / remediation events` 这条链路变成用户可执行、可回看、可追踪的整改工作流。

### 2.2 依赖层：`system/config`

本轮只处理以下高敏页的准入规则、页头动作和主区结构：

- `/system/i18n`
- `/system/modules`
- `/system/generator`
- `/system/setting`
- `/system/setting/:groupKey`

目标不是新增功能，而是统一这些页面的进入方式、主次区分和治理节奏，避免继续各长各的。

### 2.3 非目标

以下内容不在本轮：

- 新建独立治理中心路由
- 把角色页、菜单页、组织页都并入同一个整改中心
- 重做动态模块、生成器、i18n 的后端能力模型
- 增加新的多租户、SSO、风控能力

---

## 3. 现状问题

### 3.1 `system/iam` 问题

权限工作台已经能：

- 发现角色页面权限和接口权限缺口
- 解释未知权限和覆盖状态
- 对接口缺口执行一次性修复
- 记录 remediation events

但还停留在“发现后你自己理解”的阶段，缺少：

- 面向整改的默认视图
- 面向角色的整改状态
- 面向治理动作的时间线和最近处理结果
- 区分“待处理”和“已处理”的摘要口径

### 3.2 `system/config` 问题

`/system/i18n`、`/system/modules`、`/system/generator`、`/system/setting*` 都已经带治理语义，但页面结构并不统一：

- 有的页头只给标题，有的页头塞了大量动作
- 有的主区先讲概念再给操作，有的直接进入操作
- 有的页面把高敏动作散在多处，有的页面没有明确“治理主任务”

结果是：用户能感觉到这些页都很重要，但无法快速分辨“当前页的主任务是什么”。

---

## 4. `system/iam` 设计

### 4.1 工作台定位

`/system/permission` 的 `workbench` 页签继续保留，但定位从“权限体检报表”调整为“权限整改任务台”。

页面语义改成：

- 默认先看待整改角色
- 再看整改明细
- 最后看原始覆盖数据

### 4.2 摘要口径

当前摘要偏“角色数 / 分配数 / 缺口数”。本轮改成更接近整改语义的四项：

1. 待整改角色数
2. 已整改角色数
3. 未知权限分配数
4. 最近整改动作数

定义：

- `待整改角色`：存在 `page gap`、`api gap` 或 `unknown permission` 的角色
- `已整改角色`：最近存在 remediation event，且当前已无 `api gap`
- `未知权限分配数`：沿用现有 unknown assignment 统计
- `最近整改动作数`：最近一段 remediation events 数量，先以最近 20 条为窗口

本轮不新增复杂任务表，只在现有 workbench 结果上派生治理状态。

### 4.3 角色状态

每个角色在工作台新增治理状态标签：

- `待整改`
- `已整改`
- `无需处理`

判定顺序：

1. 有缺口或未知权限：`待整改`
2. 无缺口且有整改事件：`已整改`
3. 无缺口且无整改事件：`无需处理`

这样用户一眼能分清“还没动过”与“已经处理过”。

### 4.4 默认筛选

进入 `workbench` 时默认展示全部角色：

- 角色维度浏览优先，避免 `clean` 角色因为默认视图被直接隐藏
- 待整改角色通过摘要卡、治理状态列与 `pending / all` 切换前置
- 显式切到 `pending` 时，才只聚焦 `page-gap` / `api-gap` 角色

首屏仍然必须服务整改，但整改优先不应破坏“按角色查看权限结果”的基础能力。

### 4.5 详情侧栏

详情侧栏继续保留，但内容顺序改成：

1. 当前治理状态
2. 本角色当前缺口摘要
3. 可执行整改动作
4. 最近整改时间线
5. 原始权限覆盖明细

时间线不只回显原始 event 行，而是要能读出：

- 什么问题
- 何时处理
- 处理结果是 `remediated` 还是 `noop`
- 创建了多少策略

### 4.6 本轮后端要求

后端能力不重做，只补足前端闭环所需聚合字段。优先策略：

- 能从现有 `GetWorkbench` 和 `ListWorkbenchRemediationEvents` 派生的，尽量前端派生
- 只有当前端派生会导致多次请求或状态判断重复时，才给 `GetWorkbench` 增加轻量摘要字段

本轮不新增独立“整改任务表”。

---

## 5. `system/config` 设计

### 5.1 页面分层

`system/config` 高敏页分成两组：

1. 配置治理页
   - `/system/setting`
   - `/system/setting/:groupKey`
   - `/system/i18n`

2. 模块治理页
   - `/system/modules`
   - `/system/generator`

### 5.2 页面准入规则

这些页面统一遵循同一套准入规则：

1. 页头只表达当前页主任务，不重复右侧功能栏导航
2. 主区第一屏只能有一个治理摘要容器
3. 高敏动作必须收束到页头动作区、表格头，或治理抽屉中
4. 不允许再新增大段“说明卡片墙”
5. 不允许页面同时承担“概览中心 + 详情编辑器 + 说明长文”三种职责

### 5.3 导航关系

不增加新菜单层级，只统一关系表达：

- `/system/modules` 是“已接入模块治理”
- `/system/generator` 是“新模块接入入口”
- `/system/setting` 是“配置概览入口”
- `/system/setting/:groupKey` 是“单组配置编辑页”
- `/system/i18n` 是“运行时语言资产治理页”

页面跳转必须通过：

- 面包屑
- 页头返回
- 页头主动作

不再通过右侧冗余菜单二次表达“你现在在哪”。

### 5.4 主区结构规则

#### `/system/modules`

保留现有注册表表格，但首屏结构改成：

- `PageHeader`
- 紧凑治理摘要
- 模块注册表表格

说明性 Alert 只保留最关键一条，不再多段堆叠。

#### `/system/generator`

保留向导本体，不新增大块背景说明。

页头动作只保留和当前向导相关的入口，不再让它承担注册表概览说明。与 `/system/modules` 的关系通过页头跳转表达。

#### `/system/i18n`

保留现有治理摘要和治理抽屉，但要收紧主区层次：

- 首屏是治理摘要 + 查询过滤 + 主表
- 生命周期审计、重复 key、占位问题等继续放在治理抽屉或次级面板，不让主区成为资产清单大全

#### `/system/setting`

维持总览页定位，只负责分组入口和运行摘要。

#### `/system/setting/:groupKey`

维持分组页定位，只负责单组配置编辑和必要审计卡，不重新引入总览说明区。

---

## 6. 实施顺序

### 阶段 1：权限工作台整改闭环

- 调整 workbench 摘要口径
- 增加角色治理状态
- 默认首屏切到待整改视角
- 重组详情侧栏与整改时间线
- 更新契约文档和 smoke

### 阶段 2：`system/config` 高敏页壳统一

- 收紧 `/system/modules` 页头与主区
- 收紧 `/system/generator` 页头与主区
- 收紧 `/system/i18n` 主区层次
- 校准设置总览 / 分组页与高敏页规则的一致性
- 更新前端规范和 smoke

---

## 7. 验收标准

### 7.1 `system/iam`

- 权限工作台首屏默认展示全部角色，并保留待整改聚焦切换
- 角色行能明确区分 `待整改 / 已整改 / 无需处理`
- 详情侧栏能看见整改时间线而不是只看原始事件
- 修复动作执行后，摘要、状态和时间线同步变化

### 7.2 `system/config`

- `/system/modules`、`/system/generator`、`/system/i18n`、`/system/setting*` 首屏都符合统一壳规则
- 不存在右侧冗余导航重复表达当前页位置
- 不存在新增的大块说明卡片墙
- 高敏动作都能在清晰的单一位置找到

### 7.3 测试

- `go test ./backend/...`
- `frontend` 下 `npm run type-check`
- 定向 smoke：
  - `tests/smoke/system/governance/*permission*`
  - `tests/smoke/platform/shell-visual-contract.spec.ts`
  - `tests/smoke/system/system-pages.spec.ts`

---

## 8. 风险与控制

### 风险 1：把整改闭环做成新的复杂工作流

控制：

- 本轮不引入独立任务表
- 只在现有 workbench 和 remediation event 基础上派生状态

### 风险 2：`system/config` 再次抽象过度

控制：

- 不新建治理中心
- 不改现有主路由层级
- 只统一页头、摘要、主区节奏和高敏动作位置

### 风险 3：测试继续跟旧 IA 绑定

控制：

- 本轮同步更新 smoke 的页面合同
- 测试以“页面职责”和“结构准入规则”为断言中心，不再写死旧布局假设
