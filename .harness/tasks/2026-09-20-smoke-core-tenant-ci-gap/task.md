---
task_id: 2026-09-20-smoke-core-tenant-ci-gap
title: Diagnose why tests/smoke-core tenant specs fail in the advisory Core Smoke job
created: 2026-09-20
status: in-progress
priority: P2
layer: platform
risk: diagnosis-only-until-disposition
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
- **H2 真实的隔离回归**：compat 模式下后端确实把跨租户行返回给了查询（若是这样，CI 的红
  信号其实指向一个 P1 产品缺陷，只是被 advisory + continue-on-error 埋了两周）。
- **H3 两个非租户失败**：独立缺陷或 flake（sidebar 宽度断言 `expandedWidth > collapsedWidth`
  失败、dept 行 15s 超时），需要单独 triage。

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

## 边界

- 诊断阶段**不改** `.github/workflows/smoke-core.yml`，**不改**三个租户 spec；
  第一处改动必须等处置决定（human gate）。
- 若诊断证明 H2（真实回归），升级为 P1 并单独走安全/租户边界流程，不在本任务内顺带修。

## Evidence

- `.harness/evidence/2026-09-20-smoke-core-tenant-ci-gap/`（诊断命令以 `not-run` 记录，
  执行后逐条转 `passed` / `failed`）
