## 变更摘要

- 改动层级：`ci-workflow`；发布边界与共享前端所有权。
- 改动模块：foundation release manifest、bundle validator、Ops consumer contract。
- 目标问题：避免通用前端 shell/API/hooks 因不在 manifest 中而被误归类为 Ops 历史业务代码。
- 预期影响：后续基础发行包覆盖这些 Base-owned 路径；消费者在锁文件或本地源遗漏时 fail closed。

## Harness 链路

- Task ID：`2026-08-11-foundation-release-v0-10-13`
- Task Manifest：`.harness/tasks/2026-08-11-foundation-release-v0-10-13/manifest.json`
- Evidence：`.harness/evidence/2026-08-11-foundation-release-v0-10-13/commands.json`
- Verification evidence：`.harness/evidence/2026-08-11-foundation-release-v0-10-13/summary.md`
- Review Artifact：`.harness/evidence/2026-08-11-foundation-release-v0-10-13/review.md`
- OpenSpec change：not applicable
- Trivial change：no
- Quality Profile：ci-workflow
- Ratchet Decision：gate-updated
- GitHub Signal：repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: `2026-08-11-foundation-release-v0-10-13`
- task manifest: `.harness/tasks/2026-08-11-foundation-release-v0-10-13/manifest.json`
- evidence: `.harness/evidence/2026-08-11-foundation-release-v0-10-13/commands.json`
- boundaries: Base owns generic frontend roots/API/hooks; Ops retains `business/*`.
- backend response contract: not changed
- backend DTO contract: not changed
- permission contract: Base permission helper ownership is bundled; semantics are unchanged.
- audit coverage: not changed
- visual evidence: not applicable; no visual redesign and static shell/UI contracts passed in the consumer build.
- inheritance contract: manifest and lock coverage are fail-closed for generic frontend paths.
- base drift: eliminates the identified generic frontend ownership drift.
- Base/ops inheritance: Ops consumes only the verified `pantheon-base-v0.10.13` archive.

## 边界说明

- [x] 本次改动涉及跨层，已说明边界与依赖

> 如果跨层，请补充说明：Base owns the release manifest, bundle validator, and shared frontend sources. Ops is only the release consumer; `frontend/src/modules/business/**` is not changed.

## 验证记录

- [x] 后端测试：发布工具 focused tests passed; no backend behavior changed.
- [x] 前端构建：Ops consumer `frontend` production build passed.
- [x] 轻量 smoke：static shell/UI and release-consumer contracts passed through the consumer build preflight.
- [x] 如涉及系统域深链路，已补充专项 smoke：not applicable; no system behavior changed.
- [x] 其他专项验证已补充：13 focused Base release tests, Ops `check:inheritance`, and 81 release-consumer tests passed.
- [ ] CodeQL 结果已检查并解释：awaiting this PR's GitHub workflow.
- [ ] 如有 open CodeQL alert，已说明是新增问题、既有 baseline、误报还是已补 follow-up：awaiting this PR's GitHub workflow.
- [ ] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁：awaiting GitHub workflow.
- [ ] GitHub required checks 通过：awaiting GitHub workflow.
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用：automatic-policy; GitHub review is requested after PR creation.
- [ ] 已启用或确认将启用 squash auto-merge：awaiting required checks.

补充说明：publication remains blocked on the exact merged commit's successful `Release Gate Summary`; no existing release or tag will be mutated.

## 审核留痕

- Copilot review：automatic-policy
- CodeQL 结果：awaiting GitHub Actions
- GitHub checks 结果：awaiting GitHub Actions
- Auto-merge：not-enabled until checks pass
- Duplication Gate 结果：awaiting GitHub Actions
- 是否高风险改动：yes; it changes the executable inheritance boundary, mitigated by exact-manifest and consumer contract regression tests.
- Residual risk / follow-up：publish only after the exact-commit Release Gate passes, then inspect the fresh Ops SonarCloud analysis before issue-level remediation.

## 检查清单

- [x] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`：platform release boundary.
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n：no product text added.
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步：not applicable; release contract documentation updated.
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
