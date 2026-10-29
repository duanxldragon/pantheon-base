# Decision — W7 `2026-10-27-tenant-plan-ladder-decision`（套餐能力阶梯语义）

**签名日期**：2026-10-28
**签名方式**：维护者授权委派（delegated decision），对维护者审查开放
**完整论证**：[TENANT_PLAN_LADDER_DECISION_2026-10-28.md](../../../docs/reviews/TENANT_PLAN_LADDER_DECISION_2026-10-28.md)

## 选项表（浓缩）

| | A 阶梯只管能力矩阵 | B 服务端 entitlements | C 移除套餐 UI 门控 |
|---|---|---|---|
| 内容 | `outsideLadder` 警告补后果（配额照常 / 能力按 free）；设计文档与合同 §2.4 相邻处写明矩阵只覆盖内建四档；门控语义与 fail-closed 归一化不动 | `tenant_plans`（或新表）携带 per-plan feature 键，后端下发，前端数据驱动门控 | 删除 `PLAN_FEATURES`/`usePlanEntitlements`/`TenantPlanMatrix`，lowcode 面对持页面权限租户全量可见 |
| schema/迁移 | 无 | 需要 | 无 |
| 自定义 code 能力面 | free（后果写明） | 操作者可配 | 全量放开 |
| 配额能力 | 照常（`tenant_plans` 表权威） | 照常 | 照常 |
| 修复 TC-07 | 后果告知 + 契约表述 | 完整修复 | 按构造消失 |
| 新增风险 | 文案歧义（可控：两句分开说） | 配错面扩大 + entitlements 测试缺口 | 产品能力回退 |
| 成本 | 一个 L1 小 PR | 多 wave，V2 | 删代码但损失已交付分层 |

## 签名的选择

**A（阶梯只管能力矩阵，自定义 code = 配额桶 + free 能力档）为 V1；B（服务端 entitlements）登记为 V2 商业化工作流（立项时新建迁移包，本波不创建）；C 否决。**

- 依据：配额今天就是数据驱动的（`tenant_plan_model.go` quota 权威），自定义 code 的配额能力完整；唯一缺口是**后果未告知**——`outsideLadder` 警告不说代价、契约不写边界。A 以最小改动（文案 + 文档）闭合该缺口。
- 落地：A 的实现是一个 L1 小 PR（五语言警告文案 + 设计文档/合同表述），**不占用 W7 本包**（W7 交付物是决策，不是 diff）。
- 若维护者审查改选 B：按 §2 选项 B 的前置与风险清单新建迁移包；改选 C：须先修订本决策与决策文档 §2 选项 C 的否决理由（C 是产品决策，不是实现细节）。
- 明确不做：为 B/C 预创建空任务包；把 `normalizeTenantPlan` 改 fail-open 或在前端为自定义 code 伪造 rank（破坏「不静默发放付费面」的安全语义）；本决策不计入 V1 完成度（程序文档口径）。
