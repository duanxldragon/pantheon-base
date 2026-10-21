## 变更摘要

- 改动层级：platform（仅治理与文档，不动运行代码）
- 改动模块：`.harness` evidence/manifest、`docs/reviews` 四份验收文档、`docs/harness` 任务文档、`CHANGELOG.md`、`RELEASE_NOTES_v0.17.0.md`
- 目标问题：把 2026-10-21 推送与合并链的最终门禁实测写回台账，并修正此前两处过度表述——①「map 条件清掉了 `gosecurity:S3649`」（实际 3 条 BLOCKER 降为 2 条）②「PR #398 级 Sonar 门禁 OK、新代码 0 问题」（PR 泄漏期口径，分支泄漏期仍为 E，`Release Gate` 红）
- 预期影响：台账与 hosted 实况一致；冻结结论的前置项从「三项」更正为「四项」（新增 Sonar 误报处置）。无任何运行时代码、接口、权限、迁移变更

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
- boundaries: 只改文档与 evidence/manifest 表述；不改 Go/TS 代码、不改门禁配置、不改 CI workflow
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

`github.com` 在本机不可达（`api.github.com` 可达），因此本 PR 的分支仍以 Git Data API 重放（blob → tree → commit → ref），
并在推送后比对本地与远端 tip tree 相等；`git push` 的缺失不影响内容一致性，但不意味着可以跳过 tree 校验。

## 验证记录

- [x] hosted 实测：PR #398 合并为 main `c17ef999ff650b887923beba4688ae2055dc89ff`，合并前全部 GitHub 门禁 pass/skipping
- [x] hosted 实测：main `c17ef999` 上 `CI` / `Full Smoke Suite` / `Core Smoke Tests` / `Security Gates` / `Lint Workflows` = success；`Release Gate` = failure
- [x] hosted 实测：`Backend Tests`（`quality.yml` 的 `go test -race ./...`）与 `Unit Tests`（`ci.yml` 的 `go test -race -short ./...`）在 `c17ef999` 均 success ⇒ 本机无法执行的 `-race` 维度由 CI 关闭
- [x] hosted 实测：`curl …/api/issues/search?branch=main&rules=gosecurity:S3649` → 历史共 4 条且全部在 `Service.AddMember()`（2 OPEN @ `:711`/`:726`，2 CLOSED）；`…/api/qualitygates/project_status?branch=main` → `ERROR`，唯一未达条件 `new_security_rating` = E（阈值 ≥ A）
- [x] 文档门禁：`node scripts/frontmatter-check.mjs`、`node scripts/harness/check-task-packet.mjs --root .`、`node scripts/harness/check-evidence.mjs --strict .harness/evidence/2026-10-21-acceptance-remediation/commands.json`
- [ ] `go test -race ./...` 本地复跑：本机无 C 工具链（cgo 启动失败），证据仅存在于 CI 侧，已在 evidence 记录
- [x] 未删除功能、未绕过校验、未降低安全要求、未屏蔽失败测试（未加 `NOSONAR`、未排除规则、未贴 `solo-override`）

补充说明：本轮把「PR 级门禁」与「分支级门禁」两种口径显式分离记录，避免再次出现以 PR 绿推断分支绿的表述。
明细见 `docs/reviews/PANTHEON_BASE_ISSUES_AND_REMEDIATION_2026-10-21.md` §5 与
`docs/reviews/PANTHEON_BASE_TEST_AND_ACCEPTANCE_REPORT_2026-10-21.md` §4.4。

## 审核留痕

- Copilot review：unavailable（solo 维护者仓库，未配置 Copilot review；需要第二人复核由维护者决定）
- CodeQL 结果：pending（本提交 CI 结论；main `c17ef999` 上 CodeQL 为 success）
- GitHub checks 结果：pending（本提交 CI 结论；纯文档改动，历史同类 PR 的 Docs/PR Governance 与全套门禁为绿）
- Auto-merge：not-enabled（仓库侧 `Automate Solo PR` 在门禁全绿时自动合并，本包未启用额外自动合并）
- Duplication Gate 结果：pending（本提交 CI 结论；main 上为绿）
- 是否高风险改动：no（仅更正文档与 evidence 表述，无代码与契约变更）
- Residual risk / follow-up：①`gosecurity:S3649` 残留两条需维护者在 Sonar 侧标记误报或在门禁让步——这是 main 上 `Release Gate` 唯一红项；
  ②`pantheon-base-v0.17.0` tag/release 在上述处置前不打（F5）；③D2 已入库凭据轮换、F2 main 分支保护、B10 advisory→blocking 由维护者执行；
  ④建议补 checker：runtime-sensitive 套件缺 `PANTHEON_TEST_REDIS_ADDR` 时应失败而非 skip（G2 同族，显式延期）；
  ⑤`Tenant Smoke`/`Full Smoke Suite` 存在同 commit 既红又绿的 flaky 历史，本轮一次通过不改写该结论；
  ⑥本地 `main` 无法 fetch/fast-forward（`github.com` 不可达），同步本地 main 属维护者动作

## 检查清单

- [x] 已明确本次改动归属 `platform`（文档/治理层）
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n（本提交不含前端改动）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰（未触碰）
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（本提交只同步文档，不动这些面）
- [x] 已确认不会泄露敏感配置、账号密码或 Token（DSN 与 Redis 口令以占位符记录）
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
