# Doc diff — W5 `2026-10-27-tenant-contract-docs-alignment`

每一条被修正的「文档声称 ↔ 实际行为」漂移，附裁决依据。所有 handler 事实
以 `backend/modules/system/iam/tenant/` 与 `backend/pkg/common/http/response.go`
为准；信封形状 = `{"code": 200, "data": <payload>, "message": "success"}`
（`common/http/response.go:31-37`）。

## 1. TENANT_API.md — 响应示例对齐真实信封（TC-05）

| 位置 | 修正前（文档） | 修正后（文档） | 依据 |
|---|---|---|---|
| §1 Create Tenant | 裸行对象 `{"id":1,"code":...}` | `{"code":200,"data":{行},"message":"success"}` | `tenant_platform_handler.go` CreateTenant → `common.Success(c, row)` |
| §4 Update Tenant | `{"message":"tenant updated successfully"}` | `{"code":200,"data":{},"message":"success"}` | UpdateTenant → `common.Success(c, gin.H{})` |
| §5 Delete Tenant | `{"message":"tenant deleted successfully"}` | `{"code":200,"data":{},"message":"success"}` | DeleteTenant → `common.Success(c, gin.H{})` |
| §6 Add Tenant Member | `{"message":"member added successfully"}` | `{"code":200,"data":{},"message":"success"}` | AddTenantMember → `common.Success(c, gin.H{})` |

未动的示例：§2 List / §3 Get 的裸行示例不在本包 scope（manifest in 清单只列
create/update/delete + alias）；它们描述的 data 形状本身正确，缺的只是信封
外壳，登记为后续小型收口项，不在本波夹带。

## 2. TENANT_API.md — `/members/page` 未挂载（TC-05 / P3-2）

修正前：§7 开头写「the `/members/page` path below remains as a compatibility
alias」，并有一段独立的 `**GET** /system/tenant/:id/members/page` alias 描述。

修正后：alias 段整段删除；§7 开头改写为「This is the only mounted member-list
route: no `/members/page` variant exists (the legacy route group that carried it
is not registered)」。

依据：生产路由只在 `system_modules.go:290-306` 注册，其中成员列表仅有
`GET /tenant/:id/members`（:295）；`tenant_routes.go:25` 的
`/:id/members/page` 属于**从未被调用的 legacy RegisterRoutes**（manifest
finding：RegisterRoutes/NewHandler 无生产 caller）。`rg "members/page"` 复核：
TENANT_API.md 只剩「不存在该变体」的说明句，system_modules.go 零命中。
移除段落未留下任何悬空锚点（check-doc-links strict 0 findings）。

## 3. api.ts — `MemberUsageQuery.status` 类型对齐 UI 实发值（TC-06）

修正前：`status?: 'active' | 'removed'`——`'removed'` 在全代码库中不存在：
UI 的筛选下拉只发 `'active' | 'disabled'`（TenantMemberList.tsx
Select.Option value），后端绑定是 `oneof=active disabled`
（`tenant_ops_view.go:330` MemberRowFilter.Status）。发 `'removed'` 会被
400 `param.invalid` 拒绝；发 `'disabled'` 则过不了旧类型。

修正后：`status?: 'active' | 'disabled'`——与 UI 实发值和后端 binding 三方一致。
纯类型改动，运行时发送值不变（manifest 实现注记第 2 条）。

## 4. TenantMemberList.tsx — 移除掩盖类型漂移的 cast（TC-06）

修正前：`MemberQueryState.status?: string`（宽松），loadData 里
`status: next.status as MemberUsageQuery['status']` ——cast 把「UI 发
disabled、类型说 removed」的矛盾藏到编译器看不见的地方。

修正后：`MemberQueryState.status?: MemberUsageQuery['status']`，loadData 直接
`status: next.status`（无 cast）。role 保持宽松 string + 原 cast 不动
（manifest 只要求 status 一处）。`npx tsc -b` 干净：Arco Select 的 onChange
值与联合类型兼容，无需事件边界 cast。

## 5. MULTI_TENANT_DESIGN.md — 视野文档标注（TC-08）

修正前：Status 行已写「Superseded by contract V1」，但未点名哪些「未来阶段」
条目其实被合同 §1 划出 V1。

修正后：Status 行改写为「Vision document — **not a V1 commitment**」+ 绑定
范围指向 TENANT_CONTRACT_V1 §1 + 显式「What is not in V1」清单（custom
subdomains、custom domains、tenant branding、public self-registration——
TC-08 点名的四项）+ 声明 Phase 2/3 部署模型为探索性背景。探索性正文全部
保留（manifest 实现注记第 3 条：不删除内容）。

## 6. TENANT_CONTRACT_V1.md — owner 转移表述（TC-07）

修正前（§2.2 不变量第 2 条）：「转移 owner 是显式 API 动作」——合同读者会
以为存在一个转移端点；实现里没有。

修正后：明确「**owner 转移没有单一端点**（V1.8 澄清）」，落地路径 = 两步
显式动作：`POST /system/tenant/:id/members`（role=owner，命中复活语义升级
旧行）→ `DELETE /system/tenant/:id/members/:userId`（移除原 owner，
`ensureNotLastOwner` 兜底任意时刻至少一个 owner），并注明两步之间短暂双
owner 是合法中间态。In/Out 边界不动、不加端点（manifest out 第 1 条）。

## 7. TENANT_CONTRACT_V1.md — W1/W2/W4 澄清登记（追加式）

- §5 错误码表补 3 行：`tenant.not_found`（添加成员时墓碑先查，W2 行为）、
  `user.not_found`（404，W2 成员完整性守卫——`tenant_memberships` 对
  `system_user` 无外键，缺守卫会写幽灵行）、`tenant.member_exists`
  （400，owner 降级拒绝 / 非 owner 重加幂等，W2）。W1 的
  `tenant.not_archived`（V1.6）与 W4 的 `tenant.member.user_not_in_tenant`
  （V1.7）已在既往行登记。
- 变更记录追加 V1.8 行（2026-10-27）：①owner 转移表述对齐；②W2 两个错误码
  补登记（行为已实现并随 PR #434 合入，仅合同登记缺位）；性质 = 澄清
  （Clarification），显式声明「不改变任何不变量 / In-Out 边界」。
- 头部 `updated_at` 已是 2026-10-27（W4 时更新），无需再动。

## 验证

- `node scripts/harness/check-doc-links.mjs --root . --strict` → 0 findings
- `node scripts/harness/check-doc-inventory.mjs --root . --strict` → 0 findings
- `rg -n "members/page" docs/api/TENANT_API.md backend/modules/system/system_modules.go backend/modules/system/iam/tenant/tenant_routes.go` → 仅「不存在」说明句 + 未挂载 legacy 文件，生产注册零命中
- `npx tsc -b` / `npm run lint` → 干净
