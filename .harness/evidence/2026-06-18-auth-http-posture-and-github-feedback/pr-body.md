## 变更摘要

- 改动层级：`system/auth + platform + repository-governance`
- 改动模块：`auth runtime contract / platformprefs / middleware posture / GitHub feedback automation`
- 目标问题：`收敛浏览器 auth 为 cookie-first，会话偏好脱离 system/iam helper，补齐 allowlisted CORS 与安全响应头，并把 GitHub PR/issue/discussion 评论闭环接入 solo PR 自动收口`
- 预期影响：`浏览器认证不再依赖响应体 token；跨层偏好契约更清晰；PR 只有在治理字段和 GitHub 反馈都闭环时才自动开启 squash auto-merge`

## Harness 链路

- Task Packet：`docs/harness/tasks/2026-06-18-auth-http-posture-and-github-feedback.task.md`
- Task packet：`docs/harness/tasks/2026-06-18-auth-http-posture-and-github-feedback.task.md`
- Evidence：`.harness/evidence/2026-06-18-auth-http-posture-and-github-feedback/commands.json`
- Verification evidence：`.harness/evidence/2026-06-18-auth-http-posture-and-github-feedback/summary.md`
- Review Artifact：`.harness/evidence/2026-06-18-auth-http-posture-and-github-feedback/review.md`
- OpenSpec change：`none`
- Trivial change：`no`
- Quality Profile：`auth-security`
- Ratchet Decision：`gate-updated`
- GitHub Signal：`repo-quality-gate`

## Harness adoption markers

- task packet: `docs/harness/tasks/2026-06-18-auth-http-posture-and-github-feedback.task.md`
- evidence: `.harness/evidence/2026-06-18-auth-http-posture-and-github-feedback/`
- boundaries: `system/auth + platform middleware + repository-governance`
- backend response contract: `browser auth success payloads stop exposing raw accessToken/refreshToken/token fields`
- backend DTO contract: `platform preferences now flow through backend/pkg/platformprefs instead of direct auth -> iam helper coupling`
- permission contract: `retains previously validated permission remediation schema compatibility commit already documented in 2026-06-17-permission-workbench-remediation-schema-compat`
- audit coverage: `targeted backend, frontend, middleware, and governance workflow tests`
- visual evidence: `none`
- inheritance contract: `ops follow-up deferred until base PR flow is green`
- base drift: `none`
- Base/ops inheritance: `base-first GitHub feedback automation; ops follow-up deferred`

## 边界说明

- [ ] 本次改动仅涉及单一层级
- [x] 本次改动涉及跨层，已说明边界与依赖

> 本次跨层的原因是浏览器 auth 的真实运行契约同时穿过 `system/auth`、platform-owned middleware、shared frontend request helper，以及仓库级 GitHub PR 自动化。`system/auth` 负责 cookie-first 会话语义与平台偏好契约，platform middleware 负责 HTTP posture，GitHub workflow/scripts 负责单人维护 PR 收口。未修改 `pantheon-ops` 业务域。

## 验证记录

- [ ] 后端测试：`go test ./...`
- [ ] 前端构建：`cd frontend && npm run build`
- [ ] 轻量 smoke：`cd frontend && npm run test:smoke:platform:contracts && npm run test:smoke:system:pages`
- [ ] 如涉及系统域深链路，已补充专项 smoke：`cd frontend && npm run test:smoke:system:iam-authz`
- [x] 其他专项验证已补充
- [ ] CodeQL 结果已检查并解释
- [ ] 如有 open CodeQL alert，已说明是新增问题、既有 baseline、误报还是已补 follow-up
- [x] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [ ] GitHub required checks 通过
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用
- [ ] 已启用或确认将启用 squash auto-merge

补充说明：

- 本地专项验证将覆盖 `backend/pkg/platformprefs`、`backend/modules/auth`、`backend/internal/middleware`、`backend/pkg/database`、`backend/modules/system/iam/permission`、frontend auth API tests、GitHub feedback/pr-automation/security/quality workflow tests，以及 PR governance synthetic event 校验。
- `go test ./...`、frontend full build 与 GitHub required checks 以 PR 远端门禁结果为准，本地摘要只记录本轮 targeted proof。

## 审核留痕

- Copilot review：`requested`
- CodeQL 结果：`pending-github-checks`
- GitHub checks 结果：`pending-github-checks`
- Auto-merge：`not-enabled`
- Duplication Gate 结果：`report-only-on-pr`
- 是否高风险改动：`yes - auth runtime and middleware posture`
- Residual risk / follow-up：`graceful shutdown、constant-time csrf compare、frontend colocated tests、ops inheritance sync stay as follow-up items`

## 检查清单

- [x] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
