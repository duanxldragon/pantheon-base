# Security Policy

English version: [SECURITY.en.md](./SECURITY.en.md)

## Supported Scope

Pantheon Base 当前优先维护以下范围：

- `platform`：应用壳层、路由装配、工作台聚合
- `system/auth`：认证、会话、Token、安全中心
- `system/iam`：用户、角色、菜单、权限点、角色授权
- `system/org`：部门、岗位、组织架构
- `system/config`：字典、系统设置、配置缓存

如果问题涉及 `business/*`，请在报告中说明具体业务模块。

## Reporting a Vulnerability

请不要在公开 Issue 中直接披露以下信息：

- 管理员账号、密码、验证码
- Access Token、Refresh Token
- 数据库 DSN、Redis 密码、第三方密钥
- 可直接复现攻击的敏感 payload

建议按以下方式提交安全问题：

1. 用邮件或私有渠道先联系维护者；
2. 说明影响层级：`platform` / `system/*` / `business/*`；
3. 提供最小复现步骤、影响范围、日志或截图；
4. 如涉及权限绕过，请明确区分导航、页面、操作、接口四类授权中的哪一层失效。

## Response Expectations

- 收到报告后，会先确认问题归属层级与影响边界；
- 对高风险认证、授权、敏感配置泄露问题优先处理；
- 修复后会同步更新相关测试与文档，避免回归。

## GitHub Security Surfaces

仓库的 Security 页签是本项目的安全信号入口。各入口的处理规则如下：

| 入口 | 当前状态 | 处理规则 |
| --- | --- | --- |
| Security policy | `SECURITY.md`（本文件，英文版见 `SECURITY.en.md`） | 安全控制发生变化时，同 PR 更新本文件 |
| Private vulnerability reporting | 已启用 | 首选私有上报通道；邮件作为备用通道 |
| Code scanning（CodeQL） | 每次 push 到 `main` 与每个 PR 都分析 | 修复，或带理由关闭 |
| Dependabot alerts | 已启用，含安全更新 | 发布前不得存在未处理的 high/critical 告警 |
| Secret scanning | 已启用，并开启 push protection | 命中时轮换凭据；不得绕过 push protection |
| SonarCloud | 自动分析 | 发布门禁要求质量门禁为绿且未处理问题为 0 |

关闭告警必须留痕。`false positive`、`won't fix`、`used in tests` 三种理由都要写明依据：为什么这段代码是安全的、覆盖哪个文件。`frontend/scripts/tenant-matrix-fixture-setup.mjs` 的 `js/file-access-to-http` 即属此类——它把 `.tmp/smoke-tenant-matrix.json` 中本次运行生成的凭据回放给本地 API，这是冒烟夹具的职责，且该目录不随产物发布，因此以 `used in tests` 关闭。

## Runtime Security Baseline

- `system/auth` 浏览器主链路采用 cookie-first：`/api/v1/auth/login`、`/api/v1/auth/mfa/verify`、`/api/v1/auth/refresh` 负责设置 HttpOnly 会话 cookie 与 CSRF header/cookie，同步返回会话元数据，但 token 存储在 Redis 而非暴露给前端。
- 跨域策略由应用层 allowlist 控制。通过 `PANTHEON_ALLOWED_ORIGINS` 配置允许来源；未命中的 `Origin` 不授予 credentialed CORS。
- 应用层默认补齐最小安全响应头：`X-Content-Type-Options: nosniff`、`X-Frame-Options: DENY`、`Referrer-Policy: strict-origin-when-cross-origin`、`Permissions-Policy`。
- `Strict-Transport-Security` 由 `SecurityHeadersMiddleware` 默认下发（`max-age=31536000; includeSubDomains`），`Content-Security-Policy` 由 `CSPMiddleware` 统一下发（单一来源）：开发环境允许 `unsafe-eval` 供 Vite HMR 使用，生产环境移除；可通过 `CSP_REPORT_URI` 配置违规上报端点。两者均在 `backend/cmd/server/main.go` 的 `buildRouter` 中注册，覆盖所有 HTTP 响应。
