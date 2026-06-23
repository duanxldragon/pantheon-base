# Task: JWT → Token+Redis 鉴权方案迁移

- **Task ID**: 2026-06-21-jwt-to-token-redis
- **Target**: pantheon-base
- **Layer**: system/auth
- **Mode**: implement
- **Model Tier**: deep

## Context

当前架构：使用 `crypto/rand` 生成的 opaque token + Redis 存储。✅ 已完成迁移

目标：用 `crypto/rand` 生成的 opaque token + Redis 存储替代 JWT。

## Required Reading

1. `backend/pkg/common/token.go` — Token 生成/Redis 存储（已实现）
2. `backend/pkg/common/cookie.go` — Cookie 设置
3. `backend/pkg/common/response.go` — 统一响应
4. `backend/pkg/database/redis.go` — Redis 连接
5. `backend/internal/middleware/token_middleware.go` — Token 中间件（已实现）
6. `backend/modules/auth/auth_service.go` — Login/Refresh/Revoke
7. `backend/modules/auth/auth_session_service.go` — 会话管理
8. `backend/modules/auth/session_model.go` — Session 模型
9. `backend/modules/auth/auth_dto.go` — AuthTokenResp / TokenPair
10. `backend/modules/auth/auth_handler.go` — Handler 层
11. `backend/pkg/common/security_config.go` — DefaultDevSecrets
12. `designs/AUTH_MODULE_DESIGN.md`

> **2026-06-22 更新**：JWT 相关文件已全部删除（jwt.go、jwt_middleware.go 已移除），统一使用 Redis Token。

## Design

### Token 模型

```go
// Token 类型
type TokenPair struct {
    AccessToken      string    `json:"accessToken"`       // 32 字节 hex (crypto/rand)
    RefreshToken     string    `json:"refreshToken"`      // 32 字节 hex
    AccessExpiresAt  time.Time `json:"accessExpiresAt"`   // 15 分钟
    RefreshExpiresAt time.Time `json:"refreshExpiresAt"`  // 7 天
    TokenType        string    `json:"tokenType"`         // "Bearer"
    SessionID        string    `json:"sessionId"`         // UUIDv4
}

// Redis 中存储的 Session 数据
type SessionData struct {
    UserID       uint64    `json:"uid"`
    Username     string    `json:"uname"`
    RoleKeys     []string  `json:"roles"`
    CreatedAt    time.Time `json:"cat"`
    LastAccessAt time.Time `json:"lat"`
    LastIP       string    `json:"ip"`
    UserAgent    string    `json:"ua"`
}
```

### Redis Key Schema

```
pantheon:session:{access_token}   → SessionData JSON, TTL = access_token TTL (15min)
pantheon:refresh:{refresh_token}  → {userID}:{sessionID}, TTL = refresh TTL (7d)
pantheon:user_sessions:{userID}   → SET of sessionIDs (用于列出所有会话)
```

### 核心流程

**登录**:
1. 验证用户名密码
2. 生成 `accessToken = hex(rand(32))` + `refreshToken = hex(rand(32))`
3. `SET pantheon:session:{accessToken} {sessionJSON} EX 900`
4. `SET pantheon:refresh:{refreshToken} {userID}:{sessionID} EX 604800`
5. `SADD pantheon:user_sessions:{userID} {sessionID}`
6. 返回 TokenPair（Set HttpOnly Cookie）

**鉴权（中间件）**:
1. 从 `Authorization: Bearer <token>` 或 Cookie 读取 access token
2. `GET pantheon:session:{token}`
3. 若存在且未过期 → 放行，更新 `LastAccessAt`（异步 EXPIRE 续期）
4. 若不存在 → 401

**Refresh**:
1. 从 Cookie 读取 refresh token
2. `GET pantheon:refresh:{refreshToken}` 获取 `{userID}:{sessionID}`
3. 验证 userID/sessionID 存在
4. 生成新的 token pair，更新 Redis
5. `DEL pantheon:refresh:{oldRefreshToken}`（刷新旋转）
6. 返回新 TokenPair

**吊销**:
1. `DEL pantheon:session:{accessToken}`
2. `DEL pantheon:refresh:{refreshToken}`
3. `SREM pantheon:user_sessions:{userID} {sessionID}`

### 文件变更

| 文件 | 状态 |
|---|---|
| `backend/pkg/common/token.go` | ✅ 已实现 — Token 生成、Redis 读写 |
| `backend/pkg/common/jwt.go` | ✅ 已删除 |
| `backend/pkg/common/security_config.go` | ✅ 已清理 JWT secret |
| `backend/internal/middleware/token_middleware.go` | ✅ 已实现 — Redis Token 中间件 |
| `backend/internal/middleware/jwt_middleware.go` | ✅ 已删除 |
| `backend/modules/auth/auth_service.go` | ✅ 已适配 Token 登录 |
| `backend/modules/auth/auth_session_service.go` | ✅ 已简化 |

### 向后兼容

1. `TokenPair` 结构体字段名不变（`accessToken` / `refreshToken` / `expiresAt`），前端无需改动
2. Cookie 名称不变（`pantheon_access_token` / `pantheon_refresh_token`）
3. `Authorization: Bearer` header 解析方式不变
4. `gin.Context` 中注入的 `userID` / `username` / `roleKeys` key 不变

### 数据库迁移

- `system_user_session` 表不删除（保留历史数据），但新增 `ALTER TABLE` 标记为 deprecated
- 或新增迁移脚本：`-- 2026-06-21: session auth migrated to Redis; system_user_session retained for audit`

### 测试策略

- `backend/pkg/common/token_test.go` — Token 生成/验证/刷新/吊销/过期 的单元测试
- `backend/internal/middleware/auth_middleware_test.go` — 中间件单元测试
- `backend/modules/auth/auth_service_test.go` — 适配已有测试
- 集成测试：Redis 不可用时 fallback 到 503 错误（不静默降级为无认证状态）

## Verification

```bash
cd D:/workspace/go/pantheon-platform/pantheon-base

# 单元测试
go test -race ./backend/pkg/common/...
go test -race ./backend/internal/middleware/...
go test -race ./backend/modules/auth/...

# 编译
go build ./backend/cmd/server

# vet
go vet ./backend/...
```

## Key Decisions

1. **Redis 不可用时的行为**：返回 503（不降级为无认证）— 安全优先
2. **session 表**：保留但标记 deprecated，不删除（审计需求）
3. **refresh token rotation**：每次 refresh 后旧 refresh token 立即失效（防重用）
4. **access token 续期**：不自动续期，依靠 refresh token 换新
