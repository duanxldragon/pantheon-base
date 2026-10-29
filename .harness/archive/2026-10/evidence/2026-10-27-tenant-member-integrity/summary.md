# Summary — W2 `2026-10-27-tenant-member-integrity`（租户成员完整性）

分支 `fix/tenant-member-integrity-2026-10-27`，基线 `c26c75e1`（Phase 0 之后）。
实测改动：**12 个源码/文档文件，+489 / −12**，全部落在 packet 的 `expectedFiles.modify` 内；
连同本证据目录共 19 个文件、+1012 / −12。

## 这一轮修了什么

`tenant_memberships.user_id` 没有指向 `system_user` 的外键，写成员时也不校验，于是：

1. **F-M1**：`AddMember` 接受任意不存在的 user id。控制台手输一个编号就能落一条幽灵成员，
   列表里显示一个谁都点不开的账号。
2. **F-M2**：`ensureNotLastOwner` 只数 `tenant_memberships`，不 join `system_user`。
   一条幽灵 owner 就能让**最后一个真实 owner**被移除，租户从此无人可管。
3. **F-M3**：owner 计数也不看 `status`，被停用的账号仍然算作「可以救场的 owner」。
4. **F-M4**：前端成员对话框是一个裸 `Input`，要求人工输入数据库主键。

对应四条修复：存在性校验（仅 `deleted_at IS NULL`）、owner 计数 join 用户表且要求 enabled、
handler 把 `common.ErrNotFound` 映射成 `404 / user.not_found` 信封、前端换成有界用户选择器。

完整复现与红/绿差分见 [repro.md](repro.md)；红态日志 [red-without-fix.log](red-without-fix.log)，
绿态 [green-with-fix.log](green-with-fix.log)、[mounted-route-guard-test.log](mounted-route-guard-test.log)，
差分记录 [differential.txt](differential.txt)。

## 边界：本轮刻意**没有**决定的事

packet 把跨租户成员策略划给 W3/W4，`scope.out` 也写明不许在本轮实现。因此新增的校验：

- **不按 `tenant_id` 过滤**。`system_user.tenant_id` 是「归属租户」，而
  `BootstrapService.MigrateExistingUsersToDefaultTenant`（`tenant_bootstrap.go:99`）要往默认租户里
  迁移归属别的租户的用户；已上线的 `tenant-hostile-browser-matrix.spec.ts` 也依赖多租户成员共存。
  若在这里加租户过滤，等于替 W3/W4 提前拍板并直接打断这两处。
- **不看 `status`**，只排除软删除。停用账号仍可被加为成员（保持既有行为），
  但**不计入** owner 保护——它无法登录救场。

这条边界由 `TestAddMember_DoesNotDecideCrossTenantMembership` 钉住：它断言跨租户添加**当前成功**，
是 W4 落地时必须显式更新的锚点。

## 前端：一个有界的选取器，不是一个搜索服务

`MEMBER_CANDIDATE_PAGE_SIZE = 50`，一次取首页、本地过滤已在册成员，不做分页控件、不新建搜索接口
（packet 明确要求「拿不准就取第一页并在注释里说明」）。候选池来自当前请求的 `X-Tenant-Id` 作用域，
当**视角租户 ≠ 目标租户**时，选择器旁显示一条范围提示而不是静默给出错池子的名单；
无 `system:user:list` 权限时下拉框禁用并给出对应空态文案。

新增 i18n key 4 个，纯增量，5 个语言包各 +5 行（`fr-FR` +6 是 prettier 换行）：
`system.tenant.member.userSelectEmpty` / `.userSelectNoPermission` / `.userSelectSearch` / `.userSelectScope`。
原 `system.tenant.memberUserIdPlaceholder`（"请输入用户 ID"）**未删除**：选择器换成搜索框后它不再被引用，
删除 key 超出本波次授权，已作为 P3 交给 W7 措辞波次处置。

`member-dialog-open.png` / `member-dialog-selected.png` 是在本地 dev 栈（vite 5173 提供当前工作树源码）
上真实打开「租户成员」对话框截取的：字段已是可搜索 Select，选项渲染成 `admin · Administrator`，
视角与目标租户不一致时橙色范围提示可见；脚本没有点「新增」，dev 库未被写入。截图脚本本身落在仓库外的 gitignored 目录：packet 的
`expectedFiles.create` 为空，浏览器用例归 W6，本轮不新增 spec 文件。

## 与 packet 的偏差（全部为事实修正，非扩大范围）

| packet 写法 | 实际 | 原因 |
|---|---|---|
| 返回 `user.batch.not_found` | 复用 `user.not_found` | 前者是批量接口专用 key；`user.not_found` 已在 5 个语言包注册且语义单值 |
| `frontend/src/locales/**/system.json` | `frontend/src/i18n/resources/{zh-CN,en-US,fr-FR,ja-JP,ko-KR}.ts` | 仓库不存在 `src/locales/`，本仓库 i18n 是 TS 资源文件 |
| 更新 `tenant_ops_view_test.go` | 未改动 | 该文件已有 `mustInsertUser`，插入的是真实用户，本轮校验对它无影响 |
| 更新 `tenant_handler_test.go` | +3 行 fixture | 该文件将在 W8 删除；此处只补 fixture 避免中间波次遗留红灯 |

## 实测结果

| # | 命令 | 读数 |
|---|---|---|
| 1 | `cd backend && go build ./...` | exit 0 |
| 2 | `cd backend && go vet ./modules/system/iam/tenant/...` | exit 0 |
| 3 | `cd backend && go test -count=1 -v ./modules/system/iam/tenant/...`（带 DSN 必需态，串行独占） | **100 顶层 PASS + 27 子测试 / 0 SKIP / 0 FAIL**，63.9s（`tenant-package-serial.log`）；基线是 92 顶层 + 27 子测试，多出的 8 个正是本轮新增用例 |
| 4 | 红/绿差分（仅回退 service + handler） | 红 4 FAIL / 绿 10 PASS，其余 3 用例两侧均 PASS |
| 5 | 挂载路由 `POST /system/tenant/:id/members` 未知用户 | `TestPlatformAddMemberRejectsUnknownUser`：404 + `user.not_found`，200 + 1 行成员 |
| 6 | `cd frontend && npx tsc -b` | exit 0 |
| 7 | `cd frontend && npm run lint`（`--max-warnings 0`） | exit 0 |
| 8 | `cd frontend && npm run build` | exit 0，642ms，14 项 prebuild 契约检查全过 |
| 9 | `cd frontend && npx vitest run` | 34 文件 / 230 用例，0 失败 |
| 10 | `npm run check:i18n-hardcode` | 238 文件，0 违规 |
| 11 | `npm run check:menu-contract` | 19 菜单 / 23 路由 / 102 权限 / 23 组件键 |
| 12 | `npm run check:system-page-admission` | 16 entries |
| 13 | `node scripts/audit-i18n-locales.mjs` | 每语言 3021 key，missing 0 / extra 0 / empty 0 |
| 14 | `cd backend && go test -count=1 -timeout 30m ./...`（串行独占） | **46 包 ok / 0 FAIL / exit 0**，另 6 包无测试文件（`full-suite-serial.log`），与 Phase 0 基线逐包一致 |
| 15 | Playwright 打开成员对话框并展开用户选择器 | `member-dialog-open.png`、`member-dialog-selected.png` |
| 16 | 五道治理门禁 `check-task-packet` / `check-evidence --strict` / `check-review --strict` / `check-doc-links --strict` / `check-doc-inventory --strict` | 全部 exit 0，本目录 `commands.json`、`review.md` 均列 [PASS]；doc 两道为 0 finding |

## 已知缺口

- 截图证据是在**已在跑的 dev 栈**上取的：8080 上的 `pantheon-server-ops.exe` 构建于 13:55，早于本波次
  handler 改动，所以截图只证明前端选择器；404 信封由已提交的挂载路由用例证明，而不是由这个 server 实例。
- `linkage.changeRef` 只能填 `none` 或仓库内存在的路径（`scripts/harness/check-evidence.mjs:220`），
  不能填分支名，因此分支与 PR 号记录在程序任务文件里而不是 commands.json。
- 本轮第一次全量 `go test ./...` 因为我并行跑了三份 run 打满 MySQL，`modules/system/i18n`
  触发 `panic: test timed out after 10m0s`（该包不触碰租户代码，非回归）。已终止并行、
  串行独占重跑，采用的读数只认串行那一次。
- 并行 run 期间本地 MySQL 上的 `pkg/testmysql` 克隆库从基线的 2 个孤儿涨到 23 个；
  `DROP DATABASE` 是破坏性操作，未擅自执行，等维护者处置。
- `check-evidence.mjs --strict` 与 `check-review.mjs --strict` 仍未接入 CI（FR-016/FR-017），
  靠本波次手工执行。
