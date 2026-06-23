# Task: 拆分 auth_service.go 为功能子服务

- **Task ID**: 2026-06-21-auth-service-split
- **Target**: pantheon-base
- **Layer**: system/auth
- **Mode**: implement
- **Model Tier**: deep

## Context

`backend/modules/auth/auth_service.go` 当前 2186 行、101 个方法，包含 9 种职责：
登录、密码、MFA、会话、节流、安全事件、登录日志、偏好、设置重载。

需要按功能域拆分为独立的 service 文件，AuthService 作为编排层保留最小门面。

## Required Reading

1. `backend/modules/auth/auth_service.go` — 当前实现
2. `backend/modules/auth/auth_session_service.go` — 已拆出的会话子服务
3. `backend/modules/auth/auth_password_service.go` — 已拆出的密码子服务
4. `backend/modules/auth/auth_dto.go` — 请求/响应 DTO
5. `backend/modules/auth/auth_handler.go` — HTTP handler 层
6. `backend/modules/auth/module.go` — 路由注册
7. `designs/AUTH_MODULE_DESIGN.md` — Auth 模块设计文档

## Target Structure

拆分后文件结构：

```
backend/modules/auth/
├── auth_service.go          # AuthService 编排层 (~200 lines)
│   - NewAuthService()       构造函数，组装子服务
│   - ReloadSettings()       设置重载
│   - WatchSettings()        设置监听
│   - Migrate()              数据库迁移
│   - GetCurrentUserInfo()   当前用户信息
│   - GetUserRoles()         用户角色
│   - GetUserPerms()         用户权限
│   - GetSecurityOverview()  安全概览
│   - UpdateCurrentUserPreferences()  偏好更新
│
├── auth_login_service.go    # 登录域 (~250 lines)
│   - Login / LoginWithSource
│   - Authenticate
│   - ensureSourceThrottleAllowed
│   - loadLoginUserWithSource
│   - ensureLoginUserAvailable
│   - handlePasswordMismatch
│   - 以及登录节流相关私有方法
│
├── auth_password_service.go # 密码域（已有，保持~140 lines）
│
├── auth_mfa_service.go      # MFA 域 (~250 lines)
│   - CreateMFAChallenge
│   - VerifyMFAChallenge
│   - loadActiveMFAChallenge
│   - loadMFAChallengeSecret
│   - loadMFAChallengeUser
│   - finalizeMFAChallenge
│   - VerifyPasswordForOperation
│   - upsertMFAFactor
│
├── auth_session_service.go  # 会话域（已有，保持~290 lines）
│
├── auth_security_service.go # 安全事件域 (~200 lines)
│   - ListSecurityEvents
│   - AcknowledgeSecurityEvent
│   - ListLoginLogs / ListOwnLoginLogs
│   - ExportLoginLogs
│   - CleanupLoginLogs
│   - BatchDeleteLoginLogs
│   - 保留策略相关私有方法
│
├── auth_dto.go              # DTO（不变）
├── auth_handler.go           # Handler（不变）
├── auth_handler_test.go      # 测试（适配拆分）
├── module.go                 # 路由（不变）
│
├── login_log_model.go        # 模型（不变）
├── login_throttle_model.go
├── mfa_crypto.go
├── mfa_model.go
├── security_event_model.go
├── session_model.go
├── totp.go
├── user_agent.go
│
├── auth_service_test.go      # 测试按子服务拆分
├── module_test.go
├── preferences_contract_test.go
├── smoke_test.go
├── totp_test.go
├── user_agent_test.go
```

## Design Constraints

1. **向后兼容**：`AuthService` 保持所有公开方法签名不变，内部委托给子服务
2. **子服务不导出**：子服务通过 `authLoginService` / `authMFAService` / `authSecurityService` 小写结构体访问，不暴露到模块外
3. **依赖注入**：子服务通过 `NewAuthService` 时注入 `*gorm.DB`，不创建自己的全局变量
4. **测试兼容**：现有测试文件中通过 `AuthService` 公开方法调用的逻辑保持不变
5. **import 路径**：使用 `pantheon-platform/backend/modules/auth` 模块名

## Implementation Steps

### Phase 1: 提取登录域

1. 创建 `auth_login_service.go`
2. 将以下方法从 `auth_service.go` 移动到 `auth_login_service.go`：
   - `Login` / `LoginWithSource`
   - `Authenticate`
   - `ensureSourceThrottleAllowed`
   - `loadLoginUserWithSource`
   - `ensureLoginUserAvailable`
   - `handlePasswordMismatch`
3. 创建 `authLoginService` 小写结构体
4. 在 `AuthService` 中嵌入 `*authLoginService`
5. 在 `NewAuthService` 中初始化
6. 运行 `go build ./backend/... && go test ./backend/modules/auth/...`

### Phase 2: 提取 MFA 域

1. 创建 `auth_mfa_service.go`
2. 移动 MFA 相关方法
3. 验证

### Phase 3: 提取安全事件域

1. 创建 `auth_security_service.go`
2. 移动安全事件、登录日志相关方法
3. 验证

### Phase 4: 清理验证

1. 确认 `auth_service.go` 缩减到 ~200-300 行
2. 运行 `go build ./backend/cmd/server`
3. 运行 `go test -race ./backend/modules/auth/...`
4. 运行 `go vet ./backend/...`

## Verification

```bash
cd D:/workspace/go/pantheon-platform/pantheon-base
go build ./backend/cmd/server          # 编译通过
go test -race ./backend/modules/auth/...  # 所有测试通过
go vet ./backend/...                   # 无新增 vet 警告
```

## Stop Points

每个 Phase 完成后暂停，确认编译+测试通过再继续下一阶段。
