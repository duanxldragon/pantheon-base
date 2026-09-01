## 变更摘要

- 改动层级：`platform`
- 改动模块：Base README、CHANGELOG、Foundation Release Model、Harness task/evidence
- 目标问题：本地公开文档与已发布 `pantheon-base-v0.10.25` 的提交身份及 main-only 分支策略不一致
- 预期影响：恢复发布文档、consumer 升级说明和分支策略的单一事实源

## Harness 链路

- Task ID：`2026-09-01-release-docs-reconciliation`
- Task Manifest：`.harness/tasks/2026-09-01-release-docs-reconciliation/manifest.json`
- Evidence：`.harness/evidence/2026-09-01-release-docs-reconciliation/commands.json`
- Verification evidence：`.harness/evidence/2026-09-01-release-docs-reconciliation/summary.md`
- Review Artifact：`.harness/evidence/2026-09-01-release-docs-reconciliation/review.md`
- OpenSpec change：`none`
- Trivial change：`no`
- Quality Profile：`none`
- Ratchet Decision：`no-repeat-observed`
- GitHub Signal：`repo-quality-gate`

## Harness adoption markers

- task id: `2026-09-01-release-docs-reconciliation`
- task manifest: `.harness/tasks/2026-09-01-release-docs-reconciliation/manifest.json`
- evidence: `.harness/evidence/2026-09-01-release-docs-reconciliation/commands.json`
- boundaries: `Base-owned documentation only`
- backend response contract: `unchanged`
- backend DTO contract: `unchanged`
- permission contract: `unchanged`
- audit coverage: `unchanged`
- visual evidence: `not-applicable; no UI change`
- inheritance contract: `consumer guidance only; no Ops change`
- base drift: `none`
- Base/ops inheritance: `deferred`

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

仅修改 Base 文档与 Harness 证据；不修改产品代码、发布资产、Git tag 或 `pantheon-ops`。

## 验证记录

- [ ] 后端测试：不适用，未修改 Go 代码
- [ ] 前端构建：不适用，未修改前端代码
- [ ] 轻量 smoke：不适用，无运行时改动
- [x] 其他专项验证已补充：frontmatter、严格文档链接和 diff 检查通过
- [ ] CodeQL 结果已检查并解释：等待 hosted checks
- [ ] GitHub required checks 通过：等待 hosted checks
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用：automatic policy
- [ ] 已启用或确认将启用 squash auto-merge：由维护者/仓库策略决定

## 审核留痕

- Copilot review：`automatic-policy`
- CodeQL 结果：`pending; docs-only change`
- GitHub checks 结果：`pending`
- Auto-merge：`not-enabled`
- Duplication Gate 结果：`not-applicable; docs-only`
- 是否高风险改动：`no`
- Residual risk / follow-up：`GitHub required checks must pass before merge`

## 检查清单

- [x] 已明确本次改动归属 `platform`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n：本次无前端文案
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步：本次不涉及
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
