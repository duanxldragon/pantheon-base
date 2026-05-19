# Task Packet: pantheon-base-audit-and-qa

## Goal

按照 Harness Engineering 方法检查 `pantheon-base` 的合同、设计、代码与运行态质量，补齐必要设计和实现，并完成 QA 与项目验收收口。

## Primary Layer

platform

## Dependency Layers

- system/auth
- system/iam
- system/org
- system/config

## Contract Anchors

- `docs/contracts/PLATFORM_CONTRACT.md`
- `docs/contracts/SYSTEM_AUTH_CONTRACT.md`
- `docs/contracts/SYSTEM_IAM_CONTRACT.md`
- `docs/contracts/SYSTEM_ORG_CONTRACT.md`
- `docs/contracts/SYSTEM_CONFIG_CONTRACT.md`
- `docs/acceptances/ACCEPTANCE_CHECKLIST.md`
- `docs/designs/WORKFLOW.md`

## Scope

### In

- 审核现有合同、设计入口、实现与验收口径是否一致
- 运行文档、构建、后端测试、前端 smoke / QA 检查
- 针对真实失败项补设计、补代码、补验收记录
- 生成本次任务的 evidence 与 review-ready 收口材料

### Out

- 无明确失败依据的大范围重构
- 与当前 QA 失败项无关的风格性重写
- 跨仓修改 `pantheon-ops`

## Expected Files

### Create

- `docs/harness/tasks/2026-05-18-pantheon-base-audit-and-qa.task.md`
- `.harness/evidence/2026-05-18-pantheon-base-audit-and-qa/summary.md`
- `.harness/evidence/2026-05-18-pantheon-base-audit-and-qa/commands.json`

### Modify

- `docs/*`
- `backend/**/*`
- `frontend/**/*`
- `tests/**/*`
- `scripts/**/*`

### Do Not Touch

- `../pantheon-ops/**`
- `../harness-engineering/**`

## Implementation Notes

- 先做可自动化基线检查，再做真实 smoke / browser QA
- 只有出现明确缺口时才补设计或代码
- UI 相关问题需要保留可追踪证据或明确记录 visual gap

## Verification Plan

### Backend

- `go test ./...`

### Frontend

- `cd frontend && cmd /c npm run build`

### Browser / Smoke

- `cd frontend && cmd /c npm run test:smoke:system`

## Linkage

- Task ID: `2026-05-18-pantheon-base-audit-and-qa`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Evidence Directory: `.harness/evidence/2026-05-18-pantheon-base-audit-and-qa/`
- Review File: `.harness/evidence/2026-05-18-pantheon-base-audit-and-qa/review.md`

## Evidence Required

- command result summary
- smoke / browser result summary
- screenshots if UI failure or UI fix occurs
- review summary

## Human Gates

- none

## Completion Checklist

- [ ] Layer and boundary declared
- [ ] Contract anchors read
- [ ] Tests or checks updated
- [ ] Verification run or exception recorded
- [ ] Evidence saved or summarized
- [ ] Docs updated if contracts changed
- [ ] Review completed
