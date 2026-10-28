---
title: TenantList 认知复杂度整改（S3776 复测与真正修复）
doc_type: Remediation
layer: platform
depends_on_layers: []
status: Active
linked_contracts:
  - docs/harness/AI_QUALITY_GOVERNANCE.md
updated_at: 2026-10-28
---

# Task Packet: 2026-10-28-tenantlist-s3776-followup

## Goal

`2026-10-28-release-gate-green`（PR #463）在合并后仍未清掉 `typescript:S3776`：
`main` 上最新一次分析（revision `1ae6481c`，2026-10-28T14:19Z）仍报
`frontend/src/modules/system/iam/tenant/TenantList.tsx:116` 认知复杂度 16，issue
`AaF89PoZ78TOH8UMk82y` 保持未处理。

根因是当时对规则计数的误判：把五处 `isAdmin || hasPerm('...')` 收敛成 `can(perm)`
并不降低该函数的分值——用与 SonarCloud 同一套 `sonarjs/cognitive-complexity` 规则在
本地复测，改前后都是 16。真正的贡献项是组件体内联的四态分支链与 JSX 三元表达式。

本包把四态分支链（compat 引导 / 首屏加载 / 请求失败 / 表格）提取为组件内的
`renderBody()`，本地同规则复测 **16 → 10**，并在为规则阈值调到 4 时确认新函数为 5，
两者都在 15 以内且留有余量。

## Primary Layer

platform

## Dependency Layers

- `platform`（单个前端列表页的渲染函数拆分）。不改接口、路由、权限、i18n key、
  样式类名或渲染结果。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `none`
- Release Requirement: `none`
- Downstream Sync Note: 纯前端等价重写，消费方无需动作。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `ui-runtime`
- Portable Failure Class: `unverified-static-analysis-fix`
- Owner Layer: `foundation-source`
- Ratchet Decision: `guide-updated`
- Coverage Dimensions:
  - maintainability
  - runtime-quality

交付层级：**L1**（单文件等价重写，验证集合固定）。

## Contract Anchors

- `docs/harness/AI_QUALITY_GOVERNANCE.md`：质量门禁与“修复需可验证”的要求。
- `.harness/evidence/2026-10-28-release-gate-green/review.md`：本包修正的结论来源。

## Scope

### In

- `frontend/src/modules/system/iam/tenant/TenantList.tsx`：把 `bodyContent` 的
  if/else-if 链改写为组件内 `renderBody()` 函数，JSX 侧由 `{bodyContent}` 改为
  `{renderBody()}`
- `docs/harness/AI_QUALITY_GOVERNANCE.md` §5.2：新增“静态分析类修复必须用同一规则
  复测并记录改前/改后读数”的规则（本包的 ratchet 产物）
- `docs/harness/failure-registry.md`：新增 `FR-018`（`unverified-static-analysis-fix`
  这一类失败的登记与处置结论）
- `.harness/STATUS.md`：在“主干 Release Gate 转绿”段落追加勘误，说明 #463 对
  `TenantList.tsx` 的结论已被复测推翻并指向本包
- 本包任务包、manifest 与证据四件

### Out

- 不改 `can(perm)`（#463 已合入，属等价去重，保留）
- 不改任何可见行为：四态判定条件、返回元素、类名、文案 key、`onRetry` 行为逐条不变
- 不引入 `eslint-plugin-sonarjs` 等新依赖或新门禁脚本（本地复测在仓库外的临时目录完成）
- 不改后端、workflow、Sonar 配置

## Expected Files

### Create

- `docs/harness/tasks/2026-10-28-tenantlist-s3776-followup.task.md`
- `.harness/tasks/2026-10-28-tenantlist-s3776-followup/manifest.json`
- `.harness/evidence/2026-10-28-tenantlist-s3776-followup/commands.json`
- `.harness/evidence/2026-10-28-tenantlist-s3776-followup/summary.md`
- `.harness/evidence/2026-10-28-tenantlist-s3776-followup/review.md`
- `.harness/evidence/2026-10-28-tenantlist-s3776-followup/pr-body.md`

### Modify

- `frontend/src/modules/system/iam/tenant/TenantList.tsx`
- `docs/harness/AI_QUALITY_GOVERNANCE.md`
- `docs/harness/failure-registry.md`
- `.harness/STATUS.md`

### Do Not Touch

- `backend/**`、`.github/workflows/*`、`sonar-project.properties`
- `frontend/package.json`、`package-lock.json`（不新增依赖）
- 其他前端文件

## Implementation Notes

- 提取的是组件内嵌套箭头 `renderBody`，不是模块级组件：它直接闭包 `tenantModeEnabled`、
  `loading`、`error`、`tableData`、`t`、`navigate`、`loadData`、`query`、`tableContent`，
  无需新增 props 类型或 i18n 类型导入。
- 行为等价性用“逐分支对照”验证：四种状态的条件表达式、返回的元素、`onRetry` 的
  `void loadData(query)`、compat 引导的 `navigate('/system/setting/platform')` 均原样保留。
- 复杂度用与 SonarCloud 同源的 `eslint-plugin-sonarjs@3` 的
  `sonarjs/cognitive-complexity` 规则在临时目录（`/d/tmp/sonarcheck`，仓库外）复测：
  改前 16（`116:33`），改后无 finding；把阈值降到 4 时读数组件 10、`renderBody` 5。
- 该插件未加入仓库依赖：门禁仍是 SonarCloud，本地复测只是提交前的自检手段。

## Verification Plan

- `npx eslint --no-config-lookup -c eslint.config.mjs TenantList.tsx`（临时目录，阈值 15）
  → 改前 1 error（16），改后 0
- 阈值 4 复测 → 组件 10、`renderBody` 5（暴露真实分值）
- `cd frontend && npm run lint`、`npm run type-check`、`npm run build` → 全过
- `node scripts/harness/check-evidence.mjs --strict`、`check-review.mjs --strict` → exit 0
- `npm run check:task-packet`、`check:structure`、`check:harness-encoding`、
  `check:docs-frontmatter`、`check:ui-quality-gate` → 0 findings
- `node scripts/harness/check-failure-registry.mjs --strict` → 0 findings
- `npm run check:docs-links` / `check:doc-inventory` → 0 findings
- CI `PR Smoke Modules`（含租户控制台用例）作为运行态证据

## Linkage

- Task ID: `2026-10-28-tenantlist-s3776-followup`
- Task Manifest: `.harness/tasks/2026-10-28-tenantlist-s3776-followup/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/harness/AI_QUALITY_GOVERNANCE.md`、
  `.harness/evidence/2026-10-28-release-gate-green/review.md`
- Evidence Directory: `.harness/evidence/2026-10-28-tenantlist-s3776-followup/`
- Review File: `.harness/evidence/2026-10-28-tenantlist-s3776-followup/review.md`

## Evidence Required

- 同规则本地复测的改前/改后读数（含阈值 4 的真实分值）
- 前端 lint / type-check / build 读数
- SonarCloud 上 `main` 仍余 1 条的实测读数与本包的关系说明
- 治理门禁读数

## Human Gates

- 无。属门禁红灯的既有整改继续，规则与阈值均未变。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] 同规则本地复测：组件 16 → 10，新函数 5
- [x] 四态渲染逐条等价
- [x] 未新增依赖、未改门禁
