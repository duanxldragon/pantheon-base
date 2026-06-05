# Pantheon Platform

English version: [README.en.md](./README.en.md)

[![Quality Gates](https://github.com/duanxldragon/pantheon-platform/actions/workflows/quality.yml/badge.svg)](https://github.com/duanxldragon/pantheon-platform/actions/workflows/quality.yml)

Pantheon Platform 是一个面向企业后台的模块化单体底座，沉淀认证、IAM、组织、配置、审计、多语言、动态菜单，以及受控低代码生成与模块治理能力。项目目标不是只提供登录和 CRUD 壳，而是提供一套可持续演进、系统域与业务域解耦、AI 友好的后台平台基础设施。

## 项目定位

- **平台层**：应用壳层、路由装配、中间件、平台工作台、跨域聚合视图。
- **系统域**：认证安全、用户角色权限、菜单、组织、配置、字典、审计等底座能力。
- **业务域**：通过 `modules/business/*` 和前端模块 manifest 接入，不直接耦合系统域内部实现。

## 核心能力

- **认证与会话**：access/refresh token、注销失效、在线会话、登录日志。
- **IAM 与权限**：用户、角色、菜单、页面权限、操作权限、Casbin 接口策略。
- **组织管理**：部门、岗位、用户组织归属，以及组织架构视图。
- **配置治理**：系统设置、字典管理、缓存刷新、敏感配置保护。
- **审计能力**：登录日志、操作日志、关键写操作审计。
- **动态菜单**：菜单 seed、前端 manifest、组件注册表和构建期契约检查。
- **低代码工作域**：`system/generator` 负责受控模块生成，`system/dynamicmodule` 负责模块接入治理，统一挂接到 `platform.lowcode`。
- **业务接入**：平台保留 `business/*` 扩展点、模块生成器和治理契约；具体业务仓库独立维护。

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 后端 | Go、Gin、GORM、Casbin、JWT、MySQL、Redis |
| 前端 | React、TypeScript、Vite、Arco Design、Zustand、i18next |
| 工程 | Docker Compose、Playwright、GitHub Actions、gstack QA 流程 |

## 目录结构

```text
backend/
  cmd/server/              # 后端启动入口
  modules/auth/            # system/auth：认证、会话、安全中心
  modules/dashboard/       # platform：工作台聚合数据
  modules/system/          # system/*：IAM、组织、配置、审计等底座能力
  modules/business/        # business/*：业务域扩展入口，平台主线不内置具体业务
  pkg/                     # 公共契约、数据库、响应、JWT 等
frontend/
  src/core/                # 应用壳层、路由、主题、菜单装配
  src/modules/auth/        # 认证与安全中心页面
  src/modules/dashboard/   # 平台工作台
  src/modules/system/      # 系统域管理页面
  src/modules/business/    # 业务域页面
docs/                      # 架构、权限、前端规范、验收与运维文档
database/system_init.sql   # 初始化 schema、seed、i18n
```

## 快速启动

### 1. 启动基础设施

```bash
docker compose up -d
```

默认会启动：

- MySQL: `127.0.0.1:3306`
- Redis: `127.0.0.1:6379`
- 默认数据库：`pantheon_base`

### 2. 启动后端

PowerShell 示例：

```powershell
$env:PANTHEON_DSN='root:DHCCroot@2025@tcp(127.0.0.1:3306)/pantheon_base?charset=utf8mb4&parseTime=True&loc=Local'
$env:PANTHEON_REDIS_ADDR='127.0.0.1:6379'
$env:PANTHEON_REDIS_PASSWORD='DHCCdhcc2025'
$env:PANTHEON_WORKSPACE_ROOT=(Get-Location).Path
go run ./backend/cmd/server
```

后端默认监听 `http://127.0.0.1:8080`。
`pantheon-base` 作为底座仓库，应独占 `pantheon_base` 数据库，不与业务仓库混用。
如果你在 `git worktree` 中运行动态模块生成、卸载或彻底删除，务必显式设置 `PANTHEON_WORKSPACE_ROOT` 指向当前 worktree 根目录，避免 generated 源码和注册表被写入另一套仓目录。

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端默认监听 `http://127.0.0.1:5173`。

### 4. 默认登录

非生产环境未设置 `PANTHEON_INITIAL_ADMIN_PASSWORD` 时，后端迁移会创建开发默认账号：

```text
用户名：admin
密码：123456
```

生产环境必须在启动前设置 `PANTHEON_INITIAL_ADMIN_PASSWORD`，长度不少于 12 位。

## 常用命令

```bash
# 后端测试
go test ./backend/modules/auth ./backend/modules/system/...

# 前端构建与菜单契约检查
cd frontend
npm run build

# 系统页 smoke
npm run test:smoke:system

# 平台壳层与全局 UI smoke
npm run test:smoke:platform

# 全量后台 smoke（platform + system + business）
npm run test:smoke:all

# 生成 foundation release metadata
npm run release:foundation:manifest -- --release-version base-v0.8.0 --release-line release/0.8 --base-commit <40-char-commit>

# 一次性生成 release metadata + dist bundle
npm run release:foundation:cut -- --release-version base-v0.8.0 --release-line release/0.8 --base-commit <40-char-commit>
```

## 手动 Sonar

Sonar 仅作为辅助审查工具，不参与 GitHub required checks。CodeQL 负责安全主信号，Codacy 如果出现也只看作参考仪表盘。

```powershell
Set-Content pantheon-sonarcloud.env "SONAR_HOST_URL=https://sonarcloud.io`nSONAR_TOKEN=..."
./scripts/run-sonar.ps1
```

`run-sonar.ps1` 会自动把 Sonar `projectVersion` 解析为当前可达的最新 foundation release tag（例如 `base-v0.8.1`）；切出新的 foundation release 后，再次扫描就会以该 release 作为新的 Sonar new-code baseline。

扫描结果上传后，直接在 SonarCloud 仪表盘查看热点、重复率和新代码问题。更完整的门禁策略见 [代码质量与安全治理策略](./docs/designs/QUALITY_AND_SECURITY_STRATEGY.md)。

## 权限模型摘要

Pantheon Platform 将权限拆成四层：

1. **导航授权**：是否能在侧边栏看到菜单，存储在 `system_role_menu`。
2. **页面授权**：是否能进入页面路由，来源于菜单元数据 `pagePerm`。
3. **操作授权**：是否能使用页面按钮或动作，来源于按钮节点 `perms`。
4. **接口授权**：后端 API 访问控制，由 Casbin 策略维护。

角色管理页已将导航、页面、操作三类授权统一为树形面板，支持搜索、全展开/全收起和父级批量勾选。

## 文档入口

- `DESIGN.md`：顶层架构与领域边界。
- `docs/README.md`：完整文档索引。
- `docs/README.en.md`：英文索引入口。
- `.agents/skills/README.zh.md`：本仓库的 repo-local Codex skills 入口。
- `docs/designs/PERMISSION_MODEL.md`：权限模型设计。
- `docs/designs/FRONTEND.md`：前端架构与 UI 规范。
- `docs/designs/BACKEND.md`：后端模块化单体规范。
- `docs/designs/WORKFLOW.md`：开发流程与 AI 协作方式。
- `docs/designs/QUALITY_AND_SECURITY_STRATEGY.md`：代码质量与安全治理策略。
- `docs/designs/FOUNDATION_RELEASE_MODEL.md`：底座 release 与 consumer upgrade 模型。
- `docs/archive/upgrade/FOUNDATION_RELEASE_RUNBOOK_20260604.md`：foundation release 生成与 consumer upgrade 运行手册。
- `SECURITY.md`：GitHub Security policy 入口。

## 推荐阅读顺序

建议按这个顺序进入：

1. [README.md](./README.md)
2. [DESIGN.md](./DESIGN.md)
3. [docs/README.md](./docs/README.md)
4. [AGENTS.md](./AGENTS.md)
5. 如需英文入口，再看 [README.en.md](./README.en.md) 和 [docs/README.en.md](./docs/README.en.md)

## 提交规范

本仓库使用 Conventional Commits，格式如下：

```text
type(scope): subject
```

示例：

```text
feat(system-iam): unify role authorization trees
fix(system-org): validate post department ownership
docs(platform): improve repository README
test(system-iam): add role authorization smoke coverage
```

常用 `type` 包括 `feat`、`fix`、`docs`、`refactor`、`test`、`chore`。仓库提供 `.gitmessage` 和 `.githooks/commit-msg`，本地可通过以下命令启用：

```bash
git config commit.template .gitmessage
git config core.hooksPath .githooks
```

## GitHub 展示建议

建议在 GitHub Repository Settings 中配置：

- **Description**：`Enterprise admin foundation with modular monolith, IAM, audit, i18n, dynamic menus, and controlled low-code module generation.`
- **Website**：如暂无线上环境，可暂留空。
- **Topics**：`go`、`gin`、`gorm`、`react`、`typescript`、`vite`、`arco-design`、`casbin`、`iam`、`audit`、`i18n`、`admin-dashboard`、`modular-monolith`、`low-code`、`enterprise-platform`
- **Features**：启用 Issues、Pull Requests、Actions；如暂不开放协作，可关闭 Wiki。
- **Community Files**：仓库已补齐 `README`、`CONTRIBUTING`、`SECURITY`、Issue Templates 和 PR Template。

当前对外定位建议：

- `Enterprise admin foundation`
- `Modular monolith backoffice platform`
- `Controlled low-code generation workflow`

当前不建议直接宣称：

- `runtime low-code platform`
- `hot-pluggable low-code PaaS`
- `visual builder for non-engineers`

原因是当前版本已经具备受控生成链路和模块治理能力，但生成后的模块仍需后端重启与前端重建才能完成激活。

## 安全提示

- 不要把 GitHub 密码、Token、生产数据库 DSN、生产 Redis 密码写入代码、README 或 Git remote。
- GitHub 已不支持账号密码推送，请使用 GitHub CLI、Credential Manager 或 Personal Access Token 认证。
- `.env`、本地数据库、日志、构建产物和可执行文件已在 `.gitignore` 中排除。
