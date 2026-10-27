# Phase 0 基线（2026-10-27 13:30–14:05 实测）

本波次**不做任何代码改动**：只重跑整改程序开工前声明的基线命令，确认它们在当前 `main`（`2091a2d8`，
v0.17.7）上仍然成立，作为后续 22 个波次的对照值。所有命令都带真实 MySQL / Redis，未设置 skip 兜底变量。

工作分支：`docs/tenant-remediation-phase0-baseline`（基于合并了计划产物的 `main` = `1694f6cb`，本分支只新增
本草证目录，`git diff` 对源码为空）。测量本身在 `docs/harness-task-packets-2026-10-27`（PR #431，已 squash
合并为 `1694f6cb`）上进行，该分支的源码树与 `2091a2d8` 逐字节相同，因此读数描述的就是当前 `main`。

## 环境与前置

| 项 | 值 |
|---|---|
| 仓库基线 | `main` = `2091a2d8 chore(release): publish v0.17.7 foundation materials (#430)` |
| MySQL | `127.0.0.1:3306` 在监听，凭据仅从根目录 `.env.test` 读入进程环境，未打印、未入库 |
| Redis | `127.0.0.1:6379` 在监听 |
| 后端服务 | `:8080` 由 `backend/.tmp/run-server-ops.sh` 提供，作用于保留库 `pantheon_base_plan_matrix_20261025` |
| Node | `D:\nodejs`；**必须置于 PATH 首位**，否则 `npm` 交给 `cmd.exe` 的子进程找不到 `node`，`tsc/lint/build` 全部以「'node' 不是内部或外部命令」失败 |
| 测试环境变量 | `PANTHEON_TEST_DSN` `PANTHEON_TEST_DSN_REQUIRED=true` `PANTHEON_TEST_REDIS_REQUIRED=true` `PANTHEON_NODE_BIN=D:\nodejs\node.exe` `PANTHEON_WORKSPACE_ROOT=<仓库根>` |

> 后端服务原本运行的是 `2026-10-25T23:36` 构建的二进制，比当前 `main` 旧两天。为了让 smoke 基线描述的是
> 当前代码树，本次用 `go build -o .tmp/pantheon-server-ops.exe ./cmd/server` 重建并原地重启（同一启动脚本、
> 同一库、同一 env），旧二进制保留为 `.tmp/pantheon-server-ops.exe.bak-20261025`。重启后 `GET /api/v1/health`
> 返回 `database/migrations/redis` 全部 `ok`。

## 实测结果

| # | 命令 | 结果 |
|---|---|---|
| 1 | `cd backend && go build ./...` | exit 0 |
| 2 | `cd backend && go vet ./...` | exit 0 |
| 3 | `cd backend && go test -count=1 ./...`（带 DSN + Redis 必需） | **46 包 ok / 0 FAIL / exit 0**，另 6 个包 `[no test files]` |
| 4 | `cd backend && go test -count=1 -v ./modules/system/iam/tenant/...` | **119 PASS / 0 SKIP / 0 FAIL**（92 个顶层用例 + 27 个子用例），61.5s |
| 5 | `cd frontend && npx tsc -b` | exit 0 |
| 6 | `cd frontend && npm run lint` | exit 0 |
| 7 | `cd frontend && npm run build`（prebuild 14 项契约检查） | exit 0，`✓ built in 1.15s` |
| 8 | `cd frontend && npx vitest run` | **34 文件 / 230 用例通过**，30.9s |
| 9 | `npm run check:menu-contract` | 通过：19 菜单 / 23 路由 / 102 权限 / 23 组件键 |
| 10 | `npm run check:i18n-hardcode` | 通过：238 文件 |
| 11 | `npm run check:system-page-admission` | 通过：16 entries |
| 12 | 租户 smoke 矩阵组（3 个 spec，`--setup tenant-matrix-fixture-setup.mjs --port 5178 --workers=1`） | **10 passed / 0 failed**（47.4s） |
| 13 | 租户 smoke 视角组（`tenant-viewpoint-switcher.spec.ts`） | **5 passed / 0 failed**（48.0s） |
| 14 | 夹具收尾 `tenant-matrix-fixture-setup.mjs down` + `cleanup-smoke-fixtures.mjs` | 均 exit 0，清理计数 `i18n:6`、`depts/dicts/permissions:0` |

租户 smoke 合计 **15 passed / 0 failed**（矩阵 10 + 视角 5），与 `smoke-tenant-baseline.md` 记录的 12:40
结果一致；差别是本次跑在重建后的 HEAD 二进制上，因此这条数字描述的是当前代码树。

## 与程序声明基线的差异

无。`docs/harness/tasks/2026-10-27-tenant-completeness-remediation.task.md` 的「2026-10-27 测试基线」表
逐条复现，包含最容易被 skip 掩盖的两条（第 3、4 行）。

## 残留与显式缺口

- **两个孤儿测试库**：中止一次尚在编译阶段的 `go test ./...`（未带 `-count=1`、未带 `PANTHEON_NODE_BIN`）后，
  随后的租户包运行被中断，留下 2 个 `pantheon_base_test*` 形式的 `pkg/testmysql` 克隆库。
  `buildTestDBName` 用 `UnixNano+随机后缀` 命名，因此后续运行不会与之冲突，保留库
  `pantheon_base_plan_matrix_20261025` 未被触碰。删库属破坏性操作，未自行执行，等维护者确认后再清理。
- **本机负载**：`go test ./...` 全量约 15 分钟，期间机器上另有长时间运行的 Python 进程；计数结论不受影响
  （46 ok / 0 FAIL 由 `-count=1` 与 `PANTHEON_TEST_DSN_REQUIRED=true` 保证不是缓存或 skip 结果）。
- **未跑**：`npm run test:smoke:l0` / `test:smoke:l1` / 模块级 smoke 不在本程序基线集合内，本次未执行；
  `pantheon-ops` 兼容性验证按计划留到 Phase 6 收口。
