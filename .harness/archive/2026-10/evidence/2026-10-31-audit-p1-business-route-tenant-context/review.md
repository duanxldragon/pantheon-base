# 复核记录：业务域租户语义（AUD-002 / 方案 C）

对照任务包 `executionRoles.reviewerPosture` 逐条自查。复核人：本轮执行者（自审）；决策本身由维护者拍板（选 C）。

## 1. 决策记录是否明确回答了"业务表有没有 tenant_id、multi 模式下业务路由会怎样"

**通过。** `decision.md` §1 用表格给出两条硬读数：业务域 `TenantID` 命中 **0**、`tenant_id` 命中 **1**（且是 `retired_modules_test.go:110` 的 DDL 夹具，非模型字段）；§2 方案 A 那一行直接回答"multi 模式下会怎样"——`TENANT_CONTEXT_MISSING`，业务域全量 500。没有含糊表述。

## 2. 所选方案与 `TENANT_CONTRACT_V1` 条款是否逐字一致，helper 注释是否不再暗示已处理租户

**通过。** 合同 §2.6 的四条事实与 `decision.md` §1 一一对应；§7 表格的"V1 内不适用"与 §1 Out 的新条目指向同一结论。`route_groups.go` 三个函数现在都有注释，且第一条就是"It deliberately does NOT install a tenant-context middleware"，并写明"不要用追加 `TenantContextMiddleware` 的方式修它"及其后果（multi 下 500 且过滤不掉任何东西）。改动前该文件 25 行、零注释，是"读起来像已处理租户"的根源。

## 3. 是否引入第二条隐式入口

**通过（未新增入口）。** 本次只改注释与测试，未改任何 `r.Group(...)` 调用形态，未新增路由。`MODULE_CONTRACT.md §10` 明确写了"给这两个助手追加租户中间件属合同变更，不是缺陷修复"，即把"绕过 helper 手写链路"的边界也钉在文档里。

## 4. `pkg/tenant` 与租户中间件是否未被改动，DataScopeMiddleware 的 fail-closed 行为是否未放宽

**通过。** `backend/pkg/tenant/**`、`internal/middleware/tenant_context_middleware.go`、`data_scope_middleware.go` 均不在变更列表。本次唯一碰的中间件相关代码是 `route_groups.go` 的注释。

## 5. 与 entry-doc-truthfulness 包的改动是否重叠

**通过（有意识地调整了分工）。** 原设计是"W2 定语义、W3 写 README"，但 `README.md:31` 同一句里既有"完整数据隔离"（本包结论）又有"配额强制"（W3 的 AUD-003）。分两次改会让中间态自相矛盾，因此本包整行改完，并在 W3 任务文档里把该行标记为"已由 W2 处置"。现在同一段落只有一个包负责。

## 6. 额外自查

**6.1 新测试是否是真门禁而不是永远绿？** 已做负向验证：注入 `TenantContextMiddleware` → 测试 FAIL 并报 `chain length = 3 ..., want 2`；还原 → PASS。失败信息里带 §2.6 引用。

**6.2 测试是否过脆？** 断言的是"函数名包含 TokenAuthMiddleware / CasbinMiddleware / DataScopeMiddleware"和"不包含 TenantContextMiddleware / PlatformScopeTenantContextMiddleware"，不是完整符号名。Go 内联会让符号变成 `contracts.ProtectedGroupWithRedis.TokenAuthMiddleware.func1`，`strings.Contains` 仍成立——负向验证的实际输出证明了这一点。

**6.3 合同变更性质是否被夸大？** 没有。V1.10 标注为 **Clarification**，不是 Extension：没有新增错误码、没有改 §3 解析优先级、没有改 §4 Casbin 维度、没有改任何写侧行为。唯一的"缩小"是 §7 表格一行从"按矩阵登记"改为"V1 不适用"，而矩阵里本来就没有业务表——这是承认现状，不是新设约束。

**6.4 EN 版是否与 CN 版一致？** 是。§1 Out、§2.6、§7 行、§9 行四处同步；并补了一条翻译注记，说明 V1.7–V1.9 的变更记录行只存在于中文版（这是既有事实，不是本次造成的）。

**6.5 是否误伤下游？** 否。ops 的 14 处调用点无需改动——本次只改注释、测试与文档，`ProtectedGroup`/`DataScopedGroup` 的签名与行为完全不变。ops 下次 `rebuild:from-base` 会把注释与测试一并带过去，其 `pkg/contracts` 测试将开始执行这两个新断言（只依赖 gin，不依赖 DB/Redis）。

## 结论

**通过。** 冻结门槛第 2 项（"业务域租户语义有明确结论并落到合同 + README"）已满足：结论在 §2.6，合同、`MODULE_CONTRACT`、README 三处口径一致，且有负向验证过的测试兜底。

## Machine Readable

```json
{
  "taskId": "2026-10-31-audit-p1-business-route-tenant-context",
  "verdict": "approved",
  "structuralReview": {
    "affectedSubgraph": [
      "docs/contracts/TENANT_CONTRACT_V1.md (§1 Out, new §2.6, §7 row, §9 V1.10)",
      "docs/contracts/TENANT_CONTRACT_V1.en.md (mirrored)",
      "backend/pkg/contracts/route_groups.go (doc comments only, zero behaviour change)",
      "backend/pkg/contracts/route_groups_test.go (new middleware-chain ratchet)",
      "docs/designs/MODULE_CONTRACT.md §10 (two bullets)",
      "README.md:31 (single-line correction)"
    ],
    "checks": ["sensitive-flow", "call-depth"],
    "findings": [
      "P2: only the base repository changes here. pantheon-ops consumes the foundation as a source copy, so its own pkg/contracts/route_groups.go and its 14 business call sites (13 DataScopedGroup + 1 ProtectedGroup) keep the old comments and shape until the next npm run rebuild:from-base.",
      "P3: docs/contracts/TENANT_RESOURCE_SCOPE_MATRIX.md §3 still carries a reserved biz_* row reading 'register per table on creation / per review', which can be misread as 'business tables must be registered'. Contract §2.6 now explains it is a V2 entry point, but annotating the matrix row itself is left to W5.",
      "P3: route_groups_test.go only pins the base copy of the helpers; it cannot stop a downstream copy from being edited independently - that is shared-drift's job.",
      "P3: no end-to-end request was issued. The change is the absence of one middleware, and observing that in a running stack requires a multi-mode fixture with a tenant-bearing counter-example; the negative injection test (inject TenantContextMiddleware, chain length assertion fails) carries that weight instead."
    ],
    "notes": "AUD-002 was originally framed as a possible cross-tenant leak. Reading the actual call chain end to end showed the business domain has zero tenant modelling (no tenant_id column, no TenantID field, 0 hits outside one DDL test fixture), so nothing leaks - the defect is that README.md:31 claimed 'complete data isolation' while the code never modelled it, and that the contract was silent on the question. Reframed as a documentation/contract gap and settled as option C: business domains do not participate in tenant isolation in V1. The clause had to be written precisely: TENANT_RESOURCE_SCOPE_MATRIX.md §2 lists no business table, and the §3 biz_* row is a V2 entry point, not a current registration requirement. Appending TenantContextMiddleware to ProtectedGroup would not create isolation (no tenant column to filter on) and would turn every business request into TENANT_CONTEXT_MISSING in multi mode, so the ratchet test asserts the chain contains neither TenantContextMiddleware nor PlatformScopeTenantContextMiddleware. Negative verification: injecting TenantContextMiddleware makes TestProtectedGroupChain report 'chain length = 3 (...), want 2'; restoring returns ok. Gates: task-packet exit 0, frontmatter 415/295, doc-links 0 findings, doc-inventory 0 findings, structure/encoding/generated/adoption/template/sync 0 findings, duplication PASS, go build and go vet exit 0, go test -short ./... 0 FAIL."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-31-audit-p1-business-route-tenant-context/manifest.json",
    "evidence": ".harness/evidence/2026-10-31-audit-p1-business-route-tenant-context/commands.json",
    "reviewFile": ".harness/evidence/2026-10-31-audit-p1-business-route-tenant-context/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/contracts/TENANT_CONTRACT_V1.md",
      "docs/contracts/PLATFORM_CONTRACT.md",
      "docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-10-31.md"
    ]
  }
}
```
