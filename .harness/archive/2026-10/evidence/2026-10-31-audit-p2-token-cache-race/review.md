# Review — 2026-10-31-audit-p2-token-cache-race

逐条对照 manifest `executionRoles.reviewerPosture`。

## 1. 修复前确有 DATA RACE 读数，修复后同一命令干净 — ✅

- 修复前：`go test -race -run 'TestTokenSessionCacheHandsOutCopies|TestTokenSessionCacheConcurrentSameTokenIsRaceFree'`
  → **2 处 WARNING: DATA RACE**，栈帧 `token_middleware.go:182`（读）/`:183`（写）/`:186`（写），
  两侧都是 `refreshTokenActivity`。
- 修复后：同目录同一命令 → `ok 1.117s`，DATA RACE 计数 **0**。
- 这两条读数用的是同一份用例、同一个命令，不是“换个更弱的断言让它变绿”。

## 2. 拷贝包含 RoleKeys 切片，没有把竞争搬到切片底层数组 — ✅

`cloneSessionData` 对 `RoleKeys` 做 `append([]string(nil), in.RoleKeys...)`。
判据不是“我写了这段代码”，而是 `TestTokenSessionCacheHandsOutCopies`：
修复前它红在 `mutating a returned RoleKeys slice changed the cached one: RoleKeys[0] = "hacked"`，
修复后绿。该用例不需要 `-race` 就能红，因此在**每一次** CI 运行中都有效，而不是只在 race 腿有效。

## 3. 没有在持锁期间做 Redis I/O — ✅

`touchTokenSessionCacheActivity` 只在写锁内做一次 map 读-改-写；Redis 调用
（`authtoken.RefreshSessionActivity`）在锁外、且在进锁之前完成。
锁的临界区是常数级，不会因为 Redis 抖动变成全局瓶颈。

## 4. 黑名单、空闲超时、撤销语义未变 — ✅

- `checkTokenBlacklist` / `enforceTokenIdleTimeout` / `invalidateTokenSessionCache` 一行未改。
- `refreshTokenActivity` 仍然只在“距上次活跃超过 1 分钟”时写，仍然只在 Redis 写成功后
  更新缓存（与修复前 `err == nil` 条件一致）。
- 缓存 TTL 默认值、10000 条上限清理、`PANTHEON_TOKEN_CACHE_TTL_SECONDS` 解析均未改。
- 公开面 `InvalidateTokenAuthCache` 签名未变；`lookupTokenSessionCache` 等三个函数
  经检索确认只在 `token_middleware.go` 内部使用，不构成包外契约。

## 5. 既有 middleware 测试无回归 — ✅

- `go test -race ./internal/middleware/` 整包 ok 5.5s（真实 MySQL + 真实 Redis 库 4）。
- `go test -short ./...` 全仓 0 FAIL。
- 顺带更新的 `TestTokenSessionCacheDisabledByZeroTTL` 是**因类型改变而必须改**的机械适配
  （`map[string]*tokenCachedSession` → 值类型），断言内容未放宽：仍要求 TTL 为 0 时
  `storeTokenSessionCache` 不写入、`lookupTokenSessionCache` 不命中。

## 反向检查：这条用例真的会红吗

会。修复前的同一条命令给出 2 处 DATA RACE 与一条 RoleKeys 断言失败——两半（内存可见性 +
切片共享）各自有独立读数。不存在“用例恒绿、只是实现碰巧对”的可能。

## 遗留（不在本包可关闭范围）

1. 竞争只在 `-race` 下可观测；CI 若去掉 race 腿，这条缺陷会静默回归。
2. 多实例 / Redis 抖动下的并发压力未验证，属 release 前集成测试。
3. 空闲超时时序没有独立断言，由既有 middleware 用例覆盖。

## Machine Readable

```json
{
  "taskId": "2026-10-31-audit-p2-token-cache-race",
  "verdict": "approved",
  "verdictRationale": "The defect is proven by measurement rather than by reading: before the change the same command reported two DATA RACE warnings whose stacks land on token_middleware.go:182/183/186 inside refreshTokenActivity, and after the change that command reports ok with zero races. Both halves of the defect have their own reading — the memory-visibility half is the race report, the aliasing half is TestTokenSessionCacheHandsOutCopies failing with RoleKeys[0] = \"hacked\" before the fix and passing after — so this is not a case of one assertion quietly standing in for two claims. The fix chose value copies over lock-held mutation because a copy removes the whole class (a caller can never reach the cache entry) while locking around the write only plugs today's field, and because holding the cache lock across RefreshSessionActivity would turn a per-request Redis round trip into a global bottleneck; touchTokenSessionCacheActivity keeps the critical section to a single map assignment and runs only after the Redis write succeeded, so the cache never claims activity the store does not have. Nothing on the security path was relaxed: blacklist fail-closed, idle timeout, revocation and the cache TTL/eviction policy are untouched, and the public InvalidateTokenAuthCache signature is unchanged. The one existing test that had to be edited was a mechanical adaptation to the map value type, and its assertions were not weakened. What this review does not claim: the race is only observable under -race, so a CI run without the race leg would let it regress silently, and no multi-instance or Redis-degraded stress test was run.",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-31-audit-p2-token-cache-race/manifest.json",
    "evidence": ".harness/evidence/2026-10-31-audit-p2-token-cache-race/commands.json",
    "reviewFile": ".harness/evidence/2026-10-31-audit-p2-token-cache-race/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-10-31.md",
      "docs/contracts/SYSTEM_AUTH_CONTRACT.md"
    ]
  }
}
```
