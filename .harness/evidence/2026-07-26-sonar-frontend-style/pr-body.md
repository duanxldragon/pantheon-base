## 变更摘要

- 改动层级：platform + system/*（前端机械修复，逐条对应冻结 finding 清单，无业务逻辑与视觉变更）
- 改动模块：frontend/src 下 56 个文件（= prd_frontend.txt 182 条清单文件集）、`.harness/{tasks,evidence}/2026-07-26-sonar-frontend-style/`
- 目标问题：SonarCloud 清零轮 frontend 批次——S3358 嵌套三元 ×46、S77xx 现代化规则 ~70、css:S4666 重复选择器 ×6（修 4 留 2）、S6819/S6653/S6594/S4624/S6754/S3863 等按规则消息逐条修复。
- 预期影响：下次 main 分析后 frontend 存量收敛到 S3776 ×24（末批）+ 2 条锚点 S4666（维护者决策项）；预计 OPEN ~307 → ~131。

## Harness 链路

- Task ID：2026-07-26-sonar-frontend-style
- Task Manifest：.harness/tasks/2026-07-26-sonar-frontend-style/manifest.json
- Evidence：.harness/evidence/2026-07-26-sonar-frontend-style/commands.json
- Verification evidence：.harness/evidence/2026-07-26-sonar-frontend-style/summary.md
- Review Artifact：.harness/evidence/2026-07-26-sonar-frontend-style/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：ui-runtime
- Ratchet Decision：no-repeat-observed
- GitHub Signal：repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-07-26-sonar-frontend-style
- task manifest: .harness/tasks/2026-07-26-sonar-frontend-style/manifest.json
- evidence: .harness/evidence/2026-07-26-sonar-frontend-style/commands.json
- boundaries: 仅 frontend/src 清单内文件;i18n key、路由、权限串、注册表 key 未移动(menu-contract/i18n-hardcode/ui-contract/search-toolbar 检查器全绿即为证)
- backend response contract: not-applicable
- backend DTO contract: not-applicable
- permission contract: not-applicable(权限串字面量未动)
- audit coverage: not-applicable
- visual evidence: 无视觉变更意图;shell-visual-contract/ui-contract/important-budget 机械门禁全绿,曾失败的 4 条 shell-visual findings 经锚点恢复归零(见 review.md);Smoke Sanity 端到端兜底
- inheritance contract: not-applicable(base 自身仓库)
- base drift: not-applicable
- Base/ops inheritance: pantheon-ops 按维护者决策搁置,待 base 发行版本后基于 release 同步
- Copilot review: requested
- CodeQL 结果: not-applicable
- GitHub checks 结果: 提交后由 required checks 验证
- Auto-merge: enabled
- Duplication Gate 结果: not-applicable
- 是否高风险改动: 否(逐条 1:1 机械修复;唯一保留决策=两处 css:S4666 锚点重复,合并任一方向都会破坏 shell-visual-contract 门禁或改变计算样式,已按 main 原状保留)
- Residual risk / follow-up: (1) 两条 css:S4666(.filter-panel / .app-table .arco-table-container 首块为视觉契约锚点,后块为级联生效层)需维护者决策:重新锚定 checker 或接受重复;(2) frontend 剩余 S3776 ×24 与 backend S3776 ×95 + 高风险 godre ×6 为最终认知复杂度批次;(3) 权威关闭计数以合并后 SonarCloud OPEN 复查为准。

## 边界说明

- [ ] 本次改动仅涉及单一层级
- [x] 本次改动涉及跨层，已说明边界与依赖

> 跨层说明：S3358/S77xx 等散布在 platform 与各 system 模块的视图层；每处修复严格限定为同文件表达式级重写，不跨模块引入共享，不改变任何契约。

## 验证记录

- [x] 后端测试：`go test ./...`（not-applicable：未触碰后端）
- [x] 前端构建：`cd frontend && npm run build` 通过（含 12 项 prebuild 契约检查全绿）
- [x] 轻量 smoke（由 PR 必过 Smoke Sanity 执行，直接覆盖被改的列表页）
- [x] 其他专项验证已补充：tsc --noEmit 清洁；eslint src --max-warnings 0 清洁；vitest 132/132（lines 92.6%）；shell-visual-contract 首次失败已根因分析并以锚点恢复解决（review.md）
- [x] CodeQL 结果已检查并解释：表达式级机械重写不引入新数据流
- [x] 如有 open CodeQL alert，已说明：当前 0 open alert 基线
- [x] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [x] GitHub required checks 通过（提交后由 CI 出具）
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用
- [x] 已启用或确认将启用 squash auto-merge

补充说明：Codex relay 仍不可用（401），按维护者 2026-07-23 先例由 Claude（隔离 worktree 中的子代理实施 + 主会话收尾与独立 review）完成，提交信息已注明。

## 审核留痕

- Copilot review：requested
- CodeQL 结果：not-applicable
- GitHub checks 结果：提交后由 required checks 验证
- Auto-merge：enabled
- Duplication Gate 结果：not-applicable
- 是否高风险改动：否
- Residual risk / follow-up：见 Harness adoption markers 同名条目

## 检查清单

- [x] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n（无新增文案；i18n-hardcode 检查器绿）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰（相关字面量未动）
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（not-applicable：无此类变更）
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
