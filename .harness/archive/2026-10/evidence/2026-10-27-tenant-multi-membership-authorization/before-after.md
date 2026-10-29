# W4 before/after — login candidate response（TC-01 复现 → 收窄后）

红/绿都来自同一组集成测试（worktree @ 11b2a8fc 只回退行为 hunk、保留符号与测试；
分支本体 = 绿态）。失败消息里的结构体就是候选响应的字面快照。

## 被试主体

用户 42：`tenant_memberships` 里有 t101（owner）与 t202（member）两行 active，
`system_user_role` 只有 t101 一条绑定（「memberships in two tenants and roles in one」）。

## BEFORE（红态：W4 行为 hunk 回退 = main @321a6384 行为）

`resolveLoginTenantClaim` / 候选列表 / 发行情门的实际行为（red-run.log 原文）：

```
login_tenant_gate_test.go:455: claim = 101, want 0 — a membership without role bindings must not resolve
    （发现路径把无角色 membership 解析成 t101 的 claim → 签出空角色会话）

login_tenant_gate_test.go:469: explicit choice without roles err = <nil>, want ErrTenantForbidden
    （显式选择无角色租户照样放行）

login_tenant_gate_test.go:486: candidates = [{TenantID:101 Code:alpha Name:alpha Role:owner}
                               {TenantID:202 Code:beta Name:beta Role:member}], want only 101
    （GET /auth/login-tenants 候选响应：两个租户都被 offer，含不可用的 t202）

authz_test.go:252: candidates = [{TenantID:101 Code:t101 Name:t101 Role:member}
                  {TenantID:202 Code:t202 Name:t202 Role:member}], want only 101

authz_test.go:227: issuance without binding err = <nil>, want ErrTenantForbidden

session_service_test.go:88: switch without roles err = <nil>, want ErrTenantForbidden
    （POST /auth/tenants/switch 到无角色目标：会话被重盖戳，返回成功）

tenant_service_test.go: TestAddMember_RejectsUserOwnedByAnotherTenant FAIL
    （AddMember 接受 owning tenant 不符的用户 → 写入 TC-01 行）
```

即 BEFORE 的候选响应是 **两个租户都被返回**，登录/切换都能拿到 t202 的空白控制台。

## AFTER（绿态：分支 fix/tenant-membership-authorization-w4-2026-10-27 @11b2a8fc）

同一被试主体：

- `GET /auth/login-tenants` → `[{"tenantId":101,...}]` —— 只剩有绑定的 t101
  （`TestAuthTenantGate_ListCandidatesExcludeMembershipWithoutRoles` PASS）；
- 登录发现 → claim 0（无可解析租户；对 owning tenant 主体则解析 owning 租户）
  （`TestAuthTenantGate_DiscoveryIgnoresMembershipWithoutRoles` PASS）；
- 显式选择 t202 → `ErrTenantForbidden`（`TestAuthTenantGate_ExplicitChoiceWithoutRolesRefused` PASS）；
- `POST /auth/tenants/switch` → `ErrTenantForbidden`，会话行未被改动
  （`TestSwitchSessionTenant_RefusesTargetWithoutRoles` PASS；对照
  `TestSwitchSessionTenant_AllowsTargetWithRoles` PASS）；
- `POST /system/tenant/:id/members` 跨租户用户 → `400 tenant.member.user_not_in_tenant`
  （`TestAddMember_RejectsUserOwnedByAnotherTenant` PASS）。

绿态完整输出见 [green-run.log](green-run.log)（44 PASS / 0 FAIL）。

## 兼容面说明

端点不删除、不报错：`/auth/login-tenants` 与 `/auth/tenants/switchable` 继续返回
**过滤后**（至多一项）的列表；`/auth/current` 仍如实上报未过滤的 membership 行
（`ListActiveMemberships` 未动）。前端登录选择器与 TenantSwitcher 控件移除
（candidate 至多一项，控件按构造不可渲染）。
