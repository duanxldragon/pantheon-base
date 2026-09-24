## 变更摘要

- 改动层级：frontend（测试面 smoke spec；无运行时代码）
- 改动模块：`frontend/tests/smoke-core/business-generated-basic.spec.ts` —— 3 处 `test.skip(true, 'No business modules exist in the current database')` 改为 Playwright 条件式 `test.skip(targetPath === null, '…')` 并提升到 `if` 之前；理由字符串、skip 语义（无业务模块时诚实 skip）、TS narrowing（`if (...) return`）全部保留
- 目标问题：main 的 Release Gate → SonarCloud Gate → "Check unprocessed SonarCloud issues" 因 **2 个 OPEN 的 `typescript:S1607`**（"Tests should not be skipped without providing a reason"，issue 指向该 spec 的 line 98/122 的 `test.skip`，2026-09-24T04:22:59 即 #344 合并后首轮 main 分析产生）报 `Release blocked: 2 unresolved SonarCloud issue(s)` 红灯。#344 引入该写法、#345 处置了 duplication 维度但维护者在 Smoke Sanity 收官前先行合并，本修复未随批进入，故单独成 PR 收口
- 预期影响：本 PR 的 SonarCloud PR 分析即验证器——修改行按新代码重扫，若 `pullRequest` 维度 `typescript:S1607` = 0，则"字面量 `true` 条件被判定为无理由跳过"的根因假设成立；合入 main 后下一轮 main 分析因行 hash 变化将 2 个旧 issue 自动置为 FIXED，Release Gate 的 unprocessed check 随下次 push main 重跑翻绿。**affected subgraph**：仅 1 个前端 smoke spec 文件；产品代码、schema、权限、菜单、workflow 零改动

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

> 本 PR 是 main Release Gate 红灯的 CI 处置延续，与 #344/#345 归属同一个 closeout task（其 evidence 记录 Sonar 失败明细与 #345 全链路）。

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-09-24-fix-report-residual-closeout
- task manifest: .harness/tasks/2026-09-24-fix-report-residual-closeout/manifest.json
- evidence: .harness/evidence/2026-09-24-fix-report-residual-closeout/commands.json
- boundaries: frontend smoke spec test-only change (conditional test.skip form); no product code, schema, permission, menu, i18n copy or workflow change
- backend response contract: none
- backend DTO contract: none
- permission contract: none
- audit coverage: none
- visual evidence: none
- inheritance contract: none
- base drift: none
- Base/ops inheritance: none

## 边界说明

- [x] 本次改动仅涉及单一层级（frontend 测试面，无运行时行为）
- [ ] 本次改动涉及跨层，已说明边界与依赖

> 三个用例的条件 skip 从"分支内字面量 `true` 调用"改为"前置条件表达式调用"，跳过时机、理由文案与 `probeBusinessMenuPath` 探测逻辑均不变；`if (targetPath === null) return` 仅服务 TypeScript narrowing，运行期不可达。产品代码、schema、权限、菜单、i18n 文案、workflow 均未触碰。

## 验证记录

- [x] 后端测试（touched scope）：不适用（无 Go 文件改动）
- [x] 前端构建：`tsc -b` exit 0；`eslint tests/smoke-core/business-generated-basic.spec.ts` 0 findings；`playwright test tests/smoke-core/business-generated-basic.spec.ts --list` 成功枚举 3 tests（spec 编译通过）
- [x] 轻量 smoke：不适用（无 UI / 运行时行为改动；无业务模块时的诚实 skip 语义保持）
- [x] 如涉及系统域深链路，已补充专项 smoke：不适用（仅测试文件，无 authz 运行时）
- [x] 其他专项验证已补充：本地 `node scripts/check-duplication.mjs` PASS（仅剩既有 smoke-core/smoke-full workflow 重复对）；根因假设的最终验证器 = 本 PR 的 SonarCloud PR 维度分析（`api/issues/search?pullRequest=<本PR>&ruleKeys=typescript:S1607` 预期 0），结果创建后回填
- [ ] CodeQL 结果已检查并解释：pending —— PR 创建后执行，通过后回填
- [x] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [ ] GitHub required checks 通过：推送后由分支保护执行，结果回填
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用：记 unavailable（沿用 #343/#344/#345 先例记法）
- [x] 已启用或确认将启用 squash auto-merge：确认将启用——待 required checks 绿后由维护者启用

补充说明：① Release Gate 的 unprocessed check 查询 `branch=main&resolved=false`，2 个 issue 在本 PR 合入前必然使 main 的 Release Gate 为红，属真实红灯的技术处置而非豁免；② Release Gate 的 Open PRs check 在本 PR 开放期间也为红，属该 gate 的设计行为（禁止带未合并 PR 发布），合入后自愈；③ 该 spec line 76 的同款写法在本轮分析未被 flag（疑似 2026-09-10 Sonar 轮次的已解决 issue 按行 hash 迁移所致），本次 3 处一并改为条件式，防止后续窗口复发。

## 审核留痕

- Copilot review：unavailable（沿用 #343 先例记法）
- CodeQL 结果：pending —— PR 创建后执行，通过后回填
- GitHub checks 结果：推送后由分支保护判定；本地证明见验证记录
- Auto-merge：not-enabled（待 checks 绿后由维护者启用，同 #343/#344/#345 先例）
- Duplication Gate 结果：PASS（`node scripts/check-duplication.mjs` 本地执行）
- 是否高风险改动：no —— 仅 1 个前端 smoke spec 文件（3+/3-）；无 `.github/workflows/*`、无 schema、无权限、无认证、无审计链、无删除动作
- Residual risk / follow-up：① hosted Sonar 分析无法本地镜像，根因假设以本 PR 的 PR 维度 issue 查询为准（若仍 >0 则继续收敛写法或转维护者 Sonar 侧处置）；② 本 PR 合入后 main 的 Release Gate 需等下一次 push main 触发才能给出绿灯结论（该 workflow 仅 push main 触发）

## 检查清单

- [x] 已明确本次改动归属：frontend（测试面 smoke spec；无运行时归属）
- [x] 未把认证、IAM、组织、配置等系统域职责混写（零运行时改动）
- [x] 前端新增展示文案已使用 i18n：不适用（skip 理由为既有英文测试内部字符串，非用户可见文案，未新增/修改任何展示文案）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰（未触碰）
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（无此类变更；S1607 根因与 Release Gate 红灯明细记录在本 body 与 #344/#345 evidence）
- [x] 已确认不会泄露敏感配置、账号密码或 Token（diff 仅 1 个测试文件 3+/3-）
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
