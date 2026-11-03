---
title: token 会话缓存必须无数据竞争（AUD-026）
doc_type: Remediation
layer: platform
status: Archived
depends_on_layers: []
linked_contracts:
  - docs/contracts/SYSTEM_AUTH_CONTRACT.md
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-10-31
---

# Task Packet: 2026-10-31-audit-p2-token-cache-race

## Goal

`internal/middleware/token_middleware.go` 的会话缓存把 `*tokenCachedSession` **指针**交给调用方，
锁在返回时就释放了；随后 `refreshTokenActivity` 在**锁外**改写 `cached.data.LastActivityAt`，
`resolveTokenSession` 也把同一个 `cached.data` 直接交给下游。

同一 token 的并发请求会同时读写同一 `SessionData`，这是可复现的数据竞争。`go test -race`
没有捕获它，因为缺少“同 token 并发”的用例——**门禁不是失效，是没覆盖到**。

本包修掉竞争并补上那条缺失的并发用例，让 `-race` 真正能守住这块。

## Primary Layer

platform

## Dependency Layers

- `platform`（认证中间件的本地缓存）
- 不触碰 Redis 会话语义、黑名单语义或租户解析。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: none
- Release Requirement: foundation-release
- Downstream Sync Note: 纯内部实现修复，无 API 面变化；随下一次 foundation release 自然送达。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `concurrency-correctness`
- Portable Failure Class: `data-race`
- Owner Layer: `foundation-source`
- Ratchet Decision: `gate-updated`
- Coverage Dimensions:
  - behaviour
  - runtime-quality
  - maintainability

交付层级：**L2**（安全主链路中间件 + 需要 `-race` 运行证据）。

## Contract Anchors

- `docs/contracts/SYSTEM_AUTH_CONTRACT.md`：会话校验、撤销、空闲超时的语义边界（本包不改语义）。
- `docs/contracts/PLATFORM_CONTRACT.md`：共享面变更的可验证性要求。

## Scope

### In

- 消除共享可变状态：缓存命中时返回 `authtoken.SessionData` 的**值拷贝**（`RoleKeys` 切片需独立
  复制），或让 `refreshTokenActivity` 持锁改写缓存条目——二选一，判据是“调用方拿不到可被他人
  同时改写的指针”。
- 新增并发用例：同一 token 上 N 个 goroutine × M 次请求，在 `-race` 下必须干净通过；
  **先在修复前跑一次确认它报 `DATA RACE`**，作为负向证据。
- 修复 `refreshTokenActivity` 中“先改 `sessionData` 再改 `cached.data`”的双重写入：
  缓存条目与本次请求的会话视图不应共享同一块内存。
- 确认 `invalidateTokenSessionCache` 与 60s TTL、10000 条上限的清理逻辑在改动后仍成立。

### Out

- 修改 Redis 会话语义、黑名单 fail-closed 行为、空闲超时时长。
- 把缓存从内存换成 Redis 或其他方案。
- 调整 `PANTHEON_TOKEN_CACHE_TTL_SECONDS` 的默认值。
- 修改租户上下文或 Casbin 链路。
- 顺手优化中间件里的其他逻辑。

## Expected Files

### Create

- `docs/harness/tasks/2026-10-31-audit-p2-token-cache-race.task.md`
- `.harness/tasks/2026-10-31-audit-p2-token-cache-race/manifest.json`
- `.harness/evidence/2026-10-31-audit-p2-token-cache-race/{commands.json,summary.md,review.md}`

### Modify

- `backend/internal/middleware/token_middleware.go`
- `backend/internal/middleware/token_middleware_test.go`

### Do Not Touch

- `backend/pkg/authtoken/**`（会话编解码与 Redis 键语义）
- `backend/internal/middleware/tenant_context_middleware.go`
- `backend/internal/middleware/casbin_middleware.go`
- `backend/modules/auth/**` 的路由与 handler
- `VERSION`、`CHANGELOG.md`

## Implementation Notes

- 首选“返回值拷贝”：它一次性消除“调用方持有内部指针”这一类问题，而不是只堵住当前这一处写入。
  拷贝时要显式复制 `RoleKeys` 切片，否则只是把竞争从结构体搬到切片底层数组。
- 若选“持锁改写”，注意不要在持锁期间做 Redis I/O——`RefreshSessionActivity` 是网络调用，
  持锁会把这把锁变成全局瓶颈。
- 并发用例必须真的并发同一 token：不同 token 的并发不会触发这条竞争，写了等于没写。
- 先跑负向再跑正向：负向读数（`DATA RACE` 栈）是“这条用例确实有效”的唯一证明。
- 不要顺手改空闲超时或黑名单逻辑：它们是 fail-closed 的安全语义，与本缺陷无关。

## Verification Plan

- 负向：`cd backend && go test -race -run TestTokenSessionCacheConcurrent ./internal/middleware/ -count=1`
  → 修复前必须报 `DATA RACE`
- 正向：同命令修复后干净通过
- `cd backend && go test -short ./internal/middleware/...`（既有用例不回归）
- `cd backend && go vet ./...`、`go build ./...`
- `node scripts/harness/check-evidence.mjs --root . --strict`

## Linkage

- Task ID: `2026-10-31-audit-p2-token-cache-race`
- Task Manifest: `.harness/tasks/2026-10-31-audit-p2-token-cache-race/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-10-31.md` §5.5、`docs/contracts/SYSTEM_AUTH_CONTRACT.md`
- Evidence Directory: `.harness/evidence/2026-10-31-audit-p2-token-cache-race/`
- Review File: `.harness/evidence/2026-10-31-audit-p2-token-cache-race/review.md`

## Evidence Required

- `commands.json`：修复前的 `DATA RACE` 栈（完整片段）、修复后的干净读数、既有测试回归读数
- `summary.md`：为什么选值拷贝而非持锁改写、`RoleKeys` 切片的拷贝处理、为何现有 `-race` 门禁没抓到
- `review.md`：逐条 reviewer posture

## Human Gates

- 修改安全主链路中间件需一位非作者复核，确认未放宽 fail-closed 行为。
- 若为消除竞争而调整缓存策略（例如缩短 TTL），需说明对撤销时效的影响。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] 并发用例在修复前报 DATA RACE、修复后干净
- [x] 调用方无法获得可被并发改写的共享指针
- [x] 黑名单/空闲超时/撤销语义未变

## Execution Result

**状态：completed（2026-11-01）。**
证据：`.harness/evidence/2026-10-31-audit-p2-token-cache-race/`。

### 先红后绿

| 阶段 | 命令 | 读数 |
| --- | --- | --- |
| 修复前 | `-race -run 'TestTokenSessionCacheHandsOutCopies\|TestTokenSessionCacheConcurrentSameTokenIsRaceFree'` | **FAIL，2 × DATA RACE**：`:182` 读 / `:183` 写 / `:186` 写，栈帧均在 `refreshTokenActivity`；另有 `RoleKeys[0] = "hacked"` 断言失败 |
| 修复后 | 同一条命令 | `ok 1.117s`，0 DATA RACE |
| 整包 | `-race ./internal/middleware/` | `ok 5.535s` |
| 全仓 | `go test -short ./...` | 0 FAIL |

### 改了什么

`tokenSessionCache` 的 map 值与 `tokenCachedSession.data` 都从指针改为值；
新增 `cloneSessionData` 显式复制 `RoleKeys`；`storeTokenSessionCache` 落库时也拷贝；
新增 `touchTokenSessionCacheActivity` 在写锁内同步活跃时间（持锁期间无 Redis I/O）；
`resolveTokenSession` 命中时把副本交给本次请求。

### 没改什么

黑名单 fail-closed、空闲超时时长、撤销路径、缓存 TTL 与 10000 条上限清理、
`PANTHEON_TOKEN_CACHE_TTL_SECONDS` 解析、公开面 `InvalidateTokenAuthCache` 全部未动。

### 显式 gap

1. 竞争只在 `-race` 下可观测；CI 的 race 腿是内存可见性这半边的唯一守门人。
2. 多实例 / Redis 抖动的并发压力未验证，属 release 前集成测试。
3. 空闲超时时序没有独立断言，由既有 middleware 用例覆盖。
