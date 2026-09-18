# G2 生产备份恢复演练记录（模板）

> **用途**：G2 gate 的唯一有效证据记录。DBA 执行 `docs/runbooks/PRODUCTION_BACKUP_RESTORE_DRILL_G2.md`
> §3 全部步骤时，复制本文件为 `g2-restore-<runid>.md` 并逐项填写。
> **放行标准**（§4）：RPO ≤ 15 min；RTO × 2 ≤ 生产维护窗口；一致性可解释；DBA + 维护者签署。
> **本文件是模板，不是演练记录；Gate G2 保持 OPEN。**
> 提取自规程 §5（2026-09-18，commit 369ef38f 时点），如有出入以规程原文为准。

---

# G2 生产备份恢复演练记录

- Run ID: g2-restore-<yyyymmdd_hhmmss>
- Date: ____
- 执行人（DBA）: ____    复核（维护者）: ____
- 生产 MySQL 版本: ____    预发还原环境: ____

## 备份策略现状
- 全备: 频率 ____，最新成功 ____，体积 ____，sha256 ____
- 增量/binlog: 频率 ____，保留 ____ 天，格式（ROW/_STMT）____，GTID: ____
- 备份存储位置与加密: ____

## RPO 实测
- 全备完成时刻: ____    全备内 binlog 位点: ____
- 演练采集时刻: ____    生产当前位点: ____
- **RPO = ____ 分钟**（计算过程）

## RTO 实测
- 还原开始: ____    还原完成: ____（耗时 ____）
- binlog 重放: 文件数 ____，字节 ____，耗时 ____
- 应用验证通过: ____（耗时 ____）
- **RTO = ____ 分钟**

## 一致性校验
- 全表行数差异清单（含解释）: ____
- 抽样 checksum 差异（含解释）: ____

## 应用级验证
- health: ____    登录: ____    menu/tree: ____    dict list: ____    表探针: ____

## 结论
- 还原: PASS/FAIL    RPO 达标: 是/否    RTO 达标: 是/否
- 未解决问题/风险: ____
- G2 建议: 放行 / 继续OPEN（原因）
```


---

## 填写完成后的流程

1. 本文件与命令输出原文一起放入 `artifacts/`（引用任何外部日志时给出路径）。
2. DBA 署名 + 维护者复核签署（§4 证据要求）。
3. 维护者在 `TENANT_MIGRATION_RUNBOOK.md` §8.1 将 G2 翻为 GRANTED 并引用本记录 Run ID；
   同步更新 `.harness/state/2026-09-10-tenant-verification-and-gray-gates/status.md` 的 G2 行。
4. 还原库顺带完成 G3 首次盘点：`tenantsizing snapshot`（见
   `g3-toolchain-readiness-LOCAL-SAMPLE-20260918.md` 的执行说明）。
