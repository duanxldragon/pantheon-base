## 变更摘要

- 改动层级：platform / shared frontend component
- 改动模块：`frontend/src/components/data-display/AppTable.tsx`
- 目标问题：关闭 Release Gate 阻断的唯一 SonarCloud `typescript:S3776` 问题。
- 预期影响：保持既有共享表格渲染和分页行为，降低导出组件的认知复杂度。

## Harness 链路

- Task ID：2026-09-01-release-gate-sonar-cleanup
- Task Manifest：.harness/tasks/2026-09-01-release-gate-sonar-cleanup/manifest.json
- Evidence：.harness/evidence/2026-09-01-release-gate-sonar-cleanup/commands.json
- Verification evidence：.harness/evidence/2026-09-01-release-gate-sonar-cleanup/summary.md
- Review Artifact：.harness/evidence/2026-09-01-release-gate-sonar-cleanup/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：ui-runtime
- Ratchet Decision：no-repeat-observed
- GitHub Signal：repo-quality-gate

## Harness adoption markers

- task id: 2026-09-01-release-gate-sonar-cleanup
- task manifest: .harness/tasks/2026-09-01-release-gate-sonar-cleanup/manifest.json
- evidence: .harness/evidence/2026-09-01-release-gate-sonar-cleanup/commands.json
- boundaries: platform-only private presentation extraction; no backend or system-domain contract changed
- backend response contract: not-applicable
- backend DTO contract: not-applicable
- permission contract: not-applicable
- audit coverage: not-applicable
- visual evidence: .harness/evidence/2026-09-01-release-gate-sonar-cleanup/summary.md
- inheritance contract: Base release follows green main; Ops consumes only the published artifact
- base drift: not-applicable
- Base/ops inheritance: no Ops source change; temporary overlay validation follows publication

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

共享 `AppTable` 的 public props 和 rendered branches 保持不变；不变更菜单、权限、i18n、审计、接口、数据库或 Ops 业务代码。

## 验证记录

- [x] 后端测试：not-applicable
- [x] 前端构建：`cd frontend && npm run build`
- [x] 轻量 smoke：focused Playwright pagination contract, 4/4 passed
- [x] 如涉及系统域深链路，已补充专项 smoke：not-applicable
- [x] 其他专项验证已补充：`npm run type-check` and `npm run lint`
- [x] CodeQL 结果已检查并解释：hosted required check pending; no CodeQL-sensitive code changed
- [x] 如有 open CodeQL alert，已说明是新增问题、既有 baseline、误报还是已补 follow-up：none known
- [x] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [ ] GitHub required checks 通过：pending
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用：automatic-policy
- [ ] 已启用或确认将启用 squash auto-merge：enabled after required checks pass

补充说明：本 PR 必须通过 SonarCloud，合并后的 Release Gate Summary 才允许发布。

## 审核留痕

- Copilot review：automatic-policy
- CodeQL 结果：pending hosted required check; no security-sensitive scope
- GitHub checks 结果：pending
- Auto-merge：enabled after required checks pass
- Duplication Gate 结果：pending
- 是否高风险改动：no
- Residual risk / follow-up：SonarCloud must confirm the historical S3776 issue closes; then release and validate the Ops overlay in a temporary tree.

## 检查清单

- [x] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n：no new display text
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步：not applicable
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
