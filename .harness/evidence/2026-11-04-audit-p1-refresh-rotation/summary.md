# 刷新令牌并发与存储故障验证及最小修复

状态：in-progress；实现：applied；验证：passed；独立review：blocked。

## 当前进度

两个Runtime、同一旧token16请求的动态复现从16个pair降为1个；GETDEL先消费，失败不恢复旧token。进一步确认旧Save会恢复撤销/覆盖tenant，并对刷新及切换共用条件更新，保留导出签名。

## Evidence

[命令记录](./commands.json)，[评审状态](./review.md)，[主计划](../../tasks/2026-11-04-global-audit-remediation/plan.md)。完整日志位于workspace `audit-artifacts/base-global-remediation-2026-11-04/`，不能把未运行、预期失败或本地候选写为发布通过。

- passed: `go test -json -p 1 ./pkg/authtoken ./modules/auth/login ./modules/auth/session` (pantheon-base/backend) — auth-final.jsonl
- failed: `go test ./modules/auth/session -run TestRefreshSessionRejectsConcurrentLifecycleChange -count=1 -v` (pantheon-base/backend) — Expected red baseline: revoked row resurrected and concurrent tenant overwritten; refresh-lifecycle-before.log
- passed: `go test ./modules/auth/session -run TestRefreshSessionRejectsConcurrentLifecycleChange -count=1 -v` (pantheon-base/backend) — refresh-lifecycle-after.log; final auth suite additionally covers SwitchSessionRejectsConcurrentLifecycleChange

## 风险与未关闭项

高：并发与重试语义、跨实例会话、部分DB/Redis失败；禁止盲目并行补丁和新增租户功能

- Independent review unavailable: executor gpt-5.5 and architect gpt-5.4-mini attempts returned HTTP 503; no independent approval is claimed.
- Controlled local tests/builds collected; live external integration, browser smoke and release validation remain unverified.
