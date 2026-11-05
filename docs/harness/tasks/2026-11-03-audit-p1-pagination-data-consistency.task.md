---
title: 前端分页数据一致性修复（FE-01/FE-02，P1）
doc_type: Remediation
layer: platform
status: Archived
depends_on_layers:
  - system/iam
  - system/org
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/TENANT_CONTRACT_V1.md
updated_at: 2026-11-04
---

# Task Packet: 2026-11-03-audit-p1-pagination-data-consistency

## Goal

修复审计 FE-01/FE-02（P1，数据一致性，>100 行才触发）：前端角色/岗位下拉与组织架构取数
直接传 `pageSize: 9999` / `pageSize: 1000`，被后端 `NormalizePagination(page, pageSize, 100)`
静默截断为 100——角色/岗位 >100 行时下拉缺失选项（`UserFormModal` 多选无法选中缺席项），
组织成员 >100 时 `OrgTab` 用 `.length` 直出的 `orgMemberTotal` 与 `{deptCount}/{postCount}/{userCount}`
数字静默错误且无截断指示。

## Priority

`high`

## Estimated Complexity

`simple`

## Primary Layer

system/iam

## Dependency Layers

- `system/org`（组织架构计数页，FE-02 所在地）

## Dependencies

- blockedBy: `none`
- blocks: `none`

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `maintainability`
- Portable Failure Class: `data-consistency`
- Owner Layer: `foundation-source`
- Ratchet Decision: `gate-updated`
- Coverage Dimensions:
  - behaviour
  - maintainability

交付层级：**L1**（前端取数对齐；不改后端契约，无安全语义）。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`（仅前端快照；无共享契约面变化）
- Sync Expectation: none
- Release Requirement: foundation-release
- Downstream Sync Note: 不新增/修改 API 或 i18n key，无 ops 同步面。

## Contract Anchors

- `docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-11-03.md` §11（FE-01/FE-02 登记处）、§12（冻结前修复）
- `docs/contracts/PLATFORM_CONTRACT.md`
- `backend/pkg/common/handler.go`（`NormalizePagination` cap 语义在 :39-50，后端既定行为，本包不改）

## Scope

### In

- 新增前端分页聚合 helper `frontend/src/shared/utils/fetchAllPages.ts`：
  以固定 `pageSize`（默认 100）循环翻页直到收齐 `total` 或不足一页，带上限保护防死循环。
- `useUserList.ts:329,355`：`getRoleList` / `getPostList` 两个下拉源改走 helper（保留 status/sort 过滤）。
- `DeptList.tsx:352-376`：组织架构 `getPostList` / `getUserList` 改走 helper，移除 `orgChartPageSize=1000`。
- `dept/index.ts:39,44`：`posts:org-chart` / `users:org-chart` 两处 warm-data 改走 helper。
- helper 配套 vitest 用例（聚合完整性、total 边界、空结果、上限保护）。

### Out

- 修改后端任何 `NormalizePagination` 的 cap（cap=100 是模块既定语义）。
- 新增后端「下拉专用接口」。
- 改动 `UserFormModal` / `OrgTab` 组件形态或 i18n key。
- 处理其他任何审计项（FE-03…FE-14）。
- 触碰 `pantheon-ops` / `VERSION` / `CHANGELOG.md`。

## Structural Scope

### Scope Quantification

- Modules affected: 2（system/iam、system/org）
- Files: 5（create 2, modify 3, delete 0）
- API endpoints: 0
- Database migrations: no

### Risk Nodes

1. 直接降 `pageSize` 到 100 会把「静默截断」退化成「显式截断/漏项」 - Mitigation: 必须分页聚合收全量，验证 >100 行场景
2. helper 若判断终止条件错误会在 `total` 缺失或恒等时死循环 - Mitigation: 以 `items.length < pageSize` 与 `all.length >= total` 双条件 + 显式页数上限

### Legacy Fields (for compatibility)

- Affected Subgraph: `useUserList.loadRoles/loadDeptAndPostOptions -> getRoleList|getPostList -> /system/role|post/list`；`DeptList.loadOrgData + dept/index warm-data -> getUserList|getPostList`；后端 `NormalizePagination(…,100)`
- Boundary Crossings: `system/org -> system/iam/user`（`getUserList` 复用）
- Risk Nodes: `normalizeRolePageQuery` | `normalizePostPageQuery` | `user_helper.go`（后端，不改）
- Graph Focus: `call-depth`

## Expected Files

### Create

- `frontend/src/shared/utils/fetchAllPages.ts`
- `frontend/src/shared/utils/__tests__/fetchAllPages.test.ts`（或就近约定测试目录）

### Modify

- `frontend/src/modules/system/iam/user/useUserList.ts`
- `frontend/src/modules/system/org/dept/DeptList.tsx`
- `frontend/src/modules/system/org/dept/index.ts`

### Do Not Touch

- `backend/**`（后端 cap、接口、契约一行不改）
- `pantheon-ops/**`、`VERSION`、`CHANGELOG.md`、`.harness/STATUS.md`

## Assumptions and Open Questions

- Confirmed Facts: `getRoleList` / `getPostList` / `getUserList` 均返回 `{ items, total }`，可翻页；后端 cap=100 恒定（`handler.go:39-50`）
- Working Assumptions: `resolveRouteWarmData` 的缓存键无需变化（fetch 逻辑在 loader 内即可）
- Open Questions: `none`

## Implementation Notes

- helper 签名取最小：`fetchAllPages<T>(fetchPage: (page, pageSize) => Promise<{ items: T[]; total: number }>, pageSize = 100, maxPages = 200): Promise<T[]>`。
- 终止条件：`items.length < pageSize || all.length >= total` 任一满足即停；`total === 0` 自然返回空数组；
  `maxPages` 兜底（200 页 = 2 万行，组织架构 <200 行时必先触发前两个条件）。
- 调用点保持既有 `sortField`/`sortOrder`/`status` 过滤与 `resolveRouteWarmData` 包装，只替换 loader 内部。
- 不新增依赖、不新增 i18n、不改菜单/权限。

## Minimum Viable Approach

- Selected Rung: `small local code`（一个 ~20 行 helper + 3 个调用点替换）
- Why This Is Enough: 分页聚合是唯一不改后端契约的全量取数方式
- Upgrade Trigger: 若未来有高频下拉需求，再评估后端「分类下拉专用接口」

## Success Criteria

- Behaviour Outcome: 角色/岗位/组织成员 >100 行时下拉与计数与后端全量一致，无静默截断
- Verification Signal: `tsc -b` / `eslint .` / `vitest run`（含新 helper 用例）全绿；`grep -rn "9999\|pageSize: 1000" frontend/src` 0 命中
- Regression Watch: 既有下拉行为（status/sort 过滤、warm-data 缓存键、多选回显）不变
- Economics Watch: `none`

## Context Strategy

- Entry Sources: 审计报告 §11（FE-01/FE-02 证据行号）、本 packet
- Retrieval Order: `entry -> summary -> raw`
- Retrieval Helpers: `codegraph`（`getRoleList` / `getPostList` / `NormalizePagination` 调用点）
- Promotion Target: `none`
- Response Budget: `terse`
- Sensitive Context: `none`

## Execution Roles

- Implementer Posture: 只改 3 个前端文件 + 新增 2 个文件；改前 grep 全部 9999/1000 调用点，改后复跑验证命令
- Reviewer Posture: 确认没有「降 cap 糊弄」；确认 helper 终止条件与上限保护存在；确认后端一分未改

## Stop Points

- `none`

## Technical Debt

- technicalDebtFlag: `no`
- technicalDebtNote: 修复即消债；helper 是通用工具不产生新债

## Rollback Plan

**Required for destructive changes.**

- Trigger Condition: `none`
- Rollback Steps:
  1. `git revert <commit-hash>`
- Rollback Verification:
  - [x] Functionality verified
  - [x] Data integrity verified
  - [x] No side effects observed

## State Plan

- Checkpoint Expectation: helper + 3 处替换完成即验证
- Resume Artifacts: `.harness/evidence/2026-11-03-audit-p1-pagination-data-consistency/`

## Verification Plan

### Backend

- 不涉及后端改动；跑 `cd backend && go build ./...` 仅确认无连带破坏

### Frontend

- `npx tsc -b`（零输出）
- `eslint .`（0 error）
- `vitest run`（32 files / 213+ tests，含新 helper 用例）
- `grep -rnE "pageSize: ?(9999|1000)" frontend/src` → 0 命中
- 结构断言（可选）：新增 `.length` 计数点前后对比，确认取自聚合后数组

### Browser / Smoke

- none（无浏览器环境；以单测 + 静态验证为 evidence）

## Linkage

- Task ID: `2026-11-03-audit-p1-pagination-data-consistency`
- Task Manifest: `.harness/tasks/2026-11-03-audit-p1-pagination-data-consistency/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Plan References: `docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-11-03.md` §11/§12（FE-01/FE-02）
- Evidence Directory: `.harness/evidence/2026-11-03-audit-p1-pagination-data-consistency/`
- Review File: `.harness/evidence/2026-11-03-audit-p1-pagination-data-consistency/review.md`

## Evidence Required

- `commands.json`：tsc / eslint / vitest / grep 残留 0 命中 读数
- `summary.md`：helper 设计与终止条件取舍；5 处 9999/1000 调用点替换对照表
- `review.md`：逐条 reviewer posture；「没有降 cap 糊弄」的反向检查

## Human Gates

- 前端 UX 无行为契约变化，无强制 human gate；若维护者希望看到渲染证据，则浏览器走查属可选补充（本包默认以单测 + 静态验证交付）。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] 角色/岗位/组织成员取数不再有 9999/1000 直发
- [x] helper 有单测且覆盖 total 边界与上限保护
- [x] 后端 cap/接口/契约零改动
- [x] `grep -rnE "pageSize: ?(9999|1000)" frontend/src` 0 命中