## 变更摘要

- 改动层级：platform（版本与发布文档 + release manifest 的共享面清单 + `.harness/` 任务档案；无后端源码、前端源码、schema、路由、权限、菜单键、i18n 键改动）
- 改动模块：`VERSION`、`CHANGELOG.md`、`docs/release-notes/`（新增 v0.18.2 说明 + 双语索引）、`.harness/STATUS.md`、`scripts/foundation-release/build-release-manifest.mjs`、`scripts/foundation-release/frontend-ownership.mjs`、`tests/scripts/foundation-release/{build-release-manifest,cut-foundation-release}.test.mjs`、任务包 `2026-10-31-v0182-menu-contract-shared-surface` 与其证据（含 `notes/` 三份发布文本）
- 目标问题：`main` 自 v0.18.1 合并了 9 个修复，其中 #471 修复的
  `frontend/scripts/check-menu-contract.mjs` 与 `pantheon-ops` 的副本逐字节相同（diff 为空）、
  且由消费仓前端 `prebuild` 执行，但该文件不在 release manifest 的 `sharedPaths` 里——任何 release
  都不会替换消费仓的这份副本，因此 #471 的解析器修复对消费仓永久不可达。同时 `main` 上的
  `backend/modules/business/retired_modules.go`（#477）也尚未随 release 交付。
- 预期影响：`sharedPaths` 52 → 53（新增 `frontend/scripts/check-menu-contract.mjs`，并列入
  `requiredFrontendEntries` 防止再次漏登记）；切 `pantheon-base-v0.18.2`（patch，`release/0.18`）。
  消费仓重建后由修复后的传感器执行菜单契约检查，`check:shared-drift` 回到 0 modified。

## Harness 链路

- Task ID：`2026-10-31-v0182-menu-contract-shared-surface`
- Task Manifest：`.harness/tasks/2026-10-31-v0182-menu-contract-shared-surface/manifest.json`
- Evidence：`.harness/evidence/2026-10-31-v0182-menu-contract-shared-surface/commands.json`
- Verification evidence：`.harness/evidence/2026-10-31-v0182-menu-contract-shared-surface/summary.md`
- Review Artifact：`.harness/evidence/2026-10-31-v0182-menu-contract-shared-surface/review.md`
- OpenSpec change：none
- Trivial change：no
- Quality Profile：ci-workflow
- Ratchet Decision：registry-only
- GitHub Signal：repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-10-31-v0182-menu-contract-shared-surface
- task manifest: .harness/tasks/2026-10-31-v0182-menu-contract-shared-surface/manifest.json
- evidence: .harness/evidence/2026-10-31-v0182-menu-contract-shared-surface/commands.json
- boundaries: 只改版本与发布文档、release manifest 的共享面清单及其测试、任务档案；未改 backend、frontend/src、frontend/scripts 内容、workflow、门禁阈值、sonar 配置或依赖
- backend response contract: unchanged（无后端源码改动）
- backend DTO contract: unchanged（无后端源码改动）
- permission contract: unchanged（未新增或删除权限码）
- audit coverage: unchanged（无审计链路改动）
- visual evidence: not-applicable（无 UI 改动）
- inheritance contract: `sharedPaths` 52 → 53；`rebuild-from-base.mjs` 与 `check-shared-drift.mjs` 从 lock 读清单，消费仓脚本无需改动
- base drift: 分支基于 `main` @ `beace427`（v0.18.1 之后的最后一个合并提交）
- Base/ops inheritance: 发布后 `pantheon-ops` 推进锁到 0.18.2 并重建，属消费仓独立提交；预期重建前 2 个 modified、重建后 0

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

补充说明：共享面登记属于发布契约的枚举修复，不是新增共享范围——消费仓早就在执行这个文件，只是从未
被声明。版本判定为 patch 的依据写在
`docs/harness/tasks/2026-10-31-v0182-menu-contract-shared-surface.task.md`：
`docs/VERSION_MANAGEMENT_GUIDE.md` §2.4 把 bug fix 与兼容性补丁列为 patch，本批提交都是修复，
没有新增消费能力或架构波次。

## 验证记录

- [x] `git diff --name-status pantheon-base-v0.18.1..origin/main | grep '^[MAD]'` → `backend/`、`frontend/`、`pkg/` 下只有 `backend/modules/business/retired_modules.go` 与 `frontend/scripts/check-menu-contract.mjs`
- [x] `diff pantheon-ops/frontend/scripts/check-menu-contract.mjs <(git show pantheon-base-v0.18.1:frontend/scripts/check-menu-contract.mjs)` → 空（逐字节相同）
- [x] 同一比较对 `origin/main` → 有差异，差的就是 #471
- [x] `sharedPaths` 计数：backend 4 + frontend 47 + docs 2 = **53**，`frontend/scripts/check-menu-contract.mjs` 已声明
- [x] `node frontend/scripts/check-menu-contract.mjs` → `✅ manifest / menu seed 一致性检查通过（19 个菜单，23 条路由，102 个权限，23 个组件键）`
- [x] `npm run test:menu-contract` → 10 tests / 10 pass / 0 fail
- [x] `node --test tests/scripts/foundation-release/*.test.mjs` → 57 tests / 57 pass / 0 fail（fixture 首跑缺新条目，补 fixture 而非放宽断言）
- [x] `cat VERSION` → `0.18.2`；`pantheon-base-v0.18.2` 在 CHANGELOG、发布说明、STATUS 均有一处，双语索引已指向新版本
- [x] `check:task-packet`（新包 PASS）、`check:task-packet-template`、`check:structure`（0/2966）、`check:harness-encoding`（0/2618）、`check:doc-inventory`（0 finding）
- [x] `node scripts/harness/check-failure-registry.mjs --strict` → 1 file, 0 error, 0 warning
- [x] `node scripts/harness/check-evidence.mjs --strict`、`check-review.mjs --strict` → 4 file(s), 0 error
- [ ] 发布后：四件产物、`Foundation Release Verify`、`pantheon-ops` 对 0.18.2 的 drift 与后端/前端构建
  —— 见 `commands.json` 的 `knownGaps`，prep PR 合并后在 `main` 上执行并回填

## 审核留痕

- Copilot review：见 PR 机器人读数；本 PR 为版本元数据 + 一处共享面登记 + 测试期望同步
- CodeQL 结果：无产品源码改动；以 PR checks 为准
- GitHub checks 结果：见 PR checks 读数
- Auto-merge：由 `pr-automation.yml` 在 checks 全绿后启用 squash auto-merge（与 v0.18.0/v0.18.1 同一路径）
- Duplication Gate 结果：以 PR checks 为准
- 是否高风险改动：否（无迁移、无权限、无 workflow、无 secrets；共享面变化已由字节比对支撑）
- Residual risk / follow-up：
  - 发布使用维护者已登录的 `gh` 会话调度 `Foundation Release Cut`，tag 与 Release 一经创建不可回退。
  - `sharedPaths` 形态从 52 变 53，消费仓若在自有工具里硬编码条目数需要同步；`rebuild-from-base` 与 `check-shared-drift` 均从 lock 读取，无需改代码。
  - 重建前 `check:shared-drift` 会把两个共享文件读成 modified，属共享面扩大的过渡读数；重建后应为 0。
  - `check:docs-frontmatter` / harness-docs 系列按 checkout 根解析 `../../pantheon-harness`，在发布工作树内不可达，以主 checkout 与本次 PR checks 为准。
  - `pantheon-ops` 的锁推进与 live 树替换属该仓库 L2 门禁，读数记录在证据里、提交留给该仓库评审。

## 检查清单

- [x] 已明确本次改动归属 `platform`，未把系统域职责混写
- [x] 未改任何门禁规则、workflow、Sonar 配置，未使用 `NOSONAR` 或规则排除
- [x] 未删除、未覆盖任何产品文件（登记是清单新增，文件内容未动）
- [x] 无后端、i18n、菜单键、授权、数据库或迁移变化
- [x] 已确认不会泄露敏感配置、账号密码或 Token：diff 只含版本号、发布说明、清单条目与证据文本
- [x] 已用字节比对证明消费仓副本与 v0.18.1 相同，登记依据可复核
- [x] `requiredFrontendEntries` 守卫已覆盖新条目，未来漏登记会在 manifest 构建期失败
