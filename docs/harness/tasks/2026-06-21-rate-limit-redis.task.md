# Task: 速率限制从内存迁移到 Redis

- **Task ID**: 2026-06-21-rate-limit-redis
- **Target**: pantheon-base
- **Layer**: platform
- **Mode**: implement
- **Model Tier**: standard

## Context

`backend/internal/middleware/rate_limit_middleware.go` 使用内存 `map` 做计数器。多实例部署时各自计数，限流失效。Redis 依赖已在 `go.mod` 中存在（`go-redis/v9`）。

## Required Reading

1. `backend/internal/middleware/rate_limit_middleware.go` — 当前实现
2. `backend/pkg/database/redis.go` — Redis 连接
3. `backend/modules/auth/auth_service.go` — 登录限流消费方（`ensureSourceThrottleAllowed`）
4. `designs/SECURITY_POLICY_ROADMAP.md` — 安全策略路线图

## Design

### Redis Key Schema

```
rate_limit:ip:{ip}           → counter, TTL = window
rate_limit:source:{source}   → counter, TTL = window (登录来源级，如 "login:/api/v1/auth/login")
```

### 接口设计

```go
// RateLimitStore 速率限制存储接口
type RateLimitStore interface {
    // Increment 自增并返回当前计数，首次调用时设置 TTL
    Increment(ctx context.Context, key string, window time.Duration) (int64, error)
    // Reset 重置计数器
    Reset(ctx context.Context, key string) error
}
```

### 实现要求

1. 新建 `RedisRateLimitStore` 实现 `RateLimitStore` 接口
2. 使用 Redis `INCR` + `EXPIRE`（Lua 脚本或 pipeline 保证原子性）
3. 保留 `MemoryRateLimitStore` 用于本地开发和测试（Redis 不可用时 fallback）
4. `RateLimitMiddleware` 接受 `RateLimitStore` 依赖注入
5. `pantheon-base` 的 `backend/cmd/server/main.go` 中根据 `PANTHEON_REDIS_ADDR` 环境变量选择 store

### 文件变更

| 文件 | 变更 |
|---|---|
| `backend/internal/middleware/rate_limit_middleware.go` | 重构为注入 `RateLimitStore` 接口 |
| `backend/internal/middleware/rate_limit_store_redis.go` | **新文件** — Redis 实现 |
| `backend/internal/middleware/rate_limit_store_memory.go` | **新文件** — 内存 fallback |
| `backend/internal/middleware/rate_limit_middleware_test.go` | 适配新接口，测试两种 store |
| `backend/modules/auth/auth_service.go` | 确认 `ensureSourceThrottleAllowed` 无需改动（它调的是 middleware 暴露的 API） |

## Verification

```bash
cd D:/workspace/go/pantheon-platform/pantheon-base
go build ./backend/...
go test -race ./backend/internal/middleware/...
go vet ./backend/...
```
