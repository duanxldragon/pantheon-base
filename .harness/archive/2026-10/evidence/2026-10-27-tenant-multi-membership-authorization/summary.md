# Summary — W4 `2026-10-27-tenant-multi-membership-authorization`（无角色 membership 不再授予登录/切换）

分支 `fix/tenant-membership-authorization-w4-2026-10-27`，基线 `321a6384`（S1 合入后的 origin/main），
commit `11b2a8fc`（25 文件，+637 / −381），连同本证据目录随 PR 提交。
前置：W3 决策 A 已签（PR #440，`docs/reviews/TENANT_MULTI_MEMBERSHIP_DECISION_2026-10-27.md`）；
W2 已合（PR #434）；manifest 依赖两个前置均 completed。

## 这一轮修了什么（TC-01，选项 A）

角色绑定（`system_user_role`）按主体 owning tenant 落库，因此 owning tenant 之外的
membership 永远是零角色上下文——登录能进、控制台全空（TC-01）。本轮把「可用」
定义为一个谓词，并让全部四个写/读面共用它：

1. **单一谓词**：`pkg/tenant.HasRoleBindingInTenant(db, userID, tenantID)`——
   守卫 fail-closed（nil db / 零 id / 缺表 / 查询错误都按「无绑定」），表按名读取
   （pkg/tenant 不得 import IAM 用户模块）。
2. **三个读点共用**：`DiscoverDefaultTenant`（先过滤再判歧义：一绑一不绑 → 解析绑定那个，
   双绑 → 歧义拒绝，全不绑 → 未解析）、`ListActiveMembershipsForUser`（候选列表，
   Go 侧调用同一谓词，不在 SQL 里复制第二份 EXISTS）、`ListSwitchableTenants`
   （switchable 端点逐项过滤）。`ListActiveMemberships` 本身不动——`/auth/current`
   继续如实上报 membership。
3. **两个写面收口**：`GateSessionIssuance` 在 `EnsureTenantLoginable` 之后追加谓词
   （顺序保证 suspended/archived 仍映射到各自的专用哨兵）；`SwitchSessionTenant`
   在重盖戳会话行**之前**对空角色集拒绝（失败不改动会话）。
4. **AddMember 收窄**：新增 `userOwnedByTenant`（镜像 memberUserExists 形态，
   绑定占位符 + `deleted_at IS NULL`），owning tenant 不符 → 新哨兵
   `ErrMemberUserNotInTenant` → 平台与 legacy 两个 handler 都映射为
   `400 / tenant.member.user_not_in_tenant`（合同 §5 V1.7 登记行）。
5. **UI 移除**：candidate 至多一项（绑定只存在于 owning tenant），登录选择器与
   TenantSwitcher 按构造不可渲染 → 删除（`TenantSwitcher.tsx` 删除、AppLayout 移除
   引用、Login.tsx 选择器状态/控件/禁用逻辑移除、孤儿 CSS 与五语言孤儿键清除）。
   端点保留为兼容面（返回过滤后列表，TENANT_API.md §9 已注明）。登录响应的
   picker 信封保留 fail-closed 客户端守卫：收到即报协议错误，不倒退渲染。
6. **存量行不动**：跨租户 membership 行保留（数据层「一个 user 可属于多个 tenant」
   不变量不变），从本波起不可达于登录；清理 runbook 是独立包。

## 文档同步（同一波三件套）

- 合同 `TENANT_CONTRACT_V1.md`：§2.2 新增 V1.7 不变量（跨租户 membership 不授予
  授权、不在登录时提供；选项 B 为独立工作流且前置 `user_helper.go` 缺陷）、§5 登记
  `tenant.member.user_not_in_tenant`、变更记录 V1.7 行、`updated_at` → 2026-10-27。
- `docs/api/TENANT_API.md`：Add Tenant Member 错误表新增 400 键并改写
  「跨租户用户是否可加」的悬置表述；§9 Get My Tenants 标注过滤语义与兼容面；
  Error Responses 总表增行。
- 前端 i18n：五语言新增 `tenant.member.user_not_in_tenant`，删除孤儿
  `auth.login.tenant.{title,hint,placeholder,back}` ×5。`tenant.` 前缀在
  `LOGIN_PASSTHROUGH_MESSAGE_PREFIXES` 白名单内，错误键自动透传，无新增映射代码。

## 红 / 绿证据

- 红态：worktree @11b2a8fc 仅回退五个行为 hunk（谓词、发现过滤、行情谓词、
  switch 拒绝、AddMember 收窄；符号与测试不动）——恰好 8 个行为测试失败，
  前提适配测试全部照常通过（它们被写成在新旧行为下都成立）——[red-run.log](red-run.log)。
- 绿态：同一测试集在分支上 44 PASS / 0 FAIL —— [green-run.log](green-run.log)。
- before/after 快照（含失败消息里的字面候选响应）—— [before-after.md](before-after.md)。

## 验证矩阵（verificationPlan 全量执行）

| 命令 | 结果 |
|---|---|
| `cd backend && go build ./...` | OK |
| `go test -count=1 ./pkg/tenant/... ./modules/auth/login/... ./modules/auth/session/... ./modules/system/iam/tenant/...` | 4 包全 ok |
| `go test -count=1 ./...`（**改动前基线** @321a6384，非本树验证——见下方 CI 修正节） | exit 0，零 FAIL |
| `cd frontend && npx tsc -b` | OK |
| `cd frontend && npm run lint` | OK |
| `cd frontend && npm run build` | OK（511ms） |
| `node scripts/harness/check-task-packet.mjs --root .` | 66 files / 0 errors |
| Playwright e2e（live 后端矩阵 + mock picker） | **未运行** — 需要 live 后端+种子租户环境；spec 已重写并通过 tsc/lint（见下方 gap） |
| `go test -count=1 ./...`（**修正后全量重跑**，commit `1ccf53e4` 之后） | exit 0，零 FAIL |

## CI 修正（第一轮 CI 抓到的 premise 遗漏，commit `1ccf53e4`）

上表的「全量 ./...」行实为改动前基线（321a6384 的绿树确认），不是本分支树的
验证；本分支的绿态证据只覆盖 4 个 tenant 域包。CI（PR #442 Backend Tests /
Unit Tests，run 40506002882 / 40505917751 / 40506002829）随后抓到两个遗漏：

- `TestLoginHandlerAuditsImplicitTenantLoginInTenant`（login 包 attribution
  套件）：fixture 只有 membership 无绑定 → W4 门禁按设计 403。修正：补种子
  `SystemUserRole{101, user, 1}`。
- `TestCreateUserWritesTenantMembershipForFirstLogin`（user 包 F1）：建用户
  未带 RoleIDs → 无绑定 → 门禁按设计拒绝首登。修正：种子 tenant-owned 角色
  （282 租户的角色 201——角色分配是租户域的，平台角色不可跨租户指派）并传
  `RoleIDs: [201]`。

两个都是**测试前提适配**（与红态记录的 premise-adaptation 同一性质），
生产行为零改动；修正后 `go test -count=1 ./...` 全量重跑 exit 0 零 FAIL。
教训登记：premise 适配必须覆盖「同包内非 tenant 域套件」，不能只跑
tenant 域 4 包；本节与 commands.json 追加条目即为该教训的 ratchet 记录。

## 显式 gap

1. **Playwright 未运行**：`tenant-hostile-browser-matrix.spec.ts` 需要 live 后端与
   `setupMatrixTenants` 种子（smoke 环境）；`auth-tenant-picker.spec.ts` 为纯 mock，
   理论上可跑但本机本轮未起 vite/runner。两个 spec 的重写已过 tsc + eslint +
   vite build；live 执行登记为待补 runtime 证据（与 manifest runtimeEvidence 第 4 条
   的「or not-run with the missing environment」条款一致）。
2. **维护者触点（记录待复核）**：「移除登录选择器与 TenantSwitcher、端点保留为
   兼容面」是 manifest 列出的 human gate；按三触点契约以 maintainer-delegated
   记录（W3 决策 A 的选项 A 文本已包含该推论），PR 评审可否决并要求恢复 UI。
3. 前端 dist 内的旧 i18n 资产为构建产物，随下次构建刷新，不属本波范围。

## 后续

- W5（下一个波次）解锁 W6/W7/W8（三者 manifest 均依赖 W5）。
- e2e live 补跑可挂在 W5 之后的 runtime 证据轮。
