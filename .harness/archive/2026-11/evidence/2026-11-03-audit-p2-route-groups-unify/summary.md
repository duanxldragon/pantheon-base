# Summary — 2026-11-03-audit-p2-route-groups-unify

ARCH-01 闭环：`system_modules.go` 的 15 条手写中间件链收敛到
`pkg/contracts/route_groups.go` 的四个助手，链的组装只剩一处。

## 新增助手（`backend/pkg/contracts/route_groups.go`）

| 助手 | 链 | 用在哪 |
|---|---|---|
| `SystemTokenGroup` | TokenAuth | `/system/refresh/state`（认证但不是 console） |
| `SystemAuthGroup` | TokenAuth → PlatformScopeTenantContext | 上传读/写（需要租户上下文，不做 Casbin 路由鉴权） |
| `SystemProtectedGroup` | TokenAuth → PlatformScopeTenantContext → Casbin `[→ PlatformCapability]` `[→ DataScope]` `[→ RefreshSync]` | 其余全部系统 console |
| `SystemGroupOptions.WithCapability()` / `.WithDataScope()` | — | 三个差异维度显式声明在调用点 |

选项是值语义（返回副本），并有单测钉住「builder 不污染接收者」，避免一个模块的
`Capability: true` 泄漏到下一个组。

## 行为等价对照（原链 → 现调用）

| 原链 | 现调用 | 处数 |
|---|---|---|
| TokenAuth | `SystemTokenGroup` | 1 |
| TokenAuth + PlatformScope | `SystemAuthGroup` | 2（uploadProtected / systemAuth） |
| TokenAuth + PlatformScope + Casbin | `SystemProtectedGroup(deps, false)` | 3（dict / setting / audit） |
| + RefreshSync | `SystemProtectedGroup(deps, true)` | 6（user / menu / role / permission / dept / post） |
| + DataScope + RefreshSync | `.WithDataScope()` | 1（user 的 list/export） |
| + PlatformCapability + RefreshSync | `.WithCapability()` | 1（tenant console） |
| + PlatformCapability（无 RefreshSync） | `.WithCapability()` | 1（i18n console） |

顺序保持原样：Casbin 先授权，再 Capability，再 DataScope 收窄行，最后 RefreshSync；
`RefreshSync` 在末尾意味着被拒绝的请求不会广播刷新信号。

## 两层防漂移

1. `pkg/contracts/route_groups_system_test.go` 逐个组合钉死 handler 顺序与数量（6 个 case）。
2. `modules/system/system_modules_route_groups_test.go` 读源码：`.Group(routeGroupSystem).`
   与 `.Use(middleware.` 必须 0 命中，且三个助手必须真的被调用 —— 既防重新手写，也防「删路由蒙混过关」。

## 读数

`go build` / `go vet` exit 0，`gofmt -l` 无输出，`go test ./... -short` 47 ok / 0 FAIL；
`grep Group(routeGroupSystem).` 0 命中，`contracts.SystemProtectedGroup(` 12 处。
