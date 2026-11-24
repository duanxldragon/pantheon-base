## 变更摘要

- 改动层级: platform / repository governance
- 改动模块: AI entrypoints, task recovery, checker wiring and pinned method CI
- 目标问题: Stale context and lexical script references can hide missing execution or policy drift.
- 预期影响: Find current tasks with less repeated reading and reject provenance/wiring counterexamples without weakening existing gates.

## Harness 链路

- Task ID: 2026-11-24-workflow-context-improvement
- Task Manifest: .harness/tasks/2026-11-24-workflow-context-improvement/manifest.json
- Evidence: .harness/evidence/2026-11-24-workflow-context-improvement/commands.json
- Verification evidence: .harness/evidence/2026-11-24-workflow-context-improvement/summary.md
- Review Artifact: .harness/evidence/2026-11-24-workflow-context-improvement/review.md
- OpenSpec change: none
- Trivial change: no
- Quality Profile: ci-workflow
- Ratchet Decision: sensor-added
- GitHub Signal: method-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-11-24-workflow-context-improvement
- task manifest: .harness/tasks/2026-11-24-workflow-context-improvement/manifest.json
- evidence: .harness/evidence/2026-11-24-workflow-context-improvement/commands.json
- boundaries: Method-only; no product source changes. Shared sensors in Base, portable helper in Harness, declared local overlays in Ops.
- backend response contract: none
- backend DTO contract: none
- permission contract: none
- audit coverage: none
- visual evidence: none
- inheritance contract: Base-first shared-sensor publication deferred
- base drift: No shared product file copied from Base HEAD
- Base/ops inheritance: Locked Base release 0.18.9 unchanged; Ops uses owned workflow/adapter/assets

## 边界说明

- [ ] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

> 如果跨层，请补充说明：本次只提交机制改动，其他工具的 Ops 功能开发不在此 PR。隔离分支基于最新 main；具体命令与真实退出见 evidence。

Local validation: Harness 124/124, Base 19/19, Ops workflow/rebuild 29/29; read-only consumption, current indexes, docs/encoding, locked snapshot rebuild, overlay and 866-file shared drift passed. No UI/runtime source changed.

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

补充说明：本次只提交机制改动，其他工具的 Ops 功能开发不在此 PR。隔离分支基于最新 main；具体命令与真实退出见 evidence。

Local validation: Harness 124/124, Base 19/19, Ops workflow/rebuild 29/29; read-only consumption, current indexes, docs/encoding, locked snapshot rebuild, overlay and 866-file shared drift passed. No UI/runtime source changed.

## 审核留痕

- Copilot review: unavailable; native independent code-reviewer and architect evidence recorded
- CodeQL 结果: Hosted scan pending; no product code change
- GitHub checks 结果: Pending hosted checks; merge only after required CI passes
- Auto-merge: not-enabled; authorized squash merge after CI
- Duplication Gate 结果: Pending hosted report
- 是否高风险改动: yes: CI workflow/provenance, independently reviewed
- Residual risk / follow-up: Formal release/foundation adoption and product acceptance remain separate; tooling diagnostic limitations recorded.

## 检查清单

- [ ] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [ ] 未把认证、IAM、组织、配置等系统域职责混写
- [ ] 前端新增展示文案已使用 i18n
- [ ] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [ ] 涉及数据库/权限/菜单/接口变更时，文档已同步
- [ ] 已确认不会泄露敏感配置、账号密码或 Token
- [ ] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁

Reviewed method source: Harness PR #13 (`51fc783dc793b75ae91bdb936ba1418e2e95a354`); PR/main checks passed. Consumer CI must pass before squash merge.
