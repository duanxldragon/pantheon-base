---
task_id: 2026-09-20-smoke-core-tenant-ci-gap
title: Diagnose why tests/smoke-core tenant specs fail in the advisory Core Smoke job
created: 2026-09-20
status: completed
priority: P2
layer: platform
risk: diagnosis-complete-awaiting-disposition
---

# Task Packet — 2026-09-20-smoke-core-tenant-ci-gap

## 背景

`2026-09-20-merged-packet-closeout` 在回写合入事实、给 main tip 做信号分类时发现：
advisory 的 `Core Smoke` job 在近 32 个完成的 main run 里红了 29 个（唯一三个绿 run 都在
2026-09-10），并且最早的失败早于 #327–#330，属**先于本次合入存在**的红基线。
`.github/workflows/smoke-core.yml` 用 `continue-on-error: true`，因此 workflow 级结论
一直是绿的，失败只存在于 job 列表里；它又只在 push 到 `main` / `release/**` 时触发，
PR 路径永远跑不到它。

该 job 在 tip（`b3350be3`, job 106030885786）的结果是 28 passed / 8 failed / 3 skipped，
失败清单里包含 `tests/smoke-core/` 的租户 spec：

- `tenant-hostile-browser-matrix-phase2.spec.ts`（auth-log 表面、audit 表面）
- `tenant-hostile-browser-matrix.spec.ts`（login picker、upload namespace、dict fixtures）
- `tenant-protected-resources.spec.ts`

失败断言形如 `security-event row 1 leaked across tenants (expected 101)`、
`operation-log list leaked a foreign row to tenant 101`。这三个 spec 的本地证据
（`2026-09-20-tenant-hostile-matrix-phase2` 的 9/9）是**对着 live multi-mode 后端**取得的。

已登记为 `FR-011`（registry-only / open），本任务负责把它变成有结论的处置。

## 已确认的机制（static evidence）

1. **job 不提供租户前置条件**：`smoke-core.yml` 只启动 `go run ./cmd/server`（默认 compat）
   并运行 `npm run test:smoke:core`；没有设置租户模式 flag、没有 `tenantmatrixdb up`、
   没有 `tenant-matrix-fixture-setup.mjs` 之类的前置步骤。
2. **spec 明确要求这些前置条件**：phase2 spec 头部注释写着 *"The flag must be multi and
   tenants 101/202 must exist (tenantmatrixdb up)"*，并且**没有任何 skip/precondition 守卫**
   （spec 内 grep 不到 skip 逻辑）——前置条件不满足时它不会跳过，只会失败。
3. **套件定义与 README 已经脱节**：`frontend/tests/smoke-core/README.md` 的「核心套件组成」
   仍只列 8 个文件（不含任何租户 spec），而 `test:smoke:core` 跑的是
   `tests/smoke-core/*.spec.ts` 通配，目录里现在有 14 个 spec。租户 spec 落在通配范围内，
   但 job 从未为它们准备环境。
4. **失败的还有两个非租户 spec**：`platform-shell-critical.spec.ts`（sidebar 展开宽度断言）
   与 `system-dept-operations.spec.ts`（root department 行超时）。这两个在 README 的核心
   清单里，红的时间跨度也覆盖 2026-09-05 之前，属**另一个簇**，需要分别定性。

## 假设（按可能性排序）

- **H1（最可能）范围错配**：租户 spec 放进了 `tests/smoke-core/` 通配，而 job 不为它们提供
  multi 模式 + 租户 101/202 + matrix fixtures，于是它们在 CI 里必然失败。若是这样，
  「leaked across tenants」是**测试环境缺前置条件**的表述，而不是真实的隔离回归。
  → **已确认**。
- **H2 真实的隔离回归**：compat 模式下后端确实把跨租户行返回给了查询（若是这样，CI 的红
  信号其实指向一个 P1 产品缺陷，只是被 advisory + continue-on-error 埋了两周）。
  → **已排除**。
- **H3 两个非租户失败**：独立缺陷或 flake（sidebar 宽度断言 `expandedWidth > collapsedWidth`
  失败、dept 行 15s 超时），需要单独 triage。→ **已分离**，为独立簇。

## 诊断结论（2026-09-20 执行）

### 判定依据：断言实际收到的是什么

spec 把断言写成了「泄漏」，所以这个 job 读起来像个安全发现；但断言详情块给出的
`Received` 值说明的是另一回事：

| tip job `106044975128` 的断言 | Expected | **Received** | Received 实际是什么 |
|---|---|---|---|
| `security-event row 1 leaked across tenants` | `101` | **`undefined`** | 响应行**根本没有 `tenantId` 字段** |
| `operation-log list leaked a foreign row to tenant 101` | `101` | **`0`** | `tenant.PlatformGlobalTenantID`，即 compat 的平台全局命名空间 |

没有任何一次返回过 `202`（租户 B）。真实的跨租户泄漏必须出现租户 202 的 id；实际出现的
只是 compat 下**唯一存在**的那个命名空间。其余租户失败是同一类形状不匹配：
`tenantSelectionRequired` 为假（选择器不渲染）、upload `objectKey` 不匹配 `/^t101\//`、
所谓「pre-provisioned」的 dict fixtures 不存在。

### 产品代码说明 compat 本就该如此

- `backend/pkg/tenant/tenant.go`：`ResolveForCanary` 对任何非 multi 模式无条件返回
  `{TenantID: PlatformGlobalTenantID, Mode: compat, ResolvedBy: "compat-fallback"}`，
  且不做 membership 检查（contract §6）。
- `backend/modules/auth/login/login_runtime.go:367`：`resolveLoginTenantClaim` 注释即
  *"Compat ignores any requested tenant: no claim is ever stamped"*，在检查 `tenantChoice`
  之前就返回 0。所以 compat 下 `loginByApi(…, tenantId: 101)` 会**登录成功但把 claim 盖成
  0**——这正是 spec 随后报告为「泄漏」的那个错配。
- `backend/pkg/upload/service.go:488`：命名空间由 `fmt.Sprintf("t%d/", ctx.TenantID)` 推导，
  compat 下得到 `t0/`。

补充旁证：

- 同一批 spec 里有 4 个租户测试在 compat 下**通过**（`phase2:179` 设置面、`phase2:219`
  动态模块面、`matrix:117`、`matrix:129`）。真实隔离回归不会只破坏按行断言的用例而放过这些。
- compat 行为已被通过的后端测试钉住：`login_tenant_gate_test.go`（"compat explicit choice"
  → claim 0；`GateSessionIssuance` compat never stamps）与
  `system_modules_tenant_wiring_test.go`，都在 PR 门禁上跑且绿。

### 前置条件清单（本任务要回答的问题）

| # | 前置条件 | 权威产出方 | Core Smoke 现状 |
|---|---|---|---|
| P1 | `platform.tenant_mode = multi` | `system_setting` 标志行；seed 写 `compat`（`setting_seed.go:42`、`seed_data.yaml:26`），只有 matrix runbook 期间才翻成 `multi` | **缺失**：seed 为 `compat`，从未翻转 |
| P2 | 租户主数据 `101`/`202`（status active） | `tenants` 表；由 `tenantmatrixdb up` upsert（`plan='__smoke_matrix__'`） | **缺失**：job 没有 `tenantmatrixdb` 步骤 |
| P3 | 用户 1（`admin`）在两个租户的 active membership | `tenant_memberships`；由 `tenantmatrixdb up` upsert | **缺失** |
| P4 | 租户 101/202 下的 dict fixtures `matrix_browser_a` / `matrix_browser_b` | `frontend/scripts/tenant-matrix-fixture-setup.mjs`（幂等，走 admin API） | **缺失**：脚本存在但**没有任何 workflow 调用**；它自己的注释记录了这些 fixture 是 2026-09-15 matrix run 期间手工造的、被 `tenantmatrixdb down` 清掉 |
| P5 | 上传对象命名空间 `t{tenantID}/` | 运行时从已解析 context 推导（`pkg/upload/service.go:488`、`setting_handler.go:302`） | **因 P1 而缺失**：解析为 `t0/`，且失败是静默的（`t0/...` 看起来是合法 key） |

**给处置实现者的坑**：`tenantmatrixdb up` **本身不是**完整的 CI 步骤。`cmdUp` 最后一步
会把 `platform.tenant_mode` 写回 `compat`（runbook 的「explicit starting point」），所以只在
job 里加 `tenantmatrixdb up` 仍会停在 compat、仍然全红——翻到 `multi` 是 runbook 里更后面
且独立的一步，CI 接线必须显式复现。另外 `tenantmatrixdb` 强制要求 `PANTHEON_MATRIX_DSN`
且拒绝猜凭证。迁移版本这一项在全新 CI 库上已被满足：`RunMigrations` 会记录最新版本（17），
`up` 里的 `ensureMigration(13..16)` 因而短路，而 migration 13 建的租户表也已存在。

### 红基线（执行时复测）

- **workflow 级正常、job 级不正常**：`gh run list` 把近期 `main` run 全部报成 success，因为
  `8db84bd8`（#301，2026-09-10）加了 `continue-on-error: true`；红只存在于 job 列表。
  #301 之前（2026-09-05 → 09-09）workflow 级本身就是红的。
- **近 39 个 `main` run：31 failure / 3 success / 5 cancelled**，即 34 个完成的 run 里 31 红。
  仅有的三个绿 job 是 `34431776614`（09-10T03:02Z）、`34437941109`（04:38Z）、
  `34442715170`（05:50Z）——正是 #301 修复套件后的窗口；从 `34456538724`（08:41Z）起再度
  持续红到 tip。
- **红基线比租户 spec 更早**：spec 于 2026-09-20 落地（#329），而这个 job 已经红了十天。
  租户 spec 是一个已经红的 job 里**新增**的失败，不是它的成因。

### 第二簇（H3）与两个信号质量发现

- `platform-shell-critical.spec.ts:60`：`expandedWidth > collapsedWidth` 两次尝试都失败，
  确定性、与租户无关。
- `system-dept-operations.spec.ts:151`：「can create a root department」两次都 15s 轮询超时，
  确定性、与租户无关。
- `auth-tenant-picker.spec.ts:145`：移动端横向溢出断言**先失败后重试通过**——是 flake，且该
  spec 完全 mock（`page.route` 拦截 `/auth/login` 与 `/settings/public`），**不需要任何 live
  租户前置条件**，只是名字带 tenant 才落在失败清单里。
- `business-generated-basic.spec.ts`：README 核心清单里的成员，3 个测试全部靠条件式
  `test.skip()` 自跳过，构成 job 的整个「3 skipped」——核心清单宣称了实际不执行的覆盖。
- `tests/smoke-core/README.md` 仍写 8 个文件 / ~20 分钟，而 `test:smoke:core` 现在通配
  **12 个 spec**；三个租户 spec 与 `auth-tenant-picker.spec.ts` 都不在 README 里。这个
  README/通配脱节正是「需要不同环境的 spec 落进这个 job」的机制。

## 验证方案

| 步骤 | 目的 |
|---|---|
| 本地以 multi 模式跑三个租户 spec | 复现既有本地证据（预期绿），确认 spec 本身可用 |
| 本地以 compat 模式跑同样三个 spec | 预期复现 CI 的失败签名（`leaked across tenants`）→ 支持 H1 |
| `rg` spec 内的 skip 守卫与 workflow 内的租户 env | 机械确认「无守卫 + 无前置」 |
| 读 tip 的 `--log-failed` 与历史 run 的失败清单 | 区分租户簇与非租户簇，确认红基线的起始点 |
| 若非租户簇可复现 | 单独立项，不与租户簇混在一个修复里 |

## 处置选项（需维护者 gate）

| 选项 | 代价 / 风险 |
|---|---|
| 在 job 内提供 multi 模式 + 租户 + fixtures | 让信号变可信，但 job 变慢、步骤变多；需要决定 fixture 的幂等与清理归属 |
| 给 spec 加前置守卫（不满足则 skip） | 保留可跑性，但会让 CI 出现「永久 skip」的假绿，需要同时把 skip 计入信号 |
| 把租户 spec 移出 `tests/smoke-core/` 通配范围 | 让 core 信号恢复真实绿，但租户覆盖会脱离任何 CI 路径，需要新的承载 job |
| 维持现状 | 继续维持一个被 `continue-on-error` 掩盖的长期红信号（当前状态） |

## 已实施处置（2026-09-22）

- `frontend/package.json` 的 `test:smoke:core` 改为显式列出 9 个 compat-mode core spec，不再用 `*.spec.ts` 把租户 hostile 场景隐式带入。
- 新增 `test:smoke:tenant` 脚本，并在 `.github/workflows/smoke-core.yml` 增加独立的 `Tenant Smoke (multi-mode advisory)` job：MySQL/Redis 就绪后启动后端，执行 `tenantmatrixdb up`、显式 `PANTHEON_MATRIX_MODE=multi`、fixture setup，再运行三份租户 spec；`always()` 清理回 compat 并删除 tagged tenants/memberships。
- `backend/cmd/tenantmatrixdb` 增加受限的 `PANTHEON_MATRIX_MODE` 解析，默认 compat，只接受 `compat`/`multi`，并由单元测试覆盖，防止 CI 拼写错误后静默跑错模式。
- README 更新为 9 个 core 文件 + 独立 tenant job，FR-011 已从 `open/registry-only` 收口为 `implemented/sensor-added`。

## 边界

- 租户 spec 本身未改；实现只调整 workflow 范围、运行脚本、租户矩阵工具的显式模式选择和文档。
- 若诊断证明 H2（真实回归），升级为 P1 并单独走安全/租户边界流程，不在本任务内顺带修。
  → **未触发**：H2 已排除。

## 处置决策（已执行）

| 选项 | 代价 / 风险 |
|---|---|
| 采用 | Core Smoke 显式 allowlist + 独立 Tenant Smoke multi-mode job，保留 advisory 定位 |
| 不采用 | skip 守卫、无承载地移除租户覆盖、提升任何 smoke job 为 blocking |

README/通配脱节已一并修复；后续新增需要特殊前置条件的 spec 必须进入对应专项 job。

## Evidence

- `.harness/evidence/2026-09-20-smoke-core-tenant-ci-gap/`（诊断、处置、静态验证和 hosted
  运行说明）
- 显式 gap：本机无 3306 MySQL，未伪造本地 multi 模式端到端通过；新 job 的完整 runtime
  evidence 需由 GitHub hosted run 提供。
