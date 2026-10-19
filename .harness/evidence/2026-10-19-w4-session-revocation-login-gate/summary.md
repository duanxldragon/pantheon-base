# W4 — 凭证变更后的登录门禁（2026-10-19-w4-session-revocation-login-gate）

**Status**: completed
**Scope**: F2（P1）
**Baseline → 现状**: 重置密码/禁用后新密码登录返回 200 但下一请求 `401 token.expired.force`，需等待约 16 分钟 → **新会话 200，旧会话 401，立即可用**
**Gate**: `go build` / `go vet` 全绿；login + session + 全量后端测试通过；A3c 全绿

## 1. 一句话结论

`RevokeUserTokens` 写的是**用户级** Redis 键 `blacklist:<uid>`，登录从不清理，所以重置密码或禁用/启用后
用户会被锁到键过期（约 16 分钟），错误还是 `token.expired.force`——看起来像会话过期，实际是账号锁死。
W4 在**认证成功且签发完成之后**清用户级键，同时给每个被吊销会话写 session 级键，做到
「新会话可用、改动前的 token 仍然失效」。

## 2. 改了什么

| 代码点 | 修复前 | 修复后 |
|---|---|---|
| `authtoken.ClearUserBlacklist`（新） | — | 删除 `blacklist:<uid>`，键格式仍由 authtoken 拥有 |
| `CreateSessionForTenantWithContext` | 签发后直接返回 | 签发成功后清用户级键；失败只记 warn，不影响登录结果 |
| `LifecycleService.RevokeUserTokens` | 只写用户级键 + 删 refresh | 先给每个 session 写 `blacklist:session:<sid>`，再写用户级键 |
| `pkg/testredis` | 固定 DB 1 | 支持 `PANTHEON_TEST_REDIS_DB`（0–15），默认仍是 1 |

清理时机是安全边界：只在**凭据校验通过、租户门禁通过、token pair 落库之后**执行；
失败登录、签发失败都不会清键，避免「禁用刚设置的锁被一次失败登录解除」。

## 3. 实测证据

### 3.1 Redis 键状态（`redis-keys.txt`）

```
after-login       user_key=''        session_key=''
after-reset       user_key='1' ttl=960 | session_key='1' ttl=960
after-new-login   user_key=''        session_key='1' ttl=960
old session after reset+new-login: 401 token.expired.force
new session after reset+new-login: 200
```

TTL 960s = `AccessTokenTTL(15m) + 1m`，与既有黑名单窗口一致。
用户级键被登录清掉，session 级键保留——旧 access token 仍被中间件拒绝。

### 3.2 单元测试

```
TestSuccessfulLoginClearsUserBlacklist        PASS
TestFailedIssuanceKeepsUserBlacklist          PASS
TestFailedCredentialKeepsUserBlacklist        PASS
TestDisableEnableCycleLetsTheUserLogInAgain   PASS
TestLifecycleService_RevokeUserTokens         PASS
```

第二条专门锁定顺序：租户用户没有 membership → 签发被拒 → 用户键必须还在。
第三条锁定「密码错误不算认证成功」。

### 3.3 接口层验收（A3c）

```
PASS [A3c] new password logs in after reset          code=200
PASS [A3c] post-reset session carries the tenant claim
PASS [A3c] disabled user cannot log in               code=401
PASS [A3c] re-enabled user can log in again          code=200
PASS [A3c] re-enabled session is usable
```

## 4. 测试隔离的一个顺手修复

`testredis.Open` 固定使用 DB 1，而 `go test ./...` 会并行跑多个包；每个包的 cleanup 都 `FlushDB`，
于是「设置键 → 调用 → 断言键仍存在」的测试会被其他包中途清掉（首次全量跑就出现了这个 flake）。
新增 `PANTHEON_TEST_REDIS_DB`，本组测试使用 DB 9；默认 DB 1 不变，不影响其他测试。

## 5. 剩余风险

- 清理失败只记 warn：如果 Redis 删除失败而 token 存储成功，用户会拿到一个仍被用户级键拒绝的 token。
  这与旧行为（登录永远失败）相比没有变差，但仍是「登录返回成功、下一请求 401」的形状；未做重试。
- 不在本包范围：会话级吊销目前只覆盖 `RevokeUserTokens` 的调用方（重置密码、禁用、删除、成员关系变更）。
  若产品要求「重置密码踢掉所有设备」，refresh token 已被级联删除，access token 由 session 键覆盖。
