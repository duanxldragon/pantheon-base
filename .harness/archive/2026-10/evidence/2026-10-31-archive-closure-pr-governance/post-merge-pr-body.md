## 变更摘要

- 改动层级：platform
- 改动模块：`.harness/archive/2026-10/evidence/2026-10-31-archive-closure-pr-governance/{commands.json,summary.md}`
- 目标问题：收口 PR #475 的合并后读数尚未落入 evidence。上一轮把「归档提交自身」当作 #474 修复的
  生产验证，但那条判断当时只是声明；需要把 `gh pr checks 475`、main 工作流与 `SonarCloud Gate`
  的实际读数写回档案，否则本包仍是「有终局动作、无终局读数」。
- 预期影响：纯治理档案追加（3 条命令记录 + 1 条 knownGap + summary 的一个小节）。
  不改任何门禁、阈值、工作流、源码或 Sonar 查询条件。

## Harness 链路

- Task ID：`2026-10-31-archive-closure-pr-governance`
- Task Manifest：`.harness/tasks/2026-10-31-archive-closure-pr-governance/manifest.json`
- Evidence：`.harness/evidence/2026-10-31-archive-closure-pr-governance/commands.json`
- Verification evidence：`.harness/evidence/2026-10-31-archive-closure-pr-governance/summary.md`
- Review Artifact：`.harness/evidence/2026-10-31-archive-closure-pr-governance/review.md`
- OpenSpec change：none
- Trivial change：yes
- Quality Profile：ci-workflow
- Ratchet Decision：no-repeat-observed
- GitHub Signal：repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-10-31-archive-closure-pr-governance
- task manifest: .harness/tasks/2026-10-31-archive-closure-pr-governance/manifest.json
- evidence: .harness/evidence/2026-10-31-archive-closure-pr-governance/commands.json
- boundaries: 仅档案追加；无实现改动、无门禁语义变化
- backend response contract: 不涉及
- backend DTO contract: 不涉及
- permission contract: 不涉及
- audit coverage: 不涉及
- visual evidence: 不涉及
- inheritance contract: 不涉及
- base drift: 不涉及
- Base/ops inheritance: 无需发布

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

> 本 PR 只动一个任务包的档案文件。之所以值得单独一轮：它同时是 #474 那条传感器修复的
> 生产侧背书（`PR Governance Prereq` 在归档路径上通过），把「单测覆盖」升级为「门禁实测」。

## 验证记录

- [x] 后端测试 / 前端构建 / L0-L2 smoke（不涉及：无源码与运行时面改动）
- [x] `gh pr checks 475` 回读：23 pass / 7 skipping、0 failure
- [x] `gh pr view 475`：MERGED，`mergedAt 2026-10-30T16:52:32Z`，main = `e99440bc`
- [x] 合并后 main 的 7 个工作流（CI / Code Quality Gates / Core Smoke Tests / Full Smoke Suite /
      Lint Workflows / Security Gates / Release Gate）全部 completed success
- [x] `Release Gate` run `41093843150` 的 6 个作业全 success；`SonarCloud Gate` 日志
      `Unprocessed SonarCloud issues: 0`；连续三个 main 提交（`c1f0b1dd` → `05ee0ec1` → `e99440bc`）
      该读数保持 0
- [x] 治理矩阵：`check:task-packet` / `check:harness-docs` / `check:harness-inventory` /
      `check:docs-frontmatter` / `check:harness-encoding` / `check:structure` /
      `check:failure-registry` / `check:duplication` / `check:pr-governance` → exit 0
- [x] CodeQL 结果已检查并解释（本 PR 仅 2 个 `.json`/`.md` 档案文件，无抽取面变化）
- [x] 无 open CodeQL alert 需要说明
- [x] Full Smoke 未错误纳入 PR 必过门禁
- [x] GitHub required checks 由分支保护与 PR Automation 负责最终合并门禁
- [ ] Copilot review 已请求，或已说明当前仓库/账号不可用（见审核留痕）
- [x] 已确认 squash auto-merge 的处置流程

补充说明：无抑制手段——没有 `NOSONAR`、`//nolint`、False Positive 标记、baseline 移动或阈值放宽；
本 PR 未使用任何 Sonar 凭据。

## 审核留痕

- Copilot review：unavailable（本仓库无法解析 `copilot` reviewer）
- CodeQL 结果：本 PR 无新增抽取面；回读后确认
- GitHub checks 结果：待回读
- Auto-merge：enabled（沿用 squash + delete-branch 策略）
- Duplication Gate 结果：PASS（`npm run check:duplication` exit 0）
- 是否高风险改动：no（档案追加）
- Residual risk / follow-up：「收口记录也要收口」的循环在本轮出现一次——为把 #475 的读数入档，
  又产生一条治理提交。已在 knownGaps 记为形态问题：若成为常态，应在下一轮把终局读数改为
  合并前声明 + 合并后单次补记的提交形态。另一项既有残差不变：`check-evidence --strict` 的默认
  glob 只扫 live 树，归档包不被覆盖（FR-024 已登记实测读数）。

## 检查清单

- [x] 已明确本次改动归属 `platform`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n（不涉及）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰（不涉及）
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（不涉及；治理档案已同步）
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
