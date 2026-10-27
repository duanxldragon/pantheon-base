## 变更摘要

- 改动层级：platform（发布记录）
- 改动模块：`.harness/STATUS.md`、`.harness/tasks/2026-10-27-v0176-release-closeout/manifest.json`、
  `.harness/evidence/2026-10-27-v0176-release-closeout/{summary.md,review.md,commands.json,pr-body.md}`
- 目标问题：`pantheon-base-v0.17.6` 已切 tag 并发布（tag object `2bc79966`，目标提交 `c9bc6c0f`），
  需要把发布事实——tag object、目标提交、四件资产校验和、`Release Gate`、SonarCloud、
  `Foundation Release Verify`、secret scan——写回任务记录，使 manifest 的 `release.state`
  从 `planned` 变为 `published`，并把 review 里的 F1 / F2 两项 P2 follow-up 关闭。
- 预期影响：仅文档与证据记录，无代码、schema、路由、权限码、菜单 seed 或 workflow 变化。
  已发布的 tag 与四件资产保持不可变，本 PR 不重新发布、不改动它们。

## Harness 链路

- Task ID：`2026-10-27-v0176-release-closeout`
- Task Manifest：`.harness/tasks/2026-10-27-v0176-release-closeout/manifest.json`
- Evidence：`.harness/evidence/2026-10-27-v0176-release-closeout/commands.json`
- Verification evidence：`.harness/evidence/2026-10-27-v0176-release-closeout/summary.md`
- Review Artifact：`.harness/evidence/2026-10-27-v0176-release-closeout/review.md`
- OpenSpec change：none
- Trivial change：yes
- Quality Profile：none
- Ratchet Decision：registry-only
- GitHub Signal：not-applicable

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-10-27-v0176-release-closeout
- task manifest: .harness/tasks/2026-10-27-v0176-release-closeout/manifest.json
- evidence: .harness/evidence/2026-10-27-v0176-release-closeout/commands.json
- boundaries: 只回填发布事实；被发布的树是 `c9bc6c0f`，本 PR 不改动它，`check-boundaries --strict` 与 baseline 形态均 no findings
- backend response contract: unchanged
- backend DTO contract: unchanged
- permission contract: unchanged
- audit coverage: unchanged
- visual evidence: not-applicable
- inheritance contract: `check-inheritance-contract --root ..`（workspace 级调用形态）0 findings / 0 warnings；sharedPaths 与合同文档未改
- base drift: branch cut from main `c9bc6c0f`
- Base/ops inheritance: `pantheon-ops` 把 `foundation-release.lock.json` 推进到 `pantheon-base-v0.17.6` 后跑 `rebuild:from-base` + overlay drift 校验（另立 ops 任务包，本 PR 不代做）

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

补充说明：发布已经完成；本 PR 只记录事实，不重新发布、不改动 tag 或资产。

## 验证记录

- [x] `gh pr checks 428` + `gh pr merge 428 --squash`：五个必需 context 全绿，PR #428 于
  2026-10-27T01:15:41Z 合并为 `c9bc6c0f`
- [x] `Release Gate` run `40431521256`：`c9bc6c0f` 上 success，`SonarCloud Gate` 打印
  `SonarCloud quality gate for c9bc6c0f…: OK`
- [x] `cut-foundation-release.mjs`：`releases/pantheon-base-v0.17.6/` 与
  `dist/foundation-releases/pantheon-base-v0.17.6/` 生成，退出 0；两者都在 gitignore 内，
  因此 `git status` 干净，满足发布脚本的第一条硬前置
- [x] `check-release-secrets`：`clean (3232 file(s) scanned)`，tgz 与 `repo.tar` 都已打开
- [x] `publish-foundation-release.mjs`：先 dry-run 再实跑，annotated tag `pantheon-base-v0.17.6`
  （tag object `2bc79966`）指向 `c9bc6c0f`，Release 非 draft / 非 prerelease，
  `published_at = 2026-10-27T01:39:12Z`
- [x] `gh release view` + `check-release-assets`：四件资产齐备且本地与远端一致
  （tgz `dbf1edd8…f362e35`、`repo.tar` `7a44e9ce…8fda645d`）
- [x] `Foundation Release Verify` run `40433836341`：`Verify Release Assets` 与
  `Foundation Release Verify Summary` 均 success
- [x] SonarCloud main：未解决 issue `0`、质量门 `OK`（New Duplicated Lines 1.9%，阈值 ≤3%）；
  CodeQL open alert `0`
- [x] 本地 `node scripts/check-duplication.mjs --json`：`ok=true`，1.5% / 阈值 3%（898 文件、170240 行）
- [x] `check-evidence --strict`、`check-review --strict`（本任务文件）：0 error / 0 warning
- [ ] CodeQL 结果：待 CI
- [ ] GitHub required checks：待 CI
- [ ] Copilot review：待 PR Automation

## 审核留痕

- Copilot review：unavailable（单维护者 ruleset 流程，required approving reviews = 0）
- CodeQL 结果：待 CI（仓库当前 open alert 为 0）
- GitHub checks 结果：待 CI
- Auto-merge：enabled
- Duplication Gate 结果：待 CI（本地全库 1.5% / 阈值 3%，PR 上该门禁是 report-only）
- 是否高风险改动：no（纯记录）
- Residual risk / follow-up：①本地 TSan 仍 error 87，race 门禁由 CI Linux 承担；
  ②FR-016 / FR-017 仍 open（4 个 checker 未进 CI，属维护者的门禁策略决定）；
  ③`pantheon-ops` 消费 v0.17.6 是另立任务包，本 PR 不代做；④已发布 v0.17.0–v0.17.5 的 tag
  与资产保持不可变

## 检查清单

- [x] 已明确本次改动归属 `platform`（发布记录）
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n：未涉及
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步：无此类变更
- [x] 已确认不会泄露敏感配置、账号密码或 Token
