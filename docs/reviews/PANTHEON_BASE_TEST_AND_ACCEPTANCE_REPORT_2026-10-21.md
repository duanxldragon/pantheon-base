---
title: Pantheon Base 阶段性验收测试与验证记录（2026-10-21）
doc_type: Acceptance
layer: platform
status: Active
linked_contracts:
  - docs/contracts/TENANT_CONTRACT_V1.md
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-10-21
---

# Pantheon Base 阶段性验收测试与验证记录（2026-10-21）

原则：只记录真实执行过的命令与真实结果；失败与环境限制原样保留。时间为本地（Asia/Shanghai），2026-10-21。

## 1. 环境条件（非项目缺陷，但影响验证边界）

| 条件 | 实测 | 影响 |
|---|---|---|
| `git` 直连 github.com:443 超时 | 复现 | 所有 GitHub 状态核查改用 `gh` CLI（API 可达），结论不受影响 |
| 本地 MySQL 3306 存活；默认凭据 1045 | 复现 | 初始 DSN 核查失败；后从仓库根目录已入库的 `.env.test` 取得可用开发 DSN（root@127.0.0.1:3306）。`pkg/testmysql` 仅按测试名创建/删除 `pantheon_base_test_*` 隔离库，不触碰业务库 |
| Git Bash 下 `npm/npx` shim 损坏 | 复现 | 前端门禁以 `node ./node_modules/...` 直调执行 |
| Windows PATH 上的 `node` 是无扩展名 shim | `exec.LookPath("node")` 失败 ⇒ `dynamicmodule` 生成器套件 4 例报 `module.generate.server_export_failed`；设 `PANTHEON_NODE_BIN=D:\nodejs\node.exe` 后通过 | **本地环境怪癖，非代码缺陷**（CI Linux 正常）；已记入限制 |
| 无全栈运行环境（后端进程+浏览器） | 未启动 | Playwright 冒烟、HTTP 级对抗 curl、UI 视觉终验移交 CI 与维护者三触点③；本报告不声称浏览器级通过 |

## 2. 后端门禁（全部真实执行）

```
$ go build ./...            # 无输出，exit 0
$ go vet ./...              # 无输出，exit 0
$ gofmt -l .                # 无输出（含整改后全部文件）
```

### 2.1 无 DSN 全量（DB 套件内部 skip）

```
$ go test ./...             # exit 0；46 包 ok，0 FAIL
```
skip 面抽样（`go test ./modules/system/iam/tenant/... ./pkg/tenant/... ./pkg/database/... -v | grep '--- SKIP'`）：租户服务/ provisioning/成员/会话撤销等 30+ 例因 "mysql test dsn is not configured" 跳过——**此现象曾掩盖 R1-R4，见 §4**。

### 2.2 真 MySQL 全量（决定性证据）

`PANTHEON_TEST_DSN=root:***@tcp(127.0.0.1:3306)/pantheon_base...`、`PANTHEON_NODE_BIN=D:\nodejs\node.exe`，分四批前台执行（两次后台 `./...` 整批运行因包装器截断中断，不作为证据；批次输出如下）：

```
批1  ./cmd/... ./internal/... ./modules/auth/...
  ok cmd/server 0.052s | cmd/tenantmatrixdb | cmd/tenantsizing
  ok internal/middleware 6.787s | internal/scaffold
  ok modules/auth/login 104.034s | mfa | security | session 6.061s      → exit 0
批2  business 0.923s | platform 3.954s | audit 7.668s | config/dict 6.034s
     config/setting 10.645s | system/i18n 114.744s                       → exit 0
批3  iam/menu 4.564s | iam/permission 19.893s | iam/role 27.173s
     iam/tenant 46.992s | iam/user 38.665s | org/dept | org/post         → exit 0
批4  pkg/...（22 包全 ok，含 pkg/database 32.882s 迁移升级/回滚、pkg/tenant）
     modules/lowcode/dynamicmodule 14.361s | generator | modules/system 3.746s → exit 0
```

合计 46 个含测试包全部 ok，0 FAIL，0 SKIP-仅DB。关键新增/更新用例（真 MySQL 断言）：

- `platform_capability_middleware_test.go`：compat 管理员 200 / tenant_admin 403（FIX-1）。
- `pkg/tenant` scope 钉租 SQL 断言 + `setting_tenant_mode_guard_test.go` 降级拒绝（FIX-2）。
- `TestRevokeTenantMemberSessions_KillsActiveMemberSessions`（FIX-3；该测试初版因缺 `.Error` 从未真正执行，修复后通过——见 §4-R3）。
- `TestCopyPlatformDictsToTenant*` 幂等 + `TestCreateTenant_ReusedCodeIsFullyProvisioned`（FIX-4）。
- `role_key_namespace_test.go`（双向互斥、改名排除自身）与 `TestPlatformEditOfTenantRoleKeepsGrantInRoleTenant`（FIX-5/R1/R2）。
- `TestLegacyTenantHandlerErrorEnvelopeIsUnifiedAndLeakFree` 12 子例（FIX-7）。
- `pkg/database` 迁移测试覆盖 `000029` up/down（FIX-8）。
- `TestAddMember_Duplicate`（幂等更新角色并复活）、`TestAddMember_OwnerIsProtected`（owner 拒降级）（FIX-11）。

## 3. 前端门禁（全部真实执行）

```
$ node ./node_modules/typescript/bin/tsc -b                    # exit 0
$ node ./node_modules/vitest/vitest.mjs run                    # Test Files 26 passed (26)，exit 0
$ node ./node_modules/eslint/bin/eslint.js . --max-warnings 0  # exit 0
$ node ./node_modules/vite/bin/vite.js build                   # ✓ built in 716ms，exit 0
```
新增会话边界用例：`routeWarmDataSessionBoundary.test.ts`（4 例，含同页签 A→登出→B 不泄漏预热数据）、`requestOperationTokenSession.test.ts`（3 例）。

## 4. 对抗验证与整改质量记录

### 4.1 多租户对抗场景（单元/真 DB 层）

| 场景（任务书 §5.9） | 覆盖 | 结果 |
|---|---|---|
| A 租户读/改/删 B 租户数据 | scoped 查询 + `CrossTenantPolicyDoesNotLeak`（`casbin_tenant_domain_test.go:77`）+ 各服务租户谓词测试 | 通过 |
| 为他租户用户分配他租户角色 | role/permission 套件（他租户角色不可见/不可授权） | 通过 |
| 篡改请求头/体租户标识 | 中间件测试 + `TENANT_FORBIDDEN`（v0.17.0 #393 路径，body tenantId 指向他租户被拒） | 通过 |
| 租户停用后旧 Token 调用 | FIX-3 会话撤销测试（即时性语义层） | 通过（HTTP 级见 §4.3 gap） |
| 初始化并发/重跑幂等 | `*Idempotently` 系列、`TestEnsureTenantRolePolicies_IsIdempotent` 等真 DB 通过；并发双写场景未注入（B7 延期项） | 部分通过 |
| 租户上下文缺失默认行为 | FIX-2 后 ctx==nil 不加过滤仅限无上下文内部调用；HTTP 链路必有上下文，缺失即 401/403 | 通过（静态+单测） |

### 4.2 CI 证据（gh 实测，2026-10-21）

- `smoke-tenant`（run 39533828246，advisory）红根因取证：trace network JSONL 显示 `POST /api/v1/system/user` 成功返回 id=5 后，`POST /api/v1/system/tenant/205/members {"user_id":5,"role":"member"}` 返回 `{"code":400,"message":"tenant.member_exists"}`；后端日志确认 `ensureTenantMembership` 已在建用户事务内插入 member 行。⇒ FIX-11。
- SonarCloud：main 最新 analysis（revision ffb22988）Quality Gate **OK**、unresolved **0**（匿名 API 可达，已验证）。
- PR #395（release/v0.17.0）：OPEN；Docs Governance 红于 PR-body 仪式字段（机械项），Enforce quality results 聚合其失败。本地整改就绪，尚未推送（推送/合并需维护者授权）。
- main 分支保护：`gh api repos/…/branches/main/protection` → 404 `Branch not protected`（F2，维护者动作）。
- tag `pantheon-base-v0.17.0`：本地与远端均不存在；GitHub Releases 最新 v0.16.1（F5）。

### 4.3 未执行/无法执行（显式 gap，不得视为通过）

1. **浏览器级 Tenant Smoke 复验**：需后端+MySQL+Redis+前端全栈；本地未运行。FIX-11 的 CI 复验在整改进入 #395/CI 后自动完成。当前"Tenant Smoke 将恢复绿色"是基于取证链的推断，非实测。
2. **HTTP 级跨租户 curl 攻击矩阵**（`cmd/tenantmatrixdb` 全栈模式）：同上未本地执行；单元层等价场景已通过。
3. **真实升级演练**（备份库回放 000025→000029 + 数据兼容性）：迁移测试覆盖 schema 层，数据回放未做。
4. **UI 视觉终验**（两种模式的界面边界/反馈）：代码级与构建级已验证；视觉验收属维护者三触点③。
5. 曾把未推送的整改描述为 CI 恢复——已在文档修正中禁止此类表述；本报告中所有"通过"均限定到实际执行层级。

## 5. 文档与门禁自证

```
$ node scripts/frontmatter-check.mjs
Frontmatter check passed. Checked 335 docs, 242 with frontmatter.   # exit 0
```
本次同步修正：`RELEASE_NOTES_v0.17.0.md`（双根因叙述+验收整改节+验证边界）、`CHANGELOG.md`（同）、`docs/TENANT_SCOPE_FREEZE_DECISION_2026-10-15.md`（状态→已批准+指向）、`docs/designs/TENANT_RESOURCE_SCOPE_MATRIX.md`（menu tenant_id 占位列澄清、平台能力门、字典改 tenant-replicated、updated_at 2026-10-21）。
