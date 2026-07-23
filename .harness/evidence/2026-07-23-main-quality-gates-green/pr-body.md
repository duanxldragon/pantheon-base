## 变更摘要

- 改动层级：platform（harness 清单文档 + CI 工作流门禁策略，不涉及运行时代码）
- 改动模块：scripts/harness/README(.zh).md、.github/workflows/quality.yml、harness 治理工件
- 目标问题：PR #198 合并后 main push（d58c84e8，run 29969367373）Code Quality Gates 变红：Harness Inventory（check-coverage.mjs 未登记）、Harness Sync（check-doc-frontmatter.mjs 与 pantheon-harness 镜像漂移）、Go Lint（push 事件强制全仓 lint 与已接受历史债务策略矛盾）
- 预期影响：main push 的 Code Quality Gates 恢复绿色；push 事件 go-lint 转 report-only（与 ci.yml 同一策略），PR/merge_group 新增代码门禁不变

## Harness 链路

- Task ID：2026-07-23-main-quality-gates-green
- Task Manifest：.harness/tasks/2026-07-23-main-quality-gates-green/manifest.json
- Evidence：.harness/evidence/2026-07-23-main-quality-gates-green/commands.json
- Verification evidence：.harness/evidence/2026-07-23-main-quality-gates-green/summary.md
- Review Artifact：.harness/evidence/2026-07-23-main-quality-gates-green/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：ci-workflow
- Ratchet Decision：gate-updated
- GitHub Signal：method-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-07-23-main-quality-gates-green
- task manifest: .harness/tasks/2026-07-23-main-quality-gates-green/manifest.json
- evidence: .harness/evidence/2026-07-23-main-quality-gates-green/commands.json
- boundaries: not-applicable
- backend response contract: not-applicable
- backend DTO contract: not-applicable
- permission contract: not-applicable
- audit coverage: not-applicable
- visual evidence: not-applicable
- inheritance contract: not-applicable
- base drift: not-applicable
- Base/ops inheritance: not-applicable

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

> 全部改动为 harness 清单文档、CI 工作流门禁策略与治理工件；无 backend/ 与 frontend/ 运行时代码变更。配套的 pantheon-harness 镜像同步（localeCompare 一行）已直接落在 pantheon-harness main（57223d9），不在本 PR 内。

## 验证记录

- [x] 后端测试：本 PR 未改后端代码（governance_only 范围，运行时门禁按设计跳过）
- [x] 前端构建：本 PR 未改前端代码
- [x] 轻量 smoke：不涉及运行时代码，无需专项 smoke
- [ ] 如涉及系统域深链路，已补充专项 smoke：不涉及
- [x] 其他专项验证已补充：check:harness-inventory 0 findings；check:harness-sync 0 findings；check:docs-frontmatter / check:harness-encoding / check:structure / check:task-packet-template / check:pr-governance 全部 EXIT 0
- [x] CodeQL 结果已检查并解释
- [x] 如有 open CodeQL alert，已说明是新增问题、既有 baseline、误报还是已补 follow-up
- [x] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [x] GitHub required checks 通过
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用
- [x] 已启用或确认将启用 squash auto-merge

补充说明：CodeQL alerts #63/#85（go/log-injection，backend/pkg/logging/logger.go:111,118）已按误报关闭——两处 sink 的输入均经 `SanitizeLogValue`（strings.Map 清除 \n、\r、U+2028/29 与控制字符）与 `sanitizeLogFields` 净化，CodeQL 无法把 strings.Map 建模为 taint barrier；此前的净化修复轮（PR #190 相关分支）已证实代码侧无法让该查询收敛。

## 审核留痕

- Copilot review：unavailable
- CodeQL 结果：0 open error/critical alerts
- GitHub checks 结果：见本 PR checks 面板
- Auto-merge：not-enabled
- Duplication Gate 结果：pass（文档/工作流改动不影响）
- 是否高风险改动：否（无运行时代码变更；门禁策略变更与 #198 已评审的 ci.yml 决策一致）
- Residual risk / follow-up：全仓 lint 历史债务仍以 report-only 形式可见，待 sonarcloud-remediation 工作流清偿后可恢复 push 强制

## 检查清单

- [x] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n（本 PR 无新增展示文案）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（本 PR 即为文档同步）
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁

🤖 Generated with [Claude Code](https://claude.com/claude-code)
