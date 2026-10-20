---
title: 租户交付硬化任务包（权限逃逸、角色命名空间、租户冒烟）
doc_type: Remediation
layer: platform
depends_on_layers:
  - system/iam
  - system/config
status: Active
linked_contracts:
  - docs/contracts/TENANT_CONTRACT_V1.md
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/SYSTEM_IAM_CONTRACT.md
updated_at: 2026-10-20
---

# Task Packet: 2026-10-20-tenant-delivery-hardening

## Goal

把 2026-10-20 交付审计发现的阻断项全部关闭，使多租户达到可交付状态：

1. **P0 权限策略逃逸**：`permission_handler.go` 的列表/新建/编辑/删除/批量删除/导入/导出/工作台补齐都走未绑定租户的
   `h.service`；`tenantId` 直接来自请求体。结果是租户管理员可以创建**全局**策略、写进别的租户域、读取/导出全部租户策略。
   全局策略会同时命中 `CasbinDomainPolicySubjects` 的全局主语与 `PlatformCapabilityMiddleware` 的平台能力判定，
   工作台的受控补齐表又包含 `/system/tenant/*`，因此构成租户→平台的完整提权链。
2. **P0 角色键命名空间逃逸**：角色创建只校验租户内唯一，租户可以创建 `role_key=admin` / `platform_ops`。
   登录时 JWT 的 roleKeys 原样取自 `system_role.role_key`，Casbin 先查同名全局主语，平台能力中间件按名字放行 `platform_ops`。
3. **P1 角色策略生命周期**：删除角色只删裸主语，租户域策略残留；重命名不迁移策略；`Bootstrap` 每次启动把租户域策略
   当孤儿清空；CSV 导入把角色写成 `tenant_id = 0`；导入与启动查询按裸键跨租户。
4. **P1 租户冒烟红灯**：`platform.tenant_mode` 种子为 `isPublic: 0`，`Bootstrap` 只补缺失行，
   因此升级库永远不公开该键，前端不渲染视角切换器；`Tenant Smoke (multi-mode advisory)` 自 `8ffb00bf` 起
   在主干持续失败，被 `continue-on-error` 掩盖。

## Primary Layer

platform

改动落在 `backend/modules/system/iam/permission`（策略读写）、`backend/modules/system/iam/role`（角色命名空间与生命周期）、
`backend/modules/system/config/setting`（公开标志修复）与五语言 i18n。判定权在 platform 层：契约 §2.3.1 已规定
「读必须带租户谓词、写必须由上下文赋值、冲突键含租户」，本包只是把实现补齐，不新增概念。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `not-required`
- Release Requirement: `foundation-release`

## Dependency Layers

- `platform`：`pkg/tenant` 的主语/能力判定与 `pkg/database` 的 Casbin 策略是共享合同，不在本包改动。
- `system/iam`：策略与角色的租户边界在本层闭合。
- `system/config`：`platform.tenant_mode` 的公开性决定前端是否渲染租户控件。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `permission-policy`
- Portable Failure Class: `scope-drop-on-delegation` / `reserved-namespace-collision`
- Owner Layer: `consumer-repository`
- Ratchet Decision: 新增 10 条双租户 MySQL 用例（策略 6 条、角色 4 条），并用既有 `Tenant Smoke` 锁前端入口
- Coverage Dimensions:
  - behaviour
  - runtime-quality
  - architecture-fitness

## Contract Anchors

- `docs/contracts/TENANT_CONTRACT_V1.md` §2.3.1：读带谓词、写由上下文赋值、裸键归属校验同样算读。
- §3.3/§3.4：平台管理 API 显式声明；只有全局角色或全局策略构成平台能力。
- §4：Casbin domain 主语为 `role:<key>@tenant:<id>`，全局主语先查、域主语后查，不合并。
- `docs/contracts/SYSTEM_IAM_CONTRACT.md`：角色键唯一性与角色生命周期。
- 迁移 `000020`（system_role_permission 的 tenant_id）与新增 `000028`（remediation event 的 tenant_id）。

## Scope

### In

- `permission_handler.go`：所有策略面改走 `svc(c)`；错误映射改为 `common.CodeForError`（403/404/400）。
- `permission_service.go`：`policySubjectForWrite` / `policyInTenantScope` / `applyPolicyTenantScope`；
  列表、导出、导入、补齐、Bootstrap 全部收口；移除请求体决定命名空间。
- `permission_workbench.go`：策略读取按主语解析；补齐记录带 `tenant_id`；事件查询按租户过滤。
- `permission_workbench_remediation_model.go` + 迁移 `000028`：事件表增加 `tenant_id`。
- `role_helper.go` / `role_service.go` / `role_export.go`：保留键拒绝、删除清理域主语、重命名迁移主语、导入带租户。
- `user_username.go`：平台管理员绑定查询固定 `tenant_id = 0`。
- `setting_service.go` / `seed_data.yaml`：`platform.tenant_mode` 公开 + 启动修复。
- 五语言 i18n：`role.key.reserved`。
- 双租户回归测试：`permission_tenant_isolation_test.go`、`role_tenant_isolation_test.go`。

### Out

- 不改 Casbin 模型、domain 主语格式或平台能力定义（契约 §3.4/§4）。
- 不为既有租户自动清理已存在的保留角色键：需要运营确认后重命名（见 Human Gates）。
- 不做租户自定义菜单/权限（2026-10-15 冻结决策）。
- 不动 `.github/workflows/**`、`release-gate.yml`、`.sonarcloud.properties`。
- 不切 v0.17.0（单独发布包）。

## Expected Files

### Create

- `docs/harness/tasks/2026-10-20-tenant-delivery-hardening.task.md`
- `.harness/tasks/2026-10-20-tenant-delivery-hardening/manifest.json`
- `.harness/evidence/2026-10-20-tenant-delivery-hardening/{commands.json,summary.md,review.md}`
- `backend/pkg/database/migrations/000028_permission_remediation_event_tenant.{up,down}.sql`
- `backend/modules/system/iam/permission/permission_tenant_isolation_test.go`
- `backend/modules/system/iam/role/role_tenant_isolation_test.go`
- `backend/modules/system/config/setting/setting_seed_parity_test.go`

### Modify

- `backend/modules/system/iam/permission/{permission_handler.go,permission_service.go,permission_workbench.go,permission_workbench_remediation_model.go,permission_service_test.go}`
- `backend/modules/system/iam/role/{role_helper.go,role_service.go,role_export.go}`
- `backend/modules/system/iam/user/user_username.go`
- `backend/modules/system/config/setting/{seed_data.yaml,setting_service.go}`
- `frontend/src/i18n/resources/{en-US,zh-CN,fr-FR,ja-JP,ko-KR}.ts`

### Do Not Touch

- `backend/pkg/tenant/**`（契约判定实现，本包不改语义）。
- `backend/pkg/database/casbin.go`（平台 admin 的全局策略是预期行为）。
- `backend/modules/system/iam/tenant/tenant_provision.go`（复制逻辑本身正确）。
- `.harness/archive/**` 与历史 evidence。

## Implementation Notes

- **写路径**：租户作用域强制 `role:<key>@tenant:<ctx>`；请求体 `tenantId` 非 0 且不等于当前租户 → `TENANT_FORBIDDEN`。
  平台作用域保留显式指定目标租户的能力（平台控制台的既有功能）。
- **读路径**：租户作用域只匹配 `%@tenant:<id>` 主语；全局行是平台状态，租户不可见。
- **导入/补齐**：先算主语再写，去重键也按主语；角色键在目标命名空间内校验。
- **保留键**：平台命名空间已存在的键 + `platform_ops` 一律拒绝；这是命名空间守卫，不是租户白名单。
- **生命周期**：删除只删自己的主语；重命名把 p 行从旧主语迁到新主语；Bootstrap 的孤儿清理识别域主语。
- **公开标志**：`syncPublicSettingFlags` 只升不降，避免把运营主动隐藏的设置重新暴露。
- **迁移 000028**：`information_schema` 守卫 + 幂等；历史事件保留 `tenant_id = 0`（无法从 role_key 反推租户）。

## Structural Scope

- Affected Subgraph: `route -> handler(tenant ctx) -> permission service(subject resolve) -> casbin_rule -> middleware(domain/global subject)`
- Boundary Crossings: 有。写路径从「请求体 + 裸键」改为「上下文 + 主语」，读路径新增租户谓词；
  角色生命周期跨 `system_role` 与 `casbin_rule`，由同一事务维护。
- Risk Nodes: 若主语解析漏掉域形式，租户会重新写入全局策略；若 Bootstrap 仍按裸键清理，租户策略会在重启后消失。
  两者各有双租户用例锁死。
- Graph Focus: 「页面权限键」与「API 策略主语」是两个判定；租户边界必须同时落在两者上，任何只按裸键工作的路径都是逃逸面。

## Execution Roles

- Implementer Posture: 先证明逃逸（临时双租户用例），再改实现，最后把用例固化为回归。
- Reviewer Posture: 复核「请求体是否还能决定命名空间」「租户是否还能命中全局主语」「Bootstrap 是否还会删域主语」。

## Dependency Plan

| Wave | 优先级 | 工作项 | 依赖 | 关闭条件 |
| --- | --- | --- | --- | --- |
| 0 | P0 | 复现：租户创建全局策略、跨租户写、全量读、保留角色键 | 无 | 四条临时用例全绿（证明缺陷存在） |
| 1 | P0 | 策略handler/service/workbench 收口 + 保留角色键 | Wave 0 | 新回归用例全绿 |
| 2 | P1 | 角色删除/重命名/Bootstrap/导入/裸键启动查询 | Wave 1 | 角色与 Bootstrap 用例全绿 |
| 3 | P1 | `platform.tenant_mode` 公开 + Bootstrap 修复 | Wave 2 | setting 用例全绿 |
| 4 | P1 | 证据、review、门禁、CI | Wave 3 | 全量测试 + 前端 typecheck + 门禁 + Tenant Smoke 绿 |

## Verification Plan

- Static: `cd backend && go build ./... && go vet ./modules/system/...`；`cd frontend && npx tsc -b`。
- Unit（MySQL）: `go test -count=1 ./...`；
  - `TestPermissionPolicyTenantScope_*`（6 条）
  - `TestPermissionBootstrapPreservesTenantDomainPolicies`
  - `TestRoleTenantScope_*`（4 条）
  - `TestSettingSeed*` / `TestSettingBootstrapRepairsNonPublicTenantMode`
- Repo gates: `node scripts/harness/check-task-packet.mjs --root .`、`node scripts/frontmatter-check.mjs`。
- CI: `Tenant Smoke (multi-mode advisory)` 的 Playwright 断言（本机不能起浏览器）。

## Evidence Required

- `commands.json`：每条命令的目录、状态与真实输出摘要，含改前复现结果。
- `summary.md`：缺陷、修法、影响面、残余风险。
- `review.md`：结论与复核要点，显式声明浏览器层未在本地执行。

## Human Gates

- 既有租户若已创建 `admin`/`platform_ops` 角色，需要运营重命名并清理其 Casbin 策略；本包只阻断新增。
- `Tenant Smoke` 是否取消 `continue-on-error` 由维护者决定。
- v0.17.0 是否发版由维护者决定（本包不切版本）。

## Linkage

- Task ID: `2026-10-20-tenant-delivery-hardening`
- Task Manifest: `.harness/tasks/2026-10-20-tenant-delivery-hardening/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Evidence Directory: `.harness/evidence/2026-10-20-tenant-delivery-hardening/`
- Review File: `.harness/evidence/2026-10-20-tenant-delivery-hardening/review.md`
- Plan References: `docs/contracts/TENANT_CONTRACT_V1.md`、`.github/workflows/smoke-core.yml`

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] 策略面全部绑定请求租户，请求体不能决定命名空间
- [x] 租户域拒绝 `admin` / `platform_ops` 与平台同名角色键
- [x] 角色删除/重命名与 Bootstrap 孤儿清理识别域主语
- [x] `platform.tenant_mode` 公开且启动可修复
- [x] 双租户回归覆盖创建/读取/导出/导入/补齐/角色生命周期
- [x] 全量后端测试、前端类型检查与仓库门禁通过
- [ ] CI 实跑确认 `Tenant Smoke (multi-mode advisory)` 转绿
