## 变更摘要

- 改动层级：platform（仅治理与文档，不动运行代码）
- 改动模块：`.harness` evidence/summary、`docs/reviews` 两份验收文档、`docs/harness` 任务文档
- 目标问题：维护者修复网络后复测 git 通道，并把「分支只能靠 Git Data API 重放」「本地 main 无法同步」两条环境限制从现势限制改为历史记录
- 预期影响：台账区分三种通道状态——`api.github.com` 一直可用；`git ls-remote` / `git fetch --prune` / `git push` 现已可用但需要重试（首次 push 失败、第二次成功）；`curl https://github.com` 的 HTML 请求仍超时。无运行时代码、接口、权限、迁移变更

## Harness 链路

- Task ID：`2026-10-21-acceptance-remediation`
- Task Manifest：`.harness/tasks/2026-10-21-acceptance-remediation/manifest.json`
- Evidence：`.harness/evidence/2026-10-21-acceptance-remediation/commands.json`
- Verification evidence：`.harness/evidence/2026-10-21-acceptance-remediation/summary.md`
- Review Artifact：`.harness/evidence/2026-10-21-acceptance-remediation/review.md`
- OpenSpec change：none
- Trivial change：yes
- Quality Profile：permission-policy
- Ratchet Decision：sensor-added
- GitHub Signal：runtime-evidence-gate

## Harness adoption markers

- task id: 2026-10-21-acceptance-remediation
- task manifest: .harness/tasks/2026-10-21-acceptance-remediation/manifest.json
- evidence: .harness/evidence/2026-10-21-acceptance-remediation/commands.json
- boundaries: 只改 evidence 与文档表述；不改 Go/TS 代码、不改 CI workflow、不改门禁配置
- backend response contract: unchanged
- backend DTO contract: unchanged
- permission contract: unchanged
- audit coverage: unchanged（无代码变更）
- visual evidence: none（不触碰前端，无 UI 面）
- inheritance contract: sharedPaths 未变动；base 先修，ops 通过 foundation release 同步
- base drift: none introduced
- Base/ops inheritance: 无 ops 侧改动；本次仅 base 台账收口

## 边界说明

- [x] 本次改动仅涉及单一层级

本地 `main` 原停在 `ce82b94e`。`#395` 是 squash 合并，因此 `ce82b94e` 不是 `origin/main` 的祖先、无法直接 fast-forward。
处置方式是在移动指针前先证明两件事：`ce82b94e` 仍可从 `acceptance/remediation-2026-10-21` 与 `acceptance/remediation-2026-10-21-followup` 到达，
且工作分支 tree 与 `origin/main` tree 相等（`ed274ae5`），然后才执行 `git branch -f main origin/main`。没有 `reset --hard`，没有丢弃提交。

## 验证记录

- [x] `git ls-remote --heads origin` → 返回 `refs/heads/main 73d36ecc…`
- [x] `git fetch origin --prune` → `ffb22988..73d36ecc main`，并清理已合并分支引用（含 `release/v0.17.0`）
- [x] `git push --dry-run` → 远端引用解析成功且不写入；随后真实 `git push` 首次失败（`Failed to connect to github.com port 443`），第二次成功创建 `refs/heads/docs/transport-verified` ⇒ 通道可用但不稳定，重试是必需动作而非可选优化
- [x] `git rev-parse HEAD^{tree} origin/main^{tree}` → 两者均为 `ed274ae5bf943bce8e49ab7b002c3fe9720986f9`
- [x] 文档门禁：`node scripts/frontmatter-check.mjs`、`node scripts/harness/check-task-packet.mjs --root .`（44 文件 0 error）、`node scripts/harness/check-evidence.mjs --strict`（0 error 0 warning）
- [ ] `curl https://github.com` 的 HTML 请求：本机仍超时，故本次只宣称 git-http 通道可用，不宣称 `github.com` 整体可达
- [x] 未删除功能、未绕过校验、未降低安全要求、未屏蔽失败测试

补充说明：`gosecurity:S3649` 两条残留与 `Release Gate` 红态不因本次通道修复而改变，仍以
`docs/reviews/PANTHEON_BASE_ISSUES_AND_REMEDIATION_2026-10-21.md` §5 的实测为准。

## 审核留痕

- Copilot review：unavailable（solo 维护者仓库，未配置 Copilot review；需要第二人复核由维护者决定）
- CodeQL 结果：pending（本提交 CI 结论；纯文档改动，main 上 CodeQL 为 success）
- GitHub checks 结果：pending（本提交 CI 结论；同类文档 PR 的 Docs/PR Governance 与全套门禁为绿）
- Auto-merge：not-enabled（仓库侧 `Automate Solo PR` 在门禁全绿时自动合并，本包未额外启用）
- Duplication Gate 结果：pending（本提交 CI 结论；main 上为绿）
- 是否高风险改动：no（仅更正文档与 evidence 表述；本地 `main` 指针移动已在「边界说明」中给出可回退依据）
- Residual risk / follow-up：①`gosecurity:S3649` 残留两条需维护者在 Sonar 侧标记误报或在门禁让步——这是 main 上 `Release Gate` 唯一红项；
  ②`pantheon-base-v0.17.0` tag/release 在上述处置前不打（F5）；③D2 已入库凭据轮换、F2 main 分支保护、B10 advisory→blocking 由维护者执行；
  ④建议补 checker：runtime-sensitive 套件缺 `PANTHEON_TEST_REDIS_ADDR` 时应失败而非 skip（G2 同族，显式延期）；
  ⑤`Tenant Smoke`/`Full Smoke Suite` 有同 commit 既红又绿的 flaky 历史，本轮一次通过不改写该结论；
  ⑥git 传输可用但需重试，后续 PR 仍应在 push 后回读远端引用确认；
  ⑦远端遗留分支 `acceptance/remediation-2026-10-21-sonar`（`bfcbe645`）已被 #398 的分支取代，删除属维护者决定，本包未删除

## 检查清单

- [x] 已明确本次改动归属 `platform`（文档/治理层）
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n（本提交不含前端改动）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰（未触碰）
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（本提交只同步文档，不动这些面）
- [x] 已确认不会泄露敏感配置、账号密码或 Token（DSN 与 Redis 口令以占位符记录）
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
