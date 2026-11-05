## 变更摘要

- 改动层级：platform / system/auth / system/iam / system/org / system/config
- 改动模块：refresh/session, SSRF, tenant V1, data-scope/pagination, generator, CI/Harness
- 目标问题：Complete approved Nov3/4 repairs and verify existing Base functions including tenant V1; prepare unpublished v0.18.3 candidate
- 预期影响：Reject refresh replay/revocation races; dial verified DNS IPs; preserve npm audit errors; complete paged candidates; correct tenant guides

## Harness 链路

- Task ID：2026-11-05-base-freeze-release
- Task Manifest：.harness/tasks/2026-11-05-base-freeze-release/manifest.json
- Evidence：.harness/evidence/2026-11-05-base-freeze-release/commands.json
- Verification evidence：.harness/evidence/2026-11-05-base-freeze-release/summary.md
- Review Artifact：.harness/evidence/2026-11-05-base-freeze-release/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：auth-security
- Ratchet Decision：sensor-added
- GitHub Signal：runtime-evidence-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id：2026-11-05-base-freeze-release
- task manifest：.harness/tasks/2026-11-05-base-freeze-release/manifest.json
- evidence：.harness/evidence/2026-11-05-base-freeze-release/commands.json
- boundaries：Base owns shared platform/system; Ops consumes official foundation release through overlay
- backend response contract：docs/contracts/PLATFORM_CONTRACT.md
- backend DTO contract：docs/contracts/SYSTEM_AUTH_CONTRACT.md
- permission contract：docs/contracts/SYSTEM_IAM_CONTRACT.md
- audit coverage：Mode-change API and tenant/core smoke exercised audit routes; full race covered audit packages
- visual evidence：.harness/evidence/2026-11-05-base-freeze-release/functionality-matrix.md (tenant console rendered; platform/system evidence collecting)
- inheritance contract：docs/WORKSPACE_INHERITANCE.md
- base drift：Ops locked to published v0.18.2; candidate v0.18.3 unpublished
- Base/ops inheritance：Official release upgrade pending; reconcile Base000031 and isolated Ops-fix000031 through overlay

## 边界说明

- [ ] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

> 如果跨层，请补充说明：

- 后端：完整隔离 MySQL/Redis `go test -race ./...` 1876 测试节点通过 / 0 失败 / 1 个真实 S3 未配置 skip；`go build ./...` / `go vet` exit 0。
- 前端：lint / type-check / build 通过，33 文件 218 单测通过；platform-smoke 97 passed（另 77 passed 重跑，exit 0）。
- 生成闭环：generated / database-import / master-detail / many-to-many / auto-recycle 五套各 1 passed（exit 0）；生成模块重启后 API CRUD 与真实浏览器 CRUD（校验/创建/编辑失败恢复/删除/390px）通过。
- 依赖扫描：`govulncheck ./...` No vulnerabilities found（0 影响代码）；`npm audit` 15 moderate / 0 high / 0 critical，全部位于 eslint、nyc、istanbul、typescript-eslint 开发链，非零退出保留。
- 治理：check-evidence / check-review / check-runtime-evidence / check-task-packet / check-doc-links / check-doc-frontmatter 全部 exit 0。本次为什么跨层、各层分别承担什么职责、是否影响菜单/权限/i18n/审计。

## 验证记录

- [ ] 后端测试：`go test ./...`
- [ ] 前端构建：`cd frontend && npm run build`
- [ ] L0 静态契约：`cd frontend && npm run test:smoke:l0`
- [ ] L1 关键路径 smoke（PR 必过）：`cd frontend && npm run test:smoke:l1`
- [ ] L2 命中模块 smoke（PR 按改动路径自动选择，也可本地手跑）：`cd frontend && npm run test:smoke:module:<iam|config|i18n|audit|org|platform|all>`
- [ ] 如涉及系统域深链路，已补充专项 smoke：`cd frontend && npm run test:smoke:system:iam-authz`
- [ ] 其他专项验证已补充
- [ ] CodeQL 结果已检查并解释
- [ ] 如有 open CodeQL alert，已说明是新增问题、既有 baseline、误报还是已补 follow-up
- [ ] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [ ] GitHub required checks 通过
- [ ] Copilot review 已请求，或已说明当前仓库/账号不可用
- [ ] 已启用或确认将启用 squash auto-merge

补充说明：

## 审核留痕

- Copilot review：unavailable — GitHub connection denied
- CodeQL 结果：unavailable — hosted scan unreachable
- GitHub checks 结果：not collected — no hosted CI success claimed
- Auto-merge：not-enabled
- Duplication Gate 结果：not collected — hosted gate pending
- 是否高风险改动：yes — auth/IAM/shared packages/generator/security workflow
- Residual risk / follow-up：Independent reviewer and architect both model-service503; real S3 provider unconfigured; npm dev-chain moderates not upgraded. Hosted CI/CodeQL pending this PR; not merge-ready before them.

## 检查清单

- [ ] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [ ] 未把认证、IAM、组织、配置等系统域职责混写
- [ ] 前端新增展示文案已使用 i18n
- [ ] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [ ] 涉及数据库/权限/菜单/接口变更时，文档已同步
- [ ] 已确认不会泄露敏感配置、账号密码或 Token
- [ ] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁

Candidate evidence: complete Go race 1876 passed test nodes / one unconfigured real-S3 skip; frontend 33 files/218 tests passed; tenant16+viewpoint5 passed; core27 pass/3 generated-business skips (covered separately by real generated-module browser and post-restart API CRUD); five business generator smoke suites passed; platform smoke 97 passed. Unchecked checklist items remain pending; no hosted CI/merge/release/consumer success is claimed.
