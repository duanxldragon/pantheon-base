# 双模式 E2E / 冒烟验收证据（单租户 compat + 多租户 multi）

- 日期：2026-10-25
- 仓库：`pantheon-base`
- 分支：`fix/single-tenant-scope-closeout-2026-10-24` @ `c77eab52`（工作区含 18 个未提交的既有修复）
- 运行平台：Windows 10 / Git Bash / Chromium（Playwright）
- 结论：**两种模式全部套件通过，0 个产品缺陷、0 个失败。** 发现 4 项测试编排/环境类问题（P3，不影响产品结论），以及 5 项显式未覆盖/证据限制（见第 6 节）。

## 1. 环境

| 模式 | 后端 | 数据库 | 前端 |
|------|------|--------|------|
| multi（多租户） | `127.0.0.1:8080` | `pantheon_base` | 每套件独立 Vite：5173 / 5174 / 5178 |
| compat（单租户） | `127.0.0.1:8081` | `pantheon_base_compat_e2e_20261024` | 同上，API 基址显式指向 8081 |

- 后端二进制：`backend/.tmp/pantheon-server.exe`（2026-10-25 00:49 从当前工作区构建，未入库）。
- 两个实例都以 `PANTHEON_NODE_BIN`（绝对路径）与 `PANTHEON_WORKSPACE_ROOT` 启动，以满足代码生成器的 server export。
- `/api/v1/health` 两个实例均返回 200（database / migrations / redis 全部 ok）。

## 2. 执行结果

每个数字取自对应日志末尾的 Playwright 汇总；日志见 `logs/`。

| 套件 | multi | compat | 日志 |
|------|-------|--------|------|
| smoke-core（登录/外壳/用户/角色/部门/导入导出） | 26 passed, 3 skipped | 23 passed, 3 skipped | `multi-core.log` / `compat-core.log` |
| 租户隔离矩阵（auth-log/audit/settings/dynamic-module/upload/dict/受保护资源） | 10 passed | 不适用（compat 无租户选择） | `multi-tenant-matrix.log` |
| 租户视角切换（含新建租户用户真实登录） | 5 passed | 不适用 | `multi-tenant-viewpoint.log` |
| system 全目录（routes/iam/config/i18n/audit/org/platform/forms/role-authz/governance/api） | 119 passed | 119 passed | `multi-system-workers1.log` / `compat-full-system.log` |
| platform contracts（shell 视觉契约、分页契约） | 21 passed | 21 passed | `multi-platform-contracts.log` / `compat-platform-contracts.log` |
| platform surfaces（8 个外壳/二级路由表面） | 97 passed | 97 passed | `multi-platform-surfaces.log` / `compat-platform-surfaces.log` |
| platform full（全页面 + 全页审计） | 77 passed | 77 passed | `multi-platform-full-2.log` / `compat-platform-full.log` |
| API（导入导出、批量删除） | 11 passed | 11 passed | `multi-api.log` / `compat-api.log` |
| business 生成器（生成→注册→清理、库导入宿主、主子表、多对多、自动回收） | 5 passed（5 个套件各 1） | 5 passed | `multi-business-*.log` / `compat-business-*.log` |

合计：

- multi：**371 次执行通过 / 0 失败 / 3 跳过**（API 11 条同时包含在 system 119 中，去重后约 360 条唯一用例）。
- compat：**353 次执行通过 / 0 失败 / 3 跳过**（去重后约 342 条）。
- 两种模式合计约 702 条唯一用例执行，0 失败、6 次跳过（每种模式 3 次，为同一组用例）。

### 跳过的 3 条（两种模式相同）

`tests/smoke-core/business-generated-basic.spec.ts:70 / :93 / :118` —— smoke-core 没有常驻生成模块夹具，故按设计跳过。生成模块的真实链路由 `test:smoke:business:generated` 覆盖（真实调用 `/lowcode/dynamic-modules/generate` → 注册 → 列表可见 → purge 源码），两种模式各 1/1 通过。

## 3. 覆盖范围（从登录开始）

1. **认证与登录**：登录/登出、错误密码、过期 token 跳转、刷新后会话保持；多租户密码校验后才展示租户候选、错误密码不泄露租户、窄视口无横向溢出；租户管理员真实登录。
2. **平台外壳**：侧边栏/面包屑/顶栏面板、分页契约、8 个 shell/二级路由视觉与交互契约、失败与无权限路由。
3. **系统域**：用户 CRUD/详情/角色绑定/批量操作/导入导出、角色授权、菜单与权限、部门与岗位、字典/设置/i18n/操作日志/登录日志/会话、表单状态矩阵、治理工作台与模块治理、清理范围 UI。
4. **全页面**：桌面/平板/手机三视口逐页用例（`full-system-pages`），以及 19 页全页审计。
5. **业务生成器**：真实生成并注册临时业务模块、源码注册表/i18n 回退资源刷新、数据库导入宿主、主子表、多对多、自动回收。
6. **多租户隔离**：登录日志/操作日志按租户固定、设置缓存刷新不越界、动态模块注册表按租户读取且未验证写被拒绝、上传命名空间隔离与路径穿越拒绝、租户字典互不可见、受保护页面/导出/ID 篡改隔离、刷新令牌重放拒绝、视角切换与成员关系落库。
7. **兼容模式**：compat 下租户作用域固定、系统域所有列表/写操作、平台套件、业务套件均与 multi 同构通过。

## 4. 产品缺陷

**无。** 本轮没有发现 P0/P1/P2 产品缺陷；未删除功能、未绕过校验、未降低安全要求、未跳过失败用例。

## 5. 测试编排 / 环境问题（P3，均非产品缺陷）

### H-1 双模式运行需显式指定 `PANTHEON_API_BASE_URL`

- 严重度：P3（测试编排）
- 文件:行号：`frontend/tests/smoke/helpers/auth.ts:6`（默认 8080）、`frontend/scripts/tenant-matrix-fixture-setup.mjs:28`（默认 8081）、`frontend/scripts/cleanup-smoke-fixtures.mjs:7`（默认 8080）；`scripts/run-smoke-suite.mjs` 只注入 `PANTHEON_WEB_BASE_URL`
- 复现：compat 后端在 8081，不设置该变量运行 system 用户/岗位用例 → fixture 写入 8080 的 multi 库，UI 读 8081 的 compat 库，出现 5 条 `toBeVisible` 元素不存在；同样地租户夹具默认会打到 8081。
- 根因：夹具、清理脚本、Playwright helper 的默认 API 基址不一致（8080 vs 8081），runner 不统一注入。CI 已显式设置 8080（`.github/workflows/smoke-core.yml:61` 等），故只影响本地双实例编排。
- 影响：证据可能是假红/假绿，且夹具可能落在错误数据库。
- 修复：本地按模式显式 `PANTHEON_API_BASE_URL`；建议 runner 根据目标后端统一注入，夹具默认值与之对齐。
- 验证：compat 显式指向 8081 后 31/31 子集通过并完成全量套件；multi 显式指向 8080 后租户矩阵 10/10 通过。

### H-2 Windows 下代码生成器需要显式 node 与 workspace root

- 严重度：P3（运行环境）
- 文件:行号：`backend/internal/scaffold/workspace.go:285-292`（`resolveNodeBinary` 回退 `exec.LookPath("node")`）
- 复现：后端未设置 `PANTHEON_NODE_BIN` / `PANTHEON_WORKSPACE_ROOT` 启动 → `POST /api/v1/lowcode/generator/preview-files` 返回 500 `module.generate.server_export_failed`。
- 根因：Windows + Git Bash 下后端进程环境看不到 `node`；`PANTHEON_NODE_BIN` 要求绝对路径。
- 影响：本机生成器预览与 `business-generated` 套件无法运行；生产 Linux（node 在 PATH）不受影响。
- 修复：以绝对路径 `PANTHEON_NODE_BIN` 和仓库根 `PANTHEON_WORKSPACE_ROOT` 启动后端。
- 验证：preview 返回 200；两种模式下生成器业务套件均 1/1 通过。

### H-3 数据库导入夹具需把 `.env.test` 导入进程环境

- 严重度：P3（本机前置）
- 文件:行号：`frontend/scripts/database-import-qa-setup.mjs:76,100-102`（读取进程环境或仓库 `.env`，不读取 `.env.test`）
- 复现：未导出 `PANTHEON_DSN` 直接运行该 setup → `ERROR 1045 (28000) ... (using password: NO)`。
- 根因：测试库 DSN 只存在于 `.env.test`，脚本不会自动加载。
- 影响：`test:smoke:business:database-import` 在本机前置失败；与产品无关。
- 修复：`set -a && . ./.env.test && set +a`（compat 运行时将 DSN 的库名替换为 compat 库）。
- 验证：两种模式各 1/1 通过。

### H-4 租户夹具 teardown 的二次验证密码不匹配

- 严重度：P3（夹具清理）
- 文件:行号：`frontend/scripts/tenant-matrix-fixture-setup.mjs:118`（`getOperationToken` 固定使用平台管理员密码）
- 复现：租户矩阵跑完后执行 `tenant-matrix-fixture-setup.mjs down` → `dict cleanup skipped (operation verify: 401 auth.password.verify_failed)`；租户被移除，但 `matrix_browser_a/b` 字典残留。
- 根因：teardown 用租户管理员会话调用 operation-verify，却仍发送平台管理员密码。
- 影响：每次矩阵运行遗留 2 个租户域字典；不影响用例结果，但会积累噪声数据。
- 修复：租户会话的 operation-verify 使用 `tenant.adminPassword`，或改由平台侧按租户作用域清理字典。
- 验证：租户本身删除成功；字典残留已在第 6 节显式记录。

## 6. 未覆盖项与证据限制

1. **3 条 `business-generated-basic` 跳过**：无常驻生成模块夹具（两种模式一致）；真实生成链路由 business generated 套件覆盖并通过。
2. **compat 无租户选择器/租户矩阵**：单租户模式不存在租户候选与视角切换；对应能力仅在 multi 验证。compat 的租户作用域行为由 system/org、system/iam 与平台套件覆盖。
3. **全页审计的截图与 notes 不代表页面真实渲染**：`tests/smoke/platform/full-page-audit.spec.ts:264,279` 在 `domcontentloaded` 后立即截图，18 张业务页面截图中有 17 张为加载态（约 6.6KB 空白 + spinner），因此 18 条“标题不可见”、6 条“新增按钮不存在”是时序假阴性。功能正确性由 `full-system-pages.spec.ts`（77 条中含三视口逐页断言）与 system 119 条覆盖。审计的硬指标为 0 broken state、0 console error、0 横向溢出、0 弹窗溢出。
4. **早前手工租户（如 tenant 308）密码未留存**：本次多租户登录覆盖改用矩阵自建租户管理员完成，真实登录用例通过，不依赖该残留租户。
5. **H-4 遗留字典**：矩阵租户已移除，但 `matrix_browser_a/b` 两个租户域字典仍在 multi 库；后续可用治理清理或在修复 H-4 后重跑 teardown 清除。

## 7. 复现命令（凭据不落盘）

后端（multi；compat 追加 `PANTHEON_PORT=8081` 并把 DSN 库名替换为 compat 库）：

```bash
cd pantheon-base
set -a && . ./.env.test && set +a
export PANTHEON_NODE_BIN='D:/nodejs/node.exe'
export PANTHEON_WORKSPACE_ROOT="$(pwd -W)"
export PANTHEON_PORT=8080
./backend/.tmp/pantheon-server.exe
```

前端套件（以 multi 为例；compat 改 `PANTHEON_API_BASE_URL` 与端口）：

```bash
cd pantheon-base/frontend
export PANTHEON_API_BASE_URL=http://127.0.0.1:8080/api/v1

node scripts/run-smoke-suite.mjs --host 127.0.0.1 --port 5173 --cleanup-fixtures all --config playwright.config.ts -- \
  tests/smoke-core/auth-login-logout.spec.ts tests/smoke-core/auth-tenant-picker.spec.ts \
  tests/smoke-core/business-generated-basic.spec.ts tests/smoke-core/platform-shell-critical.spec.ts \
  tests/smoke-core/system-dept-operations.spec.ts tests/smoke-core/system-import-export.spec.ts \
  tests/smoke-core/system-menu-permission.spec.ts tests/smoke-core/system-role-authz.spec.ts \
  tests/smoke-core/system-user-crud.spec.ts --workers=1

node scripts/run-smoke-suite.mjs --host 127.0.0.1 --port 5173 --setup scripts/tenant-matrix-fixture-setup.mjs \
  --config playwright.config.ts -- \
  tests/smoke-core/tenant-hostile-browser-matrix.spec.ts \
  tests/smoke-core/tenant-hostile-browser-matrix-phase2.spec.ts \
  tests/smoke-core/tenant-protected-resources.spec.ts --workers=1

node scripts/run-smoke-suite.mjs --host 127.0.0.1 --port 5173 --config playwright.config.ts -- \
  tests/smoke-core/tenant-viewpoint-switcher.spec.ts --workers=1

# system / platform / api / business 使用 package.json 中同名脚本的等价命令，
# 数据库导入需先 set -a && . ../.env.test && set +a
```

兼容模式还需：`PANTHEON_API_BASE_URL=http://127.0.0.1:8081/api/v1`，并从 smoke-core 命令中移除 `auth-tenant-picker.spec.ts`（该套件仅多租户适用）。

## 8. 证据文件

- `logs/`：25 份日志（24 份套件结果 + 1 次 platform full 重跑），含 Playwright 汇总与夹具清理输出。
- `audit/findings.json`：19 个页面的审计布尔指标与 notes。
- `audit/*.png`：全页审计截图（注意第 6 节第 3 条：多数为加载态）。

## 9. 修复后新库复跑（2026-10-25）

第 5 节的 H-1/H-3/H-4/H-5 已在代码层修复，并在两套全新隔离库上重新执行完整矩阵；H-2 保持为环境前置（Windows 下显式 `PANTHEON_NODE_BIN` / `PANTHEON_WORKSPACE_ROOT`），未改产品代码。

### 9.1 环境与库隔离

| 模式 | 后端 | 数据库（复跑用，已删除） | 迁移版本 |
|------|------|--------------------------|----------|
| multi | `127.0.0.1:8080` | `pantheon_base_multi_e2e_20261025` | 29 |
| compat | `127.0.0.1:8081` | `pantheon_base_compat_e2e_20261025` | 29 |

- 两库均为空库启动，由后端迁移 + 种子建立；`platform.tenant_mode` 分别确认为 `multi`（`GET /api/v1/system/setting/public` 返回）与 `compat`。
- 两后端登录均返回 `code=200`；测试结束后已停止后端并 `DROP DATABASE`，`SHOW DATABASES LIKE 'pantheon_base%_e2e_20261025'` 为空。

### 9.2 结果（日志：`fresh-db-20261025/logs/`）

| 套件 | multi | compat |
|------|-------|--------|
| smoke-core | 26 passed, 3 skipped | 23 passed, 3 skipped |
| 租户矩阵 / 视角切换 | 10 + 5 passed | 不适用 |
| system 全目录 | 108 passed | 108 passed |
| platform contracts / surfaces / full | 21 / 97 / 77 passed | 21 / 97 / 77 passed |
| API（导入导出、批量删除） | 11 passed | 11 passed |
| business 5 个套件 | 5 passed | 5 passed |

- multi：**360 passed / 0 failed / 3 skipped**；compat：**342 passed / 0 failed / 3 skipped**。API 的 11 条同时包含在 system 执行链中，去重后与上表一致。
- `summary.txt` 中 24 个步骤（含 3 次审计复跑）全部 `exit=0`，`OVERALL_FAIL=0`。
- 两模式最终审计各 `20 passed`（外壳回归 + 登录页 + 18 个业务页），0 失败。

### 9.3 四项修复的现场验证

- **H-1（API 基址注入）**：`run-smoke-suite.mjs` 新增 `--api-base-url`，并注入 cleanup、setup 服务器、Playwright 三个子进程；日志首行分别出现 `API base http://127.0.0.1:8080/api/v1` / `http://127.0.0.1:8081/api/v1`。compat 的夹具清理全部落在 8081，无跨库写入。新增回归单测验证命令行参数优先于环境变量、且 cleanup 与 Playwright 子进程都收到注入值。
- **H-3（`.env.test` 回退）**：在未导出 `PANTHEON_DSN`/密码的环境下执行 `node scripts/database-import-qa-setup.mjs up`（仅指定目标库）`exit=0`，`biz_cmdb_host` 建表成功；单元测试 8/8 通过。
- **H-4（teardown 二次验证密码）**：矩阵跑完后执行 `tenant-matrix-fixture-setup.mjs down`，无 `401 auth.password.verify_failed`、无 `dict cleanup skipped`；复查 multi 库 `matrix_browser%` 字典 = 0、`smoke-matrix%` 租户 = 0。
- **H-5（审计渲染等待）**：截图前等待 `.app-shell` + `networkidle`；19 页截图体积由约 6.6KB 的加载态恢复到 52–212KB，标题缺失、按钮缺失、broken state、横向溢出、控制台错误、弹窗溢出均为 0，7 个新增弹窗成功打开。审计配置同时修正了权限页需先切到“接口策略”Tab、弹窗标题为“新增策略”，以及按实际视口计算垂直边距（role/menu 弹窗 868/900px，仅提示留白不足 40px，非溢出）。

### 9.4 证据文件

- `fresh-db-20261025/logs/`：20 份日志 + `summary.txt`。
- `fresh-db-20261025/audit-multi/`、`fresh-db-20261025/audit-compat/`：各 27 个文件（19 张页面图 + 7 张弹窗图 + `findings.json`）。
- 本轮未发现新的产品缺陷；改动仅限测试编排与审计脚本（`run-smoke-suite.mjs`、`database-import-qa-setup.mjs`(+test)、`tenant-matrix-fixture-setup.mjs`、`full-page-audit.spec.ts`、`run-smoke-suite.test.mjs` 与其测试夹具）。前端脚本单测 30/30 通过，`tsc -b` 与 ESLint 全绿。
