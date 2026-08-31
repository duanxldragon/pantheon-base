# Stateless Handoff

## Outcome

本包把运维工作台能力收敛为 Base-owned 共享合同，并拆为 B1-B5。当前只完成设计，不代表任何组件已经实现或通过视觉验收。

## Start Protocol

1. 阅读 `AGENTS.md`、`DESIGN.md` 和父 task packet。
2. 阅读 `docs/designs/OPERATIONAL_WORKBENCH_COMPONENTS_DESIGN.md`。
3. 检查 `git status --short`，保留所有既有改动。
4. 从 `EXECUTION_QUEUE.md` 选择依赖已完成的一个 packet。
5. 用 CodeGraph 确认受影响共享组件及 consumer，再读当前源码。
6. 把选中 packet 状态、owner、基线和首个动作写入 `STATUS.md` 后再实现。

## Global Rules

- Base 只实现通用合同，不写 `business/*` 场景分支。
- 默认行为保持兼容，高级能力必须显式启用。
- 不引入 BK Design 依赖；继续使用 Arco 与 Pantheon token。
- 所有展示文本走 i18n，所有交互覆盖键盘、焦点、长文案和移动端。
- UI 完成必须有渲染证据；文档描述不能替代截图和交互断言。

## Evidence Minimum

- `commands.json`、`summary.md`、findings-first `review.md`。
- 1440x900 与 390x844 的关键状态截图。
- 明暗主题、loading/empty/error/forbidden、长中英文。
- 键盘/焦点、sticky 遮挡、恢复默认或日志追尾等 packet 专属断言。

## Stop Conditions

遇到后端偏好 schema、不兼容公共 API、foundation 发布或最终视觉验收时停止并记录一个决策问题。普通实现选择不升级给维护者。

## Completion Boundary

B1-B5 全部完成仍不等于 Ops 已同步。必须先发布 immutable foundation release，再由 Ops 更新 consumer lock 和运行业务验证。
