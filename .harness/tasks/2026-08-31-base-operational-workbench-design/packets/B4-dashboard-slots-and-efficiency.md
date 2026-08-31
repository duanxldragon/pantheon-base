# B4 Dashboard Slots And Efficiency

- Priority: `P1-P2`
- Layer: `platform`
- Status: `planned`
- Depends On: B3 registry/types stability
- Blocks: Ops O6

## Outcome

让 Dashboard 接受受控的业务状态、待办、趋势和最近活动，同时补齐最近访问、收藏和键盘导航的低侵入效率合同。

## In Scope

- 新增 `status-summary`、`attention-queue`、`trend-snapshot`、`recent-activity` widget kind。
- 扩展注册校验：owner、permission、cleanup policy、freshness、query budget、empty/error isolation。
- 定义最近访问和收藏的稳定资源引用合同。
- 定义全局导航/命令入口的键盘与权限过滤规则。

## Out Of Scope

- 不在 Base 注册 Ops 业务 widget。
- 不在 Dashboard 放完整日志、复杂表格或无限轮询。
- 不在首版提供用户自由拖拽的无限画布。

## Expected Files

- `frontend/src/modules/platform/widgets.tsx` 及 registry tests。
- Dashboard 渲染、错误边界、资源预算和文档。
- 可能的 recent/favorite shared contract；业务数据仍由 provider 提供。

## Acceptance

1. 一个 widget 失败不阻断 Dashboard，其 stale/error 状态独立可见。
2. 无权限 widget 在请求和渲染前被过滤，不泄露标题或计数。
3. 资源预算能阻止高频轮询和无界数据；时间范围与更新时间可见。
4. mobile 维持扫描顺序，长标题和大数值不改变固定布局。
5. 键盘入口只展示当前权限和当前上下文可执行命令。

## Evidence And Verification

- registry unit tests：必填 metadata、权限过滤、cleanup、预算和未知 kind。
- Playwright：mixed widgets、单 widget error/stale、mobile order、keyboard navigation。
- screenshots：desktop/mobile x populated/empty/partial/error x light/dark。
- foundation consumer fixture：业务 widget 可注册但不复制平台 registry。

## Gates

- 新增后端聚合 API、个性化 Dashboard schema 或全局快捷键冲突策略时停止。
- 最终首页信息密度和优先级由维护者视觉验收。
