## 变更摘要

- 改动层级：platform（harness 治理门禁与 evidence 回写）+ `system/i18n` 域（操作者追溯字段）+ database schema（版本化迁移 000019，及 000008/000012/000013 回放加固）+ frontend 测试面（smoke 重写、四主题视觉基线）+ docs（部署基线与状态回写）
- 改动模块：`backend/modules/system/i18n/*`（model/service/handler/export/helper + 新增 `i18n_updated_by_test.go`）、`backend/pkg/database/{migrate.go,migrate_test.go,migrations/000019_*,000008/000012/000013 加固}`、`database/system_init.sql`、`scripts/harness/check-generated.mjs` + `tests/scripts/harness-check-generated.test.mjs`、`frontend/tests/smoke-core/business-generated-basic.spec.ts`、`frontend/tests/visual/theme-baseline.spec.ts` + 4 张 win32 快照、`docs/DEPLOYMENT_GUIDE.md`、`fix-report.md`、`.harness/{CORE_SMOKE_TRIAGE,TASK_MASTER_PLAN,NAMING_AND_BOUNDARIES_REMEDIATION_PLAN_2026-09-22}.md`、`docs/designs/REPOSITORY_LAYOUT.{md,en.md}`、以及 5 个 packet 目录（4 个补建的 `2026-09-08-p2-*` + 本次 closeout）与其 5 套 evidence（含 `visual-acceptance.md` 签核档案与 `artifacts/visual-acceptance.html` 联系表）
- 目标问题：关闭 `fix-report.md` §四 五项人工介入（①边界阻断门禁复验核销 ②生产 `mfa_enabled=1` 部署基线 ③覆盖率门禁执行核销 ④四主题截图基线 ⑤`system_i18n` 无 `updated_by`）与 2026-09-22/23 轮记录的三个残余 gap（business smoke 选择器过时、`check-generated` 对动态生成物盲区、docs 索引复核）；同时补建 `TASK_MASTER_PLAN.md` 中四个从未生成 packet 的 P2 任务（coverage phase2/phase3、multi-tenant design、community）并落 evidence
- 预期影响：语言包动态写入带上操作者追溯（`updated_by` 列 + handler 从 token context 注入，客户端 `json "-"` 不可伪造）；生产 MFA 基线进入部署指南发布必检；四主题截图基线入库并已经维护者触点③签核；business smoke 的跳过判定由过时 DOM 选择器改为菜单树 API 事实判定；`check-generated --strict` 覆盖生成模块目录与 `schema/generated/<scope>/*.json`。**affected subgraph**：`system/i18n`（model/service/handler/export/helper）、`pkg/database`（migrate markers + 迁移 000008/12/13/19 + 回归测试）、`system_init.sql`、harness `check-generated` 及其 pin 测试、frontend smoke-core/visual specs、上述 docs 面；菜单/权限/接口授权与 `business/*` 运行时**零改动**；DDL 经既有 `RunMigrations` 通道，已在真实开发库回放至 `schema_migrations=19/0`

## Harness 链路

- Task ID：2026-09-24-fix-report-residual-closeout
- Task Manifest：.harness/tasks/2026-09-24-fix-report-residual-closeout/manifest.json
- Evidence：.harness/evidence/2026-09-24-fix-report-residual-closeout/commands.json
- Verification evidence：.harness/evidence/2026-09-24-fix-report-residual-closeout/summary.md
- Review Artifact：.harness/evidence/2026-09-24-fix-report-residual-closeout/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：ci-workflow
- Ratchet Decision：gate-updated
- GitHub Signal：repo-quality-gate

> 同批补建的 4 个 P2 记账 packet（`2026-09-08-p2-test-coverage-phase2`、`-multi-tenant-design`、`-community-building`、`-test-coverage-phase3`）各有独立 task/manifest/evidence，主链路统一指向本次 closeout。

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-09-24-fix-report-residual-closeout
- task manifest: .harness/tasks/2026-09-24-fix-report-residual-closeout/manifest.json
- evidence: .harness/evidence/2026-09-24-fix-report-residual-closeout/commands.json
- boundaries: cross-layer with declared boundaries - platform harness gates (check-generated extension), system/i18n audit-attribution field, database schema migration via the existing RunMigrations channel, frontend test specs, docs; no menu, permission, API-authorization or business/* runtime change
- backend response contract: system/i18n I18nResp gains the additive updatedBy field (json "updatedBy", non-breaking)
- backend DTO contract: I18nCreateReq/I18nUpdateReq gain server-injected updatedBy (json "-", filled from the token-middleware username, never from client input)
- permission contract: none
- audit coverage: system_i18n.updated_by written on Create/Update/Import/SyncMissingKeys; the operation-log middleware path is unchanged
- visual evidence: .harness/evidence/2026-09-24-fix-report-residual-closeout/visual-acceptance.md
- inheritance contract: none
- base drift: none
- Base/ops inheritance: none

## 边界说明

- [ ] 本次改动仅涉及单一层级
- [x] 本次改动涉及跨层，已说明边界与依赖

> 为什么跨层：fix-report §四.5 的追溯字段是"schema + 域模型 + handler 注入 + 迁移机制"的纵向切片，单层无法闭环。各层职责：**database** 只经既有 `RunMigrations` 通道加一列（guard 式 up/down，`currentRuntimeSchemaMarkers` 接入，`system_init.sql` parity）；**system/i18n** 只在既有 GORM 写路径上附带 `updated_by`，取值来自 token middleware 已写入的 `username`（与操作日志同源，`json "-"` 客户端不可提交）；**platform/harness** 只扩大 `check-generated` 的匹配集（发现式覆盖，不改产物本身）；**frontend** 只动测试面（1 个 smoke spec 重写 + 1 个新视觉 spec + 快照）。菜单、页面授权、操作授权、接口授权边界均未触碰；i18n 影响为纯新增字段（additive）；审计影响即新增列本身（操作日志中间件不变）。`business/*` 运行时零改动。

## 验证记录

- [x] 后端测试（touched scope，全量限制见补充说明）：全仓 `gofmt -l` / `go build ./...` / `go vet ./...` clean；DB-backed 定向跑绿：`go test ./pkg/database/` ok 13.4s（含 000019 回放、000008 跨 collation、000013 占位租户归一、dirty 修复 4 个回归）、`go test ./modules/system/i18n/` ok 121.3s（updated_by 四条写入路径）；`golangci-lint --new-from-rev=origin/main` 0 issues
- [x] 前端构建：`cd frontend && tsc -b && eslint . --max-warnings=0 && vite build` 全绿（等价 `npm run build`）
- [x] 轻量 smoke：`npm run test:smoke:core` 9 spec **26 passed / 3 skipped，RC=0**（含 platform-shell-critical 与 system user/menu/role/dept spec；business 3 skip 为环境无业务模块的确定性事实判定，见补充说明）
- [x] 如涉及系统域深链路，已补充专项 smoke：不适用（未触碰 IAM/authz 运行时；system 页面行为已由 smoke:core 覆盖）
- [x] 其他专项验证已补充：① 真实库迁移回放链——server 日志 `repaired dirty version=7` → `all migrations applied successfully` → SQL 断言 `schema_migrations 19/0`、`system_i18n.updated_by varchar(64)` 在列、占位租户归一到 `id=0`；② 四主题视觉基线 `--update-snapshots` 4 passed + 稳定复跑 4 passed；③ `check-generated --strict` 双向负探针（无标记生成文件 + 坏 schema JSON → 2 findings/13 artifacts exit 1，清理后 0 findings/11 exit 0）+ 其测试套 11 pass；④ `node --test tests/scripts/*.test.mjs` 129 pass；⑤ check:\* 全套——boundaries（strict+baseline，0 findings/0 stale）、generated、task-packet、structure（2039 文件）、doc-links、doc-inventory、encoding（1838 文件）、failure-registry、frontmatter（266 docs）、generated-modules --check 全绿；⑥ `check-coverage --threshold 50` 对两份真实 profile 分别 `OK: total coverage 56.0% / 58.3%`；⑦ duplication PASS、adoption --strict（实现文件 + 同批 manifest/evidence 配对）0 findings、method-health no findings、task-packet-template OK；⑧ docs 双语索引复核（`README.md:119-124`、`README.en.md:88-93` 各 6 条目齐，无需改）；⑨ check-evidence 196 / check-review 51 = 历史基线不变且本次新增 evidence 全 PASS
- [ ] CodeQL 结果已检查并解释：pending —— PR 创建后由 CodeQL（security.yml）执行，通过后回填；若出现 alert 将按新增 / 既有 baseline / 误报 / 已补 follow-up 分类说明
- [x] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁（本地未跑 full suite；smoke:core 属 smoke-core.yml 自有范围）
- [ ] GitHub required checks 通过：推送后由分支保护执行，结果回填
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用：按仓库策略处理，本会话记 unavailable（沿用 #343 先例记法）
- [x] 已启用或确认将启用 squash auto-merge：确认将启用——本 PR 为高风险改动，待两名非作者审批与 required checks 绿后由维护者启用，不预授权秒合

补充说明：① 分支拓扑——本分支 3 个提交，前 2 个（dormant-tests 系列）的内容已经 PR #343 squash 进 main，本 PR 的**净变更 = closeout 这 1 个提交**；三方合并时前 2 个提交与 main 侧内容一致，预期无冲突，diff 视图可能仍展示它们（merge-base 机制）。② 本地 `-race` 限制——本机系统 gcc 以 `-Werror` 编译 race cgo 失败、`.tmp` 无 MinGW 工具链，本地 `-race` 记为工具链 gap；quality.yml 的 backend-tests（`go test -race ./...`）在 CI Ubuntu 上覆盖该维度，全仓单次 `-coverprofile ./...` 亦因 600s 本机预算超时而改为分包执行（数字来自已产出的两份 profile，CI `check-coverage --threshold 50` 持续执法）。③ business smoke 3 skip——本地与 CI 库均无生成业务模块（`schema/generated/business` 空、无 dynamic-module 表），skip 判定已由 API 事实驱动并写进 triage 文档；跑到 UI 断言需环境预置业务模块，属独立 fixture 任务。

## 审核留痕

- Copilot review：unavailable（本会话无法触发请求，沿用 #343 先例记法；如仓库已启用 Copilot 自动评审将随 PR 自动触发）
- CodeQL 结果：pending —— PR 创建后执行，通过后回填
- GitHub checks 结果：推送后由分支保护判定；本地 repo-quality-gate 全绿（见验证记录）
- Auto-merge：not-enabled（高风险改动，待两名非作者审批 + checks 绿后由维护者启用，同 #343 先例）
- Duplication Gate 结果：PASS（`node scripts/check-duplication.mjs`，仅剩既有 smoke-core / smoke-full workflow 重复对）
- 是否高风险改动：是 —— 命中 `repo-pr-gate` 风险表的 shared `pkg/*`（迁移通道）+ schema DDL + `system/*` 审计追溯字段 + 生成器产物门禁；**需至少两名非作者审批，其中一名为域 / 安全 / 架构责任人**
- Residual risk / follow-up：① 四个人工 gate 保持 deferred（G2 恢复演练 DBA、生产 G3 sizing、v0.12.0 发布、state file 勾选），四主题视觉基线的最终验收已于 2026-09-24 在触点③签核通过（`visual-acceptance.md`）；② 四主题快照为 win32 平台，其他平台复跑需 `--update-snapshots` 重建；③ business smoke 3 用例依赖环境存在业务模块（本地/CI 均无，诚实 skip）；④ `updated_by` 不覆盖系统源填充路径（FillMissingLocales/HydrateBuiltinLocales）与 CSV 导出，记为 packet technicalDebtNote；⑤ 本地 `-race` 工具链 gap 由 CI quality backend-tests 覆盖；⑥ 覆盖率数字为 2026-09-24 本地快照，持续执法在 `ci.yml:431`；⑦ generator 包 26.3% 为 phase-3 packet 记名 residual；⑧ `.harness/tasks/<id>/task.md` 目录式 packet 不在 `check-task-packet` 扫描面（既有布局分裂，119 个文件一致，非本 PR 引入）

## 检查清单

- [x] 已明确本次改动归属：platform（harness 治理 / 迁移通道）与 `system/i18n` 域（清单枚举外的子域，已在边界说明中显式声明）
- [x] 未把认证、IAM、组织、配置等系统域职责混写（auth/iam/org/config 均未触碰）
- [x] 前端新增展示文案已使用 i18n：不适用（无新增 UI 文案；新视觉 spec 使用既有中文文案断言）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰（未触碰）
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（DDL：000019 up/down + `system_init.sql` parity + migrate markers 注释；`REPOSITORY_LAYOUT` §7 双语同步；`DEPLOYMENT_GUIDE` MFA 基线；fix-report / TASK_MASTER_PLAN / CORE_SMOKE_TRIAGE 状态回写）
- [x] 已确认不会泄露敏感配置、账号密码或 Token（提交前对 staged diff 扫描已知开发凭证无命中；`.env.test` 保持 gitignored，evidence 只引用其存在不引用其内容）
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
