---
title: 平台配置治理与低代码菜单重构设计
doc_type: Design
layer: platform
depends_on_layers:
  - system/config
status: Approved
index_group: superpowers-specs
retention_reason: 作为平台导航信息架构调整与低代码工作域上提的设计锚点保留
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/SYSTEM_CONFIG_CONTRACT.md
  - docs/designs/FRONTEND_UI_SPEC.md
  - docs/designs/NAVIGATION_IA_STRATEGY.md
updated_at: 2026-05-13
---

# 平台配置治理与低代码菜单重构设计

---

## 背景

当前 `pantheon-base` 的 `system/config` 页面存在四类问题：

1. `用户管理` 已经失去治理摘要层，页面只剩查询和表格，无法建立全局用户治理视角。
2. `字典管理` 顶部治理统计与下方类型/条目统计重复，信息层次冗余。
3. `系统设置` 总览页仍使用独立 hero/kpi 风格，和其他系统页的统一壳层节奏不一致，分组总览与配置表单的关系也不清晰。
4. `模块管理` 与 `模块生成器` 实际上已形成完整低代码工作区，但仍挂在“平台配置”下，信息架构语义错误。

## 目标

完成一轮平台层和 `system/config` 主域的收敛优化：

- 恢复 `用户管理` 的轻量治理能力，但不回退到大 Hero 看板。
- 去掉 `字典管理` 的重复统计层，保留主任务区和治理入口。
- 统一 `系统设置` 的壳层节奏，让总览页和分组页都回到系统页标准风格。
- 将 `模块管理` 与 `模块生成器` 提升为左侧导航一级菜单，形成独立“低代码平台”工作域。

## 设计决策

### 1. 用户管理

`UserList` 在筛选区之上增加一条轻量 `GovernanceSummaryBar`，指标只保留：

- 用户总数
- 启用账号数
- 停用账号数
- 可分配角色数

右侧治理抽屉承接补充信息：

- 组织归属就绪度
- 角色池就绪度
- 批量动作可用性提示

这样可以恢复治理上下文，但不让用户页重新膨胀成大看板。

### 2. 字典管理

`DictPage` 去掉顶部 `GovernanceSummaryBar`。原因是当前顶部统计和 `DictTypeTab` 内部统计直接重复，且主任务本身就是类型/条目维护。

保留治理抽屉，但将入口迁到页面右上功能区，避免主区出现双层统计。

### 3. 系统设置

`/system/setting` 不再使用 hero + KPI 大卡，而是收敛成标准 `page-panel` 概览壳层：

- 保留分组导航
- 保留风险/数量摘要
- 维持统一的 `system-page-template` 节奏

`/system/setting/:groupKey` 继续保留分组表单和审计能力，但风格继续向统一系统页靠拢，不再像独立产品页。

### 4. 低代码平台

`模块管理` 与 `模块生成器` 提升为左侧导航一级菜单域。第一阶段只调整导航层级和模块归属，不修改现有路由路径：

- 继续使用 `/system/modules`
- 继续使用 `/system/generator`

新增一级菜单域建议命名为 `低代码平台`，其下包含：

- 模块管理
- 模块生成器

这样可以在不打断既有权限、路由和 smoke 的情况下，先完成信息架构纠偏。

## 架构边界

- 主层：`platform`
- 依赖层：`system/config`、`system/iam`
- 变更性质：逻辑跨层，物理主要集中在前端壳层、模块菜单元数据、页面组件与 smoke 契约

## 验收标准

1. 用户管理出现轻量治理摘要条，且不新增大 Hero 卡。
2. 字典管理顶部重复统计消失，主任务区保持类型/条目维护。
3. 系统设置总览和分组页视觉节奏统一，不再保留独立大 Hero 风格。
4. 左侧导航出现一级菜单“低代码平台”，其下包含“模块管理”和“模块生成器”。
5. 现有系统页、治理页相关 smoke 按新壳层契约更新并通过。
