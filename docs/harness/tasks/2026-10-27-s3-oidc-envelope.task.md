---
title: S3 OIDC handler response-envelope classification packet
doc_type: Remediation
layer: system/auth
depends_on_layers: []
status: Active
linked_contracts:
  - docs/contracts/SYSTEM_AUTH_CONTRACT.md
  - docs/reviews/OIDC_RESPONSE_CONTRACT_2026-10-27.md
updated_at: 2026-10-28
---

# Task Packet: 2026-10-27-s3-oidc-envelope

## Goal

`backend/modules/auth/oidc/handler.go` writes six raw `c.JSON` responses instead of
using `common.Success` / `common.Fail`. That is either the same envelope drift the
tenant handler had, or a protocol contract that must stay raw. This wave is an
investigation whose deliverable is the classification: for each of the six
responses, name the protocol contract it belongs to, keep it raw with a comment
naming that contract, and move nothing onto the common envelope unless it is
provably a business endpoint. Result: all six are raw-shaped, each now carries a
contract comment, and the module is documented as dormant (no route registration,
no frontend consumer) so the future SSO wave knows the migration boundary.

## Primary Layer

system/auth

No other layer is touched; no response body, status, header or field name changes.

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `not-required`
- Release Requirement: `none`
- Downstream Sync Note: comments only; no behavioural or contract surface change.

## Dependency Layers

- `system/auth`（OIDC handler 本体）

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `auth-security`
- Portable Failure Class: `contract-misread`
- Owner Layer: `consumer-repository`
- Ratchet Decision: `no-repeat-observed`
- Coverage Dimensions:
  - behaviour
  - maintainability

交付层级：**L1**（分类结论 + 注释，无行为变化；evidence + review 收口）。

## Contract Anchors

- `docs/contracts/SYSTEM_AUTH_CONTRACT.md`（auth 层响应/会话边界）
- `docs/designs/AUTH_MODULE_DESIGN.md`（OIDC 流程设计）
- OIDC 协议本身：RFC 6749 §4.1.1（authorization 端点的 302 跳转）、§4.1.2.1（IdP 错误以
  redirect query 形式回传）
- `docs/reviews/OIDC_RESPONSE_CONTRACT_2026-10-27.md`（本波次交付的分类表）

## Scope

### In

- 六个 raw `c.JSON` 响应逐一对照协议契约分类（authorization redirect / callback
  business payload / discovery config）
- 每个保留 raw 的响应加一行注释点名所属契约
- 把分类表落成 `docs/reviews/OIDC_RESPONSE_CONTRACT_2026-10-27.md`

### Out

- 改变任何 OIDC 响应体、状态码、header 或字段名
- 改变 callback URL、state/nonce 处理或 token 校验
- 重构 OIDC 流程
- 触碰 IdP 配置
- 触碰 tenant handler 的 envelope（属独立 S2 包）

## Expected Files

### Create

- `docs/reviews/OIDC_RESPONSE_CONTRACT_2026-10-27.md`

### Modify

- `backend/modules/auth/oidc/handler.go`（仅注释）

### Do Not Touch

- `frontend/src/modules/auth/**`
- `backend/pkg/common/http/response.go`
- `backend/modules/system/iam/tenant/tenant_handler.go`

## Implementation Notes

- 默认保留。IdP 不是可以被要求改解析器的调用方；协议响应保持原样，除非能被证明是业务端点。
- 六个响应的分类（详见 review 文档）：
  1. `InitiateOIDCLogin` 500 —— 浏览器登录入口，无业务 envelope 语义
  2. `HandleOIDCCallback` 400（缺 code/state）—— IdP 回跳路径，调用方是浏览器/provider
  3. `HandleOIDCCallback` 401（认证失败）—— 同上
  4. `HandleOIDCCallback` 200（用户信息）—— 会话服务接入前的过渡业务负载
  5. `GetOIDCConfig` 200（disabled）—— 前端发现配置
  6. `GetOIDCConfig` 200（enabled）—— 前端发现配置
- 关键事实：该模块当前**未被路由注册**，前端也无消费者。因此默认保留零风险；分类表是给未来
  接入 SSO 时划定 envelope 迁移边界的依据。
- 运行态 gap 显式记录：无已配置 IdP，无法做登录 round-trip。

## Verification Plan

- `cd backend && go build ./...` → 0
- `cd backend && go test -count=1 ./modules/auth/...` → 全绿
- `grep -n "c.JSON" backend/modules/auth/oidc/handler.go` → 6 处，均带契约注释
- 运行态：无 IdP 配置 → 记录显式 gap，不伪造 round-trip

## Linkage

- Task ID: `2026-10-27-s3-oidc-envelope`
- Task Manifest: `.harness/tasks/2026-10-27-s3-oidc-envelope/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/harness/tasks/2026-10-27-codebase-simplification-program.task.md`、
  `docs/contracts/SYSTEM_AUTH_CONTRACT.md`
- Evidence Directory: `.harness/evidence/2026-10-27-s3-oidc-envelope/`
- Review File: `.harness/evidence/2026-10-27-s3-oidc-envelope/review.md`
- Parent: `docs/harness/tasks/2026-10-27-codebase-simplification-program.task.md`

## Evidence Required

- `.harness/evidence/2026-10-27-s3-oidc-envelope/commands.json`
- `.harness/evidence/2026-10-27-s3-oidc-envelope/classification.md`（每个 raw 响应一行）
- `.harness/evidence/2026-10-27-s3-oidc-envelope/summary.md`
- `.harness/evidence/2026-10-27-s3-oidc-envelope/review.md`

## Human Gates

- 若提出把 OIDC 端点迁到业务 envelope —— 需维护者确认；本波次默认保留。
- 运行态 round-trip 因缺 IdP 记 gap，由接入 SSO 的后续波次补齐。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] 六个 raw 响应全部分类
- [x] 每个保留 raw 的响应在注释中点名协议契约
- [x] OIDC 登录可用性：模块未注册路由、无 IdP → 运行态 gap 已记录
