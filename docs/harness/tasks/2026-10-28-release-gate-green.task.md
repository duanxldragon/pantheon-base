---
title: 主干 Release Gate 转绿（依赖漏洞 + Sonar 未处理项）
doc_type: Remediation
layer: platform
depends_on_layers: []
status: Active
linked_contracts:
  - docs/designs/REPOSITORY_LAYOUT.md
updated_at: 2026-10-28
---

# Task Packet: 2026-10-28-release-gate-green

## Goal

让 `main` 上的 `Release Gate` 恢复 success。红的两条 job：

- `Dependabot Alerts`：1 条 high 告警打在 `github.com/go-jose/go-jose/v3`
  （GHSA-mgcc-cww5-fp2q / CVE-2026-116587）。该模块不是直接依赖，而是
  `github.com/coreos/go-oidc/v3 v3.9.0` 的传递依赖；go-jose/v3 在 v3 线上没有修复版，
  只能换到 go-jose/v4 线。
- `SonarCloud Gate`：5 条未处理 issue（`go:S1135`、`godre:S8209`、`go:S3776`×2、
  `typescript:S3776`），全部集中在本次 S3 波次新增/触碰的文件里。

修法：`go-oidc` 升到 `v3.21.0`（该版本改用 go-jose/v4），显式锁定
`github.com/go-jose/go-jose/v4 v4.1.6`（已修复版），go.mod/go.sum 中不再有 go-jose/v3；
5 条 Sonar issue 按规则拆分函数/改签名/改注释，不用 suppression，行为保持不变。

## Primary Layer

platform

## Dependency Layers

- `platform`（构建依赖面 + 后端测试文件 + 一个前端列表页）。不改 schema、路由、权限、
  i18n key、契约语义。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `none`
- Release Requirement: `none`
- Downstream Sync Note: 依赖传递链自包含于 base；OIDC 模块仍处休眠（无路由、无消费方），
  升级不改变对外接口。消费方无需动作。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `ci-workflow`
- Portable Failure Class: `dependency-disclosure`
- Owner Layer: `foundation-source`
- Ratchet Decision: `no-repeat-observed`
- Coverage Dimensions:
  - runtime-quality
  - maintainability

交付层级：**L1**（范围固定：依赖升级 + 5 处静态检查整改，验证集合明确）。

## Contract Anchors

- `.github/workflows/release-gate.yml`：`dependabot-alerts`（第 148 行起）与
  `sonarcloud-gate`（第 174 行起）两条 job 的放行条件。
- `docs/harness/AI_QUALITY_GOVERNANCE.md`：Quality Profile 与回归证据要求。
- `docs/designs/REPOSITORY_LAYOUT.md`：改动面仍在既有目录，无新增顶层目录。

## Scope

### In

- `backend/go.mod` / `backend/go.sum`：`coreos/go-oidc/v3 v3.9.0 → v3.21.0`，
  `go-jose/go-jose/v3 v3.0.5` 替换为 `go-jose/go-jose/v4 v4.1.6`（indirect）
- `backend/modules/auth/oidc/handler.go`：把 `TODO` 注释改写成不触发 `go:S1135` 的
  契约说明（语义不变，仍标注“会话接入待办归属”）
- `backend/pkg/database/notfound.go`：`TranslateNotFound(err error, replacement error)`
  → `TranslateNotFound(err, replacement error)`（`godre:S8209`）
- `backend/modules/system/iam/tenant_isolation_smoke_test.go`：把单个 11 段大测试拆成
  子测试表 + 11 个 `smoke*Isolation` 辅助函数（`go:S3776` 53 → 15 以下），每条断言原样保留
- `backend/pkg/tenant/scope_helper_test.go`：把表驱动循环里的渲染/断言提取为
  `assertScopeSQL` / `carriesUint64`（`go:S3776`）
- `frontend/src/modules/system/iam/tenant/TenantList.tsx`：五个
  `isAdmin || hasPerm('...')` 收敛到本地 `can(perm)`（`typescript:S3776` 16 → 15）
- 本任务包、manifest 与证据（commands.json / summary.md / review.md / pr-body.md）
- `.harness/STATUS.md`：登记主干门禁转绿的整改与实测读数

### Out

- 不改任何门禁规则、workflow、Sonar 配置或质量门（不降级、不 suppression、不加
  `// NOSONAR`、不改 `sonar.*` 参数）
- 不改租户隔离、data-scope、权限、审计等运行语义；不新增/删除接口、路由、i18n key
- 不为 go-jose/v3 写 vendor 补丁或 fork（v3 线无修复版，形态上不可能）
- 不切割 foundation release、不动 `VERSION`、`CHANGELOG.md`
- 不处理 `main` 上其余绿 job 的既有实现

## Expected Files

### Create

- `docs/harness/tasks/2026-10-28-release-gate-green.task.md`
- `.harness/tasks/2026-10-28-release-gate-green/manifest.json`
- `.harness/evidence/2026-10-28-release-gate-green/commands.json`
- `.harness/evidence/2026-10-28-release-gate-green/summary.md`
- `.harness/evidence/2026-10-28-release-gate-green/review.md`
- `.harness/evidence/2026-10-28-release-gate-green/pr-body.md`

### Modify

- `backend/go.mod`、`backend/go.sum`
- `backend/modules/auth/oidc/handler.go`
- `backend/pkg/database/notfound.go`
- `backend/modules/system/iam/tenant_isolation_smoke_test.go`
- `backend/pkg/tenant/scope_helper_test.go`
- `frontend/src/modules/system/iam/tenant/TenantList.tsx`
- `.harness/STATUS.md`

### Do Not Touch

- `.github/workflows/*`、`sonar-project.properties`、任何 Sonar/Dependabot 配置
- `backend/migrations/**`、`VERSION`、`CHANGELOG.md`
- `.harness/evidence/**` 中其他任务的历史证据
- `frontend/src/**` 中除 `TenantList.tsx` 以外的文件

## Implementation Notes

- go-oidc `v3.9.0` 的 `oidc` 包 API 在 `v3.21.0` 未破坏性变更（同 major）；升级后
  `backend/modules/auth/oidc` 编译通过，模块内无调用点需要改签名。
- go-jose 只在 `go.sum` 里以 `v4.1.6 // indirect` 出现，`go mod tidy` 后
  `go-jose/v3` 从 `go.mod` 与 `go.sum` 中完全消失；`govulncheck` 读数为 0。
- `tenant_isolation_smoke_test.go` 的拆分只做“同一订阅测试内的函数提取”：子测试名、
  断言顺序、固定 ID 与写读语义逐条不变；每个 helper 首行 `t.Helper()`，失败行号仍指向
  真正断言的 helper。
- `scope_helper_test.go` 的三个上下文（nil / compat / multi）仍是同一张表，只把
  SQL 渲染与断言移进 `assertScopeSQL`；`nil context 不得带 tenant_id 谓词` 的断言原样保留。
- `TenantList.tsx` 的 `can(perm)` 只在渲染期同步求值，五个权限布尔仍是稳定标量，
  因此 `loadMemberCandidates` 的 `useCallback` 依赖没有变化。
- 本机 `go test -race` 需要 `CGO_ENABLED=1` 且 `mingw64/bin` 在 `PATH` 上，否则
  `cgo.exe` 直接 exit 2；这是环境约束，不是代码问题。

## Verification Plan

- `gofmt -l` 对四个改动的 Go 文件 → 无输出
- `go vet ./modules/system/iam/ ./pkg/tenant ./pkg/database ./modules/auth/oidc/` → 干净
- `go build ./...` → 成功
- `CGO_ENABLED=1 go test -race -count=1 ./...` → 47 包 ok / 0 FAIL
- `go test -count=1 -run TestTwoTenantIsolationSmoke -v ./modules/system/iam/` → 本地无 DSN 时 SKIP（CI 有读数）
- `go run golang.org/x/vuln/cmd/govulncheck@latest ./...` → 0 vulnerability
- `go mod graph | grep go-jose` → 只剩 v4.1.6
- `cd frontend && npm run lint`、`npm run type-check`、`npm run build` → 全部通过
- `node scripts/harness/check-evidence.mjs --strict`、`check-review.mjs --strict` → exit 0
- `npm run check:task-packet`、`check:structure`、`check:harness-encoding`、
  `check:docs-frontmatter` → 全部 0 findings
- `git diff --stat` 证明改动面只含上述文件

## Linkage

- Task ID: `2026-10-28-release-gate-green`
- Task Manifest: `.harness/tasks/2026-10-28-release-gate-green/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `.github/workflows/release-gate.yml`、`docs/harness/AI_QUALITY_GOVERNANCE.md`
- Evidence Directory: `.harness/evidence/2026-10-28-release-gate-green/`
- Review File: `.harness/evidence/2026-10-28-release-gate-green/review.md`

## Evidence Required

- 依赖侧：`go.mod`/`go.sum` diff、`go mod graph` 的 go-jose 行、`govulncheck` 读数
- 测试侧：`go test -race ./...` 包级读数、冒烟测试本地 SKIP 原因、前端三条命令读数
- 静态检查侧：五个文件的整改前后说明（复杂度/签名/注释），无 suppression 的证明
- 治理侧：task-packet / structure / encoding / frontmatter / evidence / review 读数

## Human Gates

- 无新增决策门。依赖升级与 Sonar 整改都是门禁红灯的标准处置，规则未变；如需豁免或
  调门禁属维护者触点②，本包未触发。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] `go-jose/v3` 从 go.mod/go.sum 消失，`govulncheck` 0
- [x] 5 条 Sonar issue 全部整改，无 suppression
- [x] 后端 `-race` 全量绿、前端 lint/type-check/build 绿
- [x] 行为不变的证明：断言与渲染逻辑逐条对照
