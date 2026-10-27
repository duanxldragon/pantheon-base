# Summary — W1 `2026-10-27-tenant-delete-archive-guard`（删除仅限已归档租户）

分支 `fix/tenant-delete-archive-guard-2026-10-27`，基线 `b13e6b77`（W2 PR #434 合入后的 origin/main）。
两个 commit：后端 `546fd62e`（12 文件，+119 / −22）、前端 `786c794a`（6 文件，+13 / −1），
连同本证据目录共 21 个文件。

## 这一轮修了什么（TC-02）

旧守卫 `memberCount > 0 && row.Status != tenantStatusArchived` 的语义是
「活跃成员数为 0 的**活跃**租户可以删」。这个状态不需要任何 SQL 就能到达：
`DeleteUser` 会停用该用户的所有成员关系（`user_membership.go:78-88`），把一个活跃租户的
用户全部删掉，成员计数归零，租户就能被直接落墓碑——完全绕过合同 §2.1 规定的
「删除仅对 archived 租户开放」和 §2.2 的归档终态。

修复是把判定权交还给状态本身：

```go
if row.Status != tenant.TenantStatusArchived {
    return ErrTenantNotArchived
}
```

- 新哨兵 `ErrTenantNotArchived`；`ErrTenantHasActiveUsers` 标记 Deprecated 但保留
  （其「归档租户可带活跃成员删除、同事务停用」的另一半语义仍由新守卫承接）。
- 事务体不动：停用活跃成员关系、分配 `__deleted_tenant_<id>` 合成编码、写 `status=deleted`。
- 平台 handler 把哨兵映射为 `400 / tenant.not_archived` 信封；遗留 handler（W8 待移除的死表面）
  镜像同一映射，否则其哨兵映射测试会回 500。
- 前端 `TenantList.tsx` 删除动作加 `row.status !== 'archived'` 禁用——注释写明
  **禁用态是可用性提示，不是守卫**，真正的守卫在后端。
- 合同 §5 增行（冻结错误码表）、§9 记 V1.6 变更；API 文档 Delete Tenant 节、
  运维 runbook 的 Cannot Delete Tenant 节同步改写。
  `TENANT_MIGRATION_RUNBOOK.md` 复查后**无**「可删非归档租户」表述，无需改动。

## 红 / 绿证据

- 红态：仅回退守卫 hunk（哨兵保留让新测试可编译），回归测试
  `TestDeleteTenant_ActiveWithoutMembersStillRefused` 拿到 `nil` 错误且行状态是
  `deleted` 而非 `active` —— [red-run.log](red-run.log)。回退从未进入 commit。
- 绿态：修复后同一测试 1.02s PASS —— [green-run.log](green-run.log)。
- 权威全量：rebase 到 W2 之后跑 `go test -count=1 ./modules/system/iam/tenant/...`
  → ok 60.7s。

## 夹具：14 处，不是 packet 盘点的 13 处

packet 用 Phase 0 基线盘出 13 个「从未归档就删除」的夹具。rebase 到 W2 之后全量跑出
第 14 个：W2 自己带的 `TestAddMember_TombstoneTenantStillReportsTenantNotFound`
（tenant_service_test.go:496）也是直接删活跃租户构造墓碑。第一次 post-rebase 全量跑
恰好红在这一处——这反过来证明守卫真的在生效。全部 14 处统一改为
archive-first（`UpdateTenant(Status=archived)` → `DeleteTenant`），未削弱守卫。

一处编译碰撞顺手修掉：beta 用例里已有一个 `archived` 变量（归档编码字符串），
新增状态变量命名 `archivedStatus`。

## 文档口径

错误码 `tenant.not_archived`（5 个语言包各 +1，总 key 数 3021 → 3022，audit 全绿）。
文案明确「成员数是否为 0 不影响判定」——这是 TC-02 的核心：**状态是守卫，成员数不是**。
仓库剩余的 `has_active_members` 字符串只存在于带日期的历史评审文档中，保留为历史记录。

## 边界：本轮刻意没有做的事

- 不动状态机、归档终态、墓碑语义（`scope.out`）。
- 不为「已被绕过守卫落墓碑的历史租户」做数据修复——生产库不存在这类行
  （绕过路径从未上过线），packet 也把它划在 out。
- 不改 `RemoveMember` / `ensureNotLastOwner` / 成员停用规则（W2 领地）。
- 不让任何其它动作隐式触发归档。
