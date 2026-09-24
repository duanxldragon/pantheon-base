# Task Packet — 2026-09-22-session-revocation-closure

## 目标

统一管理员强制下线、用户主动下线和用户级禁用路径的 session、refresh token、access token 失效语义，确保管理员撤销后不会继续使用旧 access token 到 TTL 结束。

## 范围

In：`backend/modules/auth/session/**`、相关 token middleware、session/login 测试。

Out：不改变 token 格式、登录协议、MFA 策略或前端会话页面。

## 验收标准

- `RevokeAnySession` 与其他撤销路径具有一致的 refresh/access invalidation 语义。
- Redis 不可用时错误策略明确且有测试，不允许静默形成安全假象。
- 管理员不能撤销当前会话的既有保护保持不变。
- refresh、access、DB `revoked_at` 三条路径均有回归测试。

## 验证

```text
go test ./modules/auth/session ./modules/auth/login ./internal/middleware ./pkg/authtoken
go vet ./modules/auth/session ./modules/auth/login ./internal/middleware ./pkg/authtoken
go test -race ./modules/auth/session ./modules/auth/login ./internal/middleware ./pkg/authtoken
```

## 依赖与证据

- blockedBy：none
- blocks：tenant-public-settings-scope、production-redis-and-security-gates
- evidenceDir：`.harness/evidence/2026-09-22-session-revocation-closure`
- human gate：涉及安全失效语义，需非实现者复核。

