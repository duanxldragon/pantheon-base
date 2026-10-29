## 变更摘要

- 改动层级：platform
- 改动模块：backend/go.mod; .harness/tasks、.harness/evidence 治理工件; docs/harness/tasks task packet
- 目标问题：v0.14.0 多租户发布收口中断——tenant 测试缺失的依赖声明未提交、base 侧 SSRF 任务 manifest 状态过期、v0.14.0 tag/Release 从未真正发布（README 引用为悬空链接）
- 预期影响：trivial

## Harness 链路

- Task ID：2026-09-29-v0140-release-completion
- Task Manifest：.harness/tasks/2026-09-29-v0140-release-completion/manifest.json
- Evidence：.harness/evidence/2026-09-29-v0140-release-completion/commands.json
- Verification evidence：.harness/evidence/2026-09-29-v0140-release-completion/summary.md
- Review Artifact：.harness/evidence/2026-09-29-v0140-release-completion/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：ci-workflow
- Ratchet Decision：no-repeat-observed
- GitHub Signal：repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-09-29-v0140-release-completion
- task manifest: .harness/tasks/2026-09-29-v0140-release-completion/manifest.json
- evidence: .harness/evidence/2026-09-29-v0140-release-completion/commands.json
- boundaries: single-layer
- backend response contract: not-applicable
- backend DTO contract: not-applicable
- permission contract: not-applicable
- audit coverage: not-applicable
- visual evidence: no visual change
- inheritance contract: not-applicable
- base drift: none
- Base/ops inheritance: not-applicable

## 边界说明

- [x] 本次改动仅涉及单一层级

**Scope In**: backend/go.mod 测试依赖声明补齐（stretchr/testify、gorm.io/driver/sqlite）; SSRF 集成任务 manifest 状态同步（in-progress → completed）; v0.14.0 tag 与 GitHub Release 发布

**Scope Out**: 产品运行时代码; SSRF 中间件实现; pantheon-ops 仓库; 发布之外的新功能

## 验证记录

- [x] 后端测试：go mod tidy / go vet / tenant 包测试编译本地通过，CI 已通过
- [x] 前端构建：不适用（未触碰前端）
- [x] 轻量 smoke：CI 已通过
- [ ] 如涉及系统域深链路，已补充专项 smoke：不适用
- [ ] 其他专项验证已补充：不适用
- [x] CodeQL 结果已检查并解释：通过
- [ ] 如有 open CodeQL alert，已说明是新增问题、既有 baseline、误报还是已补 follow-up：无 alert
- [x] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [x] GitHub required checks 通过
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用：unavailable
- [x] 已启用或确认将启用 squash auto-merge

补充说明：依赖修复经 go mod tidy（go.sum 零 churn）与 vet/测试编译验证；治理门禁（pr-governance、task-packet、structure-contract、frontmatter）本地全绿；hosted required checks 是最终合并门禁。

## 审核留痕

- Copilot review：unavailable
- CodeQL 结果：SUCCESS
- GitHub checks 结果：通过
- Auto-merge：not-enabled
- Duplication Gate 结果：SUCCESS
- 是否高风险改动：否
- Residual risk / follow-up：pantheon-ops 侧 consumer lock/继承快照更新仍由 ops 仓库单独跟进（已有任务跟踪）

## 检查清单

- [x] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n：不适用
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰：不涉及
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步：不涉及
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁

---

## 技术细节

**Goal**: 完成 v0.14.0 多租户发布收口：补齐依赖修复与过期 manifest 状态同步，经治理 PR 门禁合并后发布 `pantheon-base-v0.14.0` tag 与 GitHub Release（README 既有引用由此生效）。

**Human Gates**: GitHub required checks 与 PR merge；维护者对统一 v0.14.0 发布身份的确认。

## v0.14.0 发布说明（补充条目）

v0.14.0 除多租户主体功能外，并入以下收口条目：

- fix(deps): 补齐 tenant 测试依赖声明（stretchr/testify v1.11.1、gorm.io/driver/sqlite v1.6.0）
- chore(harness): SSRF 集成任务 manifest 状态同步（in-progress → completed，与 ops 侧一致）
