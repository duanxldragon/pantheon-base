# Summary — 2026-10-31-audit-remediation-programme

来源：`docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-10-31.md`（合并终版，唯一权威）。
结论仍为 **B：完成少量整改后进入维护冻结阶段**；本 programme 负责把 7 项冻结门槛逐项兑现。
读数见同目录 `commands.json`，28 条着落表见 `review.md`。

## 子包终态（9/9 completed）

| 顺序 | 子包 | 覆盖 | 终态 |
| --- | --- | --- | --- |
| W1 | `2026-10-31-audit-p1-lowcode-generator-build` | AUD-001 | completed |
| W2 | `2026-10-31-audit-p1-business-route-tenant-context` | AUD-002 | completed |
| W3 | `2026-10-31-audit-p1-entry-doc-truthfulness` | AUD-003/004/007/016/024 | completed |
| W4 | `2026-10-31-audit-p2-doc-lifecycle-archive` | AUD-006/011/017/018/019 | completed |
| W5 | `2026-10-31-audit-p2-doc-metadata-and-index` | AUD-008/009/010 | completed |
| W6 | `2026-10-31-audit-p2-dead-code-legacy-surface` | AUD-012/013/014/020 | completed |
| W7 | `2026-10-31-audit-p2-token-cache-race` | AUD-026 | completed |
| W8 | `2026-10-31-audit-p2-ci-checker-wiring` | AUD-015/027 | completed |
| W9 | `2026-10-31-audit-p2-oidc-scaffold-decision` | AUD-005 | completed |

依赖图按计划成立：`W1→W6`、`W2→W3→W4→W5→W8`、`W7`/`W9` 独立。

## 7 项冻结门槛

| # | 门槛 | 状态 | 证据 |
| --- | --- | --- | --- |
| 1 | 生成器"生成 → `go build` → 建表"往返（AUD-001） | **满足** | W1：产物 `go build`/`go vet` exit 0；默认迁移模式下 `biz_order` 真实建出；摘掉 `BootstrapFunc` 后同一测试失败 |
| 2 | 业务域租户语义落到合同 + README（AUD-002） | **满足** | W2：`TENANT_CONTRACT_V1 §2.6` + `route_groups_test.go` 结构断言（注入租户中间件即红） |
| 3 | 入口文档可执行性与失实修正（AUD-003/004/007/016/024） | **满足** | W3：README 不再硬编码 release 号、DESIGN 增补租户章、`docs/README` 启动命令可执行、designs 索引 62/62 |
| 4 | 文档归档轮完成（AUD-006/011/017/018/019） | **满足** | W4：69 份任务包 `Active`/`Draft` → `Archived`，7 份 `TENANT_*` 移入 `docs/reviews/`，6 份未实现设计降 `Draft` |
| 5 | 元数据规范三合一 + scope 矩阵 + 门禁边界（AUD-008/009/010） | **满足** | W5：字段定义只剩 `DOCUMENT_FRONTMATTER_SCHEMA` 一处；门禁自报"415 扫描 / 302 带元数据 / 113 不强制" |
| 6 | 死代码/死表/legacy 端点处理完毕（AUD-012/013/014） | **满足（含 human gate 残留）** | W6：hooks / `scaffold.Generate` / `readRoleKeysFromContext` 删除；`000031` drop 死表；legacy 端点保留 + `Sunset: 2026-12-31` |
| 7 | token 缓存竞争 + CI 去重 + checker 接线（AUD-026/015/027） | **满足** | W7：修复前 2 × DATA RACE → 修复后 0；W8：9 个 checker 接入 `Docs Governance`，race 每 PR 2→1 |

## 收口复核期间新发现并修复的两处

这两处都不是审计报告里的条目，是执行过程中自查出来的：

1. **W6 的 `000031.down` 重建形状错误**（P2）。初版以"up/down/up 三步 exit 0"为判据，
   但回滚到 v30 的表多了一条 000024 早已删除的 `role_key` 全局唯一索引——回滚后两个租户
   不能再用同一个 `role_key`。改用 `SHOW CREATE TABLE` 逐字节对比后暴露，已修复并补
   `TestDropPolicyTableDownReconstructsVersion30Shape`（在缺陷版本上验证过会红）。
2. **W6 的 evidence 自述不实**（P3）。`commands.json` 把 `check-evidence --strict` 记为
   `passed`，实际因缺 `knownGaps` 为 FAIL。已改为如实记录，并在 `review.md` 写进
   「收口复核的自我更正」。

## 明确不处理（programme 级 Out，与审计 §12.4 一致）

- 删除 `pkg/security/ssrf`（ops 有 5 处 import，D 类为下游保留）。
- 拆分大组件、为 dashboard 加缓存、合并 `docs/harness` 与 `.harness`。
- 删除历史评审报告、补齐全量 `.en.md`。
- 把 7 项 P3 包装成任务：其中 AUD-020/024 已并入 W6/W3，其余 5 条（AUD-021/022/023/025/028）
  维持现状并在此显式登记。

## 冻结判定归维护者

programme 只提供读数：9/9 子包 completed、7/7 门槛达成、全量门禁 0 error。
"进入维护冻结"是维护者的宣告动作（programme `Human Gates` 已写明），本文件不代替它。
