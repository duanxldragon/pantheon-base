---
title: Base 功能收尾、发行与 Ops 消费
doc_type: Remediation
layer: platform
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/TENANT_CONTRACT_V1.md
status: Active
updated_at: 2026-11-06
---

# Task Packet: 2026-11-05-base-freeze-release

## Goal

完成当前 Base 功能（租户保留），验证后提交并合并相关变更、确保 CI 成功、发行新的 foundation release，让 Ops 消费。

2026-11-06 补充范围：纳入 GitHub 已合并 PR #485，修复 minimatch Dependabot #52，成功门禁后发行 v0.18.4，再让 Ops 从 GitHub 最新稳定正式 release 获取并消费。消费/漂移入口不得使用本地 Base 目录。当前连接 EACCES，安装、新版远程门禁、发布及最终消费待恢复允许联网的执行环境。

## Priority

P1；L2。用户已授权开发、文档、提交、合并、发布和消费；旧整改任务中的发布延期由本任务接管。

## Primary Layer

platform

## Dependency Layers

- system/auth
- system/iam
- system/org
- system/config
- business/*（仅下游消费兼容）

## Workspace Context

- Target Repository: pantheon-base
- Repository Role: foundation-source
- Upstream Dependencies: pantheon-harness
- Downstream Consumers: pantheon-ops
- Sync Expectation: required
- Release Requirement: foundation-release
- Downstream Sync Note: 只通过正式 release 与 overlay 更新 Ops，不抄写 Base main。

## Harness Profile

- Template: admin-platform
- Overlay: pantheon-base
- Quality Profile: auth-security
- Portable Failure Class: runtime-evidence-gap
- Owner Layer: consumer-repository
- Coverage Dimensions:
  - behaviour
  - maintainability
  - architecture-fitness
  - runtime-quality

## Contract Anchors

- `AGENTS.md`
- `DESIGN.md`
- `docs/README.md`
- `docs/contracts/TENANT_CONTRACT_V1.md`
- `docs/contracts/SYSTEM_AUTH_CONTRACT.md`
- `docs/contracts/SYSTEM_IAM_CONTRACT.md`
- `docs/contracts/SYSTEM_ORG_CONTRACT.md`
- `docs/contracts/SYSTEM_CONFIG_CONTRACT.md`

## Scope

### In

- 当前功能及已获批准的未完成实现：认证、安全、IAM、组织、配置、字典、i18n、审计、上传、导入导出、lowcode/动态模块、平台壳层和租户 V1。
- 保留 11 月 3/4 日已有整改，先核对其状态，再修真实缺陷和验证缺口。
- 同步受影响文档、测试、fixture、权限、菜单、i18n 与烟测。
- 本地门禁、独立评审、GitHub 全部相关 CI、合并、发行、Ops 消费闭环。

### Out

- 未启动的历史产品设想；不把文档草案自动扩大成开发范围。
- 租户 V2、业务域多租户隔离、商业计费、配额强制。
- 生产数据操作、质量策略放宽、Agent 自贴 solo-override、覆盖其他贡献者改动。

## Structural Scope

- Affected Subgraph: auth refresh -> opaque token -> session CAS; system route groups -> tenant/authz/data scope; generator -> generated module -> build/register; foundation bundle -> Ops overlay -> consumer lock.
- Boundary Crossings: system/* -> pkg/*; base -> ops.
- Risk Nodes: auth handler, session service, tenant route groups, SSRF transport, generator, release metadata.
- Graph Focus: sensitive-input-flow, cycle-check, hub-check.

## Expected Files

### Create

- `.harness/tasks/2026-11-05-base-freeze-release/manifest.json`
- `.harness/tasks/2026-11-05-base-freeze-release/tasks.json`
- `.harness/evidence/2026-11-05-base-freeze-release/summary.md`
- `.harness/evidence/2026-11-05-base-freeze-release/review.md`

### Modify

- `backend/`、`frontend/src/`：仅当前功能真实缺陷及同步测试。
- `scripts/`、`docs/`、`VERSION`、`CHANGELOG.md`：验证与正式发行需要的有限变更。
- `.harness/STATUS.md`：当前事实与明确缺口。

### Do Not Touch

- 生产数据库、无关业务功能、历史审计原结论、无关分支/PR。

## Implementation Notes

采用最小复杂度阶梯，优先复用已有 helper、脚本、契约与安装依赖。Generator 是产品代码单一写入者；协调者处理治理与发布，Reviewer 独立判断。

## Verification Plan

- go test -race ./...
- npm run lint
- npm run type-check
- npm run build
- npm run test:unit
- npm run test:scripts
- npm run check:docs-frontmatter
- npm run check:task-packet
- npm run test:smoke:core
- npm run test:smoke:tenant
- npm run test:generator:smoke

隔离 MySQL/Redis、UI 渲染、当前 commit 的 GitHub CI/release-gate、正式 release checksum 与 Ops 重建/race。

## Linkage

- Task ID: 2026-11-05-base-freeze-release
- OpenSpec Change: none
- Superpowers Plan: none
- Task Manifest: .harness/tasks/2026-11-05-base-freeze-release/manifest.json
- Evidence Directory: .harness/evidence/2026-11-05-base-freeze-release/
- Review File: .harness/evidence/2026-11-05-base-freeze-release/review.md
- Change Ref: none
- Plan References: .harness/tasks/2026-11-05-base-freeze-release/tasks.json

## Evidence Required

实际命令、退出码、候选树识别、测试/skips、runtime logs、UI screenshots、独立 review、PR/CI/release 与消费者锁的可核验证据。

## Human Gates

用户已授权提交、合并、发行与消费，无须重复确认；生产破坏操作与质量门禁政策变化仍需维护者决定。网络访问失败记录为环境缺口，不伪造远程成功。

## Sync expectation

Base-first，正式 foundation release 校验后 Ops 消费。两仓都有成功验证及相关 CI 才能关闭本任务。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Implementer/reviewer and authorization declared
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [ ] Review completed
- [ ] Current functionality inventory and implementation complete
- [ ] Local verification and runtime evidence complete
- [ ] Independent review complete
- [ ] GitHub CI, merge and new release complete
- [ ] Ops official release consumption complete
