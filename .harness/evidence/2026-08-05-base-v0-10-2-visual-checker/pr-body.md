## 变更摘要

- 改动层级：platform
- 改动模块：shared visual checker、foundation release tooling
- 目标问题：`min-height` 会错误满足 `height` 检查，且修复必须由 Base 分发而不是在 Ops 单独维护
- 预期影响：提高视觉门禁准确性，并把 matcher 作为 foundation frontend 资产交付；不改变运行时 UI

## Harness 链路

- Task ID：2026-08-05-base-v0-10-2-visual-checker
- Task Manifest：.harness/tasks/2026-08-05-base-v0-10-2-visual-checker/manifest.json
- Evidence：.harness/evidence/2026-08-05-base-v0-10-2-visual-checker/commands.json
- Review Artifact：.harness/evidence/2026-08-05-base-v0-10-2-visual-checker/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：shared-ui, foundation-release
- Ratchet Decision：checker-promoted-to-foundation-asset
- GitHub Signal：repo-quality-gate

## 边界说明

- [x] 本次改动仅涉及 platform 构建时 checker 与 release tooling
- [x] 未修改 `frontend/src` 运行时代码、样式、权限、菜单、接口或数据库

## 验证记录

- [x] matcher 与 foundation packaging 聚焦测试通过
- [x] Base shell visual contract 通过
- [x] 运行时 smoke 不适用：无产品运行时变更
- [ ] GitHub required checks 通过
- [x] 两路独立 review 通过

## 审核留痕

- CodeQL 结果：awaiting hosted candidate
- GitHub checks 结果：awaiting hosted candidate
- Auto-merge：not-enabled
- 是否高风险改动：yes，涉及 foundation consumer inheritance
- Residual risk / follow-up：Ops 必须通过 v0.10.2 artifact 消费并验证 tooling drift

## 检查清单

- [x] 已明确改动归属 platform
- [x] 未新增依赖或展示文案
- [x] 未触碰数据库、权限、菜单、接口
- [x] 已确认不会泄露敏感配置、账号密码或 Token
