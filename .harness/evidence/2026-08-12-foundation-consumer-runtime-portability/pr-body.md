## 变更摘要

- 改动层级：inheritance-sync / generator runtime
- 改动模块：generated business smoke、generated cleanup、feature ledger baseline
- 目标问题：`v0.10.18` 在真实 Ops smoke 中暴露 producer Go module path 硬编码和 feature-ledger 清理残留
- 预期影响：Base/Ops 均按自身 Go module identity 验证生成注册，smoke cleanup 后 tracked feature ledger 恢复且可检测漂移

## Harness 链路

- Task ID：2026-08-12-foundation-consumer-runtime-portability
- Task Manifest：`.harness/tasks/2026-08-12-foundation-consumer-runtime-portability/manifest.json`
- Evidence：`.harness/evidence/2026-08-12-foundation-consumer-runtime-portability/commands.json`
- Verification evidence：`.harness/evidence/2026-08-12-foundation-consumer-runtime-portability/summary.md`
- Review Artifact：`.harness/evidence/2026-08-12-foundation-consumer-runtime-portability/review.md`
- OpenSpec change：not-applicable
- Trivial change：no
- Quality Profile：generator
- Ratchet Decision：gate-updated
- GitHub Signal：runtime-evidence-gate

## Harness adoption markers

- task id: `2026-08-12-foundation-consumer-runtime-portability`
- task manifest: `.harness/tasks/2026-08-12-foundation-consumer-runtime-portability/manifest.json`
- evidence: `.harness/evidence/2026-08-12-foundation-consumer-runtime-portability/`
- boundaries: Base-owned smoke and cleanup only; no Ops business implementation changes
- backend response contract: unchanged
- backend DTO contract: unchanged
- permission contract: unchanged
- audit coverage: unchanged
- visual evidence: not-applicable; no product UI change
- inheritance contract: fix ships only through a new immutable foundation release
- base drift: none; producer is the canonical source
- Base/ops inheritance: Ops official-asset consumption and full business smoke required after merge

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

本次只修改 Base-owned generated runtime smoke 与 cleanup 契约。业务行为、数据库、菜单、权限、i18n 文案和审计均不变；Ops 不保留本地 override。

## 验证记录

- [x] 后端测试：`go test -race ./...`
- [x] 前端构建：`cd frontend && npm run build`
- [ ] 轻量 smoke：`cd frontend && npm run test:smoke:platform:contracts && npm run test:smoke:system:pages`
- [ ] 如涉及系统域深链路，已补充专项 smoke：`cd frontend && npm run test:smoke:system:iam-authz`
- [x] 其他专项验证已补充
- [ ] CodeQL 结果已检查并解释
- [ ] 如有 open CodeQL alert，已说明是新增问题、既有 baseline、误报还是已补 follow-up
- [x] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [ ] GitHub required checks 通过
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用
- [ ] 已启用或确认将启用 squash auto-merge

补充说明：cleanup/runner 15/15、完整 smoke scripts 24/24、foundation release 22/22、generator smoke、frontend lint/type/build、Windows CGO race 和严格治理检查通过。两份 generated smoke 通过 Playwright list 装载验证。独立代码审查 `APPROVE`，架构审查 `CLEAR`。

## 审核留痕

- Copilot review：automatic-policy
- CodeQL 结果：等待 PR hosted gate
- GitHub checks 结果：等待 PR hosted gate
- Auto-merge：not-enabled
- Duplication Gate 结果：等待 PR hosted gate
- 是否高风险改动：是，涉及 generator runtime 和 foundation consumer
- Residual risk / follow-up：PR merge-SHA 门禁通过后发布不可变 patch；Ops 仅消费官方 asset 并跑完整 business smoke

## 检查清单

- [x] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
