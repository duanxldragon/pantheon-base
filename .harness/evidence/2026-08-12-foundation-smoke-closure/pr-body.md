## 变更摘要

- 改动层级：`ci-workflow` 与 inheritance boundary。
- 改动模块：foundation release manifest、frontend ownership gate、release tests。
- 目标问题：Ops 消费产品源码后仍保留旧的通用 generated/platform/system smoke 副本，导致运行时 404 与 SonarCloud 代码量虚高。
- 预期影响：Base patch release 目录级拥有通用 smoke 闭包；Ops 仅保留自身 CMDB/Deploy 业务 smoke。

## Harness 链路

- Task ID：`2026-08-12-foundation-smoke-closure`
- Task Manifest：`.harness/tasks/2026-08-12-foundation-smoke-closure/manifest.json`
- Evidence：`.harness/evidence/2026-08-12-foundation-smoke-closure/commands.json`
- Verification evidence：`.harness/evidence/2026-08-12-foundation-smoke-closure/summary.md`
- Review Artifact：`.harness/evidence/2026-08-12-foundation-smoke-closure/review.md`
- OpenSpec change：not applicable
- Trivial change：no
- Quality Profile：generator
- Ratchet Decision：gate-updated
- GitHub Signal：runtime-evidence-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: `2026-08-12-foundation-smoke-closure`
- task manifest: `.harness/tasks/2026-08-12-foundation-smoke-closure/manifest.json`
- evidence: `.harness/evidence/2026-08-12-foundation-smoke-closure/commands.json`
- boundaries: Base owns generic generated/platform/system smoke; Ops owns CMDB and deploy smoke.
- backend response contract: not changed
- backend DTO contract: not changed
- permission contract: not changed
- audit coverage: not changed
- visual evidence: not applicable; no UI implementation changed.
- inheritance contract: manifest directory ownership is fail closed in the producer and converged by the Ops consumer.
- base drift: generic runtime QA directories can no longer remain stale outside the release manifest.
- Base/ops inheritance: Ops must consume the next immutable patch artifact before its consumer PR merges.

## 边界说明

- [x] 本次改动涉及跨层，已说明边界与依赖

> 如果跨层，请补充说明：Base publishes the complete generic runtime QA closure. Ops has a separate consumer change that expands directory entries, removes obsolete Base-owned files, and preserves only Ops business smoke.

## 验证记录

- [x] 后端测试：not applicable; no backend code changed.
- [x] 前端构建：not applicable locally; no product source changed. Remote CI still runs the standard frontend gate.
- [x] 轻量 smoke：producer and consumer foundation tests cover the executable inheritance boundary.
- [x] 如涉及系统域深链路，已补充专项 smoke：Ops full business smoke is required after artifact consumption.
- [x] 其他专项验证已补充：Base foundation 22/22, Ops sync 5/5, Ops consumer 24/24.
- [ ] CodeQL 结果已检查并解释：awaiting this PR's GitHub workflow.
- [ ] 如有 open CodeQL alert，已说明是新增问题、既有 baseline、误报还是已补 follow-up：awaiting this PR's GitHub workflow.
- [ ] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁：awaiting exact-commit GitHub workflow.
- [ ] GitHub required checks 通过：awaiting GitHub Actions.
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用：automatic-policy after PR creation; local independent review performed.
- [ ] 已启用或确认将启用 squash auto-merge：enable only after required checks pass.

补充说明：publication remains blocked until the merged commit passes Full Smoke and Release Gate. Existing tags and artifacts remain immutable.

## 审核留痕

- Copilot review：automatic-policy
- CodeQL 结果：awaiting GitHub Actions
- GitHub checks 结果：awaiting GitHub Actions
- Auto-merge：not-enabled until checks pass
- Duplication Gate 结果：awaiting GitHub Actions
- 是否高风险改动：yes; generator runtime and inheritance boundary.
- Residual risk / follow-up：the Ops consumer PR must consume the published patch, pass full business smoke, and verify hosted SonarCloud revision and measures.

## 检查清单

- [x] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`：platform release boundary plus shared business-generated acceptance assets.
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n：no product text added.
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步：not applicable.
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
