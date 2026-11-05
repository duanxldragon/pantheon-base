# Summary — 2026-10-31-audit-p2-token-cache-race

覆盖 AUD-026（wave W7）。读数见同目录 `commands.json`，逐条 reviewer posture 见 `review.md`。

## 缺陷

`TokenAuthMiddleware` 的 60 秒会话缓存把内部指针交给了调用方，并在锁外改写共享内存：

1. `lookupTokenSessionCache` 在 `RLock` 下返回 `*tokenCachedSession`，锁在函数返回时就释放了；
   调用方此后拿到的指针不再受任何保护。
2. `resolveTokenSession` 直接 `return cached.data`——同一个 token 的并发请求拿到的是
   **同一个 `*authtoken.SessionData`**。
3. `refreshTokenActivity` 在锁外写 `sessionData.LastActivityAt`（`token_middleware.go:183`），
   同时 `enforceTokenIdleTimeout` 在读同一个字段；它还通过 `cached.data.LastActivityAt`
   （`:186`）在锁外写缓存条目本身。

影响面限于活跃时间戳（空闲超时判定可能偏移），不构成越权，但它是可复现的内存安全缺陷：
`go test -race` 在修复前报 **2 处 DATA RACE**，栈帧落在 `:182`（读）/`:183`（写）/`:186`（写）。

## 门禁为什么没抓到

不是 `-race` 失效，而是**没有用例真的并发同一个 token**。既有用例只覆盖“TTL 为 0 时缓存不写入”，
单 goroutine 顺序执行，任何共享指针都不会被两个线程同时触碰。缺陷因此长期存在且不可见。

## 修复选择：值拷贝，而不是持锁改写

任务包给了两条路：缓存命中时返回值拷贝，或持锁改写缓存条目。选前者：

- 值拷贝一次性消除“调用方持有内部指针”这一整类问题；持锁改写只堵住当前这一处写入，
  下一个往 `SessionData` 上加字段的人会重新引入同一个洞。
- 持锁改写还要在锁内调用 `RefreshSessionActivity`（Redis 往返），这把锁会变成全局瓶颈；
  虽然可以选择“先写 Redis 再进锁”，但那只是把值拷贝方案换个写法。

落地：

- `tokenSessionCache` 由 `map[string]*tokenCachedSession` 改为 `map[string]tokenCachedSession`，
  结构体的 `data` 字段由指针改为值——返回结构体副本时不可能再指回 map 里的条目。
- 新增 `cloneSessionData`：**显式复制 `RoleKeys` 切片**。只做结构体拷贝是不够的，
  切片头会继续指向同一个底层数组，等于把竞争从结构体搬到切片（修复前的
  `TestTokenSessionCacheHandsOutCopies` 正是红在这一点：`RoleKeys[0] = "hacked"`）。
- `storeTokenSessionCache` 落库时也拷贝一份，避免调用方后续写入反向污染缓存。
- 新增 `touchTokenSessionCacheActivity`：缓存条目的活跃时间同步在写锁内完成，
  且**持锁期间不做任何 Redis I/O**（只有一次 map 赋值）。
- `resolveTokenSession` 命中时把副本的地址交给本次请求，后续 blacklist / idle timeout /
  activity refresh / gin context 全部只碰这份私有内存。

## 未改变的行为

- 缓存 TTL（默认 60s）、10000 条上限清理、`invalidateTokenSessionCache` 的调用点全部不动。
- 黑名单 fail-closed 语义、空闲超时时长、撤销路径不改一行。
- 缓存条目只在 Redis 写成功后更新（与修复前 `err == nil` 的条件一致），不会出现
  “缓存声称活跃、存储里没有”的分叉。
- 公开面 `InvalidateTokenAuthCache` 签名不变。

## 读数

| 项 | 修复前 | 修复后 |
| --- | --- | --- |
| `-race` 同 token 并发用例 | **FAIL，2 × DATA RACE**（`:182/:183/:186`） | ok，0 DATA RACE |
| `TestTokenSessionCacheHandsOutCopies` | FAIL（RoleKeys 被改穿） | PASS |
| `-race ./internal/middleware/` 整包 | — | ok 5.5s |
| `go test -short ./...` 全仓 | — | 0 FAIL |
| `go build ./...` / `go vet` | — | exit 0 |

## 显式 gap

- 竞争只在 `-race` 下可观测。普通 `go test` 即使实现有缺陷也会通过——CI 的 race 腿是
  这条缺陷唯一的守门人。
- 真实部署下的并发压力（多实例、Redis 抖动）未验证；本轮只证明单进程内同 token 并发
  不再共享内存。
- 空闲超时判定依赖缓存条目活跃时间的新鲜度；语义未变，但没有为它单独新增时序断言，
  由既有 middleware 用例覆盖。
