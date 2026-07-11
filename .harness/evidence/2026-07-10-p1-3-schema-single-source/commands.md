# P1-3 schema 单源化 — 证据摘要

> Task: 2026-07-10-p1-3-schema-single-source
> 执行者：Claude（**经 Human Owner 显式授权本次直接实现，非 Codex 委派**——区别于常规红线）
> 分支：feat/p1-3-schema-single-source（off main，隔离 worktree，不碰 feat/color-mode）

## 调查结论（核实真实现状）

1. `database/system_init.sql` 已带醒目 DEPRECATED 头，列出 13 张缺失表、指向 `migrate up`。
2. **但 `docker-compose.yml:21` 仍把它挂到 `/docker-entrypoint-initdb.d/`** ——`docker-compose up` 首次起库会跑陈旧 16 表 DDL。这是真正的踩坑路径。
3. `docker-compose.yml` 设 `MYSQL_DATABASE: pantheon_base`，容器无论如何创建空库。
4. 应用自举完整：启动 `migrate up`（29 表）+ `backend/modules/system/seed.go`（菜单/admin 角色/admin 权限）+ i18n seed + 启动确保 admin `/api/v1/*` casbin 策略 + 首个 admin 用户（`DATABASE.md §5`, §3.4 line 96, §5 line 111）。

→ `system_init.sql` 的 docker 挂载**冗余且有害**，移除后空库→app 迁移+seed 即正确单源路径。

## 改动

- `docker-compose.yml`：移除 `./database/system_init.sql:/docker-entrypoint-initdb.d/...` 挂载，加注释说明单源路径。
- `docs/designs/DATABASE.md §3.4 / §5`：改"来源=system_init.sql"为"权威=golang-migrate"，system_init.sql 标为 DEPRECATED 仅参考。
- 新增 `database/README.md`：权威建库路径说明 + system_init.sql DEPRECATED 说明。
- `database/system_init.sql` 文件保留为历史参考（已有 DEPRECATED 头），不再被任何建库路径引用。

## Do-Not-Touch 遵守

- 未改 `backend/pkg/database/migrations/**`（权威源）。
- 未改运行时迁移/seed 代码。
- 未新增/改表结构。

## 验证

- 改动均为配置(docker-compose.yml) + 文档(.md)，**不含 Go 代码**，不影响 `go build`。

## 本地验证已跑（2026-07-10，用户本地环境，go1.25.4 windows）

- `go build ./backend/...` → **PASS**（backend 全量编译干净，含 P1-1/P1-2 既有代码）。
- P1-1 核心守卫 `go test -run TestProtectedManagementPolicyGuard` → **PASS**（4/4 子用例：admin 可写受保护策略、非 admin 拦 permission/role、非 admin 可写业务策略）。
- P1-1 错误码 `TestPermissionServiceErrorCode` → **PASS**。
- P1-2 包测试 `go test ./backend/pkg/database/... ./backend/internal/middleware/...` → **PASS**（casbin watcher / token middleware 逻辑绿；需 DB 的自动 skip）。

## Known Gaps / Residual Risk（需 DB 或 docker）

- **端到端 DB 测试待跑**：`TestPermissionService_PolicyWriteProtection`（P1-1 端到端）在本机因 `PANTHEON_TEST_DSN` 未配置而 SKIP。需连本地 MySQL 后跑；CI 约定 DSN 为 `root:root@tcp(127.0.0.1:3306)/pantheon_base`。
- **docker bring-up smoke 待跑**：移除 system_init.sql 挂载后 `docker-compose up` 起库 + app migrate + admin 登录，确认单源路径正常。
- `system_init.sql` 文件保留（历史参考，已有 DEPRECATED 头）；确认无引用后可移 `database/archive/` 或删除。

## Residual 已关闭 — 空库端到端验证（2026-07-11，用户本地 MySQL 8.0.36 + Redis，无 Docker）

> 用户本地无 Docker 环境。改用**独立临时空库** `pantheon_p13_verify` 等价复现 docker-compose 首次起库路径
> （`MYSQL_DATABASE` 建空库 → 应用启动 migrate + seed），全程不碰用户现有 `pantheon_base` 库。

前置：`CREATE DATABASE pantheon_p13_verify`（0 表）→ 应用以 `PANTHEON_DSN=...@tcp(127.0.0.1:3306)/pantheon_p13_verify`、`PANTHEON_PORT=18099` 启动。

- `go build ./backend/cmd/server` → **PASS**。
- 启动日志关键信号（`backend/pkg/database` migrate + `seed.go`）：
  - `Database connection successful` / `Redis connection successful`
  - **`database migrations: all migrations applied successfully`** ← golang-migrate 从空库建表，无 system_init.sql 参与
  - Casbin seed：admin `/api/v1/*` 的 GET/POST/PUT/PATCH/DELETE 策略写入
  - `INFO starting server port=18099`，端口监听正常
- 空库建表结果：`information_schema` 计 **31 张 BASE TABLE**；`schema_migrations` = version 8（8 个 up 文件全部应用，dirty=0）。
- 运行时 seed 落库确认：`system_user` 首个 `admin`（id=1, status=1）、`system_setting`（login.\* 等）、`system_i18n`（zh-CN/en-US）均已写入。
- Health 接口：`GET http://127.0.0.1:18099/api/v1/health` →
  `{"code":200,"data":{"status":"ok","dependencies":{"database":{"status":"ok"},"redis":{"status":"ok"}}}}`。

→ **结论**：schema 完全由 golang-migrate + 运行时 seed 单源建立，`system_init.sql` 未参与任何建库路径。docker bring-up smoke 的等价链路（空库→migrate→seed→admin/health）已验证通过，**residual 关闭**。

清理：验证后 `DROP DATABASE pantheon_p13_verify`、结束验证进程、删除编译产物与日志；用户 `pantheon_base` 库未受影响（仍 32 表）。

> 仍开放（非本 PR 范围）：`system_init.sql` 后续可移 `database/archive/` 或删除（当前保留为带 DEPRECATED 头的历史参考）。
