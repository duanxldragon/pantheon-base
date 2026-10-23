# Pantheon Base - Harness 任务状态

**最后更新**: 2026-10-23
**当前版本**: v0.17.3 已发布（2026-10-23T07:46Z，tag `pantheon-base-v0.17.3` → `1b74dccb`）

## v0.17.3 发布（2026-10-23）

v0.17.2 发布后复核的 R-1…R-5 已随 PR #414 合入主干（`933ffddd`），发布材料随 PR #415 合入
（`1b74dccb`）。本发布把修正后的门禁与证据
装进下一份可消费资产，任务包 `2026-10-23-v0173-release-closeout`，证据在
`.harness/evidence/2026-10-23-v0173-release-closeout/`。

- **发布凭据门禁（R-1）**：`check-release-secrets.mjs` 现在同时扫描 `bundle/` 与 `repo.tar`，
  快照缺失即失败关闭；新增 `.harness/archive/.../commands.json` 残留、干净快照、缺失快照三条回归用例。
  规则集与脱敏方式不变。
- **证据勘误（R-2/R-3/R-5）**：v0.17.2 证据中三处与代码不符的表述以勘误修正并保留原始声明；
  `STATUS` 记录已发布 tag；删除 `GetTenantByID` 重复注释行。
- **烟测稳定化（R-4）**：窄视口租户选择器等待 Arco 弹层与触发器对齐后再测量溢出，断言与边界不变。
- **FR-015**：失败登记表记录发布门禁覆盖缺口及其 sensor。
- **范围**：无运行时行为变更（后端仅一行注释差异）、无 schema 变更（仍为 29）、
  无路由/权限码/菜单/错误信封变化；`sharedPaths` 仍为 52。
- **发布门禁**：合并提交上的 `Release Gate Summary` 必须 success；打标前跑扩展后的凭据预检；
  发布后由 `Foundation Release Verify` 与 `check-release-assets` 断言四件资产。
- **发布事实（2026-10-23T07:46Z）**：annotated tag `pantheon-base-v0.17.3`（对象 `e0b0ee07`）指向
  `1b74dccb`；GitHub Release 非 draft / 非 prerelease，四件资产齐全。
  - 打标前凭据预检：`clean (3087 files scanned)`，`bundle/` 与 `repo.tar` 都已打开。
  - `foundation-release-pantheon-base-v0.17.3.tgz` sha256 `1c55c8509d28…d8266342`
  - `repo.tar` sha256 `af3f5dfed182…a32e77f9`
  - `check-release-assets`：本地 bundle 与远端四件资产一致；`Foundation Release Verify`
    （run `39920022781`）success。

## 残余项收口（2026-10-23，v0.17.2）

v0.17.1 显式登记了 5 项残余。本轮逐项关闭，其中两项**实测即失败**，因此是修缺陷而不是改标注。
任务包 `2026-10-23-residual-closeout`，证据在 `.harness/evidence/2026-10-23-residual-closeout/`。

- **并发 provisioning 死锁（原 P2-9，"未验证"）**：`copyPlatformSettingsToTenant` /
  `copyPlatformDictsToTenant` 用 `INSERT ... SELECT` 读同一张表，MySQL 对读到的行加共享 next-key 锁，
  与并发复制方的插入意向锁互斥 → 两个租户同时创建报 `Error 1213 (40001): Deadlock found`，调用方看到 500。
  改为「非锁定读 + 插入」。`TestConcurrentProvisioningKeepsTenantResourcesIsolated` 在旧代码上以该错误失败，
  新代码连续 8 轮通过；断言的是归属与互斥（角色/成员/根部门/管理员/复制设置各归其租户），不是错误码。
- **同 code 竞态的 500**：预检非原子，UNIQUE 索引才是仲裁者，loser 原先拿到
  `500 create tenant: Error 1062 ... Duplicate entry`。新增 `pkg/database.IsDuplicateKey`，
  `CreateTenant` 回读占用行，返回与预检一致的 `tenant.code.exists` / `tenant.code.reserved`。
- **墓碑可被复活（补写合同 V1.3 时发现）**：`tenantStatusTransitionAllowed` 对未知当前状态走
  `default: return true`，`GetTenantByID` 又不过滤墓碑，于是 `PUT {"status":"active"}` 能把已删除租户
  复活，且带着删除时写入的 `__deleted_tenant_<id>` 合成编码（不满足合同 `code` 正则）、成员仍是停用。
  同一路径还允许给墓碑加成员、对墓碑重新初始化。现 `GetTenantByID` 视墓碑为不存在（§5 缺失与他租户不可区分），
  状态机对 `deleted` 无出边。3 条新用例在修复前全部失败、修复后通过。
- **Redis 测试隔离度（原 P2-4）**：`testredis.OpenDB` + 预留索引注册表，authtoken=2 / login=3 /
  middleware=4 / session=5，默认库 1 不变。4 包并行 3 轮全绿（此前偶发失败）。
- **race 检测（原环境限制）**：真实原因是 `PATH` 上的 Cygwin `gcc`，不是缺工具链。
  `CC=/d/msys64/mingw64/bin/gcc.exe` 下 `-race` 可用：`pkg/tenant`、`pkg/testredis`、
  `internal/middleware`、`modules/auth/session` 与租户生命周期/并发用例全绿。
- **发布产物凭据预检（原 P3-1）**：`check-release-secrets.mjs` 作为发布硬前置，在打标之前拒绝携带凭据的
  发布资产（MySQL DSN / URL / `-p<值>` 三种形态，报告脱敏）。规则刻意收窄：更宽的规则集在真实 v0.17.1
  产物上误报 42 处（测试夹具、Go 结构体字面量、i18n 文案），会被绕过；现对真实产物干净，
  且对 v0.17.0 的两种残留形态均能捕获。产物本身仍不可回收——凭据已轮换。
  发布后复核发现：v0.17.2 发布时该门禁只扫描了 `bundle/`，而残留实际位于 `repo.tar`；已补扫确认
  v0.17.2 的 `repo.tar` 干净，门禁现同时扫描两种资产，`repo.tar` 缺失时失败关闭（见下）。
- **合同 V1.3**：§2.1 补入墓碑语义、不可寻址、不可作为输入、删除标记是 `status` 而非预留的 `deleted_at`、
  删除归档租户时成员同事务停用（§2.2 的 owner 要求只约束非归档租户）。按既有 contract-change 流程记录
  触发与范围，不自行宣告 G4 通过。
- **验证**：后端 build/vet/gofmt 干净，真库全量 `go test ./...` 0 失败 0 跳过；`test:foundation-release`
  57/57（含扫描器 12 条断言，覆盖 `repo.tar` 残留与缺失失败关闭）；无 schema 变更（仍为 29），
  无接口移除或重命名。
- **行为变更（需知会消费方）**：已删除租户在 `GET`/`PUT`/成员/初始化接口上一律 `404 tenant.not_found`；
  列表在显式 `status=deleted` 过滤下仍可见。

## 发布后复核（2026-10-23，v0.17.2）

对已发布代码与证据做了一轮对照复核，登记并修复 R-1…R-5；证据见
`.harness/evidence/2026-10-23-residual-closeout/review.md` 的 addendum，失败登记表新增 FR-015。

- **R-1（P1）**：发布凭据门禁只扫 `bundle/`，未扫 `repo.tar`——v0.17.0 残留所在的 tracked 证据文件只随
  `repo.tar` 分发。现同时扫描两种资产、缺失即失败关闭，并补回归用例；真实 v0.17.2 产物补扫 3079 文件干净。
- **R-2（P2）**：证据中三处表述与代码不符（死锁修复被写成 1213 重试、扫描器被写成 18 例且含 PEM/JWT、
  门禁被写成覆盖整个发布）。以勘误方式修正，保留原始声明记录。
- **R-3（P3）**：`STATUS` 在打标后仍写「发布中」，已改为已发布并核对 tag commit `e6aeced9`。
- **R-4（P2）**：窄视口租户选择器烟测在 Arco 弹层首帧居中定位时测量溢出，CI 采样到 87px 假阳性；
  改为等待弹层与触发器对齐后再测量，溢出断言保持不变。
- **R-5（P3）**：删除 `GetTenantByID` 的重复注释行，仅注释变化。
- 已发布资产（v0.17.0 / v0.17.1 / v0.17.2）保持不可变；扩大的门禁从下一次发布起生效。

## 交付收口与租户生命周期修复（2026-10-22，v0.17.1）

独立交付验收（基线 `main 92b94474` / 发布 `v0.17.0 → 728feb2b`）判定 **FAIL（暂不可交付）**：无 P0，
但三项交付完整性阻塞——主干 `Release Gate` 红、整改仅存于未提交工作区、消费侧文档与实现/发布矛盾。
本包把三项阻塞与验收新发现的两项租户生命周期缺口一并收口，并发布 `v0.17.1`。
任务包 `2026-10-22-v0171-release-closeout`，证据在 `.harness/evidence/2026-10-22-v0171-release-closeout/`。

- **Release Gate**：`92b94474` 上 8 条 SonarCloud 未处理（`go:S1192`×3、`go:S3776`×2、`S6759`×3、`S6582`）
  已按规则整改（提取常量、拆分 `repairTenantPlatformGrants`、`Readonly<Props>`、可选链、纯函数提取），
  无 suppression；修复随本包合入主干后由 CI 复验。
- **整改落库**：此前停留在 `fix/tenant-plan-entitlements-and-audit` 工作区的 30 个修改 + 4 个未跟踪文件
  已提交；任务包 `2026-10-22-delivery-audit-remediation` 置 `completed`。
- **消费侧文档**：README(zh/en) 指向 v0.17.1；`TENANT_API` 改为实际挂载的 `/api/v1/system/tenant*`
  （原 `/api/v1/tenants*` 实测 404）；scope 矩阵不再称"当前运行态是单租户"；部署指南补 `tenant_mode` 章节。
- **租户生命周期（验收新发现）**：①归档租户可删除（同一事务内停用成员 + 释放编码 + 置 deleted），
  解除「§2.1 归档是退场路径」与「§2.2 最后 owner 不可移除」的死锁；活跃租户仍有成员时仍拒绝删除。
  ②`CreateTenant` 在 provisioning 失败时删除租户行，编码可复用，重试即重建。
- **UI 一致性**：字典页治理栏去掉三个指标下的描述文案（其余系统列表只有 label + value，说明在治理抽屉），
  同步删除 5 个语言包中失效的 3 个 key。
- **迁移回滚断链（P2，准备发布时实测发现）**：`000020.down` 无条件删索引/列，而 `000024.down` 已删掉其中
  几个，`migrate down` 走到一半报 `Error 1091: Can't DROP 'tenant_id'`，schema version 停在 dirty ——
  照 runbook 回滚会得到半删的库。现每个破坏性步骤先查 `information_schema`，回滚可完成且可重新 up。
  新增 `TestMigrationChainRollsBackAndReapplies`（up→down→up）；把 `000020.down` 换回上一版该用例即失败，
  反向证明缺陷与用例都真实。
- **验证**：后端 `go build`/`go vet`/`gofmt` 干净，真库全量 `go test ./...` 0 失败 0 跳过；
  新增 5 条真库用例（归档删除、初始化回滚、最后 owner、归档终态、回滚重放）；前端 tsc / eslint /
  vitest（30 文件 214 用例）/ prebuild 13 步 / vite build 通过；浏览器 17 路由 0 console error、0 个 `/api/` ≥400。
- **发布事实（实测）**：PR #408 squash 合并为 `1f68d56b`；`Release Gate` 在该提交上 **success**
  （审计阻塞项 P1-1 由 CI 证实闭合）；标签 `pantheon-base-v0.17.1` 为 annotated tag 指向 `1f68d56b`；
  Release 非草稿非预发布，四件产物齐备，`tgz` = `3b0b7949…`、`repo.tar` = `3b804a8e…` 与本地 `sha256sum -c`
  及 GitHub asset digest 逐字节一致；`check:release-assets` 通过；`Foundation Release Verify` **success**。
- **测试夹具修正**：`tenant-viewpoint-switcher` teardown 与 `tenant-matrix-fixture-setup` 原先「删光成员再删租户」，
  在 §2.2 最后 owner 保护下永远达不到 `member=0`，Tenant Smoke 因此报 `tenant.has_active_members`。
  两者改为先尽量清成员、再归档、再删除，走契约的退役路径。
- **结论**：三项阻塞、两项生命周期缺口、一处回滚断链与两处治理栏呈现问题全部闭合，`v0.17.1` 已发布。

## 租户菜单、审计归属与套餐差异化修复（2026-10-22）

维护者人工验收提出三类问题，已在真实 multi 环境修复并回归，任务包
`2026-10-22-tenant-plan-entitlements-and-audit`，证据在
`.harness/evidence/2026-10-22-tenant-plan-entitlements-and-audit/`。

- **平台专用菜单泄漏（P1）**：provisioning 曾逐字复制平台管理员菜单/权限绑定，租户管理员因此看到
  「租户管理/菜单管理/国际化管理」并落到 403。现在 `pkg/tenant/platform_scope.go` 单一分类，
  菜单读取、provisioning、角色写入、权限缓存四处共用；启动时幂等修复存量租户授权；
  前端按租户会话兜底过滤。租户四套餐侧栏均无平台专用项，直连 URL 只渲染 403。
- **登录日志为空（P1）**：审计行过去写入平台 0，租户视图读不到。现在成功登录按签发的 tenant claim、
  失败登录按主体归属租户、MFA 按 challenge 租户落库；compat 保持 0。
- **套餐无差异（P1）**：差异改由前台 `core/entitlements/plans.ts` 注册表驱动，模块声明 feature，
  shell 过滤菜单/路由/dashboard，直连被锁页渲染升级页，租户表单展示只读套餐矩阵。后端不按套餐
  初始化控制台功能，角色权限仍是授权边界；套餐门禁是 UX。
- **验证**：后端真实 MySQL/Redis `-race -p 1` 全量 46 包通过；前端 30 文件 / 214 用例、tsc、ESLint、
  prebuild 13 步（Arco patch + 12 项 contract）、Vite build 通过；四套餐浏览器验收与标签探针通过。
- **登录边界**：收尾审查修复了同标签页重新登录复用上一主体租户上下文的问题（`Login.tsx` 调用
  `resetTenantSession()`，新增 3 个 store 单测）；末次改动后已重跑四套餐浏览器验收。
- **标签残留（原 P3，已修复）**：标签栏改为派生过滤，同时检查套餐 entitlement 与路由 `pagePermission`；
  免费租户直连 `/system/tenant` 得 403、`/system/generator` 得升级页，标签栏均只有「工作台」。
- **结论**：三类问题均已闭合，无已知 P0–P3 残留；剩余仅为设计说明（套餐门禁是 UX）与环境限制。

## 发布收口（2026-10-21，v0.17.0）

v0.16.1 之后合入的 13 个提交（租户隔离整改 #386、#391–#394，依赖升级 #381/#384/#385，
发布管线修复 #383/#387–#390）按 `docs/VERSION_MANAGEMENT_GUIDE.md` §2.3 作为 **minor** 发布为
`v0.17.0`，并发布四件可消费产物，供 `pantheon-ops` 将锁从 v0.16.1 推进到含安全修复的基线。
`sharedPaths` 保持 52 条不变；迁移 `000025`–`000028` 全部 additive；六个业务 overlay 锚点仍唯一命中。
任务包 `2026-10-21-v0170-release-cut`，证据在 `.harness/evidence/2026-10-21-v0170-release-cut/`。

**发布门禁实况（2026-10-21 最终，main `17af0d85`）**：验收整改链 #396→#397→#395→#398→#402 已全部合入 main，
另清理两条 Dependabot 高危（#400 `klauspost/compress`、#403 frontend `follow-redirects`）。
`CI`（含 `go test -race` 两条腿）、`Backend Tests`、`Unit Tests`、`Full Smoke Suite`、`Core Smoke Tests`、
`Security Gates`、`CodeQL`、`Lint Workflows` 全绿；Sonar 分支分析五项条件全 OK、**open issues = 0**、open Dependabot alerts = 0；
**`Release Gate` success**（`Dependabot Alerts` job 首次与告警清零竞态失败，同 commit、同规则复跑转绿）。
维护者定案的两条验收条件——Quality Gate 全过、Open issues 清零——已由 hosted 实测满足。任务包 `2026-10-21-acceptance-remediation`
已置 `completed`，残余动作逐项登记在 `docs/reviews/PANTHEON_BASE_ISSUES_AND_REMEDIATION_2026-10-21.md` §5。

**发布已落地（2026-10-22）**：annotated tag `pantheon-base-v0.17.0`（tag object `d1a167c5`）指向 `728feb2b`，
GitHub Release 于 `2026-10-22T00:17:53Z` 发布，四件产物齐备（tgz 19,903,712 B / `.tgz.sha256` 111 B /
`repo.tar` 34,058,240 B / `repo.tar.sha256` 75 B；tgz SHA-256 `4f2478…922f`），
`Foundation Release Verify` 在 `release: published` 上通过（run 39698850076）。F5 关闭。

## 租户交付硬化（2026-10-20，已完成，冒烟已确认）

2026-10-20 的交付审计发现并关闭了三个阻断项，任务包 `2026-10-20-tenant-delivery-hardening`：

- **P0 权限策略逃逸**：策略端点未绑定租户、`tenantId` 来自请求体，租户可写全局策略/跨租户写/全量读。
  现在写入主语由上下文决定，读/导出/编辑/删除全部限定在 `role:<key>@tenant:<id>`。
- **P0 角色键逃逸**：租户可创建 `admin` / `platform_ops`，登录后继承平台全局授权。现在保留平台命名空间，
  创建/改名/导入一律拒绝。
- **P1 角色生命周期与冒烟**：删除/重命名/Bootstrap 识别域主语；`platform.tenant_mode` 改为公开并在启动修复，
  恢复视角切换器渲染（此前 `Tenant Smoke` 在主干持续红灯，被 `continue-on-error` 掩盖）。

验证：后端全量 `go test ./...`（真实 MySQL）绿；新增 10 条双租户/角色用例；前端 `tsc -b` 绿；
证据见 `.harness/evidence/2026-10-20-tenant-delivery-hardening/`。

**已关闭（2026-10-22）**：`Tenant Smoke (multi-mode)` 已去掉 `continue-on-error`，改为 push-only 的主干健康硬门禁，
最近五次 main 运行全绿（39598957879 / 39584482520 / 39582453605 / 39580935995 / 39572335644）；v0.17.0 发布包已创建并过 Verify。
存量租户若已创建保留角色键，仍需运营按 runbook 清理（未发现存量命中）。

## 遗留项收口（2026-10-22）

任务包 `2026-10-22-release-and-residual-closeout`，证据在 `.harness/evidence/2026-10-22-release-and-residual-closeout/`。

- **F5 tag/release**：已发布（见上节），Verify run 39698850076 success。
- **F2 分支保护**：GitHub ruleset `17011510`（`solo dev merge rules`）active，目标 `~DEFAULT_BRANCH`、无 bypass actors，
  必需检查为 Quality Gates / Security Gates / Unit Tests / CI Summary / SonarCloud Code Analysis。经典 branches API 仍返回 404（规则集模式）。
- **B10 Tenant Smoke 转硬门禁**：`smoke-core.yml` 移除 advisory，保留 push 触发（避免与 PR 级冒烟重复）。
- **G2 静默跳过审计**：`pkg/testmysql` 对齐 `testredis` 的 required 语义，新增 `PANTHEON_TEST_DSN_REQUIRED`；
  CI（`ci.yml` / `quality.yml`）设为 `true`，未配置 DSN 时 fail-loud 而非 skip。全量真库复跑 0 FAIL / 0 SKIP。
- **D2 凭证轮换**：本地 MySQL/Redis 凭证已轮换并验证旧凭证被拒；HEAD 跟踪文件对旧凭证 0 命中。
  **残留**：v0.17.0 的 `repo.tar`（及 tgz 内嵌副本）构建自脱敏前提交 `728feb2b`，仍含已失效的历史凭证字面量；
  因其已失效且发布产物不可变，记录为显式残留，处置（v0.17.1 或经授权替换产物）待维护者决定。
- **浏览器验收**：18 条系统路由，0 控制台错误、0 个 ≥400 响应，8 项只读交互渲染正常（无写入提交）；
  证据 `artifacts/01-dashboard.png` … `08-session-detail-drawer.png`。

## 当前最终验收状态

**判定：v0.17.0 已发布（2026-10-22）**，tag `pantheon-base-v0.17.0` → `728feb2b`，四件产物齐备并通过 Verify（run 39698850076）。
验收整改的 P0/P1 已全部闭合，残余只有 D2 的发布产物凭证残留（已失效、显式登记）与延期 P2/P3 清单。

历史记录：**v0.16.1 已发布（2026-10-20）。** tag `pantheon-base-v0.16.1` → `c83f8e4c`，GitHub Release 带齐四件可消费产物（`foundation-release-pantheon-base-v0.16.1.tgz` 18,500,303 B / `.tgz.sha256` 111 B / `repo.tar` 31,477,760 B / `repo.tar.sha256` 75 B），`Foundation Release Verify` 在 `release: published` 上通过（run 39352195137）。这是自 v0.13.0 以来第一个真正可被消费的发布，`pantheon-ops` 的锁终于可以前进（属消费仓单独变更）。

发布方式需要如实记录：**tag 与 Release 由维护者凭据产出，不是 CI 产出**。仓库 `default_workflow_permissions=read`，三次 hosted 正式切（39350509094 / 39351236715 / 39351991489）分别撞在 App `workflows` 权限、Git database API 403、release 创建 403 上；工作流已收敛为"只读校验 tag + 构建/校验产物"的可重复路径，全自动发布需配置带 `contents:write` 的 PAT secret（维护者授权项）。详见 `.harness/evidence/2026-10-12-v0161-release-cut/`。

（2026-10-19 补记：main 在发布候选之上新增租户整改，以 PR #386 压缩合并为 `8b5a3012`；经维护者确认，v0.16.1 发布范围为**候选提交 `c83f8e4c`**，租户整改随 v0.17.0 minor 发布。）

## 任务状态总览

| 状态 | 说明 |
|------|------|
| ✅ 已完成 | 全部历史任务 + 2026-10-07 整改任务包 + v0.15.0/v0.16.0 发布收口 |
| ✅ 已完成 | v0.16.1 发布收口（`2026-10-12-v0161-release-cut`，四件产物已发布并过 Verify；全自动发布待 PAT secret） |
| ✅ 已完成 | v0.17.0 发布收口（`2026-10-22-release-and-residual-closeout`，F5/F2/B10/G2/D2 + 浏览器验收） |
| ✅ 已完成 | 租户权限隔离整改（`2026-10-19-tenant-permission-isolation-remediation`，W0–W6 全部完成 + F14 收口后关闭，**零残留**） |
| ⏸️ 暂停 | 无 |

## 租户权限隔离整改（2026-10-19，已收口）

2026-10-19 的租户交付验收在实机跑了 193 项断言，通过 179 项（92.7%），留下 13 个缺陷、其中 **5 个 P0**。
5 个 P0 不是五个独立 bug，而是**一个同源缺陷簇的三层表现**：`role_key` 被当成跨租户全局命名空间。
`system_role` / `system_role_permission` / `system_role_data_scope` 三张表都已带 `tenant_id` 与
`(tenant_id, role_key)` 唯一键，但读写链路上有一半入口退化成按 `role_key` 单键工作，写入端还把租户值丢成 `tenant_id = 0`。

- **父任务**：`.harness/tasks/2026-10-19-tenant-permission-isolation-remediation/`（`status: completed`）
- **计划文档**：`docs/harness/tasks/2026-10-19-tenant-permission-isolation-remediation.task.md`
- **基线证据**：`.harness/evidence/2026-10-19-tenant-permission-isolation-remediation/`（`baseline-findings.md` / `review.md` / `commands.json`）
- **缺陷簇**：F7 F8 F9 F10 F11 F13（数据范围租户维度）+ F3（角色菜单授权落库）+ F1 F4（租户自助开通）+ F2（登录黑名单）+ F5 F6（控制台）

| Wave | 任务包 | 关闭缺陷 | 状态 |
|---|---|---|---|
| W0 | `2026-10-19-w0-isolation-contract-guardrails` | 契约条款 + 双租户红用例 | ✅ completed |
| W1 | `2026-10-19-w1-data-scope-tenant-dimension` | F7 F8 F9 F10 F11 F13 | ✅ completed |
| W2 | `2026-10-19-w2-tenant-user-onboarding` | F1 F4 | ✅ completed |
| W3 | `2026-10-19-w3-role-menu-grant-persistence` | F3 | ✅ completed |
| W4 | `2026-10-19-w4-session-revocation-login-gate` | F2 | ✅ completed |
| W5 | `2026-10-19-w5-tenant-console-ux` | F5 F6 | ✅ completed |
| W6 | `2026-10-19-w6-reverification-closeout` | 全量 193 项复跑 + 收口 | ✅ completed |
| W6+ | 收口后跟进 | F14（P2 错误码整形 → `404 role.not_found`） | ✅ closed，34/34 零 findings |

### W0 完成情况（2026-10-19）

把「列存在但路径忽略」变成可引用的违规：

- **契约**：`TENANT_CONTRACT_V1.md` 新增 **§2.3.1 读写义务（V1.2，澄清性质）**——读必须带租户谓词、
  写必须由上下文赋值且冲突键含 `tenant_id`、按裸键的归属校验同样算读；写明唯一两个放行面与 fail-closed 默认。
  条款前移到 §2.3（归属模型）而非留在 §3.3（上下文），因为「表里有没有这一列」曾被当成合规判据。
- **红用例**：8 条，用定点变异（还原 W1 的 6 个谓词）证明它们在旧代码上红、在新代码上绿。
  变异后 `md5sum -c` 校验还原，`go build` 通过。
- **门禁缺陷**：manifest 原命令 `-run Tenant` 会漏掉 3 条名字不含 `Tenant` 的用例（假绿），已改为 `-run 'Tenant|DataScope'`。
- **证据**：`.harness/evidence/2026-10-19-w0-isolation-contract-guardrails/`（`summary.md` / `review.md` / `commands.json` / `red-run.log`）。

### W1 完成情况（2026-10-19）

数据范围策略的租户维度补齐，6 个缺陷关闭：

- **改动**：`SystemRoleDataScope` 增加 `TenantID`；`loadRoleDataScopePolicies` / `applyRoleDataScopePolicy` 显式接收租户；
  `ListDataScopePolicies` / `ensureRoleKeyExists` / `fetchWorkbenchRoles` / `loadRoleDataScopes` 加租户谓词；
  `UpdateDataScopePolicy` 写 `tenantOwnerID()` 并 `OnConflict(tenant_id, role_key)`；
  `deleteRoleDataScopes` 按 `(tenant_id, role_key)` 删除；新增 `ensureDeptIDsBelongToTenant` 拒绝他租户部门 id。
- **迁移**：`000025_role_data_scope_tenant_backfill` 把历史 `tenant_id = 0` 策略复制到真正持有该角色的租户（只复制、不搬移、不凭空补 `all`）。`schema_migrations` 24 → 25。
- **验证**：`cross_tenant_leak.py L2 L3` **26/26 通过**（基线 27/34）；UI 探测 5/5，数据权限页总数 53 → 2；
  `go build` / `gofmt` / `go vet` / `go test`（middleware + permission + role）全绿。
- **证据**：`.harness/evidence/2026-10-19-w1-data-scope-tenant-dimension/`（`summary.md` / `review.md` / `commands.json` / `sql-snapshots.txt`）。
- **未收口**：平台作用域仍列出全部租户角色（待 W5 视角切换器显式化）；无策略角色仍 fail-closed 500（待独立决策）；F14 未排期。

### W2 完成情况（2026-10-19）

租户自助建用户直接可登录（F1 / F4）：

- **改动**：`CreateUser` 在同一事务内 `ensureTenantMembership`；`DeleteUser` 停用成员关系而不是删除；
  `tenantOwnerID()` 从请求租户上下文取值；平台用户（`tenant_id = 0`）不写成员关系。
- **迁移**：`000027_tenant_membership_ghost_cleanup` 把历史上已软删用户的 active 成员关系置为 `disabled`。
- **验证**：A3「tenant-created user is immediately loginable」200；A3c `ghost_members=none`；4 条单测覆盖
  同事务写入、失败回滚、删除停用、平台用户跳过。
- **证据**：`.harness/evidence/2026-10-19-w2-tenant-user-onboarding/`。

### W3 完成情况（2026-10-19）

角色菜单授权的租户维度（F3）：

- **改动**：`rbacbind` 的 role-menu 写入显式接收 `tenantID`；`replaceRoleMenus` 从角色行解析租户；
  平台 seed/login/menu 绑定限定 `tenant_id = 0`。
- **迁移**：`000026_role_menu_tenant_backfill` 把历史 0 行移动到角色所属租户（`UPDATE IGNORE` + 仅在有租户副本时清理 0 行）。
- **验证**：A4 导航授权 `menuIds=6 expected=6`，二次编辑 `menuIds=[6,7]`；探针库连续执行两次结果稳定。
- **证据**：`.harness/evidence/2026-10-19-w3-role-menu-grant-persistence/`。

### W4 完成情况（2026-10-19）

凭证变更后的登录门禁（F2）：

- **改动**：签发成功后 `ClearUserBlacklist`；`RevokeUserTokens` 同时写 session 级黑名单，旧 access token 仍失效。
- **验证**：重置密码后新密码立即登录 200；旧会话 401 `token.expired.force`；禁用/启用循环同样通过；
  Redis 键状态见 `redis-keys.txt`。
- **附带**：`pkg/testredis` 支持 `PANTHEON_TEST_REDIS_DB`，修复并行包 FlushDB 造成的键断言 flake。
- **证据**：`.harness/evidence/2026-10-19-w4-session-revocation-login-gate/`。

### W5 完成情况（2026-10-19）

控制台两处判定缺陷（F5 / F6）：

- **改动**：新增 `usePlatformScope`（读 `/auth/tenants/current`），两个切换器不再用权限键代理平台能力；
  `DeptList` 改为绑定 `flatDeptRows`，总数按扁平行计算。
- **验证**：租户管理员页面不再请求 `/system/tenant/list`，零 `tenant.platformOnly`；部门总数 5、子部门可见；
  `ui_walkthrough.cjs` 23/23。
- **证据**：`.harness/evidence/2026-10-19-w5-tenant-console-ux/`。

### W6 完成情况（2026-10-19）

全量复跑与收口：

- **跑分**：`tenant_acceptance.py` 136/136、`ui_walkthrough.cjs` 23/23、`cross_tenant_leak.py` 34/34 → **193/193**。
- **处置**：12 个缺陷关闭；F14（P2，跨租户角色成员接口返回 500 而非 404/403）显式降级并写明修复路径。
- **环境**：`schema_migrations=27`，幽灵成员 0，租户角色在 0 的授权 0，探测策略 0，探测租户 295/297 已归档。
- **证据**：`.harness/evidence/2026-10-19-w6-reverification-closeout/`（`summary.md` / `disposition.md` / `commands.json` / `final-run.log`）。

**判定**：F1、F3、F7、F8、F10 五项 P0 全部关闭，193 项验收全绿；F14 是唯一残留，P2、无数据泄露、已降级。
本租户已具备「可交付」条件。W1 的临时缓解（收回 `system:permission:data-scope`）不再需要。

平台作用域仍会列出全部租户角色、无策略角色仍 fail-closed 500、部门表改为扁平行——三项都是显式剩余项，
分别需要产品决策或独立交互设计。

## 2026-10-07 整改任务包（已收口）

- 父任务 `2026-10-07-release-readiness-remediation`：completed。
- Wave 0 子任务（`iam-data-scope` / `audit-request-body` / `auth-session-scope` / `login-log-identity` / `governance-gate-repair` / `upgrade-runbook`）：completed。
- Wave 1（`release-qualification`）：completed —— 候选提交的 CI、前端、后端、浏览器、MySQL 与治理证据齐备。
- Wave 2（`release-closeout`）：completed —— PR #368 合并、分支收口为 `main`、Release Gate 全绿、v0.15.0 发布。
- P1 followup（`performance-followup` / `ui-maintainability-followup`）：completed。

## 发布收口（v0.16.1）

- **版本**：`VERSION` = 0.16.1；tag `pantheon-base-v0.16.1`；GitHub Release 待 `Foundation Release Cut` 工作流产出。
- **性质**：补丁发布，**零消费侧接口变更**——无路由、权限码、菜单 seed、i18n key 或契约形状变动；`sharedPaths` 52 项与 v0.13.0 清单逐字节一致。
- **修复**：恢复四件可消费产物。v0.14.0 / v0.15.0 / v0.16.0 各发布 **0** 件产物，而 v0.12.1 / v0.13.0 各发布 **4** 件；消费侧锁因此长期停留在 v0.13.0。v0.16.1 是 v0.13.0 之后第一个可消费发布。
- **新增**：
  - `.github/workflows/foundation-release-cut.yml` —— 仅 `workflow_dispatch` 触发，在 CI 中执行 `release:foundation:cut` + `check:release-assets --local-only` + `release:foundation:publish`，默认 `dry_run=true`。所有输入经作业级 `env` 传递（规避 `githubactions:S7630` 脚本注入），发布用凭据由 `gh auth setup-git` 提供而非 `persist-credentials`。
  - `.github/workflows/foundation-release-verify.yml` —— Release 发布后自动核对四件产物（`release: [published]`）。
  - `.github/workflows/foundation-release-backfill.yml` —— 对历史 tag 补产物的手动回填通道（默认 dry-run）。
  - `scripts/foundation-release/check-release-assets.mjs` + 21 条无外部依赖测试 —— 四件产物契约的机器可校验门。
- **为什么必须由 CI 发布**：`publish-foundation-release.mjs` 强制要求目标提交上存在成功的 `Release Gate Summary` 检查运行，且本地发布脚本在本机无法执行（Node 无法 `spawnSync` 任何子进程，`git`/`gh`/`tar` 均返回 `EBUSY`，已在关闭沙箱后复测确认）。CI 发布同时天然满足"工作区干净"前置条件。
- **任务包**：`.harness/tasks/2026-10-12-v0161-release-cut/`。
- **消费侧前置校验（已通过）**：`sharedPaths` 52/52 一致；业务叠加装配的 6 个锚点在 v0.16.1 基线上各命中恰好一次。

## 发布收口（v0.16.0）

- **版本**：`VERSION` = 0.16.0；tag `pantheon-base-v0.16.0`；GitHub Release 已发布（**0 件产物**）。
- **性质**：内部工程发布（minor），**零消费侧接口变更**——无路由、权限码、菜单 seed、i18n key 或契约形状变动。
- **范围**：
  - #371 前后端命名与目录对齐（Go 包名 == 目录名；`frontend/src/modules/system/*` 镜像后端三层结构；`core/permissions`/`core/settings` 单数化、`AppLayout.tsx` 拆出 `index.tsx`）。
  - #372/#373/#374 冒烟分层（L0 静态 / L1 关键路径 / L2 模块 / L3 全量）并按业务模块拆分 `system-pages.spec.ts`；新增路径驱动的 `scripts/resolve-smoke-modules.mjs` 与 CI `pr-smoke-modules` 作业。
  - #370 清除 Dependabot #43（`sprintf-js` DoS，dev 依赖）；#374 清除拆分浮出的 17 条 SonarCloud 异味；#375 删除空 `openspec/` 骨架。
- **质量**：SonarCloud 未解决项 0、整体重复率 2.8%；CodeQL 0 error/critical；Dependabot 0 high/critical。
- **任务包**：`.harness/tasks/2026-10-12-v0160-release-closeout/`。

## 发布收口（v0.15.0）

- **版本**：`VERSION` = 0.15.0；tag `pantheon-base-v0.15.0`；GitHub Release 已发布。
- **安全**：SSRF IPv4 denylist 改为字节字面量构造（`backend/pkg/security/ssrf/validator.go`），清除 6 条 `go:S1313`；SonarCloud 未解决项为 0。
- **CI**：`Full Smoke` 窄屏弹层用例改为等待弹层稳定后再测量，消除测量时序 flake；必需检查与 Release Gate 全绿。
- **文档**：README（zh/en）移除里程碑/成熟度叙事并对齐 v0.15.0；过期报告归档至 `.harness/archive/2026-10/`。

## Dependabot 安全整改（2026-10-11）

- **告警**：#43 `sprintf-js`（GHSA-hp3w-g68c-fv3c / CVE-2026-97058，medium，dev 依赖，manifest `frontend/package-lock.json`）。
- **根因**：`nyc` / `vite-plugin-istanbul` → `@istanbuljs/load-nyc-config@1.1.0` → `js-yaml@3.15.2` → `argparse@1.0.10` → `sprintf-js@1.0.3`；上游最新版 1.1.3 仍在受影响区间（`<= 1.1.3`），无可用补丁版本。
- **修复**：`frontend/package.json` 增加 `overrides`，将 `@istanbuljs/load-nyc-config` 的 `js-yaml` 固定到顶层 `^5.4.2`；lockfile 仅移除 4 个孤立条目（45 行删除，零版本漂移）。
- **验证**：`npm ls sprintf-js` 为空；`npm ci --dry-run` 通过；`load-nyc-config` YAML 解析 PASS；lint / type-check 通过。
- **任务**：`.harness/tasks/2026-10-11-dependabot-sprintf-js-dos/manifest.json`。

## 归档

- 历史任务（116 个）见 [ARCHIVE.md](./ARCHIVE.md)。
- 2026-10 过期文档见 `.harness/archive/2026-10/`。

## 质量指标

- SonarCloud：Security Rating A，未解决项 0。
- CodeQL：0 open error/critical；Dependabot：0 high/critical。
- 覆盖率 / 重复率 / Lint / Docs Governance：达标。

## 维护者

duanxldragon
