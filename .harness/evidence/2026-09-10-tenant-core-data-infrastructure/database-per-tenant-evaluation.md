# Database-Per-Tenant Evaluation

结论：不在当前 Tenant Contract V1（shared database + shared schema + `tenant_id`）中直接切换到一租户一数据库实例；建议作为 Phase 3 的可选部署档位，并采用 shared/dedicated 混合模型。

## 收益

- 数据库边界提供最强的故障与误查询隔离，漏加 `tenant_id` 不会直接跨租户读取。
- 可按租户独立备份、恢复、扩容和数据驻留策略。

## 代价与前置条件

- 当前运行时只有全局单 `*gorm.DB`、单连接池、单迁移执行器和单 Casbin 初始化，需要抽象为可信 tenant registry + 数据库路由/连接池生命周期。
- 必须保留独立 control-plane 数据库承载 tenants、memberships、登录发现、平台审计、全局配置和实例映射；这些表不能依赖业务库路由。
- 迁移、seed、健康检查、凭据轮换、连接上限、故障隔离和观测都要支持 N 个租户编排，不能把请求中的 tenant ID 直接拼接 DSN。
- 运维成本和连接数线性增长，小租户会产生明显资源浪费；跨租户平台报表需要显式 fan-out 或汇总管道。

## 建议路径

1. 完成 V1 shared-schema 的隔离、验证和灰度门禁。
2. 抽象 `TenantDatabaseRouter` 接口，先在测试环境支持 dedicated database 驱动，同时保持现有 shared 路径。
3. 对高敏感/企业租户启用 dedicated database；普通租户继续 shared schema。
4. 为迁移、备份恢复、审计和容量指标建立独立 runbook 与演练证据后，再扩大 dedicated 覆盖面。

该评估不改变 V1 合同，也不构成生产切换批准。
