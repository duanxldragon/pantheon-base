# Decisions — S4 `2026-10-27-s4-governance-decisions`（治理面残留项）

**签名日期**：2026-10-27
**签名方式**：维护者授权委派（delegated decision），对维护者审查开放
**完整论证与计量表**：[GOVERNANCE_SURFACE_DECISIONS_2026-10-27.md](../../../docs/reviews/GOVERNANCE_SURFACE_DECISIONS_2026-10-27.md)

## 五项决策（浓缩）

| 项 | 决策 | 后续 |
|---|---|---|
| RC-036：95 份 .en.md 双语副本无内容级同步检查 | **keep-and-check**——检查器必须比内容（标题骨架 + 代码围栏 + 链接目标），只比存在性会加噪声不加安全 | 检查器规格已登记于决策文档 §2；接线 CI 需维护者批准，后续包 `2026-10-27-docs-bilingual-content-check` 立项时创建 |
| RC-037：7 份 LLM 评审转写未被索引 | **keep-and-check（本波即补索引）**——转写是审计凭证，索引缺口而非文档缺陷 | ✅ 本波已在 docs/README.md §4.1 补 7 条索引，无后续包 |
| RC-038：.harness/archive 659 个文件 | **keep-as-is**——archive 是 ratchet 方法论的证据层，删档毁审计链 | 无 |
| RC-031：DashboardWidget 类型族仅族内消费 | **keep-as-is**——自洽的规划面（低代码/工作台），删除是不可逆设计损失 | 复核点：S3 或低代码程序 |
| RC-043：re_export.go 18 个别名，实测 10 个零限定引用 | **delete（仅这 10 个）**——底层函数活着（消费方走 `commonhttp.`/`security` 直连），死的只是再导出别名 | ✅ 后续包 `2026-10-27-s4-re-export-alias-removal` 已创建（status=planned）；本波零删除 |

## 计量事实（2026-10-27，分支基线 = S1 删除波）

- RC-036：`find docs -name '*.en.md' | wc -l` → **95**（审计记 99；漂移记入 knownGaps）
- RC-037：7 份转写、README 0 引用（补索引后 doc-links/doc-inventory strict 双绿）
- RC-038：**659** archive / 1193 总 harness 文件（审计分母 1081；今日证据波使分母增长）
- RC-031：`grep -rn DashboardWidget frontend/src` 剔除 types.ts 自身 → 仅 i18n key 名子串命中，零类型消费
- RC-043：18 别名逐符号 `common\.<Sym>\b` 限定引用计数（base + ops）→ **10 零消费 / 8 消费**，全表见决策文档 §1

## 约束遵守

- 本波零删除（决策文档 + README 索引行 + 后续包 manifest + 证据，全部为新增/修改）。
- 未新增 CI gate（RC-036 检查器只登记规格）。
- 未触碰 `frontend/src/index.ts`、`.harness/archive/**`、`docs/**/*.en.md`、`scripts/harness/**`、`.github/workflows/**`、`frontend/src/core/router/types.ts`（包 doNotTouch）。
- 改判不溯及：维护者审查若改判，只影响后续包，本波产物（决策表 + 索引）仍有效。
