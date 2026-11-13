## Code Review Summary

**APPROVE — 仅针对 revision4 实施计划的 CODE 增量可行性。**

**Files Reviewed:** 7 个核心文件（当前计划、保留 v3、前次 CODE 报告及 4 个源码接缝；其他治理/ARCH/哈希元数据仅作上下文）。
**Total Issues:** 0。
**By Severity:** CRITICAL 0 / HIGH 0 / MEDIUM 0 / LOW 0。

### Scope and identity

当前计划 SHA256 在审查前、审查后各核验一次，均精确匹配：

`9aaa0e53b43c040a4d04949693d3ef6ab4b086336fe953c3e04105400e4caaf7`

保留 v3 SHA256 为 `aaa4544cc80ae351b9fd499cd8e8d644f5e0413877708e273b493427d41399c0`，与前次 CODE 报告一致。

仅审查 v3→v4 差异和上一轮确认的跨链 access-token 过期/单独删除漏洞；沿用已接受 A–G，未重播其设计审查。系统域 auth 的共享 writer 是安全前置项，平台业务新入口继续只读/fresh；不扩大 Ops 业务实现归属。

### Stage 1 — Spec compliance

**PASS。** [计划:95](../../tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:95) 不再要求共享 `RefreshSessionActivity` 原样保留，而是明确：

- Redis Lua 原子要求 key 存在且 PTTL>0，再条件更新；保留剩余毫秒 TTL。
- 比较当前 payload 身份或原始 bytes，防止覆盖另一会话。
- missing/expired/persistent key、store/cancellation failure 显式失败；禁止 AccessTokenTTL 回退或重建 key。
- 旧导出签名、路由/缓存默认值保持，StoreSession 仍为独立签发路径。
- 覆盖旧读取后过期/删除、无 TTL、替换 payload、失败、活 key 不延长 TTL，以及旧 activity 与新 entry/release-check 的交错回归。

[计划:375](../../tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:375) 补齐 Base auth Generator 的 token.go/token_test.go 和旧 middleware 回归归属；双 lane 计划评审仍是 tenant 执行前置条件。已独立授权的共享安全修复不必等待本轮完成运行验收。

[计划:293](../../tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:293) 将重复 F3 改为 F4；[计划:295](../../tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:295) 将 dirty-bootstrap 旧观察标为历史，并保留独立最终评审要求。两项均未把并行实现当作当前验收通过。

### Root-cause guard and delta feasibility

**PASS；revision3 剩余 HIGH 在计划层关闭。**

原漏洞有可定位的共享接缝：[旧 login-tenants:85](../../../backend/modules/auth/module.go:85) 使用旧 TokenAuth；[TokenAuth:261](../../../backend/internal/middleware/token_middleware.go:261) 调用 [activity:212](../../../backend/internal/middleware/token_middleware.go:212)，最终进入 [writer:165](../../../backend/pkg/authtoken/token.go:165)。读取后 token 到期/单独删除时，旧 [TTL fallback + 无条件 SET:173](../../../backend/pkg/authtoken/token.go:173) 可复活 key。[SQL active scope:22](../../../backend/pkg/authsession/session_scope.go:22) 只检查 refresh-session 期限、撤销和 idle，无法替代原 access-token 失效依据。

v4 把修复放在这个共享 writer 中，而不是仅绕开新入口的 activity 写入。原子 writer 先于删除执行，则后续删除仍生效；删除/过期先发生，则 writer 拒绝，不能重建；不同身份替换也被条件检查拒绝。现有签名和 SessionData 身份字段足以承载该实现，Lua 与现有 Redis client 可复用，计划没有新增依赖要求。缺少计划中的新 API 不构成矛盾。

新业务链保持 [只读/fresh:91](../../tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:91)，并在 [结果/history 释放前重验:101](../../tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:101)。回归应分别证明入口拒绝时零 provider 调用，以及已阻塞 provider 返回后拒绝结果/history 释放。该计划不承诺撤回已经释放的字节，也不将旧 middleware 的授权缓存行为纳入本次全面改写。

本轮看到的 writer 源码仍属未修复基线。这不影响实施计划可行性结论，也不证明另一个 Generator 的当前实现已正确或错误。没有新增吞错分支、补发路径或以 fallback 掩盖主契约失败的方案。

### Stage 2 — Validation limits

完成只读 git status/diff、v3→v4 no-index diff、保留报告/合同核对、CodeGraph context 和具体源码接缝读取。CodeGraph CLI 可用但未提供 explore 子命令，未执行 index/sync。

`lsp_diagnostics` / `ast_grep_search` 在本会话不可用；未运行类型诊断、测试、MySQL/Redis/provider 或浏览器验收。本次目标是 Markdown 实施计划，未批准任何代码，也未要求计划中的 API 或运行证据预先存在。

### Recommendation and stop condition

**APPROVE for implementation plan（CODE lane only）。** 没有剩余实质 CODE/spec/security 计划矛盾。交回协调者，由独立 ARCH lane 作其设计裁决，并按已有前置顺序交给拥有者实施。

止于本次独立计划增量报告。未修改产品、计划、ledger、lock 或既有 receipt；无凭据访问、委派、模型切换或发布。本结论不构成实现、P0、runtime、release、consumer、visual 或合并批准。

## Linkage

- Task ID: `2026-11-07-ops-formal-queue-foundation-gaps`
- Task Packet: `docs/harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps.task.md`
- Task Manifest: `.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/manifest.json`
- Plan: `.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md`
- Baseline: `.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan-v3.md`
- Prior Review: `.harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/o4-plan-revision3-independent-code.md`
- Evidence Directory: `.harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/`
- Review File: `.harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/o4-plan-revision4-independent-code.md`
- OpenSpec Change: `none`

## Machine Readable

```json
{
  "taskId": "2026-11-07-ops-formal-queue-foundation-gaps",
  "reviewLane": "CODE",
  "reviewType": "implementation-plan-delta",
  "revision": 4,
  "verdict": "APPROVE",
  "approvedScope": "implementation-plan-feasibility-only",
  "planSha256": "9aaa0e53b43c040a4d04949693d3ef6ab4b086336fe953c3e04105400e4caaf7",
  "planHashChecks": { "count": 2, "bothMatch": true },
  "baselineSha256": "aaa4544cc80ae351b9fd499cd8e8d644f5e0413877708e273b493427d41399c0",
  "specCompliance": "PASS",
  "rootCauseGuard": "PASS",
  "remainingMaterialIssues": [],
  "severityCounts": { "CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0 },
  "priorHigh": "closed-at-plan-level-by-shared-atomic-no-resurrection-writer-prerequisite",
  "lspDiagnostics": "unavailable; no code approval",
  "astGrepSearch": "unavailable; no code approval",
  "runtimeEvidence": "not-executed-and-not-required-for-plan-verdict",
  "implementationApproval": false,
  "p0Approval": false,
  "runtimeApproval": false,
  "releaseApproval": false,
  "consumerApproval": false,
  "visualApproval": false,
  "linkage": {
    "taskPacket": "docs/harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps.task.md",
    "taskManifest": ".harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/manifest.json",
    "plan": ".harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md",
    "evidenceDirectory": ".harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/",
    "reviewFile": ".harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/o4-plan-revision4-independent-code.md",
    "openspecChange": "none"
  }
}
```
