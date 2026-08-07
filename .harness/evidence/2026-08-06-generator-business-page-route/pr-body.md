## 变更摘要

- 改动层级：`platform/lowcode -> generated business/*`
- 改动模块：`lowcode generator`、`dynamicmodule`、`foundation release`
- 目标问题：生成业务页面错误漂移到 `/operations/*`，且 foundation release 漏发服务端导出脚本与共享 smoke 契约
- 预期影响：生成业务页面、菜单和摘要统一使用 `/business/*`；API 继续使用 `/api/v1/business/*`；Ops 可通过不可变 release 获得 exporter tooling 和与共享系统 UI 同版本的 smoke 契约

## Harness 链路

- Task ID：`2026-08-06-generator-business-page-route`
- Task Manifest：`.harness/tasks/2026-08-06-generator-business-page-route/manifest.json`
- Evidence：`.harness/evidence/2026-08-06-generator-business-page-route/commands.json`
- Verification evidence：`.harness/evidence/2026-08-06-generator-business-page-route/summary.md`
- Review Artifact：`.harness/evidence/2026-08-06-generator-business-page-route/review.md`
- OpenSpec change：`none`
- Trivial change：`no`
- Quality Profile：`generator`
- Ratchet Decision：`adapter-updated`
- GitHub Signal：`repo-quality-gate`

## Harness adoption markers

- task id: `2026-08-06-generator-business-page-route`
- task manifest: `.harness/tasks/2026-08-06-generator-business-page-route/manifest.json`
- evidence: `.harness/evidence/2026-08-06-generator-business-page-route/`
- boundaries: `Base owns generator and release producer; Ops owns only the exact consumer allowlist adapter`
- backend response contract: `generated summary routePath uses /business/*`
- backend DTO contract: `unchanged`
- permission contract: `generated business:* prefix unchanged`
- audit coverage: `unchanged`
- visual evidence: `five real Playwright business generation flows passed under /business/*`
- inheritance contract: `release includes exporter and transpiler; Ops exact allowlist and roundtrip tests updated`
- base drift: `not-applicable for producer`
- Base/ops inheritance: `consumer dry-run/apply/rollback/missing/drift/aligned tests pass`

## 边界说明

- [ ] 本次改动仅涉及单一层级
- [x] 本次改动涉及跨层，已说明边界与依赖

生成器实现继续位于 `modules/lowcode/generator`，只改变其业务输出合同。生成源码仍在 `modules/business/*`；手工 `/operations/*` 页面和业务 API 均不迁移。Base release producer 精确分发两个运行时工具以及 system/shell smoke 的最小闭包，Ops consumer 仍采用显式 allowlist，不扩大到业务 smoke 或整个测试目录。

## 验证记录

- [x] Go race、generator smoke、foundation release tests
- [x] Frontend lint、type-check、build
- [x] 五套真实 business generation smoke 全部通过
- [x] Ops consumer 23/23 与 sync 3/3 测试通过
- [x] Foundation producer 15/15 测试通过，cut 测试确认共享 system smoke 进入 bundle
- [x] Go vuln、root npm audit、brace-expansion 修复
- [x] CodeGraph 与 Harness 本地门禁
- [ ] GitHub required checks：PR 创建后验证
- [ ] 不可变 release 与 Ops 实际消费：合并后验证

安全说明：React Router `7.18.2` 当前唯一 high advisory 只影响未启用的 RSC action/server action 路径；不存在 patched stable release。已实际测试 `7.11.0`，但它重新引入多项 XSS、开放重定向和 DoS，因此不采用安全倒退。

## 审核留痕

- Copilot review：`automatic-policy`
- CodeQL 结果：`pending hosted checks`
- GitHub checks 结果：`pending hosted checks`
- Auto-merge：`not-enabled`
- Duplication Gate 结果：`1.84% / 3.00% PASS`
- 是否高风险改动：`yes，generator/dynamic module/foundation inheritance`
- Residual risk / follow-up：`v0.10.3 Ops hosted smoke 证明源代码已同步但 smoke 契约未随 release 分发；本 PR 通过下一 patch release 关闭该缺口`

## 检查清单

- [x] 生成页面路由、菜单、摘要、父菜单统一 `/business/*`
- [x] 生成 API 仍为 `/api/v1/business/*`
- [x] 未迁移手工 `/operations/*` 页面
- [x] exporter tooling 由 Base 发布、Ops 精确消费
- [x] system/shell smoke 契约与所需 helper 由 Base patch release 精确分发
- [x] 未新增依赖或数据库变更
- [x] 未泄露敏感配置、账号密码或 Token
