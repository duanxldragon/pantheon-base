## 变更摘要

- 改动层级：共享 frontend platform、`system/*`、`pkg/*`、治理文档与 foundation release handoff
- 改动模块：Sonar duplication cleanup、执行角色治理、release/consumer evidence
- 目标问题：收敛已提交的重复率治理改动，修复 stale frontend package self-dependency，并为 Base 到 Ops 的可审计 foundation release 建立收口链路
- 预期影响：不改变 API、DTO、数据库、权限、菜单、i18n 或审计契约；发布后 Ops 仅通过不可变 artifact 与 overlay pipeline 消费

## Harness 链路

- Task ID：2026-09-02-foundation-release-v0-10-26-and-ops-sync
- Task Manifest：.harness/tasks/2026-09-02-foundation-release-v0-10-26-and-ops-sync/manifest.json
- Evidence：.harness/evidence/2026-09-02-foundation-release-v0-10-26-and-ops-sync/
- Verification evidence：.harness/evidence/2026-09-02-foundation-release-v0-10-26-and-ops-sync/summary.md
- Review Artifact：.harness/evidence/2026-09-02-foundation-release-v0-10-26-and-ops-sync/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：ci-workflow
- Ratchet Decision：no-repeat-observed
- GitHub Signal：repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 scripts/harness/check-adoption.mjs 做机械检查。

- task id: 2026-09-02-foundation-release-v0-10-26-and-ops-sync
- task manifest: .harness/tasks/2026-09-02-foundation-release-v0-10-26-and-ops-sync/manifest.json
- evidence: .harness/evidence/2026-09-02-foundation-release-v0-10-26-and-ops-sync/
- boundaries: shared Base refactor and release governance only; no public API/schema/permission/menu/i18n/audit contract change
- backend response contract: unchanged
- backend DTO contract: unchanged
- permission contract: unchanged
- audit coverage: unchanged
- visual evidence: no rendered behavior was intentionally changed; frontend build runs the visual/UI contract gates
- inheritance contract: Base publishes an immutable release; Ops upgrades only through the foundation-release pipeline in an isolated worktree
- base drift: no
- Base/ops inheritance: release required; consumer lock update follows the published artifact

## 边界说明

- [ ] 本次改动仅涉及单一层级
- [x] 本次改动涉及跨层，已说明边界与依赖

本次跨 `system/*`、共享 frontend、`pkg/*` 与 inheritance governance，但所有代码改动均为重复率治理与模块身份收敛；Base 仍是平台层和系统域唯一 owner，Ops 只在 release 后重建并注入 business overlay，不复制共享源码。

## 验证记录

- [x] 后端测试：`go test -race ./...`（Windows CGO + MinGW）
- [x] 前端构建：`cd frontend && npm run build`
- [ ] 轻量 smoke：等待本 PR 的 GitHub Smoke Sanity
- [ ] 如涉及系统域深链路，已补充专项 smoke：不适用，未改变运行时系统域契约
- [x] 其他专项验证已补充：`npm run check:docs-frontmatter`、`npm run check:task-packet-template`、lockfile install、`git diff --check`
- [ ] CodeQL 结果已检查并解释：等待本 PR GitHub check
- [ ] 如有 open CodeQL alert，已说明是新增问题、既有 baseline、误报还是已补 follow-up：等待本 PR GitHub check
- [x] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [ ] GitHub required checks 通过：等待本 PR GitHub checks
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用：automatic-policy
- [ ] 已启用或确认将启用 squash auto-merge：等待门禁与独立 review

补充说明：PR `#279` 已在 hosted Quality/Security/Smoke checks 通过后合并；本 PR 的 release evidence 将在最终 `main` 通过 `Release Gate Summary` 后补齐。

## 审核留痕

- Copilot review：automatic-policy
- CodeQL 结果：等待本 PR GitHub check
- GitHub checks 结果：等待本 PR GitHub check
- Auto-merge：not-enabled
- Duplication Gate 结果：等待本 PR GitHub check；本地旧分支验证为 1.55% / 3.00% PASS
- 是否高风险改动：是；共享 `system/*`、`pkg/*`、generator/dynamic-module 文件均为既有 refactor 的 behavior-preserving cleanup
- Residual risk / follow-up：不得在没有 successful `Release Gate Summary`、immutable release assets 和 isolated Ops overlay validation 的情况下发布或消费

## 检查清单

- [x] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n：本次未新增展示文案
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步：本次不涉及
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
