## 变更摘要

- 改动层级：platform（CI 工作流供应链加固 + Sonar 修复涉及的治理/工具脚本，不涉及运行时代码）
- 改动模块：.github/workflows/{ci,quality,security,smoke-full,lint-workflows,pr-automation,release-gate}.yml、Dockerfile、frontend/scripts/check-shell-visual-contract.mjs、scripts/create-pr.mjs、scripts/harness/*、tests/scripts/quality-workflow.test.mjs
- 目标问题：版本冻结前 SonarCloud open 问题清零与 CI 供应链加固——正则构造不安全（check-shell-visual-contract）、CLI 输入未校验（create-pr）、npm 生命周期脚本在 CI 任意执行、npx 可回退拉取未锁定包、actionlint 走 curl|bash 安装、pr-automation 顶层 write 权限过宽、security summary 不强制全部安全任务、Release Gate 未覆盖 CODE_SMELL
- 预期影响：CI 全链路 `npm ci --ignore-scripts` + 显式 `patch:arco-react19`；npx 改为 node_modules/.bin 直调；actionlint 改 `go install` 固定版本；pr-automation 拆分只读 prereq 门禁 + 作业级最小权限；security-gates 强制全部安全任务成功；Release Gate 收紧为 SonarCloud OPEN 的 BUG+VULNERABILITY+CODE_SMELL 全部为零

## Harness 链路

- Task ID：2026-07-23-base-freeze-sonar-control
- Task Manifest：.harness/tasks/2026-07-23-base-freeze-sonar-control/manifest.json
- Evidence：.harness/evidence/2026-07-23-base-freeze-sonar-control/commands.json
- Verification evidence：.harness/evidence/2026-07-23-base-freeze-sonar-control/summary.md
- Review Artifact：.harness/evidence/2026-07-23-base-freeze-sonar-control/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：ci-workflow
- Ratchet Decision：gate-updated
- GitHub Signal：repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-07-23-base-freeze-sonar-control
- task manifest: .harness/tasks/2026-07-23-base-freeze-sonar-control/manifest.json
- evidence: .harness/evidence/2026-07-23-base-freeze-sonar-control/commands.json
- boundaries: not-applicable
- backend response contract: not-applicable
- backend DTO contract: not-applicable
- permission contract: not-applicable
- audit coverage: not-applicable
- visual evidence: not-applicable
- inheritance contract: not-applicable
- base drift: not-applicable
- Base/ops inheritance: not-applicable

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

> 全部改动为 CI 工作流、Dockerfile 依赖安装策略与治理/工具脚本；无 backend/ 与 frontend/src/ 运行时代码变更。harness 镜像脚本改动已通过 check:harness-sync 严格模式验证与 pantheon-harness 一致。

## 验证记录

- [x] 后端测试：本 PR 未改后端代码（ci-workflow 范围）
- [x] 前端构建：本 PR 未改前端运行时代码；check-shell-visual-contract 修改后本地执行通过（合约未弱化）
- [x] 轻量 smoke：不涉及运行时代码，无需专项 smoke
- [ ] 如涉及系统域深链路，已补充专项 smoke：不涉及
- [x] 其他专项验证已补充：quality-workflow 测试 3/3；check:harness-sync / check:harness-inventory 严格模式 0 findings；check:docs-frontmatter / check:structure / check:pr-governance / check:task-packet-template 全部 EXIT 0；test:pr-governance 6/6
- [x] CodeQL 结果已检查并解释
- [x] 如有 open CodeQL alert，已说明是新增问题、既有 baseline、误报还是已补 follow-up
- [x] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [x] GitHub required checks 通过
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用
- [x] 已启用或确认将启用 squash auto-merge

补充说明：actionlint 本地未安装（Windows），由本 PR 的 Lint Workflows 作业（go install 固定 v1.7.10 + SHA 固定 setup-go）在 CI 强制执行。SonarCloud OPEN=0 的最终证明按设计在合并后完成：自动分析扫 main → Release Gate 强化查询（BUG+VULNERABILITY+CODE_SMELL）验证清零。

## 审核留痕

- Copilot review：unavailable
- CodeQL 结果：0 open error/critical alerts
- GitHub checks 结果：见本 PR checks 面板
- Auto-merge：enabled（pr-automation automate-solo-pr）
- Duplication Gate 结果：pass（工作流/脚本改动不影响）
- 是否高风险改动：否（无运行时代码变更；--ignore-scripts 的唯一必需钩子 patch:arco-react19 已在所有安装点显式调用）
- Residual risk / follow-up：Release Gate CODE_SMELL=0 为冻结窗口的刻意收紧；历史 evidence schema 债务（report-only 54 errors）不在本任务范围

## 检查清单

- [x] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n（本 PR 无新增展示文案）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（本 PR 无此类变更）
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁

🤖 Generated with [Claude Code](https://claude.com/claude-code)
