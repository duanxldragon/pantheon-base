# G3 Window Sizing — Tool-Chain Readiness Record（LOCAL-SAMPLE，非门禁证据）

- Run ID: g3-sizing-20260918_060353（本地验证 run）
- Date: 2026-09-18
- Environment: 本地 Windows 工作站，MySQL 8.0（compat 模式），DB `pantheon_base`（34 表，in-scope 6,825 行）
- Executor: Buffy (agent)，维护者授权的 workspace 工作
- **本记录不是生产证据。Gate G3 保持 OPEN。** Agent 无生产 DSN；生产采集是 DBA/维护者动作（见下"剩余人工步骤"）。

## 已验证内容（工具链就绪性）

1. `go test ./cmd/tenantsizing/` — 8/8 PASS（分阶段数学、rehearsal 下限、零行归一、OVER-10M verdict 翻转、阈值边界、stage-D casbin 成本、fixture 文件链路、行数降序排序）。
2. 只读性核查：`snapshot` 仅执行 `SELECT DATABASE()`、`SELECT @@hostname`、`information_schema.tables` 查询；代码内无 Exec/INSERT/UPDATE/DELETE/ALTER 语句。
3. 端到端演练（本地库代替生产 DSN）：
   - `tenantsizing snapshot -dsn <local> -out <json>` → 34 表、in-scope 6,825 行、JSON 报告含 runId/capturedAt/notes。
   - `tenantsizing plan -report <json>` → 逐表 B1+B4 DDL / B2 backfill / C unique-swap 分解，总计 4,172.3s，窗口预留 ×2 = 8,344.7s（2h19m）。
   - 公式输出与 runbook §4.2 文本一致：`T(prod) = T(rehearsal) × (rows_prod / rows_rehearsal) × 3.0; window = T(prod) × 2.0`。
4. 本地快照未触发 OVER-10M（最大表 `system_log_oper` 2,937 行），因此本次演练只覆盖 `ESTIMATE-READY` 形态；`ESTIMATE-PROVISIONAL` 路径由单测 `TestBuildEstimate_Over10MFlipsVerdict` 覆盖。

## 本地数字的定位（防误用）

本地 2h19m 的窗口预留**不可**用于 G3 评审：它反映的是一台开发机的 6.8k 行数据。它只证明
工具链与公式实现正确。生产窗口将由 `snapshot` 对生产只读 DSN 的输出决定，量级可能完全不同。

## 剩余人工步骤（G3 放行路径，state 文档 checklist 的执行说明）

1. **生产快照**（DBA，只读；可在 G2 还原演练窗口顺带执行，还原库即首次盘点源）：
   `tenantsizing snapshot -dsn <prod_readonly_dsn> -out g3-snapshot-<date>.json`
   → 落入 `artifacts/`。
2. **生成工作表**：`tenantsizing plan -report g3-snapshot-<date>.json > g3-window-worksheet-<date>.md`
   → 与快照一起作为 G3 评审输入。
3. 若 verdict 为 `ESTIMATE-PROVISIONAL`（任何表 >10M 行）：先在预发用生产量级演练这些表（runbook §4.2），重跑 snapshot/plan 至 `ESTIMATE-READY`。
4. 维护者按"估算 ×2"批准窗口，在 runbook §8.1 翻转 G3 并引用工作表文件名。

## 关联

- 权威 gate 记录: `.harness/state/2026-09-10-tenant-verification-and-gray-gates/status.md`
- G3 工具: `backend/cmd/tenantsizing`（runbook §4.2 公式 + 10M 规则强制）
- G2 演练规程: `docs/runbooks/PRODUCTION_BACKUP_RESTORE_DRILL_G2.md`（§6：还原库可作 G3 首次盘点源）
