# B3 Operational Primitives

- Priority: `P1`
- Layer: `platform`
- Status: `planned`
- Depends On: none
- Blocks: Ops O1-O5

## Outcome

提供不包含业务实体和状态机的 `TaskLogViewer`、`ChangeDiff`、`ConditionBuilder`、`ContextSelector`、`ExecutionStepRail` 共享原语。

## In Scope

- 按 canonical design 定义五个组件的 types、adapter boundary、状态和可访问性。
- 为日志采用有界缓存/虚拟化，为条件采用 AST，为选择器采用数据源 adapter。
- 提供 mock fixture，覆盖大量数据、长文案、断线和部分失败。
- 每个原语独立导出，避免一个巨型“运维工作台”组件。

## Out Of Scope

- 不实现 LogQL/PromQL/SQL 转换。
- 不实现 Deploy/K8s 状态机、BizScope 或 CMDB 数据源。
- 不在组件内执行权限判断、审计或秘密脱敏。

## Expected Files

- `frontend/src/components/operational/**` 或与现有组件分层一致的最小目录。
- 公共类型、测试、fixtures、导出入口和组件文档。
- 不触碰 `frontend/src/modules/business/**`。

## Contract Risks

- 日志 chunk 必须有稳定 sequence，断线重连不得重复或乱序展示。
- Diff 输入进入组件前完成秘密遮蔽；组件提供二次敏感 key guard。
- Condition AST 不得被宣传为可信查询；服务端仍须白名单校验。
- ContextSelector 提交的是 ID + snapshot + source，不是已授权事实。
- ExecutionStepRail 不自行推导重试/回滚合法性。

## Acceptance

1. 五个组件均有独立、最小、业务无关 API 和示例。
2. 10k 日志行、深层条件、失效选择项和 50+ 步骤不产生失控布局或阻塞。
3. loading/empty/error/forbidden/stale/partial 状态可被调用方明确控制。
4. 键盘、读屏、焦点、200% 缩放、长中英文、明暗主题通过。
5. 包体积和渲染性能有基线，不因一个原语引入未使用的其他原语。

## Evidence And Verification

- unit/property：日志去重排序、AST round-trip、失效选择、步骤状态映射。
- Playwright：追尾/暂停/搜索/全屏、Diff 折叠、条件键盘编辑、选择排除、步骤跳转。
- screenshots：每个原语 desktop/mobile 的 default/error/edge 状态及 light/dark。
- 性能：10k 日志行与大候选集的交互时间/DOM 上限记录。

## Gates

- 新依赖、公共 API 不兼容、日志脱敏责任转移或业务逻辑进入 Base 时停止。
- 发布前由至少一个 Base fixture 和一个 Ops consumer contract test 证明抽象可用。
