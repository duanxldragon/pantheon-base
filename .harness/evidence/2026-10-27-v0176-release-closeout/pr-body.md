## 变更摘要

- 改动层级：platform（版本材料与发布记录）；被发布的范围覆盖 `system/iam`、`system/config`、`system/org`。
- 改动模块：`VERSION`、`CHANGELOG.md`、`RELEASE_NOTES_v0.17.6.md`、`README.md`、`README.en.md`、
  `.harness/STATUS.md`，以及本轮 task packet / manifest / evidence 三件与 pr-body。
- 目标问题：v0.17.5（`ed636967`）之后合入主干的五个工作（#423、#424、#427、#426、#425，
  303 files / +13767 / −635）目前没有可消费形态，`pantheon-ops` 无法推进 foundation pin。
- 预期影响：**本发布不是无 schema 变更的 patch**。`000030_tenant_plan_definitions` 把 schema 从 29
  推到 30（`tenant_plans` 平台全局表 + 按 code 守卫的种子，对既有租户是 no-op）；新增 5 个路由与 5 个
  权限码（`system:tenant:overview` / `:member-list` / `:plan:list` / `:plan:create` / `:plan:update`）
  和新的「租户运营」菜单组（租户管理移到它下面）。配额**只展示不强制**，与合同一致。
  本 PR 自身不改任何生产代码。

## Harness 链路

- Task ID：`2026-10-27-v0176-release-closeout`
- Task Manifest：`.harness/tasks/2026-10-27-v0176-release-closeout/manifest.json`
- Evidence：`.harness/evidence/2026-10-27-v0176-release-closeout/commands.json`
- Verification evidence：`.harness/evidence/2026-10-27-v0176-release-closeout/summary.md`
- Review Artifact：`.harness/evidence/2026-10-27-v0176-release-closeout/review.md`
- OpenSpec change：none
- Trivial change：no
- Quality Profile：permission-policy
- Ratchet Decision：ratchet-executed
- GitHub Signal：repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-10-27-v0176-release-closeout
- task manifest: .harness/tasks/2026-10-27-v0176-release-closeout/manifest.json
- evidence: .harness/evidence/2026-10-27-v0176-release-closeout/commands.json
- boundaries: `check-boundaries --strict` 与 `--strict --baseline config/boundary-baseline.json` 两种形态均 no findings；baseline `entries` 为空
- backend response contract: 未改动错误信封形状；新增路由沿用统一 envelope（`tenant_ops_handler.go`）
- permission contract: 新增 5 个权限码并在 `permission_workbench.go:637-641` 绑定路由；无移除、无重命名
- audit coverage: 本轮只读面（overview / member / plan list）与定义写入；发布材料不改审计链路
- visual evidence: `check-ui-contract` 0 findings / 277 files、`check-shell-visual-contract` passed、`check-password-toggle` 0 findings / 257 files
- inheritance contract: `check-inheritance-contract --root ..`（workspace 级正确调用形态）0 findings / 0 warnings
- base drift: 本 PR 只含版本材料与治理工件，无生产代码差异
- Base/ops inheritance: 发布后由 `pantheon-ops` 推进 `foundation-release.lock.json` 到 `pantheon-base-v0.17.6` 并跑 `rebuild:from-base` + overlay drift 校验（另立 ops 任务包）

## 边界说明

- [ ] 本次改动仅涉及单一层级
- [x] 本次改动涉及跨层，已说明边界与依赖

> 本次为什么跨层：PR 自身只动 `platform` 层的版本材料与治理工件，但它要发布的范围（#424 + #427）落在
> `system/iam`（套餐表与租户运营读面）、`system/config`（dict reorder）、`system/org`（dept/post
> import-export）三个系统域，并把 `platform` 对 `system/iam/menu` 的跨层类型依赖通过 `MenuNode` 提升到
> `frontend/src/api/menu.ts` 消除。各层职责：IAM 域拥有表、权限码与读面；config/org 只接收作用域修复；
> platform 只接收公共契约与菜单聚合。影响面：菜单树（新增一级组，租户管理改挂其下）、权限（+5 码）、
> i18n（5 语言 copy 已随 #427 落地）、审计（无变化）。

## 验证记录

- [x] 后端测试：`go test ./...` — 真库全量 **46 包 ok / 0 FAIL / 0 SKIP**（需
  `PANTHEON_NODE_BIN` + `PANTHEON_WORKSPACE_ROOT`，否则 `modules/lowcode/dynamicmodule` 以已登记的
  F5 环境限制报 16 个 `module.generate.server_export_failed`）
- [x] 前端构建：`node node_modules/vite/bin/vite.js build`（774ms）+ 14 项 `prebuild` 契约逐项通过
- [ ] L0 静态契约：由 `Code Quality Gates` 与 `Frontend Quality` 在 CI 上判定
- [ ] L1 关键路径 smoke（PR 必过）：由 CI 判定
- [ ] L2 命中模块 smoke：由 CI 按改动路径自动选择（本 PR 为 docs-only）
- [ ] 如涉及系统域深链路，已补充专项 smoke
- [x] 其他专项验证已补充：`go build` / `go vet` / `gofmt -l .` 干净；
  `golangci-lint run --new-from-rev=main ./...`（CI 口径）0 发现；`tsc -b` 与
  `eslint src tests --max-warnings 0` 均 0；治理链 frontmatter / task-packet / structure /
  generated / boundaries / failure-registry / runtime-evidence / inheritance 全绿；
  新增面回归（plan store 17 例、overview/member/plan-list、dept/post compat、role policy sync、
  tenant switch、security event、reset password、menu seed、schema 对齐）逐个 PASS
- [ ] CodeQL 结果已检查并解释
- [ ] 如有 open CodeQL alert，已说明是新增问题、既有 baseline、误报还是已补 follow-up
- [x] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [ ] GitHub required checks 通过 — 待 CI 回填
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用：本仓库走 ruleset + 单维护者流程，
  approving review count 为 0，不请求 Copilot review
- [x] 已启用或确认将启用 squash auto-merge

补充说明：发布目标提交是本 PR 的 squash 合并提交，不是 `7dafa997`——
`publish-foundation-release.mjs` 要求目标提交上有 success 的 `Release Gate Summary`。
README / STATUS / CHANGELOG 里对 tag 与四件资产的描述是前瞻性的，真实发布事实在合并并发布后由后续
提交回填（与 v0.17.5 由 #423 收口的方式一致）。

## 审核留痕

- Copilot review：unavailable（单维护者 ruleset 流程，required approving reviews = 0）
- CodeQL 结果：待 CI 回填
- GitHub checks 结果：待 CI 回填
- Auto-merge：enabled
- Duplication Gate 结果：待 CI 回填（上一轮 New Code Duplication 0.0%，阈值 3%）
- 是否高风险改动：发布本身中风险（本 release 含 schema 29→30 与新增权限码/菜单 seed），
  但本 PR 的代码差异只是版本材料与治理工件
- Residual risk / follow-up：①发布事实待回填；②SonarCloud 需对本分支重新分析后复读；
  ③FR-016 / FR-017 仍 open（4 个 checker 未进 CI，属维护者的门禁策略决定）；
  ④`check-inheritance-contract` 必须在 workspace root 调用，在 base 仓内用 `--root .` 会误报；
  ⑤dependabot 触发的 run 读不到 `RELEASE_GATE_TOKEN`，`Automate Solo PR` 恒红（非必需 context）

## 检查清单

- [x] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n（随 #427 落地，本轮 `check-i18n-hardcode` 238 文件通过）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰（`check-menu-contract` 19 菜单 / 23 路由 / 102 权限）
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（release notes、CHANGELOG、README 双语、STATUS）
- [x] 已确认不会泄露敏感配置、账号密码或 Token（发布凭据预检在切割步骤执行，本 PR 不含凭据）
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
