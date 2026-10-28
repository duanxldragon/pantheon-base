---
title: W7 选项 A 实现跟进任务包（outsideLadder 后果句 + 合同 §2.4 能力矩阵边界）
doc_type: Remediation
layer: system/iam
depends_on_layers: []
status: Active
linked_contracts:
  - docs/contracts/TENANT_CONTRACT_V1.md
  - docs/reviews/TENANT_PLAN_LADDER_DECISION_2026-10-28.md
updated_at: 2026-10-28
---

# Task Packet: 2026-10-28-plan-ladder-option-a-impl

## Goal

落地已签字的 W7 决策 A（`docs/reviews/TENANT_PLAN_LADDER_DECISION_2026-10-28.md` §0「落地」段）中
留给独立小 PR 的实现部分：TC-07 的操作员可感知后果告知。

决策文档 §2 选项 A 列了三件事：① `outsideLadder` 警告补「lowcode 门控面不可见」后果句（五语言）；
② 契约如实写明能力矩阵边界；③ 确认 `TenantPlanMatrix` 对自定义 code 如实渲染 `free` 档。
①② 是本包的 diff；③ 经核实现状即满足（`TenantList.tsx:272` 已把 `normalizeTenantPlan` 的归一值
传给矩阵，custom code 高亮 free 列），只记录不改动。

背景勘误（随本包记录，不改决策文档）：决策文档 §1 称警告「只说不在阶梯内，不说代价」；实际现有
文案自 #427（2026-10-25）起已含「功能按免费版展示 + 配额按套餐定义」两句，且已满足决策文档要求的
「配额照常 / 能力按 free」分句。真实增量是**点名 lowcode 门控面**。

## Primary Layer

system/iam

改动落在租户控制台的 i18n 文案面（五语言各一行）与租户契约 §2.4 的澄清段；零逻辑、零 schema、
零路由、零权限变化。`normalizeTenantPlan` 的 fail-closed 语义是决策文档明示的设计约束，不动。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `not-required`
- Release Requirement: `none`
- Downstream Sync Note: 无 schema、无路由、无公开符号变化；文案与契约随下次 foundation release
  自然同步，消费者无需专门动作。

## Dependency Layers

- `system/iam`（i18n 文案 + 契约 §2.4）。不触碰 `platform`、`system/auth`、`system/org`、
  `system/config`、`business/*`。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `i18n`
- Portable Failure Class: `documented-limitation-untold`
- Owner Layer: `foundation-source`
- Ratchet Decision: `no-repeat-observed`
- Coverage Dimensions:
  - maintainability

交付层级：**L1**（轻量闭环：范围钉死在决策文档 §2 选项 A 的清单内，验证集合明确）。
按 workspace 规则本不升 L2：不触碰共享合同的行为语义（§2.4 新增段是 Clarification，不改不变量、
错误码、写侧行为），不动生成器、权限、审计、seed。

## Contract Anchors

- `docs/contracts/TENANT_CONTRACT_V1.md` §2.4：配额权威与指派面（V1.4/V1.5 既有条文）；本包在其上
  追加「前端能力矩阵边界」澄清段，§9 记 V1.9。
- `docs/reviews/TENANT_PLAN_LADDER_DECISION_2026-10-28.md`：决策与三选项裁剪（本包的唯一依据文档）。
- `frontend/src/core/entitlements/plans.ts`：能力矩阵与 `normalizeTenantPlan`（只读锚点，不改）。
- `frontend/src/modules/system/iam/tenant/TenantList.tsx`：警告触发条件与矩阵归一调用点
  （`planOutsideLadder` 265-273 行、矩阵传参 890 行；只读锚点，不改）。

## Scope

### In

- `frontend/src/i18n/resources/{zh-CN,en-US,ja-JP,ko-KR,fr-FR}.ts`：`system.tenant.plan.outsideLadder`
  各补「lowcode 门控面不可见」一clause，保持「配额照常 / 能力按 free」分句（决策文档设计约束）
- `docs/contracts/TENANT_CONTRACT_V1.md`：§2.4 新增「前端能力矩阵边界」段（澄清）；§9 变更表记 V1.9
- `.harness/STATUS.md`：W7 收口段补「已落地」记录
- task packet、manifest、evidence 三件与 PR body
- 本地验证：`audit:i18n-locales`、`tsc -b`、`lint`、`check:i18n-hardcode`、`vitest run`、
  `npm run build`（含 prebuild 契约检查）、`check-doc-links --strict`、`check-doc-inventory --strict`、
  治理链（task-packet / evidence / review）
- 开 PR、看护 CI、合并

### Out

- 任何让自定义 code 获得 rank 的改动（属决策选项 B = V2 服务端 entitlements，立项时另建包）
- 移除或放宽 `normalizeTenantPlan` 的 fail-closed 语义（决策文档设计约束）
- 修改决策文档 `TENANT_PLAN_LADDER_DECISION_2026-10-28.md`（签字文档冻结；前提勘误只随本包 evidence 记录）
- `MULTI_TENANT_DESIGN.md` 增加虚构的「§2.4」或套餐能力章节（vision 文档无该章节且层级从属合同，
  路径修正记录于 evidence knownGaps）
- `TenantPlanMatrix` / `usePlanEntitlements` / `AppLayout` 等门控消费方的逻辑改动（③ 项确认即止）
- 任何 schema、路由、权限、菜单、seed 变化

## Expected Files

### Create

- `docs/harness/tasks/2026-10-28-plan-ladder-option-a-impl.task.md`
- `.harness/tasks/2026-10-28-plan-ladder-option-a-impl/manifest.json`
- `.harness/evidence/2026-10-28-plan-ladder-option-a-impl/{commands.json,summary.md,review.md}`

### Modify

- `frontend/src/i18n/resources/zh-CN.ts`、`en-US.ts`、`ja-JP.ts`、`ko-KR.ts`、`fr-FR.ts`（各 1 行值）
- `docs/contracts/TENANT_CONTRACT_V1.md`（§2.4 一段 + §9 一行）
- `.harness/STATUS.md`（W7 段一處）

### Do Not Touch

- `backend/**`、`frontend/src/core/entitlements/**`、`frontend/src/modules/**`（除上述 i18n 值行）
- `docs/contracts/TENANT_CONTRACT_V1.md` 的 §1/§2.1/§2.2/§2.3/§2.4.1/§2.5/§3–§8 条文与错误码表
- `docs/designs/MULTI_TENANT_DESIGN.md`
- `.github/workflows/*`、`pantheon-ops/**`、迁移与 seed

## Implementation Notes

- 五语言是**同一句增量**的等价翻译，不是各自发挥：zh「lowcode 门控面不可见」、en「the lowcode gated
  surfaces stay hidden」、ja「lowcode の制御対象画面は非表示になります」、ko「lowcode 게이트 대상
  화면은 숨겨집니다」、fr「les surfaces lowcode contrôlées restent masquées」。不枚举具体页面
  （生成器/向导/挂件），与决策文档 §2 选项 A 的措辞一致——枚举会随门控消费方演进而腐烂。
- 契约段必须把三件事分开说：配额照常（表行阈值）、能力按 free（fail-closed 归一）、门控 UX-only
  （隐藏不授予也不撤销权限，授权仍由 §2.3/§3 权限链管）。决策文档「可能新引入的失败案例」第一条
  （操作者误以为配额也回退）正是靠这句拆分防住。
- V1.9 的性质是 **Clarification**：不改任何不变量、错误码、In/Out 边界或写侧行为，因此不触发
  §8 的 contract-change 门槛流程（那是给行为语义变化用的）；但仍按 §9 表登记版本号，保持可追溯。
- 文案与矩阵的一致性由现有渲染路径保证（归一值传入矩阵），本包不新增测试断言（无测试钉旧文案，
  `grep` 已核实）；防止回归的传感器是 `audit:i18n-locales` 的五语言 parity。

## Verification Plan

- `cd frontend && npm run audit:i18n-locales` → 五语言 3019 keys，missing=0 extra=0 empty=0
- `cd frontend && npx tsc -b` → exit 0
- `cd frontend && npm run lint` → exit 0
- `cd frontend && npm run check:i18n-hardcode` → 0 violations
- `cd frontend && npx vitest run` → 34 files / 230 tests passed
- `cd frontend && npm run build` → prebuild 契约检查 + 构建成功
- `node scripts/harness/check-doc-links.mjs --root . --strict` 与 `check-doc-inventory --strict`
  → 0 findings（含合同新增段的决策文档相对链接）
- 治理链：`check-task-packet`、`check-evidence --strict`、`check-review --strict`
- `grep` 核实无测试/快照钉住旧文案

## Linkage

- Task ID: `2026-10-28-plan-ladder-option-a-impl`
- Task Manifest: `.harness/tasks/2026-10-28-plan-ladder-option-a-impl/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/reviews/TENANT_PLAN_LADDER_DECISION_2026-10-28.md`、
  `docs/harness/tasks/2026-10-27-tenant-completeness-remediation.task.md`（TC-07 条目）
- Evidence Directory: `.harness/evidence/2026-10-28-plan-ladder-option-a-impl/`
- Review File: `.harness/evidence/2026-10-28-plan-ladder-option-a-impl/review.md`

## Evidence Required

- 五语言 audit 读数（parity + 计数）。
- `tsc -b` / `lint` / `check:i18n-hardcode` / `vitest` / `build` exit 读数。
- 文档检查器 0 findings（含新链接校验）。
- `git diff --stat` 证明改动面：五语言各 1 行 + 契约一段一行 + STATUS 一处。
- 治理链读数与 PR 合并 SHA。

## Human Gates

- 无。决策 A 已于 2026-10-28 按 maintainer-delegated 签字（决策文档 §0），本包是其已签字落地
  清单的执行；不新增任何需要维护者裁剪的选项。

## Completion Checklist

- [ ] Layer and boundary declared
- [ ] Contract anchors read
- [ ] Verification run or exception recorded
- [ ] Evidence saved or summarized
- [ ] Review completed
- [ ] 五语言警告文案点名 lowcode 门控面后果，且保持「配额照常 / 能力按 free」分句
- [ ] 合同 §2.4 有能力矩阵边界澄清段，§9 记 V1.9（Clarification）
- [ ] `TenantPlanMatrix` 自定义 code 渲染 free 的现状经核实（③ 项，无逻辑改动）
- [ ] `normalizeTenantPlan` fail-closed 语义未被触碰
- [ ] 决策文档与设计文档未被改写（路径修正只记录于 evidence）
