## 变更摘要

- 改动层级：platform（发布记录与治理证据），无产品代码
- 改动模块：`README.md`、`README.en.md`、`RELEASE_NOTES_v0.17.8.md`、
  `docs/harness/tasks/2026-10-27-v0178-dep-vuln-closure.task.md`、
  `.harness/tasks/2026-10-27-v0178-dep-vuln-closure/manifest.json`、
  `.harness/evidence/2026-10-27-v0178-dep-vuln-closure/{summary.md,review.md,commands.json}`、
  `.harness/evidence/2026-10-27-base-docs-artifact-landing/commands.json`
- 目标问题：`pantheon-base-v0.17.8` 已经发布，需要把发布事实（tag object、四件资产 SHA-256、
  `Release Gate` / `Foundation Release Verify` run id、secret scan 读数）回写进任务记录，使
  manifest 的 `release.state` 从 `planned` 变为 `published`，并勾掉任务包自己的四条验收项。
  同时更正一条本轮从上一轮沿用、未重新测量的结论：`SonarCloud Scan` 的 JRE `HTTP 403` 只发生在
  `pantheon-ops`，base 没有 scanner workflow，自身的 Sonar 读数是绿的。
- 预期影响：只有文档与证据记录。已发布的 tag 与四件资产保持不可变，本 PR 不重新发布、不改动它们；
  `backend/`、`frontend/`、schema、路由、权限码、菜单 seed、i18n、workflow 一行未动。

## Harness 链路

- Task ID：`2026-10-27-v0178-dep-vuln-closure`
- Task Manifest：`.harness/tasks/2026-10-27-v0178-dep-vuln-closure/manifest.json`
- Evidence：`.harness/evidence/2026-10-27-v0178-dep-vuln-closure/commands.json`
- Verification evidence：`.harness/evidence/2026-10-27-v0178-dep-vuln-closure/summary.md`
- Review Artifact：`.harness/evidence/2026-10-27-v0178-dep-vuln-closure/review.md`
- OpenSpec change：none
- Trivial change：yes
- Quality Profile：none
- Ratchet Decision：registry-only
- GitHub Signal：not-applicable

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-10-27-v0178-dep-vuln-closure
- task manifest: .harness/tasks/2026-10-27-v0178-dep-vuln-closure/manifest.json
- evidence: .harness/evidence/2026-10-27-v0178-dep-vuln-closure/commands.json
- boundaries: 只回写发布事实与更正文档归因；`check-boundaries --strict` 与 baseline 形态都 no findings，被发布的树仍是 `e256d1fb`，本 PR 不改动它
- backend response contract: unchanged
- backend DTO contract: unchanged
- permission contract: unchanged
- audit coverage: unchanged
- visual evidence: not-applicable
- inheritance contract: `check-inheritance-contract --root ..` 通过；sharedPaths 与合同文档未改，README 两条残留说明属文案
- base drift: branch cut from main `e256d1fb`
- Base/ops inheritance: `pantheon-ops` 把 `foundation-release.lock.json` 推进到 `pantheon-base-v0.17.8` 后跑 `rebuild:from-base` + overlay/drift 校验，并在 ops 自己的任务包里关闭 `Security Gates` 转绿断言（本 PR 不代做）

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

补充说明：发布已经完成，本 PR 只记录事实并更正归因，不重新发布、不动 tag 或资产。

## 验证记录

- [x] `gh pr view 433`：`MERGED`，`mergedAt` 2026-10-27T07:47:04Z，merge commit `e256d1fb`
- [x] `Release Gate Summary` check-run `122079301995`（run `40469207830`）在 `e256d1fb` 上 success，
  六个 job 全绿；同一提交上 `SonarCloud Gate` 与 `SonarCloud Code Analysis` 均 success
- [x] `cut-foundation-release.mjs`：`releases/pantheon-base-v0.17.8/manifest.json`
  `createdAt` = 2026-10-27T08:13:29.577Z；产物目录与 `dist/` 都在 gitignore 内，因此发布脚本的
  clean-tree 前置成立
- [x] `check-release-secrets`：`clean (3284 file(s) scanned)`，tgz 与 `repo.tar` 都被解包读取
- [x] `publish-foundation-release.mjs`：先 dry-run 再实跑；实跑退出 0 但 stdout 为空，因此发布结果
  由 GitHub 回读确认而非由退出码断言
- [x] `gh release view pantheon-base-v0.17.8`：draft=false、prerelease=false、
  `publishedAt` 2026-10-27T08:17:19Z、target `e256d1fb`；`git ls-remote` 显示 annotated tag object
  `8f85982a314b51a32ce2e7597b07be969633e70e`
- [x] 四件资产：tgz 29072437 B `e1ec60df…`、`repo.tar` 45772800 B `51674048…` 及两个 `.sha256`；
  `check-release-assets` 报 local bundle 与 release 四件齐备且摘要一致
- [x] `Foundation Release Verify` run `40472462712`：completed/success，head `e256d1fb`，
  `Verify Release Assets` 与 `Foundation Release Verify Summary` 均 success
- [x] 本地治理链在 closeout 树上全绿：16 个 `check:*` npm script；`check-boundaries --strict`（含
  baseline 形态）、`check-review --strict`、`check-evidence --strict`、
  `check-inheritance-contract --root ..`、`check-duplication --json` 全部通过；
  `check-runtime-evidence --strict` 由 61 files / 1 warning 归零为 0 warning
- [x] Sonar 归因复核：`git log --all` 与 `--diff-filter=D` 对 `.github/workflows/sonarcloud.yml` 都为空
  （base 从未有 scanner workflow），`.github/`+`scripts/` 里唯一的 `sonarcloud.io` 引用是
  `release-gate.yml:174-213` 的只读 Web API；Sonar API 显示 base main 质量门 `OK`、未解决 issue `0`，
  ops main 质量门 `ERROR`、未解决 issue `249`，失败 run `40457897338` 在 ops `main`（`f65c6020`）
- [ ] 其他：本轮无 UI/运行时变化，未跑前后端 smoke；`go test -race` 属 Linux CI job（本机 cgo 关闭）
- [x] CodeQL 结果已检查并解释：本 PR 为文档改动，0 open CodeQL alert、0 open Dependabot alert
- [x] GitHub required checks 通过（见审核留痕）
- [x] Copilot review：unavailable（文档 closeout，按既有策略不请求）
- [x] 已启用或确认将启用 squash auto-merge：以 `gh pr merge --squash --delete-branch` 收口

## 审核留痕

- Copilot review：unavailable
- CodeQL 结果：无新增告警；仓库 open CodeQL / Dependabot alert 均为 0
- GitHub checks 结果：见下方 PR checks 读数
- Auto-merge：not-applicable（以 squash merge 直接收口）
- Duplication Gate 结果：`check-duplication --json` ok，低于 3% 阈值
- 是否高风险改动：否，纯文档与证据回写
- Residual risk / follow-up：
  - `golang.org/x/crypto` `GO-2026-5932`（openpgp 按设计不安全、无修复版本，两处扫描都 `called: false`）
    仍在依赖图里，是否强制替换属维护者依赖风险策略（V4）。
  - ops 的 `SONAR_TOKEN` 403 与 ops main 上 249 条未解决 Sonar issue 属消费侧 + 凭据问题（V5）。
  - `check-runtime-evidence` / `check-evidence` 仍不在 CI，接入属门禁策略（FR-016 / FR-017 同类）。
  - 本地 closeout 补的那段 `runtimeGap` 只是把 #431 遗留的「未记录 runtime gap」补成陈述，没有降阈值（V7）。

## 检查清单

- [x] 已明确本次改动归属 `platform`（发布记录），不涉及 `system/*` 或 `business/*`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n：不适用，无前端文案改动
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰：不适用，未触碰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步：不适用，schema 仍为 30
- [x] 已确认不会泄露敏感配置、账号密码或 Token：diff 只含发布事实与 run id，凭据不落证据
