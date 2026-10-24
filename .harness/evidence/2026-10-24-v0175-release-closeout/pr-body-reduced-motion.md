## 变更摘要

- 改动层级：platform（前端主题动效）
- 改动模块：`frontend/src/assets/list-page.css`、`frontend/src/core/layout/index.css`
- 目标问题：`Release Gate` 在 v0.17.5 发布材料合并提交 `d36c63e9` 上被两个未关闭的 SonarCloud `css:S9440` 阻断（组织架构卡片 `list-page.css:1541`、顶部菜单项 `index.css:785`，均为 2026-05-11 存量）。按维护者规则，Sonar 规则与项目配置不改、不加 suppression，在代码层修复：把这两处 `transition` 移入 `@media (prefers-reduced-motion: no-preference)`
- 预期影响：默认用户（no-preference）过渡与之前完全一致（0.18s）；`prefers-reduced-motion: reduce` 用户不再有过渡。无布局、配色、交互或后端行为变化，schema 仍为 29

## Harness 链路

- Task ID：2026-10-24-v0175-release-closeout
- Task Manifest：.harness/tasks/2026-10-24-v0175-release-closeout/manifest.json
- Evidence：.harness/evidence/2026-10-24-v0175-release-closeout/commands.json
- Verification evidence：.harness/evidence/2026-10-24-v0175-release-closeout/summary.md
- Review Artifact：.harness/evidence/2026-10-24-v0175-release-closeout/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：ui-runtime
- Ratchet Decision：no-repeat-observed
- GitHub Signal：repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-10-24-v0175-release-closeout
- task manifest: .harness/tasks/2026-10-24-v0175-release-closeout/manifest.json
- evidence: .harness/evidence/2026-10-24-v0175-release-closeout/
- boundaries: two frontend CSS files only; the transitions are moved into a prefers-reduced-motion media query, no rule, token, component or configuration change
- backend response contract: unchanged
- backend DTO contract: unchanged
- permission contract: unchanged
- audit coverage: unchanged
- visual evidence: headless Chromium on the built CSS measures card 0.18s x3 and menu 0.18s x4 under no-preference, 0s for both under reduce
- inheritance contract: no sharedPaths or contract document change
- base drift: branch cut from main d36c63e9
- Base/ops inheritance: pantheon-ops needs no change; it inherits the CSS through the v0.17.5 foundation asset once the tag is cut

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

补充说明：改动只影响两处既有过渡的生效条件，不新增选择器、不改动组件结构、不触碰 SonarCloud 规则或项目配置。v0.17.5 的后端内容已随 #420 合入并经 `2026-10-23-iam-race-closeout` 审查，本次不修改任何 Go 代码、migration 或 workflow。

## 验证记录

- [x] 前端格式：`node node_modules/prettier/bin/prettier.cjs --check src/assets/list-page.css src/core/layout/index.css` → "All matched files use Prettier code style!"
- [x] UI 合同：`node ./scripts/check-ui-contract.mjs` → 0 finding(s) across 263 file(s)
- [x] 外壳视觉合同：`node ./scripts/check-shell-visual-contract.mjs` → "Shell visual contract passed."
- [x] 构建：`node node_modules/vite/bin/vite.js build` → "✓ built in 692ms"
- [x] 运行时动效（headless Chromium，加载构建产物 CSS）：`no-preference` → 卡片 `0.18s, 0.18s, 0.18s`、菜单 `0.18s, 0.18s, 0.18s, 0.18s`；`reduce` → 两者均 `0s`
- [x] 后端：本 PR 无后端改动；v0.17.5 的 46 packages ok / 0 FAIL / 0 SKIP 记录见同任务 evidence
- [ ] CodeQL 结果：待 CI
- [ ] GitHub required checks：待 CI（含 `quality.yml` 的 `backend-tests` `go test -race ./...`）
- [ ] Copilot review：待 PR Automation
- [ ] Duplication Gate 结果：待 CI
- [ ] SonarCloud：待 main 重新分析后确认两处 `css:S9440` 关闭
- [ ] 已启用或确认将启用 squash auto-merge

## 审核留痕

- Copilot review：requested
- CodeQL 结果：待 CI
- GitHub checks 结果：待 CI
- Auto-merge：enabled by PR Automation
- Duplication Gate 结果：待 CI
- 是否高风险改动：no（两处 CSS 过渡的作用域收窄，无后端、权限、审计或接口变化）
- Residual risk / follow-up：SonarCloud 关闭依赖 main 的新分析；`Release Gate Summary` 必须在最终合并提交上转绿后才能切 tag

## 检查清单

- [x] 已明确本次改动归属 `platform`（前端主题动效）
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n：未涉及文案
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步：无此类变更；`RELEASE_NOTES_v0.17.5.md`、`CHANGELOG.md`、README、STATUS 与任务包已记录本次动效修复
- [x] 已确认不会泄露敏感配置、账号密码或 Token
