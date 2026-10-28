# Summary — W7 `2026-10-27-tenant-plan-ladder-decision`（套餐能力阶梯语义决策）

分支 `decision/tenant-plan-ladder-w7-2026-10-28`，基线 `3e7fe8ff`（S2 收口簿记 PR #457 合入后的 origin/main）。
**决策波：零源码改动**——按包定义，本波只产决策文档与证据，不改 `backend/**`、`frontend/src/**`、合同或 API 文档。

## 交付物

1. **决策文档** `docs/reviews/TENANT_PLAN_LADDER_DECISION_2026-10-28.md`：
   - §1 问题复述：配额权威（`tenant_plan_model.go`）与能力门控（`plans.ts` 四档 rank + fail-closed 归一化）分属两处，八个读点逐一核实行号；
   - §2 三个选项（A 阶梯只管能力矩阵 / B 服务端 entitlements / C 移除门控），每个给出改动、修复的失败案例、新引入的失败案例与成本；
   - §3 对比表 + 推荐（A for V1，B as V2 commercialization workstream）；
   - §4 存量数据处置：无迁移、`tenants.plan` 列与 `tenant_plans` 行原样保留；
   - §5 明确不做：W7 内改源码、为 B/C 预创建空包、fail-open 化归一化、计入 V1 完成度。
2. **签名**：维护者授权委派（delegated decision）选择 A，见 [decision.md](decision.md)；对维护者审查开放，改选 B/C 时按包规则处理。
3. **证据**：本目录 commands.json（全部 passed）、本 summary、[review.md](review.md)。

## 门禁结果

| 命令 | 结果 |
|---|---|
| `node scripts/harness/check-doc-links.mjs` | 0 findings |
| `node scripts/harness/check-doc-frontmatter.mjs` | 0 error, 0 warning |
| `node scripts/harness/check-task-packet.mjs --root .` | 66 file(s), 0 error(s), 41 warning(s)（与基线一致） |
| `node scripts/harness/check-evidence.mjs --strict …/commands.json` | 通过 |
| `node scripts/harness/check-review.mjs --strict …/review.md` | 通过 |

## 关闭的 TC

- **TC-07 的决策部分**（W7）：套餐能力阶梯语义已定为「能力矩阵只覆盖内建四档，自定义 code = 配额桶 + free 能力档，后果写明」；实现（五语言警告文案 + 设计文档/合同表述）归后续 L1 小 PR，不计入 V1 完成度。

## 已核实的读点（2026-10-28，main `3e7fe8ff`）

| 读点 | 位置 | 行为 |
|---|---|---|
| 配额权威 | `backend/modules/system/iam/tenant/tenant_plan_model.go:11,70,93` | quota 阈值 + `UnlimitedQuota=-1` + `AsQuota()` |
| 能力联合 | `frontend/src/core/entitlements/plans.ts:16-23` | 四档字面量联合 |
| rank 表 | `plans.ts:58-63` | free=0 … enterprise=3 |
| 归一化 | `plans.ts:70-75` | 未知 code fail-closed 归 `free` |
| 警告 | `frontend/src/modules/system/iam/tenant/TenantList.tsx:272-273,890-893` | `planOutsideLadder` → `system.tenant.plan.outsideLadder` |
| 门控消费方 | `usePlanEntitlements.ts` → `AppLayout.tsx`、`lowcode/generator/pages/ModuleWizard.tsx`、`platform/Dashboard.tsx` | 租户会话按 plan 隐藏 lowcode 面 |
