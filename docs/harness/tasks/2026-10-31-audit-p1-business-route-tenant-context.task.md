---
title: 业务域租户语义必须显式化并与合同、README 对齐（AUD-002）
doc_type: Remediation
layer: platform
status: Archived
depends_on_layers: []
linked_contracts:
  - docs/contracts/TENANT_CONTRACT_V1.md
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-10-31
---

# Task Packet: 2026-10-31-audit-p1-business-route-tenant-context

## Goal

审计 AUD-002。这里有两层事实，**必须分开看**，否则会把设计缺口误判成安全漏洞：

**第一层（机制成立）**：`backend/pkg/contracts/route_groups.go:15-28` 的
`ProtectedGroup` / `DataScopedGroup` 只挂 `TokenAuthMiddleware` + `CasbinMiddleware`
（+ 可选 `DataScopeMiddleware`），**没有**租户上下文中间件；`pkg/tenant` 的 `FromGin`
在无上下文时返回 nil、`WithTenantScope(nil)` 原样放行查询。这两个 helper 是业务模块的官方
入口，base 内 0 处使用，`pantheon-ops` 有 **14 处**调用（13 处 `DataScopedGroup` + 1 处 `ProtectedGroup`）。因此通过它们注册的业务路由在 multi
模式下既不解析租户、也不按 `TENANT_CONTRACT_V1 §3.2` 拒绝请求。

**第二层（后果被夸大，必须更正）**：业务域**根本没有租户建模**——
`internal/scaffold/contract.go:74` 明确写着 `"tenant" is intentionally rejected: tenant
isolation has no runtime implementation`；生成器产出不含 `tenant_id`；
`pantheon-ops/backend/modules/business` 全目录 `tenant_id`/`TenantID` 命中 **0**。
所以**不存在“按行跨租户读写”**，业务表里没有可越权的租户列。

**真实缺口**是口径分裂：代码是单租户语义、`TENANT_CONTRACT_V1` 要求拒绝无上下文请求、
`README.md:31` 宣称“完整数据隔离”、`DESIGN.md` 又写多租户“未来实现”。四处互相矛盾且
无人声明，下一位维护者或 Agent 必然得出错误结论。

本包先定决策，再让四处一致。

## Primary Layer

platform

## Dependency Layers

- `platform`（`pkg/contracts` 路由助手 + 其测试）
- `system/iam`（租户上下文中间件与 `pkg/tenant` 语义，仅复用不改语义）
- `inheritance-sync`（ops 14 处调用点随 foundation release 同步，deferred）

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: deferred
- Release Requirement: foundation-release
- Downstream Sync Note: 方案 B（删除 helper）会打断 ops 构建直到同批升级；方案 A 需一次 release；
  方案 C 不改代码语义、只需 ops 侧确认无 tenant 假设。三种时点均归维护者。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `tenant-contract`
- Portable Failure Class: `contract-bypass`
- Owner Layer: `foundation-source`
- Ratchet Decision: `gate-updated`
- Coverage Dimensions:
  - behaviour
  - architecture-fitness
  - runtime-quality

交付层级：**L2**（租户合同 + 消费者可见公共 API）。

## Contract Anchors

- `docs/contracts/TENANT_CONTRACT_V1.md`：§3.2 传播规则、§3.3 数据访问不变量、§3.4 平台作用域声明。
- `docs/contracts/PLATFORM_CONTRACT.md`：公共 API 变更与同步要求。
- `docs/designs/MODULE_CONTRACT.md`：业务模块的注册与路由约定。
- `docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-10-31.md`：§2.3 的完整取证。

## Scope

### In

- **决策记录（本包第一产出）**：业务域在 v1 内是否参与租户隔离，三选一并写明被否方案的代价：
  - **A**：helper 内部挂 `PlatformScopeTenantContextMiddleware`（或调用方显式选择的严格变体）；
  - **B**：删除这两个 helper，业务模块显式声明作用域，同步 `MODULE_CONTRACT` 与生成器模板；
  - **C**：在 `TENANT_CONTRACT_V1` 增补“业务域不参与租户隔离”的显式条款，helper 注释与
    `MODULE_CONTRACT` 同步改写，README/DESIGN 口径随之一致。
- 按决策改代码：A/B 改 `route_groups.go`（+ 必要时生成器模板）；C 只改注释与合同条款。
- 新增 `backend/pkg/contracts/route_groups_test.go`：断言所选方案在 compat 与 multi 双模式下的行为。
- 修正 `route_groups.go` 的注释——它现在读起来像“已经处理了租户”，这是误导的直接来源。

### Out

- 修改 `pkg/tenant.Resolve` 的解析优先级或 deny-by-default 语义。
- 为业务域补租户列/迁移：本包默认不承担。**若维护者选 A/B 且要求真实隔离，需单独立项**，
  因为“挂中间件但不加租户列”只会把静默问题变成显式故障。
- 在 ops 仓内改代码（由 ops 按同步要求单独执行）。
- 在 base 内为 ops 加特殊分支。
- 平台作用域清单的增删（`TENANT_CONTRACT_V1 §3.4` 已冻结）。
- README / DESIGN 的具体改写：由 `2026-10-31-audit-p1-entry-doc-truthfulness` 负责，
  本包只提供结论，避免两包重复改同一段。

## Expected Files

### Create

- `docs/harness/tasks/2026-10-31-audit-p1-business-route-tenant-context.task.md`
- `.harness/tasks/2026-10-31-audit-p1-business-route-tenant-context/manifest.json`
- `backend/pkg/contracts/route_groups_test.go`
- `.harness/evidence/2026-10-31-audit-p1-business-route-tenant-context/{commands.json,summary.md,review.md}`

### Modify

- `backend/pkg/contracts/route_groups.go`
- `docs/contracts/TENANT_CONTRACT_V1.md`（增补或修订业务域条款）
- `docs/designs/MODULE_CONTRACT.md`（业务路由作用域声明）

### Do Not Touch

- `backend/pkg/tenant/tenant.go`（解析与 scope 语义冻结）
- `backend/internal/middleware/tenant_context_middleware.go`（复用，不改）
- `backend/modules/system/**` 的既有路由组（不迁移，避免一次改动两套入口）
- `backend/pkg/database/migrations/**`（本包不新增租户列）
- `pantheon-ops/**`

## Implementation Notes

- 这是**决策包**，不是纯修复包。先写决策记录（含被否方案与理由），再动代码。没有决策就挂中间件，
  会把“单租户语义”变成半吊子隔离，比现状更危险。
- 选 A/B 必须同时回答“业务表没有 `tenant_id` 怎么办”。只挂中间件不加租户列，结果是 multi 模式下
  业务路由拒绝一切请求或全落 tenant 0——静默问题变成显式故障，但故障本身仍不是隔离。
- 选 C 成本最低且诚实：明确写“业务域在 v1 内不参与租户隔离”，保留未来纳入的路径说明。
  这也是审计倾向的方案——它把已有的实现事实写进合同，而不是让合同继续描述一个不存在的实现。
- helper 注释必须改：现状让读者以为租户已处理，这是本条缺陷最容易被继承的部分。
- 测试要覆盖 compat 与 multi 双模式：compat 下不能因为改动打断现有单租户流程。
- 不要顺手把 `DataScopeMiddleware` 的 fail-closed 行为改成放行。

## Verification Plan

- `cd backend && go test -short ./pkg/contracts/...`
- `cd backend && go test -short ./internal/middleware/...`（回归租户中间件既有测试）
- `cd backend && go build ./...`
- 负向：未声明作用域的业务路由 + multi + 无 claim → 行为与决策一致（拒绝，或按 C 落 tenant 0）
- 正向：compat 模式下业务路由行为不变
- 若方案 A/B：`pantheon-ops` 分支上 `go build ./...` 通过（编译失败即为预期的显式信号）
- `node scripts/harness/check-evidence.mjs --root . --strict`

## Linkage

- Task ID: `2026-10-31-audit-p1-business-route-tenant-context`
- Task Manifest: `.harness/tasks/2026-10-31-audit-p1-business-route-tenant-context/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/contracts/TENANT_CONTRACT_V1.md`、`docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-10-31.md`
- Evidence Directory: `.harness/evidence/2026-10-31-audit-p1-business-route-tenant-context/`
- Review File: `.harness/evidence/2026-10-31-audit-p1-business-route-tenant-context/review.md`

## Evidence Required

- `commands.json`：决策记录、`go test` 读数、双模式路由行为读数、ops 构建读数（若方案 A/B）
- `summary.md`：为什么“零租户建模 + 宣称完整隔离”比“没有隔离”更危险；A/B/C 三方案代价对比
- `review.md`：逐条 reviewer posture

## Human Gates

- A/B/C 选择归维护者：A/B 改变对外能力承诺并需双仓同批，C 缩小 README 的承诺范围。
- 若选 A/B 且要求真实隔离（补租户列），需另立迁移任务并走 foundation release 评审。
- 本包不自行修改 ops 仓库，也不在 base 内为 ops 保留特殊分支。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] 决策记录落盘，且 `TENANT_CONTRACT_V1` 有对应条款
- [x] 代码、合同、README 三处租户口径一致
- [x] 不再存在“读起来像已处理租户、实际未处理”的注释或文档

## Execution Result（2026-10-31·已执行）

**决策：方案 C**（维护者拍板）。业务域在 V1 内不参与租户隔离，写成合同条款并统一三处口径。运行行为零变化。

| 项 | 结果 |
|---|---|
| 合同 | `TENANT_CONTRACT_V1.md` 新增 §2.6（第 296 行）、§1 Out 登记、§7 表格改「V1 不适用」、§9 追加 V1.10（Clarification）；EN 版四处同步 + 翻译注记 |
| 代码 | `route_groups.go` 三个导出函数补文档注释（明确「不挂租户中间件是合同要求」及错误修法的后果）；新增 `route_groups_test.go` 两个结构断言 |
| 门禁 | 测试负向验证通过：注入 `TenantContextMiddleware` → FAIL（`chain length = 3, want 2`）→ 还原 → PASS |
| 文档 | `MODULE_CONTRACT.md` §10 新增两条；`README.md:31` 整行改写（租户隔离 + 配额强制两处失实一次改完） |
| 数字更正 | 下游调用点 **25 → 14**（13 × `DataScopedGroup` + 1 × `ProtectedGroup`）；业务域 `TenantID` 命中 0、`tenant_id` 仅 1 处测试夹具 |

证据：`.harness/evidence/2026-10-31-audit-p1-business-route-tenant-context/`（`decision.md` / `commands.json` / `summary.md` / `review.md`）。
