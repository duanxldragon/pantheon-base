## 变更摘要

README 首页保留的 2026-09-22 整改完成宣告与旧测试数字会混淆当前状态。本次将原轮次记录移入历史归档，双语 README 保留当前状态和归档索引入口。

Ops 菜单改造的三份 planned 任务文件已从 Base 本地暂存迁入 Ops，并修正仓库归属与引用。Base PR 保存迁移回执；Ops 文件继续在 Ops 暂存，其他并发改动原样保留。

- 改动层级: platform
- 改动模块: README / historical documentation / task ownership evidence
- 目标问题: 首页展示旧轮次完成宣告，Ops 任务治理包存放在 Base
- 预期影响: 当前与历史入口清晰，任务与代码归属同仓

## Harness 链路

- Task ID: 2026-11-13-docs-archive-closeout
- Task Manifest: .harness/tasks/2026-11-13-docs-archive-closeout/manifest.json
- Evidence: .harness/evidence/2026-11-13-docs-archive-closeout/commands.json
- Verification evidence: .harness/evidence/2026-11-13-docs-archive-closeout/summary.md
- Review Artifact: .harness/evidence/2026-11-13-docs-archive-closeout/review.md
- OpenSpec change: none
- Trivial change: no
- Quality Profile: ci-workflow
- Ratchet Decision: guide-updated
- GitHub Signal: repo-quality-gate

## Harness adoption markers

- task id: 2026-11-13-docs-archive-closeout
- task manifest: .harness/tasks/2026-11-13-docs-archive-closeout/manifest.json
- evidence: .harness/evidence/2026-11-13-docs-archive-closeout/commands.json
- boundaries: Base documentation; planned Ops task ownership migration
- backend response contract: none
- backend DTO contract: none
- permission contract: none
- audit coverage: none
- visual evidence: none
- inheritance contract: task ownership and shared document references only
- base drift: none
- Base/ops inheritance: shared specification remains in Base; Ops task stays in Ops

## 边界说明

- [x] 文档与治理引用修正；产品源码、UI、工作流、依赖和 VERSION 均不变。
- [x] 原历史读数与评审 scope 保留；旧日志与原18组档案保留。
- [x] Ops任务仍planned，未启动业务实现；原工作区改动保留。
- [x] 实质整改已随v0.18.8发行，此次无强制新foundation发行。

## 验证记录

- [x] Ops frontmatter/template/targeted packet checks passed; four cross-repo warnings disclosed and physical paths independently verified.
- [x] Producer compared original other-Ops tracked diff in memory successfully; current snapshot/helper independently verified, historical snapshots not retained. Three staged file ownerships transferred.
- [x] Base11 applicable documentation gates passed; independent CODE/delta APPROVE and ARCH APPROVE/CLEAR recorded.
- [ ] Exact PR hosted checks required before merge.

## 审核留痕

- Copilot review: automatic-policy; independent non-author artifact required
- CodeQL 结果: documentation-only; existing security scope unchanged
- GitHub checks 结果: pending exact PR checks
- Auto-merge: normal required checks govern merge
- Duplication Gate 结果: local PASS
- 是否高风险改动: no; standard documentation followup with no behavior/policy changes
- Residual risk / follow-up: Opsplannedimplementation, v0.18.8 consumption, freeze/S3/FR028 and separate production/product acceptance remain independently scoped

## 检查清单

- [x] 仓库与任务归属明确。
- [x] README 当前状态与历史检查点分开。
- [x] 共享规范仅引用Base，不在Ops复制。
- [x] 适用本地门禁与独立CODE/ARCH文档评审完成。
- [ ] 正常hosted checks通过后合并。
