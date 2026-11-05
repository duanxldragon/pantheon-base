---
title: 2026-11-03 全局审计整改 programme（5 个子包）
doc_type: Remediation
layer: platform
status: Archived
depends_on_layers: []
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-11-03.md
updated_at: 2026-11-03
---

# Task Packet: 2026-11-03-audit-remediation-programme

## Goal

把 2026-11-03 全局审计最终版（`docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-11-03.md`，裁决 **B：完成少量整改后进入维护冻结阶段**，P0=0 / P1=2 / P2=14 / P3=15）的 2 个 P1 与优先 P2 拆成 5 个可独立评审的执行子包，登记进 `.harness`，并按依赖顺序开始执行。programme 本身不改产品代码。

## Priority

`high`

## Estimated Complexity

`moderate`

## Primary Layer

platform

## Dependency Layers

- `platform`（路由装配、数据库迁移边界）
- `system/iam`（用户/角色/岗位数据面）
- `system/org`（组织架构数据面）

## Dependencies

- blockedBy: `none`
- blocks: `none`（各子包间无硬依赖，可并行执行；W1 为冻结前必做）

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `governance-programme`
- Portable Failure Class: `audit-remediation-programme`
- Owner Layer: `foundation-source`
- Ratchet Decision: `gate-updated`
- Coverage Dimensions:
  - behaviour
  - maintainability
  - architecture-fitness
  - runtime-quality

交付层级：**L1/L2**（W1/W2/W3 为 L1 轻量闭环；W4/W5 触碰系统域路由与迁移边界，升 L2，带各自 evidence 与 human gate）。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: none
- Release Requirement: none
- Downstream Sync Note: 本 programme 不修改共享 API 契约、菜单、权限、i18n 或数据库迁移的可执行语义（W5 若改 AutoMigrate 分支属行为变化，需单独 human gate）；随下次 foundation release 自然送达 ops。

## Contract Anchors

- `docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-11-03.md`（审计最终版，§11/§12 为本 programme 的问题与优先级来源）
- `docs/contracts/PLATFORM_CONTRACT.md`
- `docs/harness/HARNESS_ENGINEERING_CONTRACT.md`

## Scope

### In

- 登记 5 个子包的任务文档与 manifest，并写明各自 findings 来源（审计 ID 与证据行号）
- 子包覆盖审计 §12「应该处理」清单：P1 的 FE-01/FE-02；P2 的 GOV-01/02/03(+BE-02)、DOC-01/02(+GOV-06/07)、ARCH-01、DB-01
- 每个子包「修复 + 机械验证」，验证命令写入 verificationPlan，evidence 落 `.harness/evidence/<id>/`
- 执行顺序：W1（P1，冻结前必做）优先，其余按可用资源逐个执行

### Out

- P3 全部（FE-06…FE-14、GOV-09/10/11、DOC-03、BE-01）与 GOV-04/05：审计判「可以优化」，不立项，防止以整改为名继续扩大维护面
- GOV-08（前端覆盖率门禁阈值）：需维护者一句话决策，登记为 programme human gate，不拆包
- 维护者 human-gate 动作：冻结宣告签署、`000031` 生产执行时点——programme 不代做
- 删除 `pkg/security/ssrf`（ops 5 处引用，D 类保留）、合并 `docs/history` 与 `docs/reviews` 历史评审、切 foundation release、改 VERSION / CHANGELOG / `.harness/STATUS.md` 的冻结宣告段

## Assumptions and Open Questions

- Confirmed Facts: `FE-01`（`useUserList.ts:329,355` pageSize 9999 vs 后端 `NormalizePagination(…,100)`）、`FE-02`（`DeptList.tsx:138` orgChartPageSize=1000 + `dept/index.ts:44`，后端 cap=100）、`ARCH-01`（`system_modules.go` 14 处手写链 + `route_groups.go` 0 调用方）、`DB-01`（`data_scope_middleware.go:61-62` 运行时单表 AutoMigrate）、`GOV-01/02/03`、`DOC-01/02` 均已由审计复核确认存在
- Working Assumptions: `route_groups.go` 现有助手可直接补齐系统域三种组合；`NormalizePagination` cap=100 是模块既定语义，前端修复不改后端
- Open Questions: `none`

## Structural Scope

### Scope Quantification

- Modules affected: 5（programme 覆盖 platform / system/iam / system/org / harness 治理 / 文档）
- Files: 约 25（W1≈6、W2≈4、W3≈3、W4≈3、W5≈3 + 各包 evidence）
- API endpoints: 0 变更（下拉/组织架构取数前端对齐，不新增后端接口）
- Database migrations: no（W5 只改运行时 AutoMigrate 分支，迁移表语义不变）

### Risk Nodes

1. FE-01/FE-02 修复若只把 9999 降成 100，会从「静默截断」退化为「显式截断」——必须分页聚合取全量，不能用降 cap 糊弄 - Mitigation: 前端实现翻页聚合 helper，行为 >100 行时仍取全
2. W4 重排中间件链若遗漏 DataScope/PlatformCapability 会产生静默权限差异 - Mitigation: 路由结构断言测试 + 逐组对照原链

### Legacy Fields (for compatibility)

- Affected Subgraph: `前端下拉/组织架构取数 -> /system/role|post|user 列表 -> NormalizePagination(cap=100)`；`system_modules.go 中间件链 -> contracts/route_groups.go 助手`
- Boundary Crossings: `system/iam -> pkg/common` | `system/org -> system/iam/user` | `platform -> system/* 路由装配`
- Risk Nodes: `normalizeRolePageQuery` | `normalizePostPageQuery` | `user_helper.go` | `system_modules.go 路由注册` | `data_scope_middleware.go`
- Graph Focus: `route-wiring` | `call-depth`

## Expected Files

### Create

- `docs/harness/tasks/2026-11-03-audit-remediation-programme.task.md`
- `.harness/tasks/2026-11-03-audit-remediation-programme/manifest.json`
- 5 个子包的 task.md + manifest（各子包 expectedFiles 内列出）
- `.harness/evidence/2026-11-03-audit-remediation-programme/{commands.json,summary.md,review.md}`（收口时）

### Modify

- 各子包的 expectedFiles（见各自 packet，不在 programme 层直接列）

### Do Not Touch

- `backend/modules/business/**`
- `backend/pkg/security/ssrf`
- `docs/history/**`、`docs/reviews/**`（历史评审与 3rd-party review 不得删改）
- `pantheon-ops/**`
- `VERSION`、`CHANGELOG.md`
- `.harness/STATUS.md` 的冻结宣告段（归维护者）

## Implementation Notes

- 拆包单位是「一次可评审的 diff」：W3 把 GOV-06/DOC-01 与 GOV-07/DOC-02 合并为一包（同属文档漂移），W2 把 GOV-01/02/03 与 BE-02 合并（同源：scripts 生死与接线登记）。
- 每个子包必须「修复 + 可复跑验证」，下一轮漂移靠验证命令发现，不靠人审。
- W1 前端改动不触碰后端契约；后端 cap=100 语义是既定行为，前端负责对齐。
- W4 用 `route_groups.go` 现有助手补齐系统域三种组合（DataScope/PlatformCapability/无），不新造链。
- W5 的 AutoMigrate 分支与 000001/000002/000020 迁移表并存——先确认迁移表已持有 `system_role_data_scope` 的最终形状，再决定 AutoMigrate 分支去留。

## Minimum Viable Approach

- Selected Rung: `reuse`（复用 `route_groups.go` 现有助手、复用已有分页聚合模式、复用现有门禁）
- Why This Is Enough: 审计整改项本身是收口与对齐，不引入新抽象
- Upgrade Trigger: `none`

## Success Criteria

- Behaviour Outcome: 5 个子包各自给出审计 ID → evidence 的闭环；P1 修复后角色/岗位/组织成员 >100 行时不再静默截断
- Verification Signal: 各子包 verificationPlan 命令全绿 + `check-task-packet.mjs` 对全部新 packet 0 error
- Regression Watch: 中间件链的权限语义、分页返回值形状、AutoMigrate 行为在 dev/prod 两模式下的既有测试不回归
- Economics Watch: `none`

## Context Strategy

- Entry Sources: `docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-11-03.md`（§11/§12）、各子包 packet、`pantheon-base/AGENTS.md`
- Retrieval Order: `entry -> summary -> raw`
- Retrieval Helpers: `codegraph`（中间件链、分页调用点）
- Promotion Target: `none`
- Response Budget: `terse`
- Sensitive Context: `none`

## Execution Roles

- Implementer Posture: 每个子包按自己的 scope.in 只改清单内文件；改前确认「不会红」的验证命令，改后跑绿并落 evidence
- Reviewer Posture: 对照审计 ID 逐一确认闭合；确认没有把 P3 或 human-gate 项偷偷塞进子包；确认 Do Not Touch 清单未被触碰

## Stop Points

- `none`

## Technical Debt

- technicalDebtFlag: `no`
- technicalDebtNote: 审计整改本身是消债；W5 若保留 AutoMigrate 兜底分支属接受现状，不新增债

## Rollback Plan

**Required for destructive changes.**

- Trigger Condition: `none`（本 programme 无可逆性风险删除或 DB 变更）
- Rollback Steps:
  1. 单子包 diff 各自可 `git revert`
- Rollback Verification:
  - [ ] Functionality verified
  - [ ] Data integrity verified
  - [ ] No side effects observed

## State Plan

- Checkpoint Expectation: 每个子包收口后更新对应 manifest 的 `status` 与 `executionResult`
- Resume Artifacts: `.harness/evidence/2026-11-03-audit-remediation-programme/summary.md`

## Verification Plan

### Backend

- `cd backend && go build ./... && go vet ./...`
- `cd backend && go test -short ./...`

### Frontend

- `npx tsc -b` / `eslint .` / `vitest run`（W1 涉及前端）

### Browser / Smoke

- none（本 programme 无运行时烟测范围）

## Linkage

- Task ID: `2026-11-03-audit-remediation-programme`
- Task Manifest: `.harness/tasks/2026-11-03-audit-remediation-programme/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Plan References: `docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-11-03.md`、`docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-11-03_DRAFT_4a1fadbb.md`（前版，仅追溯）
- Evidence Directory: `.harness/evidence/2026-11-03-audit-remediation-programme/`
- Review File: `.harness/evidence/2026-11-03-audit-remediation-programme/review.md`

## Evidence Required

- `.harness/evidence/2026-11-03-audit-remediation-programme/commands.json`：programme 级门禁读数
- `.harness/evidence/2026-11-03-audit-remediation-programme/summary.md`：子包清单、依赖图、P1/P2 覆盖表、不处理清单
- `.harness/evidence/2026-11-03-audit-remediation-programme/review.md`：审计 §11 问题 → 子包着落表，确认无静默遗漏

## Human Gates

- 维护者：GOV-08（覆盖率门禁阈值）一句话决策；冻结宣告签署；`000031` 生产执行时点。
- W5 的 AutoMigrate 分支行为变化属 gate-policy 级改动，由非作者 Reviewer 确认。
- programme 自身不代做任何维护者动作。

## Completion Checklist

- [ ] Layer and boundary declared
- [ ] Contract anchors read
- [ ] Verification run or exception recorded
- [ ] Evidence saved or summarized
- [ ] Review completed
- [ ] 5 个子包全部登记且各自 manifest 通过校验
- [ ] 审计 §12「应该处理」的 P1×2 + P2×6（GOV-01/02/03、DOC-01/02、ARCH-01、DB-01）全部：已闭合 / 保留为 open 且有明确下一步
- [ ] 未把 P3 观察项升级为独立任务
- [ ] Do Not Touch 清单未被触碰