## 变更摘要

- 改动层级：platform（构建依赖面 + 后端测试文件 + 一个前端列表页），无 schema / 路由 / 权限 / i18n / 契约语义变化
- 改动模块：`backend/go.mod`、`backend/go.sum`（go-oidc `v3.9.0 → v3.21.0`，go-jose 从 v3 迁到 `v4.1.6`）；
  `backend/modules/auth/oidc/handler.go`（注释）；`backend/pkg/database/notfound.go`（参数列表）；
  `backend/modules/system/iam/tenant_isolation_smoke_test.go`、`backend/pkg/tenant/scope_helper_test.go`（测试内函数提取）；
  `frontend/src/modules/system/iam/tenant/TenantList.tsx`（权限判定收敛为 `can(perm)`）；`.harness/STATUS.md`
- 目标问题：`main` 的 `Release Gate` 红在两条 job 上——`Dependabot Alerts` 有 1 条 high 告警
  （`GHSA-mgcc-cww5-fp2q` / `CVE-2026-116587`，`github.com/go-jose/go-jose/v3`，经 `coreos/go-oidc v3.9.0`
  传递引入，v3 线无修复版），`SonarCloud Gate` 有 5 条未处理 issue（`go:S1135`、`go:S3776`×2、`godre:S8209`、
  `typescript:S3776`）。本 PR 把两条 job 的成因都清掉，且不动任何门禁规则、不加 suppression
- 预期影响：依赖侧只换传递模块，OIDC 模块仍休眠（无路由、无消费方），模块路径仍是 v3、导入路径不变；
  5 处 Sonar 均为等价重写——注释改写、同名同序参数合并、测试函数提取、组件内权限 helper，
  断言、子测试名、权限布尔取值逐条不变

## Harness 链路

- Task ID：`2026-10-28-release-gate-green`
- Task Manifest：`.harness/tasks/2026-10-28-release-gate-green/manifest.json`
- Evidence：`.harness/evidence/2026-10-28-release-gate-green/commands.json`
- Verification evidence：`.harness/evidence/2026-10-28-release-gate-green/summary.md`
- Review Artifact：`.harness/evidence/2026-10-28-release-gate-green/review.md`
- OpenSpec change：none
- Trivial change：no
- Quality Profile：ci-workflow
- Ratchet Decision：no-repeat-observed
- GitHub Signal：not-applicable

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-10-28-release-gate-green
- task manifest: .harness/tasks/2026-10-28-release-gate-green/manifest.json
- evidence: .harness/evidence/2026-10-28-release-gate-green/commands.json
- boundaries: 只动依赖、两处静态检查整改与两处测试结构；未改 workflow / sonar 配置 / 迁移 / VERSION / CHANGELOG
- backend response contract: unchanged（OIDC handler 仅注释变化，响应体一字节未改）
- backend DTO contract: unchanged
- permission contract: unchanged（`can(perm)` 与原五个 `isAdmin || hasPerm(...)` 等价，返回值与类型不变）
- audit coverage: unchanged
- visual evidence: not-applicable（无标记或样式变化，`vite build` 产物正常）
- inheritance contract: 未改 sharedPaths 或继承合同；`pantheon-ops` 无需动作
- base drift: 分支基于 `main` @ `cbd37694`（#460 计划阶梯、#461 S3 波次、#462 发布说明目录化均已合入）
- Base/ops inheritance: 无同步要求；依赖树自包含于 base

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

补充说明：改动全部落在 `platform` 层。虽然路径上触及 `system/auth`、`system/iam` 与共享 `pkg/*`
（按 `repo-pr-gate` 的路径口径属高风险范围），但 `system/*` 内只有注释与测试文件，
`pkg/database` 只合并同类型参数、行为与调用点不变，`pkg/tenant` 只改测试文件。

## 验证记录

- [x] `gofmt -l`（4 个改动文件）→ 无输出
- [x] `go vet ./modules/system/iam/ ./pkg/tenant ./pkg/database ./modules/auth/oidc/` → 干净
- [x] `go build ./...` → 成功
- [x] `CGO_ENABLED=1 go test -race -count=1 ./...` → **47 包 ok / 0 FAIL / 6 包无测试文件**
  （本机需 `mingw64/bin` 在 `PATH`，否则 cgo.exe exit 2 会伪装成全量 build failed）
- [x] `go test -count=1 -run TestTwoTenantIsolationSmoke -v ./modules/system/iam/` → 编译通过、本地无 DSN 时 SKIP
  （CI 以 `PANTHEON_TEST_DSN_REQUIRED=true` 承担运行读数）
- [x] `go run golang.org/x/vuln/cmd/govulncheck@latest ./...` → 代码受影响 0 条
- [x] `go mod graph | grep go-jose` → 只剩 `/v4` 边，选定 `v4.1.6`；`go.mod`/`go.sum` 无 v3 条目
- [x] 前端 `npm run lint`、`npm run type-check`、`npm run build` → 全过（build 1.47s）
- [x] `check:task-packet`、`check:structure`（0/2882）、`check:harness-encoding`（0/2534）、
  `check:docs-frontmatter`（392 docs / 274 带 frontmatter）→ 通过
- [x] `check-doc-links`、`check-doc-inventory`、`check:generated`（0/11）、`check:ui-quality-gate` → 0 finding(s)

## 审核留痕

- Copilot review：见 PR 机器人读数；本 PR 无需人工豁免
- CodeQL 结果：仅依赖与等价重写，预计无新增告警；以 PR checks 为准
- GitHub checks 结果：见 PR checks 读数（`Full Smoke` ×2、`Quality`、`CodeQL` 等）
- Auto-merge：not-applicable（高风险路径改动，需两名非作者批准后由维护者 squash 合并）
- Duplication Gate 结果：`check:duplication` 在验证集内；提取的是既有断言，无新增重复逻辑
- 是否高风险改动：是（按 `repo-pr-gate` 路径口径触碰共享 `pkg/*`、`system/iam`、`system/auth` 与依赖树；
  改动本身行为中性）
- Residual risk / follow-up：
  - SonarCloud 与 Dependabot 的放行只能在合并进 `main` 后的下一次分析 / 依赖图刷新中观测；
    本地证据是结构性的（阈值已清、模块图已净）而非一次绿色门禁运行。
  - `govulncheck -show verbose` 仍列出 3 条“在依赖模块中但不可达”的告警（`x/net` html 合并 ×2、
    `x/crypto` openpgp）。当前无 Dependabot 告警、无可达路径；记录在案，避免未来告警刷新时措手不及。
  - 两租户隔离冒烟在本机无 MySQL DSN 时 SKIP，运行读数由 CI 承担。

## 检查清单

- [x] 已明确本次改动归属 `platform`，未把系统域职责混写
- [x] 未改任何门禁规则、workflow、Sonar 配置，未使用 `NOSONAR` 或规则排除
- [x] 未删除任何断言或测试用例：11 个子测试改名归位、断言逐条保留
- [x] 前端无新增展示文案，i18n 无变化
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰：权限判定表达式等价，路由未动
- [x] 无数据库/迁移变更，schema 版本不变
- [x] 已确认不会泄露敏感配置、账号密码或 Token：diff 只含依赖、注释、签名与测试结构
