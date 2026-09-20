---
task_id: 2026-09-20-ci-bench-perf-smoke
title: CI benchmark perf smoke — relative regression signal
created: 2026-09-20
status: completed
priority: P2
layer: platform
risk: high-workflow
---

# Task Packet — 2026-09-20-ci-bench-perf-smoke

## 背景

`runtime-gap-ci-feasibility-20260918.md` 对验证任务（finding #4，perf/observability
baseline）的处置结论：**基线本体只能来自 staging**（GitHub runner 2-4 vCPU 共享宿主，
数字不具生产代表性），但 CI 可以承载一个 **`go test -bench` smoke**，把现有
audit benchmark 作为**相对回归信号**随时间追踪。本任务落地该 follow-up（独立 task id）。

## 发现的真问题

实跑发现三个 audit benchmark **从未能运行**：
`setupAuditTestDBForName`（`audit_export_test.go:14`）硬断言 `*testing.T`，
benchmark 传 `*testing.B` 直接 `tb.Fatalf("audit mysql test helper requires *testing.T")`。
即 finding #4 说的「no benchmark job」之外，benchmark 本体在本地也是坏的——
这条在 2026-09-18 的评估中未被发现（该评估只确认了 benchmark 文件存在）。

## 实现者视角（Generator）

1. `backend/pkg/testmysql/mysql.go`：抽出 `OpenTB(tb testing.TB)`；`Open(t)` 成为
   `OpenTB(t)` 的薄封装（零行为变化）。
2. `backend/modules/system/audit/audit_export_test.go`：helper 改用 `testmysql.OpenTB(tb)`，
   删除 `*testing.T` 断言（一行 helper，两调用方，无其他系统域依赖）。
3. `.github/workflows/ci.yml`：新增 `bench-perf-smoke` job（Phase 2c）——
   MySQL service + `go test -run '^$' -bench 'BenchmarkAuditServiceListOperationLogs' -benchtime 1x`
   + `tee bench.txt` + 输出到 `$GITHUB_STEP_SUMMARY`。**advisory（report-only）**：
   不进 `ci-summary` needs，不作为门禁。

## 边界

- 层级：platform（CI 基础设施）+ 测试基础设施（pkg/testmysql、audit test helper）。
- 不触碰：产品代码、审计生产逻辑、`quality.yml`/`security.yml`、其他包的 benchmark。
- 风险点：`.github/workflows/*` 属高风险范围 → zizmor 本地对比基线必须零新增。

## 关键取舍

- `cache: false`（setup-go）：advisory 单次迭代 job 不需要构建缓存，且避免新增
  cache-poisoning 面（本地 zizmor 验证：`cache: true` 时 14 findings，改后回到基线 13）。
- `-benchtime 1x`：每个 benchmark 单次迭代，证明可跑 + 采样 ns/op；完整分布留给
  staging 基线。若未来需要更多采样，调大 benchtime 而不是取消 advisory 定位。
- **不进 ci-summary**：summary job 需要显式列出非阻断 job 才不破坏红绿语义；
  添加即把 advisory 变阻断。保持 report-only，升级为阻断属未来 ratchet 决策（需维护者 gate）。

## 验证集合（已执行）

| 验证 | 命令 | 结果 |
|---|---|---|
| benchmark 真实运行 | `PANTHEON_TEST_DSN=... go test ./modules/system/audit/ -run '^$' -bench ... -benchtime 2x` | 3 benchmarks 全部执行（~26ms/op @ 20k 行） |
| 无回归（有 DSN） | `go test ./pkg/testmysql/ ./modules/system/audit/`（带 DSN） | ok |
| 无回归（无 DSN skip 路径） | `env -u PANTHEON_TEST_DSN -u PANTHEON_DSN go test -bench ...` | PASS（干净跳过） |
| vet/gofmt | `go vet ./pkg/testmysql/ ./modules/system/audit/ && gofmt -l ...` | clean |
| zizmor 基线对比 | zizmor 1.25.2 JSON，stash 前后对比 | 基线 13 = 改后 13（cache:false 后零新增） |
| YAML 语法 | `python -c "yaml.safe_load(...)"` | OK |

## Human gate

- workflow 变更合并由 GitHub required checks 把关（本 PR 上 Security Gates 等）。
- advisory → blocking 的升级属门禁政策变更，需维护者单独决策。

## 评审视角（Reviewer 检查点）

- [x] benchmark 数字是否被误读为容量基线？（summary 中显式标注 not a capacity baseline）
- [x] job 失败是否会挡合并？（不会——未进 ci-summary needs）
- [x] zizmor 门禁是否零新增？（是）
- [x] OpenTB 是否改变既有测试行为？（否——Open 委托 OpenTB，同一实现）

## Closeout（合入后回写，2026-09-20）

| 最小交付件 | 事实 |
|---|---|
| PR | https://github.com/duanxldragon/pantheon-base/pull/327 |
| Merge commit | `0b17c5d9d6e0c9aa0bc84b1fdeba3e570ceef3f6` |
| Merged at | 2026-09-20T01:37:39Z |
| 分支收口 | `chore/ci-bench-perf-smoke` 已从 origin 删除 |
| GitHub signal（PR 侧） | 27 success / 2 skipped / 1 failure——唯一红的是本任务新增的 advisory `Bench Perf Smoke`（汇总步骤 cwd 缺陷） |
| Review | `review.md`：advisory-only + zizmor 基线对比 |
| Ratchet | 本任务未落地；由 #330 承接（`FR-010` + 漂移守卫，sensor-added） |

### 合入后事实

- 该 job 自落地起**每次运行都是红的**（main push `0b17c5d9`、`8c8ff37f` 与 #329 的 PR run），
  直到 #330 修复汇总步骤的 working-directory。测量步骤一直是 success，失败的是汇报。
- 本任务 review 里写下的 residual risk（「advisory job 可能会静默变红而无人发现」）
  按预测发生，且因为 job 不进 `ci-summary` needs，PR 侧没有任何门禁拦下它。
- 回写 closeout 时顺带发现同类第二次实例：advisory `Core Smoke` 自 ≥2026-09-05 持续红
  而 workflow 级结论为绿（`continue-on-error`）——记为 `FR-011`，属独立 follow-up。
