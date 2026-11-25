## 变更摘要

- 改动层级: platform / release security evidence
- 改动模块: source hash bindings and exact historical secret-scan findings
- 目标问题: Main full-history scan mistakes three source-file SHA256 checksums for generic API keys after PR #528 squash merge.
- 预期影响: Future path/sha256 records avoid key-shaped hashes; exactly three independently verified historical fingerprints are adjudicated with explicit maintainer approval.

## Harness 链路

- Task ID: 2026-11-25-foundation-0190-release
- Task Manifest: .harness/tasks/2026-11-25-foundation-0190-release/manifest.json
- Evidence: .harness/evidence/2026-11-25-foundation-0190-release/commands.json
- Verification evidence: .harness/evidence/2026-11-25-foundation-0190-release/summary.md
- Review Artifact: .harness/evidence/2026-11-25-foundation-0190-release/review.md
- OpenSpec change: none
- Trivial change: no
- Quality Profile: auth-security
- Ratchet Decision: sensor-added
- GitHub Signal: repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-11-25-foundation-0190-release
- task manifest: .harness/tasks/2026-11-25-foundation-0190-release/manifest.json
- evidence: .harness/evidence/2026-11-25-foundation-0190-release/commands.json
- boundaries: Auth owns fresh durable grants; config owns declarations/tenant reads; business consumers opt in through shared contracts.
- backend response contract: No existing response shape changed
- backend DTO contract: Private optional durable-job input contract
- permission contract: Current-owner authorization and exact registered action; no session or cached fallback
- audit coverage: Existing audit behavior retained; full configured backend verification
- visual evidence: Type declarations only; no JSX/CSS/layout change. Full Smoke is required on the release commit.
- inheritance contract: Official Foundation assets; Ops fetch/rebuild adoption deferred
- base drift: Base-first; no shared source manually copied into Ops
- Base/ops inheritance: New v0.19.0 release; Ops lock remains separately owned

## 边界说明

- [ ] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

> 如果跨层，请补充说明：本次为什么跨层、各层分别承担什么职责、是否影响菜单/权限/i18n/审计。

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

补充说明：

## 审核留痕

- Copilot review: unavailable; two independent native source reviews recorded
- CodeQL 结果: Hosted scan required before merge; current source reviewed
- GitHub checks 结果: Pending new PR checks; merge only after all required gates pass
- Auto-merge: not-enabled; user-authorized squash after gates and feedback closure
- Duplication Gate 结果: Hosted result required before merge
- 是否高风险改动: yes; auth/config shared contracts and release, independently reviewed
- Residual risk / follow-up: Ops adoption, real S3, maintenance freeze and production acceptance deferred; unrelated Dependabot PRs retained

## 检查清单

- [ ] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [ ] 未把认证、IAM、组织、配置等系统域职责混写
- [ ] 前端新增展示文案已使用 i18n
- [ ] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [ ] 涉及数据库/权限/菜单/接口变更时，文档已同步
- [ ] 已确认不会泄露敏感配置、账号密码或 Token
- [ ] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁

The original .gitleaksignore entries, scanner rules and full-history scan are retained. The maintainer explicitly approved only the three exact commit:path:rule:line fingerprints in this session.

Independent recomputation matches SHA256 of all three Git source blobs. Full-history gitleaks v8.30.1 passes; three synthetic credentials in the same path/new commit, another line and another path remain detected. All 29 Docs Governance npm checks pass. Evidence: hash-adjudication.json, history-hash-scan-final.result.json, synthetic-secret-regression.json and hash-fix-governance.json. No product code changes in this repair.
