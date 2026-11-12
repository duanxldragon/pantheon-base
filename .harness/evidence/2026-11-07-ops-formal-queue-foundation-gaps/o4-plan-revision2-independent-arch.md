## Summary

**Architectural Status：`BLOCK` — 针对 revision 2 的实施计划执行。** 原始架构阻断项已基本转化为具体 API、文件归属、锁序、迁移与装配决策，但仍有一个遗漏的 header→关联 ID→审计／日志持久化路径，以及一处生成器验收入口矛盾需要修正。

两次核验计划 SHA256 均为 `a338352f99779d8c1635a2aafa6939dc6e628389ee83aa6e64c032669c4a9da5`。已授权的同批 actor／tenant 隔离方向保持有效，无需重新作业务决策。

## Analysis

### 1. HIGH：metadata-only 策略没有明确关联 ID 的可信来源

[计划:218](D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:218) 允许受保护错误日志输出 request ID；[计划:220](D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:220) 禁止原始 header 文本进入审计；[计划:226](D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:226) 要求 hostile header sentinel 不落库。

实际路径仍是：

- [request_context_middleware.go:21](D:/workspace/go/pantheon-platform/pantheon-base/backend/internal/middleware/request_context_middleware.go:21) 优先接受 `X-Request-ID`／`X-Trace-ID`，随后写入 Gin、响应头和 logging context。
- [同文件:59](D:/workspace/go/pantheon-platform/pantheon-base/backend/internal/middleware/request_context_middleware.go:59) 只校验字符形状；`secret-marker-123` 或 token 形状字符串可以通过。
- [operation_log_middleware.go:256](D:/workspace/go/pantheon-platform/pantheon-base/backend/internal/middleware/operation_log_middleware.go:256) 直接持久化该 request ID；[response.go:106](D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/common/http/response.go:106) 将其写入错误日志。
- [operation_log_middleware_test.go:149](D:/workspace/go/pantheon-platform/pantheon-base/backend/internal/middleware/operation_log_middleware_test.go:149) 明确断言调用方 ID 原样进入审计。

因此，关闭正文捕获仍不足以实现本计划自己的 header 隐私要求。这是**关联 ID 来源决策缺失**，不是要求新 API 预先存在。

**最小修复：** 在 E 明确：精确 metadata-only method/template 使用服务端生成的关联 ID，覆盖 Gin、logging context、响应头及审计；不保存或记录入站关联 ID。Base owner 增补 `request_context_middleware.go` 和对应测试至 [J:337](D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:337)。未匹配路由保留现有传播语义。

### 2. MEDIUM：生成器运行验收仍点名旧 runner

[计划:123](D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:123) 正确选择新增 `RegisterRequiredBackendModules`，要求失败时零路由注册；但 [计划:125](D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:125) 又要求 tenant v2 运行验收经过旧 `RegisterBackendModules`。

旧 runner 确实通过 [module.go:118](D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/contracts/module.go:118) 吞掉 bootstrap／seed 错误，然后在 [module.go:109](D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/contracts/module.go:109) 注册路由。

**最小修复：** 将 L125 明确拆为 tenant v2 经生成模块 Init→required runner，legacy v1 经旧 runner。成功建表与失败拒绝都必须经过相应真实入口。无需调整 L123 的架构选择。

### 原始阻断与 A–G 决策核对

原始问题依据为 [CODE 原审:12](D:/workspace/go/pantheon-platform/pantheon-base/.harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/o4-plan-independent-code.md:12) 起的七项 findings，以及 [ARCH 原审:5](D:/workspace/go/pantheon-platform/pantheon-base/.harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/o4-plan-independent-arch.md:5) 所列阻断。

| 决策                                      | 本轮判断与源码依据                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A：strict mode／fresh authorization**   | 原始决策缺口已解除。[计划:57](D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:57) 保留旧 loader 并新增错误入口；[计划:91](D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:91) 固定两阶段顺序和绑定来源。实际目标租户角色查询可复用 [login_runtime.go:328](D:/workspace/go/pantheon-platform/pantheon-base/backend/modules/auth/login/login_runtime.go:328)。                                                                                                                                                                               |
| **B：tenant v2 generator／bootstrap**     | flat v2、默认兼容、direct-export 验证和 required runner 已明确；保留上述验收入口矛盾。实际直接导出入口见 [export-generated-module.mjs:26](D:/workspace/go/pantheon-platform/pantheon-base/frontend/scripts/export-generated-module.mjs:26)。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **C：datasource／legacy alerts**          | [计划:131](D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:131) 保留名字软删占用语义、DataScope 可见 default 清理和 tenant0 alerts。evaluator 的第二次凭证读取确实需要栅栏：[alert_evaluator.go:227](D:/workspace/go/pantheon-platform/pantheon-ops/backend/modules/business/observability/alert_evaluator.go:227)。                                                                                                                                                                                                                                                                                                                   |
| **D：actor ownership／权限／锁序**        | [计划:147](D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:147) 固定 actor 和不可变 source；[计划:182](D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:182) 固定 owner→datasource→metadata 锁序、保留 guard，并定义 purge 回滚重试。合法权限键符合 [registry.go:26](D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/permissionroutes/registry.go:26)。                                                                                                                                                                         |
| **E：compiler／audit／idempotency**       | 捕获前策略和 Ops 精确 bypass 已解除原始位置问题；上述关联 ID 路径仍阻断。Ops header 读取点确实位于 [idempotency_middleware.go:40](D:/workspace/go/pantheon-platform/pantheon-ops/backend/modules/business/opsinit/idempotency_middleware.go:40)，无需新增 Base 幂等框架。                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **F：candidate／migration／old artifact** | 决策可实施。[计划:238](D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:238) 分配独立工具，复用真实 [assembleConsumerTree:612](D:/workspace/go/pantheon-platform/pantheon-ops/scripts/business-overlay/rebuild-from-base.mjs:612)；[计划:266](D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:266) 定义显式 dirty 恢复；[计划:281](D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:281) 定义独立启动 wrapper、binary receipt 和旧进程停止边界。 |
| **G：frontend**                           | [计划:295](D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:295) 明确恢复不执行、身份切换清理和 late completion 拒绝，可接入现有 [LogExplorer.tsx:90](D:/workspace/go/pantheon-platform/pantheon-ops/frontend/src/modules/business/observability/LogExplorer.tsx:90) 的取消机制。渲染验收保持开放。                                                                                                                                                                                                                                                                                                                                     |

**首批采用边界明确。** [计划:14](D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:14) 限定 datasource、history、saved views 和预算行；[计划:107](D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:107) 保留旧导出和未采用模块。[计划:168](D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:168) 也明确承认采用切片的旧 GET expression 客户端需要升级，没有伪称其继续执行。

**职责总体可独立交付。** [H:303](D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:303) 将 Base、双仓工具、Ops backend、Ops frontend 顺序拆分；[J:335](D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:335) 给出文件归属。新增关联 ID 修复应归 Base audit owner，Root 继续负责治理链接。

## Root Cause

原始缺口来自旧单租户业务合同与新隔离要求之间的边界变化；旧 helper 明确不安装 tenant middleware：[route_groups.go:13](D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/contracts/route_groups.go:13)。

revision 2 已补齐大部分跨边界协议，但 E 将字符合法的关联 ID继续当作安全元数据，遗漏了其调用方来源；B 则残留旧 runner 的验收描述。

## Recommendations

1. **Base audit owner／Root — 小工作量，高影响：** 固定受保护路由的服务端关联 ID来源，补文件归属与 header sentinel 验证。
2. **Root／Base generator owner — 很小工作量：** 修正 L125，明确 v2 required 与 v1 legacy 的运行入口。
3. **Root — 治理衔接：** 修订后记录新哈希，回到原双 lane；之后按 H 的依赖顺序下发 Generator。

## Trade-offs

| 选择                         | 收益                                       | 成本                                  |
| ---------------------------- | ------------------------------------------ | ------------------------------------- |
| 采用路由使用服务端关联 ID    | 截断 header→audit/log 路径，保留未采用语义 | 采用路由不能继续原样传播调用方关联 ID |
| fresh read／现有授权模型快照 | 复用权威数据并发现撤销                     | 更多 DB／Redis 读取                   |
| candidate 与正式消费分开     | 发布前可验证配对实现                       | 增加工具证据，正式消费仍是独立 gate   |

**最强反论：** 多个 read port、registry、candidate 协议和启动 wrapper 可能把 O4 扩成第二套平台框架。  
**权衡张力：** 旧实现确实存在错误转 compat、会话角色快照和正式 release-only 装配限制，直接复用无法满足新要求。  
**综合方向：** 保留 additive adapters、现有授权模型、导出装配接缝和限定采用范围；本次只补关联 ID来源及 runner 矛盾，不扩大框架。

## References / 验证状态

已打开上述源码、适用 AGENTS、原始双 lane 报告及 revision 2；应用了 `impeccable` 的计划质量要求。未写文件、读取部署凭据、执行数据库／运行测试或产生渲染证据。

停止于交回本架构 lane 结论。**本结论不批准完整 P0、实现通过、runtime、视觉、发布或 consumer acceptance。**
