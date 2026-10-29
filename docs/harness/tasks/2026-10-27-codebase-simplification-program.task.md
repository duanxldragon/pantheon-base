---
title: 代码精简与横向重复收敛计划（2026-10-27 审计整改）
doc_type: Remediation
layer: platform
depends_on_layers:
  - system/auth
  - system/iam
  - system/org
  - system/config
status: Active
linked_contracts:
  - docs/reviews/CODEBASE_SIMPLIFICATION_AUDIT.md
  - docs/reviews/REDUNDANT_CODE_CANDIDATES.md
  - docs/reviews/CODE_SIMPLIFICATION_PLAN.md
updated_at: 2026-10-27
---

# Task Packet: 2026-10-27-codebase-simplification-program

## Goal

2026-10-27 对 `pantheon-base` 做了全仓只读审计，结论是 **LEAN-WITH-DEBT**：分层健康（handler → service 两层，无空转发层，`modules/business/*` 与 `modules/system/*` 边界清晰，测试/生产行数比约 0.73），
但基础设施逻辑被横向复制了 11–35 次，治理文档面（1,522 文件）已经超过产品代码面（982 文件）。

本程序把审计的三批建议拆成 12 个可独立评审、独立回滚的波次：

- **S1 删死码与收窄导出面**：`pkg/common/token.go` 整文件（129 行、34 个导出、全仓 0 调用）、
  `logging_middleware.go`、`common.ErrorResponse`、`database.SetEx`、`isForbiddenRequestError`、
  13 个孤儿前端脚本；以及 4 个"只用在自己包里却导出"的符号。
- **S2 收敛横向重复**：先只新增共享助手并测试，再分波替换 35 处路径 ID 解析、13 份分页归一化、
  6–8 份排序白名单、11 份错误常量、30+ 处 `ErrRecordNotFound`、6 处批量 handler、8 个模块的导入导出样板。
- **S3 触碰高风险面**：租户作用域三件套统一（14 个 service）、角色数据范围镜像模型、OIDC 响应形状、
  以及 5 项需要维护者拍板的治理面决策。

**本程序不改任何对外行为**：路由、请求/响应结构、错误码、i18n key、权限码、菜单、seed、数据库 schema 与迁移全部保持原样；
不升级依赖；不删测试；不缩减 `frontend/src/index.ts`；不改 `pantheon-ops` 业务代码（只做兼容性验证）。

## Primary Layer

platform

## Dependency Layers

- system/auth
- system/iam
- system/org
- system/config

## Harness Profile

- Template: admin-platform
- Overlay: pantheon-base
- Quality Profile: none
- Portable Failure Class: maintainability-gap / duplication-drift
- Owner Layer: consumer-repository
- Coverage Dimensions:
  - behaviour
  - maintainability
  - architecture-fitness
  - runtime-quality

## Contract Anchors

- `AGENTS.md`
- `CLAUDE.md`
- `DESIGN.md`
- `docs/README.md`
- `docs/reviews/CODEBASE_SIMPLIFICATION_AUDIT.md`
- `docs/reviews/REDUNDANT_CODE_CANDIDATES.md`
- `docs/reviews/CODE_SIMPLIFICATION_PLAN.md`
- `docs/acceptances/CODE_REVIEW_STANDARD.md`

## Scope

### In

- 13 个波次 packet：S1 两个、S2 六个、S3 三个、S4 两个，全部登记在 `.harness/tasks/2026-10-27-*`
- 每个波次独立的 task packet、evidence 目录与 review
- 每波合并后的 foundation release 与 `base -> ops` 同步验证
- 程序级收口：把估算收益替换为实测 `git diff --stat`，并汇总到 `.harness/evidence/2026-10-27-codebase-simplification-program/summary.md`

### Out

- 任何行为变更：路由、响应结构、错误码、i18n key、权限码、菜单与 seed
- 数据库 schema、迁移、回填或任何数据修复
- 依赖升级或新增依赖（含开发工具链）
- 为了让重构通过而修改或删除测试断言
- 缩减 `frontend/src/index.ts` 的导出集合（唯一稳定下游契约面）
- 合并 `dept` 与 `post` 模块，或把 7 个 handler service 包装泛型化（审计已明确否决）
- 修改 `pantheon-ops` 业务代码；只做兼容性验证
- 使用维护者专属的 `solo-override` 路径

## Expected Files

### Create

- `docs/harness/tasks/2026-10-27-codebase-simplification-program.task.md`
- `.harness/tasks/2026-10-27-codebase-simplification-program/manifest.json`
- `.harness/tasks/2026-10-27-s1-dead-code-removal/manifest.json`
- `.harness/tasks/2026-10-27-s1-api-surface-narrowing/manifest.json`
- `.harness/tasks/2026-10-27-s2-shared-handler-helpers/manifest.json`
- `.harness/tasks/2026-10-27-s2-id-parse-migration/manifest.json`
- `.harness/tasks/2026-10-27-s2-pagination-sort-migration/manifest.json`
- `.harness/tasks/2026-10-27-s2-error-mapping-dedup/manifest.json`
- `.harness/tasks/2026-10-27-s2-batch-and-envelope/manifest.json`
- `.harness/tasks/2026-10-27-s2-import-export-pipeline/manifest.json`
- `.harness/tasks/2026-10-27-s3-tenant-scope-unification/manifest.json`
- `.harness/tasks/2026-10-27-s3-role-data-scope-model/manifest.json`
- `.harness/tasks/2026-10-27-s3-oidc-envelope/manifest.json`
- `.harness/tasks/2026-10-27-s4-governance-decisions/manifest.json`

### Modify

- 本波次只创建计划产物；业务代码修改由各波次 packet 声明

### Do Not Touch

- `backend/pkg/database/migrations/**`
- `database/**`
- `.github/workflows/**`
- `frontend/src/index.ts`
- `pantheon-ops/**`
- 已发布的 tag 与 release 资产

## Implementation Notes

- 波次之间只能整批推进：S1 合并并发布后 S2 才能开始；S2 稳定一个发布周期后 S3 才排期。
- 收敛的含义是"做法只有一份"，不是"值只有一份"：列名白名单、分页上限、i18n key、模块特判错误码全部由调用方传入，不在助手内拍板。
- 如果共享助手需要第 3 个可选参数才能多适配一个模块，停手，保留该模块的本地实现，并在该波 review 里记录例外。
- 一个提交只做一种模式。分页迁移和错误映射迁移不放在同一提交，保证 `git bisect` 可用。
- Planner/Dispatcher 不得直接修改 `backend/` 与 `frontend/src/`；每个波次由 Generator 适配器执行，交接记录写入 task packet 与 evidence。
- 只有"行为可能变化"时才可以拒绝：如果一个波次无法证明等价，按 `abandoned` 关闭并写明原因，不允许按 `completed` 关闭。

## Verification Plan

- `cd backend && go build ./...`
- `cd backend && go vet ./...`
- `cd backend && go test -count=1 ./...`（基线 46 包 ok / 0 FAIL / 0 SKIP）
- `cd frontend && npm run build`
- `cd frontend && npm run lint`
- `node scripts/harness/check-task-packet.mjs --root .`
- `node scripts/harness/check-evidence.mjs --strict .harness/evidence/<wave-task-id>/commands.json`
- `node scripts/harness/check-review.mjs --strict .harness/evidence/<wave-task-id>/review.md`
- `cd ../pantheon-ops && go build ./... && npm run build`
- 每波记录实测 `git diff --stat`，与审计估算对比后写入 evidence

## Linkage

- Task ID: `2026-10-27-codebase-simplification-program`
- Task Manifest: `.harness/tasks/2026-10-27-codebase-simplification-program/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Plan References: `docs/reviews/CODEBASE_SIMPLIFICATION_AUDIT.md`, `docs/reviews/REDUNDANT_CODE_CANDIDATES.md`, `docs/reviews/CODE_SIMPLIFICATION_PLAN.md`
- Evidence Directory: `.harness/evidence/2026-10-27-codebase-simplification-program/`
- Review File: `.harness/evidence/2026-10-27-codebase-simplification-program/review.md`

## Evidence Required

- 每个波次的 `commands.json`：cwd、status、真实输出摘要；未执行的标注 `not-run` 和原因
- 每个波次的 `summary.md`：实测 diff stat、关闭的 RC 编号
- 每个波次的 `review.md`：逐调用点的等价性论证
- 程序收口 `summary.md`：13 个波次的实测净减少汇总
- 任何触碰 HTTP 响应路径的波次：改造前后一次真实响应体快照

## Human Gates

- S1 删除 10 个 `capture-*.mjs`：确认是否仍用于人工视觉走查
- S2 导入导出管线收敛（RC-016）：批准以单独 PR 隔离，因为触碰 CSV 注入防护与行级错误聚合
- S3 租户作用域统一（RC-012 / RC-027）：批准触碰多租户热路径，并在开工前提供或批准双租户端到端冒烟
- S3 角色数据范围镜像模型（RC-022）：决定共用模型还是保留镜像加 checker
- RC-026 OIDC 响应形状：决定协议响应是否允许保持非信封形态
- RC-036 / RC-037 / RC-038：决定 99 个 `.en.md`、未索引 LLM 评审稿、659 个归档文件的去留
- S2 落地后是否冻结功能、进入维护阶段

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] S1 波次合并：死码删除后 `go test ./backend/...` 仍为 46 ok / 0 FAIL（2026-10-29 复测 47 ok：
      多出的包是 S3 新增的 `modules/system/iam` 双租户冒烟，无包减少）
- [x] S2 波次合并：ID 解析、分页、排序、错误映射、批量操作、导入导出各只剩一份实现且有测试
      （3 处例外已逐条记录：`setting_audit` 分页、tenant member 分页、i18n 的两处 ID 解析）
- [x] S3 波次有结论：租户作用域收敛（`tenantOwnerID` 11 → 0）、角色镜像模型删除、OIDC 仅补注释；
      三项均按 completed 关闭，无 abandoned
- [x] 每个波次的实测净减少已记录并汇总，替换审计估算
      （`.harness/evidence/2026-10-27-codebase-simplification-program/summary.md`；
      计划文档 §11 同步）
- [ ] `pantheon-ops` 能对同步后的 foundation release 构建通过
      — 未关闭：需要一个覆盖 13 个波次的 foundation release，属维护者发布决策；
      波次全部以常规 PR 合入 `main`，没有对应的发布。读数为 `not-run`，不是 pass。
- [x] 全程未改动任何路由、权限码、菜单、i18n key、错误码、schema 或迁移

> 收口：2026-10-29 `2026-10-29-simplification-program-closeout`。本包状态保持 `in-progress`，
> 唯一未勾项是上面的 `pantheon-ops` 构建验证。
