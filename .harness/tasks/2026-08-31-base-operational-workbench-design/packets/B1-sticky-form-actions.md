# B1 Sticky Form Actions

- Priority: `P0`
- Layer: `platform`
- Status: `planned`
- Depends On: none
- Blocks: Ops long-form create/edit and pre-execution flows

## Outcome

让 `SubmitBar` 在长表单中持续暴露主操作、未保存状态和表单级错误，同时保持历史页面默认行为不变。

## In Scope

- 为 `SubmitBar` 增加显式 sticky 模式、容器安全空间和窄屏动作收纳。
- 定义 idle、dirty、submitting、success、error、conflict 状态。
- 提供表单页 fixture 或示例路由用于视觉和交互验证。
- 更新共享组件文档、类型测试和 i18n 示例。

## Out Of Scope

- 不改变所有现有表单的默认布局。
- 不实现业务保存、权限或冲突解决逻辑。
- 不新增全局 fixed footer。

## Expected Files

- `frontend/src/components/patterns/actions/SubmitBar.tsx`
- 对应样式、测试、fixture 和组件文档。
- 不触碰 `frontend/src/modules/business/**`。

## UX Contract

- sticky 区不能遮挡最后字段、校验信息、Toast 或移动端安全区域。
- submitting 阶段阻止重复提交并保留可感知进度；错误后焦点进入错误摘要或首个非法字段。
- 窄屏保持一个主操作可见，次操作进入有名称和 tooltip 的菜单。
- 页面离开提示只在调用方声明 dirty tracking 时启用。

## Acceptance

1. 未启用 sticky 的历史快照无非预期变化。
2. 1440x900 与 390x844 下滚动到任意位置均能访问主操作，内容不被遮挡。
3. 长中英文按钮、200% 缩放、软键盘/安全区不产生溢出。
4. 键盘可完成提交、取消和错误恢复；焦点可见且顺序正确。
5. 明暗主题与 reduced motion 通过。

## Evidence And Verification

- unit/type test：默认模式、sticky 模式、disabled/submitting、action overflow。
- Playwright：长表单滚动、最后字段可见、重复提交防护、错误聚焦。
- screenshots：desktop/mobile x idle/submitting/error x light/dark。
- `npm run type-check`、`npm run test`、目标 visual suite、`git diff --check`。

## Gates

- 需要改变历史默认行为时停止。
- 引入新的全局导航/页面布局合同或不兼容 props 时停止。
- 完成后只进入 foundation release 候选，不直接修改 Ops。
