# Summary — S4 `2026-10-27-s4-governance-decisions`（治理面残留项决策）

分支 `decision/s4-governance-surfaces-2026-10-27`，**堆叠于 `refactor/s1-dead-code-removal-2026-10-27`**
（包 dependsOn S1 删除波，用分支依赖机械强制合并顺序）。**决策波：零删除、零源码改动。**

## 交付物

1. **决策文档** `docs/reviews/GOVERNANCE_SURFACE_DECISIONS_2026-10-27.md`：
   - §0 五项决策表（决策 / 一段理由 / 成本 / 后续）；
   - §1 RC-043 逐符号计量表（18 别名 × base/ops 限定引用文件数，10 零消费 / 8 消费），
     实测取代审计估计（程序规则：measured 替代 audit estimate）；
   - §2 RC-036 keep-and-check 检查器规格（`scripts/harness/check-doc-bilingual.mjs`：
     标题骨架 + 代码围栏 + 链接目标三口径，CI 接线需维护者批准）；
   - §3 明确不做（本波零删除、不新增 gate、不重开 docs/harness 分工）。
2. **README 索引**（RC-037 keep 的文档）：`docs/README.md` §4.1 补 7 条历史多模型评审转写索引。
3. **后续删除包**：`.harness/tasks/2026-10-27-s4-re-export-alias-removal/manifest.json`
   （status=planned，删 10 个零消费别名，双仓编译 + 全套件等价证明）。
4. **证据**：本目录 commands.json（12 条）、[decisions.md](decisions.md)、本 summary、[review.md](review.md)。
5. **包状态**：S4 manifest planned → completed。

## 门禁结果

| 命令 | 结果 |
|---|---|
| `node scripts/harness/check-doc-links.mjs --root . --strict` | 通过（见 commands.json） |
| `node scripts/harness/check-doc-inventory.mjs --root . --strict` | 通过 |
| `node scripts/harness/check-task-packet.mjs --root .` | PASS（含新后续包） |
| `node scripts/harness/check-evidence.mjs --strict …/commands.json` | 通过 |
| `node scripts/harness/check-review.mjs --strict …/review.md` | 通过 |

## 审计数字修正（measured vs audit）

| 项 | 审计 | 实测（2026-10-27） |
|---|---|---|
| RC-036 .en.md 副本 | 99 | **95** |
| RC-038 archive 文件 | 659 / 1081 | 659 / **1193**（分母随今日证据波增长） |
| RC-043 零引用别名 | 12 | **10**（逐符号表见决策文档 §1） |

## 对父程序的影响

- 简化程序 12 波中 S4 落地（决策波）；程序剩余：S2×6（等 S1 发布）、S3×3（等 S2 稳定一个发布周期）、
  两个后续包（re-export 别名删除 = P3 独立波；bilingual 检查器 = 需 CI 审批）。
- 实测数字已进入决策文档，程序收尾清单的「Measured net reduction recorded per wave」可直接引用。
