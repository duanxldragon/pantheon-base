## 变更摘要

- 改动层级：platform（`.harness/` 归档布局 + 三个治理脚本的引用解析），无产品行为、
  接口、路由、权限、i18n 或数据库变化
- 改动模块：`.harness/tasks/**` 与 `.harness/evidence/**`（`git mv` 归档）；
  `scripts/task-manifest.mjs`（新增 `findArchivedReferencePath` / `resolveArchiveAwarePath`）；
  `scripts/harness/check-task-packet.mjs`（`Review File` / `Contract Anchors` 改用解析器）；
  `scripts/harness/check-doc-links.mjs`（仓库内链接支持归档回退）；三个测试文件；
  `.harness/ARCHIVE.md`（统计改为实测口径）；`docs/harness/failure-registry.md`（`FR-019`）；
  `.harness/STATUS.md`
- 目标问题：`.harness/` 下 88 个 manifest 里 87 个是 `completed`，活跃目录几乎全是结案工作；
  但直接移动会打断规范路径引用——实测 `check:task-packet` 警告 42 → 86，
  `check:harness-docs` 红在三条 `docs/reviews` 链接上
- 预期影响：87 个任务目录与 89 份证据按月归档（176 次 `git mv`、0 冲突），归档总量
  116 → 203 个任务、120 → 209 份证据；引用继续使用 `.harness/tasks/...` /
  `.harness/evidence/...` 的规范写法，由解析器在活跃目录与归档之间定位；
  `check:task-packet` 终态 14 条警告（全部真实）、`check:harness-docs` 0 findings；
  不删除、不覆盖任何文件，不改门禁策略

## Harness 链路

- Task ID：`2026-10-29-harness-task-archive`
- Task Manifest：`.harness/tasks/2026-10-29-harness-task-archive/manifest.json`
- Evidence：`.harness/evidence/2026-10-29-harness-task-archive/commands.json`
- Verification evidence：`.harness/evidence/2026-10-29-harness-task-archive/summary.md`
- Review Artifact：`.harness/evidence/2026-10-29-harness-task-archive/review.md`
- OpenSpec change：none
- Trivial change：no
- Quality Profile：ci-workflow
- Ratchet Decision：sensor-added
- GitHub Signal：repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-10-29-harness-task-archive
- task manifest: .harness/tasks/2026-10-29-harness-task-archive/manifest.json
- evidence: .harness/evidence/2026-10-29-harness-task-archive/commands.json
- boundaries: 只动 `.harness/` 归档布局与 `scripts/` 下三个治理脚本及其测试；未改 backend / frontend / workflow / sonar 配置 / 依赖
- backend response contract: not-applicable（无后端改动）
- backend DTO contract: not-applicable（无后端改动）
- permission contract: unchanged（无权限链路改动）
- audit coverage: unchanged（无审计链路改动）
- visual evidence: not-applicable（无 UI 改动）
- inheritance contract: 未改 sharedPaths 或继承合同；`pantheon-ops` 无需动作
- base drift: 分支基于 `main` @ `9c97a01c`（PR #465 合并后的提交）
- Base/ops inheritance: 无同步要求；归档与解析器自包含于 base 仓库

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

补充说明：改动落在 `platform` 层，只影响仓库自有的治理工具与历史证据存放位置。
`.harness/` 不是下游消费面，`docs/harness/tasks/*.task.md` 也未移动，因此
`check-task-packet` 对历史任务包的结构约束保持不变。

## 验证记录

- [x] 归档读数（`git ls-tree` 前后对照）：2026-07 26/31 不变、2026-08 23/23 不变、
  2026-09 67→72 任务 / 66→70 证据、2026-10 0→82 任务 / 0→85 证据；
  活跃 `.harness/tasks` 88 → 1（`in-progress` 的 `2026-10-27-codebase-simplification-program`）
- [x] `check:task-packet` 三条读数：归档前 **42** → 移动后无回退 **86** → 有回退 **14**
  （42 条中 28 条是 2026-09-25 轮次留下的假警告，真实基线是 14）
- [x] `check:harness-docs`：移动后 **3 findings**（三条 `docs/reviews` 链接）→ 回退后 **0 findings**
- [x] `node --test` 三个受影响测试文件 → 19 用例全过；`npm run test:scripts` → **171/171**
- [x] `check:structure`（0/2895）、`check:harness-encoding`（0/2547）、
  `check:docs-frontmatter`（393 docs / 275 带 frontmatter）、`check:harness-inventory`、
  `check:harness-adoption`、`check:harness-visual`、`check:ui-quality-gate`、
  `check:duplication`、`check:failure-registry` → 全部通过
- [x] `check-boundaries.mjs --strict`、`check-runtime-evidence.mjs --strict` → 无新增 finding
- [x] `node scripts/harness/check-evidence.mjs --strict`、`check-review.mjs --strict` → exit 0

## 审核留痕

- Copilot review：见 PR 机器人读数；本 PR 无需人工豁免
- CodeQL 结果：仅 Node 脚本与历史文件移动，预计无新增告警；以 PR checks 为准
- GitHub checks 结果：见 PR checks 读数
- Auto-merge：disabled（62 个文件以外的 562 次移动需要人工确认归档面）
- Duplication Gate 结果：`Result: PASS`；解析器通过 `listArchiveMonths` 与
  `ARCHIVABLE_TREES` 共享路径遍历，未复制月份枚举逻辑
- 是否高风险改动：否（治理脚本与历史目录移动；不触碰 `system/*`、`pkg/*`、workflow、secrets）
- Residual risk / follow-up：
  - `check-evidence` / `check-review` 的"空集合即报错"语义未改；本包保留一份活跃证据，
    因此当前读数为绿，但下一轮把这份也归档时会再次触发，属门禁策略决定。
  - `docs/harness/tasks/*.task.md` 未随 manifest 迁移（沿用 2026-09-25 轮次约定），
    "已归档"由 manifest 定义。
  - `2026-09-10-tenant-verification-and-gray` 的两份 png 与归档副本内容不同
    （62609/39527 对 60379/39304），以及两份无归属 PR 正文，均原地保留待维护者处置。

## 检查清单

- [x] 已明确本次改动归属 `platform`，未把系统域职责混写
- [x] 未改任何门禁规则、workflow、Sonar 配置，未使用 `NOSONAR` 或规则排除
- [x] 未删除、未覆盖任何文件：562 次移动全部是 `git mv`，三处残余逐条记录
- [x] 无前端、i18n、菜单、授权、数据库或迁移变化
- [x] 已确认不会泄露敏感配置、账号密码或 Token：diff 只含脚本、测试、索引与历史文件移动
- [x] 已把"归档破坏规范引用"的失败模式登记为 `FR-019` 并落地解析器与回归测试
