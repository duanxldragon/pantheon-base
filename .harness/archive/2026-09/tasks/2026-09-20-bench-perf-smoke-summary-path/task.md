---
task_id: 2026-09-20-bench-perf-smoke-summary-path
title: Bench perf smoke summary step reads bench.txt from the wrong working directory
created: 2026-09-20
status: completed
priority: P2
layer: platform
risk: high-workflow
---

# Task Packet — 2026-09-20-bench-perf-smoke-summary-path

## 背景

`2026-09-20-ci-bench-perf-smoke`（#327）新增了 advisory 的 `bench-perf-smoke` job：
benchmark 步骤在 `backend/` 下执行并把输出 `tee bench.txt`，随后汇总步骤把
`bench.txt` 追加到 job summary。该 job 落地后 **每一次运行都是红的**——包括两次
main push（`0b17c5d9`、`8c8ff37f`）与 #329 的 PR run。

## 根因

汇总步骤（`if: always()`）没有声明 `working-directory`，因此 `cat bench.txt`
在仓库根执行，而文件实际写在 `backend/bench.txt`：

```
cat: bench.txt: No such file or directory
##[error]Process completed with exit code 1
```

同一 job 的 benchmark 步骤本身是 **success**（三个 audit benchmark 都真实跑完并
产出了 ns/op 采样）。也就是说：失败的是「汇报」而不是「测量」，且因为是 advisory
（report-only、不进 `ci-summary` needs），没有任何门禁把它拦下来——
#327 的 review 已把「advisory job 静默变红没人发现」写为 residual risk，
但没预料到它 **从第一次运行起就是红的**。

## 范围

### In

- `.github/workflows/ci.yml`：给 `Append benchmark results to job summary` 补
  `working-directory: backend`（与写入方一致），并加注释说明为什么必须一致。
- `tests/scripts/ci-bench-perf-smoke-workflow.test.mjs`：漂移守卫——
  ① 所有触碰 `bench.txt` 的步骤必须声明且声明同一个 `working-directory`；
  ② 该 job 必须保持 advisory（名字带 advisory、`-benchtime 1x`、不得进入 `ci-summary`）。
- `package.json` + `ci.yml` unit-tests：新增并接线 `npm run test:ci-bench-perf-smoke-workflow`。
- `docs/harness/failure-registry.md`：新增 `FR-010`（advisory job 红而被门禁漏掉）
  并把 `Last reviewed` 刷到 2026-09-20。

### Out

- 把 `bench-perf-smoke` 升级为 blocking（门禁政策变更，需维护者 gate，#327 已定为 Out）。
- benchmark 本体、backend 测试 helper、采样参数、staging 容量基线。
- `quality.yml` / `security.yml` / `release-gate.yml`。

## 关键取舍

- **为什么修 working-directory 而不是删掉汇总步骤**：advisory job 的价值就是给人看
  采样趋势；没有汇总就等于白跑。一处 `working-directory` 让「测量」与「汇报」同域。
- **为什么加守卫而不是只修一行**：这类缺陷（A 步骤在 X 目录写文件、B 步骤在 Y 目录读）
  是机械可判定的；仓库已有 `quality-workflow.test.mjs` 这类 workflow 断言先例，
  按 `FAILURE_RATCHET_POLICY` 的梯度，重复失败（3 次运行）应升级为 feedback control。
  守卫挂在始终运行的 `unit-tests` job 上，成本为毫秒级。
- **为什么不改 advisory 定位**：report-only 是 #327 的显式决定；本任务只让这个
  信号变可信，不动它的门禁权重。

## 验证集合（已执行）

| 验证 | 命令 | 结果 |
|---|---|---|
| 守卫（修复后） | `node --test tests/scripts/ci-bench-perf-smoke-workflow.test.mjs` | 2/2 pass |
| 守卫（负向对照：还原 working-directory） | 同上，临时删除汇总步骤的 `working-directory` | 按预期失败（`["backend",""]`） |
| guard 可执行入口 | `npm run test:ci-bench-perf-smoke-workflow` | 本机 npm 被 WSL shim 拦截（见 gaps），等价命令已直接跑通 |
| YAML 合法性 + 结构 | `yaml.safe_load('.github/workflows/ci.yml')` | 可解析；bench job 步骤 working-directory = `['-','-','backend','backend']`；unit-tests 已包含新脚本 |
| 失败登记表 | `node scripts/harness/check-failure-registry.mjs --root . --strict` | PASS（FR-010 列枚举合法） |

## 已知 gap

- 本机 `npm`/`npx` 被 WSL shim 拦截（`execvpe(/bin/bash) failed`），无法本地执行
  `npm run test:...`；已验证同一命令以 `node --test <file>` 直接跑通，CI（ubuntu-latest）
  走标准 npm 路径。
- 本机无 MySQL 服务在跑（`127.0.0.1:3306` 未监听），因此没有本地重放真实的
  benchmark→summary→`$GITHUB_STEP_SUMMARY` 链路；该链路的最终证据来自 PR 上
  `Bench Perf Smoke (advisory)` 的 run。

## Human gate

- 无新增 human gate。workflow 变更仍由 GitHub required checks / Security Gates 把关；
  advisory → blocking 的升级属未来维护者决策。

## Closeout（合入后回写，2026-09-20）

| 最小交付件 | 事实 |
|---|---|
| PR | https://github.com/duanxldragon/pantheon-base/pull/330 |
| Merge commit | `b3350be37bd61078530588180331592632f8069a` |
| Merged at | 2026-09-20T05:56:27Z |
| 分支收口 | `fix/bench-perf-smoke-summary-path` 已从 origin 删除 |
| GitHub signal（PR 侧） | 32 success / 6 skipped / 0 failure——含 advisory `Bench Perf Smoke` 转 SUCCESS |
| GitHub signal（main tip `b3350be3`） | `Bench Perf Smoke (advisory)` = success（run 35492933695 / job 106030897699）；required 全绿 |
| Review | `review.md`：sensor-added，含祖先缺陷的负向对照 |
| Ratchet | sensor-added——`tests/scripts/ci-bench-perf-smoke-workflow.test.mjs` + `npm run test:ci-bench-perf-smoke-workflow`，登记 `FR-010` |

### 关闭的 gap 与残留 gap

- **已关闭**：summary.md 里「无本地端到端重放」的 gap 由合入后的 CI run 补上——
  bench 数字现在真的进入 job summary（这就是本任务的存在理由）。
- **未关闭（设计使然）**：advisory job 没有门禁看守。本任务只让这一个信号变可信，
  没有改变它的权重；同类第二次实例（`Core Smoke`，2026-09-20 回写时发现）
  记为 `FR-011`。
