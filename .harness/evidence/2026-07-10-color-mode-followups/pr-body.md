## 变更摘要

- 改动层级：`platform`
- 改动模块：`frontend shell/theme`、`frontend/tests/smoke`、`docs/designs`、`docs/harness`
- 目标问题：PR #163 在承接 color-mode follow-up commits 后，需要补齐 smoke 稳定性修复和治理链路，确保 Docs Governance 基于真实 artifact 通过。
- 预期影响：保留已落地的 dark-mode follow-up 内容，同时让 smoke helper 与 system form smoke 在当前基线稳定通过。

## Harness 链路

- Task ID：`2026-07-10-color-mode-followups`
- Task Manifest：`.harness/tasks/2026-07-10-color-mode-followups/manifest.json`
- Evidence：`.harness/evidence/2026-07-10-color-mode-followups/commands.json`
- Verification evidence：`.harness/evidence/2026-07-10-color-mode-followups/summary.md`
- Review Artifact：`.harness/evidence/2026-07-10-color-mode-followups/review.md`
- OpenSpec change：`none`
- Trivial change：`no`
- Quality Profile：`ui-runtime`
- Ratchet Decision：`no-repeat-observed`
- GitHub Signal：`repo-quality-gate`

## Harness adoption markers

- task id: `2026-07-10-color-mode-followups`
- task manifest: `.harness/tasks/2026-07-10-color-mode-followups/manifest.json`
- evidence: `.harness/evidence/2026-07-10-color-mode-followups/commands.json`
- boundaries: `frontend shell/theme + frontend/tests/smoke + docs/designs + docs/harness`
- backend response contract: `unchanged`
- backend DTO contract: `unchanged`
- permission contract: `unchanged`
- audit coverage: `unchanged`
- visual evidence: `no fresh rendered screenshot in this recovery pass; smoke validation only`
- inheritance contract: `unchanged`
- base drift: `none`
- Base/ops inheritance: `base only`

## 边界说明

- [ ] 本次改动仅涉及单一层级
- [x] 本次改动涉及跨层，已说明边界与依赖

> 本次改动落在 `platform` 前端壳层、`frontend/tests/smoke` 与 `docs/harness`。不涉及后端合同、菜单 seed、权限命名或审计链路变更；菜单/i18n 合同已本地复核通过。

## 验证记录

- [ ] 后端测试：`go test ./...`
- [ ] 前端构建：`cd frontend && npm run build`
- [x] 轻量 smoke：`cd frontend && npm run test:smoke:platform:contracts && npm run test:smoke:system:pages`
- [x] 如涉及系统域深链路，已补充专项 smoke：`cd frontend && npm run test:smoke:system:iam-authz`
- [x] 其他专项验证已补充
- [x] CodeQL 结果已检查并解释
- [x] 如有 open CodeQL alert，已说明是新增问题、既有 baseline、误报还是已补 follow-up
- [x] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [ ] GitHub required checks 通过
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用
- [x] 已启用或确认将启用 squash auto-merge

补充说明：

- 本 PR 用于补齐 `origin/feat/color-mode` 在 PR #162 合并后的 follow-up 提交，并同步修复 smoke helper 的会话预加载问题。
- 已本地通过：
  - `node --test frontend/tests/api/auth-smoke-helper.test.ts`
  - `npm run test:smoke:system:forms`
  - `npm run test:smoke:system:iam-authz`
  - `npm run test:smoke:system:pages`
- `no fresh rendered screenshot` 是当前恢复批次的已知 gap，已在证据文件中记录。

## 审核留痕

- Copilot review：`unavailable`
- CodeQL 结果：`pending via Security Gates`
- GitHub checks 结果：`pending`
- Auto-merge：`enabled`
- Duplication Gate 结果：`passed locally via workflow check`
- 是否高风险改动：`no`
- Residual risk / follow-up：`No fresh rendered screenshot was captured in this recovery pass; hosted checks still need to complete after the body update.`

## 检查清单

- [x] 已明确本次改动归属 `platform`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
