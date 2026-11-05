# Summary — 2026-10-31-audit-p2-dead-code-legacy-surface

覆盖 AUD-012 / AUD-013 / AUD-014 / AUD-020（wave W6）。检索命令与读数见同目录 `commands.json`，
逐条 reviewer posture 见 `review.md`。

## 删除清单（每项先检索后删除）

| 项 | 删除物 | 检索证据 |
| --- | --- | --- |
| AUD-012a | `frontend/src/hooks/usePagination.ts`、`useRequest.ts` 及 `hooks/index.ts` 的 4 行再导出 | base `frontend/src` 零命中；ops 命中的 6 行全是 **ops 自有副本**，不 import base，跨仓构建不受影响 |
| AUD-012b | `backend/internal/scaffold/engine.go` 的 `Generate` 与 `capitalize` | `grep -rn "scaffold.Generate" backend` 零命中；scaffold 包其余导出仍被 dynamicmodule/generator 消费，包保留 |
| AUD-020 | `internal/middleware/casbin_middleware.go` 的 `readRoleKeysFromContext` | 零命中；测试改用 `common.GetRoleKeys`，未改其语义 |
| AUD-013 | `role_service.go` 删除角色时的防御性清理、`dashboard_service.go:348` 表白名单占位 | Go 代码对该表零功能性引用，仅剩两处说明性注释 |

## pkg/security/ssrf 为什么不删（scope out）

base 仓内 0 引用，但 **ops 后端有 5 处引用**（`grep … ../pantheon-ops/backend | wc -l` → `5`）。
这正是 FR-021（v0.18.0→v0.18.1 `isForbiddenRequestError` 事故）的同类场景：只搜本仓就删共享导出，
会让消费仓构建失败。按 D 类“下游保留”处理，本任务明确不动，并把 5 处读数记入 commands.json。

## 000031 迁移与 down 的数据承诺边界

- 新增 `000031_drop_permission_role_data_scope_policy.{up,down}.sql`；**未改写 000001/000020/000024**
  （已进入版本链的历史迁移改写会让已部署环境与新环境结构分叉）。
- **down 只重建表结构，不承诺恢复数据**：drop 前表内本就无功能读写（无 INSERT/SELECT），
  但若有人手工写入过，down 后是空表。这不是“可回滚”，不可逆 drop 前应留一份导出
  （human gate：死表 drop 需确认数据可丢弃）。

### 收口复核修正：down 的重建形状（2026-11-01）

初版 evidence 以“up/down/up 三步 exit 0”作为迁移可用的证据。**这个判据不够**：往返成功
只说明语句能跑通，不说明重建出来的表就是 v30 那张表。复核改用 `SHOW CREATE TABLE` 对照：

| | 索引 |
| --- | --- |
| 空库直接迁到 30（权威 v30） | `PRIMARY` + `UNIQUE uk_permission_role_data_scope_policy_tenant (tenant_id, role_key)` |
| 初版 000031.down 重建 | 上面两个 **+ `UNIQUE idx_permission_role_data_scope_policy_role_key (role_key)`** |

多出来的那条是 000001 建的、**000024 在引入租户维度唯一键时已经删掉**的索引。它把
`role_key` 变回全局唯一：回滚到 v30 之后，两个租户不能再用同一个 `role_key`——一个 v30
从未有过的约束，而且恰好是租户化要解决的问题。

修复：down 只重建 v30 的真实形状（仅 `uk_...tenant`），文件头写清“为什么那条 role_key
唯一索引不再重建”。新增回归用例 `TestDropPolicyTableDownReconstructsVersion30Shape`，
把「迁到 30」与「迁到 31 再回滚到 30」两张表的 `SHOW CREATE TABLE` 做逐字节比较；
该用例在缺陷版本上跑过一次并报 FAIL，证明它不是恒绿用例。
全链 `TestMigrationChainRollsBackAndReapplies` 复跑仍 PASS，修复没有破坏回滚链。


## legacy 认证端点决策（AUD-014）

**决策：保留 + 标 Deprecated + 定下线日期 2026-12-31**，而非立即下线。

理由：`/system/{login,refresh,logout,user/info}` 是对外 API 面，与 `/auth/*` 同 handler；
base 与 ops 前端虽都只调 `/auth/*`，但无法排除外部集成方。下线属对外承诺变更，
按 manifest human gate 需维护者确认无外部集成后才能执行第二步。

落地方式：

- `modules/auth/module.go`：`/system` 公开组与 `/system/*` 保护组挂 `LegacyDeprecationMiddleware`，
  命中 `legacySelfServicePaths` 的响应带 `Deprecation: true` + `Sunset: Sat, 31 Dec 2026 23:59:59 GMT`。
- `csrf_middleware.go` 保留 `/system/login|/system/refresh` 两条精确豁免，与现存两条路由一一对应；
  `casbin_middleware.go` 对 legacy 端点没有特例 case（login/refresh 在公开组，logout/user/info 走常规
  策略）——**豁免与路由状态一致**，不留下无对应路由的豁免；下线日与路由一并移除。
- `docs/contracts/SYSTEM_AUTH_CONTRACT.md` 新增 §7.7、`.en.md` 新增 §7.6，登记四个端点的
  当前入口、弃用头、下线日期与“执行前需维护者确认”的约束。

## 同步关闭（本任务带出的文档漂移）

- `docs/runbooks/TENANT_MIGRATION_RUNBOOK.md`：§2.1 表清单与 §2.2 唯一键清单移除
  `permission_role_data_scope_policy` 两行（表已 drop）。
- `docs/runbooks/TENANT_TROUBLESHOOTING.md`：租户清理 SQL 移除对该表的 DELETE
  （`system_role_data_scope` 已在同清单中）。
- `backend/cmd/tenantsizing/main.go`：kept-global 注释移除该表名并注明由 000031 drop。

## 验证读数

- 后端：`go build ./...`、`go vet ./...` 均 exit 0；受影响包 `go test -short` 全绿
  （middleware 6.1s / iam/role 26.2s / platform 3.6s，0 FAIL，真实 MySQL）。
- 迁移：`TestDropPolicyTableDownReconstructsVersion30Shape` PASS 7.5s（形状逐字节相等）；
  负向验证 FAIL 7.9s（写回多余索引后必红）；`TestMigrationChainRollsBackAndReapplies`
  PASS 19.6s（全链 up→down→up）。
- 前端：`npx tsc -b` + **完整 `npm run build`**（✓ built，含 prebuild 链，非只跑 tsc）。
- 文档与证据门禁：`frontmatter-check`（415 docs）、`check-doc-links --strict`（0 findings）、
  `check-task-packet`（全 PASS）、`check-evidence --strict`（11 文件 / 0 error）、
  `check-review --strict`（11 文件 / 0 error）。

## 显式 gap

- 迁移往返在本地 testmysql 一次性库执行，**未在生产库验证**；生产执行前按 human gate 需数据导出。
- legacy 端点的真正下线（移除路由 + CSRF 豁免）推迟到 2026-12-31，且需维护者确认无外部集成方。
- ops 仓仍保留自己的 `usePagination`/`useRequest` 副本——属 ops 自有面，按 doNotTouch 不在本任务处理。
- 新回归用例依赖真实 MySQL DSN；无 DSN 时 skip，由 CI 的 `PANTHEON_TEST_DSN_REQUIRED=true` 兜住。