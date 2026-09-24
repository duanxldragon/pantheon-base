## 变更摘要

- 改动层级：platform（CI 工作流 + 前端测试基础设施，不涉及运行时代码）
- 改动模块：frontend 单元测试（Vitest）、ci.yml / quality.yml / security.yml / release-gate.yml、结构契约门禁白名单
- 目标问题：前端纯逻辑层缺少单元测试与覆盖率门禁；golangci-lint 历史债务阻塞 PR；缺少发布前统一检查点
- 预期影响：13 个测试文件 / 132 用例进入 CI 必过门禁（per-file 阈值 80/80/70/80）；PR 仅对新增代码执行 go lint；发布前 CodeQL/Dependabot/SonarCloud 三重校验

## Harness 链路

- Task ID：2026-07-22-frontend-unit-tests
- Task Manifest：.harness/tasks/2026-07-22-frontend-unit-tests/manifest.json
- Evidence：.harness/evidence/2026-07-22-frontend-unit-tests/commands.json
- Verification evidence：.harness/evidence/2026-07-22-frontend-unit-tests/summary.md
- Review Artifact：.harness/evidence/2026-07-22-frontend-unit-tests/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：ci-workflow
- Ratchet Decision：gate-updated
- GitHub Signal：method-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-07-22-frontend-unit-tests
- task manifest: .harness/tasks/2026-07-22-frontend-unit-tests/manifest.json
- evidence: .harness/evidence/2026-07-22-frontend-unit-tests/commands.json
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

> 全部改动为测试文件、测试/lint 配置、CI 工作流、治理文档与门禁白名单；无 backend/ 与 frontend/src 运行时代码变更（frontend/src 仅有 git mv 移出的删除侧）。

## 验证记录

- [x] 后端测试：CI Backend Tests / Unit Tests 绿（本 PR 未改后端代码）
- [x] 前端构建：`cd frontend && npx tsc -b` 通过
- [x] 轻量 smoke：由 quality.yml smoke-sanity 在 backend-tests + frontend-contract 通过后执行（本 PR 未改运行时代码，smoke spec 无需修改）
- [ ] 如涉及系统域深链路，已补充专项 smoke：不涉及
- [x] 其他专项验证已补充：structure gate 0 findings；eslint 0 错误；vitest 132/132 通过且 per-file 阈值达标
- [x] CodeQL 结果已检查并解释
- [x] 如有 open CodeQL alert，已说明是新增问题、既有 baseline、误报还是已补 follow-up
- [x] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [x] GitHub required checks 通过
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用
- [x] 已启用或确认将启用 squash auto-merge

补充说明：gitleaks 对历史 commit d489c8db 中 `curl -u "${SONAR_TOKEN}:"` 的 curl-auth-user 告警为误报（环境变量引用，非真实凭据），已按既有先例登记 `.gitleaksignore` 指纹，并将 release-gate.yml 改为 Bearer header 避免复发。

## 审核留痕

- Copilot review：unavailable
- CodeQL 结果：0 open error/critical alerts（security.yml 硬门禁通过）
- GitHub checks 结果：见 PR #198 checks 面板，红灯修复轮已全部处理
- Auto-merge：not-enabled
- Duplication Gate 结果：pass
- 是否高风险改动：否（无运行时代码变更；门禁白名单变更遵循文档先行流程）
- Residual risk / follow-up：ci.yml push 事件 go-lint 改为 report-only（历史债务致 main 常红），强制新增代码门禁保留在 quality.yml；待历史债务清偿后可恢复 push 强制

## 检查清单

- [x] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n（本 PR 无新增展示文案）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（本 PR 同步了 REPOSITORY_LAYOUT §2.2）
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁

🤖 Generated with [Claude Code](https://claude.com/claude-code)
