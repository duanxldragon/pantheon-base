## 变更摘要

- 改动层级: system/iam test coverage
- 改动模块: Core Smoke menu selector
- 目标问题: Created menu renders system.menu.smoke_cor..., but smoke_core locator cannot match it
- 预期影响: Full unique titleKey search still verifies the created/edited row using its visible prefix

## Harness 链路

- Task ID: 2026-11-13-docs-archive-closeout
- Task Manifest: .harness/tasks/2026-11-13-docs-archive-closeout/manifest.json
- Evidence: .harness/evidence/2026-11-13-docs-archive-closeout/commands.json
- Verification evidence: .harness/evidence/2026-11-13-docs-archive-closeout/summary.md
- Review Artifact: .harness/evidence/2026-11-13-docs-archive-closeout/review.md
- OpenSpec change: none
- Trivial change: no
- Quality Profile: ci-workflow
- Ratchet Decision: guide-updated
- GitHub Signal: repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-11-13-docs-archive-closeout
- task manifest: .harness/tasks/2026-11-13-docs-archive-closeout/manifest.json
- evidence: .harness/evidence/2026-11-13-docs-archive-closeout/commands.json
- boundaries: test-only visible prefix correction; full-key search and all mutations unchanged
- backend response contract: none
- backend DTO contract: none
- permission contract: none
- audit coverage: none
- visual evidence: .harness/archive/2026-11/evidence/2026-11-13-docs-archive-closeout/menu-core-original-failure.jpg
- inheritance contract: none
- base drift: none
- Base/ops inheritance: Ops planned task and existing work untouched

## 边界说明

- [ ] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

> 如果跨层，请补充说明：本次为什么跨层、各层分别承担什么职责、是否影响菜单/权限/i18n/审计。

## 验证记录

- [ ] 后端测试：`go test ./...`
- [ ] 前端构建：`cd frontend && npm run build`
- [ ] L0 静态契约：`cd frontend && npm run test:smoke:l0`
- [ ] L1 关键路径 smoke（PR 必过）：`cd frontend && npm run test:smoke:l1`
- [ ] L2 命中模块 smoke（PR 按改动路径自动选择，也可本地手跑）：`cd frontend && npm run test:smoke:module:<iam|config|i18n|audit|org|platform|all>`
- [ ] 如涉及系统域深链路，已补充专项 smoke：`cd frontend && npm run test:smoke:system:iam-authz`
- [ ] 其他专项验证已补充
- [ ] CodeQL 结果已检查并解释
- [ ] 如有 open CodeQL alert，已说明是新增问题、既有 baseline、误报还是已补 follow-up
- [ ] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [ ] GitHub required checks 通过
- [ ] Copilot review 已请求，或已说明当前仓库/账号不可用
- [ ] 已启用或确认将启用 squash auto-merge

补充说明：

## 审核留痕

- Copilot review: automatic-policy
- CodeQL 结果: pending exact PR check
- GitHub checks 结果: pending exact PR check and branch Core Smoke
- Auto-merge: enabled by normal repository automation
- Duplication Gate 结果: pending exact PR check
- 是否高风险改动: no; test-only selector fix
- Residual risk / follow-up: Original report-only Core Smoke failure retained; no local backend runtime; branch hosted proof required. Other Ops/production/freeze/S3/FR028 residuals retain separate scope.

## 检查清单

- [ ] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [ ] 未把认证、IAM、组织、配置等系统域职责混写
- [ ] 前端新增展示文案已使用 i18n
- [ ] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [ ] 涉及数据库/权限/菜单/接口变更时，文档已同步
- [ ] 已确认不会泄露敏感配置、账号密码或 Token
- [ ] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁

## Focused evidence

Original run https://github.com/duanxldragon/pantheon-base/actions/runs/43447261398 failed both attempts. Screenshot and snapshot prove the menu exists; the old matcher requires text omitted by Arco ellipsis. Full unique key search remains intact. Local lint/type-check/build and captured-title browser replay passed. Independent CODE APPROVE with0findings and direct smoke-file TypeScript diagnostics0/0. Exact hosted smoke required before closure. No new release needed for this test-only fix.
