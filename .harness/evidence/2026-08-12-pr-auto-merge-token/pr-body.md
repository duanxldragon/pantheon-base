## 变更摘要

- 改动层级：`platform`
- 改动模块：`.github/workflows/pr-automation.yml`、`tests/scripts/pr-automation-workflow.test.mjs`
- 目标问题：修复全部检查通过后 `gh pr merge --auto` 因缺少 `GH_TOKEN` 失败，同时 workflow 吞掉错误并错误报告成功
- 预期影响：自动合并使用最小作用域的 `github.token`，启用失败时门禁真实变红

## Harness 链路

- Task ID：`2026-08-12-pr-auto-merge-token`
- Task Manifest：`.harness/tasks/2026-08-12-pr-auto-merge-token/manifest.json`
- Evidence：`.harness/evidence/2026-08-12-pr-auto-merge-token/commands.json`
- Verification evidence：`.harness/evidence/2026-08-12-pr-auto-merge-token/summary.md`
- Review Artifact：`.harness/evidence/2026-08-12-pr-auto-merge-token/review.md`
- OpenSpec change：`none`
- Trivial change：`no`
- Quality Profile：`ci-workflow`
- Ratchet Decision：`gate-updated`
- GitHub Signal：`repo-quality-gate`

## Harness adoption markers

- task id: `2026-08-12-pr-auto-merge-token`
- task manifest: `.harness/tasks/2026-08-12-pr-auto-merge-token/manifest.json`
- evidence: `.harness/evidence/2026-08-12-pr-auto-merge-token/commands.json`
- boundaries: `platform GitHub PR automation only`
- backend response contract: `unchanged`
- backend DTO contract: `unchanged`
- permission contract: `unchanged`
- audit coverage: `unchanged`
- visual evidence: `not-applicable; no UI change`
- inheritance contract: `base-only workflow correction; no ops sync required`
- base drift: `none`
- Base/ops inheritance: `not-applicable`

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

本次只修复 GitHub PR 自动化，不修改产品代码、API、数据库、权限、菜单、i18n 或 foundation 内容。

## 验证记录

- [ ] 后端测试：不适用，未修改 Go 代码
- [ ] 前端构建：不适用，未修改前端产品代码
- [ ] 轻量 smoke：不适用，无产品运行时改动
- [ ] 如涉及系统域深链路，已补充专项 smoke：不适用
- [x] 其他专项验证已补充：`npm run test:pr-automation-workflow` 2/2；frontmatter、task packet 与 `git diff --check` 通过
- [ ] CodeQL 结果已检查并解释：等待 hosted checks
- [x] 如有 open CodeQL alert，已说明是新增问题、既有 baseline、误报还是已补 follow-up：当前无已知 open alert
- [x] Full Smoke 仅在必要时手动或预发布执行，未错误纳入本地验证
- [ ] GitHub required checks 通过：等待 hosted checks
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用：automatic policy
- [ ] 已启用或确认将启用 squash auto-merge：由本 PR 修复后的 workflow 验证

## 审核留痕

- Copilot review：`automatic-policy`
- CodeQL 结果：`pending`
- GitHub checks 结果：`pending`
- Auto-merge：`pending hosted proof`
- Duplication Gate 结果：`pending`
- 是否高风险改动：`yes; GitHub workflow write automation`
- Residual risk / follow-up：`hosted workflow must prove the token enables GitHub auto-merge`

## 检查清单

- [x] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n：本次无前端文案
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步：本次不涉及
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和仓库门禁负责最终合并
