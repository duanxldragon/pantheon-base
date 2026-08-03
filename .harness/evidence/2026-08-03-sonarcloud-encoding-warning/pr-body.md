## 变更摘要

- 改动层级：`platform`
- 改动模块：`docs/harness`、`scripts/harness/check-encoding.mjs`
- 目标问题：修复 SonarCloud 最新分析报告的 source encoding warning，以及仓库中确认存在的 `U+FFFD` 内容损坏
- 预期影响：恢复两份中文治理文档，并让编码门禁阻止 replacement character 再次进入仓库；不改变产品运行时行为

## Harness 链路

- Task ID：`2026-08-03-sonarcloud-encoding-warning`
- Task Manifest：`.harness/tasks/2026-08-03-sonarcloud-encoding-warning/manifest.json`
- Evidence：`.harness/evidence/2026-08-03-sonarcloud-encoding-warning/commands.json`
- Verification evidence：`.harness/evidence/2026-08-03-sonarcloud-encoding-warning/summary.md`
- Review Artifact：`.harness/evidence/2026-08-03-sonarcloud-encoding-warning/review.md`
- OpenSpec change：`none`
- Trivial change：`no`
- Quality Profile：`ci-workflow`
- Ratchet Decision：`sensor-added`
- GitHub Signal：`repo-quality-gate`

## Harness adoption markers

- task id: `2026-08-03-sonarcloud-encoding-warning`
- task manifest: `.harness/tasks/2026-08-03-sonarcloud-encoding-warning/manifest.json`
- evidence: `.harness/evidence/2026-08-03-sonarcloud-encoding-warning/commands.json`
- boundaries: `platform governance and encoding sensor only`
- backend response contract: `unchanged`
- backend DTO contract: `unchanged`
- permission contract: `unchanged`
- audit coverage: `unchanged`
- visual evidence: `not-applicable; no UI change`
- inheritance contract: `base-only governance correction; no ops sync required`
- base drift: `none`
- Base/ops inheritance: `not-applicable`

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

本次仅修改平台治理文档与编码检查器，不涉及业务代码、API、数据库、权限、菜单、i18n 生命周期或 UI。

## 验证记录

- [ ] 后端测试：不适用，未修改 Go 代码
- [ ] 前端构建：不适用，未修改前端产品代码
- [ ] 轻量 smoke：不适用，无运行时改动
- [ ] 如涉及系统域深链路，已补充专项 smoke：不适用
- [x] 其他专项验证已补充：编码门禁 0 findings / 1135 files；编码测试 8/8；frontmatter 与文档链接检查通过；`git diff --check` 通过
- [ ] CodeQL 结果已检查并解释：等待 hosted checks
- [x] 如有 open CodeQL alert，已说明是新增问题、既有 baseline、误报还是已补 follow-up：当前无已知 open alert
- [x] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [ ] GitHub required checks 通过：等待 hosted checks
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用：automatic policy
- [ ] 已启用或确认将启用 squash auto-merge

补充说明：PR 通过后合并到 `main`，以 SonarCloud Automatic Analysis 的新 revision 为编码告警最终证据。

## 审核留痕

- Copilot review：`automatic-policy`
- CodeQL 结果：`pending`
- GitHub checks 结果：`pending`
- Auto-merge：`not-enabled`
- Duplication Gate 结果：`pending`
- 是否高风险改动：`no; governance documents and focused quality sensor only`
- Residual risk / follow-up：`hosted SonarCloud must complete a new main analysis without the encoding warning`

## 检查清单

- [x] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n：本次无前端文案
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步：本次不涉及
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
