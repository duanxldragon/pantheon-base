## 变更摘要

- 改动层级：docs/harness（只回填 v0.18.2 的发布读数；无 backend、frontend、pkg、workflow、schema、路由、权限、菜单键、i18n 键改动）
- 改动模块：`.harness/STATUS.md`、`.harness/evidence/2026-10-31-v0182-menu-contract-shared-surface/{commands.json,summary.md}`、`docs/harness/tasks/2026-10-31-v0182-menu-contract-shared-surface.task.md` 的完成清单
- 目标问题：prep PR #479 已合入、`pantheon-base-v0.18.2` 已发布后，证据文件里仍写着“发布读数待追加”，STATUS 仍标「准备中」，任务清单的发布三项仍未勾选；这是发布任务的最后一截，不补完就属于未完成。
- 预期影响：纯文档。记录 tag object `2e32bd46…` → peeled `a44ae4e0`、`published_at` 2026-10-31T00:48:38Z、四件资产摘要、cut run 41152136695 与 verify run 41153048213，以及 verify 需手动 dispatch 的原因（`GITHUB_TOKEN` 发布的 release 不派发 `release: published` 下游事件）。

## Harness 链路

- Task ID：`2026-10-31-v0182-menu-contract-shared-surface`
- Task Manifest：`.harness/tasks/2026-10-31-v0182-menu-contract-shared-surface/manifest.json`
- Evidence：`.harness/evidence/2026-10-31-v0182-menu-contract-shared-surface/commands.json`
- Verification evidence：`.harness/evidence/2026-10-31-v0182-menu-contract-shared-surface/summary.md`
- Review Artifact：`.harness/evidence/2026-10-31-v0182-menu-contract-shared-surface/review.md`
- OpenSpec change：none
- Trivial change：yes
- Quality Profile：ci-workflow
- Ratchet Decision：registry-only
- GitHub Signal：repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-10-31-v0182-menu-contract-shared-surface
- task manifest: .harness/tasks/2026-10-31-v0182-menu-contract-shared-surface/manifest.json
- evidence: .harness/evidence/2026-10-31-v0182-menu-contract-shared-surface/commands.json
- boundaries: 只改 `.harness/` 证据与任务状态文本；未改 backend、frontend、workflow、门禁阈值、sonar 配置或依赖
- backend response contract: unchanged（无后端源码改动）
- backend DTO contract: unchanged（无后端源码改动）
- permission contract: unchanged（未新增或删除权限码）
- audit coverage: unchanged（无审计链路改动）
- visual evidence: not-applicable（无 UI 改动）
- inheritance contract: unchanged（`sharedPaths` 仍为 53，本 PR 不再改清单）
- base drift: 分支基于 `main` @ `a44ae4e0`（v0.18.2 prep 合并提交）
- Base/ops inheritance: `pantheon-ops` 的 0.18.2 消费记录在该仓任务包 `2026-10-31-foundation-upgrade-base-v0-18-2`，不在本 PR

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

补充说明：本 PR 不产生新的发布或代码行为；它只把已经发生的发布事实写回证据，供消费仓和后续审计引用。

## 验证记录

- [x] `gh api repos/duanxldragon/pantheon-base/releases/tags/pantheon-base-v0.18.2` → 4 件资产、`published_at` 2026-10-31T00:48:38Z、target `a44ae4e0`
- [x] `git ls-remote --tags origin refs/tags/pantheon-base-v0.18.2 'refs/tags/pantheon-base-v0.18.2^{}'` → tag object `2e32bd46…`，peeled `a44ae4e0…`
- [x] `npm run check:release-assets -- --release-version pantheon-base-v0.18.2` → `[ok] release pantheon-base-v0.18.2 carries all 4 required assets`
- [x] `gh run view 41152136695` → cut run success，headSha `a44ae4e0`；`gh run view 41153048213` → verify success
- [x] `npm run check:task-packet` → v0182 包 PASS
- [x] `npm run check:task-packet-template` → OK
- [x] `npm run check:harness-encoding` → 0 finding(s) across 2628 file(s)
- [x] `npm run check:structure` → 0 finding(s) across 2976 file(s)
- [x] `node scripts/harness/check-evidence.mjs <v0182 commands.json>` → 0 error / 0 warning
- [x] `node scripts/harness/check-review.mjs <v0182 review.md>` → 0 error
- [ ] `check:docs-frontmatter` 与 harness-docs 系列按 checkout 根解析 `../../pantheon-harness`，在发布工作树内不可达；以主 checkout 与本次 PR checks 为准

## 审核留痕

- Copilot review：见 PR 机器人读数；本 PR 为证据回读
- CodeQL 结果：无产品源码改动；以 PR checks 为准
- GitHub checks 结果：见 PR checks 读数
- Auto-merge：由 `pr-automation.yml` 在 checks 全绿后启用 squash auto-merge
- Duplication Gate 结果：以 PR checks 为准
- 是否高风险改动：否（纯文档）
- Residual risk / follow-up：
  - `pantheon-ops` 的 0.18.2 消费由该仓独立 PR 收口；本 PR 不代其声明完成。
  - 发布事实以 GitHub API 与 tag ref 为准，本文不推断 `created_at` 与 `published_at` 之间的时间差成因，只记录观测值。

## 检查清单

- [x] 已明确本次改动归属 `platform` 的 harness 档案层，未把系统域职责混写
- [x] 未改任何门禁规则、workflow、Sonar 配置，未使用 `NOSONAR` 或规则排除
- [x] 未删除、未覆盖任何产品文件
- [x] 无后端、i18n、菜单键、授权、数据库或迁移变化
- [x] 已确认不会泄露敏感配置、账号密码或 Token：diff 只含公开的 tag、资产摘要与运行号
- [x] 发布读数与 GitHub API 一致，可由 `gh` 复核
