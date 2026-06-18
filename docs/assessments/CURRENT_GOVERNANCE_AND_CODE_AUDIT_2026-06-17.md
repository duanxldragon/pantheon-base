---
title: 当前治理与代码审计基线（2026-06-17）
doc_type: Assessment
layer: platform
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/SYSTEM_AUTH_CONTRACT.md
  - docs/contracts/SYSTEM_IAM_CONTRACT.md
updated_at: 2026-06-17
---

# 当前治理与代码审计基线（2026-06-17）

本文是当前有效的审计基线，用于区分：

- 仍然真实、需要继续整改的问题
- 已经通过代码或 workflow 治理完成的事项
- 已经过时、不能再作为当前事实源的旧审计结论

## 1. 当前仍然真实的问题

### P1

1. `system/auth` 仍直接耦合 `system/iam/user` 具体类型和 helper，边界未真正收敛。
   - `backend/modules/auth/auth_dto.go`
   - `backend/modules/auth/auth_handler.go`
   - `backend/modules/auth/auth_service.go`
   - `backend/modules/auth/auth_password_service.go`
   - `backend/modules/auth/auth_session_service.go`

2. 服务启动仍缺少优雅关闭，当前使用 `gin.Engine.Run` 直接阻塞。
   - `backend/cmd/server/main.go`

3. 前端缺少更贴近运行时代码的单元/组件测试层，`frontend/src` 下当前没有 colocated test。
   - `frontend/src/**`
   - 当前测试主体仍集中在 `frontend/tests/api` 与 `frontend/tests/smoke`

### P2

1. CSRF 比较仍使用直接字符串比较，可进一步收敛为 constant-time compare。
   - `backend/internal/middleware/csrf_middleware.go`

2. Redis 初始化路径仍以内建 `context.Background()` 起步，运维成熟度还有提升空间。
   - `backend/pkg/database/redis.go`

3. 仓库级开发脚本仍偏分散，缺少更统一的 root orchestration 入口。
   - `package.json`

4. 仓库重复率在 PR 上仍是 report-only，直到 new-code duplication gate 落地前都只是可见，不是彻底前置阻断。
   - `.github/workflows/quality.yml`

## 2. 本轮已确认修正的治理点

1. `quality.yml` 中未使用的 `pantheon-base-foundation` 二次 checkout 已删除。
2. `pr-automation.yml` 现在先校验 PR governance body，再允许自动开启 squash auto-merge。
3. 认证响应与前端会话帮助脚本已收敛到 cookie-first / header-first 契约，不再依赖响应体 token 字段。
4. CORS 已改为 allowlist，最小安全响应头已补齐。

## 3. 已过时、不能再作为当前事实源的旧结论

以下历史文档包含已失效结论，只能作为历史背景，不能再直接作为当前缺陷列表：

- `docs/assessments/pantheon-base-audit-report.md`
- `docs/assessments/pantheon-base-analysis.md`
- `docs/assessments/CODE_REVIEW_2026-06-12.md`

已确认失效的典型旧结论包括：

1. “仓库没有 `.github/workflows/`”
2. “没有 `auth_handler_test.go`”
3. “Cookie `Secure: false` 仍是默认行为”
4. “缺少任何前端测试”
5. “当前主问题仍应以 Sonar 作为合并门禁”

## 4. 后续整改顺序

1. 先做 `system/auth` 与 `system/iam/user` 的边界收敛。
2. 再补服务优雅关闭和运行态基础设施收口。
3. 然后补前端 `src` 贴身测试层与 root 级统一脚本。
4. 最后把当前审计基线迁移为 `pantheon-ops` 的继承输入，避免业务仓重新审一遍底座治理问题。
