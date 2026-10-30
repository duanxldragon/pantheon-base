## 变更摘要

- 改动层级：platform
- 改动模块：`.harness/archive/2026-10/{tasks,evidence}/2026-10-31-archive-closure-pr-governance`、
  `docs/harness/tasks/2026-10-31-archive-closure-pr-governance.task.md`、`.harness/ARCHIVE.md`
- 目标问题：收口上一个包（PR #474）的终局读数并把它按月归档。#474 把
  `scripts/check-pr-governance.mjs` 教会了解析月度归档路径，但它自己仍标着
  `status: in-progress` / `Active`，且 `main` 的合并后读数没有落到 evidence 里；不归档就等于
  这条修复永远停在「有传感器改动、无终局证据」的半开状态。
- 预期影响：治理文档面收敛——归档统计从 `2026-10 = 88/91` 变为 `89/92`（合计 `210/216`），
  活跃任务只剩 `2026-10-29-v0180-simplification-release` 一个 `in-progress`。不触碰任何
  门禁判定、阈值、工作流文件、源码与 Sonar 查询条件。

## Harness 链路

- Task ID：`2026-10-31-archive-closure-pr-governance`
- Task Manifest：`.harness/tasks/2026-10-31-archive-closure-pr-governance/manifest.json`
- Evidence：`.harness/evidence/2026-10-31-archive-closure-pr-governance/commands.json`
- Verification evidence：`.harness/evidence/2026-10-31-archive-closure-pr-governance/summary.md`
- Review Artifact：`.harness/evidence/2026-10-31-archive-closure-pr-governance/review.md`
- OpenSpec change：none
- Trivial change：no
- Quality Profile：ci-workflow
- Ratchet Decision：no-repeat-observed
- GitHub Signal：repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-10-31-archive-closure-pr-governance
- task manifest: .harness/tasks/2026-10-31-archive-closure-pr-governance/manifest.json
- evidence: .harness/evidence/2026-10-31-archive-closure-pr-governance/commands.json
- boundaries: 仅治理文档与归档树移动；无源码、无工作流、无门禁语义变化
- backend response contract: 不涉及
- backend DTO contract: 不涉及
- permission contract: 不涉及
- audit coverage: 不涉及
- visual evidence: 不涉及
- inheritance contract: 不涉及（归档约定是本仓治理面，不是 foundation 契约面）
- base drift: 不涉及（无接口/路由/权限/i18n/schema 变化）
- Base/ops inheritance: 无需发布；本包不产生消费者需要吸收的代码面

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

> 层内边界：7 个文件的移动 + 2 个治理文档的状态翻转 + 1 个 evidence 追加。
> 判定逻辑零变化。本包唯一值得审的点是「被归档任务的 PR body 继续引用 canonical 路径」这一
> 自我指涉形态，它由 #474 的归档回退分支支撑，并由本 PR 的 `PR Governance Prereq` 作业验证。

## 验证记录

- [x] 后端测试：`go test ./...`（不涉及：无 backend 改动）
- [x] 前端构建：`cd frontend && npm run build`（不涉及：无前端源码改动）
- [x] L0/L1/L2 smoke（不涉及：无运行时面；证据是 main 的门禁读数）
- [x] PR #474 检查回读：30 项中 20 pass / 10 skipping（按改动范围门控），0 failure；
      CodeQL 与 CodeQL Security 均 success，本包改动的 `.mjs` 在抽取范围内且无新增 alert
- [x] 合并读数：`mergedAt 2026-10-30T16:19:37Z`，`main` = `05ee0ec1`
- [x] 合并后 main 工作流：CI / Code Quality Gates / Core Smoke Tests / Full Smoke Suite /
      Lint Workflows / Security Gates / Release Gate 全部 completed success
- [x] `Release Gate` run `41088861582` 的 6 个作业全部 success；`SonarCloud Gate` 日志
      `Unprocessed SonarCloud issues: 0` 与 `✓ No unresolved SonarCloud issues`
- [x] 独立 API 复核（不依赖工作流日志）：`branch=main` 未处理问题 total 0、
      `qualitygates/project_status` = OK；token 仅 shell 变量只读 GET，未入仓
- [x] 本包治理矩阵：`check:task-packet`（归档后 canonical 路径仍 PASS）、
      `check:harness-inventory` / `check:harness-docs` / `check:docs-frontmatter`（402 docs）、
      `check:failure-registry` / `check:task-packet-template` / `check:harness-encoding` /
      `check:structure` / `check:generated` / `check:generated-modules` /
      `check:ui-quality-gate` / `check:duplication` /
      `check-evidence.mjs --strict` / `check-review.mjs --strict` → 全部 exit 0
- [x] 归档统计实测：`archive/2026-10` = tasks 89 / evidence 92，其余月份与索引行一致
- [x] CodeQL 结果已检查并解释（本 PR 仅移动与改 `.json`/`.md`，无抽取面新增）
- [x] 无 open CodeQL alert 需要说明
- [x] Full Smoke 未错误纳入 PR 必过门禁
- [x] GitHub required checks 由分支保护与 PR Automation 负责最终合并门禁
- [ ] Copilot review 已请求，或已说明当前仓库/账号不可用（见审核留痕：账号不可解析）
- [x] 已确认 squash auto-merge 的处置流程

补充说明：本包不含任何抑制手段——没有 `NOSONAR`、`//nolint`、False Positive 标记、
new-code baseline 移动、阈值或查询条件变更；也没有放宽任何守护测试断言。

## 审核留痕

- Copilot review：unavailable（`gh pr edit --add-reviewer Copilot` 在本仓库返回
  `Could not resolve user with login 'copilot'`）
- CodeQL 结果：本 PR 无新增抽取面（`.json` / `.md` 移动与文档状态翻转），回读后确认
- GitHub checks 结果：待回读
- Auto-merge：enabled（沿用 `pr-automation.yml` 的 squash + delete-branch 策略）
- Duplication Gate 结果：PASS（`npm run check:duplication` exit 0）
- 是否高风险改动：no（纯治理文档与文件移动；`check:structure` 与 `check:harness-inventory`
  对移动后的树给出 exit 0）
- Residual risk / follow-up：`check-evidence.mjs --strict` 的默认 glob 只扫 live 树，
  归档后的 evidence 不再被它覆盖（FR-024 已登记消费方实测读数）。是否在下一轮把归档树纳入
  strict 扫描，归维护者裁决；本包按 Out-of-scope 不扩面。

## 检查清单

- [x] 已明确本次改动归属 `platform`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n（不涉及）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰（不涉及）
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（不涉及；治理索引 `ARCHIVE.md` 已同步）
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
