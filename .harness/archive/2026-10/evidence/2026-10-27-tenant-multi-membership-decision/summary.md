# Summary — W3 `2026-10-27-tenant-multi-membership-decision`（跨租户成员关系语义决策）

分支 `decision/tenant-multi-membership-w3-2026-10-27`，基线 `d2b95775`（W1 PR #436 合入后的 origin/main）。
**决策波：零源码改动**——按包定义，本波只产决策文档与证据，不改 `backend/**`、`frontend/src/**`、合同或 API 文档。

## 交付物

1. **决策文档** `docs/reviews/TENANT_MULTI_MEMBERSHIP_DECISION_2026-10-27.md`：
   - §1 问题复述：六个读/写点逐一核实行号（W2 合并后的 main `d2b95775`），含 e2e 漏检路径；
   - §2 三个选项（A 收窄语义 / B 跨租户绑定 / C 移除多成员），每个给出改动、合同影响、修复的失败案例、新引入的失败案例与成本；B 的硬前置（`user_helper.go:88` 无租户谓词删除）显式记录；
   - §3 对比表 + 推荐（A for V1，B as V2 workstream）；
   - §4 存量行处置：保留、由 W4 谓词从登录入口隐藏、`/auth/current` 继续如实报告、不自动清理；
   - §5 明确不做：隐式角色映射（合同 §2.2 禁止）、W3 内改源码/合同、为 B/C 预创建空包。
2. **签名**：维护者授权委派（delegated decision）选择 A，见 [decision.md](decision.md)；对维护者审查开放，改选 B/C 时 W4 须先 abandoned 再重写。
3. **证据**：本目录 commands.json（13 条命令，全部 passed）、本 summary、[review.md](review.md)。

## 门禁结果

| 命令 | 结果 |
|---|---|
| `node scripts/harness/check-doc-links.mjs --root . --strict` | 0 findings（首轮 2 findings：W4/W5 任务文档不存在，改为指向包清单路径后复跑通过） |
| `node scripts/harness/check-doc-inventory.mjs --root . --strict` | 0 findings |
| `node scripts/harness/check-task-packet.mjs --root .` | PASS |
| `node scripts/harness/check-evidence.mjs --strict …/commands.json` | 通过 |
| `node scripts/harness/check-review.mjs --strict …/review.md` | 通过 |

## 关闭的 TC

- **TC-01 的决策部分**（W3）：跨租户 membership 的语义已定为「不授予授权、不在登录时提供」；实现归 W4（`2026-10-27-tenant-multi-membership-authorization`），合同/API 文档澄清归 W5。TC-01 整体在 W4 合入后关闭。

## 对父程序的影响

- 解锁 W4（其 `dependsOn` 中的 `2026-10-27-tenant-multi-membership-decision` 现已 signed）；
- W5 的澄清文案有了基准（A 的合同措辞在决策文档 §2 选项 A 第 5 条）；
- 父程序 STATUS 行与本包状态翻转随本分支合入。
