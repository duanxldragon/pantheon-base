# Summary — 2026-11-03-audit-p1-pagination-data-consistency

FE-01 / FE-02 闭环：前端不再直发 `pageSize: 9999` / `1000`，改为按固定 100 分页聚合取全量。
后端 `NormalizePagination(..., 100)`、接口、契约一行未改。

## Helper 设计

`frontend/src/shared/utils/fetchAllPages.ts`

```ts
fetchAllPages<T>(fetchPage: (page, pageSize) => Promise<{ items: T[]; total: number }>,
                 pageSize = 100, maxPages = 200): Promise<T[]>
```

- 终止（双条件，任一命中）：`items.length < pageSize`（短页，含 `total === 0`）或 `all.length >= total`。
- `maxPages = 200`（2 万行）兜底：total 失真/后端恒返满页时**抛错**而非返回截断集——静默截断正是本包要消灭的失败模式。
- `pageSize` 与后端 cap 对齐（100），每次请求都拿满一页，页数最少。
- 调用方保持既有 `sortField` / `sortOrder` / `status` 过滤与 `resolveRouteWarmData` 包装；warm-data 缓存键不变，仅 loader 内部由单次请求变为聚合。

单测 `frontend/tests/unit/shared/utils/fetchAllPages.test.ts`（5 例）：单页放得下、多页聚合、正好在 total 边界停、空结果、触顶 maxPages 抛错（后端谎报 total 的死循环场景）。

## 5 处调用点替换对照

| # | 文件 | 原调用 | 审计项 | 现调用 |
|---|---|---|---|---|
| 1 | `iam/user/useUserList.ts` `loadRoles` | `getRoleList({page:1, pageSize:9999, sort, status:1})` | FE-01 | `fetchAllPages((page,pageSize)=>getRoleList({page,pageSize,sort,status:1}))` |
| 2 | `iam/user/useUserList.ts` `loadDeptAndPostOptions` | `getPostList({page:1, pageSize:9999, sort, status:1})` | FE-01 | `fetchAllPages((page,pageSize)=>getPostList({page,pageSize,sort,status:1}))` |
| 3 | `org/dept/DeptList.tsx` `loadOrgData` | `getPostList({page:1, pageSize:orgChartPageSize(1000), sort})` | FE-02 | `fetchAllPages(...)`，`orgChartPageSize` 常量删除 |
| 4 | `org/dept/DeptList.tsx` `loadOrgData` | `getUserList({page:1, pageSize:1000, sort username})` | FE-02 | `fetchAllPages(...)` |
| 5 | `org/dept/index.ts` warm-data | `posts:org-chart` / `users:org-chart` 各 `pageSize:1000` | FE-02 | 两处 `fetchAllPages(...)` |

`DeptList.tsx` 的禁用分支由 `Promise.resolve({items:[],total:0,page:1,pageSize})` 改为 `Promise.resolve([] as PostRow[] / UserListRow[])`，与 helper 的返回形状一致；`OrgTab` 的 `.length` 计数现在取自聚合后的全量数组。

## 第 6 个文件（与 manifest expectedFiles 的基线差异）

工作区基线已有 `frontend/src/modules/system/iam/user/index.ts` 的未提交改动：这是 useUserList 同一 `roles:active` / `posts:active` warm-data key 的 module 级 loader（`useUserList.loadRoles/loadDeptAndPostOptions` 经 `resolveRouteWarmData` 直接读它）。只改 `useUserList.ts` 而漏掉此处，W1 的首屏下拉仍会被截断到 100 行，所以该文件一并替换为 `fetchAllPages`。它只接受显式 `type: "modify"` 清单内的文件，未列入 `iam/user/index.ts`，此处显式记录，审阅时可一票否决。

## 验证读数

见 `commands.json`：eslint exit 0、vitest 33 files / 218 tests 全绿、`grep pageSize: 9999|1000` 0 命中、`go build ./...` exit 0。
`tsc -b` 与 `eslint .` 均 exit 0；类型面另有 `noUnusedLocals/noUnusedParameters` 把关，替换后无残留符号。
