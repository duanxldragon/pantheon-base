# Task: 建立类型化错误体系 + HTTP context.Context 传播

- **Task ID**: 2026-06-21-typed-errors-and-context
- **Target**: pantheon-base
- **Layer**: platform
- **Mode**: implement
- **Model Tier**: standard

## Context

当前项目存在两个基础问题：
1. **398 处裸 `errors.New()` / `fmt.Errorf()`**，0 个类型化错误变量。调用方无法用 `errors.Is()` 判断错误类型。
2. **33,005 行代码仅 5 处使用 `context.Context`**。HTTP 请求无超时控制，客户端断开后服务端仍在执行。

## Part A: 类型化错误体系

### Required Reading

1. `backend/pkg/common/errors.go` — 当前错误定义
2. `backend/modules/auth/auth_service.go` — auth 模块错误示例
3. `backend/modules/system/iam/user/user_service.go` — IAM 模块错误示例

### Design

```go
// backend/pkg/common/errors.go

package common

import "errors"

// 通用错误哨兵
var (
    ErrNotFound   = errors.New("not_found")
    ErrConflict   = errors.New("conflict")
    ErrForbidden  = errors.New("forbidden")
    ErrBadRequest = errors.New("bad_request")
    ErrInternal   = errors.New("internal_error")
)

// ErrorResponse 统一错误响应
type ErrorResponse struct {
    Code    string `json:"code"`    // 机器可读错误码
    Message string `json:"message"` // 人类可读消息（前端 i18n key）
    Detail  string `json:"detail,omitempty"`
}
```

### 各模块需做的事

在每个业务模块的 service 文件中，定义模块级错误变量：

```go
// backend/modules/auth/errors.go (示例)
package auth

import "errors"

var (
    ErrInvalidCredentials = errors.New("auth.invalid_credentials")
    ErrPasswordExpired    = errors.New("auth.password_expired")
    ErrAccountLocked      = errors.New("auth.account_locked")
    ErrMFARequired        = errors.New("auth.mfa_required")
    ErrMFACodeInvalid     = errors.New("auth.mfa_code_invalid")
    ErrSessionRevoked     = errors.New("auth.session_revoked")
    ErrSessionNotFound    = errors.New("auth.session_not_found")
    ErrTokenExpired       = errors.New("auth.token_expired")
)
```

### 变更范围

| 模块 | 文件 | 说明 |
|---|---|---|
| `pkg/common` | `errors.go` | 添加 5 个通用哨兵 + `ErrorResponse` 结构体 |
| `modules/auth` | `errors.go` (新) | auth 模块错误定义 |
| `modules/auth` | `auth_service.go` | 替换裸 `errors.New()` 为类型化错误 |
| `modules/system/iam/user` | `errors.go` (新) | user 模块错误定义 |
| `modules/system/iam/role` | `errors.go` (新) | role 模块错误定义 |
| `modules/system/iam/menu` | `errors.go` (新) | menu 模块错误定义 |
| `modules/system/iam/permission` | `errors.go` (新) | permission 模块错误定义 |
| `modules/system/org/dept` | `errors.go` (新) | dept 模块错误定义 |
| `modules/system/org/post` | `errors.go` (新) | post 模块错误定义 |
| `modules/system/config/dict` | `errors.go` (新) | dict 模块错误定义 |
| `modules/system/config/setting` | `errors.go` (新) | setting 模块错误定义 |

**注意**：每个模块只替换已有的裸 `errors.New()`，不引入新的错误分支。保持功能不变。

## Part B: context.Context 传播

### Required Reading

1. `backend/cmd/server/main.go` — 启动入口
2. `backend/internal/middleware/request_context_middleware.go` — 请求上下文
3. `backend/pkg/common/request_context.go` — 上下文工具
4. 任意一个 service 文件 — 理解当前请求处理流程

### Design

在 HTTP handler 层注入带超时的 context：

```go
// request_context_middleware.go 改造
func RequestContextMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
        defer cancel()
        c.Request = c.Request.WithContext(ctx)
        c.Next()
    }
}
```

Service 层接收 context 并传递给数据库查询：

```go
// 改造前
func (s *UserService) GetByID(userID uint64) (*SystemUser, error) {
    var user SystemUser
    err := s.db.First(&user, userID).Error  // 无 context
    return &user, err
}

// 改造后
func (s *UserService) GetByID(ctx context.Context, userID uint64) (*SystemUser, error) {
    var user SystemUser
    err := s.db.WithContext(ctx).First(&user, userID).Error
    return &user, err
}
```

### 变更范围

| 文件 | 说明 |
|---|---|
| `backend/internal/middleware/request_context_middleware.go` | 注入 `context.WithTimeout` |
| 所有 `*_service.go` | 方法签名加 `ctx context.Context` 首参数，`s.db` → `s.db.WithContext(ctx)` |
| 所有 `*_handler.go` | 调用 service 方法时传 `c.Request.Context()` |

### 实施策略（渐进式）

1. 先改 middleware + `pkg/database/gorm.go` 中 `InitDB` 返回 `*gorm.DB`
2. 先从 `modules/auth/` 开始（业务影响最大），其次 `modules/system/iam/`，最后 `modules/system/org/`、`modules/system/config/`
3. 每个模块改完后 `go build` + `go test` 确认不破坏编译

## Verification

```bash
cd D:/workspace/go/pantheon-platform/pantheon-base
go build ./backend/cmd/server
go test -race ./backend/...
go vet ./backend/...
```

## Notes

- 这是一个较大的跨模块改动。建议分批实施：先 errors，再 context
- Context 传播不需要一次性改完所有 service — 可以按模块逐步推进
- Handler 层的 `c.Request.Context()` 已有 gin 默认 context，只需在 middleware 中加 timeout wrapper
