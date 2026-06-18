---
title: Auth Cookie-First And HTTP Posture Design
doc_type: Design
layer: system/auth
depends_on_layers:
  - platform
status: Approved
index_group: superpowers-specs
retention_reason: 作为 2026-06 安全边界收口与 base-first 继承治理的设计锚点保留
linked_contracts:
  - docs/contracts/SYSTEM_AUTH_CONTRACT.md
  - docs/contracts/PLATFORM_CONTRACT.md
  - SECURITY.md
  - docs/designs/QUALITY_AND_SECURITY_STRATEGY.md
updated_at: 2026-06-17
---

# Auth Cookie-First And HTTP Posture Design

## 1. 目标

本轮只处理两条高风险边界：

1. `system/auth` 浏览器主链路收口为真正的 cookie-first 会话模型；
2. `platform` HTTP 安全姿态从“任意 Origin 反射 + 无统一安全头”收口到可配置 allowlist 与最小安全响应头。

本轮以 `pantheon-base` 为唯一主修复仓库。`pantheon-ops` 不直接先修同类问题，只在本轮结束后消费底座修复结果。

## 2. 问题定义

### 2.1 当前认证模型自相矛盾

当前后端已经设置 HttpOnly、Secure、`SameSite=Strict` cookie，但登录和 refresh 响应体仍回传 `accessToken`、`refreshToken`。前端、smoke helper 和若干脚本继续消费这些 token。

这会导致两个问题：

- 运行时安全边界失真：浏览器 JavaScript 仍可直接拿到会话 token；
- 文档、状态管理、测试 helper 同时维护“cookie-only”与“Bearer token”两套叙事。

### 2.2 当前 HTTP 姿态过宽

当前 CORS 中间件直接回写请求 `Origin` 并开启 `Allow-Credentials: true`。这不是可接受的默认安全策略。

同时应用层没有统一设置最小安全响应头，导致“依赖外层网关补齐”的假设没有在仓库中被表达为契约。

## 3. 设计结论

### 3.1 浏览器运行时改为真正的 cookie-first

- `POST /auth/login`
- `POST /auth/mfa/verify`
- `POST /auth/refresh`

以上浏览器主链路响应体不再暴露 `accessToken`、`refreshToken`、`token`。

保留字段只包括：

- MFA challenge / setup 所需字段
- `tokenType`
- `accessExpiresAt`
- `refreshExpiresAt`
- `sessionId`
- `user`

浏览器前端将 `token` 视为“已登录占位状态”而不是 JWT 值本身。状态恢复继续依赖 cookie + CSRF + `auth/me`。

### 3.2 refresh 主链路只接受 cookie

浏览器运行态的 refresh 不再依赖 JSON body 中的 refresh token。后端继续从 HttpOnly refresh cookie 读取；若 cookie 缺失则返回未授权。

保留 `RefreshTokenReq` 只用于兼容受控测试路径的阶段性过渡时，应显式标记为非浏览器链路；若本轮能一起收口，则直接移除。

### 3.3 测试与脚本分层

- 生产运行链路：cookie-first，无 token body
- smoke / API helper / 维护脚本：允许从登录响应的 `Set-Cookie` 或 cookie jar 派生 Bearer token，仅用于受控测试与治理脚本，不作为产品运行时合同

这意味着测试辅助逻辑必须显式标注“测试侧派生 token”，而不是继续复用前端生产合同。

### 3.4 CSRF 与客户端存储

本轮不强行重写整个 CSRF 方案，但必须收口表述：

- CSRF token 仍由后端通过 cookie + header 同步提供
- 前端暂时保留本地持久化，但视为过渡状态与后续风险项
- 文档与状态注释必须与现状一致，不再宣称“JavaScript 无法获得任何相关 token”

### 3.5 CORS 收口

新增允许来源配置，默认行为：

- 无 `Origin`：按同源/非浏览器请求处理，不写 `Access-Control-Allow-Origin`
- 有 `Origin` 且命中 allowlist：回写该 origin，并允许 credentials
- 有 `Origin` 且未命中 allowlist：不授予跨域许可

允许来源通过环境变量配置，默认至少支持本地开发来源。

### 3.6 最小安全响应头

应用层统一补齐最小安全头：

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`

`Strict-Transport-Security` 与 `Content-Security-Policy` 本轮不在应用层强行设置为硬默认值，避免与本地 HTTP 和现有前端资源装配冲突；但需要把责任边界写清楚，并在后续任务继续收口。

## 4. 范围边界

### 4.1 In Scope

- `backend/modules/auth/**`
- `backend/internal/middleware/cors_middleware.go`
- 新增平台安全头 middleware
- `backend/cmd/server/main.go`
- `frontend/src/modules/auth/**`
- `frontend/src/api/request.ts`
- `frontend/src/store/useAuthStore.ts`
- `frontend/src/core/auth/**`
- 直接依赖当前 auth 主链路合同的 targeted tests 与 smoke helper

### 4.2 Out Of Scope

- 不在本轮清空所有 smoke 和治理脚本中的 Bearer token 使用
- 不在本轮重写 operation token 方案
- 不在本轮引入完整 CSP 设计
- 不在本轮直接修改 `pantheon-ops` 业务模块代码

## 5. 验收口径

### 5.1 Auth 合同验收

- 浏览器登录、MFA、refresh 响应体不再包含 access/refresh token
- 前端登录与刷新逻辑不再依赖响应体 token
- auth 状态注释与运行时行为一致

### 5.2 HTTP 姿态验收

- 未授权 origin 不再得到反射式 CORS 放行
- 授权 origin 可继续带 cookie 访问
- 每个响应都带最小安全头

### 5.3 继承验收

- 修复发生在 `pantheon-base`
- `pantheon-ops` 后续只需通过 foundation sync 继承共享 auth / middleware / workflow 能力
- 不允许在 `ops` 先落一套平行安全边界补丁

## 6. 后续保留问题

本轮完成后仍需继续跟进：

1. 把 CSRF token 从持久化存储进一步收口为更短生命周期或内存态；
2. 评估 operation token 是否也应走 cookie/session-bound 模型；
3. 为新代码重复率提供 PR 级硬门禁；
4. 把 `ops` 领先于 `base` 的 workflow 改进回收到底座。
