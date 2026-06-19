## 变更摘要

- 改动层级：`platform`
- 改动模块：`foundation release tooling / release metadata / GitHub release publication`
- 目标问题：`将 base-v0.8.3 变成可追踪的 GitHub foundation release，并把 GitHub Release 标题固定到 pantheon-base-v* 命名`
- 预期影响：`foundation release 继续保留 base-v* tag 供 consumer 继承，同时 GitHub Release 页面统一展示 pantheon-base-v* 标题，后续发布可自动复用同一规则`

## Harness 链路

- Task ID：`2026-06-18-foundation-release-v0.8.3-publish`
- Task Manifest：`.harness/tasks/2026-06-18-foundation-release-v0.8.3-publish/manifest.json`
- Task ID：`2026-06-18-foundation-release-v0.8.3-publish`
- Evidence：`.harness/evidence/2026-06-18-foundation-release-v0.8.3-publish/commands.json`
- Verification evidence：`.harness/evidence/2026-06-18-foundation-release-v0.8.3-publish/summary.md`
- Review Artifact：`.harness/evidence/2026-06-18-foundation-release-v0.8.3-publish/review.md`
- OpenSpec change：`none`
- Trivial change：`no`
- Quality Profile：`ci-workflow`
- Ratchet Decision：`adapter-updated`
- GitHub Signal：`repo-quality-gate`

## Harness adoption markers

- Task ID：`2026-06-18-foundation-release-v0.8.3-publish`
- evidence: `.harness/evidence/2026-06-18-foundation-release-v0.8.3-publish/`
- boundaries: `platform release tooling -> GitHub release API`
- backend response contract: `none`
- backend DTO contract: `none`
- permission contract: `none`
- audit coverage: `foundation release tests plus GitHub API verification`
- visual evidence: `none`
- inheritance contract: `base-v0.8.3 remains the consumer tag anchor`
- base drift: `none`
- Base/ops inheritance: `ops consumes base-v0.8.3 separately after base release closure`

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

> 这条分支只收口 foundation release tooling 和 GitHub release 留痕，不进入 `pantheon-ops` 业务层，也不改应用 runtime 行为。

## 验证记录

- [ ] 后端测试：`go test ./...`
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

补充说明：

- 已运行 `node --test tests/scripts/foundation-release/*.test.mjs`
- 已运行 `node scripts/foundation-release/publish-foundation-release.mjs --release-version base-v0.8.3 --repo duanxldragon/pantheon-base --dry-run`
- 已运行 `gh api repos/duanxldragon/pantheon-base/releases/tags/base-v0.8.3`
- `go test ./...`、前端 build 和 GitHub required checks 以 PR 远端门禁结果为准

## 审核留痕

- Copilot review：`unavailable`
- CodeQL 结果：`pending-github-checks`
- GitHub checks 结果：`pending-github-checks`
- Auto-merge：`not-enabled`
- Duplication Gate 结果：`report-only-on-pr`
- 是否高风险改动：`yes - release publication and GitHub release traceability`
- Residual risk / follow-up：`main 仍要求 PR required checks 才能合并；gh release view 可能显示旧标题缓存，真实标题以 REST API 为准`

## 检查清单

- [x] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
