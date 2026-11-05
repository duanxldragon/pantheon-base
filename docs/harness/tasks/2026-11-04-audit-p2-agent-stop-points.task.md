---
title: 统一 Agent 授权与维护者三触点
doc_type: Remediation
layer: platform
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
status: Active
updated_at: 2026-11-04
---

# Task Packet: 2026-11-04-audit-p2-agent-stop-points

## Goal

统一 Agent 授权与维护者三触点。详细计划和验收见 [整改计划](../../../.harness/tasks/2026-11-04-global-audit-remediation/plan.md)。

## Priority

P2；L1（共享合同则L2）。

## Primary Layer

platform

## Dependency Layers

- system/auth

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

- 统一 Agent 授权与维护者三触点
- 已授权安全可逆工作自主推进，不再仅因涉及auth/schema/menu一律中途询问
- 需求澄清/门禁策略/最终验收三触点明确；真实生产/破坏/凭证操作保留限制
- 中英文规则一致，入口不复制一套规范

### Out

- 产品扩展/大重构
- 批量删除或重写旧文档
- 生产操作/发布/冻结代签
- 覆盖或回退用户已有改动

## Expected Files

### Create

- docs/harness/tasks/2026-11-04-audit-p2-agent-stop-points.task.md
- .harness/tasks/2026-11-04-audit-p2-agent-stop-points/manifest.json
- .harness/evidence/2026-11-04-audit-p2-agent-stop-points/commands.json
- .harness/evidence/2026-11-04-audit-p2-agent-stop-points/summary.md
- .harness/evidence/2026-11-04-audit-p2-agent-stop-points/review.md

### Modify

- docs/harness/PANTHEON_BASE_DELIVERY_WORKFLOW.md
- docs/harness/PANTHEON_BASE_DELIVERY_WORKFLOW.en.md

### Do Not Touch

- VERSION
- CHANGELOG.md
- backend/pkg/database/migrations
- pantheon-ops

## Implementation Notes

- 已授权安全可逆整改自主推进
- 保持API签名，无新依赖
- 完成状态由验证与review证据决定

风险：中：不能把自主执行写成允许生产破坏、发布或Agent自贴solo-override。已批准范围按优先级直接实施；无须中途重复批准。

## Verification Plan

- node scripts/frontmatter-check.mjs
- node scripts/harness/check-doc-links.mjs --root . --strict

运行证据：文档/CI/消费构建，无用户UI行为修改；以实际命令验证。

## Linkage

- Task ID: 2026-11-04-audit-p2-agent-stop-points
- OpenSpec Change: none
- Superpowers Plan: none

- Task Manifest: .harness/tasks/2026-11-04-audit-p2-agent-stop-points/manifest.json
- Evidence Directory: .harness/evidence/2026-11-04-audit-p2-agent-stop-points/
- Review File: .harness/evidence/2026-11-04-audit-p2-agent-stop-points/review.md
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

- [x] 已授权安全可逆工作自主推进，不再仅因涉及auth/schema/menu一律中途询问
- [x] 需求澄清/门禁策略/最终验收三触点明确；真实生产/破坏/凭证操作保留限制
- [x] 中英文规则一致，入口不复制一套规范
