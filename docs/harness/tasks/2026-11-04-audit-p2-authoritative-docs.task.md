---
title: 修正已确认权威文档漂移与失效链接
doc_type: Remediation
layer: platform
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
status: Archived
updated_at: 2026-11-06
---

# Task Packet: 2026-11-04-audit-p2-authoritative-docs

## 2026-11-06 Closeout Status

官方 v0.18.4 与 Ops 根锁消费已确认。补验取得重建828/shared-drift、迁移32/dirty=false、前端218单测、消费57回归与4套生成模块烟测原始日志。原消费完整race2168/1/1失败；明确的Base测试文件overlay验证2170/0/1通过。Base直接完整race退出0：1890通过/0失败/1 S3 skip；原建库连接失败已保留。双路独立复审待完成。S3未验证、历史host/tenant/root-suite归因缺失、Ops新库deploy缺表及下一正式发行的测试夹具同步均有独立残余登记。

Bounded original doc corrections and original asset baseline preserved; latest index release/consumer facts corrected in this closeout.

[闭环矩阵、证据与残余事项](../../../.harness/evidence/2026-11-05-base-freeze-release/closeout.md)。下文执行说明包含历史记录；本节是当前状态。

## Goal

修正已确认权威文档漂移与失效链接。详细计划和验收见 [整改计划](../../../.harness/tasks/2026-11-04-global-audit-remediation/plan.md)。

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

- 修正已确认权威文档漂移与失效链接
- 按资产附表逐项核对后只改确定的现态、命令、状态、链接，保留历史正文
- 失效链接替换为明确未产出/计划项；不为补链接实现审批/通知/调度/报表
- 三份归档、MERGE、REPLACE建议保留旧路径和历史内容，仅标历史/指向权威；不得批量删文档
- 中英文同步；不重新统计或改写已交付审计基线

### Out

- 产品扩展/大重构
- 批量删除或重写旧文档
- 生产操作/发布/冻结代签
- 覆盖或回退用户已有改动

## Expected Files

### Create

- docs/harness/tasks/2026-11-04-audit-p2-authoritative-docs.task.md
- .harness/tasks/2026-11-04-audit-p2-authoritative-docs/manifest.json
- .harness/evidence/2026-11-04-audit-p2-authoritative-docs/commands.json
- .harness/evidence/2026-11-04-audit-p2-authoritative-docs/summary.md
- .harness/evidence/2026-11-04-audit-p2-authoritative-docs/review.md

### Modify

- DESIGN.en.md
- DESIGN.md
- docs/DEV_DB_INIT_GUIDE.md
- docs/VERSION_MANAGEMENT_GUIDE.md
- docs/contracts/SYSTEM_IAM_CONTRACT.en.md
- docs/contracts/SYSTEM_IAM_CONTRACT.md
- docs/designs/ALERT_MONITORING_CENTER_DESIGN.en.md
- docs/designs/APPROVAL_WORKFLOW_DESIGN.en.md
- docs/designs/APPROVAL_WORKFLOW_DESIGN.md
- docs/designs/AUTH_MODULE_DESIGN.md
- docs/designs/BACKEND.en.md
- docs/designs/BACKEND.md
- docs/designs/DARK_MODE_DESIGN.en.md
- docs/designs/DATA_PERMISSION_HOOK.en.md
- docs/designs/DATA_PERMISSION_HOOK.md
- docs/designs/DICT_AND_SETTING_DESIGN.en.md
- docs/designs/DICT_AND_SETTING_DESIGN.md
- docs/designs/FOUNDATION_RELEASE_MODEL.en.md
- docs/designs/FOUNDATION_RELEASE_MODEL.md
- docs/designs/FRONTEND.en.md
- docs/designs/FRONTEND.md
- docs/designs/FRONTEND_COMPONENT_PLAN.en.md
- docs/designs/FRONTEND_COMPONENT_PLAN.md
- docs/designs/FRONTEND_PAGE_TEMPLATES.en.md
- docs/designs/FRONTEND_PAGE_TEMPLATES.md
- docs/designs/GENERATOR_MODULE_DESIGN.md
- docs/designs/MODULE_CONTRACT.en.md
- docs/designs/MODULE_CONTRACT.md
- docs/designs/NOTICE_CENTER_API_CONTRACT.md
- docs/designs/P2_SCALE_ROADMAP.md
- docs/designs/PANTHEON_BASE_ARCHITECTURE_OVERVIEW.md
- docs/designs/PERMISSION_MENU_DECOUPLING.md
- docs/designs/PLATFORM_DASHBOARD_DESIGN.md
- docs/designs/QUALITY_AND_SECURITY_STRATEGY.en.md
- docs/designs/QUALITY_AND_SECURITY_STRATEGY.md
- docs/designs/README.md
- docs/designs/REPORT_CENTER_API_CONTRACT.en.md
- docs/designs/REPORT_CENTER_API_CONTRACT.md
- docs/designs/REPORT_CENTER_DESIGN.en.md
- docs/designs/REPORT_CENTER_DESIGN.md
- docs/designs/REPORT_CENTER_TEST_PLAN.en.md
- docs/designs/REPORT_CENTER_TEST_PLAN.md
- docs/designs/REPOSITORY_LAYOUT.en.md
- docs/designs/REPOSITORY_LAYOUT.md
- docs/designs/SCHEDULER_CENTER_DB_DESIGN.md
- docs/designs/SCHEDULER_CENTER_DESIGN.en.md
- docs/designs/SCHEDULER_CENTER_DESIGN.md
- docs/designs/TASK_CENTER_DESIGN.en.md
- docs/designs/TENANT_READY_SINGLE_TENANT_DESIGN.en.md
- docs/designs/TENANT_READY_SINGLE_TENANT_DESIGN.md
- docs/harness/VERIFICATION_EVIDENCE_SPEC.en.md
- docs/harness/VERIFICATION_EVIDENCE_SPEC.md
- docs/testing-quick-start.md

### Do Not Touch

- VERSION
- CHANGELOG.md
- backend/pkg/database/migrations
- pantheon-ops

## Implementation Notes

- 已授权安全可逆整改自主推进
- 保持API签名，无新依赖
- 完成状态由验证与review证据决定

风险：中：引用/继承/历史追溯；不移动旧报告，不删除未知1252份资产。已批准范围按优先级直接实施；无须中途重复批准。

## Verification Plan

- node scripts/frontmatter-check.mjs
- node scripts/harness/check-doc-links.mjs --root . --strict

运行证据：文档/CI/消费构建，无用户UI行为修改；以实际命令验证。

## Linkage

- Task ID: 2026-11-04-audit-p2-authoritative-docs
- OpenSpec Change: none
- Superpowers Plan: none

- Task Manifest: .harness/tasks/2026-11-04-audit-p2-authoritative-docs/manifest.json
- Evidence Directory: .harness/evidence/2026-11-04-audit-p2-authoritative-docs/
- Review File: .harness/evidence/2026-11-04-audit-p2-authoritative-docs/review.md
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

- [x] 按资产附表逐项核对后只改确定的现态、命令、状态、链接，保留历史正文
- [x] 失效链接替换为明确未产出/计划项；不为补链接实现审批/通知/调度/报表
- [x] 三份归档、MERGE、REPLACE建议保留旧路径和历史内容，仅标历史/指向权威；不得批量删文档
- [x] 中英文同步；不重新统计或改写已交付审计基线

## Current scoped closeout (2026-11-07)

2026-11-07: original task scope independently approved by CODE APPROVE / ARCH CLEAR on the exact seven-task plan. Current Base1890/0/1, 47 packages, FE218 and immutable Full Smoke/Release Gate passed. Official v0.18.5 published/acquired/rebuilt; remaining five consumer/programme tasks stay open. S3 remains unverified without waiver; maintenance freeze unsigned; CI optimization remains a decision/measurement follow-up. See .harness/evidence/2026-11-05-base-freeze-release/resume9-seven-task-applied.json. Original criteria and historical body are retained.
