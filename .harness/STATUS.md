# Pantheon Base - Harness 任务状态

**最后更新**: 2026-10-22
**当前版本**: v0.17.0（已发布）；v0.16.1 为上一个可消费版本

## 租户菜单、审计归属与套餐差异化修复（2026-10-22）

维护者人工验收提出三类问题，已在真实 multi 环境修复并回归，任务包
`2026-10-22-tenant-plan-entitlements-and-audit`，证据在
`.harness/evidence/2026-10-22-tenant-plan-entitlements-and-audit/`。

- **平台专用菜单泄漏（P1）**：provisioning 曾逐字复制平台管理员菜单/权限绑定，租户管理员因此看到
  「租户管理/菜单管理/国际化管理」并落到 403。现在 `pkg/tenant/platform_scope.go` 单一分类，
  菜单读取、provisioning、角色写入、权限缓存四处共用；启动时幂等修复存量租户授权；
  前端按租户会话兜底过滤。租户四套餐侧栏均无平台专用项，直连 URL 只渲染 403。
- **登录日志为空（P1）**：审计行过去写入平台 0，租户视图读不到。现在成功登录按签发的 tenant claim、
  失败登录按主体归属租户、MFA 按 challenge 租户落库；compat 保持 0。
- **套餐无差异（P1）**：差异改由前台 `core/entitlements/plans.ts` 注册表驱动，模块声明 feature，
  shell 过滤菜单/路由/dashboard，直连被锁页渲染升级页，租户表单展示只读套餐矩阵。后端不按套餐
  初始化控制台功能，角色权限仍是授权边界；套餐门禁是 UX。
- **验证**：后端真实 MySQL/Redis `-race -p 1` 全量 46 包通过；前端 29 文件 / 212 用例、tsc、ESLint、
  prebuild 13 步（Arco patch + 12 项 contract）、Vite build 通过；四套餐浏览器验收通过。
- **登录边界**：收尾审查修复了同标签页重新登录复用上一主体租户上下文的问题（`Login.tsx` 调用
  `resetTenantSession()`，新增 3 个 store 单测）；四套餐浏览器验收录制于该改动之前，属显式 gap。
- **显式残留**：直连被禁 URL 后已打开标签栏保留标签（P3，页面 403、无数据加载、登录边界清空）。

## 发布收口（2026-10-21，v0.17.0）

v0.16.1 之后合入的 13 个提交（租户隔离整改 #386、#391–#394，依赖升级 #381/#384/#385，
发布管线修复 #383/#387–#390）按 `docs/VERSION_MANAGEMENT_GUIDE.md` §2.3 作为 **minor** 发布为
`v0.17.0`，并发布四件可消费产物，供 `pantheon-ops` 将锁从 v0.16.1 推进到含安全修复的基线。
`sharedPaths` 保持 52 条不变；迁移 `000025`–`000028` 全部 additive；六个业务 overlay 锚点仍唯一命中。
任务包 `2026-10-21-v0170-release-cut`，证据在 `.harness/evidence/2026-10-21-v0170-release-cut/`。

**发布门禁实况（2026-10-21 最终，main `17af0d85`）**：验收整改链 #396→#397→#395→#398→#402 已全部合入 main，
另清理两条 Dependabot 高危（#400 `klauspost/compress`、#403 frontend `follow-redirects`）。
`CI`（含 `go test -race` 两条腿）、`Backend Tests`、`Unit Tests`、`Full Smoke Suite`、`Core Smoke Tests`、
`Security Gates`、`CodeQL`、`Lint Workflows` 全绿；Sonar 分支分析五项条件全 OK、**open issues = 0**、open Dependabot alerts = 0；
**`Release Gate` success**（`Dependabot Alerts` job 首次与告警清零竞态失败，同 commit、同规则复跑转绿）。
维护者定案的两条验收条件——Quality Gate 全过、Open issues 清零——已由 hosted 实测满足。任务包 `2026-10-21-acceptance-remediation`
已置 `completed`，残余动作逐项登记在 `docs/reviews/PANTHEON_BASE_ISSUES_AND_REMEDIATION_2026-10-21.md` §5。

**发布已落地（2026-10-22）**：annotated tag `pantheon-base-v0.17.0`（tag object `d1a167c5`）指向 `728feb2b`，
GitHub Release 于 `2026-10-22T00:17:53Z` 发布，四件产物齐备（tgz 19,903,712 B / `.tgz.sha256` 111 B /
`repo.tar` 34,058,240 B / `repo.tar.sha256` 75 B；tgz SHA-256 `4f2478…922f`），
`Foundation Release Verify` 在 `release: published` 上通过（run 39698850076）。F5 关闭。

## 租户交付硬化（2026-10-20，已完成，冒烟已确认）

2026-10-20 的交付审计发现并关闭了三个阻断项，任务包 `2026-10-20-tenant-delivery-hardening`：

- **P0 权限策略逃逸**：策略端点未绑定租户、`tenantId` 来自请求体，租户可写全局策略/跨租户写/全量读。
  现在写入主语由上下文决定，读/导出/编辑/删除全部限定在 `role:<key>@tenant:<id>`。
- **P0 角色键逃逸**：租户可创建 `admin` / `platform_ops`，登录后继承平台全局授权。现在保留平台命名空间，
  创建/改名/导入一律拒绝。
- **P1 角色生命周期与冒烟**：删除/重命名/Bootstrap 识别域主语；`platform.tenant_mode` 改为公开并在启动修复，
  恢复视角切换器渲染（此前 `Tenant Smoke` 在主干持续红灯，被 `continue-on-error` 掩盖）。

验证：后端全量 `go test ./...`（真实 MySQL）绿；新增 10 条双租户/角色用例；前端 `tsc -b` 绿；
证据见 `.harness/evidence/2026-10-20-tenant-delivery-hardening/`。

**已关闭（2026-10-22）**：`Tenant Smoke (multi-mode)` 已去掉 `continue-on-error`，改为 push-only 的主干健康硬门禁，
最近五次 main 运行全绿（39598957879 / 39584482520 / 39582453605 / 39580935995 / 39572335644）；v0.17.0 发布包已创建并过 Verify。
存量租户若已创建保留角色键，仍需运营按 runbook 清理（未发现存量命中）。

## 遗留项收口（2026-10-22）

任务包 `2026-10-22-release-and-residual-closeout`，证据在 `.harness/evidence/2026-10-22-release-and-residual-closeout/`。

- **F5 tag/release**：已发布（见上节），Verify run 39698850076 success。
- **F2 分支保护**：GitHub ruleset `17011510`（`solo dev merge rules`）active，目标 `~DEFAULT_BRANCH`、无 bypass actors，
  必需检查为 Quality Gates / Security Gates / Unit Tests / CI Summary / SonarCloud Code Analysis。经典 branches API 仍返回 404（规则集模式）。
- **B10 Tenant Smoke 转硬门禁**：`smoke-core.yml` 移除 advisory，保留 push 触发（避免与 PR 级冒烟重复）。
- **G2 静默跳过审计**：`pkg/testmysql` 对齐 `testredis` 的 required 语义，新增 `PANTHEON_TEST_DSN_REQUIRED`；
  CI（`ci.yml` / `quality.yml`）设为 `true`，未配置 DSN 时 fail-loud 而非 skip。全量真库复跑 0 FAIL / 0 SKIP。
- **D2 凭证轮换**：本地 MySQL/Redis 凭证已轮换并验证旧凭证被拒；HEAD 跟踪文件对旧凭证 0 命中。
  **残留**：v0.17.0 的 `repo.tar`（及 tgz 内嵌副本）构建自脱敏前提交 `728feb2b`，仍含已失效的历史凭证字面量；
  因其已失效且发布产物不可变，记录为显式残留，处置（v0.17.1 或经授权替换产物）待维护者决定。
- **浏览器验收**：18 条系统路由，0 控制台错误、0 个 ≥400 响应，8 项只读交互渲染正常（无写入提交）；
  证据 `artifacts/01-dashboard.png` … `08-session-detail-drawer.png`。

## 当前最终验收状态

**判定：v0.17.0 已发布（2026-10-22）**，tag `pantheon-base-v0.17.0` → `728feb2b`，四件产物齐备并通过 Verify（run 39698850076）。
验收整改的 P0/P1 已全部闭合，残余只有 D2 的发布产物凭证残留（已失效、显式登记）与延期 P2/P3 清单。

历史记录：**v0.16.1 已发布（2026-10-20）。** tag `pantheon-base-v0.16.1` → `c83f8e4c`，GitHub Release 带齐四件可消费产物（`foundation-release-pantheon-base-v0.16.1.tgz` 18,500,303 B / `.tgz.sha256` 111 B / `repo.tar` 31,477,760 B / `repo.tar.sha256` 75 B），`Foundation Release Verify` 在 `release: published` 上通过（run 39352195137）。这是自 v0.13.0 以来第一个真正可被消费的发布，`pantheon-ops` 的锁终于可以前进（属消费仓单独变更）。

发布方式需要如实记录：**tag 与 Release 由维护者凭据产出，不是 CI 产出**。仓库 `default_workflow_permissions=read`，三次 hosted 正式切（39350509094 / 39351236715 / 39351991489）分别撞在 App `workflows` 权限、Git database API 403、release 创建 403 上；工作流已收敛为"只读校验 tag + 构建/校验产物"的可重复路径，全自动发布需配置带 `contents:write` 的 PAT secret（维护者授权项）。详见 `.harness/evidence/2026-10-12-v0161-release-cut/`。

（2026-10-19 补记：main 在发布候选之上新增租户整改，以 PR #386 压缩合并为 `8b5a3012`；经维护者确认，v0.16.1 发布范围为**候选提交 `c83f8e4c`**，租户整改随 v0.17.0 minor 发布。）

## 任务状态总览

| 状态 | 说明 |
|------|------|
| ✅ 已完成 | 全部历史任务 + 2026-10-07 整改任务包 + v0.15.0/v0.16.0 发布收口 |
| ✅ 已完成 | v0.16.1 发布收口（`2026-10-12-v0161-release-cut`，四件产物已发布并过 Verify；全自动发布待 PAT secret） |
| ✅ 已完成 | v0.17.0 发布收口（`2026-10-22-release-and-residual-closeout`，F5/F2/B10/G2/D2 + 浏览器验收） |
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
