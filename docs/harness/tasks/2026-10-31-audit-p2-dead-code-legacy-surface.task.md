---
title: 死代码、死表与 legacy 认证端点收口（AUD-012/013/014/020）
doc_type: Remediation
layer: platform
status: Archived
depends_on_layers: []
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/SYSTEM_AUTH_CONTRACT.md
updated_at: 2026-10-31
---

# Task Packet: 2026-10-31-audit-p2-dead-code-legacy-surface

## Goal

清理四类“看起来在用、实际没人用”的表面：前端两个零消费 hook、`scaffold.Generate` 空实现、
仅测试调用的 `readRoleKeysFromContext`、与 `system_role_data_scope` 重复且无人读写的
`permission_role_data_scope_policy` 表，以及两套并存的认证自助入口。

**核心风险不是“删错”，而是“只在本仓检索就删”**——v0.18.0→v0.18.1 的
`isForbiddenRequestError` 事故（FR-021）就是同一失败模式：本仓零引用、下游仍在用，结果
`pantheon-ops` 前端构建红在 `TS2614`。因此本包把 **workspace 级消费引用检索**作为每一项删除的
前置证据，而不是事后补救。

## Primary Layer

platform

## Dependency Layers

- `platform`（`pkg` / `internal` 死代码、迁移、认证路由）
- `inheritance-sync`（前端导出面属消费者可见契约，删除需 workspace 级检索 + 一次 release）

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: required
- Release Requirement: foundation-release
- Downstream Sync Note: 前端 `hooks/index.ts` 的再导出属公共 API；删除前必须在
  `pantheon-ops/frontend/src` 做符号检索，并在 release 后确认 ops 前端构建通过。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `dead-code-removal`
- Portable Failure Class: `unused-surface`
- Owner Layer: `foundation-source`
- Ratchet Decision: `guide-updated`
- Coverage Dimensions:
  - maintainability
  - architecture-fitness
  - runtime-quality

交付层级：**L2**（涉及公共导出面与一条 schema 迁移）。

## Contract Anchors

- `docs/contracts/PLATFORM_CONTRACT.md`：公共 API 变更与下游同步要求。
- `docs/contracts/SYSTEM_AUTH_CONTRACT.md`：认证端点清单与弃用规则。
- `docs/harness/AI_QUALITY_GOVERNANCE.md`：§5.4 规定“删除共享导出前必须做 workspace 级消费引用检索”。

## Scope

### In

- **AUD-012a**：删除 `frontend/src/hooks/{usePagination,useRequest}.ts` 及 `hooks/index.ts:15-18`
  的 4 行再导出。前置证据：base `frontend/src` 零 import + **ops `frontend/src` 零 import** +
  `components/index.ts` 未再导出它们。
- **AUD-012b**：删除 `backend/internal/scaffold/engine.go` 的 `Generate()`（`capitalize` 随之失效）。
  前置证据：`grep -rn "scaffold.Generate"` 仅命中定义本身。**依赖 W1 已解除**（W1 已执行，
  生成器可编译、有闸门），可删除；但注意 `engine.go` 与 `backendGenerator.ts` 是同一件事的两份实现，
  删除时确认没有模板仍引用它的输出形态。
- **新增（W1 执行中发现）**：全仓扫 `switch err.Error()` 这类**恒不命中**的错误分类分支。
  W1 在 `dynamic_module_handler.go` 修掉 3 处——`common.NewBadRequest(key)` 的 `Error()` 带
  `bad_request: ` 前缀，与裸 i18n 键永不相等，于是分支从未命中、错误被当成 500 返回。
  这类分支不会报错、不会被测试发现，只会让用户看到"服务器错误"。判据：`switch` 的 case 是
  裸键（`a.b.c` 形态）而表达式是 `err.Error()`。
- **AUD-020**：删除 `internal/middleware/casbin_middleware.go:128-130` 的 `readRoleKeysFromContext`，
  测试改用 `common.GetRoleKeys`。
- **AUD-013**：新增迁移 `000031_drop_permission_role_data_scope_policy`（含 down），
  同时删除 `role_service.go:600-603` 的防御性清理与 `dashboard_service.go:348` 的白名单项。
  **不得改写 `000001`**。前置证据：表内无业务数据（或已确认可丢弃），并给出数据核对读数。
- **AUD-014**：legacy 认证端点（`/system/login|refresh|logout|user/info`）二选一——
  (a) 保留但在响应头与文档标注 `Deprecated` + 定下线日期；(b) 直接下线并同步移除
  `csrf_middleware.go:22-26` 的两条 legacy 豁免。
- 每项删除都要在 evidence 留下**检索命令与输出**，不只是结论。

### Out

- **删除 `pkg/security/ssrf`**：base 内 0 引用，但 `pantheon-ops` 有 5 处引用（argocd / k8s /
  observability），属 D 类为下游保留的能力。**本包明确不处理，且不接受“零引用所以删”的论证。**
- 删除 `pkg/ratelimit` 或三个零调用预设——它们与 `middleware.RateLimiter` 的分工需要单独评估，
  不在本包。
- 修改 `backend/modules/business/**` 或 ops 代码。
- 重构 `DataScopeMiddleware` 或数据权限模型。
- 清理 `permission_role_data_scope_policy` 之外的历史表。

## Expected Files

### Create

- `docs/harness/tasks/2026-10-31-audit-p2-dead-code-legacy-surface.task.md`
- `.harness/tasks/2026-10-31-audit-p2-dead-code-legacy-surface/manifest.json`
- `backend/pkg/database/migrations/000031_drop_permission_role_data_scope_policy.{up,down}.sql`
- `.harness/evidence/2026-10-31-audit-p2-dead-code-legacy-surface/{commands.json,summary.md,review.md}`

### Modify

- `frontend/src/hooks/index.ts`
- `backend/internal/scaffold/engine.go`（删除或整文件移除）
- `backend/internal/middleware/casbin_middleware.go`
- `backend/internal/middleware/casbin_middleware_test.go`
- `backend/modules/system/iam/role/role_service.go`
- `backend/modules/platform/dashboard_service.go`
- `backend/modules/auth/module.go`（仅 AUD-014 选 b 时）
- `backend/internal/middleware/csrf_middleware.go`（仅 AUD-014 选 b 时）

### Do Not Touch

- `backend/pkg/security/ssrf/**`
- `backend/pkg/contracts/**`
- `backend/modules/business/**`
- `backend/pkg/database/migrations/000001_*`（禁止改写历史迁移）
- `pantheon-ops/**`
- `VERSION`、`CHANGELOG.md`

## Implementation Notes

- 删除顺序：先检索、再删除、最后跑构建。检索范围必须是 **base 全仓（含测试/脚本/文档）+
  ops 前后端**，只搜 base 会重演 FR-021。
- 前端两个 hook 的风险最高：它们在 `hooks/index.ts` 里是具名再导出，下游可能按名导入。
  若 ops 有引用，改为“先标注 `@deprecated` + 一个 release 后再删”，不要硬删。
- 死表删除必须走新迁移：`000001` 已进入版本链，改写会让已部署环境与新环境产生结构分叉。
  down 迁移只重建表结构，不承诺恢复数据——在 summary.md 里写清这一点。
- legacy 认证端点属对外 API 面：直接下线会让任何仍在用 `/system/login` 的集成方中断。
  默认倾向 (a) 保留 + 标弃用 + 定日期，除非维护者确认无外部集成。
- 删除 `readRoleKeysFromContext` 时不要顺手改 `common.GetRoleKeys` 的语义，只替换调用。

## Verification Plan

- `grep -rn "usePagination\|useRequest" frontend/src ../pantheon-ops/frontend/src`（删除前必须为空）
- `grep -rn "scaffold.Generate" backend`
- `grep -rn "readRoleKeysFromContext" backend`
- `cd backend && go build ./... && go vet ./...`
- `cd backend && go test -short ./internal/middleware/... ./modules/system/iam/role/... ./modules/platform/...`
- `cd frontend && npx tsc -b`
- `npm run build`（前端导出面变更后必须跑一次完整构建）
- 迁移：`go run ./cmd/migrate` 或等价入口，确认 000031 up/down 可往返
- `node scripts/harness/check-evidence.mjs --root . --strict`

## Linkage

- Task ID: `2026-10-31-audit-p2-dead-code-legacy-surface`
- Task Manifest: `.harness/tasks/2026-10-31-audit-p2-dead-code-legacy-surface/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-10-31.md` §4.1/§4.2、`docs/harness/AI_QUALITY_GOVERNANCE.md §5.4`
- Evidence Directory: `.harness/evidence/2026-10-31-audit-p2-dead-code-legacy-surface/`
- Review File: `.harness/evidence/2026-10-31-audit-p2-dead-code-legacy-surface/review.md`

## Evidence Required

- `commands.json`：每一项的 workspace 级检索命令与输出（含 ops 侧）、构建/测试读数、迁移往返读数
- `summary.md`：为什么 `ssrf` 不删、死表 down 迁移的数据承诺边界、legacy 端点选 a 还是 b
- `review.md`：逐条 reviewer posture

## Human Gates

- legacy 认证端点下线属对外承诺变更，必须维护者确认无外部集成方。
- 删除前端公共导出需一次 foundation release 并在 ops 构建通过后才算验证完成（FR-021）。
- 死表 drop 不可逆，需确认数据可丢弃并留一份导出。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] 每一项删除都有 base + ops 双侧检索证据
- [x] `pkg/security/ssrf` 未被删除且原因已记录
- [x] 000031 迁移 up/down 可往返，历史迁移未被改写
- [x] legacy 端点的处置有明确决策（保留 + Deprecated + 2026-12-31 下线）

## Execution Result

**状态：completed（2026-10-31 执行，2026-11-01 收口复核）。**
证据：`.harness/evidence/2026-10-31-audit-p2-dead-code-legacy-surface/`。

### 删除与决策

| 条目 | 处置 | 检索证据 |
| --- | --- | --- |
| AUD-012a | 删 `frontend/src/hooks/{usePagination,useRequest}.ts` 与 `hooks/index.ts` 的 4 行再导出 | base `frontend/src` 0 命中；ops 的 6 行命中全是 ops 自有副本，不 import base |
| AUD-012b | 删 `internal/scaffold/engine.go`（`Generate` + `capitalize`）；scaffold 包保留 | `scaffold.Generate(` 精确匹配 0 命中 |
| AUD-020 | 删 `readRoleKeysFromContext`，测试改用 `common.GetRoleKeys` | 0 命中 |
| AUD-013 | 新增 `000031_drop_permission_role_data_scope_policy`；删 `role_service.go` 防御性清理与 `dashboard_service.go` 白名单占位 | Go 侧零功能性引用 |
| AUD-014 | **保留 + Deprecated + `Sunset: 2026-12-31`**（未直接下线） | `LegacyDeprecationMiddleware` 挂在 `/system` 与 `/system/*`；CSRF 两条豁免与现存路由一一对应 |

### 收口复核发现并修复的缺陷（P2）

初版 `000031.down` 在重建 v30 表时，把 000024 **已经删除**的
`idx_permission_role_data_scope_policy_role_key (role_key)` 一并建了回来，
使 `role_key` 重新变成全局唯一——回滚到 v30 后两个租户不能再用同一个 `role_key`。
初版以“up/down/up 三步 exit 0”为判据，掩盖了它：往返成功不代表重建形状正确。

- 取证：`SHOW CREATE TABLE` 逐字节对比「空库直接迁到 30」与「迁到 31 再回滚到 30」，不等。
- 修复：down 只重建 v30 真实形状（仅 `uk_...tenant`），文件头写明为什么不重建那条索引。
- 机械锁：新增 `TestDropPolicyTableDownReconstructsVersion30Shape`，并在缺陷版本上跑过一次
  确认它报 FAIL；`TestMigrationChainRollsBackAndReapplies` 复跑仍 PASS。

### 未闭合（human gate，不属本包可自行关闭）

1. legacy 端点真正下线（移除四条路由 + 两条 CSRF 豁免）需维护者确认无外部集成方，定于 2026-12-31。
2. 死表 drop 不可逆：生产执行前需确认数据可丢弃并留一份导出；本地 testmysql 往返≠生产验证。
3. ops 仓自有 `usePagination`/`useRequest` 副本按 doNotTouch 不在本包处理。
