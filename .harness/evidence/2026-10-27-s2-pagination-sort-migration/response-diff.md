# Response Diff — 2026-10-27-s2-pagination-sort-migration

## 方法

每个模块的边界行为在改动前用一次性 probe 测试（`TestZZPaginationSortProbe`，run 后删除）实测捕获，
保存于 `capture-before/normalizers.txt`。改动后同一组边界值由各模块 pure test 断言
（migration commit 同时更新了这些断言并加入 offset 断言），全部通过。
列表响应的 `Page`/`PageSize` 字段直接取自这些 normalizer 的返回值（响应组装代码本波未触碰，
diff 仅涉及 normalizer 内部与 `Offset(...)` 实参），因此 normalizer 级等价即响应字段级等价；
DB 集成测试（全量 `go test ./modules/...`，含各 list 端点）在改动前后均通过。

各模块 cap/默认值一览（改动前实测 = 改动后断言）：默认 page=1、默认 pageSize=10、cap=100
全数一致（tenant member 域为默认 20，见 summary 的 W9 延期说明）。

## 分页 before → after（probe 实测 → pure test 断言）

| 模块 | 用例 | before | after | 一致 |
|---|---|---|---|---|
| role (list) | nil / zero / negative | (1, 10) | (1, 10, offset 0) | ✓ |
| role (list) | page=3, size=25 | (3, 25) | (3, 25, offset 50) | ✓ |
| role (list) | size=10000 / size=100 | (1, 100) | (1, 100, …) | ✓ |
| role (member) | nil / zero / oversize 200 | (1, 10) / (2, 100) | 同 before + offset | ✓ |
| post | nil / zero / oversize 10000 | (1, 10) / (1, 100) | 同 before | ✓ |
| permission | nil / zero / oversize 999 | (1, 10) / (1, 100) | 同 before | ✓ |
| user | nil / zero / 3,20 / oversize 200 | (1,10) / (3,20) / (1,100) | 同 before | ✓ |
| user | page=1002, size=100 | 400 param.page.too_large | 同 before（本地深翻页拒绝保留） | ✓ |
| dict | nil / zero / oversize 500 | (1, 10) / (1, 100) | 同 before | ✓ |
| audit | nil / zero / oversize 250 | (1, 10) / (1, 100) | 同 before | ✓ |
| security | nil / zero / negative / oversize 10000 | (1, 10) / (1, 100) | 同 before | ✓ |
| login | 0,0 / −5,−1 / 3,25 / 1,500 | (1,10) / (3,25) / (1,100) | 同 before | ✓ |
| session | 0,0 / 3,500 | (1, 10) / (3, 100) | 同 before | ✓ |
| setting_audit | —（本波不改，语义例外见 summary） | page=1, size=10, oversize 回退 10 | 不变 | ✓ |
| tenant member | —（W9 延期，doNotTouch） | 默认 20 + maxPage 溢出钳制 | 不变 | ✓ |

## 排序 before → after（probe 实测 → pure test 断言，全部不变）

| 模块 | 用例 | before | after |
|---|---|---|---|
| role | nil | (id, desc=true) | 同（nil 分支保留） |
| role | empty / padded / 注入串 | (id, false) | 同 |
| role | createdAt asc / DESC / 非法 order | (created_at, false/true/false) | 同 |
| post | nil / empty / 注入串 / asc / DESC | (id,true)/(id,false)/(created_at,false)/(created_at,true) | 同 |
| permission | nil / empty / 注入串 | (id, true)（强制 desc） | 同（显式保留） |
| permission | path asc / DESC | (v1, false/true) | 同 |
| user | nil / empty / asc / desc / 非法 order / 注入串 | (id,true)/(id,true)/(created_at,false)/(username,true)/(id,true)/(id,true) | 同（anything-but-asc 语法保留） |
| dict | nil / empty / 注入串 | ("", false, ok=false) | 同 |
| dict | itemLabelKey asc / sort DESC | (item_label_key, false, ok=true) / (sort, true, ok=true) | 同 |
| audit | nil / empty / 注入串 | (id, true)（强制 desc） | 同（显式保留） |
| audit | operTime asc / DESC | (oper_time, false/true) | 同 |
| menu | nil / empty / 注入串 / title asc / id DESC | (sort,false)…(id,true) | 同 |
| dept | nil / empty / 注入串 / deptName asc / sort DESC | (sort,false)…(sort,true) | 同 |

## 结论

- 所有被替换模块的分页与排序边界行为逐用例等价；响应字段来源未变。
- 三个模块的独有语义被显式保留：permission/audit 未知字段强制 id desc、user 的
  anything-but-asc 方向语法与深翻页拒绝、dict 的 ok 第三返回值。
- setting_audit（oversize 回退 10 而非钳到 100）与 tenant member 域（默认 20，doNotTouch/W9）
  未替换，行为与改动前逐字节相同。
