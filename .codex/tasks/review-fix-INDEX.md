# Review 修复任务清单（Codex 执行）

来源：ENTERPRISE_REVIEW_REPORT.md / CASBIN_REVIEW.md / IMPROVEMENT_ROADMAP.md
决策：P1-1 采用「窄口径」；范围「全部含前端大重构 + 多实例」。

执行方式：
codex exec "$(cat <文件>)" -s workspace-write -m <model> -c 'model_reasoning_effort="<effort>"' < /dev/null

注意：

- 必须 < /dev/null 关闭 stdin，否则 codex exec 后台会挂起等输入（之前卡住的根因）。
- 各批串行执行（Codex 会改仓库文件），一批跑完验证后再跑下一批。
- frontend 批次加 -C frontend。

| 批次     | 文件                                  | model        | effort    | 状态               |
| :------- | :------------------------------------ | :----------- | :-------- | :----------------- |
| Batch 1  | review-fix-1-backend-quality.txt      | gpt-5.5      | xhigh     | 已完成（验证通过） |
| Batch 5  | review-fix-5-doc-drift.txt            | gpt-5.4-mini | (default) | 已完成（验证通过） |
| Batch 2  | review-fix-2-privilege-escalation.txt | gpt-5.5      | xhigh     | 已完成（验证通过） |
| Batch 3  | review-fix-3-multi-instance.txt       | gpt-5.5      | xhigh     | 已完成（验证通过） |
| Batch 4a | review-fix-4a-frontend-baseline.txt   | gpt-5.4      | high      | 已完成（验证通过） |
| Batch 4b | review-fix-4b-layout-split.txt        | gpt-5.4      | high      | 已完成（验证通过） |

建议执行顺序：1 → 5 → 2 → 3 → 4a → 4b

每批完成后把 Codex 最终摘要交回 Claude 审查，重点：

- Batch 1：新增 000008_system_module_registration 迁移是否与现有 schema 一致、幂等
- Batch 2：越权校验语义（admin 不受限、非 admin 拦截管理端策略、普通业务策略仍放行）
- Batch 3：单实例默认行为零变化、watcher 仅在 env 开启时生效
- Batch 4b：smoke/typecheck 保持全绿、权限判断口径未变
