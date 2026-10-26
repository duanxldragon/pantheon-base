---
title: PR #427 托管门禁收口：Go Lint、Sonar 新代码、L2 冒烟定位器与 CodeQL 评审评论
doc_type: Remediation
layer: system/iam
depends_on_layers:
  - app
  - platform
status: Active
linked_contracts:
  - docs/contracts/TENANT_CONTRACT_V1.md
  - docs/harness/VERIFICATION_EVIDENCE_SPEC.md
  - docs/README.md
updated_at: 2026-10-26
---

# Task Packet: 2026-10-26-pr427-ci-gate-closure

## Goal

PR #427（`feat/tenant-ops-governance-closeout-2026-10-26`）把租户运营轮与治理收口轮的改动送上去后，
托管链在 head `e4a70094` 上给出 4 类红灯；收口过程中又暴露出第 5 类由本分支自身改动引入的冒烟回归。
本轮把它们逐个按门禁自己的判定口径收掉，目标是「同一 head 的重跑变绿」，不是「让红灯消失」：

1. **Code Lint / P2** `Go Lint`（`quality.yml` 的 golangci-lint 步骤）报 5 条 finding：
   `tenant.TenantPlan` 的 revive stutter、goconst 对重复 GORM 谓词字面量的要求、
   未使用的 `quotaLimitOrUnlimited`、`req.PlanQuotaReq` 冗余限定名。
2. **SonarCloud / P2** PR 分析 10 条未解决问题 + New Code 重复率 3.62%（阈值 3%，198/5462 行）：
   `gosecurity:S3649`（BLOCKER，plan 更新落库）、`go:S1192`（4 处 SQL/条件字面量重复）、
   `go:S3776` 与 `ts:S3776`（认知复杂度）、`ts:S3358`（嵌套三元）。
   重复率的 160/198 行来自两个租户运营页面各自抄了一份表格外壳与状态分支。
3. **Runtime / P2** `PR Smoke Modules`（L2，路径驱动、blocking）2 个用例红：
   `system-config.spec.ts` 的 `getByLabel('Password')` 与 `getByLabel(/密码|Password/)`
   命中 2 个元素（strict mode violation）。
4. **Feedback gate / P2** `Pull Request Automation > GitHub Feedback Prereq` 红：
   CodeQL 在 PR 上留下可执行评审评论（`#discussion_r4375038750`，
   `frontend/scripts/tenant-matrix-fixture-setup.mjs:121`，规则 `js/file-access-to-http`），
   `fetch-github-feedback.mjs --check` 对未关闭的 pull-request-review 默认判 `actionable-change` 并 `BLOCKED`。
5. **Runtime / P2（CI-08，本分支自引入）** 同一 job 的下一批红：3 个冒烟夹具 POST
   `/system/permission` 得到 `400`。根因是本分支新增的角色保存策略同步
   （`backend/modules/system/iam/role/role_policy_sync.go`，由 `role_service.go:370/455` 调用）
   已经按绑定表授予同一条 `(roleKey, path, method)`，`ensurePolicyUnique` 于是返回
   `common.NewConflict("permission.policy.exists")`，而 `pkg/common/error.go` 的 `CodeForError`
   没有 409 哨兵、把冲突映射为 `CodeParamInvalid`（400）。同类回归还有
   `permission-workbench-remediation-real.spec.ts`：同步之后角色已无缺口，
   `governanceStatus` 不再是 `pending`，整改用例失去它要练的那道空。

收口标准：同一 head 重跑后 `Go Lint`、`Backend Tests`、`Duplication Gate`、`PR Smoke Modules`、
`Quality Gates`、`SonarCloud Code Analysis` 与 `GitHub Feedback Prereq` 全部为 success，
且本地全链治理矩阵仍为绿。

## Primary Layer

system/iam

改动主体是租户运营域的 plan/ops 读视图、role 策略同步与三个前端页面；CI-08 的根因也在
`system/iam`（role 保存 → Casbin 策略同步 → permission 冲突判定）。

## Dependency Layers

- `app`：前端组件抽取（表格外壳、状态分支、单元格渲染）与 `tsc -b` / `eslint --max-warnings 0` 口径。
- `platform`：`docs/contracts/TENANT_CONTRACT_V1*.md` 的类型名回写；`frontend/scripts` 冒烟夹具与
  `.github/workflows/quality.yml` 的门禁口径属工程化面。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `governance-evidence-integrity`
- Portable Failure Class: `hosted-gate-drift`
- Owner Layer: `consumer-repository`
- Ratchet Decision: `code-repaired`（五类红全部由改代码或沿用仓库既有处置定案收掉，未动任何门禁本体）
- Coverage Dimensions:
  - behaviour
  - runtime-quality
  - method-health
  - maintainability

## Contract Anchors

- `docs/contracts/TENANT_CONTRACT_V1.md` / `.en.md`：`tenant.Plan` 改名后两份文档同步回写，
  契约里的类型名与后端导出名必须一致。
- `backend/.golangci.yml` + `.github/workflows/quality.yml`：CI 用 `golangci-lint run --new-from-rev=main ./...`，
  因此门禁证据只有这一种口径；裸 `go test`/裸 lint 的读数不能当作门禁结论。
- `backend/pkg/common/error.go` `CodeForError`：注释写明信封没有 409 哨兵，冲突落到 `CodeParamInvalid`（400），
  所以 400 本身不含信息，只有 body `message` 能区分 `permission.policy.exists` 与真正的参数错误。
- `backend/modules/system/iam/permission/permission_workbench.go:624-654`：
  `requiredAPIRoutesByPermission` 是「权限键 → 必需 API 路由」的唯一绑定表，
  角色同步与工作台缺口判定共用它，这决定了夹具重复授权不可避免。
- `SECURITY.md` §GitHub Security Surfaces：CodeQL 告警「修复，或带理由关闭」；
  告警 90–94 已对同一 `js/file-access-to-http` 实例族记录 `used in tests`。
- `docs/harness/VERIFICATION_EVIDENCE_SPEC.md`：runtime-sensitive 轮的证据必须给出逐条命令读数，
  且新用例要做回退差分自证。

## Scope

### In

- 上述 5 类红的**代码级**修复：改名、提取常量/辅助函数、拆分复杂函数、抽取共享组件、修正测试定位器、
  让夹具接受「已由角色保存同步到位」的授权、整改用例先撤销已同步策略再断言缺口。
- `gosecurity:S3649` 与 `js/file-access-to-http` 两条按仓库既有定案处置：
  前者沿用行尾 `// NOSONAR gosecurity:S3649` 抑制（`tenant_service.go:871/886` 的先例），
  后者沿用「test-only fixture → 以 `used in tests` 关闭」的先例（告警 90–94），把告警 95、96 同样关闭。
- 本轮证据工件与 PR body 的 CI 回填字段。

### Out

- 不改任何 linter/checker 的规则、阈值、扫描集或启用列表；不新增基线条目；不屏蔽或删除失败用例。
- 不改 Sonar 的 Quality Gate 定义或规则配置。
- 不把 `POST /system/permission` 改成幂等 upsert：冲突提示是权限页表单依赖的真实行为。
- 不动写侧商业化语义（套餐只展示不强制仍是 V1.5 的边界）。
- 不改上一轮为可访问性引入的密码可见性切换按钮标签。
- 不为 `check:evidence` / `check:review` / `check-runtime-evidence` / `check-inheritance-contract`
  增补 npm script 或 CI 接入（FR-016/FR-017 属维护者的门禁策略决定）。

## Expected Files

### Create

- `docs/harness/tasks/2026-10-26-pr427-ci-gate-closure.task.md`
- `.harness/tasks/2026-10-26-pr427-ci-gate-closure/manifest.json`
- `.harness/evidence/2026-10-26-pr427-ci-gate-closure/commands.json`
- `.harness/evidence/2026-10-26-pr427-ci-gate-closure/review.md`
- `.harness/evidence/2026-10-26-pr427-ci-gate-closure/summary.md`
- `frontend/src/modules/system/iam/tenant/tenantListCells.tsx`
- `frontend/src/modules/system/iam/tenant/TenantListParts.tsx`

### Modify

- `backend/modules/system/iam/tenant/tenant_plan_model.go`、`tenant_plan_store.go`、`tenant_ops_view.go`、
  `tenant_production.go`、`tenant_service.go` 及其三个测试文件
- `backend/modules/system/iam/role/role_policy_sync.go`、`backend/modules/system/iam/user/user_helper.go`、
  `backend/modules/system/seed.go`
- `docs/contracts/TENANT_CONTRACT_V1.md`、`docs/contracts/TENANT_CONTRACT_V1.en.md`
- `frontend/src/modules/system/iam/tenant/TenantOverview.tsx`、`TenantMemberList.tsx`、`QuotaRatio.tsx`、
  `frontend/src/modules/lowcode/generator/pages/ModuleWizard.tsx`
- `frontend/tests/smoke/system/system-config.spec.ts`、`frontend/tests/smoke/system/system-pages-helpers.ts`、
  `frontend/tests/smoke/platform/system-secondary-route-permission.spec.ts`、
  `frontend/tests/smoke/system/governance/permission-workbench-remediation-real.spec.ts`、
  `frontend/tests/smoke-core/tenant-viewpoint-switcher.spec.ts`

### Do Not Touch

- `backend/.golangci.yml`、Sonar 规则/Quality Gate 定义、`.github/workflows/quality.yml` 的阈值与启用列表。
- 任何历史轮次 `commands.json` 的 `commands[].status` 与散文结论。
- `2026-10-26-login-accessibility-and-lang` 引入的密码可见性切换按钮可访问名称。

## Implementation Notes

- 四类托管红各有自己的事实源：linter 配置、Sonar 的 PR 度量、Playwright strict mode、评审线程分类器。
  只有后两类需要判断——S3649 的抑制要挪到 Sonar 真正上报的那一行；冒烟要在「回退上一轮的可访问性修复」
  和「让测试选中字段本身」之间选，两处都选了保留前者决定的那条路。
- CI-08 是二阶回归：本分支新增的角色保存策略同步会按绑定表授予权限键声明的 API 路由，
  于是三个仍在手工 POST 同一条策略的冒烟夹具拿到 `permission.policy.exists`（信封码 400）。
  冲突是产品真实行为、权限页表单依赖它，所以改的是夹具（只容忍 `permission.policy.exists`，
  其它 message 仍然红）而不是端口语义。
- 整改用例的处理不同：它需要的是一个真实缺口，因此先用 `DELETE /system/permission/:id` 撤销同步来的那条策略，
  再断言 `pending` / `missingApiPolicyCount = 1`。`expect(row).toBeTruthy()` 同时是「角色保存确实同步了该路由」的断言。
- 回退差分自证：撤掉 `dropPolicy` 调用后同一用例在 `before.governanceStatus` 处失败（`pending` → 已同步状态），
  装回来即通过——证明修复针对的是真实根因，不是把断言改松。
- `Duplication Gate` 的 3.6% 里 160/198 行来自两个租户页面各抄一份表格外壳；抽取后同一对文件实测 46/5614 = 0.82%。
- 首轮推送后 Sonar 仍留 2 条：BLOCKER 未清是因为 NOSONAR 落在多行语句的收尾括号行，而 Sonar 上报语句首行——
  把 update map 提成变量让抑制和上报同处一行；另一条是抽取自身引入的 `typescript:S6759`（props 未标 `Readonly`）。

## Verification Plan

- `cd backend && PATH='D:\Go\bin;…' golangci-lint run --new-from-rev=main ./...` → `0 issues`，退出码 0。
- `cd backend && go build ./... && go vet ./modules/system/... && gofmt -l .` → 无输出。
- `cd backend && PANTHEON_TEST_DSN_REQUIRED=1 go test ./modules/system/...` → 全部 `ok`，不允许 SKIP 蒙过。
- `cd frontend && node node_modules/typescript/bin/tsc -b`、
  `node node_modules/eslint/bin/eslint.js src tests --max-warnings 0` → 无输出。
- `cd frontend && node node_modules/@playwright/test/cli.js test --config playwright.config.ts
  tests/smoke/system/governance/permission-workbench-remediation-real.spec.ts` → 1 passed；
  同命令移除 `dropPolicy` 调用 → 1 failed（回退差分）。
- Sonar 口径：`api/issues/search?...&pullRequest=427&resolved=false` → 0 条；
  `api/measures/component_tree` 的 `new_duplicated_lines / new_lines` < 3%。
- `node scripts/fetch-github-feedback.mjs --check --repo duanxldragon/pantheon-base --pr 427` → 退出码 0。
- 托管链：`Code Quality Gates` / `Pull Request Automation` 同一 head 重跑全 success。
- 治理矩阵：`node frontend/.tmp/gov-matrix.mjs`（24 个 strict 检查器）全 rc=0。

## Linkage

- Task ID: `2026-10-26-pr427-ci-gate-closure`
- Task Manifest: `.harness/tasks/2026-10-26-pr427-ci-gate-closure/manifest.json`
- Evidence Directory: `.harness/evidence/2026-10-26-pr427-ci-gate-closure/`
- Review File: `.harness/evidence/2026-10-26-pr427-ci-gate-closure/review.md`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/contracts/TENANT_CONTRACT_V1.md`、`docs/harness/tasks/2026-10-26-tenant-plan-assignment.task.md`、
  `docs/harness/tasks/2026-10-26-login-accessibility-and-lang.task.md`

## Evidence Required

- `golangci-lint --new-from-rev=main` 的 `0 issues` 与裸 `run ./...` 的 73 条同时登记，避免把 0 读成「全仓干净」。
- `PANTHEON_TEST_DSN_REQUIRED=1` 下 `./modules/system/...` 的逐包 `ok`，证明没有 skip 蒙过。
- 整改用例的正反两次 Playwright 读数（通过 / 移除 `dropPolicy` 后失败的具体断言行）。
- Sonar PR 未解决问题计数（10 → 2 → 0）与 new-code 重复率（3.62% → 0.82%）。
- 同一 head 的托管 job 结论（`Go Lint`、`Backend Tests`、`Duplication Gate`、`PR Smoke Modules`、
  `SonarCloud Code Analysis`、`GitHub Feedback Prereq`）。

## Human Gates

- 把未接入 CI 的 3 个 checker（`check-runtime-evidence`、`check-inheritance-contract`、裸 `--strict` 的
  `check-boundaries`）接入强制集合，属门禁策略变更，留给维护者（FR-016/FR-017 仍 open）。
- `quality.yml` 里 golangci-lint 步骤 `continue-on-error: true` 使步骤结论恒为 success、真正的红灯在
  `Enforce go-lint gate`（CI-06）。改法属门禁表达，本轮只登记事实。
- 若维护者认为 `POST /system/permission` 应当幂等，则夹具容忍可以撤回；本轮选择不动端口语义。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
