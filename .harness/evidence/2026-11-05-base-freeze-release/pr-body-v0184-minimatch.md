## 变更摘要

- 改动层级：frontend 共享底座依赖 posture（platform 工具链），不涉及 system/* 后端域
- 改动模块：frontend/package.json overrides、frontend/package-lock.json、VERSION、harness 证据文件
- 目标问题：修复 Dependabot alert #52（GHSA-g3hv-75wg-m249，minimatch >=7.0.0 <11.0.1 路径穿越），并把 VERSION 升至 0.18.4 作为安全发行候选
- 预期影响：所有 minimatch 实例统一解析到 11.0.1；dev 工具链（test-exclude/glob/istanbul）行为不变；生产构建与单测无回归；Ops 可随后从官方 v0.18.4 release 消费

## Harness 链路

- Task ID：2026-11-05-base-freeze-release
- Task Manifest：.harness/tasks/2026-11-05-base-freeze-release/manifest.json
- Evidence：.harness/evidence/2026-11-05-base-freeze-release/commands.json
- Verification evidence：.harness/evidence/2026-11-05-base-freeze-release/summary.md
- v0184 安装验证明细：.harness/evidence/2026-11-05-base-freeze-release/2026-11-06-v0184-security-validation.json
- Review Artifact：.harness/evidence/2026-11-05-base-freeze-release/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：auth-security
- Ratchet Decision：no-repeat-observed
- GitHub Signal：repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-11-05-base-freeze-release
- task manifest: .harness/tasks/2026-11-05-base-freeze-release/manifest.json
- evidence: .harness/evidence/2026-11-05-base-freeze-release/commands.json
- boundaries: Base owns shared platform/system; Ops owns business overlay
- backend response contract: none-touched
- backend DTO contract: none-touched
- permission contract: none-touched
- audit coverage: dependency posture only; no runtime auth/audit chain change
- visual evidence: none-touched (no UI change)
- inheritance contract: docs/WORKSPACE_INHERITANCE.md
- base drift: Last official v0.18.3; v0.18.4 candidate in this PR
- Base/ops inheritance: Ops consumes only after official v0.18.4 release

## 边界说明

- [ ] 本次改动仅涉及单一层级
- [x] 本次改动涉及跨层，已说明边界与依赖

改动仅落在 frontend 依赖 override、lockfile、VERSION 与 harness 证据；不触碰后端、接口、权限、i18n、菜单与生成器。Ops 侧升级等待本 PR 合并并发布正式 v0.18.4 后按其消费流程执行。

## 验证记录

- [ ] 后端测试：`go test ./...`（未触碰后端，不适用）
- [x] 前端构建：`cd frontend && npm run build`（prebuild 契约检查 + tsc -b + vite build 通过）
- [x] 前端单测：`cd frontend && npm run test:unit`（33 文件 / 218 用例全通过）
- [x] 安全依赖门禁：`cd frontend && npm audit --registry=https://registry.npmjs.org --audit-level=high`（exit 0；minimatch 告警消除；残余 5 项 moderate 为既有 glob 链告警，见遗留风险）
- [x] 锁定验证：`npm install` + `npm ls minimatch`（override 写入 package-lock，全部实例解析为 11.0.1）
- [x] 文档治理：`node scripts/frontmatter-check.mjs`（462 篇通过）
- [ ] GitHub required checks 通过（本 PR CI 待跑）
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用
- [x] CodeQL 结果已检查并解释（无代码路径变更，依赖 override 不涉及 Go/JS 源码）
- [x] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁

## 审核留痕

- Copilot review：solo 维护仓库；独立评审读数记录在 steering 证据（历史两路 APPROVE/CLEAR 仅覆盖 0.18.3 候选，本轮依赖改动以 audit/build/test 证据支撑）
- CodeQL 结果：GitHub open alerts=0；本 PR 不改源码，仅依赖解析变化
- GitHub checks 结果：本 PR 提交后以自身 CI 读数为准
- Auto-merge：squash + required checks 通过后启用
- Duplication Gate 结果：仅 lockfile/override/VERSION 变化，无新增源码重复
- 是否高风险改动：yes — dependency posture；缓解面为 dev 工具链限定范围 override（`minimatch@>=7.0.0 <11.0.1`），生产 bundle 不含 minimatch
- Residual risk / follow-up：glob 链 5 项 moderate 告警需 nyc 破坏性升级，另行处理；v0.18.4 正式发布与 Ops 消费在本 PR 合并后执行

## 检查清单

- [x] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n（无新增文案）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰（未触碰）
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（未涉及）
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
