## 变更摘要

- 改动层级：platform
- 改动模块：`.harness/tasks/2026-10-30-menu-contract-inline-const/`、
  `.harness/evidence/2026-10-30-menu-contract-inline-const/`、
  `docs/harness/tasks/2026-10-30-menu-contract-inline-const.task.md`
- 目标问题：PR #471（菜单合同传感器解析行内 `const` 并对无法解析的 seed 引用具名报错）已合并，
  但任务包的 manifest 仍是 `in-progress`，evidence 里没有合并后读数。
- 预期影响：零代码、零门禁、零发布变化。补齐合并后证据：PR #471 检查回读（36 success / 2 预期跳过）、
  squash 合并 `03e13d48`、main 上 6 条 push 工作流读数、`Release Gate` 对 6 条既有
  `githubactions:` findings 的红灯归因与后续包指认。

## Harness 链路

- Task ID：`2026-10-30-menu-contract-inline-const`
- Task Manifest：`.harness/tasks/2026-10-30-menu-contract-inline-const/manifest.json`
- Evidence：`.harness/evidence/2026-10-30-menu-contract-inline-const/commands.json`
- Verification evidence：`.harness/evidence/2026-10-30-menu-contract-inline-const/summary.md`
- Review Artifact：`.harness/evidence/2026-10-30-menu-contract-inline-const/review.md`
- OpenSpec change：none
- Trivial change：yes
- Quality Profile：none
- Ratchet Decision：no-repeat-observed
- GitHub Signal：not-applicable

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-10-30-menu-contract-inline-const
- task manifest: .harness/tasks/2026-10-30-menu-contract-inline-const/manifest.json
- evidence: .harness/evidence/2026-10-30-menu-contract-inline-const/commands.json
- boundaries: 仅本任务自身的任务包 / manifest / evidence；不改传感器、不改工作流、不改门禁规则
- backend response contract: 不涉及
- backend DTO contract: 不涉及
- permission contract: 不涉及
- audit coverage: 不涉及
- visual evidence: 不涉及（无 UI 面）
- inheritance contract: 不涉及（无发布动作；消费者吸收仍等 patch foundation release，时点归维护者）
- base drift: 不涉及
- Base/ops inheritance: 传感器修复已在 `main`，`pantheon-ops` 需一次 patch 发布才能吸收；本包不切版

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

## 验证记录

- [x] 后端测试：`go test ./...`（不涉及：无 backend 改动）
- [x] 前端构建：`cd frontend && npm run build`（不涉及：无前端源码改动）
- [x] L0/L1/L2 smoke（不涉及：无运行时面）
- [x] `npm run check:task-packet`、`npm run check:task-packet-template` → exit 0
- [x] `npm run check:docs-frontmatter` → 400 docs passed
- [x] `npm run check:harness-docs` / `check:harness-inventory` / `check:harness-encoding` /
      `check:structure` → 0 findings
- [x] `node scripts/harness/check-evidence.mjs --strict`、`node scripts/harness/check-review.mjs --strict` → exit 0
- [x] CodeQL 结果已检查并解释（本 PR 仅 markdown/json，CodeQL 无新增面）
- [x] Full Smoke 未错误纳入 PR 必过门禁
- [x] GitHub required checks 由分支保护与 PR Automation 负责最终合并门禁
- [ ] Copilot review 已请求，或已说明当前仓库/账号不可用
- [x] 已确认 squash auto-merge 的处置（合并由维护者侧脚本执行，非自动）

补充说明：`check:harness-adoption` 在本工作树仍有 2 条 finding，全部指向既有的未提交
`backend/modules/system/i18n/builtin_locale_resources.json`（i18n 在途工作），本 PR 未 stage 这些文件。

## 审核留痕

- Copilot review：unavailable（`gh pr edit --add-reviewer Copilot` 返回
  `Could not resolve user with login 'copilot'`，本仓库/账号未启用 Copilot reviewer）
- CodeQL 结果：不涉及新增扫描面（仅 `.md` / `.json`）
- GitHub checks 结果：待本 PR 回读
- Auto-merge：not-enabled（PR Automation 会默认开启 squash auto-merge，本 PR 沿用既有流程：
  回读检查后显式 squash 合并）
- Duplication Gate 结果：不涉及（无代码克隆面）
- 是否高风险改动：no
- Residual risk / follow-up：`main` 上 `Release Gate` 因 6 条既有 `githubactions:` findings
  （`ci.yml`/`quality.yml` 的 S1192 字面量重复、`release-gate.yml`/`security.yml` 的 S7677 错误输出未走
  stderr）红灯；已由后续 Base 包修复工作流本体，不削弱门禁。

## 检查清单

- [x] 已明确本次改动归属 `platform`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n（不涉及）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰（不涉及）
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（不涉及）
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
