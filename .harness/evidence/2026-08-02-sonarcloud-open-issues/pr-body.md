## 变更摘要

- 改动层级：`platform`、`system/auth`、`system/iam`、`system/org`、`system/config`、`lowcode`、`frontend`
- 改动模块：`backend/cmd`、`backend/modules/{auth,lowcode,platform,system}`、`backend/pkg`、`frontend/src/{core,components,modules}`
- 目标问题：`清理 SonarCloud main 基线中的 77 个未解决代码异味，同时保持既有公开行为和系统契约`
- 预期影响：`降低复杂度、收敛函数参数形态与 TypeScript 只读属性；不改变 API、DTO、数据库、权限、菜单、认证、审计或视觉结构`

## Harness 链路

- Task ID：`2026-08-02-sonarcloud-open-issues`
- Task Manifest：`.harness/tasks/2026-08-02-sonarcloud-open-issues/manifest.json`
- Evidence：`.harness/evidence/2026-08-02-sonarcloud-open-issues/commands.json`
- Verification evidence：`.harness/evidence/2026-08-02-sonarcloud-open-issues/summary.md`
- Review Artifact：`.harness/evidence/2026-08-02-sonarcloud-open-issues/review.md`
- OpenSpec change：`none`
- Trivial change：`no`
- Quality Profile：`ui-runtime`
- Ratchet Decision：`sensor-added`
- GitHub Signal：`repo-quality-gate`

## Harness adoption markers

- task id: `2026-08-02-sonarcloud-open-issues`
- task manifest: `.harness/tasks/2026-08-02-sonarcloud-open-issues/manifest.json`
- evidence: `.harness/evidence/2026-08-02-sonarcloud-open-issues/commands.json`
- boundaries: `behavior-preserving refactors across platform and system domains; no public-contract changes`
- backend response contract: `unchanged`
- backend DTO contract: `unchanged`
- permission contract: `unchanged`
- audit coverage: `unchanged`
- visual evidence: `no rendered structure change; production build and UI contracts passed`
- inheritance contract: `base-only; no Pantheon Ops synchronization is required`
- base drift: `none`
- Base/ops inheritance: `not-applicable`

## 边界说明

- [ ] 本次改动仅涉及单一层级
- [x] 本次改动涉及跨层，已说明边界与依赖

复杂度拆分、参数分组、只读属性与 TODO 清理覆盖平台层、系统域和 lowcode 前端模块；各模块保留原调用路径。未改变菜单、权限、i18n 生命周期、认证、审计、数据库或公开接口。

## 验证记录

- [x] 后端测试：`cd backend && go test -count=1 ./... && go vet ./...`
- [x] 前端构建：`cd frontend && npm run build`
- [x] 轻量 smoke：`cd frontend && npm run test:generator:smoke`，以及菜单、i18n、shell/UI、搜索栏、页面准入、web smoke 和覆盖率契约检查
- [ ] 如涉及系统域深链路，已补充专项 smoke：本次不改变系统域运行时行为
- [x] 其他专项验证已补充：`npm run lint`、`npm run type-check`、`npm run test:unit`（15 files / 138 tests）、`npm run check:duplication`（1.85% <= 3%）
- [x] CodeQL 结果已检查并解释
- [x] 如有 open CodeQL alert，已说明是新增问题、既有 baseline、误报还是已补 follow-up
- [x] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [ ] GitHub required checks 通过：Docs Governance、SonarCloud、Frontend Contract、Go Lint、Security Gates、Duplication 已通过；Backend Tests 已修正 i18n 生命周期断言，等待 Linux race 重跑
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用
- [x] 已启用或确认将启用 squash auto-merge

补充说明：Windows 本地 `go test -race ./...` 受 `CGO_ENABLED=0` 限制，Linux hosted gate 是该项的最终验证。

## 审核留痕

- Copilot review：`automatic-policy`
- CodeQL 结果：`passed`
- GitHub checks 结果：`Docs Governance passed; Backend Tests rerun pending after lifecycle assertion correction`
- Auto-merge：`not-enabled`
- Duplication Gate 结果：`passed`
- 是否高风险改动：`yes; shared system and lowcode code paths changed, with behavior-preservation review completed`
- Residual risk / follow-up：`hosted Linux race suite and final SonarCloud re-analysis remain required before merge`

## 检查清单

- [x] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n：本次未新增展示文案
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步：本次未改变这些契约
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
