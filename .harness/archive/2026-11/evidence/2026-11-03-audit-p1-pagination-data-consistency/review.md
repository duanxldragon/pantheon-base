# Review — 2026-11-03-audit-p1-pagination-data-consistency

## Reviewer posture（逐条）

| 检查项 | 结论 | 依据 |
| --- | --- | --- |
| 没有「降 cap 糊弄」 | 通过 | 5 处调用点均改为 `fetchAllPages` 循环翻页，无一处把 `9999/1000` 直接改成固定 `100` 后保留单发；固定 `pageSize=100` 只出现在 helper 的翻页参数里 |
| helper 双终止条件 | 通过 | `items.length < pageSize`（短页，同时覆盖 `total === 0`）与 `all.length >= total`，任一命中即返回 |
| helper 页数上限保护 | 通过 | `maxPages = 200`，触顶**抛错**而非返回截断集；有单测 `throws when maxPages is reached` |
| 单测覆盖边界 | 通过 | 5 例：单页放得下 / 多页聚合 / total 边界停 / 空结果 / 上限抛错 |
| 5 处调用点全部替换 | 通过 | `useUserList.loadRoles`（roles:active）、`useUserList.loadDeptAndPostOptions`（posts:active）、`DeptList.loadOrgData`（posts/users:org-chart）、`dept/index.ts` warm-data（posts/users:org-chart）；`grep -rnE "pageSize: ?(9999|1000)" frontend/src` 0 命中 |
| 额外改动（`iam/user/index.ts`）已声明 | 见偏离 1 | manifest `expectedFiles.modify` 未列该文件，summary 显式记录原因，审阅可一票否决 |
| 后端 cap / 接口 / 契约零改动 | 通过 | `git diff` 不含 `backend/`；`NormalizePagination` 与路由文件未出现在改动集；`go build ./...` exit 0 |
| 过滤条件保留 | 通过 | 字符集：`sortField: 'sort'`、`sortOrder: 'asc'`、`status: 1`、用户列表 `sortField: 'username'`；warm-data 缓存键（routes + key）未改 |
| 禁用分支形状对齐 | 通过 | `Promise.resolve({items:[],total:0,...})` 改为 `Promise.resolve([] as PostRow[] / UserListRow[])`，与 helper 返回 `T[]` 一致；`setOrgPosts(postRows)` / `setOrgUsers(userRows)` 直接接收数组 |
| `orgChartPageSize` 常量删除无残留 | 通过 | `tsc -b` exit 0（`noUnusedLocals: true`），`grep orgChartPageSize frontend/src` 0 命中 |
| 下游 ops 同步面 | 不涉及 | 不新增/修改 API 路由、i18n key、菜单、权限、DB 迁移；纯前端取数实现变化 |

## 反向检查（为什么不是更省的做法）

1. **为什么不把 pageSize 9999 改成 100？** 那只是把静默截断变成显式截断，>100 的角色照样选不全 —— 正是审计要修的行为。
2. **为什么不加后端「下拉专用接口」或调 cap？** cap=100 是模块既定语义（`handler.go:39-50` 的注释即言明 modules 不认同）；改它会让列表页也失去上限保护，需求范围也不含后端改动。
3. **为什么 helper 触顶抛错而不是返回已收集部分？** 返回部分集会把「翻页异常」伪装成「数据就这么少」，正是本包要消灭的静默失败；抛错交给调用方既有的 `message.error(loadFailed)` 分支。
4. **为什么不并行翻页？** 首轮未知 `total`，无法预先算出页数；200 页上限下串行是 O(页数) 次请求，且保持了排序的确定性。

## Machine Readable

```json
{
  "taskId": "2026-11-03-audit-p1-pagination-data-consistency",
  "verdict": "approved",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-11-03-audit-p1-pagination-data-consistency/manifest.json",
    "evidenceDir": ".harness/evidence/2026-11-03-audit-p1-pagination-data-consistency/",
    "evidence": ".harness/evidence/2026-11-03-audit-p1-pagination-data-consistency/commands.json",
    "reviewFile": ".harness/evidence/2026-11-03-audit-p1-pagination-data-consistency/review.md",
    "changeRef": "none",
    "planRefs": ["docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-11-03.md"]
  },
  "openDeviations": [
    "iam/user/index.ts 不在 manifest expectedFiles.modify：功能上必须改（同 warm-data key 的 module loader），已记录，待维护者裁定是否并入。"
  ]
}
```
