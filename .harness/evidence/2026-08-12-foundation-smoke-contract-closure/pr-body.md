## 变更摘要

- 改动层级：inheritance-sync
- 改动模块：foundation release manifest
- 目标问题：smoke spec 已消费但 npm entrypoint 与 coverage matrix 未消费
- 预期影响：消费者得到完整、可执行的 smoke 合同

## Harness 链路

- Task ID：2026-08-12-foundation-smoke-contract-closure
- Task Manifest：`.harness/tasks/2026-08-12-foundation-smoke-contract-closure/manifest.json`
- Evidence：`.harness/evidence/2026-08-12-foundation-smoke-contract-closure/commands.json`
- Verification evidence：`.harness/evidence/2026-08-12-foundation-smoke-contract-closure/summary.md`
- Review Artifact：`.harness/evidence/2026-08-12-foundation-smoke-contract-closure/review.md`
- OpenSpec change：not-applicable
- Trivial change：no
- Quality Profile：ci-workflow
- Ratchet Decision：gate-updated
- GitHub Signal：runtime-evidence-gate

## Harness adoption markers

- task id: 2026-08-12-foundation-smoke-contract-closure
- task manifest: `.harness/tasks/2026-08-12-foundation-smoke-contract-closure/manifest.json`
- evidence: `.harness/evidence/2026-08-12-foundation-smoke-contract-closure/`
- boundaries: Base foundation producer only
- backend response contract: not-applicable
- backend DTO contract: not-applicable
- permission contract: unchanged
- audit coverage: unchanged
- visual evidence: not-applicable, no product UI change
- inheritance contract: package scripts and smoke README become release-owned
- base drift: producer gate updated
- Base/ops inheritance: publish then consume through Ops adapter

## 边界说明

- [ ] 本次改动仅涉及 `business/*`
- [x] 本次改动涉及 foundation 继承，已说明 Base-first 边界和消费方式

Base owns generic smoke commands and coverage documentation. Ops retains business-specific commands through its consumer adapter.

## 验证记录

- [x] `npm run test:foundation-release` (22/22)
- [x] Ops consumer tests (25/25)
- [x] Ops installer tests (5/5)
- [ ] GitHub required checks 通过
- [x] Independent review requested

## 审核留痕

- Copilot review：automatic-policy
- CodeQL 结果：pending
- GitHub checks 结果：pending
- Auto-merge：not-enabled
- Duplication Gate 结果：pending
- 是否高风险改动：yes, inheritance contract
- Residual risk / follow-up：publish new immutable patch and consume in Ops

## 检查清单

- [x] 已明确本次改动归属 foundation inheritance adapter
- [x] 通用平台/系统域问题已在 Base-first 边界处理
- [x] UI 未发生产品视觉变更
- [x] smoke contract 在范围内同步
- [x] 已确认不会泄露敏感配置、账号密码或 Token
