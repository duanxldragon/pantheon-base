# Summary — `2026-10-28-plan-ladder-option-a-impl`（W7 选项 A 实现跟进）

## What was delivered

W7 决策 A（`docs/reviews/TENANT_PLAN_LADDER_DECISION_2026-10-28.md`，2026-10-28
maintainer-delegated 签字）登记给独立小 PR 的实现部分，全部落地：

1. **五语言警告文案**（`frontend/src/i18n/resources/{zh-CN,en-US,ja-JP,ko-KR,fr-FR}.ts` 各 1 行）：
   `system.tenant.plan.outsideLadder` 补「lowcode 门控面不可见」后果句。决策文档要求的
   「配额照常 / 能力按 free」分句保持不变——现文案已有的两句不动，只插入点名 lowcode 的
   子句。不枚举具体页面（生成器/向导/挂件），与决策文档 §2 选项 A 的措辞一致。
2. **合同 §2.4「前端能力矩阵边界」澄清段**（`docs/contracts/TENANT_CONTRACT_V1.md`）：
   能力矩阵只覆盖内建四档；`normalizeTenantPlan` 对未知 code fail-closed 归 `free`；
   自定义 code = 配额桶 + `free` 能力档；门控 UX-only（隐藏不授予也不撤销权限，授权仍由
   §2.3/§3 权限链管）；服务端 entitlements 属 V2。§9 记 **V1.9（Clarification）**——
   不变量、错误码、In/Out 边界、写侧行为均不变。
3. **决策项 ③ 确认**：`TenantPlanMatrix` 接收 `normalizeTenantPlan(planCodeDraft)` 的归一值
   （`TenantList.tsx:272` → `:890`），自定义 code 现状即高亮 free 列——零逻辑改动，仅核实。
4. **STATUS.md**：W7 收口段补「已落地」记录（含本 evidence 指针）。

## Premise deltas (recorded, decision document unedited)

- **路径修正**：决策文档写的「设计文档 §2.4 相邻处」在 `MULTI_TENANT_DESIGN.md` 不存在
  （vision 文档，无套餐能力章节，plan 仅顺带出现于 schema 示例，且自声明层级从属合同）。
  规范表述落合同 §2.4——决策文档 §判据 锚定的同一节。
- **前提勘误**：决策文档 §1 称警告「只说不在阶梯内，不说代价」；实际现有文案自 #427
  （2026-10-25）已含后果两句并满足决策自己的分句要求。真实增量是点名 lowcode 门控面。
  签字文档不改写，勘误只记录于此。

## How it was verified

- `audit:i18n-locales`：五语言各 **3019 keys，missing=0 extra=0 empty=0**（key 集合不变）。
- `npx tsc -b`、`npm run lint`、`npm run check:i18n-hardcode`（237 files）全部 exit 0。
- `npx vitest run`：34 files / **230 tests passed**；`npm run build` 成功（含 prebuild 契约检查）。
- `check-doc-links --strict` 与 `check-doc-inventory --strict`：**0 findings**（含合同新段的
  决策文档相对链接）。
- 治理链：`check-task-packet`、`check-evidence --strict`、`check-review --strict` 全绿。
- `grep` 核实无测试/快照钉旧文案。

## Residue

- 无新增残留。V2 服务端 entitlements（决策选项 B）维持登记，立项时另建任务包；
  「自定义 code 想要 professional 能力」在 V1 内无解（决策文档已声明）。
