# B2 Data Workbench Views

- Priority: `P1`
- Layer: `platform`
- Status: `planned`
- Depends On: B1 的偏好和状态命名约定
- Blocks: Ops 高频列表保存视图

## Outcome

把 `AppTable` 从“可响应式分页表格”升级为按页面显式启用的个人工作视图，同时保持权限、数据和查询边界清晰。

## In Scope

- 稳定 `columnKey`、列显隐、顺序、宽度、密度和恢复默认。
- 页面声明 `viewKey` 后保存列偏好与可序列化筛选/排序状态。
- 配置版本迁移、未知列忽略、权限移除列清理和损坏偏好恢复。
- 列设置面板、保存视图菜单和移动端可用的最小控制。

## Out Of Scope

- 不保存表格行数据、权限结果或敏感筛选值。
- 不要求每个 CRUD 列表启用保存视图。
- 不在未批准前新增后端 schema 或跨设备同步。

## Expected Files

- `frontend/src/components/data-display/AppTable.tsx`
- 表格偏好 helper/hook、测试、fixture 和文档。
- 可能复用现有用户偏好 API；若需要新 schema，先触发 gate。

## Data Contract

- 偏好 key 至少包含 `viewKey`、schema version 和用户/租户隔离上下文。
- 列只通过稳定 key 匹配；label、index 或权限结果不能作为持久化主键。
- 读取失败回落默认视图并提示可恢复，不阻塞数据列表。
- 保存动作节流且可取消；服务端拒绝不能污染当前会话状态。

## Acceptance

1. 列显隐、排序、宽度和密度刷新后可恢复，恢复默认可靠。
2. 列定义升级、权限变化、locale 变化后没有幽灵列或数据泄漏。
3. 390x844 下列设置可操作，表格或卡片模式不因工具栏改变而跳动。
4. 键盘可打开、调整、保存和恢复视图；拖动功能有非拖动替代路径。
5. 只有明确声明 `viewKey` 的页面产生持久化。

## Evidence And Verification

- unit：序列化、版本升级、损坏数据、权限列剔除、locale 无关性。
- Playwright：保存/刷新/恢复默认、用户隔离、mobile settings。
- screenshots：desktop/mobile x default/custom/error-recovery x light/dark。
- `npm run type-check`、目标单测、build、visual suite、`git diff --check`。

## Gates

- 跨设备同步、新后端 schema、租户偏好生命周期由维护者决定。
- 不兼容现有列定义或全局启用高级模式时停止。
