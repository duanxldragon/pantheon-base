## 变更摘要

- 改动层级：platform（测试面：harness checker 测试 + `system/i18n` 测试；无运行时代码）
- 改动模块：`tests/scripts/harness-check-generated.test.mjs`（3 个同构 discovered-artifact 测试合并为 1 个表驱动测试，11 → 9 tests）、`backend/modules/system/i18n/i18n_updated_by_test.go`（抽出 `newAttributionTestService` setup helper）
- 目标问题：#344 携带的 48/621 新代码重复触发 SonarCloud PR Quality Gate（7.7% > 3% 红灯）。该 PR 已由维护者合并（main 窗口摊薄后 1.98% 达标，Release Gate 不受影响），但重复本身是真实坏味道：33 行在 checker 测试的新旧同构体、15 行在 i18n 归属测试与包内既有 scaffold 的克隆块；不修会在后续小窗口 PR 复发同类红灯（sonar 类失败在本仓已有 `2026-09-10-sonar-new-code-zero`、`2026-09-10-sonar-resolved-repair` 等多轮先例）
- 预期影响：同一条 Sonar 分析的 PR 维度 duplication 预期从 7.7% 降至阈值内（本 PR 的 SonarCloud check 即验证器）；测试语义零变化——规则名、文件路径、`checkedCount` 断言全部保留。**affected subgraph**：仅两个测试文件；产品代码、schema、权限、菜单、workflow 零改动

## Harness 链路

- Task ID：2026-09-24-fix-report-residual-closeout
- Task Manifest：.harness/tasks/2026-09-24-fix-report-residual-closeout/manifest.json
- Evidence：.harness/evidence/2026-09-24-fix-report-residual-closeout/commands.json
- Verification evidence：.harness/evidence/2026-09-24-fix-report-residual-closeout/summary.md
- Review Artifact：.harness/evidence/2026-09-24-fix-report-residual-closeout/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：ci-workflow
- Ratchet Decision：no-repeat-observed
- GitHub Signal：repo-quality-gate

> 本 PR 是 #344 的 CI 处置延续，归属同一个 closeout task（其 evidence 记录 #344 全链路与 Sonar 失败明细）。

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-09-24-fix-report-residual-closeout
- task manifest: .harness/tasks/2026-09-24-fix-report-residual-closeout/manifest.json
- evidence: .harness/evidence/2026-09-24-fix-report-residual-closeout/commands.json
- boundaries: test-only change inside platform test surfaces (harness checker tests and system/i18n tests); no product code, schema, permission, menu, i18n copy or workflow change
- backend response contract: none
- backend DTO contract: none
- permission contract: none
- audit coverage: none
- visual evidence: none
- inheritance contract: none
- base drift: none
- Base/ops inheritance: none

## 边界说明

- [x] 本次改动仅涉及单一层级（测试面，无运行时行为）
- [ ] 本次改动涉及跨层，已说明边界与依赖

> 两个文件都是测试：checker 测试把三个"发现态违规"用例改为数据驱动循环（每条断言 rule 与 file 身份不变）；i18n 测试把 service bootstrap 收进 `newAttributionTestService`（`t.Helper`），测试体不再复述本包既有测试的 scaffold。产品代码、schema、权限、菜单、i18n 文案、workflow 均未触碰。

## 验证记录

- [x] 后端测试（touched scope）：`gofmt -l` 空、`go vet ./modules/system/i18n/` clean、`go test -count=1 ./modules/system/i18n/` **ok 179.2s（DB-backed）**
- [x] 前端构建：不适用（无 frontend 文件改动）
- [x] 轻量 smoke：不适用（无 UI / 运行时行为改动）
- [x] 如涉及系统域深链路，已补充专项 smoke：不适用（仅测试文件，无 authz 运行时）
- [x] 其他专项验证已补充：`node --test tests/scripts/harness-check-generated.test.mjs` **9 pass / 0 fail**（合并后语义等价：3 条 discovery 违规在单测内逐场景断言 rule+file；`checkedCount = MARKED.length + 1 + 3` 断言保留）；Sonar 失败明细由 `api/measures/component_tree`（PR 344 维度）逐文件锁定：33 行 + 15 行 = 48，与 quality gate 报告吻合
- [ ] CodeQL 结果已检查并解释：pending —— PR 创建后执行，通过后回填
- [x] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [ ] GitHub required checks 通过：推送后由分支保护执行，结果回填
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用：记 unavailable（沿用 #343/#344 先例记法）
- [x] 已启用或确认将启用 squash auto-merge：确认将启用——待 required checks 绿后由维护者启用

补充说明：① #344 于 2026-09-24T04:23Z 由维护者 squash 合并（`adbc3f97`），当时 SonarCloud PR check 仍红（该 check 非分支保护 required，属维护者合并时的显式处置）；main 分支 new-code 窗口 38453 行、duplication 密度 1.98% ≤ 3%，Release Gate 不受 48 行影响——本 PR 是把真实重复修掉，而非补救一个已爆的 main 门禁。② 本地无法复现 hosted Sonar 分析，按 `repo-ci-triage` 以 `component_tree` API 明细 + 本地等价证据（node --test、go test）替代。

## 审核留痕

- Copilot review：unavailable（沿用 #343 先例记法）
- CodeQL 结果：pending —— PR 创建后执行，通过后回填
- GitHub checks 结果：推送后由分支保护判定；本地证明见验证记录
- Auto-merge：not-enabled（待 checks 绿后由维护者启用，同 #343/#344 先例）
- Duplication Gate 结果：PASS（`node scripts/check-duplication.mjs`，仅剩既有 smoke-core/smoke-full workflow 重复对）
- 是否高风险改动：no —— 仅 2 个测试文件；无 `.github/workflows/*`、无 schema、无权限、无认证、无审计链、无删除动作
- Residual risk / follow-up：① hosted Sonar 分析无法本地镜像，最终以本 PR 的 SonarCloud check 为准（若仍 >3% 则继续收敛同构体）；② checker 测试从 11 → 9，closeout evidence 中"11 pass"的记录保持历史真实，最终数字以本 PR 验证记录为准；③ i18n 包内其余测试的 scaffold 同构是历史存量（main 侧 1.98% 达标），不在本 PR 扩面

## 检查清单

- [x] 已明确本次改动归属：platform（测试面；无运行时归属）
- [x] 未把认证、IAM、组织、配置等系统域职责混写（零运行时改动）
- [x] 前端新增展示文案已使用 i18n：不适用（无 UI 文案）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰（未触碰）
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（无此类变更；去重理由与 Sonar 明细记录在本 body 与 #344 evidence）
- [x] 已确认不会泄露敏感配置、账号密码或 Token（diff 仅两个测试文件）
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
