---
task_id: 2026-09-20-merged-packet-closeout
title: Write merged-task facts back into task packets and evidence (closeout pass)
created: 2026-09-20
status: in-review
priority: P2
layer: platform
risk: docs-and-evidence-only
---

# Task Packet — 2026-09-20-merged-packet-closeout

## 背景

2026-09-20 当天有三个 PR 合入，但对应的 task packet 仍停在合入前状态：

| Task | PR | packet 原状态 |
|---|---|---|
| `2026-09-20-ci-bench-perf-smoke` | #327 | `in-progress`（statusNote 写「PR creation pending」） |
| `2026-09-20-tenant-hostile-matrix-phase2` | #329 | `in-review` |
| `2026-09-20-bench-perf-smoke-summary-path` | #330 | `in-review` |

结果是 task packet 与 evidence 描述的是**分支期意图**，而不是合入后的事实：
PR 号、merge commit、分支是否删除、required/advisory 信号的实际结论、哪些 gap
被合入关闭、哪些仍然开着，全都没有落进仓库。`PANTHEON_BASE_DELIVERY_WORKFLOW.md`
第 7 节「最小交付件」明确要求「合并后的 PR URL 和 merge commit」「分支收口状态」
「GitHub signal 分类」，缺任一项就不能描述为完整闭环。

## 范围

### In

- 三个 packet 的 `status` 回写为 `completed`，`statusNote` / task.md 补 merge 事实
  （PR、merge commit、merged-at、分支删除、PR 与 main tip 的信号分类）。
- 三个 evidence `summary.md` 各追加一节 `## Closeout (post-merge)`，包含关闭的 gap
  与仍开着的 gap。
- `docs/harness/failure-registry.md`：新增 `FR-011`——回写过程中发现 advisory
  `Core Smoke` 自 ≥2026-09-05 起持续红，而 workflow 级结论因 `continue-on-error`
  仍为绿；这是 `FR-010` 同类的第二个实例。
- 本次回写自身的 task packet + evidence（含合并后的事实清单）。
- 把 FR-011 从「一条 registry 记录」推进成**有 owner 的任务**：开
  `.harness/tasks/2026-09-20-smoke-core-tenant-ci-gap/`（+ 对应 evidence，诊断命令以
  `not-run` 记录），带上已确认的静态机制、排序后的假设与处置选项。

### Out

- 不修 / 不重新划定 advisory `Core Smoke`（为什么 `tests/smoke-core/` 租户 spec
  在 CI 里失败需要独立诊断：是缺 multi-mode 后端与 fixture，还是真的隔离回归）。
- 不动任何门禁策略（advisory → blocking 仍是维护者决策）。
- 不改产品代码、workflow、测试；不改已归档的 `review.md` / `commands.json`。
- 不回写本次工作流之外的合入 packet（#325、#326、#328 属他人的工作流）。

## 关键取舍

- **为什么写进 evidence 而不是只写 statusNote**：`statusNote` 是一行摘要，无法承载
  §7 要求的最小交付件集合；把 closeout 记录放进各自 evidence 目录，保持
  manifest/evidence/review 的 linkage 不变，也避免发明新的 schema 字段
  （`closeoutFile` 之类会让 checkers 与 PR body 生成器都需要改）。
- **为什么不把三个 packet 合并成一份记录**：packet 是任务级事实源，跨任务合并会让
  「这个 task 合入后状态如何」需要读第三个地方才能回答。因此每个 task 保留自己的
  closeout，另加一份 consolidated 记录说明本次回写本身。
- **为什么 FR-011 只登记不修**：它与 `FR-010` 同类但根因不同（不是 cwd，而是
  「advisory job 长期红 + 无门禁」）。诊断租户 spec 在 CI 里的失败原因会显著扩大本
  任务范围，按最小复杂度阶梯先留 registry 记录 + 显式 out of scope，并把处置
  （给 job 接前置条件 / 加 skip 守卫 / 移出 core 范围）明确为维护者 gate。
- **为什么同时开一个 follow-up task packet**：只留 registry 行的话，FR-011 会停在
  「已登记」而没有人拥有它；follow-up packet 记录已确认的静态机制（job 不提供
  multi 模式与租户，spec 无 skip 守卫，README 与通配范围脱节）与排序假设，
  让下一位执行者不需要重走一遍定位过程。

## 验证集合（已执行）

| 验证 | 命令 | 结果 |
|---|---|---|
| merge 事实 | `gh pr view {327,329,330} --json state,mergedAt,mergeCommit,headRefName` | 三个 PR 均 MERGED，merge commit 与回写内容一致 |
| PR 信号分类 | `gh pr view {327,329,330} --json statusCheckRollup` | #327: 27 success/1 failure(advisory)；#329: 32 success/2 failure(advisory)；#330: 32 success/0 failure |
| main tip 信号 | `gh api .../commits/b3350be3/check-runs` | required（CI/Security Gates/Code Quality Gates/Lint Workflows）全绿；advisory `Bench Perf Smoke` = success |
| Core Smoke 历史 | `gh run list --workflow=smoke-core.yml --branch main --limit 40` + 每 run 的 jobs | 32 个完成 run 中 29 红；仅 2026-09-10 三个绿 |
| 分支收口 | `git ls-remote --heads origin` | 三个分支均已从 origin 删除 |
| harness 门禁 | `check-task-packet` / `check-evidence --strict` / `check-review --strict` / `check-failure-registry --strict` / `check-structure-contract` / `check-doc-frontmatter` / `check-encoding` / `check-method-health` / `check-duplication` | 见 commands.json |

## 已知 gap

- 仓库里没有「merge → 回写 packet」的机械联系，本任务是手工回写；若再次漂移，
  按 ratchet 应升级为 sensor（例如 CI 里比对 packet status 与 PR 状态）。本次不升级，
  因为 `in-review` 在合并前是合法状态，机械判定需要更明确的信号来源。
- 本机 `npm`/`npx` 仍被 WSL shim 拦截，因此 harness 门禁用 `node scripts/...` 直接执行，
  与 CI（`npm run check:*`）等价。

## Human gate

- 无新增 human gate。`FR-011` 的处置（给 Core Smoke 接 multi-mode + fixture，或把租户
  spec 移出该 job 范围）属维护者决策，本任务只登记不处置。
