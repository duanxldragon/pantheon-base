# Pantheon Base - Harness 任务状态

**最后更新**: 2026-10-19
**当前版本**: v0.16.1（`pantheon-base-v0.16.1`，发布进行中）

## 当前最终验收状态

**判定：v0.16.1 发布准备中。**（2026-10-19 补记：main 在发布候选之上新增租户整改，以 PR #386 压缩合并为
`8b5a3012`（分支内原始提交 `b07cd2a1`/`ae277910`/`6803f18a`/`fc6672ab`/`a4574a6c` 等）；经维护者确认，v0.16.1 发布范围为**候选提交
`c83f8e4c`**，租户整改随 v0.17.0 minor 发布；release-cut 人工门就此关闭） v0.16.0 发布时镜像了 v0.15.0 的"零产物"发布方式，导致消费侧（`pantheon-ops`）的 `foundation-release.lock.json` 至今仍锁定在 `pantheon-base-v0.13.0`。v0.16.1 是一次**补丁发布**，其唯一目的是重新产出四件可消费产物（`foundation-release-<v>.tgz` + `.sha256` + `repo.tar` + `repo.tar.sha256`），并把发布流程从"人工本地执行"改为"CI 可重复执行"。版本号与收口文档已进入候选提交，tag 与 GitHub Release 待 `Foundation Release Cut` 工作流（base_commit=c83f8e4c）触发后产出。

## 任务状态总览

| 状态 | 说明 |
|------|------|
| ✅ 已完成 | 全部历史任务 + 2026-10-07 整改任务包 + v0.15.0/v0.16.0 发布收口 |
| 🔄 进行中 | v0.16.1 发布收口（`2026-10-12-v0161-release-cut`） |
| ✅ 已完成 | 租户权限隔离整改（`2026-10-19-tenant-permission-isolation-remediation`，W0–W6 全部完成 + F14 收口后关闭，**零残留**） |
| ⏸️ 暂停 | 无 |

## 租户权限隔离整改（2026-10-19，已收口）

2026-10-19 的租户交付验收在实机跑了 193 项断言，通过 179 项（92.7%），留下 13 个缺陷、其中 **5 个 P0**。
5 个 P0 不是五个独立 bug，而是**一个同源缺陷簇的三层表现**：`role_key` 被当成跨租户全局命名空间。
`system_role` / `system_role_permission` / `system_role_data_scope` 三张表都已带 `tenant_id` 与
`(tenant_id, role_key)` 唯一键，但读写链路上有一半入口退化成按 `role_key` 单键工作，写入端还把租户值丢成 `tenant_id = 0`。

- **父任务**：`.harness/tasks/2026-10-19-tenant-permission-isolation-remediation/`（`status: completed`）
- **计划文档**：`docs/harness/tasks/2026-10-19-tenant-permission-isolation-remediation.task.md`
- **基线证据**：`.harness/evidence/2026-10-19-tenant-permission-isolation-remediation/`（`baseline-findings.md` / `review.md` / `commands.json`）
- **缺陷簇**：F7 F8 F9 F10 F11 F13（数据范围租户维度）+ F3（角色菜单授权落库）+ F1 F4（租户自助开通）+ F2（登录黑名单）+ F5 F6（控制台）

| Wave | 任务包 | 关闭缺陷 | 状态 |
|---|---|---|---|
| W0 | `2026-10-19-w0-isolation-contract-guardrails` | 契约条款 + 双租户红用例 | ✅ completed |
| W1 | `2026-10-19-w1-data-scope-tenant-dimension` | F7 F8 F9 F10 F11 F13 | ✅ completed |
| W2 | `2026-10-19-w2-tenant-user-onboarding` | F1 F4 | ✅ completed |
| W3 | `2026-10-19-w3-role-menu-grant-persistence` | F3 | ✅ completed |
| W4 | `2026-10-19-w4-session-revocation-login-gate` | F2 | ✅ completed |
| W5 | `2026-10-19-w5-tenant-console-ux` | F5 F6 | ✅ completed |
| W6 | `2026-10-19-w6-reverification-closeout` | 全量 193 项复跑 + 收口 | ✅ completed |
| W6+ | 收口后跟进 | F14（P2 错误码整形 → `404 role.not_found`） | ✅ closed，34/34 零 findings |

### W0 完成情况（2026-10-19）

把「列存在但路径忽略」变成可引用的违规：

- **契约**：`TENANT_CONTRACT_V1.md` 新增 **§2.3.1 读写义务（V1.2，澄清性质）**——读必须带租户谓词、
  写必须由上下文赋值且冲突键含 `tenant_id`、按裸键的归属校验同样算读；写明唯一两个放行面与 fail-closed 默认。
  条款前移到 §2.3（归属模型）而非留在 §3.3（上下文），因为「表里有没有这一列」曾被当成合规判据。
- **红用例**：8 条，用定点变异（还原 W1 的 6 个谓词）证明它们在旧代码上红、在新代码上绿。
  变异后 `md5sum -c` 校验还原，`go build` 通过。
- **门禁缺陷**：manifest 原命令 `-run Tenant` 会漏掉 3 条名字不含 `Tenant` 的用例（假绿），已改为 `-run 'Tenant|DataScope'`。
- **证据**：`.harness/evidence/2026-10-19-w0-isolation-contract-guardrails/`（`summary.md` / `review.md` / `commands.json` / `red-run.log`）。

### W1 完成情况（2026-10-19）

数据范围策略的租户维度补齐，6 个缺陷关闭：

- **改动**：`SystemRoleDataScope` 增加 `TenantID`；`loadRoleDataScopePolicies` / `applyRoleDataScopePolicy` 显式接收租户；
  `ListDataScopePolicies` / `ensureRoleKeyExists` / `fetchWorkbenchRoles` / `loadRoleDataScopes` 加租户谓词；
  `UpdateDataScopePolicy` 写 `tenantOwnerID()` 并 `OnConflict(tenant_id, role_key)`；
  `deleteRoleDataScopes` 按 `(tenant_id, role_key)` 删除；新增 `ensureDeptIDsBelongToTenant` 拒绝他租户部门 id。
- **迁移**：`000025_role_data_scope_tenant_backfill` 把历史 `tenant_id = 0` 策略复制到真正持有该角色的租户（只复制、不搬移、不凭空补 `all`）。`schema_migrations` 24 → 25。
- **验证**：`cross_tenant_leak.py L2 L3` **26/26 通过**（基线 27/34）；UI 探测 5/5，数据权限页总数 53 → 2；
  `go build` / `gofmt` / `go vet` / `go test`（middleware + permission + role）全绿。
- **证据**：`.harness/evidence/2026-10-19-w1-data-scope-tenant-dimension/`（`summary.md` / `review.md` / `commands.json` / `sql-snapshots.txt`）。
- **未收口**：平台作用域仍列出全部租户角色（待 W5 视角切换器显式化）；无策略角色仍 fail-closed 500（待独立决策）；F14 未排期。

### W2 完成情况（2026-10-19）

租户自助建用户直接可登录（F1 / F4）：

- **改动**：`CreateUser` 在同一事务内 `ensureTenantMembership`；`DeleteUser` 停用成员关系而不是删除；
  `tenantOwnerID()` 从请求租户上下文取值；平台用户（`tenant_id = 0`）不写成员关系。
- **迁移**：`000027_tenant_membership_ghost_cleanup` 把历史上已软删用户的 active 成员关系置为 `disabled`。
- **验证**：A3「tenant-created user is immediately loginable」200；A3c `ghost_members=none`；4 条单测覆盖
  同事务写入、失败回滚、删除停用、平台用户跳过。
- **证据**：`.harness/evidence/2026-10-19-w2-tenant-user-onboarding/`。

### W3 完成情况（2026-10-19）

角色菜单授权的租户维度（F3）：

- **改动**：`rbacbind` 的 role-menu 写入显式接收 `tenantID`；`replaceRoleMenus` 从角色行解析租户；
  平台 seed/login/menu 绑定限定 `tenant_id = 0`。
- **迁移**：`000026_role_menu_tenant_backfill` 把历史 0 行移动到角色所属租户（`UPDATE IGNORE` + 仅在有租户副本时清理 0 行）。
- **验证**：A4 导航授权 `menuIds=6 expected=6`，二次编辑 `menuIds=[6,7]`；探针库连续执行两次结果稳定。
- **证据**：`.harness/evidence/2026-10-19-w3-role-menu-grant-persistence/`。

### W4 完成情况（2026-10-19）

凭证变更后的登录门禁（F2）：

- **改动**：签发成功后 `ClearUserBlacklist`；`RevokeUserTokens` 同时写 session 级黑名单，旧 access token 仍失效。
- **验证**：重置密码后新密码立即登录 200；旧会话 401 `token.expired.force`；禁用/启用循环同样通过；
  Redis 键状态见 `redis-keys.txt`。
- **附带**：`pkg/testredis` 支持 `PANTHEON_TEST_REDIS_DB`，修复并行包 FlushDB 造成的键断言 flake。
- **证据**：`.harness/evidence/2026-10-19-w4-session-revocation-login-gate/`。

### W5 完成情况（2026-10-19）

控制台两处判定缺陷（F5 / F6）：

- **改动**：新增 `usePlatformScope`（读 `/auth/tenants/current`），两个切换器不再用权限键代理平台能力；
  `DeptList` 改为绑定 `flatDeptRows`，总数按扁平行计算。
- **验证**：租户管理员页面不再请求 `/system/tenant/list`，零 `tenant.platformOnly`；部门总数 5、子部门可见；
  `ui_walkthrough.cjs` 23/23。
- **证据**：`.harness/evidence/2026-10-19-w5-tenant-console-ux/`。

### W6 完成情况（2026-10-19）

全量复跑与收口：

- **跑分**：`tenant_acceptance.py` 136/136、`ui_walkthrough.cjs` 23/23、`cross_tenant_leak.py` 34/34 → **193/193**。
- **处置**：12 个缺陷关闭；F14（P2，跨租户角色成员接口返回 500 而非 404/403）显式降级并写明修复路径。
- **环境**：`schema_migrations=27`，幽灵成员 0，租户角色在 0 的授权 0，探测策略 0，探测租户 295/297 已归档。
- **证据**：`.harness/evidence/2026-10-19-w6-reverification-closeout/`（`summary.md` / `disposition.md` / `commands.json` / `final-run.log`）。

**判定**：F1、F3、F7、F8、F10 五项 P0 全部关闭，193 项验收全绿；F14 是唯一残留，P2、无数据泄露、已降级。
本租户已具备「可交付」条件。W1 的临时缓解（收回 `system:permission:data-scope`）不再需要。

平台作用域仍会列出全部租户角色、无策略角色仍 fail-closed 500、部门表改为扁平行——三项都是显式剩余项，
分别需要产品决策或独立交互设计。

## 2026-10-07 整改任务包（已收口）

- 父任务 `2026-10-07-release-readiness-remediation`：completed。
- Wave 0 子任务（`iam-data-scope` / `audit-request-body` / `auth-session-scope` / `login-log-identity` / `governance-gate-repair` / `upgrade-runbook`）：completed。
- Wave 1（`release-qualification`）：completed —— 候选提交的 CI、前端、后端、浏览器、MySQL 与治理证据齐备。
- Wave 2（`release-closeout`）：completed —— PR #368 合并、分支收口为 `main`、Release Gate 全绿、v0.15.0 发布。
- P1 followup（`performance-followup` / `ui-maintainability-followup`）：completed。

## 发布收口（v0.16.1）

- **版本**：`VERSION` = 0.16.1；tag `pantheon-base-v0.16.1`；GitHub Release 待 `Foundation Release Cut` 工作流产出。
- **性质**：补丁发布，**零消费侧接口变更**——无路由、权限码、菜单 seed、i18n key 或契约形状变动；`sharedPaths` 52 项与 v0.13.0 清单逐字节一致。
- **修复**：恢复四件可消费产物。v0.14.0 / v0.15.0 / v0.16.0 各发布 **0** 件产物，而 v0.12.1 / v0.13.0 各发布 **4** 件；消费侧锁因此长期停留在 v0.13.0。v0.16.1 是 v0.13.0 之后第一个可消费发布。
- **新增**：
  - `.github/workflows/foundation-release-cut.yml` —— 仅 `workflow_dispatch` 触发，在 CI 中执行 `release:foundation:cut` + `check:release-assets --local-only` + `release:foundation:publish`，默认 `dry_run=true`。所有输入经作业级 `env` 传递（规避 `githubactions:S7630` 脚本注入），发布用凭据由 `gh auth setup-git` 提供而非 `persist-credentials`。
  - `.github/workflows/foundation-release-verify.yml` —— Release 发布后自动核对四件产物（`release: [published]`）。
  - `.github/workflows/foundation-release-backfill.yml` —— 对历史 tag 补产物的手动回填通道（默认 dry-run）。
  - `scripts/foundation-release/check-release-assets.mjs` + 21 条无外部依赖测试 —— 四件产物契约的机器可校验门。
- **为什么必须由 CI 发布**：`publish-foundation-release.mjs` 强制要求目标提交上存在成功的 `Release Gate Summary` 检查运行，且本地发布脚本在本机无法执行（Node 无法 `spawnSync` 任何子进程，`git`/`gh`/`tar` 均返回 `EBUSY`，已在关闭沙箱后复测确认）。CI 发布同时天然满足"工作区干净"前置条件。
- **任务包**：`.harness/tasks/2026-10-12-v0161-release-cut/`。
- **消费侧前置校验（已通过）**：`sharedPaths` 52/52 一致；业务叠加装配的 6 个锚点在 v0.16.1 基线上各命中恰好一次。

## 发布收口（v0.16.0）

- **版本**：`VERSION` = 0.16.0；tag `pantheon-base-v0.16.0`；GitHub Release 已发布（**0 件产物**）。
- **性质**：内部工程发布（minor），**零消费侧接口变更**——无路由、权限码、菜单 seed、i18n key 或契约形状变动。
- **范围**：
  - #371 前后端命名与目录对齐（Go 包名 == 目录名；`frontend/src/modules/system/*` 镜像后端三层结构；`core/permissions`/`core/settings` 单数化、`AppLayout.tsx` 拆出 `index.tsx`）。
  - #372/#373/#374 冒烟分层（L0 静态 / L1 关键路径 / L2 模块 / L3 全量）并按业务模块拆分 `system-pages.spec.ts`；新增路径驱动的 `scripts/resolve-smoke-modules.mjs` 与 CI `pr-smoke-modules` 作业。
  - #370 清除 Dependabot #43（`sprintf-js` DoS，dev 依赖）；#374 清除拆分浮出的 17 条 SonarCloud 异味；#375 删除空 `openspec/` 骨架。
- **质量**：SonarCloud 未解决项 0、整体重复率 2.8%；CodeQL 0 error/critical；Dependabot 0 high/critical。
- **任务包**：`.harness/tasks/2026-10-12-v0160-release-closeout/`。

## 发布收口（v0.15.0）

- **版本**：`VERSION` = 0.15.0；tag `pantheon-base-v0.15.0`；GitHub Release 已发布。
- **安全**：SSRF IPv4 denylist 改为字节字面量构造（`backend/pkg/security/ssrf/validator.go`），清除 6 条 `go:S1313`；SonarCloud 未解决项为 0。
- **CI**：`Full Smoke` 窄屏弹层用例改为等待弹层稳定后再测量，消除测量时序 flake；必需检查与 Release Gate 全绿。
- **文档**：README（zh/en）移除里程碑/成熟度叙事并对齐 v0.15.0；过期报告归档至 `.harness/archive/2026-10/`。

## Dependabot 安全整改（2026-10-11）

- **告警**：#43 `sprintf-js`（GHSA-hp3w-g68c-fv3c / CVE-2026-97058，medium，dev 依赖，manifest `frontend/package-lock.json`）。
- **根因**：`nyc` / `vite-plugin-istanbul` → `@istanbuljs/load-nyc-config@1.1.0` → `js-yaml@3.15.2` → `argparse@1.0.10` → `sprintf-js@1.0.3`；上游最新版 1.1.3 仍在受影响区间（`<= 1.1.3`），无可用补丁版本。
- **修复**：`frontend/package.json` 增加 `overrides`，将 `@istanbuljs/load-nyc-config` 的 `js-yaml` 固定到顶层 `^5.4.2`；lockfile 仅移除 4 个孤立条目（45 行删除，零版本漂移）。
- **验证**：`npm ls sprintf-js` 为空；`npm ci --dry-run` 通过；`load-nyc-config` YAML 解析 PASS；lint / type-check 通过。
- **任务**：`.harness/tasks/2026-10-11-dependabot-sprintf-js-dos/manifest.json`。

## 归档

- 历史任务（116 个）见 [ARCHIVE.md](./ARCHIVE.md)。
- 2026-10 过期文档见 `.harness/archive/2026-10/`。

## 质量指标

- SonarCloud：Security Rating A，未解决项 0。
- CodeQL：0 open error/critical；Dependabot：0 high/critical。
- 覆盖率 / 重复率 / Lint / Docs Governance：达标。

## 维护者

duanxldragon
