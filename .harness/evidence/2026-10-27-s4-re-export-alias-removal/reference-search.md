# Per-symbol reference search — S4 alias removal `2026-10-27-s4-re-export-alias-removal`

Fresh measurement on branch `refactor/s4-re-export-alias-removal-2026-10-27`
(2026-10-28, base = merged #446),口径 identical to the S4 decision doc
(`grep -rlE "common\.<Sym>\b"` over `backend --include=*.go` excluding
`re_export.go` itself, and over `../pantheon-ops/backend`). The S4 baseline
(2026-10-27) is quoted for comparison — kept-alias counts moved slightly with
the tenant waves merged since; **every doomed alias is still 0/0**.

| 别名 | base（本次） | base（S4） | ops（本次） | ops（S4） | 处置 |
|---|---|---|---|---|---|
| Fail | 25 | 26 | 48 | 48 | 保留 |
| Success | 22 | 22 | 44 | 44 | 保留 |
| FailWithError | 16 | 17 | 37 | 37 | 保留 |
| GetRequestID | 4 | 4 | 4 | 4 | 保留 |
| Response | 2 | 3 | 5 | 5 | 保留 |
| FailWithCode | 2 | 2 | 5 | 5 | 保留 |
| InitSecurityConfig | 1 | 1 | 1 | 1 | 保留 |
| SuccessWithStatus | 1 | 1 | 1 | 1 | 保留 |
| **SetAccessTokenCookie** | 0 | 0 | 0 | 0 | **删除** |
| **SetCSRFCookie** | 0 | 0 | 0 | 0 | **删除** |
| **SetRefreshTokenCookie** | 0 | 0 | 0 | 0 | **删除** |
| **ClearTokenCookies** | 0 | 0 | 0 | 0 | **删除** |
| **ValidateRequiredProductionSecret** | 0 | 0 | 0 | 0 | **删除** |
| **DefaultDevSecrets** | 0 | 0 | 0 | 0 | **删除** |
| **GenerateRandomSecret** | 0 | 0 | 0 | 0 | **删除** |
| **IsProductionEnv** | 0 | 0 | 0 | 0 | **删除** |
| **ResolveSecret** | 0 | 0 | 0 | 0 | **删除** |
| **FailWithData** | 0 | 0 | 0 | 0 | **删除** |

口径备注：S4 的表里 `Fail` 26→本次 25、`FailWithError` 17→16、`Response` 3→2，
差异来自 #440–#446 合并后文件集变化（如 W8 删除了使用 `common.FailWithData`
的 legacy handler 文件——该文件用的是裸名，不改变零消费结论；计数口径为
文件数，以本次实测为准）。

## 被删除的声明形态

十个别名均为 type/const/func 声明式再导出（非包装逻辑）：四个 cookie 函数
（`SetAccessTokenCookie` / `SetRefreshTokenCookie` / `ClearTokenCookies` /
`SetCSRFCookie`，随 `net/http` import 一并移除）、五个 security 再导出
（`DefaultDevSecrets` var、`IsProductionEnv` / `ResolveSecret` /
`ValidateRequiredProductionSecret` / `GenerateRandomSecret`）、一个响应函数
（`FailWithData`）。底层函数在 `pkg/common/http` / `pkg/common/security`
原样保留（doNotTouch 未触碰）。

## 恢复路径

删除的是单行声明；未来若出现真实消费者，从定义包恢复一行别名即可
（S4 决策 §1：keep-and-check 对不存在的消费者无意义）。
