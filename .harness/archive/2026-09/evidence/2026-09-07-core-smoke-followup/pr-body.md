## 变更摘要

- 改动层级：`system-iam` smoke verification and PR governance
- 改动模块：`frontend/tests/smoke-core/*`
- 目标问题：修复 Core Smoke 与当前菜单、用户 DTO 的字段和响应模型漂移
- 预期影响：仅提升 smoke 运行态覆盖，不改变生产 API、数据库或权限行为

## Harness 链路

- Task ID：`2026-09-07-core-smoke-followup`
- Task Manifest：`.harness/tasks/2026-09-07-core-smoke-followup/manifest.json`
- Evidence：`.harness/evidence/2026-09-07-core-smoke-followup/commands.json`
- Verification evidence：`.harness/evidence/2026-09-07-core-smoke-followup/summary.md`
- Review Artifact：`.harness/evidence/2026-09-07-core-smoke-followup/review.md`
- OpenSpec change：not-applicable
- Trivial change：no
- Quality Profile：permission-policy
- Ratchet Decision：no-repeat-observed
- GitHub Signal：runtime-evidence-gate

## Harness adoption markers

- task id: `2026-09-07-core-smoke-followup`
- task manifest: `.harness/tasks/2026-09-07-core-smoke-followup/manifest.json`
- evidence: `.harness/evidence/2026-09-07-core-smoke-followup/`
- boundaries: smoke tests and fixtures only; no production runtime source
- backend response contract: unchanged; tests align to existing DTO fields
- backend DTO contract: unchanged; request payloads now match existing DTOs
- permission contract: unchanged
- audit coverage: unchanged
- visual evidence: not-applicable; no UI runtime code changed
- inheritance contract: Base remains the sole owner of `platform` and `system/*`
- base drift: no
- Base/ops inheritance: release remains blocked until Base merge and release gate

## 边界说明

- [ ] 本次改动仅涉及单一层级
- [x] 本次改动涉及跨层，已说明边界与依赖

Smoke tests cross the frontend test layer and backend DTO contracts for request/response shape only; no backend implementation is modified.

## 验证记录

- [x] 前端类型检查：`cd frontend && npm run type-check`
- [x] 前端 lint：`cd frontend && npm run lint`
- [x] `git diff --check`
- [ ] 轻量 smoke：等待 GitHub Core Smoke
- [x] 如涉及系统域深链路，已补充专项 smoke：Core Smoke suite updated
- [x] 其他专项验证已补充：fixture contract review
- [ ] CodeQL 结果已检查并解释：等待 GitHub check
- [x] 如有 open CodeQL alert，已说明是新增问题、既有 baseline、误报还是已补 follow-up：本 PR 仅测试文件，等待 hosted baseline
- [x] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [ ] GitHub required checks 通过：等待本 PR checks
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用：automatic-policy
- [ ] 已启用或确认将启用 squash auto-merge：等待门禁与 review

## 审核留痕

- Copilot review：automatic-policy
- CodeQL 结果：等待本 PR GitHub check
- GitHub checks 结果：等待本 PR GitHub check
- Auto-merge：not-enabled
- Duplication Gate 结果：等待本 PR GitHub check
- 是否高风险改动：是；触碰 `system-iam` smoke authorization paths
- Residual risk / follow-up：本地缺少 MySQL/Redis；必须以 hosted Core Smoke 和 Release Gate Summary 为准

## 检查清单

- [x] 已明确本次改动归属 `system/iam`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n：not-applicable
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步：payload contract evidence updated
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
