## 变更摘要

- 改动层级：platform（CI 工作流与测试执行，不涉及产品运行时代码）
- 改动模块：`frontend/tests/api` 的 TypeScript 测试运行器、`frontend/package.json`、`.github/workflows/ci.yml` 与 L2 交付工件
- 目标问题：既有 `tests/api/*.test.ts` 未进入必过 CI；首轮启用后，浏览器存储测试在 Ubuntu runner 缺少 Playwright Chromium
- 预期影响：所有 API 测试由一个可失败的本地命令执行；CI 仅在执行该测试前显式安装仓库锁定版本的 Chromium，不跳过或弱化浏览器存储断言

## Harness 链路

- Task ID：2026-07-27-ci-api-unit-test-wiring
- Task Manifest：.harness/tasks/2026-07-27-ci-api-unit-test-wiring/manifest.json
- Evidence：.harness/evidence/2026-07-27-ci-api-unit-test-wiring/commands.json
- Verification evidence：.harness/evidence/2026-07-27-ci-api-unit-test-wiring/summary.md
- Review Artifact：.harness/evidence/2026-07-27-ci-api-unit-test-wiring/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：ci-workflow
- Ratchet Decision：gate-updated
- GitHub Signal：repo-quality-gate

## Harness adoption markers

- task id: 2026-07-27-ci-api-unit-test-wiring
- task manifest: .harness/tasks/2026-07-27-ci-api-unit-test-wiring/manifest.json
- evidence: .harness/evidence/2026-07-27-ci-api-unit-test-wiring/commands.json
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

仅修改 `pantheon-base` 的测试执行、CI 配置与治理工件；没有改变 backend、产品运行时、权限、审计、i18n 或 `pantheon-ops`。

## 验证记录

- [x] 后端测试：不涉及 backend 代码
- [x] 前端构建：`cd frontend && npm run build` 通过
- [ ] 轻量 smoke：不涉及产品运行时；浏览器存储断言由 API unit suite 覆盖
- [ ] 如涉及系统域深链路，已补充专项 smoke：不涉及
- [x] 其他专项验证：`npm run test:api:unit`（11 suites / 37 assertions）、`npm run lint`、`npm run type-check`、Prettier、task/evidence/review 严格检查通过
- [x] CodeQL 结果已检查并解释：当前 PR CodeQL check 为成功；不改变生产信任边界
- [x] 如有 open CodeQL alert，已说明是新增问题、既有 baseline、误报还是已补 follow-up：无新增告警
- [x] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [ ] GitHub required checks 通过：首轮 Frontend Unit Tests 发现 Chromium 缺失；已补显式安装，等待新 CI
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用：unavailable
- [ ] 已启用或确认将启用 squash auto-merge：等待全部 required checks 绿

补充说明：CI 安装命令复用 `smoke-full.yml` 与 `quality.yml` 现有的 `./node_modules/.bin/playwright install --with-deps chromium` 模式；不使用 `npx`，不引入新的 action 或工作流权限。

## 审核留痕

- Copilot review：unavailable
- CodeQL 结果：pass（当前 PR check）
- GitHub checks 结果：pending re-run；此前 CI red 的直接原因与修复已记录于 summary
- Auto-merge：not-enabled
- Duplication Gate 结果：pass（当前 PR check）
- 是否高风险改动：是（CI 工作流）；最小修复且需 hosted checks 复核
- Residual risk / follow-up：本机不具备 actionlint 与 Ubuntu Playwright 安装路径；以 hosted `Lint Workflows` 与 `Frontend Unit Tests` 为最终验证

## 检查清单

- [x] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n（本 PR 无新增展示文案）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（本 PR 不涉及）
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
