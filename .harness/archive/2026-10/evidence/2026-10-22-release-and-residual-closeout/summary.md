# 2026-10-22 — v0.17.0 发布与遗留项收口

**Status**: completed
**Scope**: v0.17.0 tag/release、D2 凭据轮换、F2 分支保护复验、B10 Tenant Smoke advisory 摘除、G2 skip-masking 防护、浏览器级验收
**Baseline**: main `728feb2b`（= `pantheon-base-v0.17.0` tag target）
**Gate**: 全量后端测试（真实 MySQL + Redis，required 标志开启）0 skip / 0 fail；18 条前端路由浏览器巡检 0 console error / 0 failed API

## 1. Release（F5）

| 项 | 值 |
|---|---|
| Tag | `pantheon-base-v0.17.0`（annotated，tag object `d1a167c5b5f48df33ed4fe9e7d90daf9947a927b`） |
| Target commit | `728feb2b66e0ed5f915cafc785c287fc2b3eca2a` |
| Release | https://github.com/duanxldragon/pantheon-base/releases/tag/pantheon-base-v0.17.0，published `2026-10-22T00:17:53Z`，非 draft / 非 prerelease |
| Assets | `foundation-release-pantheon-base-v0.17.0.tgz` 19,903,712 B；`.tgz.sha256` 111 B；`repo.tar` 34,058,240 B；`repo.tar.sha256` 75 B |
| SHA-256 | tgz `4f24787947317fa746e8a64fd1fd7fa5d764e85bd01a948d834f6865a358922f`；repo.tar `0badc9848ef540f0e9aa49b496392deceece95c96e536e81560ff1ca27c19ebe` |
| Verify | `Foundation Release Verify` run `39698850076`（event `release`）conclusion `success` |

资产校验和与本地下载复算一致；release 发布后未再替换任何资产。

## 2. F2 — main 分支保护

- 生效规则集：`17011510` / `solo dev merge rules`，`target=branch`、`enforcement=active`、覆盖 `~DEFAULT_BRANCH`、`bypass_actors=[]`。
- 规则：禁止删除、禁止 non-fast-forward、要求 PR、required status checks =
  `Quality Gates`、`Security Gates`、`Unit Tests`、`CI Summary`、`SonarCloud Code Analysis`。
- 说明：经典分支保护 API 仍返回 404，但规则集对 `main` 生效；以 ruleset API 实测为准。

## 3. B10 — Tenant Smoke 从 advisory 转阻塞

- `.github/workflows/smoke-core.yml` `smoke-tenant`：移除 `continue-on-error: true`，job 名去掉 `(multi-mode advisory)`，注释改为 push-only mainline health signal。
- 该 workflow 只在 `push`/`workflow_dispatch` 触发，因此阻塞语义是「mainline run 变红」，不是 PR merge gate。
- 依据：main 最近 5 次 `smoke-core.yml` run 全部 `success`（`39598957879`、`39584482520`、`39582453605`、`39580935995`、`39572335644`，head 覆盖 `728feb2b` 及之前 4 个 commit）。

## 4. G2 — skip 掩盖防护

代码：

- `backend/pkg/testmysql/mysql.go`：新增 `PANTHEON_TEST_DSN_REQUIRED`；truthy 时无 DSN 直接 `Fatalf`，否则保持 `Skipf`；DSN 仍按 `PANTHEON_TEST_DSN` → `PANTHEON_DSN` 解析。
- `backend/pkg/testmysql/mysql_test.go`：用 fake reporter 锁定 fail/skip 决策、truthy/falsy 取值与 `PANTHEON_DSN` 回退。
- CI：`ci.yml` 的 `unit-tests`、`bench-perf-smoke` 与 `quality.yml` 的 `backend-tests` 均设置 `PANTHEON_TEST_DSN_REQUIRED: "true"`。
- `docs/operations/RUNBOOK.md` 增补 MySQL-backed tests 小节，并修正该节末尾不平衡的代码围栏。

实测：

```text
# required + 无 DSN：失败而不是 skip（期望失败）
PANTHEON_TEST_DSN= PANTHEON_DSN= PANTHEON_TEST_DSN_REQUIRED=true \
  go test ./pkg/database -run TestRunMigrationsAlignsRuntimeSchemaWithCurrentContracts -count=1
--- FAIL: ... mysql is required (PANTHEON_TEST_DSN_REQUIRED is set) but neither PANTHEON_TEST_DSN nor PANTHEON_DSN is configured

# required 未设 + 无 DSN：skip（兼容裸 checkout）
--- SKIP: TestRunMigrationsAlignsRuntimeSchemaWithCurrentContracts
PASS

# 配置齐全 + required 开启：全量后端测试
go test ./... -count=1   # 真实 MySQL + Redis
exit=0；0 个 FAIL，0 个 --- SKIP
```

`backend/pkg/testmysql` 单包 17 个用例全部通过；`go build ./...` 通过；`gofmt -l` 无输出。

## 5. D2 — 凭据轮换与清点

- 已在本机开发实例完成 MySQL root 与 Redis 口令轮换：旧口令认证被拒，新口令连接成功，Redis `CONFIG REWRITE` 已持久化；新值只写入 gitignored 的 `.env.test` / `pantheon-ops/.env` 与本地 `.tmp` 草稿。
- 当前 HEAD 跟踪文件对两项旧开发凭据 `git grep -l` = 0（`.harness/archive/.../commands.json`、`summary.md` 已改为 `<redacted-dev-credential>`）。
- **显式残留**：v0.17.0 release 的 `repo.tar`（以及 tgz 内嵌的同名文件）来自 redaction 提交之前的 `728feb2b`，仍包含两项旧凭据；旧凭据已失效，但工件含明文口令这一事实仍在。历史 git 对象同样保留旧值。未在未授权情况下替换已发布资产或重写历史。
- 后续建议（需维护者决定）：发布 v0.17.1（推荐，资产可从当前 main 重建）或在明确授权下替换 v0.17.0 资产并同步更新校验和/验证记录。

## 6. 浏览器级验收

环境：本机 MySQL 3306 + Redis 6379（轮换后口令）、`go run ./cmd/server`、Vite dev server `127.0.0.1:5173`、Chromium headless（Playwright 1440×900）。登录使用非生产 seed 账号 `admin`。

- **路由巡检 18 条**：`/dashboard`、租户、用户、角色、权限、菜单、部门、岗位、字典、系统设置、i18n、会话、登录日志、安全事件、操作日志、模块、生成器、`/auth/security`。
  全部渲染出实际内容（`textLength` 402–2328，表格行 0–11），**0 console error、0 个 `/api/` 响应 ≥400**。
- **交互**：租户搜索过滤、租户成员抽屉、用户详情、角色编辑（导航+按钮授权树）、角色成员抽屉、i18n 搜索、会话筛选、当前会话详情。
  均正常打开/渲染，无前端异常；截图见 `artifacts/`，原始结构/网络结果见 `browser-sweep.json`、`browser-interactions.json`。
- **限制**：本轮浏览器操作以登录、导航、查询、打开详情/编辑弹窗为主，未提交写操作（未修改本地租户/用户/角色数据）；`AddMember` 幂等、停用租户撤销会话等写路径由真实 MySQL Go 套件与 CI Tenant Smoke 覆盖。深度跨租户 HTTP 对抗矩阵仍按原报告为显式 gap。

## 7. 结论

D2（轮换完成，工件残留显式登记）、F2、F5、B10、G2 与浏览器级终验均已收口；无新增 P0/P1。
v0.17.0 已发布且验证通过，main `728feb2b` 的 Quality/Security/CI/Smoke 运行均为 success。
