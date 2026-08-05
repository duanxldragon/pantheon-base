## 变更摘要

- 改动层级：`platform`
- 改动模块：`shared visual checker, foundation release tooling`
- 目标问题：`min-height 会错误满足 height 棩查，且修复必须由 Base 分发而非由 Ops 单独维护`
- 预期影响：`提高视觉门禁准确性，并把 matcher 作为 foundation frontend 资产交付；不改变运行时 UI`

## Harness 链路

- Task ID：`2026-08-05-base-v0-10-2-visual-checker`
- Task Manifest：`.harness/tasks/2026-08-05-base-v0-10-2-visual-checker/manifest.json`
- Evidence：`.harness/evidence/2026-08-05-base-v0-10-2-visual-checker/commands.json`
- Verification evidence：`.harness/evidence/2026-08-05-base-v0-10-2-visual-checker/summary.md`
- Review Artifact：`.harness/evidence/2026-08-05-base-v0-10-2-visual-checker/review.md`
- OpenSpec change：`none`
- Trivial change：`no`
- Quality Profile：`ci-workflow`
- Ratchet Decision：`gate-updated`
- GitHub Signal：`repo-quality-gate`

## Harness adoption markers

- task id: `2026-08-05-base-v0-10-2-visual-checker`
- task manifest: `.harness/tasks/2026-08-05-base-v0-10-2-visual-checker/manifest.json`
- evidence: `.harness/evidence/2026-08-05-base-v0-10-2-visual-checker/`
- boundaries: `Base build-time visual checker and foundation release producer only`
- backend response contract: `none`
- backend DTO contract: `none`
- permission contract: `none`
- audit coverage: `none`
- visual evidence: `runtime gap recorded; no runtime UI source or style changed`
- inheritance contract: `foundation manifest distributes the exact allowlisted tooling asset`
- base drift: `not-applicable for the Base producer`
- Base/ops inheritance: `Ops candidate 280d564 enforces dry-run, apply, rollback, missing, and drift checks`

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

本 PR 只修改 Base 拥有的构建时 checker 和 release producer。Ops consumer adapter 已独立增加精确 tooling allowlist；本 PR 不修改运行时 `frontend/src`、权限、菜单、接口、数据库或 i18n。

## 验证记录

- [x] Foundation release tests：`15/15`
- [x] Matcher regression：`1/1`
- [x] Frontend lint、type-check、build 和 shell visual contract
- [x] Harness task/evidence/review/graph/runtime strict checks
- [x] 两路独立 review：quality `APPROVE`，architecture `CLEAR`
- [ ] GitHub required checks 通过
- [ ] Copilot review 已请求，或已说明当前仓库/账号不可用

补充说明：本地 platform smoke 的合同用例通过；运行态用例因本地 `127.0.0.1:8080` 未启动而无法认证。本任务不改变运行时 UI，托管检查仍为必过门禁。

## 审核留痕

- Copilot review：`automatic-policy`
- CodeQL 结果：`pending`
- GitHub checks 结果：`pending`
- Auto-merge：`not-enabled`
- Duplication Gate 结果：`not-applicable`
- 是否高风险改动：`yes，涉及 foundation consumer inheritance`
- Residual risk / follow-up：`合并后必须核验 v0.10.2 tag、manifest、archive SHA-256，并由 Ops 正式消费`

## 检查清单

- [x] 已明确本次改动归属 `platform`
- [x] 未新增依赖或展示文案
- [x] 未触碰数据库、权限、菜单、接口
- [x] 通用 matcher 由 Base 拥有并通过 foundation artifact 分发
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] GitHub required checks、CodeQL 和分支保护负责最终合并门禁
