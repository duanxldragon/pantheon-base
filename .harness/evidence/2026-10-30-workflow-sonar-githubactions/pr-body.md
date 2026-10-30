## 变更摘要

- 改动层级：platform
- 改动模块：`.github/workflows/{quality,ci,release-gate,security}.yml`、
  `tests/scripts/{quality,release-gate}-workflow.test.mjs`、`docs/harness/failure-registry.md`
- 目标问题：`main` 在合并提交 `03e13d48` 上 `Release Gate` 红灯——`SonarCloud Gate` 报
  `Unprocessed SonarCloud issues: 6`，6 条全是 `.github/workflows` 里的 `githubactions:`
  缺陷（`S1192` 同一 step 内重复 5–8 次的 `"success"` 字面量；`S7677` 把含
  `error/critical` 字样的输出写到 stdout）。同一条查询在上一次 main 分析
  （2026-10-29T04:50Z，run 40818421372）报 0，6 条 issue 的 creationDate 落在
  2026-07-02 ~ 2026-10-11 且 changelog 为空：既有债务被重新检出，而非 PR #471 引入
  （合并 diff 10 个文件、0 个工作流文件）。
- 预期影响：Release Gate 的 `SonarCloud Gate` 作业读数在合并后回到 0。门禁判定语义、
  `needs`、`if:`、`continue-on-error`、必需检查集合、阈值与 Sonar 查询条件均无变化；
  CI/发布日志的人类可读文本有措辞与流向（stderr）变化，不改变任何退出码逻辑。

## Harness 链路

- Task ID：`2026-10-30-workflow-sonar-githubactions`
- Task Manifest：`.harness/tasks/2026-10-30-workflow-sonar-githubactions/manifest.json`
- Evidence：`.harness/evidence/2026-10-30-workflow-sonar-githubactions/commands.json`
- Verification evidence：`.harness/evidence/2026-10-30-workflow-sonar-githubactions/summary.md`
- Review Artifact：`.harness/evidence/2026-10-30-workflow-sonar-githubactions/review.md`
- OpenSpec change：none
- Trivial change：no
- Quality Profile：ci-workflow
- Ratchet Decision：no-repeat-observed
- GitHub Signal：repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-10-30-workflow-sonar-githubactions
- task manifest: .harness/tasks/2026-10-30-workflow-sonar-githubactions/manifest.json
- evidence: .harness/evidence/2026-10-30-workflow-sonar-githubactions/commands.json
- boundaries: 仅治理面（CI/发布工作流的字面量与输出流向）；不改门禁语义、不改阈值、不改 Sonar 查询
- backend response contract: 不涉及
- backend DTO contract: 不涉及
- permission contract: 不涉及
- audit coverage: 不涉及
- visual evidence: 不涉及（无 UI 面；工作流日志非产品视觉面）
- inheritance contract: 不涉及（工作流是各仓自有 CI 资产，非 foundation 契约面）
- base drift: 不涉及（无消费者需同步的接口/路由/权限/i18n/schema 变化）
- Base/ops inheritance: 无需发布；ops 侧同名工作流模式属消费者仓库自身评审

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

> 层内边界：四个工作流文件 + 两个守护测试。判定逻辑不变，只变“同一个值在一步里被写几次”
> 与“错误文本走哪个流”。`release-gate.yml:281-284`（4 次）与 `security.yml:108-110`（3 次）
> 未达 Sonar 实际报出的最小重复次数 5，故有意保留字面量，理由写在 evidence knownGaps。

## 验证记录

- [x] 后端测试：`go test ./...`（不涉及：无 backend 改动）
- [x] 前端构建：`cd frontend && npm run build`（不涉及：无前端源码改动）
- [x] L0/L1/L2 smoke（不涉及：无运行时面；证据为合并后 main 的 Release Gate 读数）
- [x] 工作流守护测试：`npm run test:quality-workflow` 5/0、`test:security-workflow` 1/0、
      `test:release-gate-workflow` 7/0、`test:ci-bench-perf-smoke-workflow` 2/0、
      `test:pr-automation-workflow` 4/0
- [x] `npm run test:scripts` → 181/181
- [x] `bash -n` 对被改的 `ci.yml` / `quality.yml` run 块 + 等价 shell 模拟
      （全 `success` → pass；含 `failure` → 阻断并 exit 1）
- [x] 治理矩阵：`check:failure-registry` / `check:task-packet` / `check:task-packet-template` /
      `check:docs-frontmatter` / `check:harness-docs` / `check:harness-inventory` /
      `check:harness-encoding` / `check:structure` / `check:generated` /
      `check:generated-modules` / `check:ui-quality-gate` / `check:duplication` → 全部 exit 0
- [x] `node scripts/harness/check-evidence.mjs --strict`、`check-review.mjs --strict` → exit 0
- [x] repo-ci-triage notes（工作流变更必附）：受影响作业为
      `CI`（`ci-summary` 判定）、`Code Quality Gates`（`Docs Governance` 严格强制步 +
      `Quality Gates` 汇总步）、`Security Gates`（zizmor 阻断分支、CodeQL 计数步）、
      `Release Gate`（CodeQL/Dependabot 计数与通过行）。四者的 `exit` 条件与判定值未变，
      因此本地不需要复现 hosted 环境；`actionlint` 仍在 `Lint Workflows` 作业中执行
      （`-shellcheck=""`），本次改动不新增 shellcheck 面。
- [x] CodeQL 结果已检查并解释（本 PR 改动 `.yml` 与 `.mjs`，均在 CodeQL 抽取范围内，结果待回读）
- [x] 无 open CodeQL alert 需要说明（待本 PR 检查回读后确认）
- [x] Full Smoke 未错误纳入 PR 必过门禁
- [x] GitHub required checks 由分支保护与 PR Automation 负责最终合并门禁
- [ ] Copilot review 已请求，或已说明当前仓库/账号不可用
- [x] 已确认 squash auto-merge 的处置流程（回读检查后显式合并）

补充说明：本 PR 不含任何抑制手段——没有 `NOSONAR`、`//nolint`、False Positive 标记、
new-code baseline 移动、查询条件或阈值变更；Sonar token 仅作为 shell 变量用于只读 GET。

## 审核留痕

- Copilot review：unavailable（`gh pr edit --add-reviewer Copilot` 在本仓库返回
  `Could not resolve user with login 'copilot'`）
- CodeQL 结果：待回读
- GitHub checks 结果：待回读
- Auto-merge：not-enabled（沿用回读后显式 squash 合并的流程）
- Duplication Gate 结果：PASS（`npm run check:duplication` exit 0）
- 是否高风险改动：no（仅治理/CI 文案与常量形态；判定语义零变化，由守护测试等强度断言佐证）
- Residual risk / follow-up：终局读数（main `Release Gate` 的 `Unprocessed SonarCloud issues`
  6 → 0）只能在合并后的 push 分析取得；同类缺陷仍无本地传感器可读 workflow YAML，已在
  FR-023 以 `no-repeat-observed` 登记，是否补建本地 checker 归维护者决定。

## 检查清单

- [x] 已明确本次改动归属 `platform`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n（不涉及）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰（不涉及）
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（不涉及；治理文档 failure-registry 已同步 FR-023）
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
