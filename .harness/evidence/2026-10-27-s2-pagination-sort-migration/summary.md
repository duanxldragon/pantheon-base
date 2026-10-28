# Summary — 2026-10-27-s2-pagination-sort-migration

## 波次目标

13 处分页 normalizer 与 8 个排序白名单 helper 收敛到 #450 落地的共享原语
（`common.NormalizePagination` / `common.NormalizeSort`），每模块保留自己的
默认值、cap 与白名单；role_helper.go 的两份逐字节拷贝收敛；排序方向语法
（#450 刻意留在 call site 的部分）逐模块保留。

## 改动清单（12 commits，每模块 normalizer + Offset 站点同 commit）

| Commit | 模块 | 内容 |
|---|---|---|
| c4b43866 | pkg/common | 分页/排序边界测试迁至 pagination_test.go + sort_test.go（packet expectedFiles.create） |
| b4281018 | role | 两份相同 clamp → 委托共享 helper（cap 100）；2 个 Offset 站点用 helper offset；排序白名单 → 包级 var + NormalizeSort |
| 62b7da49 | post | 同形收敛；1 个 Offset 站点 |
| 8efd05f3 | permission | 同形收敛；未知字段强制 id desc 显式保留；1 个 Offset 站点 |
| 68540b49 | user | 委托共享 helper；深翻页拒绝（>100000 行）保留在本地；4 返回值带 offset；anything-but-asc 方向语法保留 |
| 0da4345d | dict | 同形收敛（cap 用 maxDictItemPageSize）；ok 第三返回值由 `column != ""` 表达；孤儿常量删除 |
| e8086def | audit | 同形收敛（cap 用 maxOperationLogPageSize）；强制 id desc 显式保留 |
| a32ba03b | security | 分页收敛（无排序白名单） |
| 5f9236df | login | int 型 normalizer 精确匹配共享语义，直接委托 |
| 3706cdc6 | session | 同 login |
| 8ef469d9 | menu | 排序白名单收敛（树列表，无分页） |
| e7dee52f | dept | 排序白名单收敛（树列表，无分页） |

## 实测计数（base 958bc6ba → 本波）

| grep | before | after | 说明 |
|---|---|---|---|
| `sortWhitelist := map` 内联白名单 | 8 | **0** | 全部走 `common.NormalizeSort` + 包级 var |
| `pageSize > (100\|max*)` 钳制行 | 11 | **1** | 唯一残留 = setting_audit（语义例外） |
| `Offset((page-1)*pageSize)` 内联算式 | 14 | **4** | 残留 = setting_audit ×1 + tenant ×3（W9） |
| `common.NormalizePagination(` 调用 | 0 | 10 | 9 个模块 10 个适配器（role×2） |
| `common.NormalizeSort(` 调用 | 0 | 8 | 8 个排序适配器 |
| `func normalize*Page*` / `*Sort` 函数名 | 10 / 8 | 10 / 8 | 名称保留为 nil 安全适配器；clamp/查找实现已单一化（见下） |

**"一个实现"的口径**：packet 的可测目标是 "one pagination implementation and one sort
implementation"。钳制与白名单查找的实现现在是单一的（pkg/common 各一个）；模块里保留的
同名函数只是 nil 安全的字段提取适配器（role 两个 query 类型各一个，generics 无法读字段），
不含任何钳制/回退逻辑。setting_audit 与 tenant member 域是仅有的两处未收敛实现，理由如下。

## 显式例外（行为保留，未收敛）

1. **setting_audit.go:161-170（RC-028 部分）**：oversize（pageSize>100）回退到默认 10，
   而共享 helper 钳到 cap 100。两者对 `pageSize=150` 的响应不同（10 行 vs 100 行），
   属于 packet 说的 "genuinely disagree — preserved, not harmonised"。若维护者希望统一为
   钳制语义，是独立的行为变更决策。
2. **tenant member 域（tenant_service.go + tenant_ops_view.go + tenant_platform_handler.go）**：
   `normalizeTenantMemberPagination` 默认 pageSize=20 且带 maxPage 溢出钳制，无法用
   共享 helper（默认 10）表达而不改行为；且 tenant_service.go 是 doNotTouch（W9 租户域重写）。
   按 packet 注记整体留给 W9，届时随域重写一并收敛。

## 边界测试

- pkg/common/pagination_test.go + sort_test.go：零/负/超 cap/合法值/offset 推导/未知列/空白列/nil map。
- 各模块 pure test：nil、零值、合法值、cap 边界全部保留并补 offset 断言；排序白名单
  逐别名断言保留（role/post/permission/audit/user/menu/dept/dict）。
- 全量 `go test ./modules/... ./pkg/common/...`（含 DB 集成路径，PANTHEON_TEST_DSN）通过，
  覆盖 list 端点响应的 Page/PageSize 字段与 SQL 行为。

## 与 packet expectedFiles 的 drift

- `iam/post` 实际路径为 `org/post`（组织域此前已迁移）。
- `tenant_handler.go` 已在早前波次删除，其成员分页解析现居 tenant_platform_handler.go
  （同属上面的 W9 延期范围）。
- `user_service_pure_test.go`、`role_service_pure_test.go` 等测试文件因适配器签名
  增加 offset 返回值而同步更新（expectedFiles 未列出测试文件）。

## 验证

见 commands.json（gofmt / build / vet / 全量测试）与 response-diff.md（逐用例 before/after）。
