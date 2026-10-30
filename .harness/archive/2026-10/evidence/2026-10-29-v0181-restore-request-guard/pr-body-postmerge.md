## 变更摘要

- 改动层级：platform（仅文档与证据；无产品源码、无 workflow、无门禁改动）
- 改动模块：`.harness/STATUS.md`、`.harness/evidence/2026-10-29-v0180-simplification-release/commands.json`、
  `.harness/evidence/2026-10-29-v0181-restore-request-guard/{commands.json,review.md,manifest.json}`、
  `docs/harness/tasks/2026-10-29-v0181-restore-request-guard.task.md`、
  `docs/harness/tasks/2026-10-27-codebase-simplification-program.task.md`、
  `.harness/tasks/2026-10-27-codebase-simplification-program/manifest.json`、
  `docs/reviews/CODE_SIMPLIFICATION_PLAN.md`、
  `.harness/evidence/2026-10-27-codebase-simplification-program/summary.md`
- 目标问题：v0.18.1 已于 2026-10-29 发布，`pantheon-ops` 已对其重建并构建通过；本 PR 把发布事实、
  消费仓构建读数与精简程序清单最后一项回填到证据与计划文档，并把程序包转为 `completed`
- 预期影响：无运行行为变化；`pantheon-base-v0.18.1` 已发布，`pantheon-ops` 的 live 树替换与其
  commit 仍属消费仓自身评审

## Harness 链路

- Task ID：`2026-10-29-v0181-restore-request-guard`
- Task Manifest：`.harness/tasks/2026-10-29-v0181-restore-request-guard/manifest.json`
- Evidence：`.harness/evidence/2026-10-29-v0181-restore-request-guard/commands.json`
- Verification evidence：`.harness/evidence/2026-10-29-v0181-restore-request-guard/summary.md`
- Review Artifact：`.harness/evidence/2026-10-29-v0181-restore-request-guard/review.md`
- OpenSpec change：none
- Trivial change：no
- Quality Profile：ci-workflow
- Ratchet Decision：guide-updated
- GitHub Signal：repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-10-29-v0181-restore-request-guard
- task manifest: .harness/tasks/2026-10-29-v0181-restore-request-guard/manifest.json
- evidence: .harness/evidence/2026-10-29-v0181-restore-request-guard/commands.json
- boundaries: 仅回填发布证据、消费者构建读数、程序清单收口与 STATUS；未改 backend / frontend / workflow / 门禁 / 依赖
- backend response contract: unchanged（无后端改动）
- backend DTO contract: unchanged（无后端改动）
- permission contract: unchanged（未新增或删除权限码）
- audit coverage: unchanged（无审计链路改动）
- visual evidence: not-applicable（无 UI 改动）
- inheritance contract: `sharedPaths` 仍 52 项；消费仓锁已推进到 `pantheon-base-v0.18.1`
- base drift: 基于 `main` @ `93505225`
- Base/ops inheritance: `pantheon-ops` 的重建与构建已执行并记录，live 树替换与提交留给该仓库

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

补充说明：本 PR 只记录已完成的事实（tag、Release、四件资产、`Foundation Release Verify`、消费仓构建），
不改变任何运行行为；`pantheon-ops` 的 live 树替换属消费仓 L2 门禁，不在本仓提交。

## 验证记录

- [x] `git rev-list -n 1 pantheon-base-v0.18.1` → `93505225e36c8d3ba5aa9facc12975eb813167d3`
- [x] `gh release view pantheon-base-v0.18.1 --json assets` → 四件资产，tgz `2fe49d70…`、
      `repo.tar` `37ae7a08…`
- [x] `node scripts/foundation-release/check-release-assets.mjs --release-version pantheon-base-v0.18.1`
      → 四件资产齐备
- [x] `Foundation Release Verify` run 40817118092 → success
- [x] `pantheon-ops`：`rebuild:from-base` 756 个文件；staging 后端 `go build ./...` 0；
      staging 前端 `npm run build` `✓ built in 725ms`
- [x] `check:task-packet`（四个活动包全 PASS）、`check:harness-docs`（0 finding）、
      `check:harness-adoption`（0/0）、`check:structure`（0/2931）、`check:harness-encoding`（0/2583）、
      `check:docs-frontmatter`（399 docs / 279 带 frontmatter）
- [x] `check-evidence.mjs --strict`、`check-review.mjs --strict`、`check-failure-registry.mjs --strict` → 全 PASS
- [ ] `pantheon-ops` live 树替换后 `check:shared-drift`（当前 81 modified / 7 missing，属未替换状态，
      见 `commands.json` 的 `knownGaps`）

## 审核留痕

- Copilot review：见 PR 机器人读数；本 PR 为发布证据与程序收口回填
- CodeQL 结果：无代码改动
- GitHub checks 结果：见 PR checks 读数
- Auto-merge：disabled
- Duplication Gate 结果：以 PR checks 为准
- 是否高风险改动：否（文档与 JSON 证据）
- Residual risk / follow-up：
  - `pantheon-ops` live 树替换、`check:shared-drift` 与 commit 属消费仓自身评审。
  - 精简程序的功能冻结决策与 RC-036/037/038 最终去留仍是维护者决策。

## 检查清单

- [x] 已明确本次改动归属 `platform`
- [x] 未改任何门禁规则、workflow、Sonar 配置
- [x] 未删除、未覆盖任何文件
- [x] 无前端、i18n、菜单、授权、数据库或迁移变化
- [x] 已确认不会泄露敏感配置、账号密码或 Token：diff 只含证据文本与版本事实
- [x] 发布事实均可由 tag、Release 资产与 workflow run 复核
- [x] 未把 `pantheon-ops` live 替换写成已完成
