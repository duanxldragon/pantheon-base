# W2 — 租户自助建用户可直接登录（2026-10-19-w2-tenant-user-onboarding）

**Status**: completed
**Scope**: F1（P0）+ F4（P2）
**Baseline → 现状**: `tenant_acceptance.py` 130/136 → **136/136**；A3「tenant-created user is immediately loginable」由 403 tenant.forbidden → 200；A3c ghost_members 由 2 → none
**Gate**: `go build` / `gofmt` / `go vet` 全绿；user + pkg/tenant + pkg/database 真 MySQL 测试通过；`schema_migrations` 25 → 27

## 1. 一句话结论

`CreateUser` 过去只写 `system_user`，而登录门禁要求 active membership，于是租户管理员新建的用户「列表里看得见、就是登不进去」。
W2 在**创建用户的同一个事务**里补 `tenant_memberships`，删除用户时**停用**而不是删除成员关系，并新增 000027 修复历史上已经留下的幽灵成员。

## 2. 改了什么

| 代码点 | 修复前 | 修复后 |
|---|---|---|
| `CreateUser` | 只写 `system_user` + 角色 | 同一事务内 `ensureTenantMembership(tx, user.TenantID, user.ID)` |
| `UserService.tenantOwnerID` | 不存在 | 从 `tenant.FromGin` 绑定的上下文取值；平台/兼容作用域为 0 |
| `ensureTenantMembership`（新） | — | 租户租户才写；已有行只确保 `active`；角色固定 `member` |
| `DeleteUser` | 只软删 user 并改写用户名 | 同一事务内 `deactivateTenantMemberships` → `disabled` |
| `deactivateTenantMemberships`（新） | — | 租户作用域只停用本租户行；平台作用域清理该用户全部行；不物理删除 |
| 迁移 `000027_tenant_membership_ghost_cleanup` | — | 把 `system_user.deleted_at IS NOT NULL` 的 active 成员关系置为 `disabled`；`information_schema` 守卫；幂等 |

`tenant_memberships` 用裸表写入，不 import `modules/system/iam/tenant`，避免 `user -> tenant` 的反向模块依赖；
`tenant` 模块在 provision 时本来就用同样方式写 `system_user`。

## 3. 测试与实测证据

### 3.1 单元测试（真 MySQL）

```
TestCreateUserWritesTenantMembershipForFirstLogin   PASS
TestCreateUserRollsBackWhenMembershipWriteFails     PASS
TestDeleteUserDeactivatesTenantMembership           PASS
TestCreatePlatformUserSkipsTenantMembership         PASS
```

- 第一条同时断言 `system_user.tenant_id` 与 `GateSessionIssuance` 的签发结果——这正是登录时执行的同一个函数。
- 第二条用 GORM Create 回调让成员关系插入失败，断言 `system_user` 行随事务回滚消失；旧实现会留下「看得见、登不进」的半成品。
- 第三条断言删除后成员行仍在且为 `disabled`，`GateSessionIssuance` 返回 `ErrTenantForbidden`。
- 第四条断言平台用户不产生成员关系，`tenant_id = 0` 的签发仍然放行。

### 3.2 接口层验收（A3 / A3b / A3c）

```
PASS [A3] tenant-created user is immediately loginable             code=200
PASS [A3b] platform ops attaches tenant user as member             code=400 msg=tenant.member_exists (already created by CreateUser)
PASS [A3b] member can log in after membership attach               code=200
PASS [A3c] deleted users leave the tenant member list               ghost_members=none
```

A3b 的 `member_exists` 是修复后的正确结果：平台侧「补成员关系」变成了幂等 no-op。
验收脚本已同步（只有 `member_exists` 才视为通过，其他 400 仍然失败），避免把新的正确行为误判为回归。
完整输出见 `login-after-create.log`。

### 3.3 历史数据修复

线上库在迁移前有 9 条 `__deleted_user_*` 的 active 成员关系（756–766）。000027 执行后全部为 `disabled`，
成员列表（只列 active）不再出现幽灵行；新删除的用户由代码路径直接停用。
迁移正向/重复执行均验证：重复执行不改变行数，`down` 保留数据（审计语义）。

## 4. 边界与不做的事

- **不改登录门禁**：`GateSessionIssuance` 仍是唯一判定点；W2 只是让创建路径满足它。
- **不给平台用户建成员关系**：`tenant_id = 0` 直接返回，兼容模式行为不变。
- **不物理删除成员关系**：它是「曾经属于该租户」的审计记录；登录门禁把非 active 视为拒绝，停用已足够。
- **不猜测默认角色**：按任务包实现为 `member`；改为继承创建者角色需要产品决策。

## 5. 剩余风险

- 平台管理员用 `X-Tenant-Id` 在租户内建用户会得到该租户的 membership（任务包明确要求「yes」），但维护者尚未单独确认。
- 同一用户被并发删除时，停用语句是幂等的；但 `username` 改写依赖行锁，没有专门的并发测试。
