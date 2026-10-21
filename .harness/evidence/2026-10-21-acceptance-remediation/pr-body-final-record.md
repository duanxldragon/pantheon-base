## 变更摘要

- 改动层级：platform（仅治理与文档，不动运行代码）
- 改动模块：`.harness` evidence/STATUS/manifest/task、`docs/reviews` 四份文档、`CHANGELOG.md`、`RELEASE_NOTES_v0.17.0.md`
- 目标问题：把 2026-10-21 最终门禁实测写回台账——S3649 抑制已由 PR #402 合入并在 main 实测清零；两条 Dependabot 高危由 #400/#403 清理；`Release Gate` 已 success
- 预期影响：台账从「Release Gate 红、tag 被挡」改为「全部门禁绿、open issues 0、open alerts 0、tag 待维护者发布」；无运行代码、接口、权限、迁移变更

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
- inheritance contract: sharedPaths 未变动
- base drift: none introduced
- Base/ops inheritance: 无 ops 侧改动

## 边界说明

- [x] 本次改动仅涉及单一层级

分支上的第一个提交是本地 tree 同步提交：本机 `git fetch` 不可用，而远端 main 已被 #400/#403 推进到 `17af0d85`，
因此把 `backend/go.mod`、`backend/go.sum`、`frontend/package-lock.json` 三个文件从远端内容写入本地，得到与远端 main **完全相同**的 tree
（`dc152669e670c4cc5ffb2d01cd5c6f1271ac5a65`），再在其上提交文档。以 Git Data API 重放时，该同步提交相对远端 parent 是空变更，
本 PR 的 diff 只有文档；squash 合并后历史保持单提交。

## 验证记录

- [x] 本地 tree 与远端 main tree 相等：`git rev-parse HEAD^{tree}` = `git/commits/17af0d85` 的 tree = `dc152669…`
- [x] hosted 实测（main `17af0d85`）：Sonar 分支分析 revision `17af0d85`（10:25:38Z）五项条件全 OK、open issues = 0；open Dependabot alerts = 0
- [x] `Release Gate` run 39584482478：`Candidate Checks` / `CodeQL Alerts` / `Dependabot Alerts` / `Open PRs` / `SonarCloud Gate` / `Release Gate Summary` 全 success
- [x] 首次失败说明：`Dependabot Alerts` job 在 #403 合并后、GitHub 处理告警前启动而失败；告警清零后以 `gh run rerun --failed` 在同一 commit、同一规则下复跑转绿，按「竞态 + 复跑」记录，不写成首次即绿
- [x] PR #402 实测：34 项检查 pass、2 项按设计 skip；PR 级新代码问题 0、门禁 OK、`new_security_rating` = A
- [x] 文档门禁：`node scripts/frontmatter-check.mjs` 通过；`check-task-packet.mjs --root .` 44 文件 0 error；`check-evidence.mjs --strict` 0 error 0 warning
- [x] 未删除功能、未绕过校验、未降低安全要求、未屏蔽失败测试
- [x] 未改 Sonar 规则配置、未改 Quality Gate 阈值、未贴 `solo-override`

## 审核留痕

- Copilot review：unavailable（solo 维护者仓库，未配置 Copilot review）
- CodeQL 结果：pending（本提交 CI 结论；main 上为 success）
- GitHub checks 结果：pending（本提交 CI 结论）
- Auto-merge：not-enabled（仓库侧 `Automate Solo PR` 在门禁全绿时自动合并）
- Duplication Gate 结果：pending（本提交 CI 结论）
- 是否高风险改动：no（纯文档与 evidence）
- Residual risk / follow-up：①`pantheon-base-v0.17.0` tag 与 release 产物仍待维护者发布（F5），门禁已全绿；
  ②D2 凭据轮换、F2 main 分支保护、B10 advisory→blocking 仍为维护者动作；
  ③git 传输间歇可用，本地 main 仍未 ff 到 `17af0d85`，后续推送需逐次复测并在失败时回退到 API 重放；
  ④建议补 checker：runtime-sensitive 套件缺 `PANTHEON_TEST_REDIS_ADDR` 时应失败而非 skip（显式延期）

## 检查清单

- [x] 已明确本次改动归属 `platform`（文档/治理层）
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n（本提交不含前端改动）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰（未触碰）
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（本提交只同步文档，不动这些面）
- [x] 已确认不会泄露敏感配置、账号密码或 Token（DSN 与 Redis 口令以占位符记录）
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
