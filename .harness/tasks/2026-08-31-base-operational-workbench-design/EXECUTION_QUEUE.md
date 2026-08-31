# Base Operational Workbench Execution Queue

## Sequencing

| Batch | Packet | Can Run With | Blocks |
| --- | --- | --- | --- |
| A | B1 Sticky form actions | B5 | Ops long-form workbenches |
| A | B5 Visual and content contract | B1 | all UI completion claims |
| B | B2 Data workbench views | B3 | Ops saved views |
| B | B3 Operational primitives | B2 | Ops deploy/log/diff/selector workbenches |
| C | B4 Dashboard slots and efficiency | none | Ops dashboard widgets |

## Packets

- [B1 Sticky Form Actions](./packets/B1-sticky-form-actions.md)
- [B2 Data Workbench Views](./packets/B2-data-workbench-views.md)
- [B3 Operational Primitives](./packets/B3-operational-primitives.md)
- [B4 Dashboard Slots and Efficiency](./packets/B4-dashboard-slots-and-efficiency.md)
- [B5 Visual Regression and Content Contract](./packets/B5-visual-and-content-contract.md)

## Release Rule

每个 packet 独立收集 evidence 和 review。只有被 Ops 实际需要的最小 packet 集合通过后，才发布 foundation release；不得以“设计已写”替代实现、渲染或 consumer 验证。

## Shared Acceptance Matrix

所有 packet 都要验证桌面/移动、明/暗主题、loading/empty/error/forbidden、长中英文、键盘焦点、200% 缩放和 reduced motion。运行态组件额外验证 stale、partial failure、断线恢复和无布局跳动。
