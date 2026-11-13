## Summary

**Architectural Status: `CLEAR` — revision4 implementation plan delta only.** 没有剩余的增量架构阻断项。v4 将共享旧 activity writer 的原子安全修复纳入 Base auth 前置项，关闭 revision3 CODE HIGH 的计划缺口；新业务 entry / authorization / release checkpoint 继续采用 fresh、只读认证。

目标计划 SHA256 在开始读取和完成源码交叉检查后两次一致：`9aaa0e53b43c040a4d04949693d3ef6ab4b086336fe953c3e04105400e4caaf7`。保留 v3 SHA256 为 `aaa4544cc80ae351b9fd499cd8e8d644f5e0413877708e273b493427d41399c0`，与 prior CODE/ARCH 记录一致。

## Analysis

1. **纠正 prior ARCH 的遗漏。** prior ARCH 将业务链不调用 activity writer 视为已关闭 token 复活问题（[prior ARCH:15][arch15]），但保留 v3 明确让共享 `RefreshSessionActivity` 原样保留（[v3:95][v395]）。CODE 的反例成立：旧 `/auth/login-tenants` 实际仍使用 TokenAuth（[auth module:85][auth85]）；该链先加载 payload，再调用 activity refresh（[TokenAuth:250][token250]、[TokenAuth:261][token261]）。共享 writer 的 TTL 失败/非正值回退和无条件 SET 会重建已删除或已到期的 access-token key（[token.go:173][ttl173]）。因此，即使新链读取实时 Redis，也可能读取到被旧链重新创建的有效 key。

2. **问题边界准确。** 这是原 access token 到期/单独删除后的复活，不能据此声称可绕过 SQL session 撤销或持续存在的 blacklist（[prior CODE:22][code22]）。`ApplyActiveScope` 判断 `revoked_at`、`refresh_expires_at` 和 idle，而非原 access-token 的截止时间（[session_scope.go:22][scope22]）。v4 仍要求独立 fresh blacklist、SQL session、user 和 identity 检查（[plan:89][p89]），没有用 writer 修复替代它们。

3. **v4 对共享写入点的修复足以关闭该 HIGH 的计划缺口。** [plan:95][p95] 明确要求同一个 Redis Lua 原子操作检查已有 key、正 PTTL、当前 identity/原始 bytes 条件，更新时保留剩余毫秒级到期时间；missing/expired/persistent/store failure 显式失败，禁止 fallback TTL 和重建 key。删除/到期先发生时 writer 拒绝；安全 writer 先完成时不延长原到期时间，随后删除仍删除该 key。不同 session 的替换 payload 不被旧请求覆盖。它补上的是共享权威存储的写入安全，而不只是新路由自身不写入。

4. **最小 ownership/interface 可实施。** writer 已有 `context.Context`、`*redis.Client`、token、`*SessionData` 和 error 返回值（[token.go:165][writer165]）；payload 已提供 UserID、SessionID、TenantID（[token.go:71][identity71]）。可在 writer 内读取当前原始 payload、以 Go 精确核对这些身份字段，再让 Lua 对该原始 bytes 做条件比较并原子检查 PTTL/更新；无需改变公开签名或新增 Ops 端认证存储。仓库已使用同一 go-redis 的 `redis.NewScript`、context-bound Run 和毫秒到期命令（[rate_limit_middleware.go:76][lua76]、[rate_limit_middleware.go:94][lua94]）。v4 把 token.go/token_test.go 和旧中间件交错测试明确交给 Base auth Generator，并要求 root 纳入 inventory/双 lane receipts（[plan:95][p95]、[plan:375][p375]）。`StoreSession` 保持独立 issuance 路径（[token.go:125][issue125]）。

5. **失败语义与新旧链边界一致。** 现有旧 wrapper 只有 writer 成功才同步 cache activity，失败后仍按 best-effort 继续旧请求（[token_middleware.go:209][best209]、[token_middleware.go:261][token261]）。因此 writer 返回显式错误不要求把旧鉴权链整体改成拒绝，也不代表旧缓存授权问题全部消失。新业务入口无 cache/activity 写入且要求 fresh token/identity 校验（[plan:95][p95]），outbound 与 provider 完成后的释放继续重新 Authorize（[plan:101][p101]），符合本次窄修复边界。

6. **验收要求覆盖遗漏的跨路由交错。** [plan:95][p95] 包含旧 route 读取后删除/到期、无 TTL、不同 identity 替换、store/cancellation failure、live-key 毫秒 TTL 不延长，以及旧 activity 与新 entry/release-check 的交错；不再仅靠隔离的新中间件 fixture。实现时按 checkpoint 区分断言：entry/pre-outbound 拒绝应为零 provider call；provider 已完成才失效的 release 场景应拒绝结果/history 释放，而不可能撤回已经发生的 provider call。这由既有 [plan:101][p101] 的时间顺序和 [plan:103][p103] 的 blocked-provider 用例明确限定，属于测试落地澄清，不构成计划 blocker。

7. **两处文本差异已澄清。** migration 段落改为 F4（[plan:293][p293]），dirty-bootstrap 描述明确区分历史 baseline、并行 guard 的 scoped verification 与尚待独立终审（[plan:295][p295]）。本轮仅确认措辞，不重新评判或批准该实现。

## Root Cause

prior ARCH 的判断把新请求自身只读等同于共享 Redis access-token 权威不会被旧请求修改。真正根因是旧 writer 将 activity 更新同时变成了无条件 token issuance：TTL 失效时补发 AccessTokenTTL，再 SET（[token.go:173][ttl173]）。新 reader 的 freshness 无法识别这个被重建的 key；v4 必须同时约束共享 writer 与维持新业务 fresh 读取（[plan:95][p95]）。

## Recommendations

1. **Base auth Generator — bounded implementation, high security impact:** 按 v4 实现原子 conditional activity update；保留现有签名/issuance/旧路由与 cache 默认值，以明确 error 表达 unsafe update 拒绝。root 将 [plan:375][p375] 的源码/测试与同哈希双 lane 结论接入既有 handoff；无须增加认证模型或改写 A–G。
2. **Owning test lane — low clarification effort, high regression value:** 让旧 route 实际经过共享 writer，用可控交错证明 missing/expiry/replacement 不会复活/覆盖且 live key 的原截止时间不延长；将 entry 零 provider call 与 completion-release 零结果/history 释放分开断言（[plan:95][p95]、[plan:101][p101]）。复用已有真实 Redis 测试入口（[token_test.go:14][test14]）；required 模式可防止缺 Redis 被误记为通过（[testredis/redis.go:31][required31]）。这些是既有计划的实施建议，无需先产出 runtime 才给计划结论。

## Architectural Status

`CLEAR` — implementation plan delta only. Prior CODE HIGH is closed at plan level; this independent ARCH verdict does not substitute for the revision4 CODE lane.

## Trade-offs

| Option                                                           | Pros                                                | Cons                                                                                                                                   |
| ---------------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| v3: only new business chain is fresh/read-only                   | 新路由不产生 activity 写入                          | 共享旧 writer 仍可重建 token，新 fresh read 也会接受；不可保留作为修复方案（[v3:95][v395]、[token.go:173][ttl173]）                    |
| v4: narrow shared atomic writer + fresh/read-only business chain | 同时保护已有 writer 和新 checkpoint；复用接口和依赖 | 增加 Lua/条件失败测试；旧 activity 失败继续 best-effort，O4 query 不延长活动时间（[plan:95][p95]、[token_middleware.go:209][best209]） |

## Validation / Stop Condition

已只读核对 v3→v4 diff、保留 v3、prior ARCH/CODE、相关 token/route/session 源码及现有 Lua/Redis 测试接缝，目标哈希首尾两次一致。未重播 accepted A–G；未要求实施目标 API 预先存在；未执行测试、DB/provider/runtime/浏览器验证。唯一新增输出是本报告；没有产品、计划、ledger、lock 编辑，没有凭证读取、委派、模型变更或 publication。

止于交回本次独立 ARCH 增量 verdict。`CLEAR` 不构成 source execution authorization、实现通过、P0、runtime、release、consumer 或 visual approval；后续停点仍依 [plan:333][p333] 与 [plan:375][p375]。

## References

[arch15]: /D:/workspace/go/pantheon-platform/pantheon-base/.harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/o4-plan-revision3-independent-arch.md:15
[code22]: /D:/workspace/go/pantheon-platform/pantheon-base/.harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/o4-plan-revision3-independent-code.md:22
[v395]: /D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan-v3.md:95
[p89]: /D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:89
[p95]: /D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:95
[p101]: /D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:101
[p103]: /D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:103
[p293]: /D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:293
[p295]: /D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:295
[p333]: /D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:333
[p375]: /D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:375
[identity71]: /D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/authtoken/token.go:71
[issue125]: /D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/authtoken/token.go:125
[writer165]: /D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/authtoken/token.go:165
[ttl173]: /D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/authtoken/token.go:173
[best209]: /D:/workspace/go/pantheon-platform/pantheon-base/backend/internal/middleware/token_middleware.go:209
[token250]: /D:/workspace/go/pantheon-platform/pantheon-base/backend/internal/middleware/token_middleware.go:250
[token261]: /D:/workspace/go/pantheon-platform/pantheon-base/backend/internal/middleware/token_middleware.go:261
[auth85]: /D:/workspace/go/pantheon-platform/pantheon-base/backend/modules/auth/module.go:85
[scope22]: /D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/authsession/session_scope.go:22
[lua76]: /D:/workspace/go/pantheon-platform/pantheon-base/backend/internal/middleware/rate_limit_middleware.go:76
[lua94]: /D:/workspace/go/pantheon-platform/pantheon-base/backend/internal/middleware/rate_limit_middleware.go:94
[test14]: /D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/authtoken/token_test.go:14
[required31]: /D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/testredis/redis.go:31
