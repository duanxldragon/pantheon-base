## Changes Made

- [token.go](/D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/authtoken/token.go:167)：使用 Lua 原子校验并更新；拒绝失效、无 TTL 或身份不符的会话，保留原毫秒级到期时间。
- 新增[令牌回归测试](/D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/authtoken/token_activity_test.go:21)和[旧中间件交错测试](/D:/workspace/go/pantheon-platform/pantheon-base/backend/internal/middleware/token_activity_regression_test.go:18)。

## Verification

- 实际 Redis 7.4.2：修复前红灯、修复后绿灯。
- `go test -race -json -count=1 ./pkg/authtoken ./internal/middleware ./modules/auth/...`：通过，529 个测试及子测试通过事件，无测试跳过；1 个无测试文件的包单独记录。
- 同范围 `go vet`、`go build`，以及格式、差异检查通过。
- MinGW、CGO=1；103 个范围内文件哈希稳定。

## Assumptions / Notes

完整业务/provider 集成、全仓验证及独立评审仍待完成。未提交、推送或发布。

## Summary

限定修复与验证已完成；[完整证据及精确测试清单](/D:/workspace/go/pantheon-platform/pantheon-base/.harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/resume-token-summary.md)已保存。
