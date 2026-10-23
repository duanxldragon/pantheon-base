## 变更摘要

- 改动层级：platform（发布工具链、前端烟测、治理文档）；唯一后端改动是删除 `GetTenantByID` 的重复注释，无行为变化
- 改动模块：`scripts/foundation-release/{check-release-secrets,publish-foundation-release}.mjs`、`tests/scripts/foundation-release/check-release-secrets.test.mjs`、`frontend/tests/smoke-core/auth-tenant-picker.spec.ts`、租户服务注释、证据包与失败登记表
- 目标问题：v0.17.2 发布后复核发现 5 项遗留（R-1…R-5）。最重的一项是：发布凭据门禁只扫描了 `bundle/`，而 v0.17.0 的凭据残留位于只随 `repo.tar` 分发的 tracked 证据文件里——门禁对真正会携带残留的资产是盲的
- 预期影响：门禁同时扫描 `bundle/` 与 `repo.tar`，`repo.tar` 缺失时失败关闭，并新增回归用例钉住 `.harness/archive` 路径。已发布资产保持不可变；该门禁从下一次发布起生效。证据中与代码不符的表述以勘误方式修正，不静默改写历史结论

## Harness 链路

- Task ID：2026-10-23-residual-closeout
- Task Manifest：.harness/tasks/2026-10-23-residual-closeout/manifest.json
- Evidence：.harness/evidence/2026-10-23-residual-closeout/commands.json
- Verification evidence：.harness/evidence/2026-10-23-residual-closeout/summary.md
- Review Artifact：.harness/evidence/2026-10-23-residual-closeout/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：permission-policy
- Ratchet Decision：gate-updated
- GitHub Signal：repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-10-23-residual-closeout
- task manifest: .harness/tasks/2026-10-23-residual-closeout/manifest.json
- evidence: .harness/evidence/2026-10-23-residual-closeout/
- boundaries: platform release tooling and test evidence; the backend edit removes a duplicated comment line and changes no behaviour
- backend response contract: unchanged
- backend DTO contract: unchanged
- permission contract: unchanged
- audit coverage: unchanged
- visual evidence: none required — no UI change; the Playwright edit only stabilizes a measurement after Arco finishes positioning its popup
- inheritance contract: sharedPaths unchanged; no new foundation release is cut by this PR
- base drift: branch cut from main b13fbf33; no competing branch
- Base/ops inheritance: no consumer-facing interface, asset or route changed

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

> 门禁与测试属 platform 发布工具链；后端只有注释删除，未触碰租户行为、合同或 schema。

## 验证记录

- [x] `npm run test:foundation-release` → 57/57（含凭据扫描 12 例：repo.tar 残留、干净 repo.tar、缺失即失败关闭）
- [x] `node scripts/foundation-release/check-release-secrets.mjs --release-version pantheon-base-v0.17.2` → clean，3079 文件（bundle 768 + repo.tar 2311）
- [x] `npm run check:docs-frontmatter && npm run check:task-packet && npm run check:structure && npm run check:generated && node scripts/harness/check-failure-registry.mjs` → 全部通过
- [x] `cd frontend && npm run lint && npm run type-check && npm run build` → 通过
- [x] `npx playwright test tests/smoke-core/auth-tenant-picker.spec.ts --workers=1` → 3/3
- [x] `cd backend && gofmt -l modules/system/iam/tenant/tenant_service.go && go build ./modules/system/iam/tenant/ && go vet ./modules/system/iam/tenant/` → 通过（仅注释变化，沿用上一轮真库与 race 结果）
- [ ] CodeQL 结果已检查并解释：交由 CI
- [ ] GitHub required checks 通过：待 CI
- [ ] Copilot review 已请求：待提交后请求
- [ ] 已启用或确认将启用 squash auto-merge：待 CI 转绿后启用

## 审核留痕

- Copilot review：requested
- CodeQL 结果：待 CI
- GitHub checks 结果：待 CI
- Auto-merge：not-enabled（待 required checks 绿）
- Duplication Gate 结果：未本地执行；本轮无新增生产逻辑
- 是否高风险改动：中（发布门禁范围扩大）；已用真实 v0.17.2 产物与合成残留双路径验证
- Residual risk / follow-up：规则仍刻意收窄为三种形态；`repo.tar` 解包依赖系统 `tar`，缺失时失败关闭而不是报告干净

## 检查清单

- [x] 已明确本次改动归属 `platform`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 已确认不会泄露敏感配置、账号密码或 Token（门禁报告对命中值脱敏；测试夹具使用合成值）
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
