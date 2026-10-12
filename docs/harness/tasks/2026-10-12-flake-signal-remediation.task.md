---
title: Pantheon Base 主干偶发失败（测试缓存身份 + 布局测量竞态）修复任务包
doc_type: Remediation
layer: platform
depends_on_layers:
  - system/iam
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/DOCUMENT_GOVERNANCE_CONTRACT.md
updated_at: 2026-10-12
---

# Task Packet: 2026-10-12-flake-signal-remediation

## Goal

消除两处会污染主干门禁信号、且已实际复发的偶发失败（flake），并各留一条可复核的回归传感器：

1. **Go 测试偶发失败** `TestDataScopeMiddlewareInjectsRoleDeptScope`：数据范围中间件的进程级缓存
   （表存在性、用户部门）以连接池指针地址作命名空间。测试库在 `t.Cleanup` 中被关闭并 DROP 后，
   Go 运行时会把同一地址分配给新的连接池，于是新测试库继承了旧库「`system_role_data_scope`
   已存在」的缓存结论，`MigrateDataScopePolicy` 跳过建表，紧接着的 INSERT 报
   `Error 1146 (42S02): Table ... doesn't exist`。CI 上已复现（主干 `c7e564bc` 的 Backend Tests
   首次运行失败，重跑通过）。
2. **Core Smoke 偶发失败** `platform-shell-critical.spec.ts:60`：点击折叠按钮后立即读取侧边栏
   `boundingBox()`，采到 Arco Sider 宽度过渡动画（200ms）的中间值 —— 首跑读到 248 vs 248
   （折叠尚未开始），重跑读到 215.5625 vs 108.265625（展开尚未结束）。

修复必须消除竞态本身，而不是放松断言阈值：Go 侧换成稳定的连接身份作缓存命名空间；
浏览器侧在测量前等待动画结束。

## Primary Layer

platform

改动只落在两处测试基础设施（后端 `pkg/database` 的连接身份工具 + 数据范围中间件的缓存键；
前端 smoke 测试的布局测量助手），不触碰任何业务源码或产品行为。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `not-required`
- Release Requirement: `none`

## Dependency Layers

- `platform`：`backend/pkg/database`、`backend/internal/middleware`、`frontend/tests/**`（唯一实现改动面）。
- 仓库治理：`docs/harness/failure-registry.md`（新增 FR-012 / FR-013 两条 flake 记录）。
- `system/iam`：数据范围策略（`system_role_data_scope`）的语义参照，不改其源码。

## Harness Profile

- Template: admin-platform
- Overlay: pantheon-base
- Quality Profile: ci-workflow
- Portable Failure Class: `ci-signal-noise`
- Owner Layer: consumer-repository
- Ratchet Decision: sensor-added（两处竞态各补一条可在本机稳定复现的回归测试/共享助手，作为长期传感器）
- Coverage Dimensions:
  - behaviour
  - maintainability
  - runtime-quality

## Contract Anchors

- `AGENTS.md`、`DESIGN.md`、`docs/README.md`
- `docs/contracts/PLATFORM_CONTRACT.md`、`docs/contracts/DOCUMENT_GOVERNANCE_CONTRACT.md`
- `docs/harness/VERIFICATION_EVIDENCE_SPEC.md`、`docs/harness/failure-registry.md`
- `frontend/tests/smoke/README.md`（smoke 布局与脚本入口契约）
- `.github/workflows/smoke-core.yml`（Core Smoke 报告制门禁与其触发条件）

## Scope

### In

- `backend/pkg/database/connection_cache_namespace.go`（新增）：`ConnectionCacheNamespace`，
  以 DSN 的 `host:port/dbname` 生成连接身份，作为进程级缓存的命名空间；无法解析时回退到连接池指针。
- `backend/pkg/database/connection_cache_namespace_test.go`（新增）：离线（不联网）单测，
  覆盖「不同库/不同主机命名空间不同」「同一 DSN 稳定」「不泄露凭据」「不可用时回退」。
- `backend/internal/middleware/data_scope_middleware.go`：`buildDatabaseCacheNamespace` 改为委托
  `database.ConnectionCacheNamespace`，删除基于 `%p` 的实现与随之无用的 `fmt` 导入。
- `backend/internal/middleware/data_scope_middleware_test.go`（新增两个用例）：
  `TestDataScopeCacheKeysAreScopedPerConnection`（确定性守卫：两条连接的缓存键必须不同且同一连接稳定）
  与 `TestMigrateDataScopePolicyIgnoresForeignCachedVerdict`（复现 CI 失败序列：旧连接投毒缓存后，
  新连接仍必须自建策略表）。
- `frontend/tests/smoke/helpers/layout-settle.ts`（新增）：`readElementWidth` 与
  `settleElementLayout`（先等盒模型签名稳定，再等元素及其子树动画 `finished`）。
- `frontend/tests/smoke-core/platform-shell-critical.spec.ts`：折叠/展开前后等待状态类生效并等动画结束，
  再测量宽度。
- `frontend/tests/smoke/platform/shell-top-panels.spec.ts`：删除本地 `readWidth` / `settlePanel` 副本，
  改用共享助手（避免新增重复代码触发 duplication 门禁）。
- `.harness/tasks|evidence/2026-10-12-flake-signal-remediation/`、`docs/harness/tasks/2026-10-12-flake-signal-remediation.task.md`。
- `docs/harness/failure-registry.md`：新增 FR-012（Go 缓存身份）与 FR-013（浏览器布局测量竞态）。

### Out

- 放松任何断言阈值：折叠仍要求 `collapsedWidth < initialWidth`、展开仍要求
  `expandedWidth > collapsedWidth`；Go 侧仍要求策略表必须真实建出。
- 给 Go 测试加 `-p 1`、串行化、重试或跳过：那是掩盖竞态而不是消除竞态。
- 把 Core Smoke 从报告制改成阻塞制：按 `tests/smoke-core/README.md` 的规则需要连续多轮全绿后
  再由维护者决策，本包不做。
- 修改 `MigrateDataScopePolicy` 的 fail-closed 语义、`ShouldAutoMigrate` 分支或任何策略读取逻辑。
- 修改 `.github/workflows/**`、`.sonarcloud.properties`。

## Expected Files

### Create

- `backend/pkg/database/connection_cache_namespace.go`
- `backend/pkg/database/connection_cache_namespace_test.go`
- `frontend/tests/smoke/helpers/layout-settle.ts`
- `.harness/tasks/2026-10-12-flake-signal-remediation/manifest.json`
- `.harness/evidence/2026-10-12-flake-signal-remediation/{commands.json,summary.md,review.md}`
- `docs/harness/tasks/2026-10-12-flake-signal-remediation.task.md`

### Modify

- `backend/internal/middleware/data_scope_middleware.go`
- `backend/internal/middleware/data_scope_middleware_test.go`
- `frontend/tests/smoke-core/platform-shell-critical.spec.ts`
- `frontend/tests/smoke/platform/shell-top-panels.spec.ts`
- `docs/harness/failure-registry.md`

### Do Not Touch

- `frontend/src/**`、`backend/modules/**`、`backend/pkg/database/migrate.go` 等产品源码。
- `.github/workflows/**`、`.sonarcloud.properties`、`package.json` 脚本入口。
- 任何 spec 的断言阈值、smoke 覆盖契约（34 specs / 20 entries）与 `tests/smoke/README.md` 覆盖矩阵。
- 已归档的 `.harness/archive/**` 与历史 evidence 目录。

## Implementation Notes

- **根因先行（Go）**：CI 证据显示失败测试在 `MigrateDataScopePolicy(db)` 返回 nil 之后立刻
  INSERT 失败，且该测试库是全新的 —— 唯一能让 `MigrateDataScopePolicy` 返回 nil 又不建表的路径
  就是 `cachedHasTable` 命中旧结论。由于 `buildDatabaseCacheNamespace` 用 `%p`（连接池地址）作键，
  且 `t.Cleanup` 会关闭并 DROP 每个测试库，地址复用即可让两条无关连接共享命名空间。
  本机已用一次性探针实测：连续开 12 个连接池只拿到 9 个不同地址，其中一个地址被复用 3 次。
- **修复取向**：缓存键改为「逻辑数据库身份」（DSN 的 `host:port/dbname`），而不是「对象地址」。
  这样既保留生产环境单库缓存的意义，又在测试中天然隔离；两个指向同一库的连接池共享缓存是正确语义。
  命名空间不含账号密码（只取 host/dbname），避免把凭据长期留在缓存键里。
- **确定性守卫**：地址复用是否发生取决于 GC，无法在单测里强制。因此守卫断言的是**不变式**
  （两条连接的缓存键必须不同），而 `TestMigrateDataScopePolicyIgnoresForeignCachedVerdict` 复现的是
  **CI 的失败序列**（旧连接投毒 → 新连接仍须自建）。两者都在旧实现下会失败（已实测）。
- **根因先行（前端）**：Arco `Sider` 的 `transition: width` 默认 200ms；原用例 `click()` 后立刻
  `boundingBox()`，而 `await expect(sidebar).toBeVisible()` 因元素本来就可见而立即返回，等于没有等待。
- **前端修复取向**：复用仓库既有模式。`tests/smoke/platform/shell-top-panels.spec.ts` 已有
  「等盒模型签名稳定 + 等 `getAnimations()` 全部 finished」的 `settlePanel`，本包把它抽成共享助手
  `settleElementLayout` 并同时被两处使用，避免复制一段 20 行助手触发 SonarCloud 新代码重复率。
  额外加 `toHaveClass(/arco-layout-sider-collapsed/)` 作为确定性的状态信号：它验证折叠状态真的翻转，
  也保证过渡动画已经开始，消除「两帧读数相同=已稳定」的误判窗口。

## Structural Scope

- Affected Subgraph:
  `testmysql.Open → buildDatabaseCacheNamespace → tableExistCache/userDeptCache → MigrateDataScopePolicy`
  与 `platform-shell-critical.spec → AppLayout collapse state → Arco Sider width transition`。
- Boundary Crossings: 无；改动只落在测试基础设施与一个进程内缓存键函数。
- Risk Nodes: 缓存命名空间若过粗会跨库串号（本次修复的对象）；若过细（含随机量）会让生产缓存永久失效。
  以 DSN 的 host+dbname 取值，既不串号也不会随机失效。
- Graph Focus: 门禁信号可信度 vs. 测试基建改动面之间的取舍。

## Execution Roles

- Implementer Posture: 先取 CI 失败证据与根因，再动手；修复必须消除竞态而非放宽断言。
- Reviewer Posture: 复核「旧实现下新测试会失败、新实现下稳定通过」这一对照是否真实；
  复核 `settleElementLayout` 未改变任何阈值；复核缓存键不含凭据。
- 实现前先读 `.github/workflows/smoke-core.yml`、`frontend/playwright.config.ts` 与 CI 失败日志。

## Dependency Plan

| Wave | 优先级 | 工作项 | 依赖 | 关闭条件 |
| --- | --- | --- | --- | --- |
| 0 | P1 | 取 CI 失败日志，定位两处根因并实测地址复用 | 无 | 两处根因均有日志/实测证据 |
| 1 | P1 | Go 连接身份缓存键 + 两条回归测试 | Wave 0 | 旧实现下新测试失败、新实现下稳定通过 |
| 2 | P1 | 共享布局助手 + 两处 spec 接入 | Wave 0 | 本机真实栈跑通该 spec |
| 3 | P1 | 任务包 + failure registry + PR + CI | Wave 1,2 | 本地门禁全绿、CI 全绿 |

## Verification Plan

- Static: `gofmt -l`、`go vet`、`go build ./...`、`npx tsc --noEmit`、
  `npx eslint <改动文件> --max-warnings 0`。
- Unit: `go test ./pkg/database/ -run TestConnectionCacheNamespace`；
  `go test ./internal/middleware/ -run 'TestDataScope|TestMigrateDataScopePolicy|...'`。
- Regression（对照实验）：临时把 `buildDatabaseCacheNamespace` 还原为 `%p` 实现，在
  `GOGC=20` 下 `go test ./internal/middleware/ -count=25` 必须失败；换回修复后必须稳定通过。
- Runtime: 本机启动真实后端（MySQL + Redis）与 Vite，执行
  `npx playwright test tests/smoke-core/platform-shell-critical.spec.ts`，用真实浏览器验证折叠/展开。
- Repo gates: `node scripts/check-pr-governance.mjs`、`node scripts/check-duplication.mjs`、
  `node scripts/harness/*.mjs --strict`（adoption / task-packet / evidence / failure-registry /
  doc-frontmatter / doc-links / doc-inventory / method-health / template-health / sync-drift）。
- Browser evidence: 本机 Playwright 实跑该 spec 的通过输出（`browserEvidence` 记录）。

## Evidence Required

- `.harness/evidence/2026-10-12-flake-signal-remediation/commands.json`：每条命令的执行目录、状态与真实输出摘要。
- `summary.md`：两处根因、修复映射、对照实验结果与残余风险。
- `review.md`：结论与复核要点，含「哪些是本机实跑、哪些由 CI 判定」的显式区分。
- 静态推断与运行复现分别标记；本机未执行的项目不得写成已通过。

## Human Gates

- 是否把 Core Smoke 从报告制转为阻塞制属治理决定，需按 `tests/smoke-core/README.md` 的连续全绿规则
  由维护者拍板，本包不做。
- 若维护者认为「连接身份用 DSN」在生产上不够严格（如同一 DSN 指向不同物理库），需改为显式注入库标识，
  该决定留在维护者触点。

## Linkage

- Task ID: `2026-10-12-flake-signal-remediation`
- Task Manifest: `.harness/tasks/2026-10-12-flake-signal-remediation/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Evidence Directory: `.harness/evidence/2026-10-12-flake-signal-remediation/`
- Review File: `.harness/evidence/2026-10-12-flake-signal-remediation/review.md`
- Plan References: `docs/harness/failure-registry.md`、`.github/workflows/smoke-core.yml`
- Assessment: `docs/harness/tasks/2026-10-12-flake-signal-remediation.task.md`

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [ ] Go 缓存键改为连接身份；旧实现下新回归测试失败、新实现下稳定通过
- [ ] 前端折叠用例不再读动画中间值；本机真实栈 Playwright 跑通
- [ ] 共享布局助手已抽出，两处 spec 均使用，无新增重复代码
- [ ] failure registry 新增 FR-012 / FR-013
- [ ] CI 实跑确认：主干 CI 与 Core Smoke 均为绿
