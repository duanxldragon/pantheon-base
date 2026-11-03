---
title: 审计 P3 残留三条收口（AUD-021 / AUD-025 / AUD-028）
doc_type: Remediation
layer: platform
status: Archived
depends_on_layers: []
linked_contracts:
  - docs/contracts/DOCUMENT_METADATA_AND_STATUS.md
  - docs/contracts/DOCUMENT_FRONTMATTER_SCHEMA.md
updated_at: 2026-11-01
---

# Task Packet: 2026-10-31-audit-p3-residual-closeout

## Goal

programme 收口时明确登记了三条未处置的 P3：AUD-021（生成侧仍能碰到已退役的 `FilterPanel`）、
AUD-025（`Active` 文档没有复核时效）、AUD-028（`main.go` 里一个什么都没约束的 `context.WithTimeout`）。
三条都不阻断冻结，但“登记为 gap”和“处置掉”是两件事——本包把三条各自做完，并且每条都要留下一个
**读数**，而不是只留下一次编辑。

收口的判据不是“代码变了”，而是：改完之后，同样的门禁能挡住这类回退，且该判据被负向验证过。

## Primary Layer

platform

## Dependency Layers

- `platform`（前端门禁脚本、文档元数据门禁、进程启动）
- 不触碰租户模型、认证链路、迁移、路由与任何业务域。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: none
- Release Requirement: foundation-release
- Downstream Sync Note: 三条均无 API 面与运行时行为变化（AUD-028 删的是一个空转的 cancel），随下一次 foundation release 自然送达。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `maintainability`
- Portable Failure Class: `doc-code-drift`
- Owner Layer: `foundation-source`
- Ratchet Decision: `gate-updated`
- Coverage Dimensions:
  - maintainability
  - behaviour
  - architecture-fitness

交付层级：**L1**（门禁脚本、文档契约、启动代码；无安全语义、无数据面变化）。

## Contract Anchors

- `docs/contracts/DOCUMENT_METADATA_AND_STATUS.md` §4.2（`Active` 的语义）与 §6.5（本包新增的 90 天复核窗口）。
- `docs/contracts/DOCUMENT_FRONTMATTER_SCHEMA.md` §11（门禁覆盖边界：哪些目录强制、哪些只报告）。
- `docs/frontend/DESIGN_ENGINEERING_GUIDE.md`（列表页筛选区必须使用 `SearchToolbar`）。
- `docs/frontend/UI_PATTERN_LIBRARY.md`（`SearchToolbar` 示例仅作历史兼容保留）。

## Scope

### In

- AUD-021：删掉 `frontend/src/modules/lowcode/templates/{listTemplate.ts,index.ts}` 里对
  `FilterPanel` 的死 import；**并撤销 `check-search-toolbar-contract.mjs` 对该目录的整体豁免**
  （`EXEMPT_SEGMENTS`），让模板目录回到普通被检对象；补两条锁（生成器侧 + 门禁侧）。
- AUD-021 顺带：该 checker 的文档指针与错误文案原本都写 `DESIGN.md §7.2`，而仓库里已无此文件
  （现为 `docs/frontend/DESIGN_ENGINEERING_GUIDE.md §8.1` + `UI_PATTERN_LIBRARY.md`）。
  反正要改这个文件，一并改正，避免下一位贡献者去找一个不存在的文档。
- AUD-025：在 `scripts/frontmatter-check.mjs` 增加“`Active` 文档超过 90 天未复核”的**计数**输出
  （`--report-overdue` 逐条），并写进 `DOCUMENT_METADATA_AND_STATUS` §6.5 中英双版；
  明确它是**可见性**而不是 error。
- AUD-028：删掉 `backend/cmd/server/main.go` 里 `_, cancel := context.WithTimeout(...)`——
  `telemetry.InitTracer` 不收 context，这个 timeout 约束不到任何东西，`cancel` 只在本函数返回时触发。

### Out

- 删除 `frontend/src/modules/lowcode/templates/` 整个目录（1,894 行死代码）。它是 AUD-021 的成因，
  但删除是独立动作，需单独决策；本包只把它登记为残留项 `AUD-021b`。
- 给 144 份逾期 `Active` 文档逐份改 `updated_at` 或降级。这正是 §6.5 明令禁止的动作。
- 把 90 天窗口做成 error，或调整 `ENFORCED_DIR_PREFIXES` 的覆盖边界。
- 改动 `telemetry.InitTracer` 的签名、给启动加新的超时策略。
- 触碰 `VERSION`、`CHANGELOG.md`。

## Expected Files

### Create

- `docs/harness/tasks/2026-10-31-audit-p3-residual-closeout.task.md`
- `.harness/tasks/2026-10-31-audit-p3-residual-closeout/manifest.json`
- `.harness/evidence/2026-10-31-audit-p3-residual-closeout/{commands.json,summary.md,review.md}`

### Modify

- `frontend/src/modules/lowcode/templates/listTemplate.ts`
- `frontend/src/modules/lowcode/templates/index.ts`
- `frontend/scripts/check-search-toolbar-contract.mjs`
- `tests/scripts/check-search-toolbar-contract.test.mjs`
- `frontend/tests/generator/generator-quality-contract.test.ts`
- `scripts/frontmatter-check.mjs`
- `tests/docs/frontmatter-check.test.mjs`
- `docs/contracts/DOCUMENT_METADATA_AND_STATUS.md`
- `docs/contracts/DOCUMENT_METADATA_AND_STATUS.en.md`
- `backend/cmd/server/main.go`

### Do Not Touch

- `backend/pkg/telemetry/**`（`InitTracer` 签名）
- `backend/internal/middleware/**`、`backend/modules/**`
- `frontend/src/modules/lowcode/templates/` 下的其余文件（只改两个 `.ts` 的 import 行）
- `docs/contracts/DOCUMENT_FRONTMATTER_SCHEMA.md`（§11 边界不变）
- `VERSION`、`CHANGELOG.md`

## Implementation Notes

- AUD-021 的真正成因不是“模板里多了一行 import”，而是**整体豁免**：`lowcode/templates` 自 #120 起被
  `tsconfig.app.json` exclude、全仓零 import，它根本不参与构建，却被当成“过渡期”理由让门禁整目录放行。
  只删 import 而不撤豁免，下一次照样能加回去。所以两条一起做，并且**撤豁免必须负向验证**：
  把 `FilterPanel` 塞回模板，门禁要变红。
- 生成器侧的锁（`generator-quality-contract` 第 14 条）与门禁侧的锁（checker 第 10 条）覆盖的是两件不同的事：
  前者断言“产物用 `SearchToolbar` 且不含 `FilterPanel`”，后者断言“模板目录不再是豁免区”。缺一条都留缝。
- AUD-025 刻意**不做成 error**：一次性 100+ 份逾期，唯一能让门禁变绿的过门方式就是批量改日期，
  而批量改日期恰好摧毁这条规则想保护的东西。判据是“可见”，不是“变绿”。
- AUD-025 的读数要与审计报告对账：审计写的是“102 份 / 60 天”，本包实测是“144 份 / 90 天”。
  口径不同，不复现，以实测为准，并在契约里写明这一点，避免下一位维护者以为是回归。
- AUD-028 的注释要解释**为什么这里没有 timeout**，否则下一个人会“好心”加回来。
  真正需要 timeout 的是 shutdown 那段，那里 `tp.Shutdown` 收 ctx。

## Verification Plan

- `cd frontend && node scripts/check-search-toolbar-contract.mjs` → 0 findings（106 文件，撤豁免后比原来多 4 个）
- 负向：把 `FilterPanel` 塞回 `templates/listTemplate.ts` → 同命令必须 exit 1 并报 `no-filter-panel`
- `npm run test:search-toolbar-contract` → 10/10；负向：恢复豁免 → 第 10 条必须红
- `cd frontend && npm run test:generator:quality` → 14/14；负向：把 `FilterPanel` 拼回生成器 → 第 14 条必须红
- `node scripts/frontmatter-check.mjs` → 通过，并输出逾期份数；`--report-overdue` 可逐条列出
- `npm run test:docs-frontmatter` → 14/14；负向：让逾期文档变红 → 第 14 条必须红
- `cd backend && go build ./... && go vet ./cmd/server/ && gofmt -l cmd/server/main.go`（gofmt 无输出）
- `cd frontend && npx tsc -b`
- `node scripts/harness/check-evidence.mjs --root . --strict`、`check-review.mjs --root . --strict`

## Linkage

- Task ID: `2026-10-31-audit-p3-residual-closeout`
- Task Manifest: `.harness/tasks/2026-10-31-audit-p3-residual-closeout/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-10-31.md` §11（AUD-021/025/028）、§12.3
- Evidence Directory: `.harness/evidence/2026-10-31-audit-p3-residual-closeout/`
- Review File: `.harness/evidence/2026-10-31-audit-p3-residual-closeout/review.md`

## Evidence Required

- `commands.json`：三条各自的“正向读数 + 负向读数”成对记录；AUD-025 附真实仓库读数（144 / 71 / 73）。
- `summary.md`：为什么撤豁免比删 import 更关键、为什么 90 天窗口不做成 error、`templates/` 目录的处置建议。
- `review.md`：逐条 reviewer posture，含“这条锁真的会红吗”的反向检查。

## Human Gates

- 撤销门禁豁免会收紧 CI，若下游 `pantheon-ops` 有自己的 `lowcode/templates` 副本并依赖豁免，
  需维护者确认后再随 release 送达（已核对：ops 侧仅 `.foundation/releases/*/bundle/` 历史快照内有同名文件，活动代码不引用）。
- `templates/` 目录的最终删除（1,894 行）属独立决策，不由本包代做。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] AUD-021：模板目录不再豁免，且塞回 `FilterPanel` 会让门禁变红
- [x] AUD-025：90 天窗口有读数、有契约、有锁，且不阻断构建
- [x] AUD-028：死 `context.WithTimeout` 已删，且原地写明“为什么这里不需要 timeout”

## Execution Result

**状态：completed（2026-11-01）。**
证据：`.harness/evidence/2026-10-31-audit-p3-residual-closeout/`。

### 三条各自的“先红后绿”

| 项 | 负向读数 | 正向读数 |
| --- | --- | --- |
| AUD-021 门禁侧 | 撤豁免后把 `FilterPanel` 塞回 `templates/listTemplate.ts` → `1 finding(s)`，`no-filter-panel`，exit 1 | 恢复 → `0 finding(s) across 106 module file(s)` |
| AUD-021 锁侧 | 恢复 `EXEMPT_SEGMENTS` → `not ok 10`，`# fail 1` | 无豁免 → `ok 10`，`# pass 10` |
| AUD-021 生成器侧 | 把 `FilterPanel` 拼回 `frontendGenerator.ts` → `not ok 14` | 恢复 → `# pass 14 # fail 0` |
| AUD-025 | 让逾期文档参与 `ok` 判定 → `not ok 14`，`overdue docs must not fail the gate / false !== true` | 不计入 → `# pass 14 # fail 0` |
| AUD-028 | 无（删除类改动，无行为可红） | `go build` / `go vet` / `gofmt -l` 全清 |

### 改了什么

- AUD-021：删 `listTemplate.ts:36`、`index.ts:139` 的死 import；删
  `check-search-toolbar-contract.mjs` 的 `EXEMPT_SEGMENTS` 与引用它的 filter 条件（文件从 102 → 106 个被检对象）；
  顺带把该脚本里两处指向已不存在的 `DESIGN.md §7.2` 的引用改成
  `docs/frontend/DESIGN_ENGINEERING_GUIDE.md §8.1`；
  新增 `generator-quality-contract` 第 14 条与 checker 第 10 条。
- AUD-025：`frontmatter-check.mjs` 新增 `ACTIVE_REVIEW_WINDOW_DAYS = 90`、`activeReviewOverdue` 收集与
  控制台输出行；`DOCUMENT_METADATA_AND_STATUS` 中英双版新增 §6.5；`tests/docs` 新增第 14 条。
- AUD-028：`main.go` 删掉 `_, cancel := context.WithTimeout(...)`，原地留下 5 行注释解释
  “这里为什么不设 timeout”。`context` 包仍被 shutdown 段（`:81` / `:194` / `:219`）使用，import 未动。

### 没改什么

`InitTracer` 签名、shutdown 超时、`ENFORCED_DIR_PREFIXES`、任何 `Active` 文档的 `updated_at`、
`templates/` 目录本身、`VERSION`、`CHANGELOG.md`。

### 显式 gap

1. `templates/` 目录 1,894 行死代码仍在（登记为 `AUD-021b`）。本包只撤掉了它带来的豁免与误导。
2. 90 天窗口只报告不拦截，因此“144 份逾期”不会自己变少；它需要一次人工复核轮，不在本包范围。
3. 审计报告 §11 的“102 份 / 60 天”与本次实测“144 份 / 90 天”口径不同，未复现审计口径。
4. 原本另有一条文案漂移残留（checker 指向不存在的 `DESIGN.md §7.2`），因本包已经在改该文件，
   一并修掉了，不再作为残留登记。
