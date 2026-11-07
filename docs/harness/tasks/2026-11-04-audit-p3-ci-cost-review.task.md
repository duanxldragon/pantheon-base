---
title: 按实际价值裁定 CI 重复与 dormant 机制
doc_type: Remediation
layer: platform
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
status: Archived
updated_at: 2026-11-06
---

# Task Packet: 2026-11-04-audit-p3-ci-cost-review

## 2026-11-06 Closeout Status

官方 v0.18.4 与 Ops 根锁消费已确认。补验取得重建828/shared-drift、迁移32/dirty=false、前端218单测、消费57回归与4套生成模块烟测原始日志。原消费完整race2168/1/1失败；明确的Base测试文件overlay验证2170/0/1通过。Base直接完整race退出0：1890通过/0失败/1 S3 skip；原建库连接失败已保留。双路独立复审待完成。S3未验证、历史host/tenant/root-suite归因缺失、Ops新库deploy缺表及下一正式发行的测试夹具同步均有独立残余登记。

Decision delivered: preserve coverage/race and existing jobs; defer optimization until actual timing/value evidence. Optimization itself excluded.

[闭环矩阵、证据与残余事项](../../../.harness/evidence/2026-11-05-base-freeze-release/closeout.md)。下文执行说明包含历史记录；本节是当前状态。

## Goal

按实际价值裁定 CI 重复与 dormant 机制。详细计划和验收见 [整改计划](../../../.harness/tasks/2026-11-04-global-audit-remediation/plan.md)。

## Priority

P3；L1（共享合同则L2）。

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

- 按实际价值裁定 CI 重复与 dormant 机制
- 保留coverage与race目的差异，缺少实测不删除checker或job
- 登记需实际run耗时/收益才能启动的低优先优化；不作为冻结必需项
- 不新增门禁、依赖、复杂平台；不为全风格清零重构

### Out

- 产品扩展/大重构
- 批量删除或重写旧文档
- 生产操作/发布/冻结代签
- 覆盖或回退用户已有改动

## Expected Files

### Create

- docs/harness/tasks/2026-11-04-audit-p3-ci-cost-review.task.md
- .harness/tasks/2026-11-04-audit-p3-ci-cost-review/manifest.json
- .harness/evidence/2026-11-04-audit-p3-ci-cost-review/commands.json
- .harness/evidence/2026-11-04-audit-p3-ci-cost-review/summary.md
- .harness/evidence/2026-11-04-audit-p3-ci-cost-review/review.md

### Modify

### Do Not Touch

- VERSION
- CHANGELOG.md
- backend/pkg/database/migrations
- pantheon-ops

## Implementation Notes

- 已授权安全可逆整改自主推进
- 保持API签名，无新依赖
- 完成状态由验证与review证据决定

风险：低：优化不实施；盲删可能丢coverage/race保护。已批准范围按优先级直接实施；无须中途重复批准。

## Verification Plan

- none

运行证据：文档/CI/消费构建，无用户UI行为修改；以实际命令验证。

## Linkage

- Task ID: 2026-11-04-audit-p3-ci-cost-review
- OpenSpec Change: none
- Superpowers Plan: none

- Task Manifest: .harness/tasks/2026-11-04-audit-p3-ci-cost-review/manifest.json
- Evidence Directory: .harness/evidence/2026-11-04-audit-p3-ci-cost-review/
- Review File: .harness/evidence/2026-11-04-audit-p3-ci-cost-review/review.md
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

- [x] 保留coverage与race目的差异，缺少实测不删除checker或job
- [x] 登记需实际run耗时/收益才能启动的低优先优化；不作为冻结必需项
- [x] 不新增门禁、依赖、复杂平台；不为全风格清零重构

## Current scoped closeout (2026-11-07)

2026-11-07: original task scope independently approved by CODE APPROVE / ARCH CLEAR on the exact seven-task plan. Current Base1890/0/1, 47 packages, FE218 and immutable Full Smoke/Release Gate passed. Official v0.18.5 published/acquired/rebuilt; remaining five consumer/programme tasks stay open. S3 remains unverified without waiver; maintenance freeze unsigned; CI optimization remains a decision/measurement follow-up. See .harness/evidence/2026-11-05-base-freeze-release/resume9-seven-task-applied.json. Original criteria and historical body are retained.
