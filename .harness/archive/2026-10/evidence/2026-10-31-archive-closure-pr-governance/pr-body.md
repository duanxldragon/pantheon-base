## 变更摘要

- 改动层级：platform
- 改动模块：`scripts/check-pr-governance.mjs`、`tests/scripts/check-pr-governance.test.mjs`、
  `.harness/archive/2026-10/{tasks,evidence}/`（6 组 `git mv`）、`.harness/ARCHIVE.md`、
  `docs/harness/failure-registry.md`、`2026-10-30-workflow-sonar-githubactions` 的收口记录、
  本任务包与 evidence
- 目标问题：两件事。①按 `.harness/ARCHIVE.md` 的月度约定，6 个 `completed` 任务树
  （`2026-10-27-codebase-simplification-program`、`2026-10-29-harness-task-archive`、
  `2026-10-29-simplification-program-closeout`、`2026-10-29-v0181-restore-request-guard`、
  `2026-10-30-menu-contract-inline-const`、`2026-10-30-workflow-sonar-githubactions`）
  仍滞留在 live 树，须以 `git mv` 落到 `archive/2026-10/`。②准备其收口 PR 时撞上 FR-019
  那一类的另一半：`scripts/check-pr-governance.mjs` 用裸 `fs.existsSync` 校验
  `Task Manifest` / `Evidence` / `Verification evidence` / `Review Artifact` 四个链路字段，
  且非 trivial PR 不允许写 `none`——任务一旦归档，记录该任务收口的 PR 正文就被判
  `file does not exist in repository`，与 ARCHIVE.md「归档后继续用规范路径引用」直接冲突。
- 预期影响：归档约定对 PR 面同样成立（规范路径先直查、缺失才按月回退）；归档后 live 树
  只剩 1 个 `in-progress` 任务与本包。PR 正文校验的其它规则、门禁语义、阈值、必需检查集合
  与 Sonar 查询条件零变化；不触碰 `.github/workflows/**`、`backend/**`、`frontend/src/**`。

## Harness 链路

- Task ID：`2026-10-31-archive-closure-pr-governance`
- Task Manifest：`.harness/tasks/2026-10-31-archive-closure-pr-governance/manifest.json`
- Evidence：`.harness/evidence/2026-10-31-archive-closure-pr-governance/commands.json`
- Verification evidence：`.harness/evidence/2026-10-31-archive-closure-pr-governance/summary.md`
- Review Artifact：`.harness/evidence/2026-10-31-archive-closure-pr-governance/review.md`
- OpenSpec change：none
- Trivial change：no
- Quality Profile：ci-workflow
- Ratchet Decision：sensor-added
- GitHub Signal：repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-10-31-archive-closure-pr-governance
- task manifest: .harness/tasks/2026-10-31-archive-closure-pr-governance/manifest.json
- evidence: .harness/evidence/2026-10-31-archive-closure-pr-governance/commands.json
- boundaries: 仅治理面（任务档案树 + PR 正文校验器的路径解析）；不改门禁语义、不改阈值、不改运行时
- backend response contract: 不涉及
- backend DTO contract: 不涉及
- permission contract: 不涉及
- audit coverage: 不涉及
- visual evidence: 不涉及（无 UI 面；治理脚本与档案树非产品视觉面）
- inheritance contract: 不涉及（PR 治理脚本是本仓自有治理资产，非 foundation 契约面）
- base drift: 不涉及（无消费者需同步的接口/路由/权限/i18n/schema 变化）
- Base/ops inheritance: 无需发布；ops 侧 PR 治理副本按消费者仓库自身评审，不回抄 base 文件

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

> 层内边界：一个校验器函数 + 其测试 + 档案树移动 + 治理文档。回退只补全解析，不改变要求：
> 直查永远优先，只有规范路径不存在时才在 `.harness/tasks/` 与 `.harness/evidence/` 两个前缀上
> 按月回退，URL / 绝对路径 / `..` 越界的既有拒绝逻辑保持在前。残余（`check-evidence` /
> `check-review` / `generate-pr-body` 仍是裸 `existsSync`）以实测读数登记在 FR-024，不在本 PR
> 顺手改造——那三个脚本的默认扫描面是 live 树，补齐需要自带 fixture。

## 验证记录

- [x] 后端测试：`go test ./...`（不涉及：无 backend 改动）
- [x] 前端构建：`cd frontend && npm run build`（不涉及：无前端源码改动）
- [x] L0/L1/L2 smoke（不涉及：无运行时面；证据是同一份已归档正文在旧/新传感器上的前后对照）
- [x] 传感器修复的终局对照：取已归档的 `pr-body.md`（链路仍写规范路径）合成 event，
      `git show HEAD:` 导出的旧传感器 → exit 1 + 4 条 `file does not exist in repository`；
      修复版对同一输入 → exit 0 + `OK pantheon-base PR body governance fields are present`；
      两个探针文件用完即删
- [x] `npm run test:pr-governance` → 8/8（本包新增 2 条：归档路径必须 0 findings；
      既不 live 也不归档的 task-id 必须仍报缺失）
- [x] `npm run test:scripts` → 183/183（基线 181 + 2）
- [x] 治理矩阵（移动与改动之后）：`check:task-packet` / `check:task-packet-template` /
      `check:docs-frontmatter` / `check:harness-docs` / `check:harness-inventory` /
      `check:harness-encoding` / `check:structure` / `check:failure-registry` /
      `check:generated` / `check:generated-modules` / `check:ui-quality-gate` /
      `check:duplication` → 全部 exit 0
- [x] `node scripts/harness/check-evidence.mjs --strict`、`check-review.mjs --strict` → exit 0
- [x] 残余实测（非待修门禁）：对已归档 `commands.json` 显式跑 `check-evidence --strict` →
      3 条错误（`taskManifest does not exist`、`reviewFile does not exist`、
      `evidenceDir must match the commands.json directory`），三个目标在 `archive/2026-10/`
      下均存在；读数与成因写入 FR-024 与本包 evidence
- [x] `npm run check:harness-adoption -- --strict` → 0 findings；对照读数为本包创建前 2 条
      （均指向 `backend/modules/system/i18n/builtin_locale_resources.json`）。六个 i18n 文件
      未被改动、未被 stage；变化来自该检查器的 worktree 级 pairing，已作为传感器特性记录
- [x] `git mv` 边界：34 个文件以移动形式出现（含 `2026-10-29-v0181-restore-request-guard/notes/`）；
      排除 i18n 后 tracked 改动 9 文件 `+267/-13`
- [x] CodeQL 结果已检查并解释（本 PR 改 `.mjs`，在 CodeQL 抽取范围内，结果待回读）
- [x] 无 open CodeQL alert 需要说明（待本 PR 检查回读后确认）
- [x] Full Smoke 未错误纳入 PR 必过门禁
- [x] GitHub required checks 由分支保护与 PR Automation 负责最终合并门禁
- [ ] Copilot review 已请求，或已说明当前仓库/账号不可用
- [x] 已确认 squash auto-merge 的处置流程（本包不尝试关闭 auto-merge）

补充说明：本 PR 不含任何抑制手段——没有豁免标记、没有阈值或断言放宽、没有删除既有用例；
归档只用 `git mv` 保留历史；`.task.md` 正文只有两个具备终局读数的 2026-10-30 包被标
`Archived`，67 个历史 `Active` 包未批量改写。

## 审核留痕

- Copilot review：unavailable（`gh pr edit --add-reviewer Copilot` 在本仓库返回
  `Could not resolve user with login 'copilot'`）
- CodeQL 结果：待回读
- GitHub checks 结果：待回读
- Auto-merge：enabled（沿用 `pr-automation` 的 squash auto-merge；上一轮尝试关闭被权限分类器
  拒绝，本包不再尝试）
- Duplication Gate 结果：PASS（`npm run check:duplication` exit 0）
- 是否高风险改动：no（一个校验函数的路径解析 + 档案树移动；PR 正文校验的判定集合与
  门禁语义零变化，由两条反向测试与前后对照读数佐证）
- Residual risk / follow-up：`check-evidence` / `check-review` / `generate-pr-body` 仍用裸
  `fs.existsSync`，且默认 glob 只扫 live 树——归档证据因此既不会让门禁变红、也不再被
  `--strict` 读到。补齐这三处、或新增「归档证据同样可查」的门禁，属治理面扩容，归维护者；
  实测读数与判定已登记在 FR-024（occurrence=2，指向 FR-019）。

## 检查清单

- [x] 已明确本次改动归属 `platform`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n（不涉及）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰（不涉及）
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（不涉及；failure-registry 已同步 FR-024，
      ARCHIVE.md 已同步统计与清单）
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
