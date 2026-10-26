---
title: 治理证据 schema 历史红归零（7 个 commands.json + 24 个 review.md 结构回填）
doc_type: Remediation
layer: platform
depends_on_layers:
  - system/iam
  - app
status: Active
linked_contracts:
  - docs/harness/VERIFICATION_EVIDENCE_SPEC.md
  - docs/contracts/DOCUMENT_FRONTMATTER_SCHEMA.md
  - docs/harness/FAILURE_RATCHET_POLICY.md
updated_at: 2026-10-26
---

# Task Packet: 2026-10-26-governance-evidence-schema-backfill

## Goal

`scripts/harness/check-evidence.mjs --strict` 与 `scripts/harness/check-review.mjs --strict` 在本仓库长期返回退出码 1，
红灯全部落在历史轮次留下的治理工件上，而不是当轮工作：

1. **7 个 `commands.json`**：`2026-10-20-tenant-audit-permission-seed`（缺 `linkage`）、
   `2026-10-20-tenant-delivery-hardening`（缺 `knownGaps` 与 `linkage`）、
   `2026-10-22-delivery-audit-remediation`（`runtimeSensitive`/`runtimeGap` 类型错、`linkage` 用 `assessment` 代替 `taskManifest`）、
   `2026-10-22-tenant-plan-entitlements-and-audit`（缺 `knownGaps` 与 `linkage`）、
   `2026-10-22-v0171-release-closeout`（`runtimeSensitive`/`runtimeGap` 类型错）、
   `2026-10-23-residual-closeout`（缺 `knownGaps` 与 `linkage`）、
   `2026-10-23-v0173-release-closeout`（缺 `knownGaps` 与 `linkage`）。
2. **24 个 `review.md`**：22 个完全没有 `## Machine Readable` JSON 块；
   `2026-09-25-task-archiving-and-v0130-prep` 的 `planRefs` 指向该任务自己归档并已在 v0.15.0 收口时删除的
   `.harness/ACTIVE_TASKS_REVIEW_2026-09-25.md`；`2026-10-20-tenant-delivery-hardening` 的
   `structuralReview.checks[1..2]` 用了枚举外的 `tenant-isolation` / `reserved-namespace`。

目标只有结构，没有结论：让全仓治理链归零，并且归零的过程不改动任何一条历史验证结论、命令结果或缺口判断。

## Primary Layer

platform

本轮只动 `.harness/**` 与 `docs/harness/failure-registry.md` 这类仓库级治理工件；不涉及业务域实现。

## Dependency Layers

- `system/iam`：多数历史轮次是租户域整改，其 `planRefs` 需要指向仍然存在的 `docs/contracts/TENANT_CONTRACT_V1.md` 等文档，
  路径有效性由本轮校验，但内容不属本轮改动。
- `app`：`2026-10-26-login-accessibility-and-lang` 与 `2026-10-26-tenant-plan-assignment` 两个当轮目录已在本轮之前通过 strict，
  本轮把它们纳入同一条全绿链。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `governance-evidence-integrity`
- Portable Failure Class: `method-health-gap` / `static-sensor-gap`
- Owner Layer: `consumer-repository`
- Ratchet Decision: `registry-only`（把 strict checker 接入 CI 属门禁策略变更，留给维护者决定）
- Coverage Dimensions:
  - method-health
  - maintainability

## Contract Anchors

- `docs/harness/VERIFICATION_EVIDENCE_SPEC.md`：`commands.json` 与 `review.md` 的字段契约来源。
- `docs/harness/FAILURE_RATCHET_POLICY.md`：同类失败重复出现时如何升级为 guide / sensor / gate。
- `scripts/harness/check-evidence.mjs`、`scripts/harness/check-review.mjs`：本轮逐条对齐的实际校验实现（必填字段、枚举、路径存在性）。
- `scripts/task-manifest.mjs`：`readTaskManifest` 的解析约束，决定 `linkage.taskManifest` 必须命中真实 manifest。

## Scope

### In

- 为 7 个历史 `commands.json` 补 `knownGaps`、`linkage`，并把 `runtimeSensitive` 收敛为布尔、`runtimeGap` 收敛为字符串；
  原始数组值保留在 `runtimeSensitiveNotes` / `runtimeGapNotes`，每个被改文件追加 `schemaBackfill` 说明来源与日期。
- 为 22 个历史 `review.md` 追加 `## Machine Readable` 块：`taskId`、`verdict`、`verdictRationale`、`linkage`
  （`taskManifest`/`evidence`/`reviewFile`/`changeRef`/`planRefs` 全部校验存在性）。
- 修正 `2026-09-25` 的失效 `planRefs` 与 `2026-10-20-tenant-delivery-hardening` 的 `checks` 枚举越界。
- 复跑全仓治理矩阵并把结果登记进本轮 evidence。
- 在 `docs/harness/failure-registry.md` 增加一条 FR 记录该失败类，并把「strict checker 未接入 CI」作为待批的 gate 变更写明。
- 顺带修掉排查过程中发现的当轮工作区缺陷：5 个生成物丢失 `DO NOT EDIT` 标记（`check:generated` 阻断项）与
  `tenant_platform_scope_test.go` 的 `gofmt` 违规。
- 把排查中新发现的 3 个 strict 红灯如实登记为 finding（G-03/G-04/G-05），包含 `check-boundaries` 裸跑与 CI 带 baseline
  形式的差异，不为了让矩阵全绿而放宽任何 checker。

### Out

- 不重跑、不重评、不改写任何历史轮次的验证结论、命令状态（`passed`/`failed`/`not-run`）或缺口判断。
- 不修 G-03/G-04/G-05 自身：`check-runtime-evidence` 的 11 条 runtime gap、`platform/widgets.tsx` 的跨层 import
  （CI 已 baselined 到 2026-12-31）、`check-inheritance-contract` 的 7 条跨仓与 PR 模板标记，都需要各自的设计判断。
- 不把 `check-evidence`/`check-review` 加进 `.github/workflows/`（门禁策略变更需维护者批准）。
- 不给缺 task packet 的 5 个历史轮次补造 `docs/harness/tasks/*.task.md`（无原始计划文本可依据）。
- 不动 `.harness/archive/**` 与任何业务代码路径（除上述工作区回归修复）。

## Expected Files

### Create

- `docs/harness/tasks/2026-10-26-governance-evidence-schema-backfill.task.md`
- `.harness/tasks/2026-10-26-governance-evidence-schema-backfill/manifest.json`
- `.harness/evidence/2026-10-26-governance-evidence-schema-backfill/commands.json`
- `.harness/evidence/2026-10-26-governance-evidence-schema-backfill/review.md`
- `.harness/evidence/2026-10-26-governance-evidence-schema-backfill/summary.md`

### Modify

- `.harness/evidence/{7 个历史轮次}/commands.json`
- `.harness/evidence/{24 个历史轮次}/review.md`（22 个追加块，2 个改字段）
- `docs/harness/failure-registry.md`
- `backend/modules/business/generated_registry.go`、`backend/modules/system/iam/menu/generated_component_registry.go`、
  `frontend/src/modules/generated/business.ts`、`frontend/src/modules/generated/system.ts`、
  `frontend/src/core/router/generatedComponentRegistry.ts`（从 HEAD 恢复被写坏的生成物）
- `backend/internal/middleware/tenant_platform_scope_test.go`（仅 `gofmt -w`）

### Do Not Touch

- 任何 `commands.json` 里的 `commands[].status`、`commands[].command`、`browserEvidence` 断言文本。
- 任何历史 `review.md` 的散文正文（只允许追加块）。
- `.harness/archive/**`、`dist/foundation-releases/**`。

## Implementation Notes

- 结构修复一律用脚本回放（`frontend/.tmp/gov-fix-evidence.mjs`、`frontend/.tmp/gov-fix-reviews.mjs`，两者 gitignore），
  每处 `knownGaps` / `verdictRationale` 字符串都是同一轮 `review.md` / `summary.md` 里已有文字的回述，
  不引入新判断；`verdict` 严格取散文的结论（`blocked` 只用于 `2026-10-07-release-closeout`，
  该文明确写「closeout 仍未完成直到 hosted 检查与合并」）。
- `## Machine Readable` 与 ```` ```json ```` 之间只能有空白：checker 的正则是 `/## Machine Readable\s+```json/`，
  第一版在标题与围栏之间插了说明引用块导致 22 个文件仍然报 `missing ## Machine Readable JSON block`；
  改为块后放置 `>` 注记，块内保留 `verdictRationale`。
- `linkage.planRefs` 必须指向磁盘上真实存在的路径；5 个历史轮次没有 packet，回退到其 `manifest.json`，
  并在 `2026-09-25` 那条写明原 `planRefs` 指向的正是该任务自己归档掉的文件。
- `runtimeSensitive` 从「说明数组」收敛为 `true` 时，数组原文保留在 `runtimeSensitiveNotes`，`runtimeGap` 同理。
- CI 真相已实测：`.github/workflows/quality.yml` 有 19 个 `npm run check:*` 步骤，`check-evidence` / `check-review` 既没有 npm script 也不在任何 workflow；
  本轮按 CI 形式复跑其中 18 个（`check:pr-governance` 需要 hosted PR 事件，本地无法执行）。
- 排查中发现另外 3 个 strict 红灯（记为 G-03/G-04/G-05）都不属本轮范围，且都指向本轮未触碰的文件：
  `check-runtime-evidence` 0 error / 11 warning、`check-inheritance-contract` 7 finding，两者无任何调用方；
  `check-inheritance-contract` 必须从 workspace root 跑才算准：在 `D:/workspace/go/pantheon-platform` 下是 8 finding，
  且是真实内容漂移（`WORKSPACE_INHERITANCE.md` 缺 3 条继承标记、`pantheon-ops/docs/PROJECT_INHERITANCE.md` 缺 3 条标记 + Base 版本未固定、
  workspace root 没有 `.github/pull_request_template.md`），而不是缺路径假报——在本仓目录里跑会把 3 条误读成「文件缺失」。
  `check-boundaries --root . --strict` 报 1 条（`platform/widgets.tsx` 引 `../system/iam/menu/api`），
  但 CI 在 `ci.yml:391` 带 `config/boundary-baseline.json` 跑，该违规已 baselined 到 2026-12-31，CI 形式 rc=0——
  即裸 `--strict` 比门禁本身更严，这一事实写入 evidence 以免后人误读。

## Verification Plan

- `node scripts/harness/check-evidence.mjs --root . --strict` → 期望 0 error / 退出码 0（收口后 54 个 evidence 目录）。
- `node scripts/harness/check-review.mjs --root . --strict` → 期望 0 error / 退出码 0（收口后 54 个 review 文件）。
- `node scripts/harness/check-task-packet.mjs --root .` → 期望 0 error（39 warning 为既有风格提示），含本轮新 packet。
- CI 对齐核对：`quality.yml` 的 19 个 `npm run check:*` 逐个按 CI 形式复跑（`check:pr-governance` 需 PR event 除外）；
  `check-boundaries` 用 CI 的 `--baseline config/boundary-baseline.json` 形式判定，不用裸 `--strict` 结论冒充门禁。
- `node scripts/harness/check-structure-contract.mjs --root . --strict`、`check-failure-registry.mjs --root . --strict`、
  `check-ui-quality-gate.mjs --root . --strict`、`check-generated.mjs --root . --strict`、
  `check-doc-frontmatter/links/inventory/sync-drift/encoding/method-health/adoption/template-health --root . --strict` → 全绿。
- `git diff` 自证：22 个 `review.md` 只有追加（`0` deletions）；7 个 `commands.json` 无 `status` 行变化。
- 生成物恢复后：`cd frontend && node node_modules/typescript/bin/tsc -b`、`node node_modules/eslint/bin/eslint.js src --max-warnings 0`、
  `cd backend && go build ./... && go vet ./... && gofmt -l .`。
- 凭据检查：本轮所有新增文本不含数据库、Redis、JWT 凭据。

## Linkage

- Task ID: `2026-10-26-governance-evidence-schema-backfill`
- Task Manifest: `.harness/tasks/2026-10-26-governance-evidence-schema-backfill/manifest.json`
- Evidence Directory: `.harness/evidence/2026-10-26-governance-evidence-schema-backfill/`
- Review File: `.harness/evidence/2026-10-26-governance-evidence-schema-backfill/review.md`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/harness/VERIFICATION_EVIDENCE_SPEC.md`

## Evidence Required

- 归零前的逐条错误清单（哪个文件、哪条 error）与归零后的 checker 输出。
- 每个回填字段的来源指引（同一轮 `review.md` / `summary.md` 的哪一节）。
- `git diff --numstat` 证明 review.md 侧是纯追加、commands.json 侧未触碰 `status`。
- 生成物回归的原始 diff 存档（`frontend/.tmp/f11-regression.diff`，gitignore）与恢复后的 `check:generated` 结果。

## Human Gates

- 把 `check:evidence` / `check:review` 接入 `.github/workflows/quality.yml` 的 Docs Governance 并纳入强制集合，
  属门禁策略变更，需维护者决定（本轮只在 failure-registry 记为待批）。
- 历史轮次若维护者认为某条 `verdict` 回述不准确，直接指出该轮 id，本轮不自行改判。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
