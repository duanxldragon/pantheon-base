## 变更摘要

- 改动层级：inheritance-sync / generator tooling
- 改动模块：Base-owned generated-module smoke cleanup
- 目标问题：v0.10.17 cleanup 把 foundation consumer 已跟踪的 `business/*` overlay 当作 QA 生成物删除
- 预期影响：只清理未跟踪生成物；保留并恢复 consumer Git index 中的业务源码、schema、registry 和 i18n baseline

## Harness 链路

- Task ID：2026-08-12-foundation-consumer-cleanup-overlay
- Task Manifest：`.harness/tasks/2026-08-12-foundation-consumer-cleanup-overlay/manifest.json`
- Evidence：`.harness/evidence/2026-08-12-foundation-consumer-cleanup-overlay/commands.json`
- Verification evidence：`.harness/evidence/2026-08-12-foundation-consumer-cleanup-overlay/summary.md`
- Review Artifact：`.harness/evidence/2026-08-12-foundation-consumer-cleanup-overlay/review.md`
- OpenSpec change：not-applicable
- Trivial change：no
- Quality Profile：generator
- Ratchet Decision：gate-updated
- GitHub Signal：runtime-evidence-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-08-12-foundation-consumer-cleanup-overlay
- task manifest: `.harness/tasks/2026-08-12-foundation-consumer-cleanup-overlay/manifest.json`
- evidence: `.harness/evidence/2026-08-12-foundation-consumer-cleanup-overlay/summary.md`
- boundaries: Base owns shared cleanup; Ops owns tracked `business/*` overlays
- backend response contract: unchanged
- backend DTO contract: unchanged
- permission contract: unchanged
- audit coverage: unchanged
- visual evidence: not applicable; no UI visual behavior changed
- inheritance contract: cleanup follows the consumer repository Git index ownership boundary
- base drift: resolved in Base before a new immutable release
- Base/ops inheritance: Ops will consume `pantheon-base-v0.10.18` only after exact-commit gates

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

本次落点必须是 Base：cleanup 脚本属于 foundation release 共享资产。Ops 不新增本地 override；修复经新不可变 release 消费。业务行为、菜单、权限、i18n 文案和 schema 均不变。

## 验证记录

- [x] 后端测试：`CGO_ENABLED=1 go test -race ./...`（`backend/`，MinGW）
- [x] 前端构建：`cd frontend && npm run build`
- [ ] 轻量 smoke：`cd frontend && npm run test:smoke:platform:contracts && npm run test:smoke:system:pages`
- [ ] 如涉及系统域深链路，已补充专项 smoke：`cd frontend && npm run test:smoke:system:iam-authz`
- [x] 其他专项验证已补充
- [ ] CodeQL 结果已检查并解释
- [ ] 如有 open CodeQL alert，已说明是新增问题、既有 baseline、误报还是已补 follow-up
- [x] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [ ] GitHub required checks 通过
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用
- [x] 已启用或确认将启用 squash auto-merge

补充说明：cleanup/runner 聚焦 15/15，完整 smoke scripts 24/24，foundation release tests 22/22，generator smoke、lint、type-check、build、harness strict checks 均通过。真实 Ops 工作树验证为 `modules: 0` 且 business/registry/i18n Git 状态不变。Hosted checks 和 CodeQL 等待 PR。

## 审核留痕

- Copilot review：automatic-policy
- CodeQL 结果：pending hosted PR check
- GitHub checks 结果：pending
- Auto-merge：enabled
- Duplication Gate 结果：pending hosted PR check
- 是否高风险改动：yes，generator + inheritance shared tooling
- Residual risk / follow-up：合并后必须通过 exact-commit Full Smoke/Release Gate，发布全新 `pantheon-base-v0.10.18`，再由 Ops consumer 消费并跑完整 business smoke

## 检查清单

- [x] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
