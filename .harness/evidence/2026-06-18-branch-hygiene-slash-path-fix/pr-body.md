## 变更摘要

- 改动层级：`platform`
- 改动模块：`repository-governance / branch-hygiene cleanup`
- 目标问题：`真实 GitHub hosted 验证显示 branch-hygiene cleanup 在 slash 分支名上把 / 错误编码成 %2F，导致 lookup/delete endpoint 误判 branch-missing`
- 预期影响：`branch-hygiene workflow 在处理 verify/foo 这类闭合 PR residue branch 时可以正确命中 GitHub branch lookup/delete endpoint，并继续沿用现有 SHA guard 删除真实残留分支`

## Harness 链路

- Task ID：`2026-06-18-branch-hygiene-slash-path-fix`
- Task Manifest：`.harness/tasks/2026-06-18-branch-hygiene-slash-path-fix/manifest.json`
- Task ID：`2026-06-18-branch-hygiene-slash-path-fix`
- Evidence：`.harness/evidence/2026-06-18-branch-hygiene-slash-path-fix/commands.json`
- Verification evidence：`.harness/evidence/2026-06-18-branch-hygiene-slash-path-fix/summary.md`
- Review Artifact：`.harness/evidence/2026-06-18-branch-hygiene-slash-path-fix/review.md`
- OpenSpec change：`none`
- Trivial change：`no`
- Quality Profile：`ci-workflow`
- Ratchet Decision：`sensor-added`
- GitHub Signal：`repo-quality-gate`

## Harness adoption markers

- Task ID：`2026-06-18-branch-hygiene-slash-path-fix`
- evidence: `.harness/evidence/2026-06-18-branch-hygiene-slash-path-fix/`
- boundaries: `platform repository-governance + hosted GitHub branch endpoint path handling`
- backend response contract: `not-applicable - no product runtime API response change`
- backend DTO contract: `not-applicable - no product DTO shape change`
- permission contract: `not-applicable - repository-governance only`
- audit coverage: `npm run test:branch-hygiene plus post-merge hosted residue verification`
- visual evidence: `not-applicable - no UI change`
- inheritance contract: `mirror the same slash-path fix into pantheon-ops`
- base drift: `none`
- Base/ops inheritance: `pantheon-base first; pantheon-ops follow-up PR mirrors the same repository-governance fix`

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

> 本次改动停留在 `platform` / repository-governance 层，只修正 cleanup script 如何向 GitHub REST path 传递 slash 分支名，不改变业务代码、产品运行时契约、PR 自动化策略或 branch deletion guardrails。

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

- 本地专项验证为 `npm run test:branch-hygiene`，覆盖 cleanup script 和 standalone workflow contract。
- 真实闭环验证将在本 PR 合并后创建一个新的 closed-PR residue branch，并通过 `Branch Hygiene` hosted run 验证远端分支删除结果。

## 审核留痕

- Copilot review：`unavailable`
- CodeQL 结果：`pending-github-checks`
- GitHub checks 结果：`pending-github-checks`
- Auto-merge：`pending-after-required-checks`
- Duplication Gate 结果：`not-applicable`
- 是否高风险改动：`no`
- Residual risk / follow-up：`post-merge still needs one real GitHub residue cleanup rerun to convert the prior slash-path ambiguity into hosted proof`

## 检查清单

- [x] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
