---
title: 低代码生成器的后端产物必须可编译且可建表（AUD-001）
doc_type: Remediation
layer: platform
status: Archived
depends_on_layers: []
linked_contracts:
  - docs/designs/GENERATOR_MODULE_DESIGN.md
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-10-31
---

# Task Packet: 2026-10-31-audit-p1-lowcode-generator-build

## Goal

审计 AUD-001：`frontend/src/modules/lowcode/generator/backendGenerator.ts` 产出的后端文件
**不可编译**。实测生成 `backend/modules/business/order/module.go` 得到：

- `import "pantheon-base/internal/middleware"` / `"pantheon-base/pkg/contracts"`，而本仓模块名是
  `github.com/duanxldragon/pantheon-base/backend`（`backend/go.mod:1`）；
  `go list pantheon-base/internal/middleware` 直接报 `is not in std`。
- `middleware.TokenAuthMiddleware()` 不传参，而真实签名是 `TokenAuthMiddleware(rdb *redis.Client)`
  （`backend/internal/middleware/token_middleware.go:214`）。
- 同一份生成器生成的注册表却用正确路径（`backend/internal/scaffold/workspace.go:394`），
  说明模板与注册器不同源。

**另有第四重（默认迁移模式下不建表）**：生成物不含任何 `.sql` 迁移，建表只靠
`service.Migrate()` → `AutoMigrate`；而 `pkg/contracts/module.go` 的 `RegisterBackendModules`
在 `PANTHEON_AUTO_MIGRATE != true` 时**只调 `Bootstrap`、不调 `Migrate`**，生成的
`contracts.FuncModule` 又只设 `MigrateFunc`、不设 `BootstrapFunc`（`FuncModule.Bootstrap`
在 `BootstrapFunc == nil` 时返回 nil）。结论：**默认版本化迁移模式下，生成的业务表永远不会被创建**。

本包让“生成 → 重启激活 → 表可用”这条链路第一次真正成立，并把编译校验放进注册前置，
杜绝“注册成功但编译失败 / 表不存在”的静默状态。

## Primary Layer

platform

## Dependency Layers

- `platform`（生成器模板 + `backend/internal/scaffold` + `dynamicmodule` 注册前置）
- 不触碰 `system/*`、`business/*` 实现、租户、权限、审计或 i18n 运行时。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `codegen-contract`
- Portable Failure Class: `generated-artifact-unusable`
- Owner Layer: `foundation-source`
- Ratchet Decision: `gate-updated`
- Coverage Dimensions:
  - behaviour
  - maintainability
  - runtime-quality

交付层级：**L2**（生成器属共享合同面，且修复后必须给出“生成文件可编译”的运行态证据）。

## Contract Anchors

- `docs/designs/GENERATOR_MODULE_DESIGN.md`：生成器输出契约与“生成即注册”的边界。
- `docs/contracts/PLATFORM_CONTRACT.md`：共享面变更的可验证性要求。
- `docs/designs/MODULE_CONTRACT.md`：生成模块必须挂载的中间件顺序。

## Scope

### In

- `frontend/src/modules/lowcode/generator/backendGenerator.ts`：全部 Go 导入改为从单一常量
  `GO_MODULE_PATH` 派生（`goImportPath()` / `buildGoImportBlock()`），不再手写第二份前缀；
  `generateModule()` 的路由组改为调用 `contracts.ProtectedGroup` / `contracts.DataScopedGroup`，
  **不自拼中间件链**（链的形状归 `pkg/contracts` 一处定义，见下条更正）。
- `backend/modules/lowcode/dynamicmodule/dynamic_module_service.go`
  `validateGeneratedModuleSource`：从“目录存在”升级为“生成包可编译”（在 workspace 的 `backend/`
  下执行 `go build ./modules/<scope>/<name>`），失败即拒绝注册且不推进状态。
- **建表路径**：生成的 `FuncModule` 必须设 `BootstrapFunc`（内部调 `AutoMigrate`），或产出真正
  进入版本化迁移链的 `.sql`；二者择一。判据是**默认迁移模式**（`PANTHEON_AUTO_MIGRATE` 未设）
  下重启后表存在，而不是只在 `AutoMigrate=true` 时存在。
- 测试：`frontend/tests/generator/generator-quality-contract.test.ts` 断言导入前缀、路由组形态、
  `BootstrapFunc` 与“不挂租户中间件”；`backend/modules/lowcode/dynamicmodule/dynamic_module_build_check_test.go`
  覆盖“编译失败 → 注册拒绝且不落库”。
- 生成产物的一次真实往返证据（生成 → `go build` → 撤销生成目录），产物不入库。

**执行中更正两处（原文有误，已按实测结论执行）：**

1. 原文要求路由组“与 `system_modules.go:162` 同形（Token → 租户上下文 → Casbin → DataScope）”。
   生成物是 `business/*` 模块，而 W2（`2026-10-31-audit-p1-business-route-tenant-context`）已依据
   `TENANT_CONTRACT_V1 §2.6` 确认**业务域不参与租户隔离**。照原文加租户中间件，会让 `multi`
   模式下所有业务请求变成 `TENANT_CONTEXT_MISSING`（业务表没有 `tenant_id` 可过滤），即用一个
   更严重的故障替换原故障。故改为走 `contracts.{Protected,DataScoped}Group`（Token → Casbin[→ DataScope]）。
2. 原文 Do Not Touch 把 i18n 列为禁区。编译闸门引入了一个**新的用户可见错误键**
   `module.register.source_uncompilable`，不登记就会让前端显示裸键，故放开
   `backend/modules/system/i18n/builtin_locale_resources.json` 与 5 个前端语言包，仅新增该一条。

### Out

- 把生成器升级为“热插拔/无需重启”：当前“重启激活”的定位不变。
- 前端生成模板（`frontendGenerator.ts`）的 `FilterPanel`/`SearchToolbar` 取舍（P3，不立项）。
- 生成模块的租户隔离策略本身：本包只要求生成物**不挂**租户中间件（与 §2.6 一致），隔离语义仍由
  `2026-10-31-audit-p1-business-route-tenant-context` 决定。
- 动态模块的卸载/彻底删除语义。

## Expected Files

### Create

- `docs/harness/tasks/2026-10-31-audit-p1-lowcode-generator-build.task.md`
- `.harness/tasks/2026-10-31-audit-p1-lowcode-generator-build/manifest.json`
- `.harness/evidence/2026-10-31-audit-p1-lowcode-generator-build/{commands.json,summary.md,review.md}`
- `backend/modules/lowcode/dynamicmodule/dynamic_module_build_check.go`（闸门独立成文件）
- `backend/modules/lowcode/dynamicmodule/dynamic_module_build_check_test.go`

### Modify

- `frontend/src/modules/lowcode/generator/backendGenerator.ts`
- `frontend/tests/generator/generator-quality-contract.test.ts`
- `backend/modules/lowcode/dynamicmodule/dynamic_module_service.go`
- `backend/modules/lowcode/dynamicmodule/dynamic_module_handler.go`（三处 `switch err.Error()` 修正）
- `backend/modules/system/i18n/builtin_locale_resources.json`
- `frontend/src/i18n/resources/{zh-CN,en-US,ja-JP,ko-KR,fr-FR}.ts`（仅新增一条文案）

### Do Not Touch

- `backend/modules/business/**`（不得为验证而把生成物提交进仓）
- `backend/pkg/database/migrations/**`
- `VERSION`、`CHANGELOG.md`、`docs/release-notes/**`
- 工作树中既有的、与本包无关的未提交改动

## Implementation Notes

- 模板与注册器不同源是这条缺陷的根因：`workspace.go:394` 用真实模块路径拼注册表导入，
  而 `backendGenerator.ts` 自己手写 `pantheon-base/...`。修复时优先让模板从单一常量派生
  （例如在生成器里定义 `GO_MODULE_PATH`），而不是再手写一遍。
- 中间件顺序不能凭记忆写。**注意**：`system_modules.go:162` 是系统域模块，含租户上下文中间件；
  生成物是业务域模块，按 `TENANT_CONTRACT_V1 §2.6` 不得挂租户中间件。因此正确做法不是“抄那一行”，
  而是调用 `contracts.{Protected,DataScoped}Group`——链的形状只在 `pkg/contracts` 定义一次，
  生成器只声明“要不要 DataScope”。
- 编译校验必须跑在“写盘之后、注册状态推进之前”：当前 `RegisterGeneratedModule` 先把
  registration 落到 `pending_activation`，再做 `refreshGeneratedWorkspaceArtifacts`；
  只有在写盘后、状态推进前校验，才能避免“页面显示已激活、重启后编译失败”。
- 校验命令要在 workspace root 下限定到生成包，避免全仓 `go build` 把无关历史债务带进来。
- 生成产物不得入库：`.harness/evidence` 只存命令与输出摘要，存文件清单与 diff 摘要即可。

## Verification Plan

- `npm run test:generator:quality`（含新增导入/中间件断言）
- `cd backend && go test -short ./modules/lowcode/...`
- 真实往返：`POST /lowcode/generator/preview-files` 或 `node frontend/scripts/export-generated-module.mjs <schema>` →
  落盘到临时 workspace → `go build ./modules/business/<name>/...` → 退出码 0
- 建表往返：默认迁移模式（不设 `PANTHEON_AUTO_MIGRATE`）下重启 → 生成的表存在
- 负向：人为写坏一个导入 → 注册返回拒绝且 registration 不推进到 active
- `npm run check:structure`、`npm run check:generated`、`node scripts/harness/check-evidence.mjs --root . --strict`

## Linkage

- Task ID: `2026-10-31-audit-p1-lowcode-generator-build`
- Task Manifest: `.harness/tasks/2026-10-31-audit-p1-lowcode-generator-build/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-10-31.md`、`docs/designs/GENERATOR_MODULE_DESIGN.md`
- Evidence Directory: `.harness/evidence/2026-10-31-audit-p1-lowcode-generator-build/`
- Review File: `.harness/evidence/2026-10-31-audit-p1-lowcode-generator-build/review.md`

## Evidence Required

- `commands.json`：生成前的失败读数（`go list` 报错、模板行号）、修复后的生成文件头 20 行、
  `go build` 退出码、负向用例读数、`test:generator:quality` 与 Go 测试读数
- `summary.md`：三处不匹配的根因、为何把校验放在写盘与状态推进之间、未入库的生成物清单
- `review.md`：逐条 reviewer posture 读数

## Human Gates

- 生成器是消费者可见面（ops 的 lowcode 页面复用同一模板）：合并前需确认无 schema/菜单/权限
  变化，且生成的菜单键与权限码命名规则未变。
- 若为修复而需要调整 `sharedPaths`（本次不应需要），必须走 foundation release 评审。

## Execution Result

**执行日期**：2026-10-31　**基线**：HEAD `ef00738`（`origin/main` 为 `bb0498f`，本包改动未入库）

### 四项缺陷的闭合方式

| # | 缺陷 | 修复 | 判据 |
|---|---|---|---|
| 1 | 导入写成 `pantheon-base/...`，`go build` 报 `is not in std` | 模板全部导入从 `GO_MODULE_PATH` 派生 | 产物中 `"pantheon-base/` 命中 0（修复前 3 文件）；`GO_MODULE_PATH` 与 `backend/go.mod` 由测试比对 |
| 2 | `middleware.TokenAuthMiddleware()` 漏 `rdb` | 不再自拼链，改调 `contracts.{Protected,DataScoped}Group` | 产物中 `middleware.` 命中 0 |
| 3 | 路由组形态与底座不一致 | 同上，链的形状归 `pkg/contracts` | `contracts.DataScopedGroup(r, "/business/order", db)` |
| 4 | 默认迁移模式下永不建表 | `FuncModule` 同时设 `MigrateFunc` 与 `BootstrapFunc` | 默认模式下 `biz_order` 真实建出；摘掉 `BootstrapFunc` 后同一测试失败 |

### 顺带修掉的两处“恒不命中”

`dynamic_module_handler.go` 三处 `switch err.Error()` 与裸键比较，而 `common.NewBadRequest(key)`
的 `Error()` 带 `bad_request: ` 前缀，所以这三个 switch 从未命中——新闸门的错误会被映射成 500 类
错误。改为 `common.ErrMessage(err)` 后 `module.register.source_uncompilable` 才能正确落到 400。

### 运行态证据（在仓库副本 `/tmp/w1-ws` 内完成，产物不入库）

- `go build ./modules/business/order/` exit 0；`go vet` exit 0。
- 一次性集成测试：`PANTHEON_AUTO_MIGRATE` 未设 → `InitOrderModule` → `HasTable("biz_order")` = true，
  日志为 `versioned migrations mode: skipping module AutoMigrate and running runtime bootstraps`。
- 负向：摘掉 `BootstrapFunc` → 同一测试 `biz_order was not created`；摘掉闸门 →
  `TestRegisterManagedModuleRejectsUncompilableGeneratedSource` FAIL。

### 未闭合项（已登记，不阻断本包）

- **AUD-001c（P2）**：`BootstrapFunc → AutoMigrate` 与 `docs/DEPLOYMENT_GUIDE.md:44`“生产环境不得
  启用 GORM AutoMigrate”冲突。当前是任务包预先批准的选项之一，但该文档未豁免。冻结前应择一：
  文档加例外条款，或改为在 Bootstrap 执行显式 `CREATE TABLE IF NOT EXISTS`
  （仓库先例：`internal/middleware/data_scope_middleware.go:68`）。
- **AUD-001b（P3）**：生成物 `gofmt -l` 列出全部 5 个 Go 文件（模板写死结构体字段对齐空格）。
  提交时会被 lint-staged 的 `gofmt -w` 归位，CI gofmt 对 PR 仅报告，不影响构建，故未在本包混入。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] 生成物在真实 workspace 下 `go build` 退出码为 0，且未入库
- [x] 默认迁移模式下生成模块的表真实存在（不依赖 `PANTHEON_AUTO_MIGRATE`）
- [x] 注册前置在编译失败时拒绝推进状态
- [x] 模板导入路径从单一来源派生，不再手写第二份
