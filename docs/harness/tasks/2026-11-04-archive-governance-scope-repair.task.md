---
title: 归档治理作用域修复（strict 证据链三门禁，2026-11-04）
doc_type: Remediation
layer: platform
status: Archived
depends_on_layers:
  - system/iam
linked_contracts:
  - docs/harness/VERIFICATION_EVIDENCE_SPEC.md
  - docs/harness/REVIEW_LOOP_SPEC.md
updated_at: 2026-11-04
---

# Task Packet: 2026-11-04-archive-governance-scope-repair

## Goal

月度归档（`.harness/archive/<YYYY-MM>/…`）落地后，三个 strict 门禁对归档树失明或误红，成为 PR 落地的前置阻塞。本包把作用域与判定改诚实：

1. `check-evidence` / `check-review` / `check-runtime-evidence` 的发现都扫活树加归档月，不再只读 `.harness/evidence/`。只读活树会在一个 round 关闭的瞬间把 196 个证据从门禁视野里删掉，正是 FR-026 写的「看起来有覆盖、实际零覆盖」。
2. `check-evidence` 的结构 schema 只对本代（2026-10-26 FR-016 回填轮之后）产物做强校验；更早产物记录的是 `commands[].status` / `cwd` / `agent` / `repo` / `linkage` 这类当轮执行事实，事后无法从本轮文字恢复，硬要求等于逼人造证据。这些条目改为**读出、计数、打印，但不 gate**，计数必须缩小。
3. `check-runtime-evidence` 的敏感度判定以显式布尔为准（证据优先，其次任务包），只在两边都没声明时才回落 `verificationPlan.runtimeEvidence` 文本，并且忽略「not runtime-sensitive」「none」这类否定条目。原先的「文本数组非空即敏感」把只读盘点、文档搬迁、CI 修复都标成运行时敏感（二十二条误报）。
4. `linkage.planRefs` 与摘要/评审文件一样走归档感知解析：规范拼写指向已物理归档的文件不再误报缺失。
5. 无法诚实回填的历史产物按名字登记在 `config/review-loop-legacy-artifacts.json` 与 `config/runtime-evidence-legacy-artifacts.json`，条目消失即报错，豁免集只能缩小。

## Priority

`P1`

## Estimated Complexity

`moderate`

## Primary Layer

platform

## Dependency Layers

- `system/iam`（本包不改业务码，只在证据链里引用该层的历史包）

## Dependencies

- blockedBy: `none`
- blocks: 审计 §9 第 1 项（把工作区整改提交到 main）

## Harness Profile

- Template: admin-platform
- Overlay: pantheon-base
- Quality Profile: behaviour
- Portable Failure Class: silent-scope-loss
- Owner Layer: foundation-source
- Ratchet Decision: gate-updated
- Coverage Dimensions:
  - behaviour
  - architecture-fitness
  - maintainability

交付层级：**L2**。改的是治理门禁语义，触到 strict 判定与豁免登记。

## Workspace Context

- Target Repository: pantheon-base
- Repository Role: foundation-source
- Upstream Dependencies: pantheon-harness
- Downstream Consumers: pantheon-ops
- Sync Expectation: none
- Release Requirement: none
- Downstream Sync Note: ops lock 仍钉 `pantheon-base-v0.18.2` / `a44ae4e0`，本包不推进 lock；不改 Go 签名与前端契约。

## Contract Anchors

- `docs/harness/VERIFICATION_EVIDENCE_SPEC.md`（runtime 字段、knownGaps、linkage 结构）
- `docs/harness/REVIEW_LOOP_SPEC.md`（review.md `## Machine Readable` 合同）
- `docs/harness/failure-registry.md` FR-016 / FR-017 / FR-026
- `scripts/task-manifest.mjs`（`resolveArchiveAwarePath`、`readTaskManifest` 归档感知）

## Scope

### In

- `scripts/harness/check-evidence.mjs`：归档发现、`matchesEvidenceDir`、`planRefs` 归档感知、代际 schema 作用域、报告与 `--json` 计数
- `scripts/harness/check-review.mjs`：归档发现、`resolvePlanRef`、`--legacy-config` 与陈旧条目报错
- `scripts/harness/check-runtime-evidence.mjs`：归档发现、布尔优先的敏感度判定、`--legacy-config`
- `config/review-loop-legacy-artifacts.json`、`config/runtime-evidence-legacy-artifacts.json`
- 归档 review.md 的机械修复：为缺 `## Machine Readable` 的产物**追加**块（不改散文结论），为被 W4 迁移改址的 `planRefs` 重新指向现存路径，为 2026-09-01 两份旧式块补齐合同要求的键
- 两份 `commands.json` 追加 `runtimeGap`、本轮 `2026-11-04-audit-freeze-preconditions/commands.json` 补 `knownGaps` 数组（全部为本轮文字已有的事实重述）

### Out

- 提交已有 2026-11-03/11-04 工作区整改本身（另包，本包是其前置）
- 冻结宣告、GOV-08 前端覆盖率阈值、`000031` 生产 DROP（维护者门禁）
- 改 `.github/workflows/**` 的 gate 语义或 CI 阈值；GOV-05 的 `continue-on-error` 保持现状
- 改 `docs/harness/REVIEW_LOOP_SPEC.md` / `VERIFICATION_EVIDENCE_SPEC.md` 的字段枚举
- 为 pre-2026-10-26 产物伪造 `commands[].status` / `cwd` / `agent`
- 改 `pantheon-ops/**`、`VERSION`、`CHANGELOG.md`、迁移文件

## Structural Scope

### Scope Quantification

- Modules affected: 3 个 strict checker + 2 个豁免登记
- Files: 5 个脚本/配置改动，约 40 个归档证据产物为追加或重指向
- API endpoints: 0
- Database migrations: no

### Risk Nodes

1. 代际作用域把历史条目变成「不计 gate」，可能被读成放松门禁 — Mitigation: 计数与文件数照常打印，注释写明必须缩小；作用域常量单一位置，负向验证（把阈值改成 2020-01-01）立刻把 205 条重新变成 error。
2. 归档 review.md 追加机器块可能被读成改写历史 — Mitigation: 每份只追加一个块和一条说明，`git diff --numstat` 必须是 N/0 单 hunk；verdict 一律取该产物自己的散文，散文沉默的用其同包 `summary.md`，两者都沉默的不写 `approved`。
3. `planRefs` 归档感知可能掩盖真正丢失的引用 — Mitigation: `resolveArchiveAwarePath` 只在解析到现存文件时放行；`fix-report.md`（`722fa9e1` 已删）这类真丢失不重指向，改为具名豁免并写明原因。

### Legacy Fields (for compatibility)

- Affected Subgraph: `check-evidence / check-review / check-runtime-evidence -> .harness/evidence + .harness/archive/<month> -> config/*-legacy-artifacts.json`
- Boundary Crossings: `scripts/harness -> scripts/task-manifest.mjs（归档解析，只读复用）`
- Risk Nodes: `CURRENT_SCHEMA_FROM`、`RUNTIME_PLAN_ITEM`、两个豁免 config
- Graph Focus: `sensitive-flow`（治理门禁的可见范围与豁免集）

## Expected Files

### Create

- `docs/harness/tasks/2026-11-04-archive-governance-scope-repair.task.md`
- `.harness/tasks/2026-11-04-archive-governance-scope-repair/manifest.json`
- `.harness/evidence/2026-11-04-archive-governance-scope-repair/{commands.json,review.md,summary.md,pr-body.md}`
- `config/runtime-evidence-legacy-artifacts.json`
- `config/review-loop-legacy-artifacts.json`

### Modify

- `scripts/harness/check-evidence.mjs`
- `scripts/harness/check-review.mjs`
- `scripts/harness/check-runtime-evidence.mjs`
- `.harness/archive/**/review.md`（追加机器块 / 重指向 `planRefs` / 补齐旧块键）
- `.harness/archive/**/commands.json`（追加 `runtimeGap`、`knownGaps`）

### Do Not Touch

- `docs/harness/REVIEW_LOOP_SPEC.md`、`docs/harness/VERIFICATION_EVIDENCE_SPEC.md` 的字段枚举
- `.github/workflows/**`、`package.json` 的 `check:*` 定义
- `backend/pkg/database/migrations/**`
- 归档产物的散文正文（只允许追加，不允许改写或删除）
- `pantheon-ops/**`、`VERSION`、`CHANGELOG.md`

## Implementation Notes

- 三个检查器的归档发现共用同一约定：活目录 + `listArchiveMonths()` 逐月 `evidence/`。豁免按文件具名，不用日期或路径规则整片放行；唯一例外是 `check-evidence` 的代际作用域，它带负向验证且打印计数。
- `runtimeSensitive: false` 是作者的声明，优先于同包 `runtimeEvidence` 文本；这条语义改变只影响判定，不新增字段。
- 追加的机器块必须写 `planRefs` 指向现存文件；规范拼写 `.harness/tasks/<id>/manifest.json` 由归档感知解析，不要求写归档物理路径。

## Minimum Viable Approach

- Selected Rung: `repair existing checkers`（复用 `task-manifest.mjs` 已有的归档解析与既有 `config/*-legacy-*.json` 模式）
- Why This Is Enough: 不新增 checker，不改 gate 布线，不改合同枚举；作用域与判定改对即可让 strict 链绿。
- Upgrade Trigger: 若维护者要求历史产物也满足当代 schema，则另立项做逐条回填（约 205 条），不在本包内伪造。

## Success Criteria

- Behaviour Outcome: 三个 strict 检查器扫到 218/216 个归档证据产物，exit 0；历史结构缺口以计数形式打印而非沉默。
- Verification Signal: 正向 `node scripts/harness/check-{evidence,review,runtime-evidence}.mjs --root . --strict` 全 exit 0；四条负向差分（删豁免集 / 陈旧条目 / 阈值改 2020-01-01 / 还原旧敏感度与旧 planRefs 解析）各自重新变红。
- Regression Protection: 新增证据必须写 `.harness/evidence/<id>/` 并在 round 关闭时随包归档，否则 `check-evidence` 的活树发现与 `check-task-packet` 的归档一致性会漏检该轮——该要求写在 `scripts/harness/README.md` 的检查器作用域小节，随本包一起更新。
- Economics Watch: `none`

## Context Strategy

- Entry Sources: `docs/harness/failure-registry.md` FR-016/FR-017/FR-026，2026-11-04 审计 §8
- Retrieval Order: `entry -> summary -> raw`
- Retrieval Helpers: `git log -- .harness/archive`（归档演进），`scripts/task-manifest.mjs`
- Promotion Target: `scripts/harness/README.md`
- Response Budget: `terse`
- Sensitive Context: 不打印任何 DSN/凭据；证据只记录命令与退出码。

## Execution Roles

- Implementer Posture: 改判定与作用域，不改 gate 布线，不回填无法恢复的执行事实。
- Reviewer Posture: 核对每处豁免有具名理由、每条追加块与原文一致、计数在缩小而非扩大。

## Stop Points

- 若某个修复只能靠编造当轮未记录的事实（命令状态、执行目录、使用的 agent）才能绿，停止并登记豁免。
- 若要让 strict 链绿必须改 `REVIEW_LOOP_SPEC.md` 的 verdict 枚举或 `VERIFICATION_EVIDENCE_SPEC.md` 的必填字段，停止——那是合同变更，归维护者。

## Technical Debt

- technicalDebtFlag: `yes`
- technicalDebtNote: pre-2026-10-26 的 205 条结构缺口仍存在于归档树，被计数但不 gate。真正清偿需要一份「历史证据代际」决定（回填还是永久分层），本包选择分层并打印；登记在 failure-registry。

## Rollback Plan

- Trigger Condition: 任一 strict 检查器在主分支 CI 上以本包未预期的方式放行当前轮证据，或豁免集被扩大使用。
- Rollback Steps:
  1. `git revert` 本包的三个 checker 改动
  2. 保留两份 `config/*-legacy-artifacts.json` 与追加的归档块（它们是纯记录，回退检查器不影响其正确性）
- Rollback Verification:
  - [x] Functionality verified（回退后 `check:*` 恢复原行为）
  - [x] Data integrity verified（归档产物未被删除，追加块可独立回退）
  - [x] No side effects observed

## State Plan

- Checkpoint Expectation: 本包实现与证据同轮完成，完成即 `Archived`。
- Resume Artifacts: `.harness/evidence/2026-11-04-archive-governance-scope-repair/commands.json`

## Verification Plan

### Backend

- `cd backend && go build ./... && go vet ./...`（本包不改 Go，跑一遍证明无副作用）

### Governance

- `node scripts/harness/check-evidence.mjs --root . --strict`
- `node scripts/harness/check-review.mjs --root . --strict`
- `node scripts/harness/check-runtime-evidence.mjs --root . --strict`
- `node scripts/harness/check-task-packet.mjs --root .`
- `node scripts/frontmatter-check.mjs`
- 四条负向差分（见 Success Criteria）

### Frontend

- `frontend` 下 `./node_modules/.bin/tsc -b --pretty false`（证明未触及前端类型）

### Browser / Smoke

- none（纯治理工具改动，无运行时面）

## Linkage

- Task ID: `2026-11-04-archive-governance-scope-repair`
- Task Manifest: `.harness/tasks/2026-11-04-archive-governance-scope-repair/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Plan References: `docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-11-04.md` §8 / §9 第 1 项前置
- Evidence Directory: `.harness/evidence/2026-11-04-archive-governance-scope-repair/`
- Review File: `.harness/evidence/2026-11-04-archive-governance-scope-repair/review.md`

## Evidence Required

- `commands.json`：六个命令（三个 strict 正向、task-packet、frontmatter、四条负向差分各一条）与退出码
- `review.md`：`## Machine Readable` 块，verdict 取本轮实际结论
- `summary.md`：写明作用域语义、代际分层理由、两条豁免登记的原因、以及未做的历史回填债务

## Human Gates

- 豁免集的扩大、`CURRENT_SCHEMA_FROM` 的移动、strict 链在 CI 上的 gate 级别变更：维护者。
- 本包的 checker 改动本身不是门禁策略变更（布线不动），生成器可直接做。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] 三个 strict 检查器扫活树加归档，exit 0
- [x] 代际作用域与敏感度判定各有一条负向差分证明其承重
- [x] 所有豁免按文件具名登记，理由写入 config
- [x] 归档产物只做追加与重指向，散文正文零删除
- [x] 未改 CI 布线、未改合同枚举、未伪造执行事实
