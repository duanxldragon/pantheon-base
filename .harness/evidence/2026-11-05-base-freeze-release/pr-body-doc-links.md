## 变更摘要

- 改动层级：platform（治理证据）
- 改动模块：审计报告附件与相对链接
- 目标问题：main Docs Governance 在单仓库检出时找不到 workspace 外层截图
- 预期影响：原始截图随仓库交付；严格文档门禁可验证

## Harness 链路

- Task ID：2026-11-05-base-freeze-release
- Task Manifest：.harness/tasks/2026-11-05-base-freeze-release/manifest.json
- Evidence：.harness/evidence/2026-11-05-base-freeze-release/commands.json
- Verification evidence：.harness/evidence/2026-11-05-base-freeze-release/summary.md
- Review Artifact：.harness/evidence/2026-11-05-base-freeze-release/review.md
- OpenSpec change：none
- Trivial change：yes
- Quality Profile：none
- Ratchet Decision：guide-updated
- GitHub Signal：repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-11-05-base-freeze-release
- task manifest: .harness/tasks/2026-11-05-base-freeze-release/manifest.json
- evidence: .harness/evidence/2026-11-05-base-freeze-release/commands.json
- boundaries: Existing audit evidence only; no product code or gate policy change
- backend response contract: not applicable; no API changes
- backend DTO contract: not applicable; no DTO changes
- permission contract: not applicable; no permission changes
- audit coverage: Original report conclusions preserved; original PNG SHA256 recorded
- visual evidence: .harness/evidence/2026-11-05-base-freeze-release/audit-screenshots/
- inheritance contract: Official release remains required
- base drift: No shared source changes
- Base/ops inheritance: Pending official release/consumer verification

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

> 如果跨层，请补充说明：

`check:harness-docs`、`check:docs-frontmatter`、`git diff --check` 通过；另对 git checkout-index 导出的隔离暂存树执行严格文档检查，0 findings，证明不依赖 workspace 外部截图。两张图片与原始证据逐字节SHA256一致。
本次为什么跨层、各层分别承担什么职责、是否影响菜单/权限/i18n/审计。

## 验证记录

- [ ] 后端测试：`go test ./...`
- [ ] 前端构建：`cd frontend && npm run build`
- [ ] L0 静态契约：`cd frontend && npm run test:smoke:l0`
- [ ] L1 关键路径 smoke（PR 必过）：`cd frontend && npm run test:smoke:l1`
- [ ] L2 命中模块 smoke（PR 按改动路径自动选择，也可本地手跑）：`cd frontend && npm run test:smoke:module:<iam|config|i18n|audit|org|platform|all>`
- [ ] 如涉及系统域深链路，已补充专项 smoke：`cd frontend && npm run test:smoke:system:iam-authz`
- [x] 其他专项验证已补充
- [ ] CodeQL 结果已检查并解释
- [ ] 如有 open CodeQL alert，已说明是新增问题、既有 baseline、误报还是已补 follow-up
- [ ] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [ ] GitHub required checks 通过
- [ ] Copilot review 已请求，或已说明当前仓库/账号不可用
- [ ] 已启用或确认将启用 squash auto-merge

补充说明：

`check:harness-docs`、`check:docs-frontmatter`、`git diff --check` 通过；另对 git checkout-index 导出的隔离暂存树执行严格文档检查，0 findings，证明不依赖 workspace 外部截图。两张图片与原始证据逐字节SHA256一致。


## 审核留痕

- Copilot review：unavailable; independent reviewer report linked in task evidence
- CodeQL 结果：Product source unchanged from approved PR489
- GitHub checks 结果：main de9f11a6 Docs Governance missing screenshot links; this patch fixes its concrete failure
- Auto-merge：not-enabled
- Duplication Gate 结果：pending current PR
- 是否高风险改动：no; docs/attachments only
- Residual risk / follow-up：Latest CI and Release Gate still required before publishing; Ops validation remains pending

## 检查清单

- [ ] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [ ] 未把认证、IAM、组织、配置等系统域职责混写
- [ ] 前端新增展示文案已使用 i18n
- [ ] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [ ] 涉及数据库/权限/菜单/接口变更时，文档已同步
- [ ] 已确认不会泄露敏感配置、账号密码或 Token
- [ ] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
