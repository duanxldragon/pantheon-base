---
title: SSRF DNS 校验与实际拨号绑定
doc_type: Remediation
layer: platform
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
status: Archived
updated_at: 2026-11-04
---

> Current original-scope acceptance: 2026-11-07: exact original scope approved by fresh independent CODE APPROVE / ARCH CLEAR on the final five-task plan. Official Base v0.18.5 at1da0834b; Base1890/0/1 and47packages, FE218, immutable Full Smoke/Release Gate passed. Official Ops PR177 merged at92c1efcfc4f754a7f0a4e9f181f446f4a2ddcfc2 after required hosted gates including Smoke Sanity; full readonly CGO consumer race2170/0/1,64packages, no source overlay or module mutation; FE218/scripts59/migration32clean/four standard generator smoke passed. Original unchanged SSRF public-API attack replay now records2 DNS lookups / loopbacknotreached; original deliberate attack-failure panic is preserved as a nonzero result, not called a green test. All40 original criteria and all source/contract boundaries preserved. S3 provider skip/no waiver, maintenance freeze unsigned, OpsQA002 and extra host-import runtime table gaps, network policy/CI measurements/baselines/production operations remain explicit separate residuals.

## Historical packet text (preserved)

# Task Packet: 2026-11-04-audit-p1-ssrf-dial-binding

## Goal

SSRF DNS 校验与实际拨号绑定。详细计划和验收见 [整改计划](../../../.harness/tasks/2026-11-04-global-audit-remediation/plan.md)。

## Priority

P1；L2。

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

- SSRF DNS 校验与实际拨号绑定
- 原始DNS重绑定复现从到达loopback变为拒绝，测试先红后绿
- 只拨号已核查IP；私网、混合DNS、IPv4/IPv6、取消/超时、多地址和HTTPS Host/SNI行为有回归
- Ops实际消费接口不删除；本地重建和业务测试通过，下游正式升级明确延期

### Out

- 产品扩展/大重构
- 批量删除或重写旧文档
- 生产操作/发布/冻结代签
- 覆盖或回退用户已有改动

## Expected Files

### Create

- docs/harness/tasks/2026-11-04-audit-p1-ssrf-dial-binding.task.md
- .harness/tasks/2026-11-04-audit-p1-ssrf-dial-binding/manifest.json
- backend/pkg/security/ssrf/transport_test.go
- .harness/evidence/2026-11-04-audit-p1-ssrf-dial-binding/commands.json
- .harness/evidence/2026-11-04-audit-p1-ssrf-dial-binding/summary.md
- .harness/evidence/2026-11-04-audit-p1-ssrf-dial-binding/review.md

### Modify

- backend/pkg/security/ssrf/validator.go
- backend/pkg/security/ssrf/README.md

### Do Not Touch

- VERSION
- CHANGELOG.md
- backend/pkg/database/migrations
- pantheon-ops

## Implementation Notes

- 已授权安全可逆整改自主推进
- 保持API签名，无新依赖
- 完成状态由验证与review证据决定

风险：高：多地址、IPv6、HTTPS、重定向和Ops datasource/webhook连接行为；保留导出签名、无新依赖。已批准范围按优先级直接实施；无须中途重复批准。

## Verification Plan

- go test ./pkg/security/ssrf
- go test ./...

运行证据：见同task-id commands.json/summary.md；Controlled local tests/builds collected; live external integration, browser smoke and release validation remain unverified.

## Linkage

- Task ID: 2026-11-04-audit-p1-ssrf-dial-binding
- OpenSpec Change: none
- Superpowers Plan: none

- Task Manifest: .harness/tasks/2026-11-04-audit-p1-ssrf-dial-binding/manifest.json
- Evidence Directory: .harness/evidence/2026-11-04-audit-p1-ssrf-dial-binding/
- Review File: .harness/evidence/2026-11-04-audit-p1-ssrf-dial-binding/review.md
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

- [x] 原始DNS重绑定复现从到达loopback变为拒绝，测试先红后绿
- [x] 只拨号已核查IP；私网、混合DNS、IPv4/IPv6、取消/超时、多地址和HTTPS Host/SNI行为有回归
- [ ] Ops实际消费接口不删除；本地重建和业务测试通过，下游正式升级明确延期

## Final original-scope closeout (2026-11-07)

2026-11-07: exact original scope approved by fresh independent CODE APPROVE / ARCH CLEAR on the final five-task plan. Official Base v0.18.5 at1da0834b; Base1890/0/1 and47packages, FE218, immutable Full Smoke/Release Gate passed. Official Ops PR177 merged at92c1efcfc4f754a7f0a4e9f181f446f4a2ddcfc2 after required hosted gates including Smoke Sanity; full readonly CGO consumer race2170/0/1,64packages, no source overlay or module mutation; FE218/scripts59/migration32clean/four standard generator smoke passed. Original unchanged SSRF public-API attack replay now records2 DNS lookups / loopbacknotreached; original deliberate attack-failure panic is preserved as a nonzero result, not called a green test. All40 original criteria and all source/contract boundaries preserved. S3 provider skip/no waiver, maintenance freeze unsigned, OpsQA002 and extra host-import runtime table gaps, network policy/CI measurements/baselines/production operations remain explicit separate residuals. See .harness/evidence/2026-11-05-base-freeze-release/resume11-five-task-applied.json. Original scope/criteria and earlier packet text remain historical records.
