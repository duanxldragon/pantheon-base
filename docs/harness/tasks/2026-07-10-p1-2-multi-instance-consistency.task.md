# Task Packet: P1-2 多实例一致性（Casbin Watcher + 会话缓存）

> 1.0 里程碑第 3 项。依据 [IMPROVEMENT_ROADMAP.md](../../../IMPROVEMENT_ROADMAP.md) P1-2、[PANTHEON_BASE_1_0_MILESTONE.md](../PANTHEON_BASE_1_0_MILESTONE.md)。
> 状态：**待 Human Gate 确认部署形态。** 前置：P1-1 完成。

## Goal

让水平扩展下多副本的 Casbin 策略与会话状态保持一致，消除多实例登出窗口与策略不同步。

## Primary Layer

system/auth

## Dependency Layers

- system/iam（casbin 策略）

## Harness Profile

- Template: admin-platform
- Overlay: pantheon-base
- Quality Profile: auth-security
- Portable Failure Class: runtime-evidence-gap
- Owner Layer: consumer-repository
- Coverage Dimensions:
  - behaviour
  - runtime-quality
  - architecture-fitness

## Contract Anchors

- `AGENTS.md`
- `docs/contracts/SYSTEM_AUTH_CONTRACT.md`
- `backend/pkg/database/casbin.go`
- `backend/internal/middleware/token_middleware.go`

## Scope

### In

- `casbin.go` 引入 Casbin Redis Watcher（复用现有 Redis）；策略写入后广播其他实例 `LoadPolicy`。
- `token_middleware.go` 会话缓存改为可关闭 / 缩 TTL（多实例下禁用内存缓存或缩短 TTL），或依赖已实现的黑名单强制下线路径覆盖强吊销。
- **启用 runtime-evidence gate**（见 [OPTIONAL_GATES.md](../OPTIONAL_GATES.md)）。

### Out

- 单实例默认行为不变（默认不启用 Watcher，保持现状）。
- 不引入新的外部服务（复用现有 Redis）。

## Structural Scope

- Affected Subgraph: `casbin enforcer 初始化 -> Redis Watcher -> 多实例 LoadPolicy`
- Boundary Crossings: none
- Risk Nodes: casbin enforcer 初始化 · token middleware 缓存
- Graph Focus: sensitive-input-flow（策略写 -> 多实例 reload；登出 -> 多实例失效）

## Expected Files

### Create

- none

### Modify

- `backend/pkg/database/casbin.go`
- `backend/internal/middleware/token_middleware.go`
- 相关配置（Watcher 开关、缓存 TTL 环境变量）

### Do Not Touch

- 单实例默认路径的既有行为
- 黑名单强制下线基建（复用）

## Implementation Notes

- runtime-sensitive（多实例一致性），必须给 runtime evidence。
- 先应用最小复杂度阶梯：复用现有 Redis，不引入新外部服务；默认关闭 Watcher 保持单实例现状。

## Method Readiness

- Consumer-Specific Controls: pantheon-base auth 合同 · casbin 初始化
- Required Sensors: command · runtime evidence · review
- Required Evidence: command summary · runtime evidence（多实例同步）· review summary
- Minimal Complexity Rung: installed-dependency
- Ratchet Decision: no-repeat-observed
- Deferred Code Issues: none

## Delivery Governance

- Design Gate: SYSTEM_AUTH_CONTRACT · IMPROVEMENT_ROADMAP P1-2
- Development Gate: expected files declared · do-not-touch declared
- QA Acceptance Gate: command · runtime
- GitHub Governance Gate: runtime-evidence-gate

## Execution Roles

- Implementer Posture: implementer
- Reviewer Posture: security

## Stop Points（Human Gate）

**开工前必须由 Human Owner 确认（BLOCKING）：**

1. **部署形态**：近期是否确实要水平扩展？1.0 是要"多实例就绪但默认单实例"，还是默认开启多实例一致性？
2. Watcher / 缓存开关的默认值（默认关=保持单实例现状，多实例部署时显式开启）？
3. 会话缓存策略：多实例下"禁用内存缓存"vs"缩短 TTL"，取哪个？

## State Plan

- Checkpoint Expectation: none
- Resume Artifacts: `.harness/evidence/2026-07-10-p1-2-multi-instance-consistency/`

## Verification Plan

### Backend

- `go test ./backend/pkg/database/... ./backend/internal/middleware/...`。

### Frontend

- none

### Browser / Smoke

- none

### Runtime Evidence

- **本项必须**：实例 A 写策略 -> 实例 B `LoadPolicy` 生效的日志/验证；登出后多实例失效窗口验证；单实例默认配置回归。

## Linkage

- Task ID: `2026-07-10-p1-2-multi-instance-consistency`
- Task Manifest: `.harness/tasks/2026-07-10-p1-2-multi-instance-consistency/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Evidence Directory: `.harness/evidence/2026-07-10-p1-2-multi-instance-consistency/`
- Review File: `.harness/evidence/2026-07-10-p1-2-multi-instance-consistency/review.md`

## Evidence Required

- command result summary（go test）
- runtime evidence（多实例策略同步 + 登出失效）
- review summary（security + runtime）

## Human Gates

- 架构/部署形态变更 = high-risk → **必须 human gate**（见 Stop Points）。

## Sync expectation

- 仅修改 pantheon-base。
- 多实例一致性能力若下沉为共享底座，记录"后续需 base -> ops 同步"。

## Completion Checklist

- [ ] Layer and boundary declared
- [ ] Quality profile or explicit `none` declared
- [ ] Ratchet decision declared for repeated failures
- [ ] Delivery governance gates declared
- [ ] Contract anchors read
- [ ] 部署形态经 Human Owner 确认
- [ ] Verification run or exception recorded
- [ ] Evidence saved or summarized
- [ ] Review completed
