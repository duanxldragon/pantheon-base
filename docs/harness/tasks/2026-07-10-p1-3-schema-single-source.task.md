# Task Packet: P1-3 数据库 schema 单源化

> 1.0 里程碑第 1 项。依据 [IMPROVEMENT_ROADMAP.md](../../../IMPROVEMENT_ROADMAP.md) P1-3、[PANTHEON_BASE_1_0_MILESTONE.md](../PANTHEON_BASE_1_0_MILESTONE.md)。
> 状态：**BLOCKED — 等 Human Owner 理清在途未提交的 `database/system_init.sql`。**

## Goal

消除 `database/system_init.sql`（旧 16 表，已标 DEPRECATED）与权威迁移（29 表）的分歧，统一建库到 golang-migrate。

## Primary Layer

system/config

## Dependency Layers

- none

## Harness Profile

- Template: admin-platform
- Overlay: pantheon-base
- Quality Profile: none
- Portable Failure Class: architecture-drift
- Owner Layer: consumer-repository
- Coverage Dimensions:
  - architecture-fitness
  - maintainability

## Contract Anchors

- `AGENTS.md`
- `DESIGN.md`
- `backend/pkg/database/migrations/000001_init_schema.up.sql`（权威源，29 表）
- `database/system_init.sql`（DEPRECATED，16 表）

## Scope

### In

- 将 `system_init.sql` 的**建表部分**移除或整体归档到 `docs/archive/`（或 `database/archive/`），仅保留 seed 数据供参考。
- 文档与脚本统一建库路径到 golang-migrate。
- 更新引用 `system_init.sql` 的文档/脚本（README、部署指南等）指向 migrate 路径。

### Out

- 不改运行时迁移逻辑（运行时已走 migrate）。
- 不新增/修改任何表结构。

## Structural Scope

- Affected Subgraph: `database/system_init.sql -> golang-migrate 建库路径`
- Boundary Crossings: none
- Risk Nodes: schema init 路径
- Graph Focus: none

## Expected Files

### Create

- none

### Modify

- `database/system_init.sql`（建表部分归档，保留 seed）
- 引用它的文档/脚本（探索阶段由 Codex 用 `rg "system_init"` 定位）

### Do Not Touch

- `backend/pkg/database/migrations/**`（权威源）
- 运行时迁移代码

## Implementation Notes

- 触碰共享建库路径，默认 base-owned。
- 先应用最小复杂度阶梯：优先归档而非重写；不得用简化削弱任何 seed 数据完整性。

## Method Readiness

- Consumer-Specific Controls: pantheon-base 建库脚本
- Required Sensors: command · runtime evidence
- Required Evidence: command summary · runtime gap
- Minimal Complexity Rung: reuse
- Ratchet Decision: no-repeat-observed
- Deferred Code Issues: none

## Delivery Governance

- Design Gate: IMPROVEMENT_ROADMAP P1-3
- Development Gate: expected files declared · do-not-touch declared
- QA Acceptance Gate: command
- GitHub Governance Gate: repo-quality-gate

## Execution Roles

- Implementer Posture: implementer
- Reviewer Posture: architecture

## Stop Points（Human Gate）

**开工前必须确认（BLOCKING）：**

1. **在途 `system_init.sql` 未提交改动是否已理顺？** Human Owner 明确说明：保留、合并进 migrate、还是丢弃？未得答复前不得动此文件。
2. 归档目标目录选 `docs/archive/` 还是 `database/archive/`？

## State Plan

- Checkpoint Expectation: none
- Resume Artifacts: `.harness/evidence/2026-07-10-p1-3-schema-single-source/`

## Verification Plan

### Backend

- 全新库走 `migrate up` 得到 29 表；`go test ./...`（受影响包，预期无行为变更）。

### Frontend

- none

### Browser / Smoke

- none

### Runtime Evidence

- 建库脚本输出（migrate 版本 + 表数）；对照旧 16 表 vs 新 29 表差异清单。

## Linkage

- Task ID: `2026-07-10-p1-3-schema-single-source`
- Task Manifest: `.harness/tasks/2026-07-10-p1-3-schema-single-source/manifest.json`
- OpenSpec Change: none
- Plan References: none
- Evidence Directory: `.harness/evidence/2026-07-10-p1-3-schema-single-source/`
- Review File: `.harness/evidence/2026-07-10-p1-3-schema-single-source/review.md`

## Evidence Required

- command result summary（migrate 建库表数）
- runtime gap 或旧/新表差异清单
- review summary

## Human Gates

- schema 单源化 = schema-touching → **必须 human gate**（见 Stop Points）。

## Sync expectation

- 仅修改 pantheon-base。
- schema 建库路径变化不影响 pantheon-ops 运行时；如影响继承，记录"后续需同步"。

## Completion Checklist

- [ ] Layer and boundary declared
- [ ] Quality profile or explicit `none` declared
- [ ] Ratchet decision declared for repeated failures
- [ ] Delivery governance gates declared
- [ ] Contract anchors read
- [ ] system_init.sql WIP 状态经 Human Owner 确认
- [ ] Verification run or exception recorded
- [ ] Evidence saved or summarized
- [ ] Review completed
