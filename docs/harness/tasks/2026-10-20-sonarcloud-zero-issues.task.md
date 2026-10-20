---
title: SonarCloud 未处理问题清零与租户控制台菜单播种任务包
doc_type: Remediation
layer: platform
depends_on_layers:
  - system/iam
  - system/auth
  - system/config
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/TENANT_CONTRACT_V1.md
  - docs/contracts/DOCUMENT_GOVERNANCE_CONTRACT.md
updated_at: 2026-10-20
---

# Task Packet: 2026-10-20-sonarcloud-zero-issues

## Goal

让主干 SonarCloud 恢复绿，并同时关闭 GitHub Security 页签上仍然开放的告警。

主干 `f6579ad8` 的质量门禁是 `ERROR`，唯一失败条件是 `new_security_rating = 3.0`；
同时 `release-gate.yml` 的 `sonarcloud-gate` 要求**未处理问题总数为 0**，而当时是 32 条
（1 条漏洞 + 31 条 code smell）。两件事必须一起做：修掉那条把安全评级打到 C 的 S2068，
并把其余 31 条一并清零，否则发布门禁仍然红。

同一轮里还有一个真实回归：`Tenant Smoke (multi-mode advisory)` 自整改合并后每次都失败。
根因是租户开通只写了角色与 Casbin 策略，没有写 `system_role_menu`，于是新租户登录后侧边栏为空。
这条必须在同一个 PR 里修，否则候选提交的检查仍然不绿。

## Primary Layer

platform

改动分布在 `backend/internal/middleware`（测试脚手架）、`modules/system/iam/{tenant,user,permission}`、
`modules/auth/{login,security}`、`modules/system/i18n`、`pkg/contracts/authuser` 与 `frontend/src`。
判定权都在 platform 层：本包改的是**代码结构、可读性与凭据处理方式**，不改变任何业务规则，
唯一的行为改动是租户开通补写菜单授权。

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `not-required`
- Release Requirement: `none`

## Dependency Layers

- `platform`：全部实现改动点（后端结构重构、前端组件、smoke 夹具、安全文档）。
- `system/iam`：租户开通补写菜单授权，是本包唯一的行为改动。
- `system/auth`：登录/安全服务只做字面量与复杂度重构，语义不变。
- 仓库治理：`.github/workflows/release-gate.yml` 的 SonarCloud 门禁与 GitHub Security 页签的告警状态。

## Harness Profile

- Template: admin-platform
- Overlay: pantheon-base
- Quality Profile: ci-workflow
- Portable Failure Class: `ci-signal-noise`
- Owner Layer: consumer-repository
- Ratchet Decision: no-repeat-observed（同一类「存量异味因文件重写被重新判为新代码」已第二次出现，
  本次改为整包清零并在 evidence 里记录规则 → 修法映射，后续同类问题按映射表处理）
- Coverage Dimensions:
  - maintainability
  - behaviour
  - method-health

## Contract Anchors

- `AGENTS.md`、`DESIGN.md`、`docs/README.md`
- `docs/contracts/PLATFORM_CONTRACT.md`、`docs/contracts/TENANT_CONTRACT_V1.md`
- `.github/workflows/release-gate.yml`（SonarCloud 门禁：质量门禁为绿 + 未处理问题为 0）
- `.sonarcloud.properties`（分析范围：tests 全量分析，`frontend/scripts/**` 排除）
- `SECURITY.md`、`SECURITY.en.md`（GitHub Security 页签的策略入口）
- `docs/GITHUB_GOVERNANCE_CHECKLIST.md`（安全入口与告警处置规则）

## Scope

### In

- 后端 9 条 `go:S1192`：`token.invalid`、`created_at desc, id desc`、`system.tenant`、
  `tenant_id = ?`、`role_id = ?`、`id = ?`、`id <> ?`、`status = ?` 收进包级常量。
- 后端 3 条 `go:S3776`：`GetCurrentTenant`（16）、F10 数据范围测试（16）、
  `provisionTenantRoleBindings`（26）拆成单一职责的辅助函数。
- 后端 1 条 `go:S107`：`runTenantScopeRequest` 的 8 个参数折成 `tenantScopeRequest`。
- 后端 1 条 `go:S1135`：`dashboard_service.go` 注释里的 "todo list" 改为 "task list"。
- 后端 2 条 `godre:S8193`：去掉只用于一次比较的临时变量。
- 后端 1 条 `godre:S8196`：单方法接口改名为 `TenantUserFinder`，保留 `TenantScopedRepository`
  作为 deprecated 别名，下游仓库不需要改代码。
- 前端 1 条 `typescript:S2068`：smoke 租户管理员口令改为按运行生成，不再入库明文。
- 前端 6 条 `typescript:S9382`：夹具里的顺序 await 改为相互独立的 `Promise.all` 批次。
- 前端 2 条 `typescript:S3358`：`TenantList` 的嵌套三元改为顺序条件链。
- 前端 3 条 `typescript:S6759`：组件 props 标记为 `Readonly`。
- 前端 1 条 `typescript:S6819`：viewpoint banner 用 `<output>` 取代 `role="status"`。
- 前端 1 条 `typescript:S5843`：Go 零值时间正则拆成两条更简单的表达式。
- 前端 1 条 `typescript:S3776`：`submitForm` 的载荷构造与成员补写抽成模块级函数。
- 租户开通：`provisionTenantRoleMenus` 为新租户的 `tenant_admin` 播种可见菜单授权（除 `system.tenant`）。
- GitHub Security：开启 private vulnerability reporting，按 `used in tests` 关闭 5 条
  `js/file-access-to-http` 告警并留痕，`SECURITY{,.en}.md` 与治理清单补安全入口与处置规则。

### Out

- 不改 `.sonarcloud.properties`：不靠排除文件把问题藏起来。
- 不通过 SonarCloud API 批量标记 `won't fix`：`SONAR_TOKEN` 只存在于仓库 secret，本机不可用，
  且批量标记属于掩盖问题而非修复。
- 不改 `release-gate.yml` 的门禁条件。
- 不调整租户菜单树的全局模型（`system_menu` 仍无租户维度）。
- 不恢复 v0.17.0 发布包：发布动作由维护者另行决定。

## Expected Files

### Create

- `.harness/tasks/2026-10-20-sonarcloud-zero-issues/manifest.json`
- `.harness/evidence/2026-10-20-sonarcloud-zero-issues/{commands.json,summary.md,review.md}`
- `docs/harness/tasks/2026-10-20-sonarcloud-zero-issues.task.md`
- `backend/modules/system/iam/tenant/tenant_provision_menus_test.go`

### Modify

- `backend/internal/middleware/{data_scope_tenant_test.go,tenant_platform_scope_test.go}`
- `backend/modules/auth/login/{login_handler.go,login_service.go,login_tenant_switch.go}`
- `backend/modules/auth/security/security_service.go`
- `backend/modules/platform/dashboard_service.go`
- `backend/modules/system/i18n/{i18n_seed.go,seed_data.go}`
- `backend/modules/system/iam/permission/{permission_data_scope.go,permission_data_scope_tenant_test.go}`
- `backend/modules/system/iam/tenant/{tenant_provision.go,tenant_service.go,tenant_service_test.go}`
- `backend/modules/system/iam/user/{auth_repository.go,auth_repository_test.go,user_helper.go}`
- `backend/pkg/contracts/authuser/authuser.go`
- `frontend/src/core/format/dateTime.ts`
- `frontend/src/modules/auth/tenant/{TenantSwitcher.tsx,TenantViewpointSwitcher.tsx}`
- `frontend/src/modules/system/iam/{tenant/TenantList.tsx,user/useUserList.ts}`
- `frontend/tests/smoke-core/tenant-fixture.ts`
- `SECURITY.md`、`SECURITY.en.md`、`docs/GITHUB_GOVERNANCE_CHECKLIST{,.en}.md`

### Do Not Touch

- `.github/workflows/**`、`.sonarcloud.properties`、`release-gate.yml`。
- `backend/pkg/database/migrations/**`：本包没有 schema 改动。
- `.harness/archive/**` 与历史 evidence 目录。
- v0.17.0 发布包与 `RELEASE_NOTES_v0.17.0.md`（发布已暂停）。

## Implementation Notes

- S2068 的根因是「口令字面量入库」。只把字面量换成 `env ?? 字面量` 不够——Sonar 仍然看到常量口令，
  这正是上一轮修复后问题只是换了行号的原因。本包改为按运行生成（`randomBytes`），
  并把生成值写进夹具清单，使 spec 与 teardown 读到同一个口令。
- S9382 的 6 处是**独立**的 await：两个租户互不依赖、成员删除互不依赖，因此可以并行；
  这与 `2026-10-11-sonar-smoke-helper-smells` 里「删除顺序刻意串行」的结论不冲突。
- `provisionTenantRoleBindings` 只拆分不改变顺序：先读平台 admin 的角色权限与菜单，再按角色逐个补写，
  幂等性依赖「先读已存在集合再跳过」，拆分后该语义逐字保留。
- 租户菜单播种刻意排除 `module = 'system.tenant'`：租户管理员不应看到平台级的租户管理入口。
- 接口改名保留别名，是为了不让下游仓库在本轮被迫同步；别名标注 deprecated，下个大版本移除。

## Structural Scope

- Affected Subgraph: `tenant provisioning -> system_role_menu -> navigation resolver -> tenant console`
- Boundary Crossings: 有。租户开通（`system/iam`）写的是导航授权，而导航解析在 middleware 与菜单服务，
  跨了 `system/iam` 与 `platform`；两侧职责不变，只是补上了缺失的写入端。
- Risk Nodes: 租户菜单播种若范围过宽会把平台入口暴露给租户；因此用 `is_visible = 1`、
  `type <> 'F'`、`module <> 'system.tenant'` 三重条件收窄，并有测试断言。
- Graph Focus: 门禁恢复与「不掩盖问题」之间的取舍。

## Execution Roles

- Implementer Posture: 逐条异味逐条修，每条都保持行为不变；唯一的行为改动（菜单播种）单独说明并加测试。
- Reviewer Posture: 复核拆分前后语义等价、租户菜单范围是否过宽、S2068 是否真的不再有常量口令、
  以及 `TenantScopedRepository` 别名是否仍可用。
- 实现前先读 `.github/workflows/release-gate.yml` 与 SonarCloud issues API 的实际输出。

## Dependency Plan

| Wave | 优先级 | 工作项 | 依赖 | 关闭条件 |
| --- | --- | --- | --- | --- |
| 0 | P0 | 用 issues API 定位 32 条问题，确认 `new_security_rating` 的唯一失败条件 | 无 | 32 条全部定位到文件与规则，门禁失败条件有 API 证据 |
| 1 | P0 | 后端 17 条 + 前端 15 条逐条修复，本地 build/vet/lint/test 全绿 | Wave 0 | `go build`/`go vet`/`golangci-lint --new-from-rev` 与 `tsc`/`eslint`/`vitest` 全绿 |
| 2 | P0 | 租户菜单播种 + 回归测试 | Wave 1 | `go test ./modules/system/iam/tenant/` 绿，新增两条用例覆盖播种与幂等 |
| 3 | P1 | GitHub Security 告警处置与文档同步 | Wave 1 | 开放告警为 0，`SECURITY{,.en}.md` 与治理清单记录处置规则 |
| 4 | P1 | 任务包 + PR + CI 实跑 | Wave 2、3 | 主干 SonarCloud 重分析 `resolved=false` 为 0，Release Gate 恢复绿 |

## Verification Plan

- Static: `cd backend && go build ./... && go vet ./...`；
  `golangci-lint run --new-from-rev=origin/main ./...`。
- Unit: `go test -count=1` 覆盖 middleware / login / security / i18n / permission / tenant / user / platform / contracts。
- Frontend: `npx tsc -b`、`npx eslint <changed files>`、`npx vitest run`（24 files / 193 tests）。
- Repo gates: `npm run check:docs-frontmatter`、`check:structure`、`check:harness-encoding`、`check:task-packet`。
- GitHub: `code-scanning/alerts?state=open` 为 0；`private-vulnerability-reporting` 为 enabled。
- Sonar evidence: 改前 `resolved=false` 总数 32 与门禁条件（API 输出）作为基线；
  改后以主干重分析结果为准，本地无法复现 Sonar 的判定。

## Evidence Required

- `.harness/evidence/2026-10-20-sonarcloud-zero-issues/commands.json`：每条命令的目录、状态与真实输出摘要。
- `summary.md`：规则 → 数量 → 修法映射，唯一行为改动的说明，残余风险。
- `review.md`：结论与复核要点，含「SonarCloud 重分析只能由 CI 给出」与「本机不能跑 Playwright」的显式声明。
- 静态推断与运行复现分别标记；本机未执行的项目不得写成已通过。

## Human Gates

- 是否接受 `TenantScopedRepository` 作为 deprecated 别名长期存在（而不是立即删除）由维护者决定；
  本包选择兼容，避免下游仓库被迫同步。
- 是否把 31 条 code smell 视为必须清零（而不是调整 `release-gate.yml` 的判定口径）属治理决定；
  本包按现行门禁执行。
- v0.17.0 发布是否继续，不在本包范围内。

## Linkage

- Task ID: `2026-10-20-sonarcloud-zero-issues`
- Task Manifest: `.harness/tasks/2026-10-20-sonarcloud-zero-issues/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Evidence Directory: `.harness/evidence/2026-10-20-sonarcloud-zero-issues/`
- Review File: `.harness/evidence/2026-10-20-sonarcloud-zero-issues/review.md`
- Plan References: `.github/workflows/release-gate.yml`、`.sonarcloud.properties`、`SECURITY.md`
- Assessment: `docs/harness/tasks/2026-10-20-sonarcloud-zero-issues.task.md`

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] 后端 17 条（S1192 ×9、S3776 ×3、S107、S1135、S8193 ×2、S8196）修复
- [x] 前端 15 条（S2068、S9382 ×6、S3358 ×2、S6759 ×3、S6819、S5843、S3776）修复
- [x] 租户开通补写菜单授权，并覆盖「首次播种」与「重复开通幂等」两条用例
- [x] GitHub 开放 code scanning 告警为 0，private vulnerability reporting 已开启
- [x] `SECURITY{,.en}.md` 与治理清单记录安全入口与告警处置规则
- [ ] CI 实跑确认：主干 SonarCloud 重分析 `resolved=false` 为 0，Release Gate 恢复绿
