---
title: v0.17.0 发布与验收遗留项收口任务包（D2/F2/B10/G2/浏览器终验）
doc_type: Remediation
layer: platform
depends_on_layers:
  - system/auth
  - system/iam
  - system/config
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/operations/RUNBOOK.md
  - docs/reviews/PANTHEON_BASE_FINAL_ACCEPTANCE_REVIEW_2026-10-21.md
updated_at: 2026-10-22
---

# Task Packet: 2026-10-22-release-and-residual-closeout

## Goal

完成已经通过门禁的 v0.17.0 发布，并关闭最终验收报告遗留的四项：D2 凭据轮换、F2 main 分支保护、B10 Tenant Smoke advisory 摘除、G2 MySQL skip 掩盖防护；最后用本机全栈完成浏览器级验收，把原报告中的 UI 视觉 gap 变为有证据的结论或显式残留。

## Primary Layer

platform

发布与治理动作不改变产品行为；唯一的运行代码改动是 `pkg/testmysql` 测试辅助的 fail-loud 开关。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `required`
- Release Requirement: `foundation-release`

## Dependency Layers

- `platform`：release、分支保护、CI workflow 与验收证据。
- `system/auth`：Redis 会话凭据轮换后，会话/撤销测试需继续在真实 Redis 上全绿。
- `system/iam`、`system/config`：`smoke-tenant` 与平台能力门路径作为 B10 的观测对象，不改其源码。
- 下游消费：`pantheon-ops` 的 lock 推进不在本包内。

## Harness Profile

- Template: admin-platform
- Overlay: pantheon-base
- Quality Profile: ci-workflow
- Portable Failure Class: `release-artifact-gap` / `silent-test-skip`
- Owner Layer: consumer-repository
- Ratchet Decision: sensor-added（`PANTHEON_TEST_DSN_REQUIRED` 与 CI 环境配对）
- Coverage Dimensions:
  - behaviour
  - maintainability
  - runtime-quality

## Contract Anchors

- `docs/operations/RUNBOOK.md` §Redis-backed tests / §MySQL-backed tests
- `.github/workflows/ci.yml`、`quality.yml`、`smoke-core.yml`
- `docs/reviews/PANTHEON_BASE_FINAL_ACCEPTANCE_REVIEW_2026-10-21.md` §8/§10
- `docs/reviews/PANTHEON_BASE_ISSUES_AND_REMEDIATION_2026-10-21.md` §6

## Scope

### In

- v0.17.0 tag/release 的发布与资产校验。
- `testmysql` 的 required-DSN 开关、单测与三个 Go 测试 job 的环境。
- Tenant Smoke 的 advisory 摘除。
- 凭据轮换、跟踪文件脱敏与残余工件登记。
- 本机全栈浏览器巡检与交互证据。
- 三份 review 文档的 2026-10-22 收口追加。

### Out

- 重写 git 历史、替换已发布 v0.17.0 资产（需维护者明确授权）。
- 修改 Sonar 规则或 Quality Gate 阈值。
- 产品 API、权限、迁移、前端源码改动。
- 提交本地 `.env`、临时日志或浏览器运行目录。

## Expected Files

### Create

- `.harness/tasks/2026-10-22-release-and-residual-closeout/manifest.json`
- `.harness/evidence/2026-10-22-release-and-residual-closeout/{commands.json,summary.md,review.md}`
- `.harness/evidence/2026-10-22-release-and-residual-closeout/artifacts/*.png`
- `.harness/evidence/2026-10-22-release-and-residual-closeout/{browser-sweep.json,browser-interactions.json}`
- `docs/harness/tasks/2026-10-22-release-and-residual-closeout.task.md`

### Modify

- `backend/pkg/testmysql/mysql.go`、`backend/pkg/testmysql/mysql_test.go`
- `.github/workflows/ci.yml`、`.github/workflows/quality.yml`、`.github/workflows/smoke-core.yml`
- `docs/operations/RUNBOOK.md`
- `docs/reviews/PANTHEON_BASE_{FINAL_ACCEPTANCE_REVIEW,ISSUES_AND_REMEDIATION,TEST_AND_ACCEPTANCE_REPORT}_2026-10-21.md`
- `.harness/archive/2026-09/evidence/2026-09-23-governance-residual-closeout/{commands.json,summary.md}`

### Do Not Touch

- 历史 tag、已发布 release 资产、`.harness/archive/**` 的其他文件。
- Sonar 规则、Quality Gate 阈值、既有 required-check 集合（SonarCloud 之外不新增）。
- 产品 API、权限、迁移、前端源码；本地 `.env` 与 `.tmp` 运行目录不入库。

## Implementation Notes

- `testmysql` 与 `testredis` 保持同一套 fail/skip 语义：required 标志 truthy 时无 DSN 直接 fatal；
  未设置时保持 skip，以支持裸 checkout。DSN 继续按 `PANTHEON_TEST_DSN` → `PANTHEON_DSN` 解析。
- 只有 provision MySQL 的 Go 测试 job 才设置 `PANTHEON_TEST_DSN_REQUIRED`；smoke 作业运行二进制，不需要。
- `smoke-core` 是 push-only workflow，B10 的「阻塞」是 mainline run 变红，不能表述为 PR merge gate。
- 发布已完成，本包不重新打 tag；已发布资产不可变，凭据残留通过文档与后续版本处理。

## Verification Plan

- `gh release view pantheon-base-v0.17.0 --json ...` 与 `gh run list --workflow foundation-release-verify.yml`
- `gh api repos/duanxldragon/pantheon-base/rulesets/17011510`
- `gh run list --workflow smoke-core.yml --branch main --limit 6`
- required/optional 两种 DSN 探针 + `go build ./...` + `go test ./pkg/testmysql`
- 真实 MySQL/Redis + 两个 required 标志下 `go test ./... -count=1`
- 浏览器 18 路由巡检 + 8 组交互
- `check-task-packet`、`check-evidence --strict`、`frontmatter-check`、`actionlint`

## Evidence Required

- release tag/target、四资产大小与 SHA-256、Verify run 结论。
- ruleset id、enforcement、required status checks。
- 最近 5 次 smoke-core 结论。
- fail-loud / skip 探针输出与全量测试 0 skip / 0 fail。
- 浏览器路由与交互 JSON、截图。
- 文档与 workflow 检查器输出。

## Human Gates

- 已发布 v0.17.0 资产是否替换、以及是否补发 v0.17.1：需维护者授权/决定。
- 生产备份恢复演练、G3 sizing、B7 并发初始化：需维护者/DBA 执行，不在本包内。

## Linkage

- Task ID: `2026-10-22-release-and-residual-closeout`
- Task Manifest: `.harness/tasks/2026-10-22-release-and-residual-closeout/manifest.json`
- Evidence Directory: `.harness/evidence/2026-10-22-release-and-residual-closeout/`
- Review File: `.harness/evidence/2026-10-22-release-and-residual-closeout/review.md`
- Plan References: `docs/reviews/PANTHEON_BASE_FINAL_ACCEPTANCE_REVIEW_2026-10-21.md`、`docs/reviews/PANTHEON_BASE_ISSUES_AND_REMEDIATION_2026-10-21.md`、`docs/operations/RUNBOOK.md`

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] v0.17.0 tag/release 与 Verify 结论已取证
- [x] F2/B10/G2/D2 已收口并登记残留
- [x] 浏览器 18 路由 + 8 组交互取证
- [ ] v0.17.0 资产中的失效旧凭据清理（需维护者决定补发/替换）
- [ ] 生产备份恢复演练与 G3 sizing（维护者/DBA）

## Acceptance Criteria

1. tag 指向 `728feb2b`，四个资产校验和一致，Verify run success。
2. ruleset active、无 bypass、五个 required checks。
3. Tenant Smoke 不再 `continue-on-error`，最近 5 次 main 运行全绿。
4. required + 无 DSN 为 FAIL，未设置时为 SKIP；所有 MySQL provisioning 的 Go job 设置该标志。
5. 真实 MySQL + Redis 全量测试 0 fail / 0 skip。
6. 18 条路由 + 8 组交互无 console error / 无失败 API，截图入库。
7. docs、task packet、evidence、actionlint 检查通过。

## Residuals

- v0.17.0 `repo.tar`（及 tgz 内嵌副本）仍含已失效旧凭据；历史 git 对象同理。
- 浏览器未提交写操作；跨租户 HTTP 攻击矩阵、生产备份恢复演练、G3 sizing、B7 并发初始化仍按原报告登记。
- 本机只有 Cygwin gcc，`-race` 由 hosted `go-race` job 覆盖。
