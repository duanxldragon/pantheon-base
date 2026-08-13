## 变更摘要

- 改动层级：inheritance-sync / foundation-release 打包
- 改动模块：`build-release-bundle.mjs`、`build-release-manifest.mjs`、`publish-foundation-release.mjs`
- 目标问题：base 的 release 产物此前不含完整仓库快照，ops 消费时只能回退到 live `../pantheon-base` 工作树，破坏「base 独立发布、ops 锁定消费」原则
- 预期影响：release `.tgz` 与 GitHub release 资产新增 `repo.tar`（`git archive <baseCommit>` 全量快照）+ sha256，消费者可从锁定 release 确定性重建

## Harness 链路

- Task ID：2026-08-13-foundation-release-repo-snapshot
- Task Manifest：`.harness/tasks/2026-08-13-foundation-release-repo-snapshot/manifest.json`
- Evidence：`.harness/evidence/2026-08-13-foundation-release-repo-snapshot/commands.json`
- Verification evidence：`.harness/evidence/2026-08-13-foundation-release-repo-snapshot/summary.md`
- Review Artifact：`.harness/evidence/2026-08-13-foundation-release-repo-snapshot/review.md`
- OpenSpec change：not-applicable
- Trivial change：no
- Quality Profile：generator / ci-workflow
- Ratchet Decision：gate-updated
- GitHub Signal：repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: `2026-08-13-foundation-release-repo-snapshot`
- task manifest: `.harness/tasks/2026-08-13-foundation-release-repo-snapshot/manifest.json`
- evidence: `.harness/evidence/2026-08-13-foundation-release-repo-snapshot/`
- boundaries: base-owned release packaging only; no ops business or product code changes
- backend response contract: unchanged
- backend DTO contract: unchanged
- permission contract: unchanged
- audit coverage: unchanged
- visual evidence: not-applicable; no product UI change
- inheritance contract: snapshot ships only through a new immutable foundation release
- base drift: none; producer is the canonical source
- Base/ops inheritance: ops consumes `repo.tar` from the GitHub release (no local tree fallback) after merge

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

本次只修改 base 的 release 打包脚本与测试。业务行为、数据库、菜单、权限、i18n 文案和审计均不变。

## 验证记录

- [x] 后端测试：`go test ./...`（本改动未触及 Go 源码）
- [ ] 前端构建：`cd frontend && npm run build`
- [ ] 轻量 smoke：`cd frontend && npm run test:smoke:platform:contracts && npm run test:smoke:system:pages`
- [ ] 如涉及系统域深链路，已补充专项 smoke：`cd frontend && npm run test:smoke:system:iam-authz`
- [x] 其他专项验证已补充
- [ ] CodeQL 结果已检查并解释
- [ ] 如有 open CodeQL alert，已说明是新增问题、既有 baseline、误报还是已补 follow-up
- [x] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [ ] GitHub required checks 通过
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用
- [ ] 已启用或确认将启用 squash auto-merge

补充说明：foundation-release 测试 24/24 通过（含新增回归：快照与 `git archive` 字节一致、sha256 匹配、含 config/database/schema、打入 `.tgz`）；`check-encoding --strict` 0 finding；手工 `git archive HEAD` 得 24.8MB tar 证实全量已提交树被捕获。

## 审核留痕

- Copilot review：automatic-policy
- CodeQL 结果：等待 PR hosted gate
- GitHub checks 结果：等待 PR hosted gate
- Auto-merge：not-enabled
- Duplication Gate 结果：等待 PR hosted gate
- 是否高风险改动：否，仅 release 打包脚本与测试
- Residual risk / follow-up：merge 后需发布不可变 v0.10.21 并在 ops 侧 re-lock 后从 GitHub 消费 `repo.tar`

## 检查清单

- [x] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
