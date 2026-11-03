---
title: 生产 AutoMigrate 边界收口（AUD-001c）
doc_type: Remediation
layer: platform
status: Archived
depends_on_layers: []
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/SYSTEM_IAM_CONTRACT.md
updated_at: 2026-11-01
---

# Task Packet: 2026-11-01-audit-p2-automigrate-boundary

## Goal

W1 留下的 P2：`docs/DEPLOYMENT_GUIDE.md:44` 写"生产环境不得启用 GORM AutoMigrate"，
但低代码生成的业务表在**默认（版本化迁移）路径**下恰恰是由 `BootstrapFunc → AutoMigrate` 创建的。
文档与代码直接矛盾，而审计要求"冻结前择一"。

本包选**文档加例外条款**，并把例外写窄到可以逐条核对：平台表仍然绝不允许 AutoMigrate，
只有"运行时才有 schema"的生成业务表例外。同时修掉两处会让人读错这个例外的材料——
`MODULE_CONTRACT` §4.3 的接口清单（漏了 `Migrate`，且还写着"如果后续需要再扩展"）、
以及启动日志（嘴上说 "skipping module AutoMigrate"，手上却在跑会自动建表的 bootstrap）。

## Primary Layer

platform

## Dependency Layers

- `platform`（模块装配契约、部署文档）
- 不触碰生成器产物、迁移链、租户模型与任何业务域。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: none
- Release Requirement: foundation-release
- Downstream Sync Note: 无运行时行为变化（只改日志文案、注释与文档），随下一次 foundation release 自然送达；下游部署手册若抄了旧表述需同步。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `maintainability`
- Portable Failure Class: `doc-code-drift`
- Owner Layer: `foundation-source`
- Ratchet Decision: `gate-updated`
- Coverage Dimensions:
  - maintainability
  - architecture-fitness
  - behaviour

交付层级：**L1**（装配契约 + 部署文档；无安全语义、无数据面变化）。

## Contract Anchors

- `docs/contracts/PLATFORM_CONTRACT.md`：共享面变更的可验证性要求。
- `backend/pkg/contracts/module.go`：`BackendModule` / `FuncModule` 与 `RegisterBackendModules` 的真实语义。
- `docs/DEPLOYMENT_GUIDE.md` §3：本包修订的规则原文。

## Scope

### In

- `DEPLOYMENT_GUIDE.md` §3：把"生产不得启用 AutoMigrate"限定为**平台 schema**，
  新增一张边界表（平台表 / 生成业务表）、两点操作后果（DDL 权限、列只增不减），
  并明确区分 `PANTHEON_ENABLE_DYNAMIC_MODULES`（只管 HTTP 注册路由）与本例外无关。
- `MODULE_CONTRACT.md` §4.3：接口补 `Migrate`，加"何时执行 Migrate / Bootstrap"的判定表，
  说明 `BootstrapFunc` 是给运行时才有 schema 的模块准备的出口，并指向部署指南的边界。
- `contracts/module.go`：启动日志改为准确表述（`Migrate()` 被跳过、bootstrap 仍会跑且可能建表），
  注释补一句说明 bootstrap 阶段不在"禁止 AutoMigrate"的范围内。
- `contracts/module_test.go`：新增用例钉住 `FuncModule` 形状——只有 `BootstrapFunc` 的模块
  仍会被 bootstrap，只有 `MigrateFunc` 的不会被 migrate。

### Out

- 让生成器产出 DDL / 迁移文件（审计建议的另一半，见 Implementation Notes 的取舍）。
- 在 `Bootstrap` 里改写成显式 `CREATE TABLE IF NOT EXISTS`。
- 修改 `PANTHEON_AUTO_MIGRATE` 的语义或默认值。
- 修改生成器模板、`generated_registry.go` 或任何业务模块。
- 触碰 `pantheon-ops`、`VERSION`、`CHANGELOG.md`。

## Expected Files

### Create

- `docs/harness/tasks/2026-11-01-audit-p2-automigrate-boundary.task.md`
- `.harness/tasks/2026-11-01-audit-p2-automigrate-boundary/manifest.json`
- `.harness/evidence/2026-11-01-audit-p2-automigrate-boundary/{commands.json,summary.md,review.md}`

### Modify

- `docs/DEPLOYMENT_GUIDE.md`
- `docs/designs/MODULE_CONTRACT.md`
- `backend/pkg/contracts/module.go`
- `backend/pkg/contracts/module_test.go`

### Do Not Touch

- `frontend/src/modules/lowcode/generator/**`（生成器模板）
- `backend/modules/business/**`
- `backend/pkg/database/migrations/**`
- `backend/pkg/database/migrate.go`（`ShouldAutoMigrate`）
- `VERSION`、`CHANGELOG.md`

## Implementation Notes

- **为什么不做"显式 `CREATE TABLE IF NOT EXISTS`"（审计建议的另一半）**：它在表已存在时什么都不做。
  低代码 schema 加字段后重新生成模块，表不会补列，运行时报"列不存在"；而 `AutoMigrate` 会补。
  等于用"更弱的建表能力"去换"更严格的文档措辞"，把文档问题转成了运行时问题。
- **为什么不做"生成器产出迁移文件"**：生成器已有 `TYPE_MAPPING[].sql` 与 `getSQLType()`，
  产出 DDL 技术上可行，但要逐列与 GORM 模型对齐（`time.Time` 在 MySQL 上是 `datetime(3)` 而非
  `DATETIME`、索引命名、m2m 关联表的主键与列顺序）。一旦不一致，查询直接失败，而那时已经没有
  `AutoMigrate` 兜底。这是冻结前不该引入的新风险类型。取舍已记录，供后续版本重估。
- **差点踩错的点**：`PANTHEON_ENABLE_DYNAMIC_MODULES` 生产固定 `false`，看起来足以消除这个冲突。
  实际上它只挡 `/lowcode/dynamic-modules/*` 这组 HTTP 路由（`DynamicModuleEnvGuard`）；
  编译进 `backend/modules/business/generated_registry.go` 的模块不受它约束，
  启动时照样走 `Bootstrap → AutoMigrate`。所以冲突是真实的，不能用"生产不开动态模块"糊过去。
- 日志文案属于运维读取面：原句 "skipping module AutoMigrate" 会让人以为启动期没有任何 AutoMigrate，
  与 bootstrap 阶段的行为相反。改文案不是修饰，是修一个会误导排障的陈述。

## Verification Plan

- `cd backend && go build ./... && go vet ./... && gofmt -l pkg/contracts/`
- `cd backend && go test ./pkg/contracts/ -run TestRegisterBackendModules -v`（3 个用例）
- 负向 A：让 `FuncModule.Bootstrap` 在 `MigrateFunc == nil` 时提前返回
  → 新用例必须红，另外两个必须仍绿（证明新用例守的是 `FuncModule` 形状，不是重复覆盖）
- 负向 B：整段删掉 bootstrap 阶段 → 新用例与 `PhasedExecution` 都红
  （说明新用例不是唯一守门人，注释不能写成"只有它能拦"）
- `npm run check:docs-frontmatter` / `check:harness-docs` / `check:harness-inventory` /
  `check:harness-encoding` / `check:duplication`
- `node scripts/harness/check-evidence.mjs --root . --strict`、`check-review.mjs --root . --strict`

## Linkage

- Task ID: `2026-11-01-audit-p2-automigrate-boundary`
- Task Manifest: `.harness/tasks/2026-11-01-audit-p2-automigrate-boundary/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-10-31.md` §11（AUD-001c 登记处）、§16.5
- Evidence Directory: `.harness/evidence/2026-11-01-audit-p2-automigrate-boundary/`
- Review File: `.harness/evidence/2026-11-01-audit-p2-automigrate-boundary/review.md`

## Evidence Required

- `commands.json`：三个用例读数 + 两次负向读数 + 文档门禁读数。
- `summary.md`：三个选项的取舍（尤其为什么拒绝审计建议的另一半）、`PANTHEON_ENABLE_DYNAMIC_MODULES` 的辨析。
- `review.md`：逐条 reviewer posture，含"这个例外有没有被写宽"的反向检查。

## Human Gates

- 部署手册面向运维，措辞改动建议由一位非作者确认没有放宽"生产不得 AutoMigrate"的**平台**约束。
- 若下游 `pantheon-ops` 的部署文档抄了旧表述，需在其仓内同步（本包不改 ops）。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] 平台表的 AutoMigrate 禁令未被放宽，例外只覆盖生成业务表
- [x] 例外边界可逐条核对（表格形式，含"由谁创建 / 受哪个开关控制"）
- [x] 新用例在"FuncModule 被收紧"时会红，且不与既有用例重复

## Execution Result

**状态：completed（2026-11-01）。**
证据：`.harness/evidence/2026-11-01-audit-p2-automigrate-boundary/`。

### 选了什么

| 选项 | 结论 | 理由 |
| --- | --- | --- |
| 文档加例外（**采纳**） | 例外写窄：平台表仍禁止，只有生成业务表例外 | 唯一不改运行时行为的选项；代价（列只增不减、需 DDL 权限）被显式写进文档 |
| 显式 `CREATE TABLE IF NOT EXISTS` | 拒绝 | 表已存在时不做任何事，schema 加字段后不补列 → 把文档问题变成运行时问题 |
| 生成器产出迁移文件 | 拒绝（记录待重估） | 需手写 DDL 与 GORM 模型逐列一致；不一致即查询失败且失去 `AutoMigrate` 兜底，属冻结前不该引入的风险 |

### 读数

| 项 | 读数 |
| --- | --- |
| 三个装配用例 | 3/3 PASS |
| 负向 A（`FuncModule.Bootstrap` 要求 `MigrateFunc` 非空） | 新用例 FAIL，另两个 PASS |
| 负向 B（删掉整个 bootstrap 阶段） | 新用例 + `PhasedExecution` 都 FAIL |
| 启动日志 | 实测输出 `versioned migrations mode: module Migrate() skipped, runtime bootstraps run instead` + note |
| `go build` / `go vet` / `gofmt` | 三清 |
| 文档门禁 | frontmatter / doc-links / inventory / encoding / duplication 全 PASS |

### 没改什么

`PANTHEON_AUTO_MIGRATE` 语义与默认值、生成器模板、`generated_registry.go`、
迁移链、任何业务模块、`VERSION`、`CHANGELOG.md`、`pantheon-ops`。

### 显式 gap

1. 生成业务表的 DDL 仍由 `AutoMigrate` 在启动时决定，**不在版本化迁移链里**；这意味着列变更
   随二进制升级静默生效，没有对应的 down 迁移。该代价已写进部署指南，属于被接受的取舍而非遗漏。
2. 本包只改了 base 侧文档；若下游部署手册抄了旧表述，需在 `pantheon-ops` 内同步（human gate）。
