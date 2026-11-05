# npm 漏洞扫描非零结果传递到门禁

状态：in-progress；实现：applied；验证：passed；独立review：blocked。

## 当前进度

删除两处 npm audit 的 || true，保留上传报告与既有PR/report-only策略；严格路径以真实step outcome判定。行为回归执行工作流原shell片段。

## Evidence

[命令记录](./commands.json)，[评审状态](./review.md)，[主计划](../../tasks/2026-11-04-global-audit-remediation/plan.md)。完整日志位于workspace `audit-artifacts/base-global-remediation-2026-11-04/`，不能把未运行、预期失败或本地候选写为发布通过。

- passed: `node --test tests/scripts/security-audit-exit.test.mjs tests/scripts/security-workflow.test.mjs` (pantheon-base) — npm-gate-before.log=expected regression failure; npm-gate-after.log=4 passed

## 风险与未关闭项

中：真实漏洞或扫描错误现在会使严格门禁变红；不擅自更改阈值或豁免

- Independent review unavailable: executor gpt-5.5 and architect gpt-5.4-mini attempts returned HTTP 503; no independent approval is claimed.
