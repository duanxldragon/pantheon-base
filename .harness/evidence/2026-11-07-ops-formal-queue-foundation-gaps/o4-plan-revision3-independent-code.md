## Code Review Summary

**REQUEST CHANGES — 仍有 1 HIGH，仅针对实现计划。**

Revision3 SHA256 两次核对一致：

`aaa4544cc80ae351b9fd499cd8e8d644f5e0413877708e273b493427d41399c0`

复核范围：revision2→3 差异、两份保留的 CODE 报告及相关源码；未重审已接受的 A–G 设计。

| 原 finding                                 | Delta 结论                                                                                                                                                                                                                               |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HIGH1：TokenAuth 重新创建失效 token        | 新链自身已解决；跨旧路由共享写入仍未解决                                                                                                                                                                                                 |
| HIGH2：客户端 correlation ID 进入审计/日志 | 计划层解决：[L224](D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:224) 明确最早匹配、服务器 UUID、无 header fallback，并补齐测试            |
| LOW：v2 验收使用旧 runner                  | 解决：[L127](D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:127) 改为真实生成 Init→required runner                                          |
| 原 dirty-bootstrap HIGH                    | 计划层解决：[F3 L295](D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:295) 明确入口/写入边界拒绝、保留 dirty、readiness 与实际 migrator 验收 |

**[HIGH] 保留的旧 activity writer 仍可使失效 token 被新入口接受。**

[计划 L95](D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:95) 保留 `RefreshSessionActivity` 原样。实际旧 [`GET /api/v1/auth/login-tenants`](D:/workspace/go/pantheon-platform/pantheon-base/backend/modules/auth/module.go:85) 使用同一 Redis token：请求先读到有效 payload，随后 token 到期／被单独删除，旧 [activity refresh](D:/workspace/go/pantheon-platform/pantheon-base/backend/internal/middleware/token_middleware.go:261) 再通过 [TTL fallback＋无条件 SET](D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/authtoken/token.go:173) 重建它。新请求或 provider 完成后的 fresh-check 此时看到有效 payload＋正 TTL。

SQL [ApplyActiveScope](D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/authsession/session_scope.go:22) 检查的是 refresh-session 期限、撤销及 idle；不能证明原 access token 尚未到期。**影响限定于 access-token 到期／单独删除；并不证明能绕过 SQL 撤销或持续存在的 blacklist。** 不调用旧链的隔离 fixture 无法覆盖此交错。

**最小修复建议：** Root/ARCH 冻结一个窄的共享 writer 安全修复前置项：原子检查 key 存在且 PTTL>0，再更新并保留 TTL；失效／store error 显式失败，禁止补发 TTL 或重建 key。保留旧导出、路由链和缓存默认值。若 writer 必须原样保留，则需明确新入口如何取得不受其覆盖的权威失效依据。补充旧路由与新 entry/release-check 并发的回归要求。

其余 delta 的源码接缝可行；新增 API 无需现在存在。未修改文件或执行运行验收；`lsp_diagnostics`／`ast_grep_search` 不可用，本轮没有代码批准。复核止于上述明确阻断项，不构成 P0、runtime、release、consumer、visual 或架构终裁批准。
