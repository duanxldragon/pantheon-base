## 变更摘要

- 改动层级：`platform/foundation release producer`
- 改动模块：`foundation release manifest`、`release bundle regression tests`
- 目标问题：v0.10.4 分发了共享 `run-smoke-suite.mjs`，但遗漏匹配的 runner 测试和三个直接 fixture，导致 Ops 消费者保留陈旧测试合同
- 预期影响：下一个 foundation patch release 精确分发 runner 测试及 `bind-ready-server`、`fake-playwright-cli`、`record-cleanup` 三个 fixture；不改变产品运行时代码或 UI

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
- boundaries: `Base owns the shared smoke release closure; Ops owns the exact consumer allowlist adapter`
- backend response contract: `unchanged`
- backend DTO contract: `unchanged`
- permission contract: `unchanged`
- audit coverage: `unchanged`
- visual evidence: `unchanged runtime/UI; inherited smoke contracts remain covered by existing hosted evidence`
- inheritance contract: `release and Ops allowlist include the runner test plus three direct fixtures`
- base drift: `not-applicable for producer`
- Base/ops inheritance: `consumer dry-run/apply/rollback/missing/drift/aligned tests pass`

## 边界说明

- [ ] 本次改动仅涉及单一层级
- [x] 本次改动涉及跨层，已说明边界与依赖

共享 smoke runner 由 Base 负责发布；Ops 只扩展显式 tooling allowlist，不扩大到业务 smoke 或整个测试目录。该修复不涉及生成器、业务路由、API、权限、菜单、i18n、数据库或产品 UI。

## 验证记录

- [x] Base foundation producer focused 6/6 与 full 15/15 测试通过
- [x] Base frontend smoke scripts 19/19、lint、type-check、build 通过
- [x] Base Go `go test -race ./...` 通过（`D:\msys64\mingw64\bin` + `CGO_ENABLED=1`）
- [x] Ops consumer/sync allowlist 26/26 测试通过
- [x] cut 测试确认 runner test 和三个 fixture 全部进入 bundle
- [x] CodeGraph、Harness 与 whitespace 本地门禁通过
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
- Residual risk / follow-up：`PR merge 后发布 pantheon-base-v0.10.5，并由 Ops 消费、运行 hosted smoke；无产品 runtime/UI 变更`

## 检查清单

- [x] shared runner test 由 Base manifest 分发
- [x] 三个 runner fixture 由 Base manifest 分发
- [x] Ops exact allowlist、consumer 和 sync tests 已同步
- [x] 未新增依赖或数据库变更
- [x] 未泄露敏感配置、账号密码或 Token
