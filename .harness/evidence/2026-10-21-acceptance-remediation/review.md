# 2026-10-21-acceptance-remediation — Review

复核立场：不接受「没有发现问题」当作「证明没有问题」。逐条对照任务包 In/Out，并以「还能不能走通逃逸路径」为唯一判据。
所有结论区分三层：**代码已证**（本地真实 MySQL 用例）、**CI 待证**（本机无法执行）、**未覆盖**（既没跑也没计划）。

## 1. 复核问题与结论

| 复核问题 | 结论 | 依据 |
|---|---|---|
| 租户还能改写全体租户可见的共享资源吗？ | 代码已证否 | `system_modules.go` 菜单写三条路由与 i18n 管理组加 `PlatformCapabilityMiddleware`；`platform_capability_middleware_test.go` 证明租户域 Casbin 授权（含 `/api/v1/*` 全覆盖式 grant）不满足平台判定 |
| 请求体/请求头还能决定租户命名空间吗？ | 代码已证否（compat） | `pkg/tenant/tenant.go`：`WithTenantScope`/`WithTenantWrite` 改为仅 nil 上下文不过滤，compat 走 pin 0 的硬过滤；`tenant_scope_sql_test.go` 断言生成的 SQL 谓词 |
| multi→compat 降级还能静默扩大可见集吗？ | 代码已证否 | `setting_service.go` 的 `guardTenantModeDowngrade`：存在非 deleted 的活租户时返回 `setting.tenantMode.downgradeBlocked`；`setting_tenant_mode_guard_test.go` 覆盖有/无活租户两分支 |
| 被挂起租户/被移除成员还能访问吗？ | 部分：撤销写入代码已证；会话校验链路为既有实现 | `tenant_service.go` 撤销 active 成员的 `revoked_at`，`tenant_service_session_revocation_test.go` 验证只作用于本租户 active 成员、他租户会话不动 |
| 新租户还缺字典吗？ | 代码已证否 | `tenant_provision.go` 复制平台字典；`tenant_provision_dicts_test.go` 覆盖首次复制、重复 provisioning 幂等、租户自有键优先 |
| 租户还能占用平台角色键吗？ | 代码已证否 | `role_helper.go` 双向互斥 + `excludeRoleID` 自排除；`role_key_namespace_test.go` 覆盖创建、重命名、平台侧编辑租户同名键 |
| 错误响应还泄漏内部错误吗？ | 代码已证否 | `tenant_handler.go` 统一 `common` 信封；`tenant_handler_test.go` 断言内部错误串不出现在响应体 |
| OIDC schema 还在迁移链外吗？ | 代码已证否 | 新增守卫式 `000029_oidc_fields.{up,down}.sql`，删除 `add_oidc_fields.sql`；`migrate_test.go` 覆盖链完整性，唯一键含 `tenant_id` |
| 会话边界还残留预热数据/二次验证凭据吗？ | 代码已证否 | `prefetch.ts` + `AppLayout.tsx` 失效路由预热数据；`request.ts` + `Login.tsx` 清理 operation token；两个前端用例锁定 |
| Tenant Smoke 红灯是被掩盖还是被修好？ | 部分：`AddMember` 400 这条真实触发已代码已证关闭；但作业本身 flaky，不能声称单根因，最终转绿 CI 待证 | 同一 commit `ce82b94e` 上 job 119005706470 FAIL（`tenant-viewpoint-switcher.spec.ts:233` 等不到「用户已创建并加入租户成员」）与 job 119067519288 PASS（同一条断言通过，10 passed）并存 → 结果不稳定；`AddMember` 幂等化、未改 `continue-on-error`、未屏蔽失败测试；第一根因（`platform.tenant_mode` 公开）已在 #393 合入 |
| 本地「全绿」可信吗？ | 不可信，须先查 skip：Redis 未配时 `pkg/testredis.Open` 静默 skip，`TestSessionAdminOps_CompatPinsToPlatformTenant` 因此在本地假绿、在 CI 真红 | 配 MySQL+Redis 复现出与 CI 一致的 `got total=3`；断言按 `applyAdminSessionFilters` 的 nil-query 语义修正（改测试不改产品码），全量 46 包含 Redis 重跑 `EXIT=0` 且无 skip 提示 |
| 生产构建还是 debug mode 吗？ | 代码已证否 | `main.go` 强制 release mode + `Dockerfile` 构建参数；`main_test.go` 锁定 |

## 2. Scope 一致性

- In 全部落地；Out 未被侵入：Casbin 模型与 domain 主语格式未改；`.github/workflows/**` 未改（门禁红灯没有被下调为 advisory，也没有跳过测试）；
  `pantheon-ops` 未动；未新增业务模块能力；无 API 路由、权限码、菜单键、i18n key 删除。
- 迁移 000029 是 additive 且带 down，符合「不做危险数据库操作」的约束：未在真实业务库执行任何破坏性语句，
  验证全部走 `pkg/testmysql` 的隔离库。

## 3. 诚实记录：本包修复过程自身引入的回退

R1（SQL 缺占位符导致 1064）、R2（反向互斥把被编辑角色自身判为冲突）、R3（测试漏 `.Error` 使断言恒假）、
R4（tenant 测试 fixture 缺字典表导致 40 条失败）都是本包引入、随后修复的问题。四条都写进 `summary.md` 与问题台账，
不作为「一次到位」呈现。根因值得记录：R1/R2/R4 只有当测试真的跑在 MySQL 上才会暴露，而此前缺 DSN 时套件静默 skip。

同时记录一条流程错误：审查过程中我曾先给出「61 packages ok」的结论、随后发现工具输出并不支持并显式撤回。
后续 evidence 只引用实际捕获的命令输出。

同类误判还有一次，且更值得记进 ratchet：`TestSessionAdminOps_CompatPinsToPlatformTenant` 在本机是绿的，
因为 `pkg/testredis.Open` 在未配 `PANTHEON_TEST_REDIS_ADDR` 时静默 skip，本地根本没执行它；CI 才暴露真实断言错误
（`got total=3`）。配好 MySQL+Redis 复现后确认错的是测试期望而非产品代码：`applyAdminSessionFilters` 在 `query == nil`
时不加任何过滤，维护视图的 `Total` 天然含 revoked 行。断言已改成 `Total=3 / ActiveCount=2` 并要求三个会话 ID 全部在场。
教训与 R1-R4 同源：**skip 与 pass 在本仓库的 helper 里长得一模一样**，任何「本地全绿」都必须先核对 skip 日志，
否则等于没跑。

SonarCloud 侧另有一条真实待办：`Service.AddMember()` 的原样 SQL 片段被 `gosecurity:S3649` 判为 BLOCKER（占位符已参数绑定，属误报），
本轮用 map 条件消除；`go:S1192`、`go:S3776` 两条新代码异味一并处理。三者都只是让门禁可读，不改变运行语义。

## 4. 未覆盖 / CI 待证（显式 gap，不包装成已完成）

1. ~~`go test -race ./...`~~ 已由 CI 复验关闭：main `c17ef999` 上 `Unit Tests`（`ci.yml`：`go test -race -short ./...`）与 `Backend Tests`（`quality.yml`：`go test -race ./...`）均 success。本机仍无 C 工具链，所以证据在 CI 而不在本地。
2. 浏览器层：Playwright L1/L2、`Tenant Smoke (multi-mode advisory)` 实跑、维护者的最终视觉/功能验收，本机不可执行。
3. HTTP 层端到端跨租户 curl 对抗矩阵（经真实网关 + Redis token）未搭建；结论建立在 handler/中间件层 httptest 与 SQL 断言之上。
4. 备份/恢复与升级演练（含 000029 在既有库上的接管）未执行。
5. 性能维度只做了既有 benchmark 与代码走查，没有压测环境，不构成性能结论。
6. 台账延期项（A4-A10、B7-B11、C3-C12、D3-D6、E3-E7、F10-F14）与需要维护者的动作
   （凭据轮换 D2、分支保护 F2、advisory→blocking B10、tag/release 发布）保持 open。

## 5. 合并前门禁判断

本 PR 的高风险面（租户边界、会话边界、共享 `pkg/*`、迁移）应由 GitHub required checks、CodeQL 与分支保护做最终裁决；
本地证据不足以支持「可直接合并」。第二人复核在 solo 仓库不可得，因此不声称获得审批，
`review.md` 只声明自查立场与未覆盖项。

实况记录（不粉饰）：#396 在 `Backend Tests` / `Unit Tests` / `CI Summary` / `Quality Gates` 四项红灯下被合并进 `release/v0.17.0`，
合并后 `462216ec` 上的 push 触发运行同样为这四项红灯——四条是同一个根因（R5 的会话用例断言），`Core Smoke Tests` 与其余门禁全绿。
`SonarCloud Code Analysis` 独立失败（Security Rating on New Code 未达 A）。
本轮跟进提交只携带经复现证实的最小修复：修正测试期望、消除 Sonar 三条新代码问题、把 skip 掩盖写进 evidence。
在 CI 用真实 MySQL+Redis 复跑转绿之前，`release/v0.17.0` 的测试门禁状态仍是「未证明」，不得据此打 v0.17.0 tag。

**跟进 PR #397 的结果改变了这个判断的一半**：`Backend Tests` / `Unit Tests` / `Coverage Gate` / `CI Summary` / `Quality Gates`
已在同一 head 上实测全绿，R5 的根因诊断被 CI 证实；仍红的是 `SonarCloud Code Analysis`，其 `gosecurity:S3649` 在改成 map 条件后依旧报三条 BLOCKER，
说明该规则不看绑定、只看请求值是否参与构造查询。写路径已进一步收敛为按主键 + 显式列的类型化更新，
读路径的污点边无法在不抑制的前提下消除。⇒ 安全门禁的收口只能是维护者在 Sonar 侧标记误报或在门禁上让步；
本包没有加 `NOSONAR`、没有排除规则、没有贴 `solo-override`。因此 v0.17.0 的 tag 前置条件由「测试+安全门禁全绿」变为「安全门禁有维护者处置」，
测试维度已证。

**PR #398 合并后的最终口径（2026-10-21，实测）**：#398 合并为 main 的 `c17ef999`，合并前所有 GitHub 门禁 pass，PR 级 Sonar `project_status = OK`、新代码问题 0；
但 main 的 push run 显示 `Release Gate` failure——分支级 Sonar 分析 `new_security_rating` = E，`gosecurity:S3649` 在 `Service.AddMember()` 剩两条 OPEN（`:711` 读、`:726` 写）。
两个口径不能混用：PR 泄漏期只覆盖本次 diff，分支泄漏期覆盖落入 main 的全部新增行，因此「PR 绿」不推翻「分支红」，本轮不把它写成安全门禁收口。
main 其余维度全绿（`CI`、`Full Smoke Suite`、`Core Smoke Tests`、`Security Gates`、`CodeQL`、`Lint Workflows`），
其中此前判为 flaky 的 `Full Smoke Suite`（含 Tenant Smoke）这轮为 success——按一次通过记录，不据此改口称其稳定。
⇒ 结论：测试与功能门禁已全部有证；唯一未闭合项是扫描器口径下的绑定参数误报，属维护者的 Sonar 处置决定，处置前不打 tag。
