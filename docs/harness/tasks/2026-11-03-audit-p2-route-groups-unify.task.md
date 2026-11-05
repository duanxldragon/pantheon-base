---
title: 系统域路由组统一收口（ARCH-01，P2）
doc_type: Remediation
layer: platform
status: Archived
depends_on_layers:
  - system/iam
  - system/org
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/SYSTEM_AUTH_CONTRACT.md
updated_at: 2026-11-03
---

# Task Packet: 2026-11-03-audit-p2-route-groups-unify

## Goal

消除 `system_modules.go` 中 14 处手写重复的中间件链（`ARCH-01`）。全部由 `TokenAuth + PlatformScopeTenantContext + Casbin + (DataScope|PlatformCapability) + RefreshSync` 组合，仅 3 种差异。仓库已有 `pkg/contracts/route_groups.go` 助手但系统域 0 调用。统一后每处路由只声明意图（平台能力 / 数据范围 / 无），链的组装收敛到一处，防「漏挂中间件即静默权限差异」。

## Priority

`medium`

## Estimated Complexity

`moderate`

## Primary Layer

platform

## Dependency Layers

- `system/iam`（用户/角色/权限/菜单的 521 链）
- `system/auth`（RefreshSync 行为）

## Dependencies

- blockedBy: `none`
- blocks: `none`

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `architecture-fitness`
- Portable Failure Class: `middleware-chain-drift`
- Owner Layer: `foundation-source`
- Ratchet Decision: `gate-updated`
- Coverage Dimensions:
  - architecture-fitness
  - behaviour

交付层级：**L2**（触碰全部系统域路由，权限语义是攻击面，必须带路由快照/结构断言兜底）。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`（ops 消费 base 的 `internal/middleware`，链面变化需声明 `internal/*` 为事实契约）
- Sync Expectation: deferred
- Release Requirement: foundation-release
- Downstream Sync Note: ops 直接 import base 的 `internal/middleware`（上轮审计 AUD-015 已登记）；本包不改任何 middleware 实现，只改 system_modules.go 的组装方式，ops 无接口面变化。

## Contract Anchors

- `docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-11-03.md` §11（ARCH-01）
- `docs/contracts/SYSTEM_AUTH_CONTRACT.md`（中间件顺序约束）
- `docs/contracts/TENANT_CONTRACT_V1.md` §2.6（业务域不参与租户隔离——`route_groups.go:12-25` 注释已声明边界）
- `backend/pkg/contracts/route_groups.go`

## Scope

### In

- 在 `pkg/contracts/route_groups.go` 补齐系统域三种组合：
  1. `SysDataScopedGroup`（TokenAuth + PlatformScopeTenantContext + Casbin + DataScope + RefreshSync）
  2. `SysPlatformScopedGroup`（TokenAuth + PlatformScopeTenantContext + Casbin + PlatformCapability + RefreshSync）
  3. 无 RefreshSync / 无 DataScope 的对应变体（对照 14 处的实际差异）
- `system_modules.go` 14 处链改走新助手（`162,163,188,209,238,288,321,346,375,419,430,435,471,513`），每处注释声明「该组为什么用这个组合」
- 路由结构断言测试（如 `route_groups_test.go` 扩展或新增 `system_routes_snapshot_test.go`）：钉住每条系统域路由的中间件链 = 期望组合，防未来漂移

### Out

- 修改 `internal/middleware/*` 任何中间件实现
- 改变任何路由的中间件组合语义（现有 14 处必须行为等价）
- 改业务域路由（`modules/business/*` 不参与本包）
- 触碰 `pantheon-ops`、`VERSION`、`CHANGELOG.md`

## Structural Scope

### Scope Quantification

- Modules affected: 1（system 域路由装配）
- Files: 约 4（route_groups.go、system_modules.go、测试、evidence）
- API endpoints: 139 条路由的中间件语义——**零行为变化**是本包的硬约束
- Database migrations: no

### Risk Nodes

1. 收敛时不慎改变某组的链（漏 DataScope 或 PlatformCapability）→ 静默权限差异 - Mitigation: 逐组对照原链写结构断言，断言先行
2. 手写链与助手并存时两套漂移 - Mitigation: 结构断言验证全部 139 条系统域路由都走新助手路径或显式列出例外
3. `RefreshSync` 是否有/无的差异被抹平 - Mitigation: 严格按 14 处实际原文分类，不统一「应该有」

### Legacy Fields (for compatibility)

- Affected Subgraph: `system_modules.go 路由注册 -> pkg/contracts/route_groups.go -> internal/middleware 链`
- Boundary Crossings: `platform -> system/*（路由装配）` | `system/* -> pkg/contracts`
- Risk Nodes: `system_modules.go` | `PlatformCapabilityMiddleware` 挂接点 | `route_groups.go`
- Graph Focus: `route-wiring`

## Expected Files

### Create

- `backend/pkg/contracts/route_groups_test.go`（扩展：钉住三种组合的链形状）

### Modify

- `backend/pkg/contracts/route_groups.go`（新增三种组合助手）
- `backend/modules/system/system_modules.go`（14 处换助手）
- `backend/pkg/database/route_snapshot_test.go` 或等价（路由→中间件组合断言）
- `.harness/evidence/2026-11-03-audit-p2-route-groups-unify/{commands.json,summary.md,review.md}`

### Do Not Touch

- `backend/internal/middleware/**`
- `backend/modules/business/**`
- `backend/modules/auth/**`
- `docs/contracts/TENANT_CONTRACT_V1.md`（§2.6 语义不变）
- `pantheon-ops/**`、`VERSION`、`CHANGELOG.md`

## Implementation Notes

- 先读 14 处原文**逐行分类**（三类组合 + 例外），把分类表写进 evidence；分类先行，改码在后。
- 新增助手签名保持现有 `route_groups.go` 的风格（`ProtectedGroup`/`DataScopedGroup` 的显式 `db`/`rdb` 参数），不引入配置对象。
- 结构断言：遍历 `system_modules.go` 注册结果，对每条路由断言其中间件链（按函数指针/顺序）匹配期望组合；测试失败即「链漂移」。
- 不改变任何 `SecureActionMiddleware` / `LegacyDeprecationMiddleware` 等附加中间件的挂接位置——14 处之外的单点中间件保持原样。
- ops 消费 base `internal/middleware` 的事实契约：本包不改 middleware 包，无需 ops 同步；在 evidence 中声明这一点。

## Minimum Viable Approach

- Selected Rung: `reuse`（复用现有 `route_groups.go` 助手模式，只新增 3 个组合函数）
- Why This Is Enough: 问题本质是组装方式漂移，不是缺抽象——收口到现有助手文件即可
- Upgrade Trigger: 若未来系统域路由超过 100 条且出现第 4 种组合，再评估「注册时声明式 metadata」方案

## Success Criteria

- Behaviour Outcome: 139 条系统域路由的中间件语义与改动前逐条等价；全部走助手或显式例外
- Verification Signal: 结构断言测试全绿；`go build ./... && go vet ./... && go test -short ./...` 全绿；逐组对照表（14 处前/后链）在 evidence 可复核
- Regression Watch: Casbin / DataScope / RefreshSync 顺序不变；平台能力组依旧只含 288/471
- Economics Watch: `none`

## Context Strategy

- Entry Sources: 审计报告 §11（ARCH-01）、`system_modules.go`、`route_groups.go`
- Retrieval Order: `entry -> summary -> raw`
- Retrieval Helpers: `codegraph`（`PlatformScopeTenantContextMiddleware` 调用点、`RefreshSyncMiddleware` 调用点）
- Promotion Target: `none`
- Response Budget: `terse`
- Sensitive Context: `none`

## Execution Roles

- Implementer Posture: 先产出 14 处分类表再动手；分类表与代码 diff 同入 evidence，确保 reviewer 能逐行对照
- Reviewer Posture: 对照原始 14 处链逐个确认新助手等价；确认测试真能「删一个 DataScope 就红」；确认 RefreshSync 差异不被抹平

## Stop Points

- 若发现某处链与其 13 处差异无法归入 3 类组合（出现未知中间件），停下登记为未知组合，交 maintainer 判定，不暗中覆盖

## Technical Debt

- technicalDebtFlag: `yes`
- technicalDebtNote: 收敛减少「手写链漂移」债；代价是一次大 diff（触全部系统域路由），用结构断言钉住，不产生新债

## Rollback Plan

**Required for destructive changes.**

- Trigger Condition: 任何一条路由出现非等价中间件链（测试红或线上权限异常）
- Rollback Steps:
  1. `git revert <commit-hash>`
  2. 重新跑路由快照断言确认回到基线
- Rollback Verification:
  - [ ] Functionality verified
  - [ ] Data integrity verified
  - [ ] No side effects observed

## State Plan

- Checkpoint Expectation: 14 处分类表 + 断言测试先成，改动后跑全量 test
- Resume Artifacts: `.harness/evidence/2026-11-03-audit-p2-route-groups-unify/summary.md`

## Verification Plan

### Backend

- `cd backend && go build ./... && go vet ./... && gofmt -l modules/system/ pkg/contracts/`
- `cd backend && go test ./... -short`（46/46 包，重点系统域与 contracts）

### Frontend

- 不涉及

### Browser / Smoke

- none（无浏览器环境；以结构断言 + 全量单测为 evidence）

## Linkage

- Task ID: `2026-11-03-audit-p2-route-groups-unify`
- Task Manifest: `.harness/tasks/2026-11-03-audit-p2-route-groups-unify/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Plan References: `docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-11-03.md` §11（ARCH-01）
- Evidence Directory: `.harness/evidence/2026-11-03-audit-p2-route-groups-unify/`
- Review File: `.harness/evidence/2026-11-03-audit-p2-route-groups-unify/review.md`

## Evidence Required

- `commands.json`：build/vet/test-short 读数 + 结构断言读数
- `summary.md`：14 处前/后链逐行对照表 + 3 类组合判定表 + 未知组合登记（如有）
- `review.md`：逐条 reviewer posture；「删一个 DataScope 就让测试红」的负向证据

## Human Gates

- 触碰全部系统域路由属 L2 门禁面：需非作者 Reviewer 对照 14 处链逐一确认行为等价。
- 若出现第 4 类未知组合，交维护者判定（不静默处理）。

## Completion Checklist

- [ ] Layer and boundary declared
- [ ] Contract anchors read
- [ ] Verification run or exception recorded
- [ ] Evidence saved or summarized
- [ ] Review completed
- [ ] 14 处链全部有分类并走新助手 / 显式例外
- [ ] 结构断言能独立打红（负向验证过）
- [ ] 139 条路由中间件语义零变化
- [ ] middleware 包 / 业务域 / 合同零改动
- [ ] ops 无接口面变化声明已记录