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
| Tenant Smoke 红灯是被掩盖还是被修好？ | 第二根因代码已证关闭；最终转绿 CI 待证 | `AddMember` 幂等化；未改 `continue-on-error`、未屏蔽失败测试；第一根因（`platform.tenant_mode` 公开）已在 #393 合入 |
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

## 4. 未覆盖 / CI 待证（显式 gap，不包装成已完成）

1. `go test -race ./...`：本机无 C 工具链（cgo 启动失败），未执行。由 CI `quality.yml` / `ci.yml` 复验。
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
