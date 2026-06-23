# Task: 补齐安全响应头 CSP + HSTS

- **Task ID**: 2026-06-21-security-headers-csp-hsts
- **Target**: pantheon-base
- **Layer**: platform
- **Mode**: implement
- **Model Tier**: quick

## Context

`backend/internal/middleware/security_headers_middleware.go` 当前仅 10 行，只设置了 3 个头。需要补齐 CSP 和 HSTS。

## Required Reading

1. `backend/internal/middleware/security_headers_middleware.go` — 当前实现
2. `backend/internal/middleware/security_headers_middleware_test.go` — 现有测试

## Changes

### 1. `backend/internal/middleware/security_headers_middleware.go`

补齐以下响应头：

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff         (已有)
X-Frame-Options: DENY                   (已有)
Referrer-Policy: strict-origin-when-cross-origin (已有)
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### 2. `backend/internal/middleware/security_headers_middleware_test.go`

- 验证所有 6 个头都被设置
- 验证 CSP 包含 `frame-ancestors 'none'`
- 验证 HSTS `max-age` 为有效数值

## Verification

```bash
cd D:/workspace/go/pantheon-platform/pantheon-base
go build ./backend/...
go test -race ./backend/internal/middleware/...
go vet ./backend/internal/middleware/...
```
