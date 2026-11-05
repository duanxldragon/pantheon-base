---
title: Ops既有真实数据库测试失败：业务意图与fixture裁定
doc_type: Remediation
layer: business/*
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
status: Active
updated_at: 2026-11-04
---

# Task Packet: 2026-11-04-audit-p2-ops-db-test-followup

## Goal

Ops既有真实数据库测试失败：业务意图与fixture裁定。完整证据见同task-id summary/comparison。

## Priority

P2；L2。

## Primary Layer

business/*

## Dependency Layers

- platform

## Harness Profile

- Template: admin-platform
- Overlay: pantheon-base
- Coverage Dimensions:
  - behaviour
  - maintainability

## Workspace Context

- Target Repository: pantheon-base
- Repository Role: foundation-source
- Upstream Dependencies: pantheon-harness
- Downstream Consumers: pantheon-ops
- Sync Expectation: deferred
- Release Requirement: foundation-release
- Downstream Sync Note: 本地消费者验证，正式发布/lock升级明确延期

## Contract Anchors

- `docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-11-04_FULL.md`
- `docs/harness/VERIFICATION_EVIDENCE_SPEC.md`
- `docs/harness/REVIEW_LOOP_SPEC.md`

## Scope

### In

- 记录最终候选与Ops HEAD同环境失败对照
- 逐项判断业务实现、测试fixture或合同错误后再提出最小修复
- 不将12失败节点误写为12独立功能故障，不将既有失败归因于本轮Base

### Out

- 自动修改Ops主工作树/业务实现
- 为测试变绿放宽SSRF或鉴权
- 本轮发布/锁升级/冻结代签

## Expected Files

### Create

- docs/harness/tasks/2026-11-04-audit-p2-ops-db-test-followup.task.md
- .harness/tasks/2026-11-04-audit-p2-ops-db-test-followup/manifest.json
- .harness/evidence/2026-11-04-audit-p2-ops-db-test-followup/commands.json
- .harness/evidence/2026-11-04-audit-p2-ops-db-test-followup/summary.md
- .harness/evidence/2026-11-04-audit-p2-ops-db-test-followup/review.md

### Modify

- none

### Do Not Touch

- pantheon-ops
- VERSION
- CHANGELOG.md
- backend/pkg/security/ssrf

## Implementation Notes

Ops HEAD原样对照：全部12失败节点同断言，5份测试源码SHA256一致（动态端口仅作数值归一）。原始失败不是本轮Base补丁引入。

9个顶层用例、12失败节点含父/子；266通过、0跳过，14通过包/4失败包。业务功能是否错误仍需合同和端到端裁定。

## Verification Plan

- go test -json -p 1 -count=1 ./modules/business/...
- 同环境Ops HEAD目标失败测试对照

真实DB失败已复现，代码/fixture业务意图责任尚未完成裁定；下游验收未关闭。

## Linkage

- Task ID: 2026-11-04-audit-p2-ops-db-test-followup
- OpenSpec Change: none
- Superpowers Plan: none

- Task Manifest: .harness/tasks/2026-11-04-audit-p2-ops-db-test-followup/manifest.json
- Evidence Directory: .harness/evidence/2026-11-04-audit-p2-ops-db-test-followup/
- Review File: .harness/evidence/2026-11-04-audit-p2-ops-db-test-followup/review.md
- Change Ref: none
- Plan References: .harness/tasks/2026-11-04-global-audit-remediation/plan.md, docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-11-04_FULL.md

## Evidence Required

实际执行命令、退出状态、隔离复现/失败反证、下游影响和显式gap。不伪造测试/独立review通过。

## Human Gates

- 实际门禁策略放宽、生产破坏操作、发布及冻结宣告：维护者；本地修复已授权

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [ ] Review completed
- [x] Ops HEAD失败对照
- [ ] 业务意图责任逐项裁定
- [ ] Ops最小修复和回归
