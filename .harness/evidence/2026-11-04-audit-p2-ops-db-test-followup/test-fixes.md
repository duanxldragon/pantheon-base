# PB-010 测试侧修复与真实 DB 回归

日期：2026-11-05。范围：按 [triage.md](./triage.md) 修复 8 个测试侧顶层用例（11 节点）与 1 个业务侧缺口（host 创建未初始化 `state_version`），在隔离 Ops worktree 中以真实 MySQL 8.0.36 回归。**未修改 Ops 主工作树、未提交业务以外的改动、未放宽 SSRF/鉴权**。

## 隔离环境

- worktree：`audit-artifacts/ops-test-fixes-2026-11-05`，基于 `pantheon-ops` HEAD `1c057ee`（detached，后建本地分支承载提交）
- MySQL：8.0.36，`127.0.0.1:23306`，复用既有隔离 datadir（`audit-artifacts/base-global-remediation-2026-11-04/services/mysql-data`），测试库按 `testmysql` 规则为每个用例独立建库并清理
- `PANTHEON_TEST_DSN_REQUIRED=1`，DSN 未配置会 fail 而非静默 skip；`GOPROXY=off`、专属 `GOCACHE`
- 本轮 4 个业务包不依赖 Redis，未启动 Redis

## 修复内容（4 文件，+47/−15）

| 文件 | 修复 | 对应用例 |
|---|---|---|
| `bizscope/bizscope_service_test.go` | 用既有 `newBizScopeServiceWithCMDB` 接线 CMDB 能力；每个子用例建齐 Delete 会扫描的三张引用表 | `TestBizScopeDeleteRejectsNonCMDBReferences`、`TestBizScopeDeleteIgnoresSoftDeletedReferences` |
| `deploy/deploy_reliability_test.go` | 按认领式建模显式种入 running 的 `DeployTaskHost`，不再假设 `CreateTask` 建行 | `TestMarkHostResultDefersTerminalTaskUntilActiveAttemptFinishes` |
| `deploy/deploy_service_test.go` | Start 断言返回规范错误后再读持久化结果；陈旧删除用例先过期 host lease，并用 `UpdateColumn` 老化 `updated_at` | `TestStartDeployTaskPersistsCanonicalSSHRunnerErrors`、`TestDeployTemplateTaskSSHExecutorFailsOnScriptPrecheck`、`TestDeleteDeployTaskReconcilesStaleRunningTask` |
| `observability/datasource_service_test.go` | 用例内注入仅放行本地测试端点的 validator，生产 `NewDatasourceService` 的 SSRF 端口/私网策略不变 | `TestDatasourceDefaultCanMoveAndClear`、`TestDatasourceQueriesLokiAndTempo` |

首轮 bizscope 修复后暴露 fixture 第二层问题（Delete 无条件扫描三张表，子用例只建一张 → `biz_application` 不存在），已按同一定性补齐，不是业务缺陷。

## 业务侧缺口修复（host CAS）

根因：`Host.StateVersion` 默认 0，`Create`/导入建行时不赋值，而 `TransitionState` 以 `ExpectedStateVersion > 0` 作为启用 CAS 的条件。新建主机因此返回 `stateVersion=0`，任何带期望版本的过渡都被当成“不校验”，陈旧期望不会被拒绝——`TestHostStateTransitionsUseCompatibilityProjectionAndCAS` 的 stale retire 落到生命周期校验，返回 `cmdbhost.state.invalid` 而非 `cmdbhost.state.stale`。

修复（`cmdb/host`，3 文件）：创建即版本 1，使“写入自身就是第 1 版”与状态机每次过渡 +1 连续。

| 位置 | 改动 |
|---|---|
| `host_service.go` `Create` | 显式 `StateVersion: 1` |
| `host_import_export.go` `buildHostImportHost` | 导入新建主机同样从 1 起版 |
| `host_model.go` | 列默认值 `0 → 1`，避免其他直插路径再落回不可 CAS 的 0 |
| `host_service_test.go` `TestCreateHost` | 断言初始版本为 1，钉住合同 |

存量行由版本化迁移 `000031_backfill_cmdb_host_state_version` 回填：`UPDATE biz_cmdb_host SET state_version = 1 WHERE state_version = 0`，幂等，按 `information_schema` 守卫表/列存在性（业务表由模块 AutoMigrate 建，纯系统库不应因此启动失败）；`down` 保留数据。已回填行与修复后新建行同义，不会重写已有大于 0 的版本。

## 验证读数

| 命令 | 结果 |
|---|---|
| 目标 bizscope 2 用例 | exit 0 |
| 目标 observability 2 用例 | exit 0 |
| 目标 deploy 4 用例 | exit 0 |
| `go test -count=1 -run TestHostStateVersionBackfillEnablesCAS ./pkg/database/` | exit 0（4.8s）：真实迁移链将 0 行回填为 1、不动版本 5 的行、重跑幂等，随后 stale 过渡返回 `cmdbhost.state.stale` |
| `go test -count=1 ./pkg/database/` | exit 0（48.1s）：含迁移链 up/down/re-apply 全量 |
| `go test -json -p 1 -count=1 ./modules/business/...`（回填迁移后） | **exit 0；278 通过 / 0 失败 / 0 跳过，18 个包全绿** |
| `go build -buildvcs=false ./...` | exit 0（worktree 下 `-buildvcs` 默认取 VCS 状态报 128，与代码无关） |

剩余失败为零。此前唯一失败 `cmdb/host TestHostStateTransitionsUseCompatibilityProjectionAndCAS` 已随业务修复转绿，日志见 `audit-artifacts/ops-test-fixes-2026-11-05/business-hostfixed.jsonl`。

基线对照：修复前 266 通过 / 12 失败（同 Ops HEAD 断言）。

## 未关闭

- observability 端口/私网允许范围维护者策略裁定（本修复未触及）
- 回填迁移只在隔离库验证过，未对任何长期环境执行；生产执行属发布动作
- 独立 review 仍 503；正式 release/lock 升级/冻结未执行
