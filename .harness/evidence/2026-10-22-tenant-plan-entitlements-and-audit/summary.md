# 2026-10-22 — 租户菜单边界、登录审计归属、前台套餐差异化

**Status**: completed
**Scope**: 维护者人工验收提出的三类问题（平台专用菜单泄漏、租户登录日志为空、套餐版本无差异）
**Baseline**: main `aef57e30`
**Plan gate**: 前台呈现层差异化；后端角色权限仍是授权边界
**Verification**: 后端真实 MySQL/Redis `-race` 串行全量通过；前端 30 文件 / 214 用例通过；四套餐浏览器验收在登录重置与标签修复后重跑通过

## 1. 问题与修复

### A. 平台专用菜单泄漏（P1）

- **现象**：新建租户管理员登录后侧栏出现「租户管理」等平台页面，点开报错。
- **根因**：租户 provisioning 逐字复制平台管理员的菜单与权限绑定，租户管理员因此持有
  `system.tenant` 菜单与 `system:i18n` / `system:menu:write` 权限键；导航树读取不区分租户作用域；
  这些页面的路由组由 `PlatformCapabilityMiddleware` 拒绝，于是菜单可见、页面 403。
- **修复**：
  - `backend/pkg/tenant/platform_scope.go`：平台专用菜单（module `system.tenant`，path `/system/tenant`、
    `/system/menu`、`/system/i18n`）与权限键（`system:tenant:*`、`system:i18n:*`、菜单写键）唯一分类；
    `system:menu:list` 保留可分配，租户角色管理仍需读取管理树。
  - `menu_service.go`：导航树与管理树在租户作用域过滤平台专用行。
  - `tenant_provision.go`：首次初始化与重跑都剔除平台绑定；`Bootstrap()` 启动时幂等修复存量租户授权，
    只删除 `tenant_id <> 0` 的行。
  - `role_helper.go`：租户自有角色拒绝平台专用菜单/权限键，API 直连无法重建已过滤的入口。
  - `login_runtime.go`：权限缓存命中时若包含平台键，先按用户归属租户判断再过滤并回写；
    权限查询本身也对租户用户过滤。
  - 前端 `useLayoutMenu.tsx` + `AppLayout.tsx`：按租户会话再次过滤平台专用项（镜像后端分类，
    兜底网关/过期缓存返回的树）；`usePlatformScope` 改读共享的租户会话 store，消除重复请求与视图不一致。
  - **A3 标签栏残留（P3，已修复）**：标签层新增 `isPathAccessible`，同时检查套餐 entitlement 与路由
    `pagePermission`；不满足的路径不记入已打开标签/命令面板，套餐解析前临时记录的标签在解析后
    自动从派生列表消失。浏览器探针在免费租户上直连 `/system/tenant` 与 `/system/generator`，
    标签栏均只有「工作台」。

### B. 租户登录日志为空（P1）

- **现象**：租户管理员打开「安全审计 / 登录日志」无数据。
- **根因**：登录日志与安全事件按请求上下文写入，租户登录请求解析前是平台 0；租户管理员按
  `WithTenantScope(tenant)` 读取，自然查不到。MFA 失败在会话签发前也会丢失 challenge 所属租户。
- **修复**：
  - 成功登录：按实际签发的 tenant claim 写入。
  - 失败登录：按已知主体的归属租户写入（`tenantAttributionError` 携带且不改变错误文本）。
  - MFA：加载 challenge 后把请求钉到 challenge 的租户，校验码失败也落在正确租户；
    调用方显式选择的租户仍参与 gate 校验。
  - 安全事件：主体租户优先；无主体时才回退请求上下文。
  - compat：审计行保持平台 0，compat 管理员仍可读（有回归测试）。
- **附带**：`useTenantSessionStore` 统一 `/auth/tenants/current` 结果，登录后 fetch、登出 reset。
  收尾审查发现同一标签页重新登录会复用上一个主体的租户/套餐上下文，已让 `Login.tsx` 在登录边界
  调用 `resetTenantSession()`，并新增 3 个 store 单测覆盖请求去重、重置后重载与作用域判定。

### C. 套餐版本无功能差异（P1）

- **现象**：免费版 / 基础版 / 专业版 / 旗舰版创建出的租户控制台完全相同。
- **维护者口径**：差异应由前台界面完成，不得靠后台数据初始化或写死。
- **修复**：
  - 新增 `frontend/src/core/entitlements/plans.ts`：套餐层级与 `PLAN_FEATURES`
    （`lowcode.dynamic-module` → basic、`lowcode.generator` → professional、
    `lowcode.generator.datasource` → enterprise）。未知套餐归一为 free；未知 feature fail-open。
  - 模块在自身的路由与 dashboard widget 上声明 `feature`，不复制套餐表：
    dynamic module 打 `lowcode.dynamic-module`，generator 打 `lowcode.generator`。
  - shell：菜单树、dashboard 快捷入口/领域卡片按 feature 过滤；直接访问被锁路由渲染升级页
    （`PlanFeatureGuard`）；平台作用域与 compat 不启用套餐门禁。
  - 生成器：低于旗舰版时数据源选择器只显示当前数据源，管理按钮禁用并显示锁定标签；
    后端数据源权限仍必须满足。
  - 租户新建/编辑弹窗展示只读「套餐功能对照」矩阵（3 个功能 × 4 个套餐，当前列高亮），
    套餐值仍只提交 `tenants.plan` 字符串。
  - 五语言新增 16 个 key；i18n 审计 2929 key、五语言缺失 0。

## 2. 代码位置

| 边界 | 文件 | 关键行 |
|---|---|---|
| 平台面分类 | `backend/pkg/tenant/platform_scope.go` | 31 / 50 / 68 / 83 |
| 菜单树过滤 | `backend/modules/system/iam/menu/menu_service.go` | 34 / 73 / 237 / 245 |
| provision 修复 | `backend/modules/system/iam/tenant/tenant_provision.go` | 131 / 272 / 490 / 540 |
| 启动修复接线 | `backend/modules/system/iam/tenant/tenant_service.go` | 505 |
| 角色可分配性 | `backend/modules/system/iam/role/role_helper.go` | 255 / 288 |
| 登录审计归属 | `backend/modules/auth/login/login_handler.go` | 180 / 196 / 256 |
| 审计租户解析 | `backend/modules/auth/login/login_tenant_audit.go` | 46 / 58 |
| 权限缓存清理 | `backend/modules/auth/login/login_runtime.go` | 223 / 644 / 683 |
| MFA 租户钉定 | `backend/modules/auth/mfa/mfa_service.go` | 163 / 173 |
| 套餐注册表 | `frontend/src/core/entitlements/plans.ts` | 37 / 70 / 90 |
| 会话套餐 hook | `frontend/src/core/entitlements/usePlanEntitlements.ts` | 34 |
| 路由升级页 | `frontend/src/core/entitlements/PlanFeatureGuard.tsx` | 59 |
| 菜单过滤 | `frontend/src/core/layout/useLayoutMenu.tsx` | 169 / 202 / 212 |
| 标签可达性判定 | `frontend/src/core/layout/AppLayout.tsx` | 1039 / 1046 / 1262 / 1529 |
| 标签可达性选择器 | `frontend/src/core/layout/layoutTabs.ts` | 77 |
| 租户会话 store | `frontend/src/store/useTenantSessionStore.ts` | 22 / 62 |
| 登录边界重置 | `frontend/src/modules/auth/login/components/Login.tsx` | 248 |
| 会话 store 单测 | `frontend/tests/unit/store/useTenantSessionStore.test.ts` | 25 / 39 / 59 |
| 租户表单矩阵 | `frontend/src/modules/system/iam/tenant/TenantList.tsx` | 164 / 794 |
| 矩阵组件 | `frontend/src/modules/system/iam/tenant/TenantPlanMatrix.tsx` | 21 |
| 数据源锁定 | `frontend/src/modules/lowcode/generator/pages/ModuleWizard.tsx` | 760 / 1460 |

## 3. 验证命令与结果

| 命令 | 结果 |
|---|---|
| `cd backend && PATH="/d/msys64/mingw64/bin:/d/nodejs:$PATH" CGO_ENABLED=1 CC='D:\msys64\mingw64\bin\gcc.exe' go test -race -p 1 -count=1 ./...`（`.env.test` 注入 MySQL/Redis，`PANTHEON_TEST_DSN` 指向真实库） | exit 0；46 个包 ok；无 FAIL、无 data race |
| `cd frontend && node ./node_modules/vitest/vitest.mjs run` | 30 文件 / 214 用例通过（含本轮新增 6 个套餐单测、2 个菜单回归、1 个 widget 门禁用例、3 个会话 store 用例、2 个标签可达性用例） |
| `cd frontend && node ./node_modules/typescript/bin/tsc -b` | exit 0 |
| `cd frontend && node ./node_modules/eslint/bin/eslint.js .` | exit 0 |
| `cd frontend && npm run build` | prebuild 13 步（Arco patch + 12 项 contract）+ Vite build 通过 |
| i18n 审计 | 2929 key，zh-CN/en-US/ja-JP/ko-KR/fr-FR 缺失 0 |
| `node scripts/frontmatter-check.mjs` | 340 文档，通过 |
| `node scripts/harness/check-task-packet.mjs --root .` | 本包 PASS |

## 4. 浏览器级四套餐验收

环境：本机 multi 模式，真实 MySQL + Redis，`go run ./cmd/server` + Vite `127.0.0.1:5173`，
Chromium headless（Playwright 1440×900）。脚本 `acceptance.mjs`、`tenant-setup.mjs`、
`tenant-enterprise.mjs` 与原始结果 `acceptance-result.json` 均在本目录。归档脚本已做凭证清理：
口令只从 `ACCEPT_ADMIN_PASSWORD` / `ACCEPT_TENANT_PASSWORD` 读取，缺失即报错；执行时的口令
来自本地临时环境变量，未写入仓库。

| 套餐 | 侧栏平台专用项 | 直连 `/system/tenant` | 登录日志 | 低代码入口 | 数据源管理 |
|---|---|---|---|---|---|
| free (300) | 无 | 403 页，无租户数据 | 8 行 | 无入口；两路由均升级页 | 未暴露 |
| basic (301) | 无 | 403 页，无租户数据 | 7 行 | 模块管理可见；生成器升级页 | 未暴露 |
| professional (302) | 无 | 403 页，无租户数据 | 9 行 | 模块管理 + 生成器可见 | 锁定标签 + 按钮禁用 |
| enterprise (303) | 无 | 403 页，无租户数据 | 7 行 | 模块管理 + 生成器可见 | 无锁定标签；按钮可用 |
| 平台管理员 | 租户/菜单/国际化管理均可见 | 可进入 | — | 全部可见 | 可用 |

平台管理员新建租户弹窗渲染「套餐功能对照」：3 个功能行、4 个套餐列、当前套餐标签。
截图见 `artifacts/`（`menu-*.png`、`tenant-page-free.png`、`login-log-basic.png`、
`generator-page-free.png`、`generator-datasource-professional.png`、
`generator-datasource-enterprise.png`、`tenant-create-matrix.png`）。

本轮在登录边界重置改动之后重跑了同一套四套餐验收（`acceptance-result.json` 已刷新，登录行数
随验收次数增加）。随后用 `tab-residual.mjs` 做标签栏专项探针：免费租户直连 `/system/tenant`
得到 403、标签栏保持 `["工作台"]`（`tenantTabLeaked=false`）；直连 `/system/generator` 得到升级页、
标签栏仍为 `["工作台"]`（`generatorTabLeaked=false`）。原始结果 `tab-residual-result.json`，
截图 `tab-residual-tenant.png`、`tab-residual-generator.png`。

## 5. 环境限制与显式 gap

- 本机 Windows 下 `go test -race` 需要 CGO + mingw GCC；未把 GCC 放入 PATH 时 Go runtime 的
  `cc1.exe` 会静默失败。上述命令显式指定 PATH 与 `CC`，不是默认 shell 可直接复现的。
- 全量 `-race` 并行运行曾出现 Redis 状态竞争与 generator 环境变量相关的假失败；本轮采用 `-p 1`
  串行运行，结果为 0 FAIL。CI 的并行 `-race` leg 仍以 hosted 结果为准。
- 浏览器验收使用 Playwright（Node）直接驱动；本会话的 browser-use MCP 快照工具被策略拦截，
  因此交互证据来自 Playwright 脚本与截图，不是 MCP 记录。四套餐验收与标签探针均在登录边界
  重置、标签可达性修复之后重跑，已无“改动晚于浏览器验收”的 gap。
- 前端 `npm run build` 的 prebuild 会递归调用 `npm`；本机 cmd.exe 找不到 npm，若 PATH 未显式包含
  `/d/nodejs` 会失败。本轮实际命令为 `PATH="/d/nodejs:$PATH" npm run build`，已通过；同一组
  prebuild 步骤也用 `node` 直接逐条执行并确认通过。
- **原 A3（P3，外观）已关闭**：被套餐锁定或缺少路由权限的页面不再进入已打开标签栏；403 页面、
  无数据请求成功的原有安全属性不变。
- **套餐门禁是 UX**：隐藏菜单/升级页不授予或撤销权限；绕过前端直接调用后端仍由角色权限与
  `PlatformCapabilityMiddleware` 决定。这是刻意设计，不是未完成项。
- 未对生产数据做修改；存量租户授权修复在应用启动时执行，只删除租户命名空间内的平台专用键。

## 6. 结论

三类问题均已在真实运行环境中复现、修复并回归：租户会话不再看到平台专用菜单且直连得 403；
租户登录日志按会话归属可见；四套餐在前台呈现明确差异，且差异完全由前台注册表驱动。
无已知 P0/P1/P2/P3 残留；原 A3 标签栏外观问题已修复并经浏览器探针复验。
