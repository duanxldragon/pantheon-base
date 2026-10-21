# 2026-10-21-acceptance-remediation — Summary

## 结论

2026-10-21 全景验收共记录 1 个 P0、若干 P1/P1-latent 与工程化/治理缺口。阻断阶段性验收的项已全部关闭并有回归锁定；
未阻断项按「显式延期」处理，明细见 `docs/reviews/PANTHEON_BASE_ISSUES_AND_REMEDIATION_2026-10-21.md`。

| 编号 | 缺陷 | 严重度 | 修复 | 状态 |
|---|---|---|---|---|
| B1 | 共享菜单树写路由缺平台能力判定，租户可改写全体租户可见资源 | P0 | FIX-1 `system_modules.go` 接入 `PlatformCapabilityMiddleware` | closed |
| B3 | i18n 系统资源写路由同类缺口 | P1 | FIX-1 同一路径收口 | closed |
| B2 | compat 模式租户作用域未固定 + multi→compat 无降级守卫 | P1 | FIX-2 `pkg/tenant/tenant.go` pin 0、`setting_service.go` 拒绝降级 | closed |
| B5 | 租户挂起 / 成员移除不撤销在线会话 | P1 | FIX-3 `tenant_service.go` 写 `revoked_at`（只作用于 active 成员） | closed |
| B4 | 新租户 provisioning 不复制平台字典，页面标签为空 | P1 | FIX-4 `tenant_provision.go` 幂等 `INSERT…SELECT + NOT EXISTS` | closed |
| B6 | 角色键命名空间单向守卫 | P1 | FIX-5 `role_helper.go` 双向互斥 + 重命名排除自身 | closed |
| C1 | OIDC schema 游离在编号迁移链之外 | P1 | FIX-8 折入 `000029_oidc_fields.{up,down}.sql`，删除 `add_oidc_fields.sql` | closed |
| C4 | OIDC 唯一键缺租户维度 | P2 | FIX-8 迁移内加 `tenant_id` | closed |
| C2 | tenant handler 旧式错误体且透出内部错误 | P1 | FIX-7 统一 `common` 错误信封，内部错误只落日志 | closed |
| E1 | 路由预热缓存跨账号/会话复用 | P1 | FIX-9 `prefetch.ts` + `AppLayout.tsx` 会话边界失效 | closed |
| E2 | 登出不清理二次验证 operation token | P1 | FIX-10 `request.ts` + `Login.tsx` 清理 | closed |
| F1 | AddMember 非幂等返回 400，钉住视角建用户后加入本租户报 membership 失败 | P1 | FIX-11 AddMember 幂等化 | closed（代码层）；Tenant Smoke 判定见下 |
| D1 | 生产构建未强制 Gin release mode | P2 | FIX-6 `main.go` + `Dockerfile` | closed |

## 关键根因说明

- **B1/B3**：判定缺失不是权限键问题，而是「共享资源的写」从未走过平台能力判定。租户即使合法持有 `system:menu:*` 键，
  写的也是全局树。修法在中间件层收口，而不是在 handler 里加租户推断——后者正是 #393 之前失败的路径。
- **B2**：compat 的语义是「只有一个租户 0」。此前作用域解析仍接受外部 `tenant_id`，等于在单租户部署上留着跨租户读通道；
  降级守卫缺失则让 `multi → compat` 变成「所有数据变成一个租户的」。
- **B5**：授权生命周期与会话生命周期不对齐。撤销写 `revoked_at` 而非删行，保留审计且可重放。
- **B4/F1**：都是「provisioning/冒烟 setup 的第二步撞第一步」，用同一形状的幂等语句关闭，避免重复 provisioning 撞唯一键。

## 修复过程中我自己引入的回退（R1-R4，均已修复）

| 编号 | 现象 | 根因 | 修复 |
|---|---|---|---|
| R1 | `Error 1064` 语法错误 | FIX-5 的 SQL 片段拼成 `"tenant_id "+column` 少了 `?` 占位符 | `role_helper.go` 补齐占位符 |
| R2 | `TestPlatformEditOfTenantRoleKeepsGrantInRoleTenant` 失败 `role.key.reserved` | 反向互斥把被编辑角色自身也算进冲突 | `ensureRoleKeyAllowed(roleKey, excludeRoleID)` |
| R3 | 会话撤销用例恒失败 | 测试写成 `db.Exec(...)` 未取 `.Error`，在有 DSN 时恒为真 | 补 `.Error` |
| R4 | 首次真实 MySQL tenant 套件 40 条失败 | `tenantTestDDL` 缺 `system_dict_type` / `system_dict_item`（1146），FIX-4 复制直接失败 | fixture 按生产 DDL 补齐 |

R1-R4 全部记录而非隐藏：其中三条只有在套件真的跑在 MySQL 上时才可见，之前它们因为缺 DSN 而静默 skip。
这正是本仓库反复出现的「DB-skip 掩盖」问题（见验收报告环境限制章节）。

### Redis-skip 掩盖（R5）与 CI 复核结论

| 编号 | 现象 | 根因 | 修复 |
|---|---|---|---|
| R5 | `TestSessionAdminOps_CompatPinsToPlatformTenant` 本机“通过”、CI 失败 `session_tenant_scope_test.go:225: nil-context view must still span tenants, got total=3` | 两层问题叠加：① 本机未配 `PANTHEON_TEST_REDIS_ADDR`，该用例在 `pkg/testredis.Open` 处静默 skip，本机根本没跑；② 断言本身写错——把维护视图的 `Total` 当成活跃会话数 | 配好 MySQL+Redis 复现出与 CI 一致的红；按 `applyAdminSessionFilters`（`query == nil` 时不加任何过滤）的真实语义改为断言 `Total=3 / ActiveCount=2` 并要求三个会话 ID 全部在场。改的是测试期望，产品代码未动 |

- 配好 MySQL **和** Redis 后全量重跑：46 个包 `ok`、`EXIT=0`，日志中不再出现 `redis addr is not configured` 的 skip 提示，说明此前被 Redis-skip 掩盖的用例已全部真实执行。
- **Tenant Smoke 是 flaky，不是单一根因**：同一 commit `ce82b94e` 上先出现 FAIL（job 119005706470，`tenant-viewpoint-switcher.spec.ts:233` 等不到「用户已创建并加入租户成员」）又出现 PASS（job 119067519288，同一条断言 7.6s 通过，10 passed）。FIX-11 消除的是其中一个真实触发条件（membership 重复插入返回 400），不能声称它关闭了全部原因。
- **PR #396 合并时的门禁实况**：`Backend Tests` / `Unit Tests` 因 R5 的红失败，`CI Summary`（`UNIT_TESTS` 与 `COVERAGE_GATE` 为关键项）与 `Quality Gates`（`Backend Tests: failure`）是其下游聚合，`SonarCloud Code Analysis` 独立失败于 Quality Gate 条件「Security Rating on New Code ≥ A」。合并发生在这些红灯之下，因此本文件的“closed”只表示代码层修复，不表示门禁已复验通过。

## 影响面

- 收紧的判定：共享写面能力判定、compat 作用域解析、角色键命名空间、OIDC 唯一键、会话撤销。
- 响应契约：`/system/tenant/*` 错误体改为统一信封（成功体与 HTTP 码不变），不再透出内部错误串。
- 数据库：新增迁移 000029（守卫式、幂等、带 down）；无破坏性变更。
- 未删除任何 API 路由、权限码、菜单键或 i18n key。

## PR 链路与门禁实况（2026-10-21 收口）

| PR | 范围 | 结果 |
|----|------|------|
| #396 | 整改主体 → `release/v0.17.0`（`462216ec`） | 已合并，但合并时 `Backend Tests` / `Unit Tests` / `CI Summary` / `Quality Gates` 四项红于 R5 |
| #397 | 修 R5 掩盖的会话断言 + map 条件清异味 → `release/v0.17.0`（`21de18ee`） | 已合并；四项红灯实测转绿，仅 `SonarCloud Code Analysis` 仍红（`gosecurity:S3649`×3） |
| #395 | `release/v0.17.0` → `main`（merge `762d94a5`，tree `f7135e30`） | 已合并；rollup 除 Sonar FAILURE 外全绿（Draft PR Handler / PR Smoke Core Optional 为 SKIPPED），分支随后删除 |
| #398 | 写路径按主键更新（S3649 二次处置）+ evidence/文档收口 → `main`（head `3bb7f3d8`） | 本 PR；CI 与 Sonar 结论以本轮 hosted run 为准 |

- base 改指 `main` 的原因：#395 合并后 `release/v0.17.0` 已不存在，`gh pr create --base release/v0.17.0` 报 `Base ref must be a branch`。
- `main` 内容等价性已核对：`git/commits/762d94a5` 的 tree == 本地 `597548e4` 的 tree（`f7135e30`），且 `main` 上的 `tenant_service.go` 含 `membershipScope`、`session_tenant_scope_test.go` 含修正断言，
  证明 #396/#397 内容已进入 `main`；#395 为 squash 合并，故 `21de18ee` 不是 `main` 的祖先（object API 404 属预期）。
- `pantheon-base-v0.17.0` tag 仍未创建：远端 tags 最新为 `v0.12.0`/`pantheon-base-v0.16.1` 序列，`main` 仍带 Sonar 红灯，处置权在维护者。

## 残余风险与未验证项

- 本机无 C 工具链：`go test -race ./...` 无法执行，只有 CI 能复验（`quality.yml` / `ci.yml`）。
- SonarCloud 红灯 `gosecurity:S3649`（`Service.AddMember()` 的 `tenant_id = ? AND user_id = ?` 原样 SQL 片段被判注入源，BLOCKER）：
  占位符其实已参数绑定，属污点跟踪误报。PR #397 实测：map 条件 + `assertScopedSQL` 清掉了 `go:S1192` / `go:S3776` 两条异味，
  但 `S3649` 依旧在该函数报三条 BLOCKER ⇒ 规则不看绑定，只看请求值是否参与构造查询。写路径进一步改为按主键 + `Select` 类型化更新，
  读路径的污点边无法在不抑制的前提下消除，最终收口需要维护者在 Sonar 侧标记误报；本包未加 `NOSONAR`、未排除规则。
- `github.com` 在本机不可达（`api.github.com` 可达）：跟进提交只能通过 Git Data API 重放；本地 `main` 也无法 fetch/ff。
- 本机不能起浏览器：Playwright 层 Tenant Smoke 与视觉/交互验收未执行。
- HTTP 层跨租户 curl 对抗矩阵、备份/恢复与升级演练未在本机执行。
- ops 消费侧继承是独立变更；迁移 000029 需在部署前先跑。
- 台账延期项（A4-A10、B7-B11、C3-C12、D3-D6、E3-E7、F10-F14）与需要维护者动作的项
  （凭据轮换、分支保护、advisory→blocking、tag/release 发布）保持显式 open。
