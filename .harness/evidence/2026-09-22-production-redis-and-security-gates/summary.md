# Evidence — 2026-09-22-production-redis-and-security-gates

## 变更摘要

### 1. 生产 Redis fail-fast（验收标准第 1 条）

`backend/pkg/database/redis.go` + `backend/cmd/server/main.go`：

- 新增 `database.RequireRedis()`：`PANTHEON_ENV=production` 恒为 true；非生产可显式 `PANTHEON_REDIS_REQUIRED=true` 开启（开发/测试兼容开关）。
- `InitRedis` 连接失败：`RequireRedis()` 时 `os.Exit(1)`；否则保持既有降级（`RDB = nil`）。
- **新缺口修复**：生产环境缺 `PANTHEON_REDIS_ADDR` 时原来静默以无 Redis 启动（认证全 401 才暴露），现在 `main.go` fail-fast `logging.Fatal`。
- 测试：`pkg/database/redis_required_test.go` 7 个用例锁定语义（生产恒需 / dev 默认可选 / 显式开关 / 大小写 / 生产下显式 false 不降级）。

### 2. readiness 反映 DB/Redis/migration（验收标准第 2 条）

`backend/modules/platform/health.go` + `backend/pkg/database/migrate.go`：

- 新增 `database.MigrationsHealthy(db)`：`schema_migrations` 表存在且非空。
- `/api/v1/health` 的 dependencies 新增 `migrations`：DB 可达但迁移未完成（表缺失/为空）→ `migrations.incomplete` + 503；Redis 缺失仍显示 `disabled`（非生产 compat），生产由启动 fail-fast 保证。
- 既有测试 `TestRegisterHealthRoutes_ReturnsDependencyState` 补 seed `schema_migrations`（保持其"健康路径"意图，语义变化由新测试覆盖）。
- 新测试：`health_migrations_test.go` — 迁移完成 → 200/ok；未迁移 → 503/`migrations.incomplete`。

### 3. CI 阻断语义与例外治理（验收标准第 3、4 条）

`.github/workflows/security.yml`：

- dependency-vulnerabilities 与 workflow-security 两个 report-only 分支补明确例外治理：**owner: repo maintainers；每次 release 复审**；失败在 step summary 与 artifacts 可见，push-to-main 仍强制阻断——PR report-only 不会静默吞掉红灯。
- gitleaks 恒阻断（原有，保持）；zizmor `|| true` 之后有 high/critical fail-closed 检查（原有，保持）。

### 4. 可复现入口（验收标准第 5 条）

`docs/operations/RUNBOOK.md` Health Checks 节：写入本机复现 govulncheck（固定 v1.3.0）、npm audit（root+frontend）、race、MySQL/Redis 单测的完整命令；`docs/DEPLOYMENT_GUIDE.md` 必需环境变量表新增 `PANTHEON_REDIS_REQUIRED`，验收清单第 8 条要求 `/api/v1/health` 三依赖全 ok。

### 5. 依赖修复（发现的必修 CVE）

`govulncheck`（v1.3.0）发现 7 个 stdlib 漏洞（GO-2026-6218/6091/6090/6089/6088/5972/5026，全部为 go1.26.5 stdlib，代码可达：`cmd/server` ListenAndServe→tls/http/template 等）。全部由 `go.mod` `go 1.26.5 → 1.26.6` 修复，复扫结果：**0 vulnerabilities reachable**（1 imported + 3 required 但不可达，非阻断项）。CI 用 `go-version-file: backend/go.mod`，版本一致性自动保持。

## 验证证据

```text
env: PANTHEON_TEST_DSN=root:***@tcp(127.0.0.1:3306)/pantheon_base, REDIS_ADDR=127.0.0.1:6379

go build ./...                                          → PASS
go test ./pkg/database/ ./modules/platform/ ./cmd/server → ok（20.1s / 9.5s / 0.06s，含新测试）
go test ./internal/middleware/                          → ok
go vet ./pkg/database ./modules/platform ./cmd/server   → exit 0
govulncheck v1.3.0 ./...                                → "Your code is affected by 0 vulnerabilities"（修复 7 后复扫）
```

## 显式 Gap

1. human gate：CI 阻断策略（report-only 例外 owner/release 复审节奏）与生产 Redis 必需性需维护者确认——本实现按任务包验收标准默认收紧。
2. `PANTHEON_REDIS_ADDR` 缺失 fail-fast 的启动路径（`os.Exit`）无法在单测内验证（`logging.Fatal` + exit），以 `RequireRedis()` 单元测试 + 代码路径审查覆盖。
3. govulncheck 本地用 GOPROXY=proxy.golang.org（goproxy.cn 504），CI 环境不受影响。
