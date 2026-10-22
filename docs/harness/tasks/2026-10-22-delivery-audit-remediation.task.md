---
title: 交付审计整改任务包（Release Gate Sonar 债 + 租户生命周期契约 + 跨租户错误整形 + 消费侧文档）
doc_type: Remediation
layer: platform
depends_on_layers:
  - system/iam
status: Active
linked_contracts:
  - docs/contracts/TENANT_CONTRACT_V1.md
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/SYSTEM_IAM_CONTRACT.md
updated_at: 2026-10-22
---

# Task Packet: 2026-10-22-delivery-audit-remediation

## Goal

2026-10-22 的独立交付验收（基线 `main 92b94474` / 发布 `v0.17.0 → 728feb2b`）判定为
**PASS WITH CONDITIONS**：无 P0、主干无未解决 P1，但留下四类债。本包把它们一次收口：

1. **Release Gate 红灯**：`#407` 引入 8 条 SonarCloud 未处理问题（`go:S1192`×2、`go:S3776`×1、
   `typescript:S3776`×1、`typescript:S6759`×3、`typescript:S6582`×1），`Release Gate` 在主干失败，
   无法从主干切任何发布。
2. **租户生命周期契约未落实**：`RemoveMember` 不保护最后一个 owner（合同 §2.2）；
   `UpdateTenant` 允许 `archived → active`（合同 §2.1 声明 archived 终态）。
3. **跨租户错误整形**：租户读/写他租户用户（by id）返回 500 而非 404/403（合同 §5 要求
   不区分“不存在”与“他租户”）；`role.key.reserved` 返回信封 500 而非 400。
4. **消费侧文档漂移**：README/README.en 与 CHANGELOG 链接仍写 v0.16.1；`TENANT_API` 文档描述
   未挂载的 `/api/v1/tenants*`；scope 矩阵仍称“当前运行态是单租户”；部署指南 0 处 `tenant_mode`；
   `STATUS` 的“无 P0–P3 残留”与主干门禁红灯矛盾；两个 2026-10-12 任务包停在 `in-progress`。

## Primary Layer

platform

改动集中在 `system/iam`（租户生命周期、用户错误整形、角色冲突映射）与平台文档；前端只做三条
Sonar 规则的机械整改，不改变 UI 行为。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `required`
- Release Requirement: `foundation-release`
- Downstream Sync Note: 文档与发布说明变化需要 `pantheon-ops` 在锁推进时知悉；不改消费侧接口。

## Dependency Layers

- `system/iam`：`tenant_provision.go`、`tenant_service.go`、`user_service.go`、`role_handler.go`。
- `platform`：前端 `core/layout`、`core/entitlements`、`store/useTenantSessionStore.ts` 的规则整改。
- 文档层：`README(.en).md`、`CHANGELOG.md`、`docs/api`、`docs/designs`、`docs/DEPLOYMENT_GUIDE.md`、
  `.harness/STATUS.md`、`.harness/tasks/2026-10-12-*`。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `permission-policy`
- Portable Failure Class: `gate-debt-blocks-release` / `contract-invariant-unenforced` /
  `error-shape-disagrees-with-contract` / `consumer-doc-drift`
- Owner Layer: `consumer-repository`
- Ratchet Decision: `checker-tightened`
- Coverage Dimensions:
  - behaviour
  - maintainability
  - architecture-fitness

## Contract Anchors

- `docs/contracts/TENANT_CONTRACT_V1.md` §2.1（状态流转）、§2.2（至少一个 owner）、§5（错误码语义）。
- `docs/contracts/SYSTEM_IAM_CONTRACT.md`：角色键命名空间与错误整形。
- `docs/contracts/PLATFORM_CONTRACT.md`：平台能力面与文档职责。
- `AGENTS.md`：验证后才能声称完成；改动共享合同/系统域升到 L2。

## Scope

### In

- `backend/modules/system/iam/tenant/tenant_provision.go`：两处重复字面量提取常量；拆解
  `repairTenantPlatformGrants` 的认知复杂度。
- `backend/modules/system/iam/tenant/tenant_service.go`：最后 owner 保护、archived 终态校验。
- `backend/modules/system/iam/user/user_service.go`：按 id 读写他租户/不存在用户统一 404。
- `backend/modules/system/iam/role/role_handler.go`：冲突走 `common.CodeForError`。
- 前端四处 Sonar 整改（readonly props、复杂度、可选链）。
- 文档：README zh/en、CHANGELOG、TENANT_API、scope 矩阵 zh/en、DEPLOYMENT_GUIDE、STATUS。
- 关闭两个 stale `in-progress` 任务包（附既有证据引用）。
- v0.17.1 版本与发布说明准备（**不** tag、**不** 上传资产）。

### Out

- 发布动作本身（tag/release/资产替换）、已发布 v0.17.0 资产的任何修改。
- Casbin 模型、权限判定语义、`PlatformCapabilityMiddleware` 规则、迁移链与 schema。
- CI required checks、门禁阈值、workflow 结构调整。
- 审计登记的冻结后事项：并发 provisioning（B7）、Redis fail-open（A5）、审计表索引（C5）、
  ja/ko/fr 翻译覆盖（E4）。

## Expected Files

### Create

- `docs/harness/tasks/2026-10-22-delivery-audit-remediation.task.md`
- `docs/reviews/PANTHEON_BASE_DELIVERY_REMEDIATION_2026-10-22.md`
- `RELEASE_NOTES_v0.17.1.md`
- `.harness/evidence/2026-10-22-delivery-audit-remediation/`（`summary.md` / `review.md` / `commands.json`）

### Modify

- `backend/modules/system/iam/tenant/{tenant_provision.go,tenant_service.go,tenant_service_test.go}`
- `backend/modules/system/iam/user/{user_service.go,user_error_test.go}`
- `backend/modules/system/iam/role/role_handler.go`
- `frontend/src/core/entitlements/PlanFeatureGuard.tsx`
- `frontend/src/core/layout/useLayoutMenu.tsx`
- `frontend/src/modules/system/iam/tenant/TenantPlanMatrix.tsx`
- `frontend/src/store/useTenantSessionStore.ts`
- `README.md` / `README.en.md` / `CHANGELOG.md` / `VERSION`
- `docs/api/TENANT_API.md`
- `docs/designs/TENANT_RESOURCE_SCOPE_MATRIX.md` / `.en.md`
- `docs/DEPLOYMENT_GUIDE.md`
- `.harness/STATUS.md`
- `.harness/tasks/2026-10-12-flake-signal-remediation/manifest.json`
- `.harness/tasks/2026-10-12-foundation-release-asset-gate/manifest.json`

### Do Not Touch

- `backend/pkg/database/migrations/**`、`backend/pkg/database/casbin*.go`
- `backend/internal/middleware/platform_capability_middleware.go`
- `.github/workflows/**`
- `dist/**`、已发布的 v0.17.0 release 资产

## Implementation Notes

- 重复字面量用命名常量（`sqlSelectMenuIdentity`、`condTenantScopedRows`）替换，SQL 文本不变。
- `repairTenantPlatformGrants` 拆成“收集平台专用菜单 id（含按钮子行）”“删除菜单授权”“删除权限键授权”
  三个私有函数，语义与事务边界不变，只为把认知复杂度降到 15 以下。
- 最后 owner 保护放在 `RemoveMember` 删除前：统计该租户 `role='owner' AND status='active'`，
  仅当删除目标是最后一位 owner 时返回 `tenant.member.last_owner`。
- 状态流转用纯函数 `tenantStatusTransitionAllowed(previous, next)`，`UpdateTenant` 调用，
  不触碰既有 `statusChangeRequiresSessionRevocation`。
- 用户 not-found：service 用 `common.NewNotFound` 包装 gorm 的 RecordNotFound，handler 走
  `common.CodeForError`，从而“他租户 id”与“不存在 id”都得到 404。
- 前端三条规则是纯机械整改，不新增逻辑分支：`Readonly<Props>`、可选链、能力过滤的前置短路提取。

## Verification Plan

- `cd backend && go build ./... && go vet ./...`
- `cd backend && PANTHEON_TEST_DSN=<real mysql> PANTHEON_TEST_DSN_REQUIRED=true go test ./...`
- `cd backend && go test -count=1 ./modules/system/iam/tenant/ ./modules/system/iam/user/ ./modules/system/iam/role/`
- `cd frontend && ./node_modules/.bin/tsc -b`
- `cd frontend && ./node_modules/.bin/eslint .`
- `cd frontend && ./node_modules/.bin/vitest run`
- `cd frontend && node scripts/{check-menu-contract,check-i18n-hardcode,check-ui-contract,…}.mjs`（prebuild 12 项）
- `cd frontend && ./node_modules/.bin/vite build`
- `node scripts/harness/check-task-packet.mjs --root .`
- `node scripts/frontmatter-check.mjs`
- `node scripts/check-duplication.mjs`
- Sonar 八条规则的本地复核：重复字面量计数、组件 props 修饰、可选链、复杂度人工复核（Sonar 本身需 CI）。

## Linkage

- Task ID: `2026-10-22-delivery-audit-remediation`
- Task Manifest: `.harness/tasks/2026-10-22-delivery-audit-remediation/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/contracts/TENANT_CONTRACT_V1.md`、`docs/reviews/PANTHEON_BASE_ISSUES_AND_REMEDIATION_2026-10-21.md`
- Evidence Directory: `.harness/evidence/2026-10-22-delivery-audit-remediation/`
- Review File: `.harness/evidence/2026-10-22-delivery-audit-remediation/review.md`

## Evidence Required

- 后端 `go build`/`go vet`/全量 `go test`（真实 MySQL+Redis，0 skip）输出。
- 新增单测的真实 MySQL 运行结果（最后 owner、archived 终态、跨租户 404、角色冲突码）。
- 前端 tsc/ESLint/vitest/prebuild/Vite build 结果。
- `check-task-packet`、`frontmatter-check`、`check-duplication` 结果。
- Sonar 八条的整改对照表（规则 → 位置 → 整改方式 → 本地复核方式）。
- 环境限制声明（本机 `-race` 不可跑；Sonar 判定最终由 CI 给出）。

## Human Gates

- 维护者最终验收（文档口径与版本号）。
- 发布动作（tag/release 资产）按仓库治理单独确认。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
