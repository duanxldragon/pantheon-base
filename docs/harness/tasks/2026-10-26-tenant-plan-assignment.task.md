---
title: 套餐指派面接通：租户表单与筛选器改用库内套餐定义（TENANT_CONTRACT V1.5）
doc_type: Remediation
layer: system/iam
depends_on_layers:
  - system/config
status: Active
linked_contracts:
  - docs/contracts/TENANT_CONTRACT_V1.md
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/harness/VERIFICATION_EVIDENCE_SPEC.md
updated_at: 2026-10-26
---

# Task Packet: 2026-10-26-tenant-plan-assignment

## Goal

V1.4（租户运营信息架构改造）把套餐定义落库与读侧视图做彻底之后，在合同 §9 显式登记了一条残余 gap：
`PlanStore.AssignableCodes` 有实现、有单测，但没有出货调用方——租户表单的套餐下拉仍是四个内置字面值。
运营者新建的自定义 code 能存进 `tenant_plans`、能被总览如实显示，却无法指派给任何租户。

本包接通这条指派面，并把判定规则如实镜像到前端；范围仍是冻结的「读侧与阈值可配、写侧不动」。

无数据库 schema、迁移、路由、权限码、菜单 seed 或错误信封变化。

## Primary Layer

system/iam

改动落在 `backend/modules/system/iam/tenant`（删除从未被调用的 `AssignableCodes`）与
`frontend/src/modules/system/iam/tenant`（新增 `planOptions.ts`、`TenantList.tsx` 改用派生选项）。

## Dependency Layers

- `system/config`：套餐定义读接口 `/system/tenant-ops/plan/list` 是既有只读路由，本包只消费不改语义。
- i18n：五个语言资源新增 `system.tenant.plan.outsideLadder`，明示阶梯外 code 的控制台展示口径。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `permission-policy`
- Portable Failure Class: `dead-policy-surface` / `client-server-rule-drift` / `silent-normalisation`
- Owner Layer: `consumer-repository`
- Ratchet Decision: `sensor-reused`
- Coverage Dimensions:
  - behaviour
  - architecture-fitness

## Contract Anchors

- `docs/contracts/TENANT_CONTRACT_V1.md` §2.4：新增不变量 8——可指派 code 由服务端判定，停用语义失败开放；
  §2.4.1 写侧不校验配额超限的既有语义保持不变；§2.5 规则 6 记录核心指标组选择。
- `docs/contracts/TENANT_CONTRACT_V1.md` §9：把 V1.4 残余 gap 标注为「已由 V1.5 接通」，并保留未闭合部分
  （前端能力阶梯 `core/entitlements/plans.ts`）。
- `docs/contracts/PLATFORM_CONTRACT.md`：平台侧只读列表与租户视图边界。
- `docs/harness/VERIFICATION_EVIDENCE_SPEC.md`：`go test` 的 `ok` 在无 DSN 时会掩盖 SKIP，必须带
  `PANTHEON_TEST_DSN_REQUIRED=1` 重跑才算覆盖证据。

## Scope

### In

- `frontend/src/modules/system/iam/tenant/planOptions.ts`：派生三类选项——写侧可指派
  （`status !== 'disabled'`，读不到时回落内置四档）、读侧筛选（全部已定义 code，含停用）、
  编辑器（可指派集 + 当前租户自己的 code 即使不可指派也保留，避免打开退役套餐就被静默改写）。
- `TenantList.tsx` 的编辑表单与筛选器改用派生选项；`getPlanList` 以 `skipErrorMessage: true` 静默读取。
- 五语言新增 `system.tenant.plan.outsideLadder` 文案。
- 删除后端 `PlanStore.AssignableCodes` 及其单测（按字母排序导致阶梯顺序错、从无出货调用方）。
- 合同 ZH 权威 + EN 镜像同步：§2.4 不变量 8、§9 gap 状态、V1.5 行性质由「澄清」更正为
  「澄清（§2.2）+ 扩展（§2.4 不变量 8）」。

### Out

- 写侧强制：后端仍不因超出配额拒绝任何写入（§2.4.1 不变）。
- 前端能力阶梯动态化（`core/entitlements/plans.ts` 仍硬编码四档，未知 code 关闭到免费版）——继续在 §9 挂账。
- `max_api_keys` / `max_storage_mb` 上总览：本轮冻结的核心指标组为租户+成员+角色+部门，且这两个维度无计量来源。
- 数据库 schema 与迁移、路由、权限码、菜单 seed、错误信封。
- SonarCloud 规则变更、门禁放宽或跳过测试；提交、推送与开 PR（未获要求）。

## Expected Files

### Create

- `frontend/src/modules/system/iam/tenant/planOptions.ts`
- `frontend/tests/unit/modules/system/iam/tenant/planOptions.test.ts`
- `docs/harness/tasks/2026-10-26-tenant-plan-assignment.task.md`
- `.harness/tasks/2026-10-26-tenant-plan-assignment/manifest.json`
- `.harness/evidence/2026-10-26-tenant-plan-assignment/{summary.md,review.md,commands.json}`

### Modify

- `frontend/src/modules/system/iam/tenant/TenantList.tsx`
- `frontend/src/i18n/resources/{zh-CN,en-US,ja-JP,ko-KR,fr-FR}.ts`
- `backend/modules/system/iam/tenant/plan_store.go`（删除 `AssignableCodes`）
- `backend/modules/system/iam/tenant/plan_store_test.go`（删除对应用例）
- `docs/contracts/TENANT_CONTRACT_V1.md` 与 `docs/contracts/TENANT_CONTRACT_V1.en.md`

### Do Not Touch

- `backend/pkg/database/migrations/**`
- `.github/workflows/**`
- 保留夹具库 `pantheon_base_plan_matrix_20261025` 的四个租户与五条套餐行
- `.env.test` 与任何凭据文件

## Implementation Notes

- 顺序不再在前端重排：沿用服务端 `sort ASC, id ASC`，否则会出现「库里的顺序」与「下拉的顺序」两套真相。
- 编辑器选项必须包含当前租户自己的 code，即使它已不可指派；否则打开一个退役套餐的租户再保存，会静默把它改到别的套餐。
- 套餐列表对表单是咨询性的：读不到就回落内置四档并静默处理（`skipErrorMessage: true`），不该为一个下拉弹错。
- 阶梯外的自定义 code 必须明说后果（控制台功能按免费版展示、配额上限仍按该套餐定义生效），而不是隐藏这个事实。
- `AssignableCodes` 属于「死策略面」：留着会诱导第二套判定实现，删除而不是补调用方。
- 本轮为验证指派面确实数据驱动，对 `tenant_plans` id=5 的 `status` 做了两次有界改动并已复原，
  用只读 SQL 复核一致；未触碰任何租户行，未发出任何创建请求。

## Verification Plan

- `cd frontend && node node_modules/vitest/vitest.mjs run tests/unit/modules/system/iam/tenant/planOptions.test.ts`
- `cd frontend && node node_modules/vitest/vitest.mjs run`
- `cd frontend && node node_modules/typescript/bin/tsc -b && node node_modules/eslint/bin/eslint.js src --max-warnings 0`
- `cd backend && go build ./... && go test ./modules/system/i18n/... ./modules/system/iam/tenant/... -count=1`
- `cd backend && set -a; . ../.env.test; set +a; PANTHEON_TEST_DSN_REQUIRED=1 go test ./modules/system/iam/tenant/... -count=1`
  与 `-run TestPlanStore -v` 逐条 PASS/0 SKIP（凭据只注入环境，不打印）
- 契约类静态检查：`check-i18n-hardcode`、`check-menu-contract`、`check-import-path-case`、
  `check-ui-contract`、`check-i18n-generated-scope`、`scripts/audit-i18n-locales.mjs`
- 浏览器实测（真后端 :8080 + 真 Vite :5173 + 保留库）：`/system/tenant` 挂载即发
  `GET /api/v1/system/tenant-ops/plan/list` → 200；下拉为库内定义而非四个字面值；停用了的套餐
  在筛选器可选、在编辑器对现役租户保留。
- 治理检查：`check-task-packet`、`check-evidence --strict`、`check-review --strict`、
  `check-structure-contract --strict`、`check-failure-registry --strict`。

## Linkage

- Task ID: `2026-10-26-tenant-plan-assignment`
- Task Manifest: `.harness/tasks/2026-10-26-tenant-plan-assignment/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/contracts/TENANT_CONTRACT_V1.md`、
  `.harness/evidence/2026-10-25-dual-mode-e2e-smoke/commands.json`
- Evidence Directory: `.harness/evidence/2026-10-26-tenant-plan-assignment/`
- Review File: `.harness/evidence/2026-10-26-tenant-plan-assignment/review.md`

## Evidence Required

- `planOptions.test.ts` 五例与全量 vitest 统计。
- 带 `PANTHEON_TEST_DSN_REQUIRED=1` 的后端重跑输出（说明无 DSN 时的 `ok` 为何不算覆盖证据）。
- 保留库前后只读 SQL 对照（四个租户、五条套餐）。
- 浏览器网络与控制台实测记录（无 PNG 时以 DOM 文本 + 网络日志为证据，并显式登记该缺口）。
- 契约类检查与 i18n 五语对齐统计。
- 敏感信息扫描结果（凭据不打印、不入证据）。

## Human Gates

- 维护者最终功能验收（套餐指派与筛选行为）。
- 保留库 `pantheon_base_plan_matrix_20261025` 及其四个租户的处置由维护者决定，本轮不清理。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
