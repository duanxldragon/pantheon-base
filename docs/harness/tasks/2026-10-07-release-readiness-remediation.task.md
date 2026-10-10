---
title: Pantheon Base 最终验收整改任务包
doc_type: Remediation
layer: platform
depends_on_layers:
  - system/auth
  - system/iam
  - system/config
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/SYSTEM_AUTH_CONTRACT.md
  - docs/contracts/SYSTEM_IAM_CONTRACT.md
  - docs/contracts/SYSTEM_CONFIG_CONTRACT.md
updated_at: 2026-10-07
---

# Task Packet: 2026-10-07-release-readiness-remediation

## Goal

关闭 [2026-10-07 最终验收报告](../../reviews/ENTERPRISE_RELEASE_READINESS_REVIEW_2026-10-07.md) 的发布 Blocker，取得同一候选提交的运行、视觉和门禁证据，再作企业级底座收尾判定。

## Primary Layer

platform

本任务包由平台层协调；实现归属分别为 `system/auth`、`system/iam`、`system/config` 和仓库治理，不在 `business/*` 实施共享底座补丁。

## Workspace Context

共享安全/权限行为通过新的 foundation release 后再更新 consumer lock；本任务包不直接编辑 Ops。具体版本须依据当前远端 tag/`VERSION` 核实，任务包不预定版本号。

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`（仅 G01 的镜像同步）
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `required`
- Release Requirement: `foundation-release`

## Dependency Layers

- `system/auth`：自助与管理会话、登录日志的主体及租户边界。
- `system/iam`：角色数据范围与失效拒绝。
- `system/config`：发布文档和系统参数相关合同核对。
- `pantheon-harness`：仅 G01 需要维护上游 checker 镜像。

## Harness Profile

- Template: admin-platform
- Overlay: pantheon-base
- Quality Profile: `auth-security` + `permission-policy` + `ci-workflow` + `ui-runtime`
- Portable Failure Class: `security-boundary-gap`、`runtime-evidence-gap`、`ci-signal-noise`
- Owner Layer: `consumer-repository`
- Ratchet Decision: 安全边界错误补邻近回归；重复的 CI/文档漂移补 checker 或维护既有 gate
- Coverage Dimensions:
  - behaviour
  - maintainability
  - architecture-fitness
  - runtime-quality
  - method-health

## Contract Anchors

- `AGENTS.md`、`DESIGN.md`、`docs/README.md`
- `docs/contracts/SYSTEM_AUTH_CONTRACT.md`、`SYSTEM_IAM_CONTRACT.md`、`SYSTEM_CONFIG_CONTRACT.md`
- `docs/acceptances/ACCEPTANCE_CHECKLIST.md`、`docs/harness/AI_QUALITY_GOVERNANCE.md`
- `docs/reviews/ENTERPRISE_RELEASE_READINESS_REVIEW_2026-10-07.md`

## Scope

### In

- F01–F06 的最小权限、租户、审计与数据范围修复和回归。
- G01–G03 的治理门禁、真实升级步骤与交付状态纠偏。
- 同一候选提交的 SonarCloud、CI、后端、前端、浏览器、MySQL、依赖及有界性能证据。
- 按已声明的最终条件完成 PR、分支、文档与 foundation handoff 收口。

### Out

- 新增 SSO、完整文件资产台、全量可访问性重构或其他未证实的 P2 功能。
- 仅为分数好看而重写成熟模块、扩大租户模型或调整平台/业务域边界。
- 在此计划阶段修改业务代码、合并 PR、删除分支、发布 tag 或修改门禁规则。

## Expected Files

### Create

- `.harness/tasks/2026-10-07-*/manifest.json`；执行后在各自 `.harness/evidence/<task-id>/` 留证。

### Modify

- `backend/modules/auth/login/`、`backend/modules/auth/session/`、`backend/modules/system/iam/` 及邻近测试。
- `backend/internal/middleware/`、`RELEASE_NOTES_v0.14.0.md`、`scripts/harness/` 与必要的合同、smoke、状态文档。
- 具体文件以各子任务 manifest 和实现前调用链核对为准。

### Do Not Touch

- `pantheon-ops/business/*` 和无关业务模块。
- 已发布 tag/Release；未经治理决定的 Quality Gate 规则。

## Implementation Notes

- 按子任务的 `findings` 和验收标准实施最小修复，先复用既有属主、租户、审计和策略接口。
- `auth-session-scope` 完成后再执行 `login-log-identity`，避免并发修改 `login_handler.go`。
- 共享行为变更需记录 base → ops 同步范围；候选版本和最终 SHA 由资格验证阶段确定。

## Structural Scope

- Affected Subgraph: `auth handler -> session/login service -> tenant-scoped persistence`；`data-scope middleware -> role policy -> list/export`；`request -> operation audit -> persisted log`。
- Boundary Crossings: `system/auth -> pkg/tenant`、`system/iam -> pkg/database`、`pantheon-harness -> base mirror`、`base -> ops release`。
- Risk Nodes: 自助会话入口、管理会话查询/吊销、数据范围失败分支、角色策略更新、审计体读取。
- Graph Focus: 授权入口到持久化的 sensitive-input-flow 与 tenant/role policy 影响面。

## Execution Roles

- Implementer Posture: 每个独立任务由对应域 Executor 实施，不交叉改写同一文件；平台协调者只维护治理文档和证据链。
- Reviewer Posture: 安全 Reviewer 独立复核 F01–F05；IAM Reviewer 复核 F06；UX/QA 复核浏览器状态；Mechanical Gate 复核 CI/发布证据。
- 每个子任务先读自己的 manifest 与本父 packet，确认实际调用链和 DDL/索引影响，再写最小修复。

## Dependency Plan

| Wave | 优先级 | 子任务（`.harness/tasks/<id>/manifest.json`） | 依赖 | 关闭条件 |
| --- | --- | --- | --- | --- |
| 0 | P0 | `2026-10-07-auth-session-scope` → `2026-10-07-login-log-identity`；`2026-10-07-iam-data-scope`、`2026-10-07-audit-request-body` | 两项 auth 任务顺序执行，均可能修改 `login_handler.go`；IAM 与审计任务可并行 | F01–F06 的邻近测试和安全 review 通过 |
| 0 | P0 | `2026-10-07-governance-gate-repair`、`2026-10-07-upgrade-runbook` | 可与安全修复并行 | G01、G03 的本地/hosted 证据与迁移演练 |
| 1 | P0 | `2026-10-07-release-qualification` | Wave 0 | 当前候选 SHA 的安全、功能、Sonar、UI、性能、依赖与 smoke 证据齐备 |
| 2 | P0 | `2026-10-07-release-closeout` | Wave 1 | G02、所有最终收尾条件、human gate 与 Ops handoff 清楚 |
| 后续 | P1 | `2026-10-07-performance-followup`、`2026-10-07-ui-maintainability-followup` | 不阻塞 Wave 2，除非测出新 Blocker | 独立小范围任务完成或挂账 |

任何 Wave 0 修复改变共享接口、菜单、权限、i18n、DDL 或 smoke 选择器时，必须同步其测试、脚本、合同和 `pantheon-ops` 继承影响说明。Wave 1 遇真实新 Blocker 时回到对应域任务，不以“测试已跑”替代故障归因。

## Verification Plan

- Backend: 从 `backend/` 执行受影响包测试、`go test ./...`、`go vet ./...`；安全任务增加故障注入、双用户/双租户敌对用例。需 CGO 的 SQLite 测试在可用工具链或 CI 环境运行，不能把本机 `CGO_ENABLED=0` 失败当作代码通过。
- Frontend: 从 `frontend/` 执行 `npm run type-check`、`npm run lint`、`npm run test:unit`、`npm run build` 与相关合同检查。
- Browser/Smoke: 登录、自助/管理会话、受限角色列表/导出、租户隔离、上传审计、用户编辑等链路；记录最终 URL、console error、1440×900 和 390×844 截图、loading/empty/error/forbidden/submitting 状态。
- Runtime: MySQL/Redis 一次性环境验证策略读取失败、两租户隔离、升级/回滚；对首页、成员列表和旧审计数据记录代表性查询/耗时，缺失时写明 gap。
- Security/CI: `govulncheck`、`npm audit`、SonarCloud 未解决项逐条分类；候选 SHA 的 GitHub Actions 必需检查及 Release Gate 全绿，不使用 `solo-override`。

## Evidence Required

- 每个子任务完成时写 `.harness/evidence/<task-id>/commands.json`、`summary.md`、`review.md`，包含失败用例前后、风险边界与剩余 gap。
- 父任务记录最终候选 SHA、SonarCloud analysis、CI run IDs、PR/分支状态、视觉截图索引、迁移演练结果和维护者最终验收决定。
- 父任务处于 `planned` 时尚无可链接的 review；完成独立复核后，将 Linkage 的 Review File 指向 `.harness/evidence/2026-10-07-release-readiness-remediation/review.md`，并附实际复核结论。
- 静态推断与运行复现分别标记；无新鲜证据的项目保持 `unknown`，不计通过。

## Human Gates

- 若修复要求改变认证/数据权限合同、数据库迁移或 Quality Gate 策略，由维护者决定；不由 Agent 自行豁免。
- 合并/删除远端分支、发布不可变 tag/Release、生产迁移和最终视觉/功能验收留在最终维护者触点。

## Linkage

- Task ID: `2026-10-07-release-readiness-remediation`
- Task Manifest: `.harness/tasks/2026-10-07-release-readiness-remediation/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Evidence Directory: `.harness/evidence/2026-10-07-release-readiness-remediation/`
- Review File: `none`
- Plan References: `docs/harness/tasks/2026-10-07-release-readiness-remediation.task.md`、`docs/reviews/ENTERPRISE_RELEASE_READINESS_REVIEW_2026-10-07.md`
- Assessment: `docs/reviews/ENTERPRISE_RELEASE_READINESS_REVIEW_2026-10-07.md`

## Completion Checklist

- [ ] Layer and boundary declared
- [ ] Contract anchors read
- [ ] Verification run or exception recorded
- [ ] Evidence saved or summarized
- [ ] Review completed
- [ ] F01–F06 代码缺陷已修复且敌对回归通过
- [ ] G01–G03 的 CI、迁移文档和 PR/分支状态已关闭
- [ ] SonarCloud 问题完成分类，Quality Gate 与 Release Gate 对同一 SHA 通过
- [ ] 核心功能、运行态、视觉、性能和依赖安全证据齐备或按门禁作显式决定
- [ ] 所有子任务 evidence/review、foundation release 和 Ops handoff 已记录
- [ ] 维护者完成最终视觉/功能验收并决定正式收尾
