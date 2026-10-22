---
title: 租户菜单边界、登录审计归属与前台套餐差异化任务包
doc_type: Remediation
layer: platform
depends_on_layers:
  - system/auth
  - system/iam
status: Active
linked_contracts:
  - docs/contracts/TENANT_CONTRACT_V1.md
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/SYSTEM_AUTH_CONTRACT.md
  - docs/contracts/SYSTEM_IAM_CONTRACT.md
updated_at: 2026-10-22
---

# Task Packet: 2026-10-22-tenant-entitlements-and-audit

## Goal

修复维护者人工验收提出的三类问题，并把结论落到代码、回归测试与可复核证据：

1. **租户会话仍看到平台专用菜单**：租户管理员登录后侧栏出现「租户管理」等平台页面，点开即 403。
   期望：菜单、路由、按钮三层都不向租户展示平台专用面；越权访问只得到明确的拒绝页。
2. **安全审计登录日志为空**：租户管理员打开「登录日志」无数据。期望：登录成功/失败、MFA 校验
   与安全事件按会话实际归属的租户落库，租户审计视图可见自己的记录；compat 仍落平台 0。
3. **套餐版本没有功能差异**：新建租户可选免费版/基础版/专业版/旗舰版，但四个版本功能完全相同。
   期望：差异由前台统一注册表驱动（模块给路由/组件打 feature 标签，shell 过滤菜单、路由与
   dashboard 组件，租户表单展示对照矩阵），后端不按套餐初始化或写死控制台功能。
   后端既有 `tenants.plan` 数据与配额映射保持不变。

## Primary Layer

platform

本包横跨平台 shell（菜单/路由/组件过滤）、`system/iam`（菜单读取、角色授权、租户 provisioning）、
`system/auth`（登录审计归属）与前端低代码模块（feature 标签）。判定权仍在既有契约：平台专用面由
`PlatformCapabilityMiddleware` 拒绝，套餐只做前台呈现层差异化，不替代角色权限。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `deferred`
- Release Requirement: `foundation-release`
- Downstream Sync Note: `pantheon-ops` 新增模块时只需在自身路由/组件上声明 `feature`，不复制本包的注册表；foundation release 交付后由 ops 侧按继承流程同步。

## Dependency Layers

- `platform`：`backend/pkg/tenant/platform_scope.go` 的平台专用面分类；前端 `core/entitlements` 注册表与 shell 过滤。
- `system/iam`：菜单导航/管理树过滤、角色授权可分配性校验、租户 provisioning 与存量授权修复。
- `system/auth`：登录日志与安全事件的租户归属；MFA challenge 租户钉定；权限缓存中的平台键清理。
- 前端 `modules/lowcode/*`：为模块管理、生成器、外部数据源声明 feature；租户表单套餐矩阵。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `permission-policy`
- Portable Failure Class: `menu-surface-leaks-platform-capability` / `audit-scope-mismatch` / `entitlement-enforced-in-seed-data`
- Owner Layer: `consumer-repository`
- Ratchet Decision: `sensor-added`
- Coverage Dimensions:
  - behaviour
  - architecture-fitness
  - runtime-quality

## Contract Anchors

- `docs/contracts/TENANT_CONTRACT_V1.md`：租户上下文、平台管理面与租户控制台的边界。
- `docs/contracts/PLATFORM_CONTRACT.md`：平台能力判定与菜单/路由授权分层。
- `docs/contracts/SYSTEM_AUTH_CONTRACT.md`：登录审计与会话归属。
- `docs/contracts/SYSTEM_IAM_CONTRACT.md`：角色授权、菜单树与租户 provisioning。
- `AGENTS.md`：验证后方可声称完成；共享合同变更升到 L2。

## Scope

### In

- `backend/pkg/tenant/platform_scope.go`：平台专用菜单/权限键的单一分类。
- `backend/modules/system/iam/menu/*`：租户会话的导航树与管理树过滤。
- `backend/modules/system/iam/tenant/tenant_provision.go` + `tenant_service.go`：初始化与重跑时剔除平台绑定，
  启动时幂等修复存量租户授权。
- `backend/modules/system/iam/role/role_helper.go`：租户角色拒绝平台专用菜单/权限键。
- `backend/modules/auth/login/*` + `mfa/*`：登录成功/失败、MFA、安全事件的租户归属；权限缓存清理平台键。
- `frontend/src/core/entitlements/*`：套餐注册表、会话套餐 hook、路由升级页。
- `frontend/src/core/layout/*` + `App.tsx` + `modules/platform/*`：菜单、路由、dashboard 组件按 feature 过滤；
  已打开标签与命令面板按套餐 entitlement + 路由权限派生过滤。
- `frontend/src/store/useTenantSessionStore.ts`：租户/套餐会话上下文，登录获取、登出与登录边界重置。
- `frontend/src/modules/lowcode/*`：模块管理/生成器/外部数据源 feature 标签与前台锁定态。
- `frontend/src/modules/system/iam/tenant/*`：租户新建/编辑表单的套餐功能对照矩阵。
- i18n 五语言资源、单元测试、验收与任务证据。

### Out

- 不改 Casbin 模型、角色/权限判定或后端授权边界；套餐门禁只是 UX，不是授权。
- 不按套餐初始化菜单、角色或权限，不在后端 seed/迁移里写死版本功能。
- 不新增租户自定义套餐编辑、计费、用量统计或订阅生命周期。
- 不对生产数据执行修改；存量租户授权修复在应用启动时幂等执行，仅删除平台专用键。
- 不包含维护者验收动作本身。

## Expected Files

### Create

- `backend/pkg/tenant/platform_scope.go`
- `backend/modules/auth/login/login_tenant_audit.go`
- `backend/modules/auth/login/login_log_tenant_attribution_test.go`
- `frontend/src/core/entitlements/{plans.ts,usePlanEntitlements.ts,PlanFeatureGuard.tsx}`
- `frontend/src/core/layout/layoutTabs.ts`
- `frontend/src/store/useTenantSessionStore.ts`
- `frontend/src/modules/system/iam/tenant/TenantPlanMatrix.{tsx,css}`
- `frontend/tests/unit/core/entitlements/plans.test.ts`
- `frontend/tests/unit/core/layout/useLayoutMenu.test.tsx`
- `frontend/tests/unit/core/layout/layoutTabs.test.ts`
- `frontend/tests/unit/store/useTenantSessionStore.test.ts`
- `docs/reviews/PANTHEON_BASE_TENANT_PLAN_AND_AUDIT_FIXES_2026-10-22.md`
- `.harness/tasks/2026-10-22-tenant-plan-entitlements-and-audit/manifest.json`
- `.harness/evidence/2026-10-22-tenant-plan-entitlements-and-audit/`

### Modify

- `backend/modules/system/iam/menu/{menu_service.go,menu_handler.go,menu_service_test.go}`
- `backend/modules/system/iam/tenant/{tenant_provision.go,tenant_service.go,tenant_provision_menus_test.go}`
- `backend/modules/system/iam/role/{role_helper.go,role_service_test.go,role_menu_tenant_test.go}`
- `backend/modules/auth/login/{login_handler.go,login_runtime.go,login_service.go}`
- `backend/modules/auth/mfa/mfa_service.go`
- `frontend/src/{App.tsx,core/layout/AppLayout.tsx,core/layout/useLayoutMenu.tsx,core/router/types.ts}`
- `frontend/src/modules/auth/login/components/Login.tsx`（登录边界重置租户会话）
- `frontend/src/modules/auth/tenant/usePlatformScope.ts`
- `frontend/src/modules/lowcode/{dynamicmodule,generator}/index.ts`
- `frontend/src/modules/lowcode/generator/pages/ModuleWizard.tsx`
- `frontend/src/modules/platform/{Dashboard.tsx,widgets.tsx}`
- `frontend/src/modules/system/iam/tenant/TenantList.tsx`
- `frontend/src/i18n/resources/*.ts`（zh-CN/en-US/ja-JP/ko-KR/fr-FR）
- `frontend/tests/unit/modules/platform/widgets.test.ts`
- `docs/README.md`、`.harness/STATUS.md`

### Do Not Touch

- Casbin model、domain subject 格式、`PlatformCapabilityMiddleware` 的判定规则。
- 迁移链与数据库 schema。
- 生产环境配置、真实租户数据、已发布的 release 资产。
- CI workflow 的 required checks 与门禁阈值。

## Implementation Notes

- 平台专用面只有一个分类源：`pkg/tenant/platform_scope.go`；菜单读取、provisioning、角色授权、
  权限缓存四处共用，避免边界漂移。前端重复一份只用于渲染兜底，注释标明镜像关系。
- 套餐差异只存在于 `frontend/src/core/entitlements/plans.ts`：feature key → 最低套餐。模块通过
  `feature` 声明，shell 统一过滤；未知 feature 与未知套餐分别 fail-open / fail-closed。
- 登录审计的租户归属来自会话实际签发的 tenant claim；失败登录在已知主体时归属主体租户；
  compat 模式保持 0，避免写入 compat 管理员读不到的行。
- 存量租户通过启动时 `RepairTenantPlatformGrants()` 幂等收敛；不重写历史、不触碰平台命名空间。
- 已打开标签不再在 effect 里同步改写 state：标签栏与命令面板都从 `selectAccessibleTabs(openedTabs, isPathAccessible)` 派生，
  `isPathAccessible` 同时检查套餐 entitlement 与路由 `pagePermission`，避免套餐上下文解析前记录的标签残留。

## Verification Plan

- `cd backend && PATH="/d/msys64/mingw64/bin:/d/nodejs:$PATH" CGO_ENABLED=1 CC='D:\msys64\mingw64\bin\gcc.exe' go test -race -p 1 -count=1 ./...`（真实 MySQL + Redis）
- `cd backend && go test -count=1 ./modules/auth/login/ ./modules/system/iam/menu/ ./modules/system/iam/tenant/ ./modules/system/iam/role/`
- `cd frontend && node ./node_modules/vitest/vitest.mjs run`
- `cd frontend && node ./node_modules/typescript/bin/tsc -b`
- `cd frontend && node ./node_modules/eslint/bin/eslint.js .`
- `cd frontend && npm run build`
- `node scripts/frontmatter-check.mjs`
- `node scripts/harness/check-task-packet.mjs --root .`
- 浏览器级四套餐验收：真实租户创建/登录，菜单、直连路由、登录日志、生成器数据源锁定态、平台创建矩阵，截图与 JSON 归档。
- 标签专项探针：免费租户直连 `/system/tenant`（403）与 `/system/generator`（升级页），断言标签栏不保留对应标签。

## Linkage

- Task ID: `2026-10-22-tenant-plan-entitlements-and-audit`
- Task Manifest: `.harness/tasks/2026-10-22-tenant-plan-entitlements-and-audit/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/reviews/PANTHEON_BASE_FINAL_ACCEPTANCE_REVIEW_2026-10-21.md`
- Evidence Directory: `.harness/evidence/2026-10-22-tenant-plan-entitlements-and-audit/`
- Review File: `.harness/evidence/2026-10-22-tenant-plan-entitlements-and-audit/review.md`

## Evidence Required

- 真实 MySQL/Redis 下的 Go 测试输出（含 `-race` 串行全量）。
- 前端单测、type-check、ESLint、prebuild 13 步（Arco patch + 12 项 contract）、Vite build、i18n 五语言对齐结果。
- 四套餐浏览器验收 JSON 与截图：菜单快照、403 兜底、登录日志行数、套餐升级页、数据源锁定态、创建矩阵。
- 标签探针 JSON 与截图：403 页与升级页均不进入已打开标签栏。
- 明确记录环境限制与残留 gap（套餐门禁为 UX、CGO/mingw 工作区限制）。

## Human Gates

- 维护者最终视觉/功能验收（已由维护者提出三项问题并提供判定口径）。
- 发布动作（tag/release/PR 推送）按仓库治理单独确认。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
