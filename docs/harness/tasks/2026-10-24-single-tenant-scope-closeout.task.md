---
title: 单租户（compat）模式租户作用域失效收口：字典/部门无法删除与全业务冒烟
doc_type: Remediation
layer: platform
depends_on_layers:
  - system/config
  - system/org
  - system/iam
status: Active
linked_contracts:
  - docs/contracts/TENANT_CONTRACT_V1.md
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-10-24
---

# Task Packet: 2026-10-24-single-tenant-scope-closeout

## Goal

单租户（compat）模式下，用户在字典管理与部门管理里无法删除记录。复现后确认不是主键缺失：
字典类型/字典项/部门表都有主键。根因是 opt-in 租户作用域在 compat 上下文下被服务层丢弃：

1. `DictService`、`DeptService`、`PostService`、`UserService`、`RoleService`、
   `PermissionService` 的 `WithTenantContext` 写成 `ctx == nil || !ctx.IsMulti()` 时返回共享
   服务，于是 compat 请求携带的 `tenant_id = 0` 上下文被丢弃，读写落到未过滤的全局查询。
   单租户部署一旦存在历史租户数据（本机开发库有 tenant 282/303 残留），平台视图会把其他
   租户的同名/同 key 行一起纳入，删除命中不了调用方可见行或删除结果与预期不一致，表现为
   “字典删不掉、部门删不掉”。
2. 部门/岗位的导入导出路径映射 `impexp.BuildDeptPathMaps` 未走租户作用域，导入时按
   `parent_id + dept_name` 查父部门也未走作用域，新建行未写请求租户；跨租户同名路径会串树，
   单租户导入会命中其他租户的父节点或直接 `dept.not_found`。
3. 字典项排序 `ReorderDictItem` 的读取、邻居查询和两处更新都未走作用域，构成跨租户 IDOR。
4. 作用域化后，历史遗留的“租户行挂在其他租户父节点下”的孤儿行会让整棵路径映射构建失败；
   路径映射需要对不在已加载集合内的父节点按路径边界处理，而不是让一个脏祖先阻断该租户的
   导入导出。

本包同时给出单租户模式下的全业务系统冒烟结论，并登记仅由运行环境导致、与本次修复无关的
失败类别。

无数据库 schema、迁移、路由、权限码、菜单 seed 或错误信封变化。

## Primary Layer

platform

改动集中在 `system/config/dict`、`system/org/{dept,post}`、`system/iam/{user,role,permission}`
的服务层与 `backend/pkg/impexp` 的共享路径映射。前端无改动。

## Dependency Layers

- `system/config/dict`：`WithTenantContext` 绑定 compat；`ReorderDictItem` 全链路作用域化。
- `system/org/dept`：绑定 compat；导入/导出/治理的路径映射与父节点查找作用域化；导入写入
  请求租户。
- `system/org/post`：导出/导入路径映射作用域化；导入写入请求租户。
- `system/iam/{user,role,permission}`：绑定 compat；导入导出的部门路径映射作用域化。
- `backend/pkg/impexp`：孤儿父节点按路径边界处理，避免单条脏数据阻断整棵路径映射。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `permission-policy`
- Portable Failure Class: `scope-bypass` / `cross-tenant-read-write` / `dirty-reference-data`
- Owner Layer: `consumer-repository`
- Ratchet Decision: `sensor-added`
- Coverage Dimensions:
  - behaviour
  - runtime-quality
  - architecture-fitness

## Contract Anchors

- `docs/contracts/TENANT_CONTRACT_V1.md` §2.3 / §3.3 / §5：compat 必须固定到平台命名空间
  （`tenant_id = 0`），多租户必须按解析出的租户过滤；跨租户读写不得通过 404/空列表泄漏存在性。
- `docs/contracts/PLATFORM_CONTRACT.md`：平台命名空间与租户命名空间的边界；平台视图不得
  读取租户行，租户视图不得读取平台行。
- `docs/harness/VERIFICATION_EVIDENCE_SPEC.md`：证据必须对应实际执行的命令与结果。

## Scope

### In

- 六个服务的 `WithTenantContext` 在 compat 下绑定 `tenant_id = 0` 视图。
- 字典项排序的读取、邻居查询、交换更新全部走租户作用域。
- 部门/岗位导入导出的路径映射、父节点查找、祖先查找作用域化，并给新建行写入请求租户。
- 用户/部门/岗位导出中的部门路径映射作用域化。
- `impexp` 路径映射对孤儿父节点按路径边界处理。
- 新增真库回归：字典 compat 钉住与排序隔离、部门 compat 钉住与导入不串树、岗位导入租户
  归属、路径映射孤儿容忍。
- 单租户模式全业务系统冒烟与结论记录。

### Out

- 数据库 schema 与迁移（保持 29）。
- 路由、权限码、菜单 seed、错误信封。
- 前端代码与视觉规范。
- 多租户模式既有验收范围（本轮只确认单租户不回归）。
- 修改 SonarCloud 规则、放宽门禁或跳过测试。

## Expected Files

### Create

- `backend/modules/system/org/dept/dept_compat_scope_test.go`
- `docs/harness/tasks/2026-10-24-single-tenant-scope-closeout.task.md`
- `.harness/tasks/2026-10-24-single-tenant-scope-closeout/manifest.json`
- `.harness/evidence/2026-10-24-single-tenant-scope-closeout/{summary.md,review.md,commands.json,pr-body.md}`

### Modify

- `backend/modules/system/config/dict/dict_service.go`
- `backend/modules/system/config/dict/dict_handler.go`
- `backend/modules/system/config/dict/dict_tenant_canary_test.go`
- `backend/modules/system/org/dept/{dept_service.go,dept_handler.go,dept_import.go,dept_export.go,dept_governance.go,dept_service_test.go}`
- `backend/modules/system/org/post/{post_service.go,post_handler.go,post_import_regression_test.go}`
- `backend/modules/system/iam/user/{user_service.go,user_handler.go,user_export.go}`
- `backend/modules/system/iam/role/{role_service.go,role_handler.go}`
- `backend/modules/system/iam/permission/{permission_service.go,permission_data_scope_tenant_test.go}`
- `backend/pkg/impexp/{import_helpers.go,import_helpers_test.go}`

### Do Not Touch

- `backend/pkg/database/migrations/**`
- `.github/workflows/**`
- 已发布的 tag 与 release 资产
- `.env.test` 与任何凭据文件

## Implementation Notes

- compat 上下文不是 `nil`：`tenant.Resolve` 在 compat 下返回 `{TenantID: 0, Mode: ModeCompat}`。
  服务层只应在 `ctx == nil`（平台内部调用）时返回共享视图；compat 必须绑定，才能把平台视图
  固定到 `tenant_id = 0`。
- 只改服务层绑定还不足以修复导入导出：导入的父节点查找和路径映射必须在同一个作用域内完成，
  否则会用“未过滤的父节点 + 受过滤的子节点”拼出跨租户路径。
- 新建导入行必须显式写 `tenant_id`，不能依赖数据库默认值，否则平台行会以 `tenant_id = 0`
  落库、租户导入后对租户不可见。
- 路径映射遇到不在已加载集合内的父节点时返回空路径，表示“该父节点是路径边界”，而不是报错；
  该行仍属于调用方租户，必须保持可导入/可导出。
- 字典项排序的邻居查询与交换更新必须与初始读取使用同一作用域，否则会选中并改写其他租户的
  相邻行。
- 本机开发库存在历史孤儿行（tenant 0 部门的 `parent_id` 指向其他租户的根部门）。代码侧已
  容忍；数据侧只对开发库做了一次有界修复（把孤儿行挂回本租户根部门），不属于生产迁移，
  不改 schema，不删除数据。

## Verification Plan

- `cd backend && gofmt -l modules/system/config/dict modules/system/iam modules/system/org pkg/impexp`
- `cd backend && go build ./... && go vet ./...`
- `cd backend && set -a; . ../.env.test; set +a; go test ./pkg/impexp/... ./modules/system/config/dict/... ./modules/system/org/dept/... ./modules/system/org/post/... ./modules/system/iam/user/... ./modules/system/iam/permission/... ./modules/system/iam/role/...`
- `cd frontend && node node_modules/playwright/cli.js test tests/smoke/system/api --config=playwright.api.config.ts --workers=1`
- 单租户浏览器套件：
  - `node scripts/run-smoke-suite.mjs --host 127.0.0.1 --port 5173 --cleanup-fixtures all --config playwright.config.ts -- tests/smoke/system/system-config.spec.ts tests/smoke/system/system-org.spec.ts --workers=1`
  - 其余 system 套件（iam / role-authorization / audit / i18n / platform / routes / form-state-matrix）
  - 生成模块：`module-governance-real`、`module-auto-recycle-real`、`module-governance-host-real`；
    `module-master-detail-real` 与 `module-many-to-many-real` 按 package.json 的 `--setup` 方式运行。
- 治理检查：`check-task-packet`、`check-structure-contract --strict`、`check-generated --strict`、
  `check-failure-registry --strict`、`check-evidence --strict`、`check-review --strict`。
- 凭据检查：证据与 PR 材料中不得出现数据库、Redis、JWT 凭据。

## Linkage

- Task ID: `2026-10-24-single-tenant-scope-closeout`
- Task Manifest: `.harness/tasks/2026-10-24-single-tenant-scope-closeout/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/contracts/TENANT_CONTRACT_V1.md`、
  `.harness/evidence/2026-10-23-iam-race-closeout/review.md`
- Evidence Directory: `.harness/evidence/2026-10-24-single-tenant-scope-closeout/`
- Review File: `.harness/evidence/2026-10-24-single-tenant-scope-closeout/review.md`

## Evidence Required

- 目标 Go 包在真实 MySQL 上的通过输出。
- `gofmt`、`go build`、`go vet` 结果。
- API smoke 11/11 与单租户浏览器套件的逐套件统计。
- 新增回归用例在修复前后行为的说明（先红后绿或可复现路径）。
- 生成模块套件在设置 `PANTHEON_NODE_BIN` / `PANTHEON_WORKSPACE_ROOT` 后的通过输出。
- 明确登记：多租户专属用例在 compat 模式下不适用；`business-generated-basic` 因生成模块
  数量为 0 而跳过。
- 治理检查结果。
- 敏感信息扫描结果（0 命中，脱敏）。

## Human Gates

- 维护者最终人工确认（单租户字典/部门删除与全业务页面）。
- 如后续要合并，按 `repo-pr-gate` 走高风险改动复核（命中 `system/config`、`system/iam`、
  共享 `pkg/*`）。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
