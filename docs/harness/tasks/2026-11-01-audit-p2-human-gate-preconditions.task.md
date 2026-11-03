---
title: 三条 P2 残留的可验证前置条件（human gate 执行单）
doc_type: Remediation
layer: platform
status: Archived
depends_on_layers: []
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/SYSTEM_AUTH_CONTRACT.md
updated_at: 2026-11-01
---

# Task Packet: 2026-11-01-audit-p2-human-gate-preconditions

## Goal

整改 programme 收口后剩下三条 P2：`AUD-013-prod`（生产库执行 `000031` 的 DROP）、
`AUD-014-followup`（2026-12-31 下线 legacy 认证端点）、`FREEZE-DECLARATION`（冻结宣告）。
三条的共同点是**动作本身属于维护者**，不是代理能代做的。

本包不代做这些动作，只补上它们缺的东西：**可执行、可核对、可复现的前置条件**。
在此之前的真实状态是——`000031` 的 DROP 没有预检脚本，执行者无法在动手前看到"会丢多少行"；
legacy 端点的下线只有一句日期，没有清单，删除当天要现场重新检索；冻结宣告没有文本，
签署人要自己从四份材料里拼事实。

## Primary Layer

platform

## Dependency Layers

- `platform`（迁移链、认证路由、治理门禁）
- 不触碰业务域、不触碰 `pantheon-ops`、不改任何运行时行为。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: none
- Release Requirement: foundation-release
- Downstream Sync Note: 本包只新增文档、一个只读 SQL 脚本与一个测试，无运行时行为变化；
  下游无需同步（但 §7 登记的下游文档缺口需在 ops 内自行核对）。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `maintainability`
- Portable Failure Class: `human-gate-without-precondition`
- Owner Layer: `foundation-source`
- Ratchet Decision: `gate-updated`
- Coverage Dimensions:
  - maintainability
  - behaviour

交付层级：**L2**（涉及生产库破坏性 DDL 的执行前置，但不改变代码路径）。

## Contract Anchors

- `docs/contracts/SYSTEM_AUTH_CONTRACT.md` §7.7：legacy 双入口的下线承诺与"不得留下无对应路由的豁免"。
- `backend/pkg/database/migrations/000031_drop_permission_role_data_scope_policy.up.sql`：DROP 的权威文本。
- `docs/runbooks/TENANT_MIGRATION_RUNBOOK.md` §8：G1–G4 human gate 的既有口径（G2 仍 OPEN）。

## Scope

### In

- 新增 `backend/pkg/database/migrations/preflight/000031_preflight.sql`：6 条只读 SELECT，
  供执行者在部署前读出「当前版本 / 死表是否存在 / 将销毁多少行 / 替换表是否存在且非空 / 样例行」。
- 新增 `backend/pkg/database/migrate_preflight_test.go`：在 schema-30 库上造两行数据，
  逐条执行脚本并断言每个读数，然后真的应用 `000031`，验证脚本的预测与实际一致。
- 新增 `docs/runbooks/MIGRATION_000031_PRODUCTION_DROP.md`：预检 → 导出 → 还原证明 → 变更记录 → 部署 → 事后核对 → 回滚。
- 新增 `docs/runbooks/DECOMMISSION_LEGACY_AUTH_ROUTES_2026-12-31.md`：下线清单（含文件与行号）与执行步骤。
- 新增 `docs/reviews/PANTHEON_BASE_MAINTENANCE_FREEZE_DECLARATION.md`：冻结宣告文本 + 7 项门槛 + 今日实测读数 + 残留表 + 签署块。

### Out

- 在生产库执行 `000031`。
- 删除 legacy 路由、CSRF 豁免与 Casbin case。
- 替维护者签署冻结宣告。
- 修改 `VERSION`、`CHANGELOG.md`、`pantheon-ops`。
- 修改迁移链本身或 `000031` 的 up/down 文本。

## Expected Files

### Create

- `docs/harness/tasks/2026-11-01-audit-p2-human-gate-preconditions.task.md`
- `.harness/tasks/2026-11-01-audit-p2-human-gate-preconditions/manifest.json`
- `.harness/evidence/2026-11-01-audit-p2-human-gate-preconditions/{commands.json,summary.md,review.md}`
- `backend/pkg/database/migrations/preflight/000031_preflight.sql`
- `backend/pkg/database/migrate_preflight_test.go`
- `docs/runbooks/MIGRATION_000031_PRODUCTION_DROP.md`
- `docs/runbooks/DECOMMISSION_LEGACY_AUTH_ROUTES_2026-12-31.md`
- `docs/reviews/PANTHEON_BASE_MAINTENANCE_FREEZE_DECLARATION.md`

### Modify

- `docs/contracts/DOCUMENT_METADATA_AND_STATUS.md` §6.5（90 天读数从 144 走到 143 的原因）
- `docs/contracts/DOCUMENT_METADATA_AND_STATUS.en.md` §6.5（同步）

### Do Not Touch

- `backend/pkg/database/migrations/000031_*.sql`
- `backend/pkg/database/migrate.go`
- `backend/modules/auth/module.go`（下线动作属 2026-12-31）
- `backend/internal/middleware/{csrf,casbin}_middleware.go`（同上）
- `VERSION`、`CHANGELOG.md`、`pantheon-ops`

## Implementation Notes

- **预检脚本放在子目录不是随意选择**：`migrate.go:21` 是 `//go:embed migrations/*.sql`，
  不递归，所以子目录天然不进迁移源。但这是**模式**的性质，不是目录的性质——测试里加了一条断言，
  若有人把模式放宽成 `migrations`，预检脚本会被当成畸形迁移文件。该断言已负向验证过。
- **脚本由测试嵌入，不由 runbook 复制**：runbook 里贴一份副本，第一次有人改表结构就会漂移。
  测试嵌入并逐条断言，执行者跑的就是被断言的同一个文件。
- **预检的第 3 与第 5 条必须一起读**：第 3 条为 0 只说明旧表空；第 5 条为 0 只说明新表空。
  只有「3 = 0」或「3 > 0 且 5 > 0 且导出已还原验证」两种组合可以继续。
- **纠正了本包开工时的一个错误认知**：此前认为"没有迁移 CLI"。实际 `cmd/tenantmigration` 存在，
  `status` 子命令只读、不迁移。但它不在镜像内（`Dockerfile:41` 只构建 `./cmd/server`），
  所以 runbook 里给了 `go run` 的等价命令，并把"镜像内无手工迁移入口"登记为残留。
- **部署即迁移**：`PANTHEON_AUTO_MIGRATE=false`（生产配置）下 `runDatabaseMigrations` 走
  `RunMigrations`，所以 DROP 与服务启动是同一个动作，滚动更新时由最先取到
  `GET_LOCK` 的 Pod 执行。这一点决定了预检必须在**部署之前**做，runbook §1.2 写明了。
- **冻结宣告故意写成"未签署"**：工作区 HEAD `ef00738` 是整改前快照，150 modified / 9 deleted /
  49 untracked，整改产物未进 `main`。在整改产物进 `main` 前签署，等于宣告冻结一份不含整改的代码。

## Verification Plan

- `cd backend && gofmt -l pkg/database/ && go vet ./pkg/database/`
- `cd backend && go test ./pkg/database/ -run TestPreflight000031ReportsWhatTheDropWouldDestroy -v -count=1`
- 负向 A：把第 3 条改成 `WHERE 1=0` → 必须在 `rows_to_be_dropped` 断言上红
- 负向 B：把 `migrate.go` 的 embed 模式放宽为 `migrations` → 必须在 embed 隔离断言上红
- `cd backend && go test ./pkg/database/ -count=1`（整包，确认新用例不干扰既有迁移用例）
- `cd backend && go build ./... && go vet ./...`
- `cd frontend && npx tsc -b`
- `npm run check:docs-frontmatter` / `check:harness-docs` / `check:harness-inventory` /
  `check:harness-encoding` / `check:task-packet`
- `node scripts/harness/check-evidence.mjs --root . --strict`、`check-review.mjs --root . --strict`

## Linkage

- Task ID: `2026-11-01-audit-p2-human-gate-preconditions`
- Task Manifest: `.harness/tasks/2026-11-01-audit-p2-human-gate-preconditions/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-10-31.md` §13、§16.6
- Evidence Directory: `.harness/evidence/2026-11-01-audit-p2-human-gate-preconditions/`
- Review File: `.harness/evidence/2026-11-01-audit-p2-human-gate-preconditions/review.md`

## Evidence Required

- `commands.json`：预检用例读数 + 两次负向读数 + 整包读数 + 全仓门禁读数。
- `summary.md`：三条 P2 各自"动作归谁 / 本包补了什么 / 还缺什么"，以及 144→143 的成因。
- `review.md`：逐条 reviewer posture，含"预检是否可能低估行数"的反向检查。

## Human Gates

- `AUD-013-prod`：生产执行需维护者/DB 负责人选择 runbook §3.5 的放行路径（A 或 B），代理不得代签。
- `AUD-014-followup`：下线需维护者书面确认无外部集成方，且日期 ≥ 2026-12-31。
- `FREEZE-DECLARATION`：宣告归维护者，代理不得代签。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] 预检脚本只读（6 条全为 SELECT，无写、无锁）
- [x] 预检不随二进制发布（embed 隔离断言已负向验证）
- [x] 三条 P2 的执行单均写明"动作归维护者"，未代做
- [x] 冻结宣告未签署，且写明为何今天不能签

## Execution Result

**状态：completed（2026-11-01）。** 三条 P2 的**动作**仍未执行（按设计归维护者），
本包交付的是它们的可验证前置条件。

### 三条 P2 的处置

| ID | 动作归谁 | 本包补了什么 | 还缺什么 |
|----|----------|--------------|----------|
| `AUD-013-prod` | 维护者 / DBA | 只读预检脚本 + 断言其读数语义的用例 + 生产执行规程（含放行路径 A/B） | 维护者选择放行路径并签字；实际执行 |
| `AUD-014-followup` | 维护者 | 下线清单（文件 + 行号 + 6 个文档）+ 执行步骤 + 回退方案 | 维护者书面确认无外部集成方；日期到 2026-12-31 |
| `FREEZE-DECLARATION` | 维护者 | 宣告文本 + 7 项门槛对应 + 今日实测读数 + 11 条残留 + 签署块 | 整改产物进 `main`；维护者填 SHA 并签字 |

### 读数

| 项 | 读数 |
|----|------|
| 预检用例 | PASS（schema-30 造 2 行 → 六条读数逐条断言 → 应用 000031 后死表消失、替换表存活） |
| 负向 A（第 3 条改成 `WHERE 1=0`） | FAIL：`rows_to_be_dropped=0, want 2` |
| 负向 B（embed 模式放宽为 `migrations`） | FAIL：`preflight script is embedded in migrationFS` |
| `go test ./pkg/database/`（整包） | ok 59.7s |
| `go test -short ./...` | EXIT=0 / ok=47 / FAIL=0 / no test files=5 |
| `go build` / `go vet` / `gofmt` | 三清 |
| `tsc -b` | exit 0 |
| `check:search-toolbar-contract` | 0 findings / 106 文件 |
| `check:docs-frontmatter` | 421 docs / 306 带元数据 / 115 不强制 / 143 逾期（只报告） |
| `check:doc-links` / `check:doc-inventory` / `check:encoding` | 0 / 0 / 0 findings |
| `check-task-packet` / `check-evidence` / `check-review` | 94 / 0 error / 14 warning；15；15 |

### 一处自我更正

预检解析器初版按字面 `"\n;\n"` 切分语句。负向验证时用 Python 改写脚本文件，
换行被写成 CRLF，解析器把整个文件当成一条语句，报的是"parsed 1"而不是行数断言。
这不是负向验证失败，是**解析器对行尾敏感**——Windows 检出或编辑器保存都会触发。
已改为按行锚定的正则 `(?m)^;[ \t\r]*$`，并在注释里写明为什么不能按字面切分。
改完后重跑负向 A，才真正红在 `rows_to_be_dropped` 断言上。

### 显式 gap

1. 预检只能报"有多少行"，不能报"这些行是否还有用"。判据仍要人读样例行（第 6 条）。
2. `000031` 仍是 untracked 文件，未进任何提交；生产执行的前提之一是它先合入 `main`。
3. 冻结宣告不能签署：整改产物未进 `main`（详见宣告 §1）。
