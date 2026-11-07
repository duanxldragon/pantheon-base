## 变更摘要

- 改动层级： platform：发行治理；Ops 在后续 PR 正式消费
- 改动模块： VERSION、CHANGELOG、文档索引、v0.18.6 release notes 与新 L2 task/evidence
- 目标问题： 原12项任务已验收合并，但最新发行仍为0.18.5；发行记录和版本需要反映最终收口
- 预期影响： 准备0.18.6，源码行为保持与正式0.18.5一致；合并后仍须精确 Full Smoke/Release Gate、官方发行和Ops实际消费

## Harness 链路

- Task ID： 2026-11-07-v0186-release-ops-consumption
- Task Manifest： .harness/tasks/2026-11-07-v0186-release-ops-consumption/manifest.json
- Evidence： .harness/evidence/2026-11-07-v0186-release-ops-consumption/commands.json
- Verification evidence： .harness/evidence/2026-11-07-v0186-release-ops-consumption/summary.md
- Review Artifact： .harness/evidence/2026-11-07-v0186-release-ops-consumption/review.md
- OpenSpec change： none
- Trivial change： no
- Quality Profile： ci-workflow
- Ratchet Decision： no-repeat-observed
- GitHub Signal： repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-11-07-v0186-release-ops-consumption
- task manifest: .harness/tasks/2026-11-07-v0186-release-ops-consumption/manifest.json
- evidence: .harness/evidence/2026-11-07-v0186-release-ops-consumption/commands.json
- boundaries: version/docs/task preparation only; backend/frontend/scripts/workflows/config byte-identical to immutable1da0834b; original12/40 untouched
- backend response contract: unchanged
- backend DTO contract: unchanged
- permission contract: unchanged
- audit coverage: unchanged; historical runtime/red failures retained, no gate weakening
- visual evidence: no UI source/behavior change; no new rendering needed; immutable source Full Smoke remains required
- inheritance contract: standard four official GitHub assets and exact lock/rebuild only; v0.18.6 official consumer acceptance pending
- base drift: protected code diff against v0.18.5 is empty; exact new Ops drift will be verified after official acquisition
- Base/ops inheritance: Base publishes; Ops separately fetches/validates/rebuilds official artifact; no hand-copy or overlays of tests

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

> 如果跨层，请补充说明：本次只提交发行准备。独立CODE/ARCH批准准备范围，不替代尚未发生的发行和消费验收。12类本地检查通过，57项发行工具回归通过；原始失败和修复重跑日志保留。所有原40标准/scope不变，生产和测试源码无差异。新发布必须在精确合并commit获得Full Smoke/Release Gate成功后才使用正式发布器；Ops随后从GitHub获取四资产并完整验证实际组装树。本次为什么跨层、各层分别承担什么职责、是否影响菜单/权限/i18n/审计。

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
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用
- [ ] 已启用或确认将启用 squash auto-merge

补充说明：

## 审核留痕

- Copilot review： automatic-policy
- CodeQL 结果： previous immutable source and Base498/mergedOps177 security gates passed; this PR and new source Release Gate pending
- GitHub checks 结果： 12 local governance categories passed and57 foundation-release tests passed; this PR hosted checks pending
- Auto-merge： not-enabled
- Duplication Gate 结果： no runtime source change; current PR hosted result pending
- 是否高风险改动： L2 release/inheritance, two fresh independent preparation approvals with identical snapshot hash
- Residual risk / follow-up： new immutable release and actual186 consumption pending; S3 provider skip/no waiver, maintenance freeze unsigned; separate Ops runtime/policy/security/production residuals retained

## 检查清单

- [ ] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [ ] 未把认证、IAM、组织、配置等系统域职责混写
- [ ] 前端新增展示文案已使用 i18n
- [ ] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [ ] 涉及数据库/权限/菜单/接口变更时，文档已同步
- [ ] 已确认不会泄露敏感配置、账号密码或 Token
- [ ] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
