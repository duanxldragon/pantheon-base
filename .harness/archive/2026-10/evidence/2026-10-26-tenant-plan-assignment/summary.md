# Summary — 2026-10-26 套餐指派面接通（TENANT_CONTRACT V1.5）

## Why this task exists

V1.4（2026-10-25，租户运营信息架构改造）把套餐定义落库与读侧视图做彻底之后，在合同 §9 显式登记了一条
残余 gap：`PlanStore.AssignableCodes` 有实现、有单测，但**没有出货调用方**——租户表单的套餐下拉仍是四个
内置字面值。结果是运营者新建的自定义 code 能被存进 `tenant_plans`、能被总览如实显示，却无法指派给任何
租户。维护者本轮指令是「继续处理剩余的问题」，该 gap 与另外三条（EN 合同 V1.2/V1.3 回译、§2.2 文档↔实现
漂移、`max_api_keys`/`max_storage_mb` 未上总览）一起登记在册。

前三条已在本轮先后闭合；本文件记录第四条（任务 #105）的处置与其证据。
`max_api_keys` / `max_storage_mb` 未上总览**不是缺陷**：它来自本轮冻结的「核心组：租户+成员+角色+部门」
指标决策，且这两个维度当前没有计量来源，合同 §2.5 规则 6 已按此写明。

## 决策与实现

范围仍是冻结的「读侧与阈值可配、**写侧不动**」：不新增后端路由、不改任何写入校验的语义，只把控制台
的指派面接到已有的 `/system/tenant-ops/plan/list`，并把服务端既有的判定规则镜像到前端。

- `frontend/src/modules/system/iam/tenant/planOptions.ts`（新增）：派生三类选项——
  写侧可指派（`status !== 'disabled'`，空/不可读时回落内置四档）、读侧筛选（全部已定义 code，含停用）、
  编辑器（可指派集 + **当前租户自己的 code 即使不可指派也带住**，避免打开退役套餐就静默改写它）。
  顺序沿用服务端 `sort ASC, id ASC`，前端不再排一次。
- `frontend/src/modules/system/iam/tenant/TenantList.tsx`：编辑表单与筛选器改用它；`getPlanList` 以
  `skipErrorMessage: true` 静默拉取（这份列表对表单是咨询性的，读不到就回落，不该弹错）。
- 5 个语言资源新增 `system.tenant.plan.outsideLadder`：自定义 code 不在前端能力阶梯内时明示
  「控制台功能按免费版展示，配额上限仍按该套餐定义生效」，而不是隐藏这个事实。
- 后端删除 `PlanStore.AssignableCodes`：它按字母排序（阶梯顺序错）、从未有出货调用方，留着只会诱导
  第二套策略；其唯一价值场景已被 `ValidateAssignment` + 前端派生覆盖。同步删除对应单测。

合同同步（ZH 权威 + EN 镜像）：§2.4 新增不变量 8（指派 code 由服务端判定，含失败开放的停用归一化），
§9 的 V1.4 残余 gap 标注为「已由 V1.5 接通」并保留未闭合部分（前端能力阶梯），V1.5 行的性质从
「澄清」更正为「澄清（§2.2）+ 扩展（§2.4 不变量 8）」——把 gap 移进 In 是 Extension，不是澄清。

## 验证

单元与门禁（全部本地实测，非推断）：

- `frontend/tests/unit/modules/system/iam/tenant/planOptions.test.ts` 新增 5 例，逐条对应上面三类规则；
  先观察到两条自身写错的期望（`toBe` 比数组身份、把退役 code 算进可指派集），修正后与实现一致。
- 全量 `vitest run`：32 files / 222 tests 通过。
- `tsc -b` exit 0；`eslint src --max-warnings 0` exit 0（CI 采用的形态）；改动文件单独 lint exit 0。
- `go build ./...` exit 0；`go test ./modules/system/i18n/... ./modules/system/iam/tenant/... -count=1` 全绿
  （plan store 从 9 例变 8 例，删除的是 `AssignableCodes` 那一例）。
  **该 ok 本身不构成覆盖证据**：tenant 包每条 DB 用例在无 `PANTHEON_TEST_DSN`/`PANTHEON_DSN` 时走
  `testmysql` 的 `t.Skipf`，末次运行复核显示未配置时 `TestPlanStore*` 8 例全 SKIP、汇总仍是 `ok`。
  真正的证据是随后带 DSN 的重跑（凭据只从 `.env.test` 注入环境，未打印）：
  `PANTHEON_TEST_DSN_REQUIRED=1 go test ./modules/system/iam/tenant/... -count=1` → ok / 62.5s 真实执行，
  `-run TestPlanStore -v` 逐条 8 PASS、0 SKIP、0 FAIL。运行后用只读 SQL 复核保留库
  `pantheon_base_plan_matrix_20261025`：四个租户的 `plan`/`status` 与五条套餐（`opsprobe = disabled`）
  与本轮验证前逐列一致（`pkg/testmysql` 只创建并删除自己的隔离克隆库）。
- 契约类检查：`check-i18n-hardcode`、`check-menu-contract`、`check-import-path-case`、`check-ui-contract`、
  `check-i18n-generated-scope` 全通过；`audit-i18n-locales` 五语 3015 键 missing=0 extra=0（新键对齐）；
  `scripts/frontmatter-check.mjs` 通过；ZH/EN 标题数量一致（新增条款两侧同步）。

浏览器实测（真后端 :8080 + 真 Vite :5173 + 保留库 `pantheon_base_plan_matrix_20261025`，admin 登录，
使用的是 `docs/designs/DATABASE.md:127` 记载的非生产默认账号，不是本机私密凭据）：

1. `/system/tenant` 挂载即发出 `GET /api/v1/system/tenant-ops/plan/list` → 200（网络面板核对）。
2. 新增表单套餐下拉初始为 `免费版 / 基础版 / 专业版 / 旗舰版`——内置阶梯顺序来自服务端 `sort`，
   此时库中第 5 条 `opsprobe` 为 `disabled`，被正确排除在写侧之外。
3. 读侧筛选（工具条「筛选」→ 按套餐）**包含** `Ops Probe`：停用只从写侧隐藏，读侧保留，
   与 §2.4 不变量 8 的不对称一致。
4. 临时把 `opsprobe` 置 `active`（等过 5 秒 `planCacheTTL`）后重新打开表单：下拉变为 5 项，
   末项显示 `Ops Probe`（取自表里的 `name`，没有 i18n 标签）→ 证明指派面确由数据驱动。
5. 选中它，表单出现提示原文：`「opsprobe」不在前台能力阶梯内：控制台功能按免费版展示，配额上限仍按
   该套餐定义生效。`；套餐功能对照表把该套餐单列为一栏（成员上限 7 来自定义，不是 free 的 5）。
6. 点「取消」关闭：该页全程只发出 `GET` 与 `POST /auth/activity` 心跳，**没有任何租户写请求**；
   `SELECT id, code, plan, status FROM tenants` 复核四个保留租户的 `plan` 与 `status` 一字未变。
7. 收尾把 `tenant_plans` 恢复为验证前状态（`opsprobe = disabled`，其余四条 active），SQL 复核行数与取值
   与验证前逐列一致。

## 附带裁定：audit 标题不对称登记项（任务 #106）

本轮收尾要处置的最后一条登记项是「租户侧 `DELETE /tenants/:id/members/:user_id` 的 handler 不设 audit
标题，与平台侧 `SetAuditMetadata(..., BusinessDelete)` 不对称」。核查后结论是**前提不成立，因此不改代码**：

- 该路由属于 legacy `Handler`（`backend/modules/system/iam/tenant/tenant_handler.go:244-263`），它唯一的
  挂载入口是 `RegisterRoutes`（`tenant_routes.go:9-28`）。
- 出货代码里没有 `RegisterRoutes`/`NewHandler(` 的调用方：全仓检索除包内定义外只命中
  `tenant_handler_test.go`（6 处），`system_modules.go:57` 声明的字段类型是 `*tenantiam.PlatformHandler`。
- 出货的租户写路径 `system_modules.go:290-306` 全部挂 `PlatformHandler`，每条都显式设标题
  （`tenant_platform_handler.go:131/148/168/203/223`、`tenant_ops_handler.go:70/87`，含 `member_remove`）。
- 这条「未挂载」并非新发现：`docs/api/TENANT_API.md:17` 已写明该组 not mounted，2026-10-22 的交付审计
  （`.harness/evidence/2026-10-22-delivery-audit-remediation/review.md:13`）在运行态实测
  `/api/v1/tenants` 返回 404、`/api/v1/system/tenant/list` 返回 200。
- 因此运行态不存在这条不对称；给一个没有路由的 handler 补标题属于死代码。ZH/EN 合同 V1.5 §9 的登记条目
  已按上述证据改写为裁定结论，未改任何 Go 代码。

## Known gaps

- 截图未能留档：应用的 in-app Browser 表面当时处于 hidden（`visibilityState=hidden`），
  截图动作被工具层拒绝（`NATIVE_BROWSER_VIEWPORT_UNAVAILABLE`）。因此上面第 2~5 条以 DOM 文本与
  网络记录为证据，没有 PNG；需要视觉件时请在可见的浏览器窗口里重跑该路径。
- 前端能力阶梯 `core/entitlements/plans.ts` 仍是四档硬编码、未知 code 失败闭合为 `free`：
  自定义套餐的控制台**功能入口**按免费版展示。已在表单明示并写进合同「仍未闭合」，
  真正的按套餐裁剪菜单/能力属 §1 Out 的商业化语义，需另行立项。
- 本轮未触碰 §2.4.1 的写侧强制：后端仍不因超配额拒绝任何写入。
- audit 标题登记项已裁定为「前提不成立」（见上一节），遗留的是那条路由本身仍是一份没有挂载入口的
  legacy 表面，`docs/api/TENANT_API.md:17` 已在文档层劝阻集成；是否删除属单独一轮的取舍。同一表面还带着
  `@Router /api/v1/tenants*` 的 swagger 注解，仓库内当前既没有提交任何生成产物（全仓无 `swagger.json`/`docs.go`），
  也没有配置生成步骤（无 `swag init` 引用），所以不对外 advertise；但一旦有人接入 `swag init`
  就会把 404 路径写进 API 文档——登记为未来候选，本轮不动。
- `frontend` 的 `npm run format:check`（prettier，非 CI 门禁）在 HEAD 就对
  `src/i18n/resources/*.ts` 报 warn；本轮把自己的新增行改回单引号约定（每文件 81 行），
  未顺手重排既有历史债务，以免功能 diff 混入大面积格式化。`src/api/request.ts:17` 的拼接 import 同属该债务。
