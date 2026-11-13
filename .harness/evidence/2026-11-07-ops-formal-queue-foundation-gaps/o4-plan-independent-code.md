## Code Review Summary

**REQUEST CHANGES：授权范围符合要求，但计划尚不具备直接执行条件。**

**Files Reviewed:** 1 个目标计划，另核对其引用的 Base/Ops 合同、源码和装配脚本。  
**Total Issues:** 7 — CRITICAL 0、HIGH 5、MEDIUM 2、LOW 0。

Stage 1 已核对：保留“扩展 Base 业务租户合同，同批完整隔离”的授权；没有退回 actor-only。执行合同仍有下列缺口，根因守卫也未通过，因此不进入常规质量批准。架构取舍交回 architect；本报告只给出代码、合同、安全和可执行性证据。

### Issues

**1. [HIGH] 复用的模式读取器会把故障降级为 compat。**

计划：[L50](/D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:50)。源码：[membership.go:112](/D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/tenant/membership.go:112)、[tenant.go:218](/D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/tenant/tenant.go:218)。

`NewSettingModeLoader` 把配置读取错误转成 `compat`，`Load` 又将未知值归一为 compat。非 nil 检查无法识别这些失败，后续解析可能落到 tenant0，跳过 positive-tenant membership 检查。这直接违反 opted-in 边界的故障拒绝要求。

**最小修复／归属：** Base 增加错误感知的模式读取入口，复用 SettingService；旧入口保持兼容，新业务边界在读取失败、非法模式时拒绝。先证明“已启用 multi 后读取失败”不会访问 tenant0、调用 provider 或写入历史，再下发 Ops 实现。

**2. [HIGH] 路由隐私守卫晚于全局审计和 CSRF 拒绝。**

计划：[L150](/D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:150)。源码：[main.go:143](/D:/workspace/go/pantheon-platform/pantheon-base/backend/cmd/server/main.go:143)、[operation_log_middleware.go:236](/D:/workspace/go/pantheon-platform/pantheon-base/backend/internal/middleware/operation_log_middleware.go:236)、[csrf_middleware.go:65](/D:/workspace/go/pantheon-platform/pantheon-base/backend/internal/middleware/csrf_middleware.go:65)。

实际顺序是全局审计捕获 body → CSRF → API/业务中间件 → O4 路由守卫。缺少 CSRF 的 POST 会在守卫执行前退出；审计回退不会遮蔽普通 `query` 字段，非法 JSON 还可能原样保留。仅在 O4 group 设置 audit override 无法关闭此泄露路径。

**最小修复／归属：** Base 提供在全局审计捕获前生效的精确 route/method 隐私策略或前置守卫扩展点；Ops 在启动时登记 canonical 与 alias 的 adopted 方法。保留动作、状态和安全 ID，避免原始请求/响应进入回退载荷。验证必须覆盖 CSRF、API 限流、幂等、认证、绑定和超限拒绝，不能只测试 handler 内失败。

**3. [HIGH] 新 Base 候选没有现成的合法 consumer staging 入口。**

计划：[L180](/D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:180)、[L195](/D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:195)。源码：[rebuild-from-base.mjs:661](/D:/workspace/go/pantheon-platform/pantheon-ops/scripts/business-overlay/rebuild-from-base.mjs:661)、[check-shared-drift.mjs:155](/D:/workspace/go/pantheon-platform/pantheon-ops/scripts/business-overlay/check-shared-drift.mjs:155)。

实际 CLI 只有 `--target`、`--manifest`；拒绝 `--base`，始终解析正式 lock。drift CLI 同样拒绝本地 Base／替代 lock。v0.18.6 commit 中没有新 tenant helper，也没有当前 permission registry。现有 release bundle 构建器还拒绝不属于 manifest commit 的共享源码改动。

**最小修复／归属：** Coordinator 先补候选装配子任务。可复用的真实入口是 [assembleConsumerTree:612](/D:/workspace/go/pantheon-platform/pantheon-ops/scripts/business-overlay/rebuild-from-base.mjs:612) 和 [checkSharedDrift:14](/D:/workspace/go/pantheon-platform/pantheon-ops/scripts/business-overlay/check-shared-drift.mjs:14)，但必须由明确的候选验证适配器提供经过校验的源码快照、内容哈希和 candidate 身份。不能直接传本地目录冒充正式快照。当前 lock、正式消费校验保持原状；候选入口完成并独立评审后，Ops 才能进入配对构建。

**4. [HIGH] 重新授权端口缺少会话有效性和授权租户来源。**

计划：[L58](/D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:58)、[L90](/D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:90)。

源码显示：

- [TokenAuth](/D:/workspace/go/pantheon-platform/pantheon-base/backend/internal/middleware/token_middleware.go:219) 使用 session RoleKeys；黑名单检查发生在请求入口。
- [UserService.GetUserRoles](/D:/workspace/go/pantheon-platform/pantheon-base/backend/modules/system/iam/user/user_service.go:134) 查询用户 owning tenant；[GetUserRolesForTenant](/D:/workspace/go/pantheon-platform/pantheon-base/backend/modules/auth/login/login_runtime.go:328) 才支持目标 membership tenant。
- [DataScope](/D:/workspace/go/pantheon-platform/pantheon-base/backend/internal/middleware/data_scope_middleware.go:181) 按 resolved tenant 读策略；平台 override 的全局角色绑定不能简单按该租户查询。
- [ValidateSession](/D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/authtoken/token.go:138) 本身不检查撤销黑名单。

仅重新读取 actor 的 action/DataScope，不能发现 provider 阻塞期间的 session 撤销；也不足以区分 membership 请求与平台 header override。

**最小修复／归属：** Base 固定端口输入和授权来源：可信 actor/session、claim、resolution provenance、资源 tenant、具体 action。复用当前用户状态、会话撤销、角色绑定、策略和 membership/lifecycle 检查；明确绑定租户与资源租户。Ops 在出站及响应释放点调用，失败不得释放结果或追加历史。补“角色策略仍有效但绑定被移除”“session 被撤销但角色未变”“多 membership／平台 override”阻塞 provider 用例。

**5. [HIGH] retained-down 后的旧 binary 禁止措施没有可执行归属。**

计划：[L160](/D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:160)。源码：[main.go:116](/D:/workspace/go/pantheon-platform/pantheon-base/backend/cmd/server/main.go:116)、[migrate.go:144](/D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/database/migrate.go:144)。

默认迁移路径已会拒绝数据库当前版本在旧 migration source 中不存在的情况。但 retained-down 将版本降回旧版本后，这个保护消失；AutoMigrate 模式也跳过版本迁移。新 binary 的 readiness 检查无法保护已经运行或后来启动的旧 binary。

**最小修复／归属：** Coordinator 明确独立于新 binary 的启动／部署兼容检查，根据保留 schema 能力标记拒绝旧 executable；不能只看迁移版本。允许 positive-tenant 写入前必须停止旧实例。Ops 实现 schema readiness，集成验收覆盖正常版本、retained-down、AutoMigrate 和旧进程并存。

**6. [MEDIUM] 所列权限键无法通过当前 registry。**

计划：[L108](/D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:108)。源码：[registry.go:26](/D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/permissionroutes/registry.go:26)。

`query_history`、`saved_view` 含下划线，而 registry 的 permission pattern 禁止下划线；登记会返回 `ErrInvalid`。

**最小修复／归属：** Coordinator 与 Ops 统一为合法键，例如 `query-history`、`saved-view`，同步 DTO、seed、i18n、前端和权限测试。无需扩大 registry 路径或权限校验范围。这是实施阻断项，修订成本较小。

**7. [MEDIUM] SQL 幂等重放不能自动恢复正式迁移器的 dirty 状态。**

计划：[L158](/D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:158)。正式链：[migrate.go:144](/D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/database/migrate.go:144)。项目实际依赖 v4.17.1 的 `Up` 在 dirty 时直接返回，尚未读取迁移 SQL。

**最小修复／归属：** Ops 补明确的中断恢复程序和 Coordinator 操作顺序：保留 dirty 证据、检查已完成 DDL 与已知索引形状、独占恢复、验证完整目标状态后才调整该迁移状态。未知形状继续拒绝；禁止全局自动 `Force`。测试必须经过正式迁移器中断／恢复，而非只有 SQL `Exec` 重放。

### 已解决的归属与实施边界

- **幂等中间件归 Ops。** 实际文件是 [business/opsinit/idempotency_middleware.go:34](/D:/workspace/go/pantheon-platform/pantheon-ops/backend/modules/business/opsinit/idempotency_middleware.go:34)，且 `business-overlay.json:55` 声明该目录。精确 O4 route/method 豁免可以在此实现；无需 Base 共享 override。豁免必须在读取、保存 hostile header 前生效。
- **Datasource／alerts／后台凭证边界方向正确。** 保留 tenant0 alerts，替换 evaluator 的裸 ID 凭证读取；所有 alias、引用、删除检查和异步状态写都必须使用显式 owner/revision。响应释放重新授权仍受问题 4 阻断。
- **Compiler 信任边界方向正确。** 仓库评审 catalog、严格 typed recipe、拒绝任意字符串及 provider label 值，符合原要求。Tempo GET 兼容路径仅可在明确版本边界、非秘密编译常量、保留失败证据且双路径有测试时接受；实际协议仍未验证。
- **Actor+tenant quota 必须保留。** 预算锚点应在同一事务内创建并锁定，所有增删／清理共用锁顺序；Redis 双层许可需保证获取失败不留下半份许可、释放只影响自己的许可、过期不提前突破实际并发上限。可选简化是先保留预算锚点、采用浅层 catalog；这些不替代隔离或预算要求。
- **Generator bootstrap 验收不能只观察回调。** [module.go:118](/D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/contracts/module.go:118) 会记录 seed/bootstrap 错误后继续。运行验收需检查真实列、索引和 A/B 操作，并证明 bootstrap 失败不会被当作成功就绪。

### 验证与 Recommendation

独立执行了本地 Base 输入的 rebuild 拒绝路径，以及权限格式检查；结果支持问题 3、6。其余结论来自实际合同和源码。未执行 MySQL、Redis、race、provider 或浏览器验收；以前 receipts 不计为本轮独立执行。

目标是 Markdown 计划，没有已实现的 O4 文件可做类型批准。`lsp_diagnostics`、`ast_grep_search` 工具未提供；Stage 2 未通过或被宣称通过。UI 尚未实施，未产出新渲染证据，视觉验收开放。

**Recommendation: REQUEST CHANGES。** Architect/Coordinator 修订以上归属与顺序后再下发 Generator。范围仍是同批 Base 合同、datasource、history/view 的 tenant+actor 隔离；正式发行消费、其余 O4 标准和最终功能／视觉验收保持开放。本轮未修改文件、lock、baseline，也未提交或发布。
