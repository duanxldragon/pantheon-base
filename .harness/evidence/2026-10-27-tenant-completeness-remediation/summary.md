# Summary — 2026-10-27 租户完整性整改程序 Phase 0（基线，不改代码）

## 这一轮做了什么

整改程序（TC-01..TC-08 / W1..W8）开工前的最后一道前置：在**当前 `main`（`2091a2d8`，v0.17.7）**上把程序
任务书声明的基线命令全部重跑一遍，确认这些数字成立，作为后续 22 个波次的对照值。

本轮**零源码改动**：`git diff` 对 `backend/`、`frontend/src/`、`config/`、迁移与 seed 全部为空。
产物只有 `.harness/evidence/2026-10-27-tenant-completeness-remediation/` 下的基线证据三件套与
`baseline.md`。

## 为什么必须重跑

`docs/reviews/TENANT_FUNCTIONAL_COMPLETENESS_REVIEW_2026-10-27.md` §5 里记录的「全绿」最初是**没有 DSN**
时得到的：`pkg/testmysql` 在 `PANTHEON_TEST_DSN` / `PANTHEON_DSN` 都未设置时把依赖 MySQL 的用例 `t.Skipf`，
整包 0.04s 报 `ok`，而租户包实际有 85 个静默 skip。评审已就地更正为 119 pass / 0 skip，本程序引用的是更正后的
数字。因此基线的价值不在于「绿」，而在于**带 `PANTHEON_TEST_DSN_REQUIRED=true` 的绿**——它把 skip 变成 fail，
后续任何波次若让某个 DB 用例失去 DSN 覆盖都会立刻红，而不是悄悄缩水。

## 实测结果（14 项，全部通过）

| # | 命令 | 读数 |
|---|---|---|
| 1 | `cd backend && go build ./...` | exit 0 |
| 2 | `cd backend && go vet ./...` | exit 0 |
| 3 | `cd backend && go test -count=1 ./...` | **46 包 ok / 0 FAIL / exit 0**（另 6 包无测试文件） |
| 4 | `cd backend && go test -count=1 -v ./modules/system/iam/tenant/...` | **119 PASS / 0 SKIP / 0 FAIL**，61.5s |
| 5 | `cd frontend && npx tsc -b` | exit 0 |
| 6 | `cd frontend && npm run lint` | exit 0（`--max-warnings 0`） |
| 7 | `cd frontend && npm run build` | exit 0，prebuild 14 项契约检查全过 |
| 8 | `cd frontend && npx vitest run` | **34 文件 / 230 用例**，30.9s |
| 9 | `npm run check:menu-contract` | 19 菜单 / 23 路由 / 102 权限 / 23 组件键 |
| 10 | `npm run check:i18n-hardcode` | 238 文件，0 违规 |
| 11 | `npm run check:system-page-admission` | 16 entries |
| 12 | 租户 smoke 矩阵组（3 spec，port 5178，`--setup tenant-matrix-fixture-setup.mjs`） | **10 passed / 0 failed** |
| 13 | 租户 smoke 视角组（`tenant-viewpoint-switcher.spec.ts`） | **5 passed / 0 failed** |
| 14 | 收尾 `tenant-matrix-fixture-setup.mjs down` + `cleanup-smoke-fixtures.mjs` | 均 exit 0 |

与任务书「2026-10-27 测试基线」表逐条一致，**差异：无**。第 3、4 行是最容易被 skip 掩盖的两条，本次均在
必需态下执行。

## 环境事实（下一轮必须复用，否则数字不可比）

- **`D:\nodejs` 必须置于 PATH 首位。** 否则 `npm` 把 lifecycle script 交给 `cmd.exe` 后 `node` 解析失败，
  `tsc / lint / build / vitest` 会以「'node' 不是内部或外部命令」整体报红——这是本机现象，与代码无关。
- 必需环境变量：`PANTHEON_TEST_DSN`、`PANTHEON_TEST_DSN_REQUIRED=true`、`PANTHEON_TEST_REDIS_REQUIRED=true`、
  `PANTHEON_NODE_BIN=D:\nodejs\node.exe`、`PANTHEON_WORKSPACE_ROOT=<仓库根>`。凭据只从 gitignore 的根 `.env.test`
  读入进程环境，未写入任何被跟踪文件、日志或本证据。
- smoke 依赖活的后端 `:8080` + MySQL + Redis。原运行二进制构建于 `2026-10-25T23:36`，落后 HEAD 两天，
  因此用 `go build -o .tmp/pantheon-server-ops.exe ./cmd/server` 重建并原地重启（同一启动脚本、同一保留库
  `pantheon_base_plan_matrix_20261025`、同一 env），旧二进制留为 `.bak-20261025`；`/api/v1/health` 的
  `database/migrations/redis` 全部 `ok` 后才跑 smoke。**这意味着 `smoke-tenant-baseline.md` 里 12:40 的 15 passed
  描述的是旧树，本文件的 15 passed 描述 HEAD。** 历史文件未改写。

## 关闭的 finding

无。Phase 0 不关闭 TC 编号，它的产出是「后续 22 波次的对照基线成立」这一条前置事实。

## 显式缺口

见 `commands.json` 的 `knownGaps`（7 条），要点：

- 两个 `pantheon_base_test*` 孤儿克隆测试库（一次被中断的运行留下）。`buildTestDBName` 带 `UnixNano` + 随机后缀，
  后续运行不会撞名；删库属破坏性操作，未自行执行，等维护者确认。
- `test:smoke:l0` / `l1` 与模块级 smoke 不在本程序基线集合内，未跑。
- `cd ../pantheon-ops && go build ./... && npm run build` 按计划留到 Phase 6 收口。
- 环境探测阶段有一次 DSN 值进入了工具回显（掩码正则未命中该形态）。凭据未落到任何被跟踪文件或证据产物，
  本轮之后不再读取或打印该值；是否需要轮换本地开发口令由维护者决定。
