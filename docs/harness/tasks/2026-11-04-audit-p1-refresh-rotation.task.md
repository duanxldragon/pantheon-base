---
title: 刷新令牌并发与存储故障验证及最小修复
doc_type: Remediation
layer: system/auth
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
status: Archived
updated_at: 2026-11-06
---

# Task Packet: 2026-11-04-audit-p1-refresh-rotation

## 2026-11-06 Closeout Status

官方 v0.18.4 与 Ops 根锁消费已确认。补验取得重建828/shared-drift、迁移32/dirty=false、前端218单测、消费57回归与4套生成模块烟测原始日志。原消费完整race2168/1/1失败；明确的Base测试文件overlay验证2170/0/1通过。Base直接完整race退出0：1890通过/0失败/1 S3 skip；原建库连接失败已保留。双路独立复审待完成。S3未验证、历史host/tenant/root-suite归因缺失、Ops新库deploy缺表及下一正式发行的测试夹具同步均有独立残余登记。

Original MySQL/Redis concurrency and storage-failure regressions plus later full race and Tenant V1/runtime evidence; no new auth change.

[闭环矩阵、证据与残余事项](../../../.harness/archive/2026-11/evidence/2026-11-05-base-freeze-release/closeout.md)。下文执行说明包含历史记录；本节是当前状态。

## Goal

刷新令牌并发与存储故障验证及最小修复。详细计划和验收见 [整改计划](../../../.harness/archive/2026-11/tasks/2026-11-04-global-audit-remediation/plan.md)。

## Priority

P1；L2。

## Primary Layer

system/auth

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

- 刷新令牌并发与存储故障验证及最小修复
- 先隔离验证同一旧refresh并发、跨实例和存储失败；记录实际结果，不将静态疑点直接当漏洞
- 确认后补原子消费/轮换最小实现；同一旧token最多一次签发成功，失败不可继续成功响应
- 回归正常刷新、吊销/改密、租户V1约束和失败恢复；证据不足保持未关闭

### Out

- 产品扩展/大重构
- 批量删除或重写旧文档
- 生产操作/发布/冻结代签
- 覆盖或回退用户已有改动

## Expected Files

### Create

- docs/harness/tasks/2026-11-04-audit-p1-refresh-rotation.task.md
- .harness/tasks/2026-11-04-audit-p1-refresh-rotation/manifest.json
- backend/pkg/authtoken/consume_refresh_test.go
- backend/modules/auth/login/refresh_rotation_test.go
- backend/modules/auth/session/refresh_race_test.go
- .harness/evidence/2026-11-04-audit-p1-refresh-rotation/commands.json
- .harness/evidence/2026-11-04-audit-p1-refresh-rotation/summary.md
- .harness/evidence/2026-11-04-audit-p1-refresh-rotation/review.md

### Modify

- backend/pkg/authtoken/token.go
- backend/modules/auth/login/login_handler.go
- backend/modules/auth/session/session_service.go
- docs/contracts/SYSTEM_AUTH_CONTRACT.md
- docs/contracts/SYSTEM_AUTH_CONTRACT.en.md

### Do Not Touch

- VERSION
- CHANGELOG.md
- backend/pkg/database/migrations
- pantheon-ops

## Implementation Notes

- 已授权安全可逆整改自主推进
- 保持API签名，无新依赖
- 完成状态由验证与review证据决定

风险：高：并发与重试语义、跨实例会话、部分DB/Redis失败；禁止盲目并行补丁和新增租户功能。已批准范围按优先级直接实施；无须中途重复批准。

## Verification Plan

- go test ./pkg/authtoken ./modules/auth/login ./modules/auth/session

运行证据：见同task-id commands.json/summary.md；Controlled local tests/builds collected; live external integration, browser smoke and release validation remain unverified.

## Linkage

- Task ID: 2026-11-04-audit-p1-refresh-rotation
- OpenSpec Change: none
- Superpowers Plan: none

- Task Manifest: .harness/tasks/2026-11-04-audit-p1-refresh-rotation/manifest.json
- Evidence Directory: .harness/evidence/2026-11-04-audit-p1-refresh-rotation/
- Review File: .harness/evidence/2026-11-04-audit-p1-refresh-rotation/review.md
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

- [x] 先隔离验证同一旧refresh并发、跨实例和存储失败；记录实际结果，不将静态疑点直接当漏洞
- [x] 确认后补原子消费/轮换最小实现；同一旧token最多一次签发成功，失败不可继续成功响应
- [x] 回归正常刷新、吊销/改密、租户V1约束和失败恢复；证据不足保持未关闭

## Current scoped closeout (2026-11-07)

2026-11-07: original task scope independently approved by CODE APPROVE / ARCH CLEAR on the exact seven-task plan. Current Base1890/0/1, 47 packages, FE218 and immutable Full Smoke/Release Gate passed. Official v0.18.5 published/acquired/rebuilt; remaining five consumer/programme tasks stay open. S3 remains unverified without waiver; maintenance freeze unsigned; CI optimization remains a decision/measurement follow-up. See .harness/evidence/2026-11-05-base-freeze-release/resume9-seven-task-applied.json. Original criteria and historical body are retained.
