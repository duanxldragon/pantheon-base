# Summary — 2026-10-24 单租户（compat）租户作用域失效收口与全业务冒烟

## Why this task exists

维护者在单租户模式人工验收时发现：字典管理里字典删不掉，部门管理里部门也删不掉，怀疑是表没有
主键。核查后确认三张表都有主键（`system_dict_type.id`、`system_dict_item.id`、`system_dept.id`），
主键假设不成立。真实根因是 compat 上下文被服务层丢弃：`tenant.Resolve` 在 compat 下返回非 nil 的
`{TenantID: 0, Mode: ModeCompat}`，而六个服务的 `WithTenantContext` 写成
`ctx == nil || !ctx.IsMulti()` 时直接返回共享服务，于是平台视图没有钉到 `tenant_id = 0`。本机开发库
仍有历史租户（282/303）数据，单租户界面上混入了这些行，删除因此表现异常。

## Findings and fixes

### F1 (P1) — compat 上下文被六个服务丢弃

涉及 `DictService`、`DeptService`、`PostService`、`UserService`、`RoleService`、
`PermissionService`。修法统一：只有 `ctx == nil`（平台内部调用）返回共享视图，compat 必须
绑定视图并固定 `tenant_id = 0`。

- `backend/modules/system/config/dict/dict_service.go:58`
- `backend/modules/system/org/dept/dept_service.go:31`
- 其余四个服务同形态修改，handler 注释同步到“compat 绑定平台全局”。

真库回归：
`TestTenantCanary_CompatPinsGlobalScope`（租户行对 compat 不可见，compat 可创建/删除同名 dict）、
`TestDeptCompatScopePinsGlobalPopulation`（租户 282 根部门不可见；删除外部部门返回 not found；
compat 可创建并删除自己的部门）。

### F2 (P1) — 字典项排序存在跨租户 IDOR

`ReorderDictItem` 的初始读取、邻居查询和两次交换更新都没有租户作用域，按 ID 可以读写其他租户的
排序。现在四处全部套 `tenantScope()`（`dict_service.go:973-1035`）。

真库回归：`TestTenantCanary_ReorderContained`（租户 B 不能重排 A 的项，compat 不能重排租户项，
自己的项可正常重排）。

### F3 (P1) — 部门/岗位导入导出未走租户作用域

`dept_import.go` 的路径映射、父节点查找、祖先查找；`post_service.go` 的导出/导入路径映射；
`dept_export.go`、`dept_governance.go`、`user_export.go` 的导出路径映射都使用未过滤查询。compat
作用域化后，导入会因路径映射为空报 `dept.not_found`/`dept.import.error`；未作用域化时则会用
“未过滤父节点 + 过滤子节点”拼出跨租户路径。

修复后：路径映射与父/祖先查找全部走 `s.scoped(...)`；新建部门/岗位显式写
`TenantID: s.tenantOwnerID()`。

真库回归：

- `TestDeptImportCompatStaysInGlobalTree`：存在同名租户外根部门时，compat 导入仍挂在 tenant 0 根
  部门下，且不在租户外根部门下建子节点。
- `TestPostService_ImportPostsStampsRequestTenant`：租户 77 的 service 导入后岗位
  `TenantID = 77`，`DeptID` 指向 77 自己的部门。

### F4 (P2) — 单个孤儿祖先阻断整棵路径映射

作用域化后，本机开发库的历史行（`system_dept` id=235、`tenant_id=0`、`parent_id` 指向 tenant 303
的根部门）不在已加载集合内，`BuildDeptPathMaps` 直接报错，表现为 dept 导入 500。

修复：`backend/pkg/impexp/import_helpers.go:134` 把不在集合内的父节点视为“路径边界”，返回空路径，
该行仍可导入/导出；健康路径不受影响。新增 `TestBuildDeptPathMaps_OrphanParentIsPathBoundary`。

开发库孤儿行另做了一次有界修复（把 `parent_id` 挂回本租户根部门）；不属于生产迁移，不改 schema，
不删除数据。

### F5 (P3) — 生成模块套件的运行环境

`module.generate.server_export_failed` 不是产品缺陷：本机 Git Bash 的 PATH 形式是
`/d/nodejs`，Go 的 `exec.LookPath("node")` 在 Windows 上解析不到。给服务端设置
`PANTHEON_NODE_BIN=D:\nodejs\node.exe` 与 `PANTHEON_WORKSPACE_ROOT=<repo>` 后，3 个生成模块套件
通过；master-detail 与 many-to-many 需要用 package.json 里的 `--setup` 命令先注册 fixture 模块，
按该方式运行各 1/1 通过。

## 单租户全业务冒烟结果

运行环境：`platform.tenant_mode = compat`，后端 `go run ./cmd/server`（真实 MySQL/Redis），
前端由 `run-smoke-suite.mjs` 启动 Vite，Playwright Chromium。

| 套件 | 结果 |
|---|---|
| API smoke（`tests/smoke/system/api`） | 11/11 通过 |
| system-config + system-org（字典/设置/部门/岗位） | 26/26 通过 |
| system-iam / role-authorization / system-audit / system-i18n / system-platform / system-routes / system-form-state-matrix | 63/63 通过 |
| 生成模块：governance-real / auto-recycle-real / governance-host-real | 3/3 通过（需要 `PANTHEON_NODE_BIN`） |
| 生成模块：master-detail-real | 1/1 通过（`npm run test:smoke:business:master-detail`） |
| 生成模块：many-to-many-real | 1/1 通过（`npm run test:smoke:business:many-to-many`） |
| 首次全量浏览器运行（同一构建前的环境） | 339 通过 / 12 失败 / 3 跳过 / 8 未运行 |

首次全量运行的 12 个失败已全部归类为环境或不适用：

1. 5 个生成模块用例：`module.generate.server_export_failed`（node 解析问题，见 F5）。设置
   `PANTHEON_NODE_BIN` 后 3 个直接通过；另 2 个需要 `--setup` 注册 fixture 模块，按文档命令运行
   后通过。
2. 7 个多租户专属用例（`tenant-hostile-browser-matrix-phase2` ×4、
   `tenant-hostile-browser-matrix`、`tenant-protected-resources`、`tenant-viewpoint-switcher`）：
   在 compat 模式登录租户管理员返回 401、或期望“租户视角”切换器，单租户模式不适用。
3. 3 跳过 / 8 未运行：`business-generated-basic` 在生成模块数量为 0 时跳过，连带其后的租户套件
   未运行；属于套件编排前置条件，不是本次修复范围。

注意：`run-smoke-suite.mjs` 即使 Playwright 有失败也返回 0，判定必须解析套件输出，不能只看退出码。

## Verification

- `gofmt -l ...` 无输出；`go build ./...`、`go vet ./...` 通过。
- 目标 Go 包真库测试全部通过：
  `pkg/impexp`、`system/config/dict`、`system/org/dept`、`system/org/post`、
  `system/iam/user`、`system/iam/permission`、`system/iam/role`（0 FAIL，0 SKIP）。
- API smoke 11/11；浏览器套件见上表。

## Residual risks / environment notes

- 多租户模式未在本轮重新验收；本次修复把 compat 纳入作用域，多租户路径的既有测试仍全部通过。
- 生成模块依赖宿主机的 node；Windows + Git Bash 启动服务时必须显式设置 `PANTHEON_NODE_BIN` 与
  `PANTHEON_WORKSPACE_ROOT`，否则生成接口返回 500（服务端错误信息被统一收敛，不会泄漏内部路径）。
- 开发库孤儿行已修复，但同类脏数据在升级环境中可能仍存在；代码侧已容忍，不会阻断导入导出。
- 未修改 schema、路由、权限码、菜单 seed、错误信封或前端代码。

## Secrets

证据与 PR 材料未包含数据库、Redis、JWT 凭据；命令中的凭据通过既有本地 helper 注入且未回显。
