---
title: 三个隐形 strict 红灯收口（boundary ratchet、11 个 runtime gap、8 条继承标记）
doc_type: Remediation
layer: platform
depends_on_layers:
  - system/iam
  - app
status: Active
linked_contracts:
  - docs/designs/REPOSITORY_LAYOUT.md
  - docs/harness/VERIFICATION_EVIDENCE_SPEC.md
  - docs/harness/FAILURE_RATCHET_POLICY.md
updated_at: 2026-10-26
---

# Task Packet: 2026-10-26-governance-red-checkers-closure

## Goal

上一轮（`2026-10-26-governance-evidence-schema-backfill`）把 `check-evidence` / `check-review` 的历史红归零后，
如实登记了 3 个仍在红灯的 strict 检查器（G-03/G-04/G-05），本轮把这 3 个红灯按它们各自的既有契约收掉：

1. **G-04 / P2** `scripts/harness/check-boundaries.mjs --root . --strict` 报 1 条 finding：
   `frontend/src/modules/platform/widgets.tsx:1` 以 type-only 方式 import `../system/iam/menu/api` 的 `MenuNode`，
   platform 伸手进 sibling system 层。该违规自 2026-09-22 冻结在 `config/boundary-baseline.json`，
   条目自带 ratchet：「promote MenuNode to a shared contract type (frontend/src/api)」。
2. **G-03 / P3** `scripts/harness/check-runtime-evidence.mjs --root . --strict` 0 error / 11 warning 且退出码 1
   （本 checker 的 warning 同样阻断 strict）：11 个被 manifest 判为 runtime-sensitive 的历史 `commands.json`
   既无 `runtimeLogs/Metrics/Traces/Performance` 信号，也没有 `runtimeGap`。
3. **G-05 / P3** `scripts/harness/check-inheritance-contract.mjs --root .. --strict`（workspace 根形式）8 finding：
   `docs/WORKSPACE_INHERITANCE.md` 缺 3 条标记、`pantheon-ops/docs/PROJECT_INHERITANCE.md` 缺 3 条标记且 Base 版本未固定、
   workspace 根缺 `.github/pull_request_template.md`。

收口标准是三个 checker 各自返回退出码 0，且全仓治理矩阵（24 个 strict 检查器）在收口后仍全绿——
不是放宽任何 checker、不是把违规写进基线、不是改历史结论。

## Primary Layer

platform

G-04 是底座跨层契约（`REPOSITORY_LAYOUT.md` §8.1/§8.2/§8.3）的收口；G-03 是仓库级治理工件；
G-05 落在 workspace 与 ops 的继承文档上，但门禁脚本与其契约源都在 `pantheon-base`，按 Base-first 在 base 侧记录。

## Dependency Layers

- `system/iam`：`MenuNode` 定义在 `frontend/src/modules/system/iam/menu/api.ts`，提升到公共契约后该模块改为再导出，
  菜单模块自身与其调用方（`MenuList.tsx`、`role/RoleList.tsx`、`core/layout/*`、`store/useMenuStore.ts`）行为不变。
- `app`：前端编译与 lint 门禁（`tsc -b`、`eslint --max-warnings 0`）与 `check:menu-contract` 是本轮唯一的运行时邻近验证。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `governance-evidence-integrity`
- Portable Failure Class: `static-sensor-gap` / `architecture-drift`
- Owner Layer: `consumer-repository`
- Ratchet Decision: `guide-updated`（`scripts/harness/README.md` / `README.zh.md` 写明两个检查器的正确调用形式；
  接入 CI 属门禁策略变更，留给维护者）
- Coverage Dimensions:
  - method-health
  - architecture-fitness

## Contract Anchors

- `docs/designs/REPOSITORY_LAYOUT.md` §8.1（公共契约前端位置 = `frontend/src/api`）、§8.2（依赖方向矩阵）、
  §8.3（基线条目的 ratchet 就是它的修复方案，条件具备时应执行并删除条目）。
- `config/boundary-baseline.json` 的 `description`：条目必须持续匹配真实 finding，陈旧条目会让 `--strict` 失败。
- `scripts/harness/check-runtime-evidence.mjs`：`runtimeGap` 非空字符串或 `knownGaps` 命中 runtime 关键词即消警，
  warning 在 `--strict` 下退出码 1。
- `scripts/harness/check-inheritance-contract.mjs`：标记为大小写敏感的 `includes` 字面匹配，
  `Base version:` 需匹配 ``/Base version:\s*`([^`]+)`(?:\s*\(`([0-9a-f]{40})`\))?/i``。
- `docs/harness/FAILURE_RATCHET_POLICY.md`：同类失败第二次出现（FR-016 同一根因）时如何升级为 guide / sensor / gate。

## Scope

### In

- 执行 G-04 的 ratchet：新建 `frontend/src/api/menu.ts` 承载 `MenuNode`，`modules/system/iam/menu/api.ts` 改为导入并再导出，
  `modules/platform/widgets.tsx` 改 import 共享契约；删除 `config/boundary-baseline.json` 中因此变陈旧的条目（基线现为空），
  并在 `REPOSITORY_LAYOUT.md` §8.3 记录按期收口。
- 为 11 个历史 `commands.json` 追加 `runtimeGap` 字符串：只补 schema 字段，
  内容回述该轮自己 `commands.json` / `summary.md` / `review.md` 里已有的事实，绝不触碰 `commands[].status`。
- 补齐继承契约标记：`docs/WORKSPACE_INHERITANCE.md` 三条、`pantheon-ops/docs/PROJECT_INHERITANCE.md` 三条 + 固定 Base 版本
  （`pantheon-base-v0.16.1` / `c83f8e4c…`，与 `foundation-release.lock.json` 和 `.business-overlay-report.json` 一致）、
  workspace 根 `.github/pull_request_template.md`，并把同一组 drift 标记落到 ops 实际使用的
  `.github/PULL_REQUEST_TEMPLATE.md`。
- 在 `scripts/harness/README.md` / `README.zh.md` 记录两个隐形检查器的调用形式（workspace 根 vs 仓库根、裸 `--strict` vs CI `--baseline`）。
- 复跑 24 个 strict 检查器与前端/后端构建门禁，把逐条前后读数登记进本轮 evidence。
- 在 `docs/harness/failure-registry.md` 增加 FR-017（三个检查器无人调用 → 红灯不可见），
  并修正 FR-016 里 `docs-governance` 步骤数的事实（实测 17）。

### Out

- 不修改任何 checker 的判定逻辑、枚举或扫描集合；不新增基线条目来消音。
- 不把 `check-runtime-evidence` / `check-inheritance-contract` / 裸 `--strict` 的 `check-boundaries` 接入 `.github/workflows/`
  （门禁策略变更需维护者批准，FR-016/FR-017 均记为 open）。
- 不改写任何历史轮次的验证结论、`commands[].status` 或缺口判断；G-03 只补字段。
- 不动 `frontend/src/core/**`、`frontend/src/store/**` 等经 `modules/system/iam/menu/api` 再导出仍可正常工作的调用方
  （它们不属任何被扫描层，跨层规则不适用）。
- 不在 ops 新增底座规范副本；ops 侧只补它自己继承文档与 PR 模板缺的标记。
- 不 commit、不 push、不开 PR（本轮未获该指令）。

## Expected Files

### Create

- `docs/harness/tasks/2026-10-26-governance-red-checkers-closure.task.md`
- `.harness/tasks/2026-10-26-governance-red-checkers-closure/manifest.json`
- `.harness/evidence/2026-10-26-governance-red-checkers-closure/commands.json`
- `.harness/evidence/2026-10-26-governance-red-checkers-closure/review.md`
- `.harness/evidence/2026-10-26-governance-red-checkers-closure/summary.md`
- `frontend/src/api/menu.ts`
- `.github/pull_request_template.md`（workspace 根，非 git 仓库，见 Implementation Notes）

### Modify

- `frontend/src/modules/system/iam/menu/api.ts`、`frontend/src/modules/platform/widgets.tsx`
- `config/boundary-baseline.json`（entries 清空 + description 记录收口日期）
- `docs/designs/REPOSITORY_LAYOUT.md`（§8.3）
- `.harness/evidence/{11 个历史轮次}/commands.json`（各 +1 行 `runtimeGap`）
- `docs/harness/failure-registry.md`（FR-016 事实修正 + FR-017 行 + Review Note）
- `scripts/harness/README.md`、`scripts/harness/README.zh.md`
- `../docs/WORKSPACE_INHERITANCE.md`（workspace 根）
- `../pantheon-ops/docs/PROJECT_INHERITANCE.md`、`../pantheon-ops/.github/PULL_REQUEST_TEMPLATE.md`

### Do Not Touch

- 任何 `commands.json` 的 `commands[].status` / `commands[].command` / 散文结论。
- `scripts/harness/check-boundaries.mjs`、`check-runtime-evidence.mjs`、`check-inheritance-contract.mjs` 的规则本体。
- `.harness/archive/**`、`dist/foundation-releases/**`。

## Implementation Notes

- `MenuNode` 只搬类型，不搬 `MenuPayload` / `MenuListQuery` / `apiRequest` 调用：跨层需要的只有契约类型，
  搬多余内容会把菜单模块的实现细节变成公共契约。`modules/system/iam/menu/api.ts` 用
  `import type { MenuNode } from '../../../../api/menu'; export type { MenuNode };` 保持 7 个既有调用方零改动。
- 基线条目必须删除而不是保留：`check-boundaries` 在 `--strict` 下把陈旧条目视为失败（2026-09-23 起），
  留着它等于给重新引入的 import 开后门。`reviewBy: 2026-12-31` 顶层字段保留（文件本身仍是 CI 引用的基线容器）。
- G-03 的 11 个文件全部 `1 insertion / 0 deletions`，且 `git diff | grep -E '^[+-]' | grep '"status"'` 为空——
  这是「只补结构、未动结论」的机械自证。上一轮同一证据形态用的是 `grep '"status"'`，会把上下文行算进来，本轮改用带 `^[+-]` 的版本。
- 其中两轮的 runtime 数据其实存在，只是不在结构化字段里：`2026-10-07-performance-followup/summary.md` 记了
  P95 1.18s、EXPLAIN 与 MySQL 连接计数；`2026-10-07-upgrade-runbook/summary.md` 记了 v12→v21→还原的一次性 MySQL 演练。
  `runtimeGap` 写明「在 summary.md 散文里，不在本文件」，而不是假装没有或伪造 `runtimePerformance` 数组。
- `check-inheritance-contract` 的标记是大小写敏感的字面 `includes`：首次写 `Generic drift` / `Pseudo-drift` 仍报缺失，
  必须与 `REQUIRED_PR_MARKERS` 逐字一致（小写开头）。
- workspace 根不是 git 仓库（`.git/` 只剩 `hooks/` 与 `info/`，`git rev-parse` 失败），
  因此 `.github/pull_request_template.md` 放在那里 GitHub 永远不会自动加载。本轮仍按门禁要求补齐该文件，
  并在文件头写明这一点、同时把同一组 marker 加进 ops 真正使用的 `.github/PULL_REQUEST_TEMPLATE.md`，
  避免「为满足门禁造一个哑文件」。
- `PROJECT_INHERITANCE.md` 的 `Base version` 是手抄 `foundation-release.lock.json` 的第二份事实，存在漂移风险；
  本轮以 `> 请勿翻译或删除；版本变化时必须与 foundation-release.lock.json 同步更新` 显式标注，
  真正的机械校验（把这一行与 lock 比对）属新增 sensor，未在本轮引入。
- 收口前/后读数：`check-boundaries` 裸 `--strict` 1 finding → 0/0 stale；`check-runtime-evidence` 11 warning / rc=1 → 0/0；
  `check-inheritance-contract`（workspace 根）8 finding → 0。CI 形式 `--baseline` 仍 rc=0，只是 baselined 从 1 变 0。

## Verification Plan

- `node scripts/harness/check-boundaries.mjs --root . --strict` → 0 finding / 0 stale / 退出码 0（收口前 1 finding、退出码 1）。
- `node scripts/harness/check-boundaries.mjs --strict --repo pantheon-base --baseline config/boundary-baseline.json`（`ci.yml:391` 形式）→ 退出码 0，baselined 由 1 变 0。
- `node scripts/harness/check-runtime-evidence.mjs --root . --strict` → 0 error / 0 warning / 退出码 0（收口后 55 个 evidence 目录，含本轮自己的工件）。
- `node scripts/harness/check-inheritance-contract.mjs --root .. --strict`（在 `pantheon-base` 目录执行，即 workspace 根形式）→ 0 finding / 退出码 0。
- 24 个 strict 检查器矩阵复跑（`frontend/.tmp/gov-matrix.mjs`，gitignore）全 rc=0，含 `check-evidence` / `check-review` / `check-task-packet` / `check-structure-contract` / `check-failure-registry`。
- `cd frontend && node node_modules/typescript/bin/tsc -b`、`node node_modules/eslint/bin/eslint.js src --max-warnings 0`、
  `node ./scripts/check-menu-contract.mjs`、`node ./scripts/check-import-path-case.mjs`、
  `node node_modules/vitest/vitest.mjs run tests/unit/modules/platform/widgets.test.ts tests/unit/core/layout/useLayoutMenu.test.tsx`。
- `cd backend && go build ./... && go vet ./... && gofmt -l .`（本轮未改后端，作为工作区回归基线）。
- ops/base 两侧门禁：`node scripts/harness/check-adoption.mjs --root . --strict` 与 `node scripts/check-pr-governance.mjs --help` 在两仓均 rc=0。
- 凭据检查：本轮所有新增文本不含数据库、Redis、JWT 凭据，也不打印 `.env.test` 值。

## Linkage

- Task ID: `2026-10-26-governance-red-checkers-closure`
- Task Manifest: `.harness/tasks/2026-10-26-governance-red-checkers-closure/manifest.json`
- Evidence Directory: `.harness/evidence/2026-10-26-governance-red-checkers-closure/`
- Review File: `.harness/evidence/2026-10-26-governance-red-checkers-closure/review.md`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/designs/REPOSITORY_LAYOUT.md`

## Evidence Required

- 三个 checker 收口前后的原始输出（findings/warnings 计数与退出码）。
- `git diff --numstat` 与 `git diff | grep -E '^[+-].*"status"'` 的空结果，证明 G-03 是纯结构追加。
- `frontend/src/api/menu.ts` 新文件、`widgets.tsx` 与 `menu/api.ts` 的 import 改写、`config/boundary-baseline.json` 的条目删除。
- 24 检查器矩阵输出（`frontend/.tmp/gov-matrix.txt`，gitignore，关键行转录进 evidence）。

## Human Gates

- 把 `check-runtime-evidence` / `check-inheritance-contract` / 裸 `--strict` 的 `check-boundaries` 接入 CI 并纳入强制集合，
  属门禁策略变更，需维护者决定（FR-016 与 FR-017 都记为 open）。
- workspace 根 PR 模板的另一种处置方式是改 `check-inheritance-contract` 让它去校验两个仓库内的模板；
  那是 checker 规则变更，本轮未采纳，留给维护者裁定。
- `pantheon-ops` 的 `Base version` 手抄行若维护者认为不该落在文档里，可以删除该行并接受该 checker 重新变红。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
