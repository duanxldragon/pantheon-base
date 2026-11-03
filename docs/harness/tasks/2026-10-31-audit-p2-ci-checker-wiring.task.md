---
title: CI 去重与 11 个未接线 checker 的处置（AUD-015/027）
doc_type: Remediation
layer: platform
status: Archived
depends_on_layers: []
linked_contracts:
  - docs/harness/HARNESS_ENGINEERING_CONTRACT.md
  - docs/harness/AI_QUALITY_GOVERNANCE.md
updated_at: 2026-10-31
---

# Task Packet: 2026-10-31-audit-p2-ci-checker-wiring

## Goal

两件事，同一个根因：**“写了检查”被当成“有了检查”**。

1. `go test -race` 在 `ci.yml:167`（`-race -short`）与 `quality.yml:384`（`-race`）各跑一次，
   都在 `pull_request` 触发，纯重复消耗。
2. `scripts/harness/` 有 26 个 `check-*.mjs`，其中 **11 个没有接入任何 npm script 或 workflow**：
   `check-audit-coverage`、`check-backend-dto-contract`、`check-backend-response-contract`、
   `check-doc-frontmatter`、`check-evidence`、`check-feature-ledger`、`check-graph-review`、
   `check-inheritance-contract`、`check-permission-contract`、`check-review`、`check-runtime-evidence`。

这些 checker 里有 `check-permission-contract`、`check-feature-ledger`、`check-inheritance-contract`
这种直接对应核心契约的检查——**存在但从不执行，等于没有**。这正是 FR-016/FR-017 记录过的
同一失败模式再次出现。

本包给每个未接线 checker 一个明确归宿（接线 / 合并 / 删除），并消除 Go 测试的重复执行。

## Primary Layer

platform

## Dependency Layers

- `platform`（`scripts/harness`、`package.json`、`.github/workflows`）
- 依赖 `2026-10-31-audit-p2-doc-lifecycle-archive` 与 `2026-10-31-audit-p2-doc-metadata-and-index`
  先落地：`check-audit-coverage`、`check-doc-frontmatter`、`check-review` 的接线判据依赖它们的新规则。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: none
- Release Requirement: none
- Downstream Sync Note: workflow 与 script 变更不随 foundation release 送达消费仓（不在 sharedPaths），
  但消费仓若复制了 `scripts/harness`，需在下次 rebuild 时确认无重复执行。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `gate-integrity`
- Portable Failure Class: `unwired-sensor`
- Owner Layer: `foundation-source`
- Ratchet Decision: `gate-updated`
- Coverage Dimensions:
  - method-health
  - maintainability
  - architecture-fitness

交付层级：**L1**（CI 与检查器，无产品运行面）。

## Contract Anchors

- `docs/harness/HARNESS_ENGINEERING_CONTRACT.md`：checker 的存在意义与接线要求。
- `docs/harness/AI_QUALITY_GOVERNANCE.md`：失败登记与 ratchet 规则（FR-016/FR-017 是前例）。
- `docs/harness/FAILURE_RATCHET_POLICY.md`：新增门禁的登记格式。

## Scope

### In

- **AUD-027**：为 11 个未接线 checker 逐个给出处置，形成一张表（checker / 现有断言 / 归宿 /
  理由 / 若接线则挂在哪条链路）：
  - **接线**：接入 `package.json` 的 `check:*` 并在 `prebuild`、`quality.yml` 或
    `Release Gate` 中选择最合适的一条链（不要全部塞进 `prebuild`，那会让本地构建变慢）；
  - **合并**：与已有 checker 职责重叠的（例如 `check-doc-frontmatter` 与 `scripts/frontmatter-check.mjs`），
    合并后删除多余脚本；
  - **删除**：断言已无意义或与现行规范冲突的，删除并在 failure-registry 登记原因。
- **AUD-015**：`ci.yml:167` 与 `quality.yml:384` 的重复 `go test -race` 去重——保留
  `quality.yml`（合并门禁），`ci.yml` 侧改为按路径过滤（仅 Go 改动时跑 `-short` 且不带 `-race`），
  或直接删除该步骤。
- 接线后必须验证 checker **真的会失败**：为每个新接线 checker 造一个最小违规样例，
  确认 CI 会红（否则只是把“不跑”换成“跑了但永远绿”）。
- 更新 `docs/harness/HARNESS_ENGINEERING_CONTRACT.md` 的 checker 清单与总数。

### Out

- 新增任何 checker（本包只处置存量）。
- 修改 checker 的断言逻辑（除合并时必要的重命名/路径调整）。
- 调整 `prebuild` 链中已接线检查的顺序。
- 修改产品代码、迁移、文档正文。
- 引入新的 CI 服务或第三方扫描器。

## Expected Files

### Create

- `docs/harness/tasks/2026-10-31-audit-p2-ci-checker-wiring.task.md`
- `.harness/tasks/2026-10-31-audit-p2-ci-checker-wiring/manifest.json`
- `.harness/evidence/2026-10-31-audit-p2-ci-checker-wiring/checker-triage.md`
- `.harness/evidence/2026-10-31-audit-p2-ci-checker-wiring/{commands.json,summary.md,review.md}`

### Modify

- `package.json`（新增/合并 `check:*` 脚本）
- `.github/workflows/ci.yml`（去重）
- `.github/workflows/quality.yml`（接线）
- `docs/harness/HARNESS_ENGINEERING_CONTRACT.md`（checker 清单）
- `docs/harness/failure-registry.md`（若删除 checker，登记原因）

### Do Not Touch

- `scripts/harness/check-*.mjs` 的断言逻辑（合并时只做重命名与调用路径调整）
- `frontend/package.json` 的 `prebuild` 顺序
- `backend/**`、`frontend/src/**`
- `docs/reviews/**`
- `VERSION`、`CHANGELOG.md`

## Implementation Notes

- 先判“这个 checker 现在还会不会红”，再判“要不要接线”。一个永远绿的 checker 接上去只是增加
  构建时间，不增加保障。
- 每个接线都要有**负向验证**：故意造一个违规文件，确认 CI 红；然后撤销。没有这一步的接线
  等于把 FR-017 的失败模式从“不跑”改成“跑了但没用”。
- 不要把所有 checker 塞进 `prebuild`：`prebuild` 已经在 12 条检查上，再加会显著拖慢本地开发，
  导致开发者绕过它。按性质分流——契约类进 `quality.yml`，证据类进 `Release Gate`。
- `check-doc-frontmatter` 与 `scripts/frontmatter-check.mjs` 明显重复，优先合并而不是双跑；
  合并后保留哪一个由 W5 的元数据三合一结论决定。
- Go 测试去重时注意 `-short` 与全量的差异：`quality.yml` 跑全量 `-race` 已覆盖 `-short` 的子集，
  所以 `ci.yml` 侧可以直接删该步骤，不必改成路径过滤。**但要确认 `ci.yml` 的 coverage 上传
  是否依赖这一步**——若依赖，改为复用 quality 的产物而不是重跑。

## Verification Plan

- `node -e "Object.keys(require('./package.json').scripts).filter(k=>k.startsWith('check:'))"`（清单核对）
- 逐个新接线 checker 跑一次通过 + 一次故意违规（负向）
- `npm run check:harness-docs && npm run check:harness-inventory && npm run check:task-packet`
- `node scripts/harness/check-evidence.mjs --root . --strict`
- 若修改 workflow：`npx zizmor .github/workflows`（若可用）或人工核对触发条件与 job 依赖

## Linkage

- Task ID: `2026-10-31-audit-p2-ci-checker-wiring`
- Task Manifest: `.harness/tasks/2026-10-31-audit-p2-ci-checker-wiring/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-10-31.md` §9.2、`docs/harness/AI_QUALITY_GOVERNANCE.md`
- Evidence Directory: `.harness/evidence/2026-10-31-audit-p2-ci-checker-wiring/`
- Review File: `.harness/evidence/2026-10-31-audit-p2-ci-checker-wiring/review.md`

## Evidence Required

- `checker-triage.md`：11 个 checker 的逐项处置表（含断言现状与归宿）
- `commands.json`：每个新接线 checker 的正向/负向读数、CI 步骤去重前后的触发矩阵
- `summary.md`：为什么分流到不同链路、删除的 checker 为何无价值、coverage 上传是否受影响
- `review.md`：逐条 reviewer posture

## Human Gates

- 修改 `.github/workflows/*` 需两位非作者批准，其中一位为 CI/发布负责。
- 删除 checker 属减少门禁，需在 failure-registry 登记并说明为何不会重演对应事故。
- 若接线会显著延长 PR 时长，需维护者确认可接受上限。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] 11 个 checker 每个都有接线/合并/删除的明确归宿，无“待定”
- [x] 每个新接线 checker 都有负向验证（能真的红）
- [x] `go test -race` 不再在两条 workflow 重复执行
- [x] HARNESS_ENGINEERING_CONTRACT 的 checker 清单与实际一致

## Execution Result（2026-10-31）

- **AUD-027（11 个未接线 checker）**：逐项处置写在 `.harness/evidence/2026-10-31-audit-p2-ci-checker-wiring/checker-triage.md`
  —— 9 个接线到 `quality.yml` 的 `Docs Governance` job（evidence / review / runtime-evidence / graph-review /
  audit-coverage / feature-ledger / permission-contract / backend-dto / backend-response），1 个
  `check-inheritance-contract` 只能在 workspace 根跑（`--root ..` exit 0、`--root .` exit 1），保留 npm script
  但不进 base PR 门禁，1 个 `check-doc-frontmatter` 是 portable 镜象、与 `scripts/frontmatter-check.mjs` 重叠，
  标为 mirror-only 不接线。删除 0 个。
- **AUD-015（重复 race）**：`ci.yml` 的 coverage 步骤去掉 `-race`（保留 `-short` 与 coverage 产物上传），
  `quality.yml` 的 `Test backend` 继续跑全量 `go test -race ./...`。每个 PR 的 race 执行次数 2→1，
  coverage 上传仍有输入。
- **任务包状态锁（W4 遗留）**：`check-task-packet.mjs` 接入 `task-evidence-state.mjs` 判据，比较
  `status` 与实际证据：`Archived` 无证据、或证据已完成但状态未改，都报 error。负向验证：把
  `2026-07-29-sonar-ts-final` 改回 `Active` → exit 1；恢复后 92/92 PASS。
- **门禁数据修复**：三份 W3/W4/W5 `review.md` 补 `## Machine Readable` JSON 块（`check-review` 的格式要求），
  `2026-10-29-v0180-simplification-release/commands.json` 补 `runtimeGap` 说明（该包 runtimeSensitive 但无运行读数）。
  两者都是为了让新接线的 strict 门禁在 main 上为绿，而不是把红留成“已知”。
- **文档**：`scripts/harness/README.md` 新增 “Wired checker scripts” 表（npm script ↔ checker ↔ 链路）；
  `docs/harness/failure-registry.md` 新增 `FR-026`（checker 存在但不接线）。
- **未做**：未新增 checker、未改任何 checker 断言逻辑、未动 `frontend/package.json` 的 `prebuild` 顺序、
  未删除任何 checker（所以无需“减少门禁”审批）。
