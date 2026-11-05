# SSRF DNS 校验与实际拨号绑定

状态：in-progress；实现：applied；验证：passed；独立review：blocked。

## 当前进度

DNS核查与实际拨号绑定，空/混合私网答案拒绝；numeric IP直拨，保留Host/SNI、timeout override与所有导出签名。无新依赖。

## Evidence

[命令记录](./commands.json)，[评审状态](./review.md)，[主计划](../../tasks/2026-11-04-global-audit-remediation/plan.md)。完整日志位于workspace `audit-artifacts/base-global-remediation-2026-11-04/`，不能把未运行、预期失败或本地候选写为发布通过。

- passed: `go test ./pkg/security/ssrf` (pantheon-base/backend) — ssrf-after.log; baseline failure in ssrf-before.log

## 风险与未关闭项

高：多地址、IPv6、HTTPS、重定向和Ops datasource/webhook连接行为；保留导出签名、无新依赖

- Independent review unavailable: executor gpt-5.5 and architect gpt-5.4-mini attempts returned HTTP 503; no independent approval is claimed.
- Controlled local tests/builds collected; live external integration, browser smoke and release validation remain unverified.
