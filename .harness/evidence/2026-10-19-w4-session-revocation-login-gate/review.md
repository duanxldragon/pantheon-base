# W4 review — session revocation and login gate

## 1. 安全边界

- 清理用户级键的位置在 `CreateSessionForTenantWithContext` 的**成功返回之前**，即：
  凭据已校验、`GateSessionIssuance` 已通过、`system_user_session` 已写入、token pair 已存 Redis。
- 失败路径（密码错误、租户门禁拒绝、token 存储失败）都不会触碰黑名单键。
- 没有把 `ClearUserBlacklist` 暴露给任意请求；只有签发成功这一条路径调用。

## 2. 为什么补 session 级键

只清用户级键会让「重置密码前签发的 access token」在清理后重新可用，因为 access token 是 Redis 不透明
token 且用户级键是唯一拦截点。`RevokeUserTokens` 现在先按下标写 `blacklist:session:<sid>`，
中间件每个请求都检查 session 键，因此：

- 新登录 → 用户级键被清 → 新 token 可用；
- 旧 token → session 键仍在 → `401 token.expired.force`；
- refresh token → `CascadeRevokeSessionRefresh` 已删除，刷新失败。

TTL 与用户级键一致（`AccessTokenTTL + 1m`），覆盖 access token 剩余寿命与中间件 60s 缓存。

## 3. 兼容性

- `ClearUserBlacklist` 与 `BlacklistUser` 同包，键格式只有一处定义。
- 对 `database.RDB == nil` 保持既有「静默 no-op」语义（测试/兼容部署不接 Redis 时）。
- `PANTHEON_TEST_REDIS_DB` 只影响测试；默认 DB 1 不变。

## 4. 剩余风险

| 风险 | 判断 |
|---|---|
| 清理失败只 warn | 用户可能拿到一个被用户级键拒绝的 token；不比重置后完全无法登录更差，但仍是误导性成功 |
| 多实例部署 | 中间件直接读 Redis，无本地状态，键一写即全实例生效 |
| session 键数量 | 每个历史会话一个键，TTL 16 分钟自动过期；没有清理任务的需求 |
| 旧 refresh token | 已由 cascade 删除；live 探针没有再次回放，单测覆盖 |

## Machine Readable

```json
{
  "taskId": "2026-10-19-w4-session-revocation-login-gate",
  "verdict": "approved",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-19-w4-session-revocation-login-gate/manifest.json",
    "evidence": ".harness/evidence/2026-10-19-w4-session-revocation-login-gate/commands.json",
    "reviewFile": ".harness/evidence/2026-10-19-w4-session-revocation-login-gate/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-19-tenant-permission-isolation-remediation.task.md",
      "docs/contracts/TENANT_CONTRACT_V1.md"
    ]
  }
}
```
