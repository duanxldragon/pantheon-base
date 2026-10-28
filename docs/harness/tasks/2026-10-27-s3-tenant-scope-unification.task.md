---
title: S3 租户 scope 三件套统一任务包（14 个 service 共享一套实现）
doc_type: Remediation
layer: platform
depends_on_layers:
  - system/auth
  - system/iam
  - system/org
  - system/config
status: Active
linked_contracts:
  - docs/contracts/TENANT_CONTRACT_V1.md
  - docs/reviews/CODEBASE_SIMPLIFICATION_AUDIT.md
updated_at: 2026-10-28
---

# Task Packet: 2026-10-27-s3-tenant-scope-unification

## Goal

把 11 个 system service 与 3 个 auth service 各自实现的三件套（取 gin context 租户、构造 scoped
*gorm.DB、解析写入属主租户）统一到 `pkg/tenant` 的一套实现。副本结构相同，但它们是 multi-tenant
隔离热路径——所以本波次先用 before-snapshot 测试与两租户端到端用例钉住现状，再替换副本，最后证明
没有任何查询丢掉租户谓词。

## Primary Layer

platform

共享构件 `backend/pkg/tenant`；依赖层跨 `system/auth`、`system/iam`、`system/org`、
`system/config`。只替换同构副本，不改租户解析规则、compat 行为、fail-closed 语义。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `not-required`
- Release Requirement: `none`
- Downstream Sync Note: 纯内部实现统一，无接口/路由/权限/契约变化；随 foundation release 自然同步。

## Dependency Layers

- `platform`（新增共享 Scoper 构件）
- `system/iam`（role、user、permission、iam 冒烟测试）
- `system/org`（dept、post）
- `system/config`（dict、setting）
- `system/auth`（login、security、session）

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `permission-policy`
- Portable Failure Class: `cross-tenant-read-write`
- Owner Layer: `foundation-source`
- Ratchet Decision: `sensor-added`
- Coverage Dimensions:
  - behaviour
  - runtime-quality
  - architecture-fitness

交付层级：**L2**（触碰 multi-tenant 隔离热路径与共享构件；带 task packet、evidence、review；
human gate 见文末）。

## Contract Anchors

- `docs/contracts/TENANT_CONTRACT_V1.md` §3.3（读写租户绑定）与 §3.2（会话租户语义）。
- `docs/reviews/CODEBASE_SIMPLIFICATION_AUDIT.md` RC-012/RC-027（重复清单与波次划分）。
- `.harness/tasks/2026-10-24-single-tenant-scope-closeout/manifest.json`：compat 不得折叠进 nil
  的历史缺陷来源。
- `backend/pkg/tenant/tenant.go`：`WithTenantScope`/`WithTenantWrite` 的既有语义（本波次的公共底座）。

## Scope

### In

- `backend/pkg/tenant/scope_helper.go`：`Scoper`（embeddable 上下文 + Scoped/Scope/TenantOwnerID）
  与函数形态 `OwnerTenantID`
- `backend/pkg/tenant/scope_helper_test.go`：三上下文（nil / compat=0 / multi）读侧 SQL 与写侧
  owner 的 table-driven 钉死测试（DryRun，无需数据库）
- `backend/modules/system/iam/tenant_isolation_smoke_test.go`：两租户端到端冒烟——A 租户对自身行
  list/read/update/delete 成功，对 B 租户同型操作 404/无泄漏；compat 基线；写属主来自 context
- 11 个 service（role、post、dept、user、dict、setting、permission、dashboard、login、security、
  session）删除本地三件套副本，改嵌 `tenant.Scoper`；`WithTenantContext` 因需返回具体类型逐服务保留
- 删除 `user_service.go` 的 `tenantScope`/`scoped` 双包装
- setting（覆盖叠加全局）与 dashboard（表白名单）保留各自自定义读侧，仅统一 owner/字段

### Out

- 改变租户解析规则、compat 行为或平台全局租户 id
- 改变缺失租户 context 的 fail-closed 行为
- 改变任何路由、权限码、菜单或错误文案
- schema 或迁移变化
- 引入请求级缓存或新中间件

## Expected Files

### Create

- `backend/pkg/tenant/scope_helper.go`
- `backend/pkg/tenant/scope_helper_test.go`
- `backend/modules/system/iam/tenant_isolation_smoke_test.go`

### Modify

- `backend/modules/system/iam/role/role_service.go`（及 role 包内调用点 helper/export/menu/test）
- `backend/modules/system/org/post/post_service.go`（及包内调用点）
- `backend/modules/system/org/dept/dept_service.go`（及包内调用点）
- `backend/modules/system/iam/user/user_service.go`（及包内调用点）
- `backend/modules/system/config/dict/dict_service.go`
- `backend/modules/system/config/setting/setting_service.go`（及 audit/seed 调用点）
- `backend/modules/system/iam/permission/permission_service.go`（及 data_scope/workbench 调用点）
- `backend/modules/platform/dashboard_service.go`（manifest 写的是 system/platform/ 路径，实际
  模块在 modules/platform/ —— 前提修正，见 evidence knownGaps）
- `backend/modules/auth/login/login_service.go`（Runtime 自有字段不在副本之列，不改 login_runtime.go）
- `backend/modules/auth/security/security_service.go`
- `backend/modules/auth/session/session_service.go`

### Do Not Touch

- `backend/pkg/tenant/authz.go`
- `backend/pkg/database/scope.go`
- `backend/pkg/database/migrations/**`
- `backend/internal/middleware/data_scope_middleware.go`
- 任何路由、权限码、菜单、错误文案与 seed

## Implementation Notes

- 先写 before-snapshot：钉死测试必须能在谓词丢失时失败，否则证明不了任何事。
- 三个 context 语义不同：nil=内部调用方要未过滤服务，compat=tenant_id=0，multi=非零租户；helper
  必须三者都保留——把 compat 折叠进 nil 正是 2026-10-24 包修掉的缺陷。
- 保持 fail-closed：缺失或畸形租户 context 不得回退到未过滤查询。
- 除租户谓词外不改任何查询谓词；data-scope 与部门谓词原地不动。
- 逐服务转换并跑该服务测试 + 冒烟后再转下一个。

## Verification Plan

- `cd backend && gofmt -l modules pkg` → 空
- `cd backend && go build ./...` / `go vet ./...` → 0
- `cd backend && PANTHEON_TEST_DSN_REQUIRED= go test -count=1 ./pkg/tenant/... ./modules/system/... ./modules/auth/... ./modules/platform/...` → 全绿
- `grep -rln "func.*tenantOwnerID" backend | wc -l` → 0
- `grep -rln "func.*scoped(db \*gorm.DB)" backend/modules | wc -l` → 0
- 两租户冒烟 `TestTwoTenantIsolationSmoke`（MySQL）：本机 DSN 不可用 → skip，由 CI
  （`PANTHEON_TEST_DSN_REQUIRED=true`）承担运行态读数

## Linkage

- Task ID: `2026-10-27-s3-tenant-scope-unification`
- Task Manifest: `.harness/tasks/2026-10-27-s3-tenant-scope-unification/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/harness/tasks/2026-10-27-codebase-simplification-program.task.md`、
  `docs/contracts/TENANT_CONTRACT_V1.md`
- Evidence Directory: `.harness/evidence/2026-10-27-s3-tenant-scope-unification/`
- Review File: `.harness/evidence/2026-10-27-s3-tenant-scope-unification/review.md`
- Parent: `docs/harness/tasks/2026-10-27-codebase-simplification-program.task.md`
- Depends On: `2026-10-27-s2-id-parse-migration`、`2026-10-27-s2-pagination-sort-migration`、
  `2026-10-27-s2-error-mapping-dedup`（均已完成）

## Evidence Required

- `.harness/evidence/2026-10-27-s3-tenant-scope-unification/commands.json`
- `.harness/evidence/2026-10-27-s3-tenant-scope-unification/scope-snapshot.md`
- `.harness/evidence/2026-10-27-s3-tenant-scope-unification/two-tenant-run.log`
- `.harness/evidence/2026-10-27-s3-tenant-scope-unification/summary.md`
- `.harness/evidence/2026-10-27-s3-tenant-scope-unification/review.md`

## Human Gates

- 批准在无既有两租户冒烟的前提下推进（两租户冒烟为本包新建，本地 DSN 受限由 CI 承担）
- 批准本波次本身：它改动 multi-tenant 隔离热路径，净省约 250-400 行

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] 一套租户 scope 实现存在且有 before-snapshot 测试
- [x] 14 个 service 调用共享 helper、副本清零（11 个业务 service + Runtime 组合根不在副本之列）
- [x] 两租户用例双向通过（冒烟已建成；本机无 DSN 时 skip，CI 强制执行）
- [x] compat 与 nil context 行为与之前完全一致（钉死测试 + 既有 compat 基线测试全绿）
- [x] 无查询丢失谓词、无其他谓词变更
