# 说明风险优先与现行 Sonar 发布门禁的权威边界

状态：in-progress；实现：applied；验证：passed；独立review：blocked。

## 当前进度

双语策略明确当前Sonar发布全BUG/VULNERABILITY/CODE_SMELL清零是发布例外；风险优先用于投入分配，现行门禁配置不放宽。

## Evidence

[命令记录](./commands.json)，[评审状态](./review.md)，[主计划](../../tasks/2026-11-04-global-audit-remediation/plan.md)。完整日志位于workspace `audit-artifacts/base-global-remediation-2026-11-04/`，不能把未运行、预期失败或本地候选写为发布通过。

- passed: `npm run check:docs-frontmatter` (pantheon-base) — metadata-final-check-docs-frontmatter.log
- passed: `npm run check:harness-docs` (pantheon-base) — metadata-final-check-harness-docs.log
- passed: `npm run check:task-packet` (pantheon-base) — metadata-final-check-task-packet.log

## 风险与未关闭项

中：擅自移除门禁削弱信号；本轮只解释当前真实规则

- Independent review unavailable: executor gpt-5.5 and architect gpt-5.4-mini attempts returned HTTP 503; no independent approval is claimed.
