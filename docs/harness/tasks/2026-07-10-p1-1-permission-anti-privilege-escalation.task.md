# Task Packet: P1-1 权限管理 API 防自提权纵深校验

> 1.0 里程碑第 2 项。依据 [IMPROVEMENT_ROADMAP.md](../../../IMPROVEMENT_ROADMAP.md) P1-1、[PANTHEON_BASE_1_0_MILESTONE.md](../PANTHEON_BASE_1_0_MILESTONE.md)。
> 状态：**待 Human Gate 确认权限模型行为变更方案。** 前置：P1-3 完成。

## Goal

在权限/角色写 API 注入操作者纵深校验，堵住"普通角色被误授管理端策略即可提权到近似 admin"的安全短板。

## Primary Layer

system/iam

## Dependency Layers

- system/auth（SecureActionMiddleware）

## Harness Profile

- Template: admin-platform
- Overlay: pantheon-base
- Quality Profile: auth-security
- Portable Failure Class: security-boundary-gap
- Owner Layer: consumer-repository
- Coverage Dimensions:
  - behaviour
  - architecture-fitness
  - runtime-quality

## Contract Anchors

- `AGENTS.md`
- `docs/contracts/SYSTEM_IAM_CONTRACT.md`
- `docs/designs/PERMISSION_MODEL.md`
- `backend/modules/system/iam/permission/permission_service.go`
- `backend/modules/system/iam/role/role_service.go`

## Scope

### In

- 写路径（CreatePolicy/UpdatePolicy/DeletePolicy、角色授权）注入操作者 roleKeys 上下文。
- 校验规则：**非 admin 操作者不得授予超出自身已有策略集的接口权限**。
- 高敏授权动作（授予他人管理端策略）强制走 `SecureActionMiddleware`。
- 前端权限页接入二次验证弹窗（已有基建）。
- 新增 `permission_service_test.go`：低权角色尝试提权应被拒。

### Out

- admin 通配路径不变（恒满足）。
- 默认 seed 角色行为不变。
- 不重构权限模型整体结构。

## Structural Scope

- Affected Subgraph: `权限写 handler -> permission/role service -> casbin 策略写`
- Boundary Crossings: none（system/iam 内闭环）
- Risk Nodes: permission service · role service · secure-action middleware
- Graph Focus: sensitive-input-flow（操作者身份 -> 授权决策）

## Expected Files

### Create

- `backend/modules/system/iam/permission/permission_service_test.go`

### Modify

- `backend/modules/system/iam/permission/permission_service.go`
- `backend/modules/system/iam/role/role_service.go`
- 前端权限页组件（二次验证弹窗接入，Codex 探索定位）

### Do Not Touch

- admin 通配逻辑
- `secure_action_middleware.go` 基建本体（复用，不改）

## Implementation Notes

- 权限鉴权路径，禁止用简化削弱校验。
- 先应用最小复杂度阶梯：复用已存在的 SecureActionMiddleware 与二次验证前端基建。

## Method Readiness

- Consumer-Specific Controls: pantheon-base 权限合同 · casbin 策略
- Required Sensors: command · review · runtime evidence
- Required Evidence: command summary · screenshot · runtime evidence · review summary
- Minimal Complexity Rung: reuse
- Ratchet Decision: no-repeat-observed
- Deferred Code Issues: none

## Delivery Governance

- Design Gate: PERMISSION_MODEL.md · IMPROVEMENT_ROADMAP P1-1
- Development Gate: expected files declared · do-not-touch declared
- QA Acceptance Gate: command · human review
- GitHub Governance Gate: repo-quality-gate

## Execution Roles

- Implementer Posture: implementer
- Reviewer Posture: security

## Stop Points（Human Gate）

**开工前必须由 Human Owner 确认（BLOCKING）：**

1. **校验语义确认**："非 admin 不得授予超出自身策略集的接口权限"是否为期望行为？是否需要更细的分级（如允许授予子集、禁止授予 `/system/permission*`、`/system/role*` 写策略）？
2. 是否对所有非 admin 授权动作都强制二次验证，还是仅对"授予管理端策略"这类高敏动作？
3. 现网是否已有非 admin 角色持有管理端写策略（若有，本变更会改变其行为，需迁移说明）？

## State Plan

- Checkpoint Expectation: none
- Resume Artifacts: `.harness/evidence/2026-07-10-p1-1-permission-anti-privilege-escalation/`

## Verification Plan

### Backend

- `go test ./backend/modules/system/iam/...`；新增越权拒绝用例必须通过。

### Frontend

- `tsc -b` + `vite build`；权限页二次验证弹窗渲染证据（gstack 截图）。

### Browser / Smoke

- 权限页二次验证流程 smoke（如涉及）。

### Runtime Evidence

- 低权角色尝试提权被拒的日志/响应样本。

## Linkage

- Task ID: `2026-07-10-p1-1-permission-anti-privilege-escalation`
- Task Manifest: `.harness/tasks/2026-07-10-p1-1-permission-anti-privilege-escalation/manifest.json`
- OpenSpec Change: none
- Plan References: none
- Evidence Directory: `.harness/evidence/2026-07-10-p1-1-permission-anti-privilege-escalation/`
- Review File: `.harness/evidence/2026-07-10-p1-1-permission-anti-privilege-escalation/review.md`

## Evidence Required

- command result summary（go test 越权拒绝用例）
- screenshots（前端二次验证弹窗）
- runtime logs（提权被拒样本）
- review summary（security）

## Human Gates

- 权限模型行为变更 = high-risk permission → **必须 human gate**（见 Stop Points）。

## Sync expectation

- 仅修改 pantheon-base。
- 若校验逻辑成为共享底座能力，记录"后续需 base -> ops 同步"。

## Completion Checklist

- [ ] Layer and boundary declared
- [ ] Quality profile or explicit `none` declared
- [ ] Ratchet decision declared for repeated failures
- [ ] Delivery governance gates declared
- [ ] Contract anchors read
- [ ] 校验语义经 Human Owner 确认
- [ ] Verification run or exception recorded
- [ ] Evidence saved or summarized
- [ ] Review completed
