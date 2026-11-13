## Code Review Summary

**REQUEST CHANGES：revision 2 仍有两个安全执行阻断项。** 本结论仅针对计划进入实现。

**Files Reviewed:** 1 份目标计划、2 份原始独立评审，以及相关 Base/Ops 源码与装配入口。  
**Total Issues:** 3 — CRITICAL 0、HIGH 2、MEDIUM 0、LOW 1。

计划 SHA256 两次核对一致：`a338352f99779d8c1635a2aafa6939dc6e628389ee83aa6e64c032669c4a9da5`。

### Issues

**1. [HIGH] 后置 fresh-check 无法识别旧 TokenAuth 已重新创建的 token。**

计划：[L89](/D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:89)、[L91](/D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:91)。

实际 TokenAuth 在进入 `RefreshPrincipal` 前调用 [refreshTokenActivity](/D:/workspace/go/pantheon-platform/pantheon-base/backend/internal/middleware/token_middleware.go:261)。其底层 [RefreshSessionActivity](/D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/authtoken/token.go:173) 在 TTL 读取失败或 token 已消失时，改用完整 `AccessTokenTTL` 并执行 `SET`。

因此，token 在初次读取后、activity refresh 前过期或被删除时，旧分支可能重新创建它。只要 SQL session、用户和绑定仍有效，后续 fresh-check 会看到重新创建后的有效 token，无法保留原始失效证据。这与新增入口的失败关闭承诺冲突。

**最小修复：** 冻结一个 opt-in 认证入口，避免在首次可信校验前执行旧 activity 写入；如需更新时间，使用原子的“仍存在且 TTL 有效”条件更新，禁止重新创建或补发 TTL。保留旧导出默认行为。加入删除/到期发生于读取与更新之间的回归验收，要求 token 不复活，provider/history 调用为零。

**2. [HIGH] 审计保留的 request ID 仍是客户端可控文本。**

计划：[L218](/D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:218)、[L222](/D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:222)。

[RequestContextMiddleware](/D:/workspace/go/pantheon-platform/pantheon-base/backend/internal/middleware/request_context_middleware.go:21) 接受 `X-Request-ID`／`X-Trace-ID`，仅检查长度和字符；64 字符十六进制 token 同样合法。该值随后进入 [操作审计 RequestID](/D:/workspace/go/pantheon-platform/pantheon-base/backend/internal/middleware/operation_log_middleware.go:256) 和 [错误日志](/D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/common/http/response.go:106)。

关闭正文捕获后，这条 header→审计/日志通道仍存在，无法满足 L226 的 header sentinel 零泄露要求。

**最小修复：** 对受保护策略，在 request-context 注入及日志关联前生成服务器 correlation ID，或使用独立的服务器审计 ID 并排除不可信 header。将对应源码、测试纳入 handoff inventory；覆盖 canonical/alias 的 CSRF、认证、限流和 provider 失败。字符白名单不能证明内容不含秘密。

**3. [LOW] 生成运行验收指定了错误 runner。**

计划：[L125](/D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:125) 仍要求 tenant v2 经过 `RegisterBackendModules`，与 L123 的 required runner 决定冲突。旧 runner 确实会 [Warn 后继续](/D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/contracts/module.go:118)。

**最小修复：** v2 验收调用真实生成的 Init→`RegisterRequiredBackendModules`；legacy v1 单独验证旧 runner。此项是非阻断性的 handoff 修正。

### 原始问题复核

新版已在计划层落实严格模式读取、真实绑定租户与 provenance、合法权限键、独立候选 producer/resolver、retained-down wrapper、停止旧进程及 shape-verified dirty recovery。审计正文保护和授权复核也明显补强，但仍受上述 HIGH 项阻断。

原 ARCH 的 guard 回收、purge 锁序、不可变 saved-view source、required bootstrap/direct-export 问题已有具体协议。Provider POST/Tempo、分布式许可与 MySQL 形状仍需实现后验证；目前未发现这些项新增了必须先猜测才能实施的歧义。

### Validation and Recommendation

实际检查了 Git diff/status、CodeGraph CLI 和上述源码；没有修改文件或读取凭据配置。未执行 MySQL、Redis、provider、浏览器或类型验收。`lsp_diagnostics`／`ast_grep_search` 未提供，目标也是 Markdown 计划；本轮没有给出 Stage 2 代码批准。

**Recommendation: REQUEST CHANGES。** 将两个 HIGH 项的最小修复交回 Root／ARCH 冻结后复核，再进入 Generator。架构终裁仍由 ARCH lane 出具；完整 P0、发布、运行态、视觉及正式 consumer 验收继续开放。
