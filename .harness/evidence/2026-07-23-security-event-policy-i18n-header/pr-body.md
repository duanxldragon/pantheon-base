## 变更摘要

- 改动层级：system/iam（权限链补全）+ system/config UI（i18n 管理页未设计元素移除）
- 改动模块：backend/modules/system/iam/permission/permission_workbench.go（+测试）、frontend/src/modules/system/i18n/I18nList.tsx
- 目标问题：①安全审计-安全事件的"清理历史事件"对非 admin 角色不可用——权限工作台的 requiredAPIPoliciesByPermissionKey 只登记了 system:security-event:list，clear/acknowledge 授权后不会生成/建议 Casbin API 策略，调用 cleanup 一律 403，表现为"只有前端没有后端"；②国际化管理翻译表格上方的 system-list__table-head 块把行详情弹窗的"翻译详情"标题误用为表头标题，未经设计、越过 UI 门禁
- 预期影响：授予 system:security-event:clear/acknowledge 的角色经工作台"一键补全"后可正常调用 cleanup/acknowledge 接口（Casbin keyMatch2 已支持 :id 模式）；i18n 列表页不再渲染"翻译详情"表头（总数由标准分页展示，i18n.viewTitle 键保留给详情弹窗）

## Harness 链路

- Task ID：2026-07-23-security-event-policy-i18n-header
- Task Manifest：.harness/tasks/2026-07-23-security-event-policy-i18n-header/manifest.json
- Evidence：.harness/evidence/2026-07-23-security-event-policy-i18n-header/commands.json
- Verification evidence：.harness/evidence/2026-07-23-security-event-policy-i18n-header/summary.md
- Review Artifact：.harness/evidence/2026-07-23-security-event-policy-i18n-header/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：permission-policy
- Ratchet Decision：sensor-added
- GitHub Signal：repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-07-23-security-event-policy-i18n-header
- task manifest: .harness/tasks/2026-07-23-security-event-policy-i18n-header/manifest.json
- evidence: .harness/evidence/2026-07-23-security-event-policy-i18n-header/commands.json
- boundaries: system/iam permission mapping + system UI; no cross-layer write
- backend response contract: not-applicable
- backend DTO contract: not-applicable
- permission contract: requiredAPIPoliciesByPermissionKey extended for system:security-event:acknowledge/clear; enforced via existing Casbin keyMatch2 matcher
- audit coverage: not-applicable
- visual evidence: not-produced — pure removal of one undesigned JSX block; reason recorded in commands.json; static UI gates (admission/shell-visual/ui-contract) green
- inheritance contract: not-applicable
- base drift: not-applicable
- Base/ops inheritance: not-applicable

## 边界说明

- [ ] 本次改动仅涉及单一层级
- [x] 本次改动涉及跨层，已说明边界与依赖

> 后端仅改 system/iam 权限工作台的 permission-key→API 策略映射（不改路由/handler/service）；前端仅删 i18n 管理页一个未设计的表头块。两者互不依赖，共同回应同一轮验收反馈。

## 验证记录

- [x] 后端测试：go build ./... 通过；go test ./modules/system/iam/permission -run TestPermissionWorkbench 通过（含新增 TestPermissionWorkbenchRequiresSecurityEventActionPolicies）
- [x] 前端构建：tsc --noEmit 干净；eslint 目标文件 0 警告
- [x] 轻量 smoke：check:smoke-web-base（94 文件）与 check:smoke-coverage-contract（28 specs）通过
- [ ] 如涉及系统域深链路，已补充专项 smoke：cleanup 链路后端已有服务层测试（TestCleanupSecurityEvents_OnlyAcknowledged）；本 PR 未改该链路代码
- [x] 其他专项验证已补充：check-system-page-admission（16 entries）、check-shell-visual-contract、check:i18n-hardcode（194 文件）、check:ui-contract（0/228）全部通过
- [x] CodeQL 结果已检查并解释
- [x] 如有 open CodeQL alert，已说明是新增问题、既有 baseline、误报还是已补 follow-up
- [x] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [x] GitHub required checks 通过
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用
- [x] 已启用或确认将启用 squash auto-merge

## 审核留痕

- Copilot review：unavailable
- CodeQL 结果：0 open error/critical alerts
- GitHub checks 结果：见本 PR checks 面板
- Auto-merge：enabled（pr-automation automate-solo-pr）
- Duplication Gate 结果：pass（小规模映射+删除，不引入重复）
- 是否高风险改动：否——权限映射只让"已显式授权"的权限可用，不放宽任何未授权访问；三条路由的 SecureAction 二次验证不变；UI 为纯删除
- Residual risk / follow-up：login-log/session 动作权限存在同类映射缺口（manifest.deferredCodeIssues 已记录）；此前已授权 clear/acknowledge 的角色需在权限工作台执行一次"一键补全"回填策略

## 检查清单

- [x] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n（本 PR 只删文案，不新增）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（summary.md 记录映射表）
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁

🤖 Generated with [Claude Code](https://claude.com/claude-code)
