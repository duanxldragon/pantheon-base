## 变更摘要

- 改动层级：platform / system/auth / system/iam / system/org / system/config；共享底座先修，Ops后续消费正式release
- 改动模块：认证会话、SSRF、系统路由/数据范围、跨页候选、lowcode生成器、运行证据及安全门禁
- 目标问题：完成当前Base功能收尾：防止DNS校验与拨号脱节、刷新token重复消费及旧会话写回；补齐系统候选分页和生成表单CRUD契约
- 预期影响：保留租户V1；角色/岗位分页稳定；必填布尔false可创建；出站多地址回退有预算；扫描失败和运行证据缺口保持可见

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

- task id: 2026-11-05-base-freeze-release
- task manifest: .harness/tasks/2026-11-05-base-freeze-release/manifest.json
- evidence: .harness/evidence/2026-11-05-base-freeze-release/commands.json
- boundaries: Base owns shared platform/system; Ops owns business overlay
- backend response contract: docs/contracts/PLATFORM_CONTRACT.md
- backend DTO contract: docs/contracts/SYSTEM_AUTH_CONTRACT.md
- permission contract: docs/contracts/SYSTEM_IAM_CONTRACT.md
- audit coverage: auth/session race and mode-change/tenant runtime smoke
- visual evidence: .harness/evidence/2026-11-05-base-freeze-release/functionality-matrix.md (1440x900/390px; create/edit recovery; no layout changes in final DTO fix)
- inheritance contract: docs/WORKSPACE_INHERITANCE.md
- base drift: Last official v0.18.2; v0.18.3 pending Release Gate
- Base/ops inheritance: Official release only; Ops unpublished host migration renumbered to000032 with overlay/regression proof

## 边界说明

- [ ] 本次改动仅涉及单一层级
- [x] 本次改动涉及跨层，已说明边界与依赖

Base共享安全与生成器负责公共契约，系统域保留认证/IAM/组织隔离，平台只聚合展示。接口、权限、审计与运行i18n的同步回归在任务证据中；Ops业务源码通过正式release后再装配。Base迁移000031涉及删旧表，生产操作遵守专门runbook。

## 验证记录

- [x] 后端测试：`go test ./...`
- [x] 前端构建：`cd frontend && npm run build`
- [ ] L0 静态契约：`cd frontend && npm run test:smoke:l0`
- [ ] L1 关键路径 smoke（PR 必过）：`cd frontend && npm run test:smoke:l1`
- [ ] L2 命中模块 smoke（PR 按改动路径自动选择，也可本地手跑）：`cd frontend && npm run test:smoke:module:<iam|config|i18n|audit|org|platform|all>`
- [ ] 如涉及系统域深链路，已补充专项 smoke：`cd frontend && npm run test:smoke:system:iam-authz`
- [x] 其他专项验证已补充
- [x] CodeQL 结果已检查并解释
- [ ] 如有 open CodeQL alert，已说明是新增问题、既有 baseline、误报还是已补 follow-up
- [x] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [ ] GitHub required checks 通过
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用
- [ ] 已启用或确认将启用 squash auto-merge

补充说明：

- 新增缺陷回归均有修复前失败/修复后通过；前端lint/type-check/build与218单测、生成器17项及完整generator smoke、根脚本与14治理检查通过。
- 最终两路独立评审APPROVE/CLEAR，12个源文件指纹一致；SSRF全包race通过。全量Go race：1889通过测试节点/0失败/1真实S3 skip，47个有测试包通过。
- 已有tenant16+viewpoint5、core27/3生成模块skip、系统域119、platform97及五套生成业务smoke；真实生成模块浏览器/API CRUD补足生成模块运行证据。旧候选与本轮命令范围在summary中区分。

## 审核留痕

- Copilot review：unavailable; independent gpt-6-astra code-reviewer and architect reports collected (APPROVE/CLEAR)
- CodeQL 结果：GitHub open alerts=0; previous candidate checks passed; final commit checks pending
- GitHub checks 结果：Previous 1a7b388b:27 SUCCESS/2 conditional SKIPPED. This final source commit requires its own CI.
- Auto-merge：not-enabled
- Duplication Gate 结果：Previous candidate passed; final commit pending
- 是否高风险改动：yes — auth/IAM/shared packages/generator/workflows
- Residual risk / follow-up：Real S3 provider unconfigured (1 skip); npm dev-chain15 moderate; exact-commit CI, main Release Gate/Full Smoke, release checksums and official Ops rebuild still required. No production DDL authorization.

## 检查清单

- [x] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
