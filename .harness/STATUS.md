# Final original-task inventory (2026-11-07)

250 manifests including237 archives:250 completed /0 in-progress in the reviewed candidate. Original12/40 criteria unchanged. Seven closures merged BasePR497; five final independent approvals applied, final governance PR CI/merge remains required. Official185 published; OpsPR177 merged, full consumer validation passed. Maintenance freeze unsigned, S3 unwaived, separate residuals retained. Evidence: .harness/evidence/2026-11-05-base-freeze-release/resume11-five-task-applied.json.

## Historical inventory (preserved)

# Current inventory (2026-11-07)

250 manifests:245 completed /5 in-progress. Seven original scopes closed under independent CODE/ARCH approval; five consumer/programme tasks remain open. Original40 criteria retained. Official185 publication complete; full consumer validation/CI closeout still running. Freeze unsigned/S3 unwaived. Evidence: .harness/evidence/2026-11-05-base-freeze-release/resume9-seven-task-applied.json.

## Historical inventory (preserved)

# Pantheon Base - Harness 任务状态

**最后更新**: 2026-11-06
**已交付版本**: `pantheon-base-v0.18.4`，commit `0a8229c67ab482c2e163622fc4e5b87301c53399`；四个正式资产校验通过。
**下游消费**: Ops PR #171 已合并，根 `foundation-release.lock.json` 钉定同一 release/commit/摘要。
**任务闭环**: 250 个 manifest，238 completed、12 in-progress；这 12 个的交付证据已对齐，独立 CODE/ARCH 已返回 REQUEST CHANGES/BLOCK，证据修复与夹具验证后等待复审，尚未批准关闭。

## 2026-11-06 十二任务闭环核对（当前）

- [逐项验收、证据与关闭步骤](./evidence/2026-11-05-base-freeze-release/closeout.md)；原审计基线、历史失败、skip 数和源文件评审范围保留。
- Base PR #494 已合并；minimatch 11.0.1 修复 Dependabot #52；正式 release 的 Full Smoke、Release Gate 与资产校验有记录。
- 官方v0.18.4发布和Ops PR171合并/根锁已确认。消费重建828、共享漂移、迁移32/dirty=false、前端218单测、消费脚本57回归、4套生成模块浏览器烟测通过。原消费完整race2168通过/1共享夹具失败/1S3 skip；明确测试文件overlay后的完整验证2170通过/0失败/1S3 skip，不能视为原版发行测试全部通过。Base直接完整race仍待成功结果；此前1次建库TCP连接失败保留，完整重跑中。 当前双路独立批准待完成。
- PB-010 既有失败已分类并在 Ops 修复/合并；host 回填最终装配为业务 000032，Base 000031 不变。observability 网络策略仍单独待维护者裁定。
- PB-009 已作保留 coverage/race 和延期优化的裁定，优化本身不在本轮实现范围。
- [未获豁免的残余事项](./evidence/2026-11-05-base-freeze-release/closeout-residuals.json)：真实 S3 provider 的 1 skip、未签维护冻结、observability 策略、CI 优化、5 moderate 依赖及 23 zizmor 既有基线、生产迁移与旧认证退役。
- [当前审查阻断](./evidence/2026-11-05-base-freeze-release/closeout-review-availability.json)：原生角色503保留历史；配置默认CLI双路独立审查已返回真实发现，正在修复后复审。没有作者自审或 solo-override。

## 2026-11-04/06 历史执行记录

以下旧待办按当时事实保留；当前状态以本页上节及 closeout 记录为准。

## 2026-11-06 安全补丁与 GitHub 消费（历史执行）

- v0.18.3 发布器 exit0，报告四资产上传完成；独立再次查询历史会话受网络限制阻断。
- 2026-11-06 网络恢复：minimatch override 安装成功并落入 package-lock，全部实例统一至 11.0.1；GHSA-g3hv-75wg-m249 消除，audit --audit-level=high 通过，前端 build 通过，218 单测通过，docs frontmatter 通过。详见 [v0184 验证证据](./evidence/2026-11-05-base-freeze-release/2026-11-06-v0184-security-validation.json)。
- PR #494 全部门禁通过并 squash 合并为 `0a8229c6`；Dependabot alert #52 已关闭。main Full Smoke 首跑在 `backoffice-ui-visual` dept 筛选契约失败（重试同点），重跑转绿且该提交无 UI 差异，判定环境性；Release Gate 重算 `completed/success`。
- v0.18.4 切包发布完成：tag `pantheon-base-v0.18.4`（annotated）指向 `0a8229c6`，GitHub release 为 Latest，四资产 tgz/sha256/repo.tar/sha256 均通过 `check-release-assets` 本地与远端校验。
- Ops 隔离分支 GitHub-only 消费与快照来源修复：54 tests pass，overlay/docs/template 校验通过；Ops 主工作树从官方 v0.18.4 release 的正式消费重建（CGO race、smoke、CI、合并）尚未执行，为下一步。
- [当前证据](./evidence/2026-11-05-base-freeze-release/summary.md)记录补充范围、源码指纹和恢复顺序。

以下是历史执行读数，不可代替当前候选验收。

## 2026-11-04 FULL 审计整改（历史执行）

- 用户已授权按优先级修改；1父任务 + 原9整改子任务 + 1新增P2后续任务：[主计划](./tasks/2026-11-04-global-audit-remediation/plan.md)，[证据汇总](./evidence/2026-11-04-global-audit-remediation/summary.md)。
- P1已实施：PB-001解析核查IP后直接拨号；PB-002保留npm扫描非零退出；PB-003 GETDEL单次消费及会话条件更新。认证完整包278 tests/0 skip通过；SSRF和npm行为回归通过。
- P2已实施：权威文档有限修正、Agent三触点、现行发布策略说明。文档frontmatter/link、任务包、evidence/review/runtime工件结构及checker wiring均通过。
- P3：Ops完整隔离候选重建802项，已有前端218 tests与type-check/build通过；最终消费树整个后端构建通过，真实DB业务套件266通过/12失败节点，全部失败在Ops HEAD同断言复现，PB-010待业务意图裁定。CI成本优化缺少实测，明确延期，保留coverage/race与现行门禁。
- 全量Go：首次停滞中断、第二次共享缓存访问拒绝均已保留失败日志；专属缓存 -count=1 全量47有测试包/1874通过节点/3跳过；两个core Redis硬编码跳过已修复，补跑30通过/0跳过；S3外部配置缺口保留。不会用部分通过/静态证据代替最终读数。
- PB-010：[Ops既有DB失败P2后续裁定](./tasks/2026-11-04-audit-p2-ops-db-test-followup/manifest.json)：测试侧8用例与host `state_version`业务缺口已在隔离worktree修复，存量0行回填有迁移`000031`与端到端回归，真实DB全业务套件278通过/0失败/0跳过；剩observability端口策略裁定与推送/发布，修复未push，消费者主工作树未同步。P1相关四包race已通过：308测试节点/0跳过。
- 状态：in-progress；独立review服务503，所有任务未自我批准；正式foundation release/消费者lock升级、批准的不可变候选、外部门禁及冻结签署未关闭。原审计数量保持基线，不回填整改计数。

## 全局审计整改 programme 登记（2026-10-31 起·2026-11-01 全部收口，9/9 + W10 + W11 + W12）

审计报告：`docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-10-31.md`（合并终版，唯一权威）。
结论 **B：完成少量整改后进入维护冻结阶段**；问题面 **0 P0 / 3 P1 / 18 P2 / 7 P3（共 28 项）**。

### 已执行（9/9）

| 包                                                     | 决策                                                                                                                                                                                                                     | 改动                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 证据                                                                   |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| W1 `2026-10-31-audit-p1-lowcode-generator-build`       | **四处断裂一起闭合**：导入单一来源、路由组改走 contracts 助手、生成物设 `BootstrapFunc`、注册前置加 `go build` 闸门                                                                                                      | `backendGenerator.ts` 新增 `GO_MODULE_PATH` / `goImportPath()` / `buildGoImportBlock()`，`generateModule()` 不再自拼中间件链并补 `BootstrapFunc`；新增 `dynamic_module_build_check.go` + 测试；`dynamic_module_handler.go` 三处恒不命中的 `switch err.Error()` 改 `common.ErrMessage`；5 个前端语言包 + 后端快照新增 `module.register.source_uncompilable`                                                                                                                                                                                                                                                                                                                                                                                           | `.harness/evidence/2026-10-31-audit-p1-lowcode-generator-build/`       |
| W2 `2026-10-31-audit-p1-business-route-tenant-context` | **方案 C**：业务域在 V1 内不参与租户隔离                                                                                                                                                                                 | 合同新增 §2.6 + §1 Out + §7 行 + V1.10；EN 同步；`route_groups.go` 注释改写；新增 `route_groups_test.go` 结构断言（负向验证过）；`MODULE_CONTRACT §10` 两条；`README.md:31` 整行改写                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `.harness/evidence/2026-10-31-audit-p1-business-route-tenant-context/` |
| W9 `2026-10-31-audit-p2-oidc-scaffold-decision`        | **方案 a 第一步**：删不可达实现，留迁移与列                                                                                                                                                                              | 删除 `backend/modules/auth/oidc/`（4 文件 / 587 行）；`000029` 与四个 `oidc_*` 列保留，drop 列登记为延后；`SYSTEM_AUTH_CONTRACT §7.3` 处置说明 + EN 同步                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `.harness/evidence/2026-10-31-audit-p2-oidc-scaffold-decision/`        |
| W3 `2026-10-31-audit-p1-entry-doc-truthfulness`        | **只把已实现的说准**：版本号单源、配额改“度量展示”、community files 按实际列举、门禁状态不写入文档、DESIGN 增补租户章                                                                                                    | `README(.en)` 版本表删掉具体 release 号（指向 `VERSION` + release-notes 索引）、配额行改“配额度量与展示（超限不拒绝写入，合同 §2.4.1）”、community files 列全 `CONTRIBUTING.md`/`LICENSE`/三份 Issue 模板并只把 `CODE_OF_CONDUCT.md` 标为缺失、门禁段改“以 `main` 最近一次 required checks 的 run 为准”、`Go 1.26.6` 标注为当轮读数并指向 `go.mod`；`DESIGN(.en)` 新增 §3.4 租户章（compat/multi 双模、上下文优先级、Casbin domain、已交付面、明确未做面含业务域单租户）、§3.3 改逐项现状表带判据、§4.3 改历史背景、§9 第 10 条更正；`docs/README(.en)` 启动命令改 `cd backend && go run ./cmd/server` 并声明 `system_init.sql` 仅历史参考、8 份 `TENANT_*` 登记为非一线入口；`docs/designs/README(.en)` 索引补齐至 62/62 并如实声明 5 份缺 `.en.md` | `.harness/evidence/2026-10-31-audit-p1-entry-doc-truthfulness/`        |
| W4 `2026-10-31-audit-p2-doc-lifecycle-archive`         | **判据先行**：证据存在 + `summary.md` + manifest `completed` 才允许改状态                                                                                                                                                | 新增 `scripts/harness/task-evidence-state.mjs`（archive-aware 判据，W8 接线）；92 份任务包文档中 **69 份 `Active`/`Draft` → `Archived`**，3 份保留 `Active`（manifest 仍 in-progress）、6 份保留 `Draft`（planned 无证据）；6 份未实现设计（alert/notice/report/scheduler/task/approval）改 `Draft` + 未实现声明（中英）；7 份 `docs/TENANT_*` 专题记录移入 `docs/reviews/`（指南不动），重算文件内链接 + 修正 5 处入链；`.harness/STATUS.md` 补 v0.18.2                                                                                                                                                                                                                                                                                             | `.harness/evidence/2026-10-31-audit-p2-doc-lifecycle-archive/`         |
| W5 `2026-10-31-audit-p2-doc-metadata-and-index`        | **只剩一处权威**：schema 管字段，metadata 管 `doc_type`/`status` 枚举，harness 版归档为指针；门禁选“声明边界 + 打印覆盖数”                                                                                               | `DOCUMENT_FRONTMATTER_SCHEMA.md` 成为唯一字段定义并新增 §11 覆盖范围（强制 4 个目录）；`DOCUMENT_METADATA_AND_STATUS`(zh/en) §2 改为指针；`docs/harness/DOCUMENT_FRONTMATTER_SPEC.md` 重写为指针 + `Archived`；`HARNESS_ENGINEERING_CONTRACT`(zh/en) 改引 schema；`frontmatter-check.mjs` 新增 `ENFORCED_DIR_PREFIXES` / `summarizeCoverage()`，输出“415 扫描 / 302 带元数据 / 113 不强制 + 强制目录清单”；scope 矩阵 `dept/post` 改 `tenant-owned` 附行号、§4 改“已实现 vs 未实现”、`biz_*` 标 V2 预留；7 份 legacy 任务包补 frontmatter（现 92/92 带 frontmatter）；单测 +1 用例（13/13）                                                                                                                                                          | `.harness/evidence/2026-10-31-audit-p2-doc-metadata-and-index/`        |
| W8 `2026-10-31-audit-p2-ci-checker-wiring`             | **先判“会不会红”再判“要不要接线”**：9 个进 `Docs Governance`、1 个仅 workspace 根、1 个 mirror-only；每个接线都造违规验证过会红                                                                                          | `quality.yml` 新增 9 个检查步骤；`package.json` 新增 10 个 `check:*`；`ci.yml` 的 coverage 步骤去掉 `-race`（race 每 PR 2→1，coverage 上传仍有输入）；`check-task-packet.mjs` 接入 `task-evidence-state` 判据（status 与证据不一致即 error）；补三份 review.md 的 `## Machine Readable` 块与 v0180 的 `runtimeGap`；`scripts/harness/README.md` 加接线表；`failure-registry` 加 `FR-026`                                                                                                                                                                                                                                                                                                                                                             | `.harness/evidence/2026-10-31-audit-p2-ci-checker-wiring/`             |
| W6 `2026-10-31-audit-p2-dead-code-legacy-surface`      | **先做 workspace 级检索再删**：两个零消费 hook、`scaffold.Generate`、`readRoleKeysFromContext` 删除；死表 `permission_role_data_scope_policy` 由 `000031` drop；legacy 认证端点保留 + `Deprecation`/`Sunset: 2026-12-31` | `frontend/src/hooks/{usePagination,useRequest}.ts` 与 `hooks/index.ts` 4 行再导出删除（base 0 命中、ops 6 行全为自有副本）；`internal/scaffold/engine.go` 删除（`scaffold.Generate(` 0 命中）；`casbin_middleware.go` 包装删除、测试改 `common.GetRoleKeys`；`000031_drop_permission_role_data_scope_policy.{up,down}.sql` 新增 + `TestDropPolicyTableDownReconstructsVersion30Shape` 回归用例；`csrf_middleware.go` 新增 `LegacyDeprecationMiddleware`；`SYSTEM_AUTH_CONTRACT §7.7`(zh)/`§7.6`(en) 登记下线日。`pkg/security/ssrf` **未删**（ops 5 处 import）                                                                                                                                                                                      | `.harness/evidence/2026-10-31-audit-p2-dead-code-legacy-surface/`      |
| W7 `2026-10-31-audit-p2-token-cache-race`              | **先红后绿**：同 token 并发用例先在旧实现上报 DATA RACE，再改实现                                                                                                                                                        | `tokenSessionCache` 与 `tokenCachedSession.data` 由指针改值、新增 `cloneSessionData` 深拷贝 `RoleKeys`、`storeTokenSessionCache` 落库时也拷贝、新增 `touchTokenSessionCacheActivity` 在写锁内同步活跃时间（锁内无 Redis I/O）；`resolveTokenSession` 命中时交副本。黑名单/空闲超时/撤销/TTL/淘汰策略一行未改。修复前 **2 × DATA RACE**（`:182/:183/:186`）→ 修复后 **0**                                                                                                                                                                                                                                                                                                                                                                             | `.harness/evidence/2026-10-31-audit-p2-token-cache-race/`              |

冻结门槛进度：**7/7 全部满足**（2026-11-01）。

- 第 1 项（AUD-001）与第 2 项（AUD-002）——W1/W2，见 §16.1/§16.5。
- 第 3 项（AUD-003/004/007/016/024）——W3 闭合：入口文档不再有可被一条 `grep` 推翻的陈述，
  README 不再硬编码 release 号，designs 索引 62/62。
- 第 4 项（AUD-006/011/017/018/019）——W4 闭合：任务包状态由证据而非作者自述决定，
  `docs/` 根不再有未归位的专题记录。
- 第 5 项（AUD-008/009/010）——W5 闭合：字段定义只剩一处、scope 矩阵与代码一致、
  门禁能自报"检查了多少份"。
- 第 6 项（AUD-012/013/014）——W6 闭合：死代码/死表已删，legacy 端点保留 + 弃用头；
  **真正下线（2026-12-31）与 `000031` 的生产库执行属维护者 human gate**。
- 第 7 项（AUD-026/015/027）——W7 闭合（2 × DATA RACE → 0）、W8 闭合（11 个空转 checker
  各有归宿且新接线的都证明过会红，race 不再重复跑）。

**「进入维护冻结」的宣告未执行**：按 programme `Human Gates` 该动作归维护者，
programme manifest 以 `FREEZE-DECLARATION`（P2）显式登记。宣告**文本已就绪**（W12）：
`docs/reviews/PANTHEON_BASE_MAINTENANCE_FREEZE_DECLARATION.md`。2026-11-04 事实：2026-10-31
整改已进 main（HEAD `52550603`，#488），但 2026-11-03 产品整改仍未提交，且 2026-11-04
审计要求的 FE-01b 与 DB-01 注释已在 `2026-11-04-audit-freeze-preconditions` 收口并归档。同包补了可选的路由组布尔棘轮，删一处 `WithCapability()` / `WithDataScope()` 或改一组 refresh 布尔现在会失败。该包不代签冻结。不要拿未提交工作区签冻结。

**28 条不是 28/28**，且要分两个时点读：

- **programme 收口时**：23 条着落到子包；AUD-022/023 按审计原判断"不建议处理"；
  AUD-021/025/028 **仍为 open**（P3，不阻断冻结）。
- **W10 之后（当前）**：23 条子包 + 3 条由 W10 收口 + 2 条按审计建议不处理。
  三条 P3 是**另立一包**做的，不能读成 programme 本来就算了。

着落表见 `.harness/evidence/2026-10-31-audit-remediation-programme/review.md` §2。

### W10：三条 P3 残留收口（2026-11-01）

| 包                                          | 做了什么                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | 读数                                                                                                                                                                                                                            |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W10 `2026-10-31-audit-p3-residual-closeout` | **AUD-021**：成因不是那行 import，而是 `check-search-toolbar-contract.mjs` 对 `lowcode/templates` 的整目录豁免（该目录自 #120 起被 tsconfig exclude、全仓零 import，不参与构建）。删死 import + **撤销豁免** + 生成器侧第 14 条 + 门禁侧第 10 条两条锁。**AUD-025**：`frontmatter-check` 增加 90 天复核窗口计数与 `--report-overdue`，规则写入 `DOCUMENT_METADATA_AND_STATUS` §6.5 中英双版，**刻意不做成 error**。**AUD-028**：删除 `main.go` 空转的 `context.WithTimeout`，原地写明为何不设 timeout | 被检文件 **102 → 106**；塞回 `FilterPanel` → exit 1；恢复豁免 → 第 10 条红；拼进生成器 → 第 14 条红；逾期 **144 份**（71 `.en.md`、最老 198 天）且门禁 exit 0；把逾期计入 `ok` → docs 第 14 条红；`go build`/`vet`/`gofmt` 三清 |

W10 自己又留了两条 P3 残留（收口不是把问题清成零）：**AUD-021b**（`templates/` 目录 1,894 行死代码仍在，
删除属独立决策）、**AUD-025-review-round**（逾期文档需一次人工复核轮，不能脚本批量完成）。
另有一处文案漂移（门禁指针指向已不存在的 `DESIGN.md §7.2`）在收口中就地修掉，未计入残留。

### W11：生产 AutoMigrate 边界（2026-11-01，AUD-001c）

W1 留下的 P2，审计要求"冻结前择一"。选**文档加例外**，并把例外写窄。

| 做了什么                                                                                                                                                                                                      | 读数                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 先确认冲突真实可达：`PANTHEON_ENABLE_DYNAMIC_MODULES` 生产固定 `false`，但只挡 `/lowcode/dynamic-modules/*` 的 HTTP 路由；编译进 `generated_registry.go` 的模块不受约束，启动时仍走 `Bootstrap → AutoMigrate` | 三个命中点（`module.go:19/:70/:81`、`DEPLOYMENT_GUIDE:82`）+ `generated_registry.go` 静态注册                      |
| `DEPLOYMENT_GUIDE §3`：禁令限定为平台 schema，新增边界表 + 两点代价（需 DDL 权限、生成表列只增不减）+ 与动态模块开关的辨析                                                                                    | 边界可逐表核对                                                                                                     |
| `MODULE_CONTRACT §4.3`：接口补 `Migrate`、加"何时跑 Migrate / Bootstrap"判定表、说明 `BootstrapFunc` 用途                                                                                                     | 契约不再写"后续再扩展"                                                                                             |
| 启动日志 `skipping module AutoMigrate` → `module Migrate() skipped, runtime bootstraps run instead` + note                                                                                                    | 原句与行为相反，会误导排障                                                                                         |
| 新增 `TestRegisterBackendModules_DefaultModeRunsBootstrapForGeneratedModules`                                                                                                                                 | 负向 A（收紧 `FuncModule`）只打红它；负向 B（删 bootstrap 阶段）与 `PhasedExecution` 同时红 → 初版注释被推翻并改正 |

拒绝的两条：显式 `CREATE TABLE IF NOT EXISTS`（表已存在时不补列，把文档问题转成运行时问题）、
生成器产出迁移文件（需手写 DDL 与 GORM 模型逐列一致，不一致即查询失败且失去兜底）。
后者登记为 **AUD-001c-ddl**（P3）待重估，不是"不需要做"。

### W12：三条 P2 的可验证前置条件（2026-11-01）

三条 P2 的**动作**全部保留给维护者，W12 只补它们缺的前置条件——在此之前，"归维护者"等于
"到那天现场发明流程"。

| 做了什么                                                                                                                                                                                                                                                                                                            | 读数                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AUD-013-prod**：新增只读预检 `migrations/preflight/000031_preflight.sql`（6 条 SELECT：版本/dirty、死表存在、将销毁行数、替换表存在、替换表行数、样例行）；`migrate_preflight_test.go` 在 schema-30 库造 2 行后逐条断言，再真的应用 000031 验证预测成立；配套 `docs/runbooks/MIGRATION_000031_PRODUCTION_DROP.md` | 用例 PASS；负向 A（第 3 条改 `WHERE 1=0`）红在 `rows_to_be_dropped=0, want 2`；负向 B（embed 模式放宽为 `migrations`）红在隔离断言；整包 `pkg/database` ok 59.7s |
| **AUD-014-followup**：`docs/runbooks/DECOMMISSION_LEGACY_AUTH_ROUTES_2026-12-31.md`，清单精确到文件与行号                                                                                                                                                                                                           | 2 路由 group（`sys` 删完变空整体删 / `systemProtected` 保留 15 条当前接口）、1 中间件 3 符号 2 挂载点、2 CSRF 豁免、2 Casbin case、1 测试文件 3 处、6 文档       |
| **FREEZE-DECLARATION**：`docs/reviews/PANTHEON_BASE_MAINTENANCE_FREEZE_DECLARATION.md`，7 项门槛逐项对应 + 今日实测读数 + 12 条残留归属 + 签署块，**未签署**                                                                                                                                                        | `go test -short ./...` EXIT=0 / ok=47 / FAIL=0；`tsc -b` exit 0；三份新增文档过 4 条文档门禁                                                                     |

**W12 最关键的一条发现**：DROP 与部署不可分离。`PANTHEON_AUTO_MIGRATE=false` 在生产配置里
恰恰是"走版本化迁移"的分支（`main.go:101 → RunMigrations → m.Up()`），而镜像只构建
`./cmd/server`——服务启动那一刻 DROP 就发生，滚动更新时由最先取到 `GET_LOCK` 的 Pod 执行。
所以预检必须在**部署之前**做，而 `k8s/README.md:52` 的 "run migrations manually" 是一个
镜像内没有入口的指示（新登记 `AUD-013-ops-migrate-entry`，P3）。

**W12 的自我更正**：预检解析器初版按字面 `"\n;\n"` 切分，负向验证时文件被写成 CRLF，
解析器把整个文件当成一条语句、报 `parsed 1`。这不是负向验证生效，是解析器对行尾敏感
（Windows 检出即触发）。改为按行锚定的正则后才真正红在行数断言上。

**冻结宣告不能签的真实原因（2026-11-01 当时）**：HEAD `ef00738` 是整改前快照，9 个子包的整改全部未进 `main`。
**2026-11-04 更正**：那次整改已由 #488 进入 main（HEAD `52550603`）。现在不能签的原因换成下一轮：2026-11-03 工作区整改未合并。FE-01b 与 DB-01 注释已在 `2026-11-04-audit-freeze-preconditions` 收口，但仍未提交。见 `docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-11-04.md` §9。

### 当前仍 open 的残留（12 条，3 P2 + 9 P3，均不阻断冻结）

| ID                                     | 级别 | 内容                                                              | 归属   |
| -------------------------------------- | ---- | ----------------------------------------------------------------- | ------ |
| `FREEZE-DECLARATION`                   | P2   | 进入维护冻结的宣告未执行（**文本已就绪**，见下 W12）              | 维护者 |
| `AUD-013-prod`                         | P2   | `000031` 的 DROP TABLE 未在生产库执行（**预检与执行规程已就绪**） | 维护者 |
| `AUD-014-followup`                     | P2   | legacy 认证端点真正下线（2026-12-31，**下线清单已就绪**）         | 维护者 |
| `AUD-001b`                             | P3   | 生成物 `gofmt` 不干净（模板写死对齐空格）                         | 待办   |
| `AUD-001c-ddl`                         | P3   | 生成表 DDL 不在迁移链里，无 down 迁移                             | 待重估 |
| `AUD-013-ops-migrate-entry`            | P3   | `k8s/README` 称可手工迁移，镜像内无该入口（W12 新登记）           | 待决策 |
| `AUD-021b`                             | P3   | `lowcode/templates` 1,894 行死代码                                | 待决策 |
| `AUD-025-review-round`                 | P3   | 143 份逾期 Active 文档需人工复核轮                                | 待办   |
| `AUD-026-race-only` / `AUD-026-stress` | P3   | 竞争仅 `-race` 可见；多实例压测未做                               | 观察项 |
| `AUD-012-ops`                          | P3   | ops 仍保留自有 `usePagination`/`useRequest` 副本                  | 下游   |
| `AUD-001c-ops-doc`                     | P3   | ops 部署手册可能抄了旧表述                                        | 下游   |

### 收口复核推翻并修复的两处（2026-11-01）

1. **W6 的 `000031.down` 重建形状错误（P2）**。初版以"up/down/up 三步 exit 0"为判据，
   但回滚到 v30 的表多了一条 000024 **已删除**的 `idx_permission_role_data_scope_policy_role_key`
   ——回滚后两个租户不能再用同一个 `role_key`。用 `SHOW CREATE TABLE` 逐字节对比
   （"空库直接迁到 30" vs "迁到 31 再回滚到 30"）暴露；已修复并新增
   `TestDropPolicyTableDownReconstructsVersion30Shape`，该用例在缺陷版本上验证过会红。
   **教训：命令能跑通不等于结果是那个结果。**
2. **W6 的 evidence 自述不实（P3）**。`commands.json` 把 `check-evidence --strict` 记为 `passed`，
   实际因缺 `knownGaps` 为 FAIL。已改为如实记录，并写进 `review.md` 的「收口复核的自我更正」。

W1 执行中新增两条未闭合项（已写入任务包 `residualFindings`，不阻断冻结）：

- **AUD-001c（P2）**：`BootstrapFunc → AutoMigrate` 与 `docs/DEPLOYMENT_GUIDE.md:44`「生产环境不得启用
  GORM AutoMigrate」冲突。当前是任务包预先批准的选项之一，但文档未豁免；冻结前择一（文档加例外 /
  改为 Bootstrap 执行显式 `CREATE TABLE IF NOT EXISTS`，仓库先例 `internal/middleware/data_scope_middleware.go:68`）。
- **AUD-001b（P3）**：生成物 `gofmt -l` 列出全部 5 个 Go 文件（模板写死字段对齐空格）。提交时
  lint-staged 会归位，CI gofmt 对 PR 仅报告，不影响构建。

### 本轮数字更正（勿再引用旧值）

- `pantheon-ops` 对 `ProtectedGroup`/`DataScopedGroup` 的调用点 **25 → 14**（13 × `DataScopedGroup` + 1 × `ProtectedGroup`）。
- 下游业务域 `tenant_id` 命中 **0 → 1**（`retired_modules_test.go:110` 的 DDL 测试夹具），`TenantID` 命中 0。
- W9 任务包的 `.env.example` 路径应为仓库根（`backend/.env.example` 不存在）。
- **全仓此前没有任何模块实现 `Bootstrap`**（`grep -rn "BootstrapFunc:\|) Bootstrap(" --include=*.go` 命中 0）：
  AUD-001 的第四重不是“个别模块漏配”，而是生成器与容器契约整体错位。

### 登记时的其余事实

- **基线**：`origin/main` = `bb0498f5`（`VERSION` 0.18.2）。取证快照为工作区 HEAD `ef00738`
  （`fix/release-gate-checks-poll-resilience`，与 main 分叉 5/3）。结构性计数锁定 main；
  构建/测试/门禁读数标注为工作区快照——混用基线是前序两份报告大部分数字冲突的根因。
- **3 项 P1**：AUD-001 生成器产物不可编译且在默认迁移模式下不建表；AUD-002 业务域零租户建模
  而 `README.md:31` 宣称“完整数据隔离”（**已处置**）；AUD-016 `docs/README.md` 的建库与启动命令必然失败。
- **programme**：`.harness/tasks/2026-10-31-audit-remediation-programme/`，含 9 个子包，
  依赖 `W1→W6`、`W2→W3→W4→W5→W8`，W7/W9 独立。
- **7 项冻结门槛**见报告 §13；OIDC（AUD-005）不阻断冻结，决策已落盘（报告 §16.2）。
- **明确不处理**：删除 `pkg/security/ssrf`（base 内 0 引用，但 `pantheon-ops` 有 5 处引用）、
  拆分大组件、为 dashboard 加缓存、合并 `docs/harness` 与 `.harness`、删除历史评审报告、
  补齐全量 `.en.md`、把 7 项 P3 包装成任务。
- **与上一条的字面冲突，说明**：W10 确实为其中 3 条 P3 另立了收口包，这看起来正是"把 P3 包装成任务"。
  区分点是：这三条在 programme 收口时已被**显式登记为 open 的 gap**，收口包只做关闭动作
  （删豁免、加计数、删死语句），不新增任何能力面；且收口后如实登记了三条**新的** P3 残留，
  没有把数量洗成零。审计要防的是"以整改为名扩维护面"，不是"把已登记的 gap 关掉"。
- **门禁读数（2026-11-01 W12 收口后实测）**：`check-task-packet` 95 文件 / 0 error / 14 warning
  （warning 全为历史任务包既存项）；`frontmatter-check` 421 docs / 306 with frontmatter /
  115 不强制 / **143 份 Active 超 90 天（只报告）**；`check-doc-links --strict` 0 findings；
  `check-doc-inventory --strict` 0 findings；`check-evidence --strict` 16 文件 / 0 error；
  `check-review --strict` 16 文件 / 0 error；`check-encoding --strict` 0 findings / 2609 文件；
  `check:search-toolbar-contract` 0 findings / 106 文件；`go build ./...` / `go vet ./...` exit 0；
  `go test -short ./...` EXIT=0 / ok=47 / FAIL=0 / 5 无测试文件；`tsc -b` exit 0。
  `-race` 读数引自 W7 收口（`./internal/middleware/` ok / 0 DATA RACE），W12 未重跑
  ——本机需把 `/d/msys64/mingw64/bin` 放进 `PATH`，这条不属于 W12 的验证范围，不在读数表里冒充。

## v0.18.2 发布（2026-10-31·已发布，以 `origin/main` 为准）

`release/0.18` 线上的补丁版本，tag `pantheon-base-v0.18.2`，目标提交 `bb0498f5`，
`origin/main` 的 `VERSION` = `0.18.2`，发布说明为 `docs/release-notes/RELEASE_NOTES_v0.18.2.md`。

- **为什么是 patch**：无 schema 变化（迁移链仍止于 `000030_tenant_plan_definitions`，schema 30），
  无路由、权限码、菜单键或 i18n key 变化。
- **改了什么**：修复菜单契约传感器与发布门禁；retired-module 菜单过滤改为整句常量匹配。
  `sharedPaths` 由 52 增至 **53**——`frontend/scripts/check-menu-contract.mjs` 声明为共享，
  消费仓在自己的 `prebuild` 里运行它。消费仓可见的变更文件只有两个：
  `frontend/scripts/check-menu-contract.mjs`、`backend/modules/business/retired_modules.go`。
- **为何补写在这里**：本文件此前停在 v0.18.1，而 main 已发 v0.18.2，属 AUD-006 同类的
  “完成态未回写”。版本口径只认 `origin/main` 的 `VERSION`、tag 与发布说明；
  当时本地工作区 `ef00738` 不含该次发布。2026-11-04 的 HEAD 已是 `52550603`，含 v0.18.2 与 #488；判断版本仍只认 `VERSION`、tag 与发布说明，不认未提交工作区。

## v0.18.1 发布（2026-10-29·已发布）

任务包 `2026-10-29-v0181-restore-request-guard`，证据在
`.harness/evidence/2026-10-29-v0181-restore-request-guard/`（含 `notes/` 三份发布文本）。

- **为什么是 patch**：只恢复一行共享导出，不改 API、schema、路由、权限、菜单或 i18n，
  符合 `docs/VERSION_MANAGEMENT_GUIDE.md` §2.3 的 bug fix 定义。
- **问题**：S1 去导出波次（#439，`b0a1952a`）以“零调用方”为由删掉了
  `frontend/src/api/request.ts` 的 `isForbiddenRequestError`，但检索只覆盖本仓；
  `pantheon-ops` 的 `business/deploy/task/DeployTaskDetail.tsx:29` 仍在导入并在 :182 分支。
  对 v0.18.0 重建消费仓时前端构建红在 `TS2614`。
- **修复**：恢复两行导出的谓词，使请求错误谓词族恢复为四成员。
- **登记**：`FR-021`（`maintainability` / `static-sensor-gap`，`guide-updated`），
  `docs/harness/AI_QUALITY_GOVERNANCE.md` 新增 §5.4（删除共享导出前必须做 workspace 级消费引用检索，
  foundation release 必须在消费仓构建通过后才算验证完成）。
- **产物**：四件资产已发布（release 2026-10-29T04:19:38Z），`check-release-assets` 与
  `Foundation Release Verify`（run 40817118092）均通过。
- **消费验证**：`pantheon-ops` 锁推进到 0.18.1，`rebuild:from-base` 组装 756 个文件，staging 后端
  `go build ./...` 为 0、前端 `npm run build` `✓ built in 725ms`。live 树替换与提交属消费仓 L2 门禁。

## v0.18.0 发布（2026-10-29·已发布）

任务包 `2026-10-29-v0180-simplification-release`，证据在
`.harness/evidence/2026-10-29-v0180-simplification-release/`（含 `notes/` 三份发布文本）。

- **为什么是 minor**：`docs/VERSION_MANAGEMENT_GUIDE.md` §2.3 把"架构优化（不影响消费仓）"与
  "治理增强"列为 minor；13 个精简波次是架构优化，发布说明目录化、`.harness/` 月归档与三条新
  失败登记是治理增强；批次里还带着 v0.17.8 之后未发布的租户行为修正（W1 删除归档守卫、
  W2 成员完整性、W4 无角色绑定不发租户上下文、W8 删除未挂载遗留 handler）。因此 `0.18.0` /
  `release/0.18`。
- **范围**：`main` 自 `e256d1fb`（v0.17.8）以来的全部已合并提交——13 个精简波次、W1–W8 租户波次、
  计划阶梯决策 A、S3776 收敛、`go-jose` v3→v4 与 `go-oidc` 3.21.0、发布说明目录化、任务归档。
- **无迁移**：迁移链仍止于 `000030_tenant_plan_definitions`（schema 30）；`sharedPaths` 仍 52 项。
- **产物**：四件资产已发布（release 2026-10-29T03:04:26Z，tag 指向 `b4bb2392`），
  `check-release-assets` 与 `Foundation Release Verify`（run 40810043123）均通过。
- **消费验证**：`pantheon-ops` 锁推进到 0.18.0 后 `rebuild:from-base` 与后端 `go build ./...` 通过，
  但前端构建红在 `TS2614`（`api/request` 缺 `isForbiddenRequestError`），由 `0.18.1` 修复。
- **仍未关闭**：`CODE_SIMPLIFICATION_PLAN.md` §11.6 的三项维护者决策（RC-036/037/038 去留、
  功能冻结、最终验收）。

## 代码精简程序收口（2026-10-29）

任务包 `2026-10-29-simplification-program-closeout`，证据在
`.harness/evidence/2026-10-29-simplification-program-closeout/`；程序级汇总在
`.harness/evidence/2026-10-27-codebase-simplification-program/`。

- **背景**：`2026-10-27-codebase-simplification-program` 的 13 个波次（S1×2、S2×6、S3×3、S4×2）
  在 10-27/28 全部合并，但计划文档 `docs/reviews/CODE_SIMPLIFICATION_PLAN.md:6` 仍写"未执行"、
  `:302` 仍声明"未修改任何业务源码"，程序清单一项未勾，manifest 的 review 链路指向一个
  从未创建的证据目录。
- **收口内容**：计划文档状态行与结尾声明改正，新增 §11 执行记录（13 波实测表、结构指标复测、
  行数窗口口径、RC 覆盖率、未关闭项）；程序证据目录补齐；清单 11 项里勾 10 项。
- **读数**：波次 13/13 `completed`；后端 `go test` **47 ok / 0 FAIL / 6 无测试文件**；
  `ParseUint(c.Param("id")` 35 → 2、分页归一化 13 → 1 + 适配器、`tenantOwnerID` 11 → 0、
  `errParamInvalid` 11 → 0；RC 覆盖 **33/45**（12 条仍属计划里显式的"暂不处理"）；
  `check:task-packet` 警告 15 → **13**（0 error）。行数窗口 backend −847 / frontend −341，
  但窗口含租户功能等净增项，不作为精简收益引用。
- **登记**：`FR-020`（`method-health` / `method-health-gap`，`guide-updated`），
  `docs/harness/AI_QUALITY_GOVERNANCE.md` 新增 §5.3（多波次程序必须独立收口，不能由波次收口代替）。
- **已关闭（2026-10-29）**：`pantheon-ops` 构建验证——`v0.18.0` 发布后暴露 `TS2614`（S1 误删
  `isForbiddenRequestError`），由 `v0.18.1` 以 patch 恢复，消费仓重建后后端与前端构建均通过；
  程序包转为 `completed`，登记 `FR-021` 并新增 `AI_QUALITY_GOVERNANCE.md` §5.4。
- **仍未关闭**：功能冻结决策与 RC-036/037/038 最终去留属维护者；`pantheon-ops` live 树替换属
  消费仓自身评审。

## 已完成任务归档（2026-10-29）

任务包 `2026-10-29-harness-task-archive`，证据在
`.harness/evidence/2026-10-29-harness-task-archive/`。

- **归档读数**：`status: completed` 的 87 个 manifest 与 89 份证据用 `git mv` 落到
  `.harness/archive/<YYYY-MM>/`（176 次移动、0 冲突）。归档总量 116 → 203 个任务、
  120 → 209 份证据；活跃 `.harness/tasks` 只剩 `2026-10-27-codebase-simplification-program`
  （`in-progress`）。
- **引用解析**：移动把 `check:task-packet` 的警告从 42 抬到 86，并让 `check:harness-docs`
  红在三条 `docs/reviews` 链接上。`scripts/task-manifest.mjs` 新增
  `findArchivedReferencePath` / `resolveArchiveAwarePath`，被 `check-task-packet`（`Review File`、
  `Contract Anchors`）与 `check-doc-links` 复用；终态 **14 条警告**（全部真实）与 **0 findings**。
  42 条里有 28 条是 2026-09-25 轮次留下的假警告，因此真实基线是 14 而不是 42。
- **登记**：`FR-019`（`method-health` / `static-sensor-gap`，`sensor-added`）。
- **残余**：`2026-09-10-tenant-verification-and-gray` 的两份 png 是归档后被 #427 写到旧路径的
  重复产物，与归档副本内容不同；两份无归属的 PR 正文同样保留。`check-evidence` /
  `check-review` 的"空集合即报错"语义未改，下一轮全归档会再次触发。

## 主干 Release Gate 转绿（2026-10-28）

`main` 的 `Release Gate` 红在两条 job 上，任务包 `2026-10-28-release-gate-green`，证据在
`.harness/evidence/2026-10-28-release-gate-green/`。

- **基线**：改动基于 `main` @ `cbd37694`——#460（计划阶梯 A）、#462（发布说明目录化）、
  #461（三项 S3 波次）均已合入；本包是该基线之上主干门禁的整改。
- **Dependabot Alerts（1 条 high）**：`GHSA-mgcc-cww5-fp2q` / `CVE-2026-116587` 打在
  `github.com/go-jose/go-jose/v3`。该模块不是直接依赖，而是 `coreos/go-oidc/v3 v3.9.0`
  的传递依赖，v3 线无修复版。处置：`go-oidc` 升 `v3.21.0`（改用 go-jose/v4），锁定
  `go-jose/v4 v4.1.6`；`go.mod` 只剩 `v4.1.6 // indirect`，`go.sum` 不再有 v3 条目。
- **SonarCloud Gate（5 条未处理）**：`go:S1135`（`oidc/handler.go` TODO）、
  `go:S3776`×2（`tenant_isolation_smoke_test.go` 53、`scope_helper_test.go` 22）、
  `godre:S8209`（`TranslateNotFound` 连续同类型参数）、`typescript:S3776`
  （`TenantList.tsx` 16）。全部靠重写代码解决，无 `NOSONAR`、无规则排除、无测试删除。
- **勘误（2026-10-28 合并后复核）**：上述第 5 条当时只有“读起来更简单”的判断、没有复测。
  `main` 在 `1ae6481c`（#463）上的最新分析仍报 `TenantList.tsx:116` 复杂度 16；用同一套
  `sonarjs/cognitive-complexity` 规则复测确认 `can(perm)` 对分值无影响（改前改后都是 16），
  真实贡献项是四态分支链。后续任务包 `2026-10-28-tenantlist-s3776-followup` 提取
  `renderBody()` 后组件 16 → 10、新函数 5；失败模式登记为 `FR-018`，并在
  `docs/harness/AI_QUALITY_GOVERNANCE.md` §5.2 加“静态分析类修复须同规则复测”的规则。
- **终态（2026-10-28 15:0xZ 观测）**：`fix/tenantlist-cognitive-complexity` 以 PR #464 压缩合并为
  `7ceee624`，`main` 上 `Release Gate` run `40711689652` **全部 success**（Open PRs / Dependabot
  Alerts / CodeQL Alerts / Candidate Checks / SonarCloud Gate / Release Gate Summary）；
  SonarCloud `main` 未解决 issue **0**，Dependabot open alerts **0**。此前 #463 之后的
  run `40704728582` 仍是 failure（Dependabot 竞态 + TenantList 16），现已由下一次 push 覆盖。
- **验证读数**：`gofmt` 干净；`go vet`/`go build` 通过；`CGO_ENABLED=1 go test -race ./...`
  **47 包 ok / 0 FAIL / 6 包无测试文件**（本机需 `mingw64/bin` 在 `PATH`，否则 cgo.exe exit 2）；
  `govulncheck`：代码受影响 0 条（另有 3 条在 `x/net`/`x/crypto` 的非调用路径上，Dependabot
  侧未开告警）；前端 `eslint` / `tsc -b` / `vite build` 全过。
- **残余 gap（显式）**：SonarCloud 与 Dependabot 的放行只能在合并进 `main` 后的下一次分析/告警
  刷新中观测，本地无法复现；两租户隔离冒烟在本机无 MySQL DSN 时 SKIP，由 CI
  `PANTHEON_TEST_DSN_REQUIRED=true` 承担运行读数。

## v0.17.8 发布（2026-10-27）

base 自有依赖漏洞关闭与 Sonar 归属勘误，任务包 `2026-10-27-v0178-dep-vuln-closure`，证据在
`.harness/evidence/2026-10-27-v0178-dep-vuln-closure/`。

- **修复内容**：`VERSION` → 0.17.8，关闭 base 自有的依赖漏洞告警；随包落地两项勘误——
  ①Sonar 归属：残留备注/README（zh/en）/summary/review 原写「两仓 SonarCloud Scan 红」，
  实际 base 无扫描器工作流、`e256d1fb` 上两个 Sonar check-run 全绿，base main 为
  未解决 issue 0 / 门 OK，红的是消费仓（ops main 249 / 门 ERROR）与凭据侧；
  ②`check-runtime-evidence --strict` 在 `#431` 落地后对 main 报 1 warning，已修复。
- **发布事实**：PR #433 squash 合并为 `e256d1fb`（`2026-10-27T07:47:04Z`），Release Gate run
  `40469207830` 六 job 全绿；annotated tag `pantheon-base-v0.17.8`（tag object `8f85982a`）指向
  `e256d1fb`；Release 于 `2026-10-27T08:17:19Z` 发布（非 draft、非 prerelease），四件资产齐备
  （tgz 29,072,437 B `e1ec60df…`、repo.tar 45,772,800 B `51674048…` + 两个 .sha256）；
  secret scan clean（3284 文件，两种归档均解开读取）；`check-release-assets` 本地与远端一致；
  `Foundation Release Verify` run `40472462712` success。

## v0.17.7 发布（2026-10-27）

`pantheon-ops` PR #149（消费 v0.17.6）五条红灯中三条属 base 自有文件
（`setting_service.go`、`logger.go`、`tenant-matrix-fixture-setup.mjs`），按
`.foundation/allowed-drift.json`「generic drift 不允许、必须回流 base」的规则在 base 修复，
任务包 `2026-10-27-v0177-lint-codeql-closure`，证据在
`.harness/evidence/2026-10-27-v0177-lint-codeql-closure/`。

- **修复内容**：三条 lint / CodeQL 发现全部清零；决定性读数 `golangci-lint run
--new-from-rev=main ./...` 0 issues；`go test -run Sanitize ./pkg/logging/...` ok。
- **环境限制**：本机 Windows 无法跑 `go test -race`（cgo disabled），race 读数由 CI Linux 承担。
- **发布事实**：PR #430 squash 合并为 `2091a2d8`（"chore(release): publish v0.17.7 foundation
  materials"）；tag `pantheon-base-v0.17.7` 指向 `2091a2d8`（**lightweight tag**，非 annotated——
  与 v0.17.6/v0.17.8 的 annotated 形态不同，如实记录）；Release 于 `2026-10-27T04:52:26Z` 发布
  （非 draft、非 prerelease），四件资产齐备。

## v0.17.6 发布（2026-10-27）

租户运营「B 方案 · 要做就做彻底」的读侧与信息架构收口，连同登录页无障碍与样式微调、
治理红灯（G-03/G-04/G-05）一起合入主干（PR #427 → `c1b1d702`），任务包
`2026-10-27-v0176-release-closeout`，证据在 `.harness/evidence/2026-10-27-v0176-release-closeout/`。

- **套餐落库（P1）**：新表 `tenant_plans`（平台全局，无 `tenant_id`）取代散落在代码里的
  阈值常量；迁移 `000030_tenant_plan_definitions` 把 schema 从 29 升到 30。`-1` 表示不限，
  `0` 被服务层拒绝为无效阈值；`planCodePattern` 为 `^[a-z][a-z0-9_-]{1,31}$`。种子按 code
  守卫、从不 UPDATE，已有编辑值不会被覆盖；退役口径是 `status = 'disabled'`，仍被引用时
  以 `ErrPlanInUse` 拒绝。down 迁移是 `DROP TABLE`，会丢失编辑值，需先演练。
- **租户运营读侧（P1）**：`tenant.TenantPlan` 更名为 `tenant.Plan`；5 条新路由对应 5 个新
  权限码，配套菜单 seed。总览 / 租户管理 / 成员与配额三页信息架构接通。
- **配额语义（P2，显式）**：只展示、不强制 —— 后端不按套餐拒绝请求。这是本轮拍板的边界，
  不是遗漏。
- **登录页（P3）**：左右分栏均分、主题与语言控件绝对定位到右上角、移动端视口重排；
  Ghost Hover、Tab/Enter 键盘路径。「忘记密码」按维护者决定不做，重置密码由管理员执行。
- **验证**：全量真库套件 46 包 ok / 0 FAIL / 0 SKIP；`golangci-lint run --new-from-rev=main
./...` 0 发现；前端 `tsc -b`、`eslint --max-warnings 0`、`vite build` 干净，14 项 prebuild
  契约全过；治理链全绿（boundary 两种形态、runtime evidence 56 文件 0/0、inheritance
  `--root ..` 0 findings）。
- **环境限制**：本机 Windows TSan 仍 error 87，`-race` 由 CI Linux 承担；生成器用例需要
  `PANTHEON_NODE_BIN` + `PANTHEON_WORKSPACE_ROOT`（F5），否则 16 个用例以
  `module.generate.server_export_failed` 失败，与产品无关。
- **发布事实**：发布材料 PR #428 于 2026-10-27T01:15:41Z squash 合并为 `c9bc6c0f`，五个必需
  context（`Quality Gates`、`Security Gates`、`Unit Tests`、`CI Summary`、`SonarCloud Code Analysis`）
  全绿；`Release Gate` run `40431521256` 在 `c9bc6c0f` 上 success，其中 `SonarCloud Gate` 读到该
  提交的分析 `OK`、`Duplication Gate` success。annotated tag `pantheon-base-v0.17.6`（tag object
  `2bc79966`）指向 `c9bc6c0f`，GitHub Release 于 2026-10-27T01:39:12Z 发布（非 draft、非 prerelease），
  四件资产齐备（tgz `dbf1edd8…f362e35`、repo.tar `7a44e9ce…8fda645d`）；release secret scan
  `clean (3232 files scanned)`，`check-release-assets` 本地与远端一致，`Foundation Release Verify`
  run `40433836341` success。SonarCloud main 当前未解决 issue 0、质量门 OK（New Duplicated Lines
  1.9%，阈值 ≤3%）、CodeQL open alert 0。

## v0.17.5 发布（2026-10-24）

v0.17.4 发布后登记了 5 项 IAM 残留，修复随 PR #420 合入主干（`45aa7389`），任务包
`2026-10-23-iam-race-closeout`，证据在 `.harness/evidence/2026-10-23-iam-race-closeout/`；
发布材料任务包 `2026-10-24-v0175-release-closeout`。

- **同租户 provisioning 串行化（P2）**：`ProvisionTenant` 先 `SELECT ... FOR UPDATE` 锁
  `tenants` 行，角色与管理员用 `ON DUPLICATE KEY UPDATE` 写入并以 locking read 读回；根部门、
  绑定与成员关系在同一租户锁下收敛。平台默认配置/字典拷贝改到同一租户锁的第二个事务执行，
  `system_dict_item` 无唯一键也不会重复。
- **replace 式授权串行化（P2）**：`replaceRolePermissions` / `replaceUserRoles` 先锁
  `system_role` / `system_user` 父行再删除重插；后写者的完整集合胜出，不再合并或死锁。
- **历史权限行修复（P2）**：bootstrap 回填先删除会撞 `uk_role_permission_tenant` 的旧副本，
  再把剩余 `tenant_id = 0` 行回填到角色所属租户；平台行与软删角色行不动，重复执行幂等。
- **race 门禁证据（P2）**：本机 Windows TSan 仍无法启动（error 87）；CI run `39970863908`
  的 Backend Tests 在最终提交上通过 `go test -race ./...`（Linux、MySQL 8、Redis）。
- **v0.17.3 说明勘误（P3）**：仓库文件与可变 GitHub release body 追加带日期的更正块；已发布
  tag 与资产保持不可变。
- **reduced-motion 门禁阻塞（P3）**：发布材料合并后 `Release Gate Summary` 被 SonarCloud
  `css:S9440` 的两个既有未解决 issue 拦下。组织架构卡片与顶部菜单的 `transition` 移入
  `@media (prefers-reduced-motion: no-preference)`，默认视觉不变、偏好减少动效的用户不再触发
  过渡；规则与 Sonar 配置未改，issue 在代码层清零。
- **范围**：无 schema 变更（仍为 29）、无路由/权限码/菜单 seed/错误信封变化；前端只增加媒体
  查询守卫。竞争下的锁等待超时沿用既有事务错误，不新增响应形状。
- **验证**：全量真库套件 46 包 ok / 0 FAIL / 0 SKIP；新增用例在修复前分别以唯一键重复、
  NOWAIT 探针未报错、`elements differ` 失败；前端 Prettier、UI/Shell 视觉契约、`vite build`
  通过，Chromium 实测 reduce 下 `transition-duration` 为 `0s`、默认 `0.18s`；SonarCloud
  Quality Gate OK（New Code Duplication 0.0%）；修复合并后 SonarCloud 对 `main@ed636967`
  的分析未解决 issue 为 0，`css:S9440` 两处已关闭。
- **发布事实**：PR #422 合并为 `ed636967`，`Release Gate` run `40046885713` 成功；annotated tag
  `pantheon-base-v0.17.5`（tag object `42495b25`）指向 `ed636967`，GitHub release 于
  2026-10-24T01:13:53Z 发布，四件资产齐备（tgz `33b6e78a…`、repo.tar `788bd97f…`）；release
  secret scan 扫描 3126 个文件为 clean，`check-release-assets` 一致，`Foundation Release
Verify` run `40048834275` 成功。

## v0.17.4 发布（2026-10-23）

v0.17.3 的 known-residual 只登记了「`system_role_data_scope` / `system_role_permission`
写入仍先查后插」。按实际代码复核后范围更大，且有一项从未登记。修复随 PR #417 合入主干
（`a9fffac8`），任务包 `2026-10-23-iam-residual-closeout`，证据在
`.harness/evidence/2026-10-23-iam-residual-closeout/`；发布材料任务包
`2026-10-23-v0174-release-closeout`。

- **用户 CSV 导入跨租户读写（P1）**：同名用户、角色 key、部门路径、岗位编码四类查找
  全部按调用方租户过滤；导入建号从请求上下文写入 `tenant_id`，并在同一事务写入 active
  membership。修复前租户 A 的导入会更新租户 B 的同名用户，新建用户落进平台命名空间、
  导入者不可见且无法登录。
- **重复键竞态（P2）**：`CreateUser` / `CreateRole` / `UpdateRole` 的事务错误经
  `database.IsDuplicateKey` 整形为既有 409（`user.create.error.username_exists` /
  `role.key.exists`），不再把 MySQL 1062 当 500 抛出。
- **授权写入幂等（P2）**：`grantTenantRolePermissions` / `grantTenantRoleMenus` 改为批量
  `CreateInBatches` + `clause.OnConflict{DoNothing:true}`；读仅作快速路径，复合唯一键仲裁。
- **bootstrap 回填归属与去重（P2）**：`backfillRolePermissions` join `system_role` 取
  `tenant_id`、显式排除软删除角色、按 `(tenant_id, role_id, permission_key)` 去重后批量写入。
  修复前租户角色的权限行全部写成 `tenant_id = 0`，同一 key 被多个菜单暴露时重复 seed。
- **范围**：无 schema 变更（仍为 29）、无路由/权限码/菜单 seed/错误信封变化；唯一响应变化
  是竞态输家由 500 变为既有 409。全量真库套件 46 包 ok / 0 FAIL / 0 SKIP；新增用例单独
  运行通过，coverprofile 命中重复键分支。
- **环境限制**：本机 TSan 影子内存分配失败（error 87），`-race` 本地未运行，由 CI Linux
  的 race 门禁承担。
- **发布门禁**：合并提交 `ac813f6f` 上的 `Release Gate Summary` success（run `39951900733`）。
- **发布事实（2026-10-23T12:38Z）**：annotated tag `pantheon-base-v0.17.4`（对象 `b1e8fc4b`）指向
  `ac813f6f`；GitHub Release 非 draft / 非 prerelease，四件资产齐全。
  - 打标前凭据预检：`clean (3108 files scanned)`，`bundle/` 与 `repo.tar` 都已打开。
  - `foundation-release-pantheon-base-v0.17.4.tgz` sha256 `339a9a89252b…f9975ce53d`
  - `repo.tar` sha256 `bcc0250a8c1c…7843476f`
  - `check-release-assets`：本地 bundle 与远端四件资产一致；`Foundation Release Verify`
    （run `39954843594`）success。

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

| 状态      | 说明                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✅ 已完成 | 全部历史任务 + 2026-10-07 整改任务包 + v0.15.0/v0.16.0 发布收口                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ✅ 已完成 | v0.16.1 发布收口（`2026-10-12-v0161-release-cut`，四件产物已发布并过 Verify；全自动发布待 PAT secret）                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ✅ 已完成 | v0.17.0 发布收口（`2026-10-22-release-and-residual-closeout`，F5/F2/B10/G2/D2 + 浏览器验收）                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ✅ 已完成 | 租户权限隔离整改（`2026-10-19-tenant-permission-isolation-remediation`，W0–W6 全部完成 + F14 收口后关闭，**零残留**）                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ✅ 已完成 | 全局代码精简审计（2026-10-27，只读，结论 **LEAN-WITH-DEBT**；产出 `docs/reviews/CODEBASE_SIMPLIFICATION_AUDIT.md`、`REDUNDANT_CODE_CANDIDATES.md`、`CODE_SIMPLIFICATION_PLAN.md`）                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ✅ 已完成 | v0.17.6 发布收口（`2026-10-27-v0176-release-closeout`，tag→`c9bc6c0f`，四件资产 + Verify 核验）                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ✅ 已完成 | v0.17.7 发布收口（`2026-10-27-v0177-lint-codeql-closure`，三条 base 自有 lint/CodeQL 发现回流修复，tag→`2091a2d8`，四件资产）                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ✅ 已完成 | v0.17.8 发布收口（`2026-10-27-v0178-dep-vuln-closure`，依赖漏洞关闭 + Sonar 归属勘误，tag→`e256d1fb`，四件资产 + Verify run 40472462712）                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ✅ 已完成 | 主干 Release Gate 转绿（`2026-10-28-release-gate-green`，go-jose/v3 经 go-oidc v3.21.0 迁到 v4.1.6，5 条 Sonar 未处理项整改；本地 `-race` 47 包绿、前端三命令绿；Sonar/Dependabot 放行待合并后观测）                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ✅ 已完成 | TenantList S3776 复测修正（`2026-10-28-tenantlist-s3776-followup`，#463 关于 `can(perm)` 清除该发现的结论被复测推翻；四态分支链提取为 `renderBody()`，同规则 16 → 10、新函数 5；PR #464 → `7ceee624`，`Release Gate` run 40711689652 全绿、Sonar `main` 未解决 0、Dependabot open 0；`FR-018` + 治理指南 §5.2 复测规则）                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 🚧 进行中 | 代码精简与横向重复收敛（`2026-10-27-codebase-simplification-program`：**S1×2 已完成**（#438 #439，其中 dead-code 波实测 **19 文件 +0/−1923** 纯删除）、**S4 已完成**（#441，五项治理面决策落档 `docs/reviews/GOVERNANCE_SURFACE_DECISIONS_2026-10-27.md`；follow-up 别名删除波 #447 实测 **re_export.go 112→52 行**，删十个零消费别名、全量 46 包绿）；**S2 已完成 6/6**（#450 共享 helper 五件、#451 id-parse 27 站点迁移、#452 pagination-sort 13 分页 + 8 sort normalizer 迁移，实测内联白名单 8→0、钳制 11→1、内联 Offset 14→4、#454 error-mapping dedup（20 重复错误声明收敛到共享常量、gorm not-found 翻译收敛到 `database.TranslateNotFound`、context helper 三重复制归一，净 −82 行）、#455 batch-and-envelope 零代码差收口（RC-023 已由前波收敛、RC-025 表面已随租户波删除、RC-030 证伪为 WithDataScope 谓词）、#456 import-export pipeline（8 导入端点 7 模块收敛到 `impexp.ReadImportCSV` + 四个服务原语 + `BuildImportTemplate`，逐模块 commit 阶梯，validation inventory 全量记账，CSV 公式注入行为 golden 锁定，活体 API smoke 11/11）；原三项维护者门禁（RC-016 standalone-PR、error-mapping 批准、batch 收口确认）按维护者 2026-10-28 全权委托执行，全部以 evidence + strict 校验落档；smoke 指南 §1 role「仅导出」文档漂移随本条一并修正）；S3×3 已完成（2026-10-28，见下节「代码精简 S3 收口」）——programme 规则要求 S2 稳定一个发布周期（foundation release）后才可开工，该排期门禁由维护者 2026-10-28 直接指令覆盖，release 切割仍属 do-not-touch、待维护者决定；setting_audit 钳制语义分歧与 tenant member 分页（W9）仍为显式维护者决策；双语 checker 接 CI 待批准。登记债务②（三份存量 review.md 缺 Machine Readable 块）已随 #448 关闭，全量 `.harness/evidence/*/review.md` strict 0 error） |
| ✅ 已完成 | 租户功能完整性复核（2026-10-27，只读，前后端 + 租户运营；结论：单租户路径可用，**"租户开发已完成"不成立**；1 P1 / 2 P2 / 6 P3；产出 `docs/reviews/TENANT_FUNCTIONAL_COMPLETENESS_REVIEW_2026-10-27.md`）                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ✅ 已完成 | 租户完整性整改（`2026-10-27-tenant-completeness-remediation`，8 个波次 **W1–W8 全部完成**（#436 / #434 / #440 / #442 / #443 / W6 控制台 spec #459 / W7 决策包 / #445）；W3 决策 A、W7 决策 A、W6 的 report-only 门禁默认均按 maintainer-delegated 记录，详见下节各收口段）                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ⏸️ 暂停   | 无                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

## 代码精简 S3 收口（2026-10-28）

维护者 2026-10-28 直接指令完成三项剩余 S3 波次；programme 的「S2 稳定一个 release 周期」排期门禁由该指令覆盖（release 切割仍属 do-not-touch）。三项均带 task packet、evidence、review。

- **`2026-10-27-s3-tenant-scope-unification`（P1，RC-012/RC-027）**：11 个 system service + 3 个 auth service 的三件套收敛到 `backend/pkg/tenant.Scoper` / `OwnerTenantID`；生产代码 25 文件 +267/−364（含新 helper 净 −44），新增离线 SQL 快照测试（nil/compat/multi 三上下文）与两租户隔离冒烟（11 service）。本地无 MySQL DSN → 冒烟 skip，CI 以 `PANTHEON_TEST_DSN_REQUIRED=true`（`ci.yml:143,332`、`quality.yml:362`）承担运行读数。setting 覆盖叠加全局、dashboard 表白名单、login Runtime 组合根为有意保留的变体。证据：`.harness/evidence/2026-10-27-s3-tenant-scope-unification/`。
- **`2026-10-27-s3-oidc-envelope`（P3，RC-026）**：六处裸 `c.JSON` 逐条对照 RFC 6749 §4.1.1/§4.1.2.1 与实际消费方分类——无一属协议 JSON 体，且模块处于休眠（包外 0 引用、无路由、无前端消费方）→ **全部保留原样**并逐处注明契约；diff 仅注释 +13/−0。分类表：`docs/reviews/OIDC_RESPONSE_CONTRACT_2026-10-27.md`。运行态 gap：无 IdP、未挂路由，登录往返留待 SSO 接入波次。
- **`2026-10-27-s3-role-data-scope-model`（P3，RC-022）**：两份 role data-scope 模型逐字段逐 tag 完全一致 → 删除 role 侧镜像，改指 `permission.PermissionRoleDataScopePolicy`；`go list -deps` 证明 permission 不依赖 role（无环），delete 路径仍写同一组表，零 DDL/迁移/data-scope 行为变更。schema-vs-model 的索引命名与遗留列差异已记录、归迁移治理包。证据：`.harness/evidence/2026-10-27-s3-role-data-scope-model/`。
- **`2026-10-28-plan-ladder-option-a-impl`（W7 实现）**：已随 PR #460（`a053805b`）合并，manifest 状态翻为 completed。

programme 本体仍为进行中：完成清单中的 foundation release 切割与 pantheon-ops 对同步后 foundation 的构建验证属 release/外仓门禁，未在本轮范围内。

## 租户权限隔离整改（2026-10-19，已收口）

2026-10-19 的租户交付验收在实机跑了 193 项断言，通过 179 项（92.7%），留下 13 个缺陷、其中 **5 个 P0**。
5 个 P0 不是五个独立 bug，而是**一个同源缺陷簇的三层表现**：`role_key` 被当成跨租户全局命名空间。
`system_role` / `system_role_permission` / `system_role_data_scope` 三张表都已带 `tenant_id` 与
`(tenant_id, role_key)` 唯一键，但读写链路上有一半入口退化成按 `role_key` 单键工作，写入端还把租户值丢成 `tenant_id = 0`。

- **父任务**：`.harness/tasks/2026-10-19-tenant-permission-isolation-remediation/`（`status: completed`）
- **计划文档**：`docs/harness/tasks/2026-10-19-tenant-permission-isolation-remediation.task.md`
- **基线证据**：`.harness/evidence/2026-10-19-tenant-permission-isolation-remediation/`（`baseline-findings.md` / `review.md` / `commands.json`）
- **缺陷簇**：F7 F8 F9 F10 F11 F13（数据范围租户维度）+ F3（角色菜单授权落库）+ F1 F4（租户自助开通）+ F2（登录黑名单）+ F5 F6（控制台）

| Wave | 任务包                                        | 关闭缺陷                                    | 状态                         |
| ---- | --------------------------------------------- | ------------------------------------------- | ---------------------------- |
| W0   | `2026-10-19-w0-isolation-contract-guardrails` | 契约条款 + 双租户红用例                     | ✅ completed                 |
| W1   | `2026-10-19-w1-data-scope-tenant-dimension`   | F7 F8 F9 F10 F11 F13                        | ✅ completed                 |
| W2   | `2026-10-19-w2-tenant-user-onboarding`        | F1 F4                                       | ✅ completed                 |
| W3   | `2026-10-19-w3-role-menu-grant-persistence`   | F3                                          | ✅ completed                 |
| W4   | `2026-10-19-w4-session-revocation-login-gate` | F2                                          | ✅ completed                 |
| W5   | `2026-10-19-w5-tenant-console-ux`             | F5 F6                                       | ✅ completed                 |
| W6   | `2026-10-19-w6-reverification-closeout`       | 全量 193 项复跑 + 收口                      | ✅ completed                 |
| W6+  | 收口后跟进                                    | F14（P2 错误码整形 → `404 role.not_found`） | ✅ closed，34/34 零 findings |

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

## 租户完整性整改（2026-10-27，已收口：W1–W8 全部完成）

2026-10-27 的租户功能完整性复核（前后端 + 租户运营，只读）结论：**单租户部署路径功能完整可用**，
原生租户用户端到端有 e2e 证据；但**"租户开发已完成"不成立**——跨租户 membership 可登录不可用，
删除租户可绕过归档校验，成员写入不校验用户存在。8 个波次如下；**W1–W8 全部完成**
（2026-10-28 收口）。W7 决策 A 已签字（2026-10-28，maintainer-delegated，见下）；W6 的
smoke-tenant 门禁按包内默认（保持 report-only）处置，同样记录为 maintainer-delegated。

- **父任务**：`.harness/tasks/2026-10-27-tenant-completeness-remediation/`（`status: completed`）
- **计划文档**：`docs/harness/tasks/2026-10-27-tenant-completeness-remediation.task.md`
- **复核报告**：`docs/reviews/TENANT_FUNCTIONAL_COMPLETENESS_REVIEW_2026-10-27.md`

| ID    | 级别 | 缺陷                                                                                                                                                                                                                                    |
| ----- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TC-01 | P1   | 跨租户 membership 只给登录，不给任何授权（角色绑定按属主租户落库）                                                                                                                                                                      |
| TC-02 | P2   | `DeleteTenant` 守卫为 `memberCount > 0 && status != archived`，删光成员即可绕过归档                                                                                                                                                     |
| TC-03 | P2   | `AddMember` 不校验用户存在且无外键，幽灵 owner 可满足"最后 owner"不变量；UI 填裸 id                                                                                                                                                     |
| TC-04 | P3   | 租户控制台无 UI 自动化；登录选择租户的 e2e 只断言 shell 渲染                                                                                                                                                                            |
| TC-05 | P3   | `TENANT_API.md` 文档化未挂载的 `/members/page`，增删改响应示例与真实 envelope 不符                                                                                                                                                      |
| TC-06 | P3   | `MemberUsageQuery.status` 类型与 UI 实际发送值不一致，靠 cast 掩盖                                                                                                                                                                      |
| TC-07 | P3   | 前端 plan 门槛写死四档，自定义 plan code 一律归一为 `free`（具体后果：trial 租户看不到生成器页）。**代码已三处自述**（`planOptions.ts:4-20`、`TenantList.tsx:256-260`、`outsideLadder` 警告），属已文档化的限制，缺的是"后果"与契约表述 |
| TC-08 | P3   | `tenant_handler.go` / `tenant_routes.go` / `tenant_bootstrap.go` 零引用，且残留旧文档口径                                                                                                                                               |

| Wave | 任务包                                             | 级别 | 状态                                     | 依赖        |
| ---- | -------------------------------------------------- | ---- | ---------------------------------------- | ----------- |
| W1   | `2026-10-27-tenant-delete-archive-guard`           | P2   | **completed**（PR #436）                 | —           |
| W2   | `2026-10-27-tenant-member-integrity`               | P2   | **completed**（PR #434）                 | —           |
| W3   | `2026-10-27-tenant-multi-membership-decision`      | P1   | **completed**（PR #440，决策 A 签字）    | —           |
| W4   | `2026-10-27-tenant-multi-membership-authorization` | P1   | **completed**（PR #442）                 | W2、W3 签字 |
| W5   | `2026-10-27-tenant-contract-docs-alignment`        | P3   | **completed**（PR #443）                 | W1、W2、W4  |
| W6   | `2026-10-27-tenant-console-ui-automation`          | P3   | **completed**（PR #459）                 | W1、W2、W4  |
| W7   | `2026-10-27-tenant-plan-ladder-decision`           | P3   | **completed**（决策 A 签字，2026-10-28） | W5          |
| W8   | `2026-10-27-tenant-dead-surface-removal`           | P3   | **completed**（PR #445）                 | W5          |

**W2 收口（2026-10-27，PR #434）**：`AddMember` 现在要求 `user_id` 指向未软删除的 `system_user`，
未知 id 返回 envelope `404 / user.not_found`；`ensureNotLastOwner` 改为 join `system_user` 并要求
未删除 + enabled，幽灵 owner 与停用账号都不再能满足「最后一个 owner」不变量；成员对话框从裸 id
输入换成有界（一页 50 条、本地过滤已在册成员）的可搜索选择器，视角与目标租户不一致时显式提示。
存在性校验**不按 `tenant_id` 过滤、不看 `status`**，因为跨租户成员策略属 W3/W4，且 bootstrap 迁移
本就往默认租户写非本租户用户——这条边界由 `TestAddMember_DoesNotDecideCrossTenantMembership` 钉住，
W4 必须显式修改它。验证：租户包 100 顶层 + 27 子测试 / 0 skip，后端全量 46 包 ok，前端 14 项契约
检查 + 230 vitest + 3021×5 i18n key 全绿；红/绿差分只回退两个生产文件即让 4 条新用例必红。
证据：`.harness/evidence/2026-10-27-tenant-member-integrity/`。

**W1 收口（2026-10-27，PR #436）**：删除守卫改为 `status != archived` 即拒绝（400
`tenant.not_archived`），成员数不再参与判定——删光用户绕过归档的路径封死；平台与 legacy
两个 handler 都注册该码，控制台对非归档行禁用删除入口；契约 §2.1 条文不变、§5 登记
V1.6。证据：`.harness/evidence/2026-10-27-tenant-delete-archive-guard/`。

**W3 收口（2026-10-27，PR #440）**：跨租户 membership 语义按**选项 A（收窄）**决策——
角色绑定只从属主租户落库，跨租户 membership 永远是零角色上下文；决策文档
`docs/reviews/TENANT_MULTI_MEMBERSHIP_DECISION_2026-10-27.md` 签字（maintainer-delegated
记录），W4 据此启动。证据：`.harness/evidence/2026-10-27-tenant-multi-membership-decision/`。

**W4 收口（2026-10-27，PR #442）**：单一谓词 `pkg/tenant.HasRoleBindingInTenant`
（fail-closed）贯穿登录发现（先过滤再判歧义）、候选列表、可切换列表；`GateSessionIssuance`
在 `EnsureTenantLoginable` 之后追加角色存在性检查；`SwitchSessionTenant` 在重盖会话前拒绝
空角色目标；`AddMember` 以 `userOwnedByTenant` 收窄并登记 `400 tenant.member.user_not_in_tenant`
（契约 V1.7）；登录租户选择器与 TenantSwitcher 按构造不可渲染而移除，端点保留为过滤后的
兼容面。第一轮 CI 抓到两个 premise 遗漏（attribution / F1 测试），已补种子并全量 `./...`
重跑绿——教训与证据见 `.harness/evidence/2026-10-27-tenant-multi-membership-authorization/`。

**W5 收口（2026-10-27，PR #443）**：文档对齐已交付面——TENANT_API.md 四个响应
示例对齐真实信封、未挂载的 `/members/page` 别名段删除；`MemberUsageQuery.status` →
`'active' | 'disabled'`（与 UI 发送值、后端 binding 三方一致）并移除掩盖 cast；
MULTI_TENANT_DESIGN.md 标注视野文档 + 「not in V1」清单；契约 §2.2 owner 转移改写为
两步落地路径（无单一端点），V1.8 追加登记 W2 两个错误码。W4/W5 分支堆叠产生的
契约冲突（main 侧 W4 squash vs 分支侧 V1.8 追加）已按分支侧合并解决。证据：
`.harness/evidence/2026-10-27-tenant-contract-docs-alignment/`。

**W8 收口（2026-10-27，PR #445）**：死入口删除——`tenant_handler.go` /
`tenant_routes.go` / `tenant_bootstrap.go` / `tenant_handler_test.go` 四文件
+0/−783 后零引用（五位置搜索：backend 源码/测试、frontend、scripts+CI、
pantheon-ops 覆盖层，后者为继承副本见下）；`parseTenantMemberPagination`
原样迁入 platform handler（挂载路由唯一调用方，编译强制，偏差已记录）；
五个存活断言全部迁至 `PlatformHandler` 或 service 层（envelope/无泄漏/哨兵映射

- 两个分页契约改写到挂载路由 + 平台信封），夹具全部真实 `system_user` 行；
  TENANT_MATURITY_FINAL §4 订正四个 bootstrap 入口为「未接线、已删除」。
  验证：租户包 126 pass / 0 skip / 0 fail（基线 119 同口径），后端全量 exit 0。
  证据：`.harness/evidence/2026-10-27-tenant-dead-surface-removal/`。

**登记的后续债务（随 W8 发现）**：① pantheon-ops 继承了四份已删文件的副本
（独立 go.mod、无交叉引用），按 base-first 规则不在 ops 直改，待下次
foundation release 同步清理——runbook 需确认对上游删除文件的同步语义
（仅覆盖不删除则死副本会残留）；② ~~存量证据三份 review.md
（`s1-api-surface-narrowing` / `s1-dead-code-removal` / `tenant-delete-archive-guard`）
缺 `## Machine Readable` JSON 块，本地 `check-review.mjs --strict` FAIL~~
——**已关闭（2026-10-28）**：三份 review.md 已补 `## Machine Readable` 块
（verdict approved，与各自 prose verdict 一致），全量 `.harness/evidence/*/review.md`
strict 检查 0 error；随小 PR 合入。

**维护者门禁**：W3 的 A/B/C 决策已按选项 A 签字（maintainer-delegated 记录）；
W1 的契约表述按「修订契约承认实现」处置（V1.6）；W4 的 UI 移除作为决策 A 推论按
maintainer-delegated 记录；W6 的 `smoke-tenant` 阻断与否按包内默认处置——**保持
report-only**，新 spec 照常随 `npm run test:smoke:tenant` 进 job（maintainer-delegated，
2026-10-28）。**无剩余待签**；8 波全部派发并收口。

**W7 收口（2026-10-28，决策波）**：套餐能力阶梯语义按**选项 A** 签字（maintainer-delegated，
`docs/reviews/TENANT_PLAN_LADDER_DECISION_2026-10-28.md`）——能力矩阵只覆盖内建四档
（`plans.ts` rank 0-3、`normalizeTenantPlan` fail-closed 归 free），自定义 plan code 就是
配额桶（配额权威本就在 `tenant_plans` 表，`tenant_plan_model.go` quota 字段），要修的只是
后果未告知：A 的实现 = `outsideLadder` 警告补后果一句（五语言）+ 设计文档/合同 §2.4 相邻处
写明边界，随后续 L1 小 PR 落地（**已落地，PR #460**：五语言补「lowcode 门控面不可见」后果句 +
合同 §2.4 新增「前端能力矩阵边界」段、§9 记 V1.9 澄清；设计文档 MULTI_TENANT_DESIGN.md 无
套餐章节——vision 文档且层级从属合同，规范表述落合同，路径修正随本 PR 记录），不计入 V1
完成度；B（服务端 entitlements）登记为 V2
商业化工作流（唯一保留自定义 code 完整能力的方案，唯一需迁移的方案，立项时新建包）；
C（移除门控）否决（把付费 lowcode 面开放给所有持页面权限租户，是产品能力回退）。
证据：`.harness/evidence/2026-10-27-tenant-plan-ladder-decision/`。

**W6 收口（2026-10-28，测试波）**：控制台 Playwright spec
`frontend/tests/smoke-core/tenant-console.spec.ts` 六用例——列表渲染、创建+初始管理员、
编辑改名/换套餐、W1 生命周期门禁（停用禁删 → 归档可删，走真实 SecondaryVerifyModal
敏感操作流）、W2 成员对话框（固定租户视角 → 最后 owner 拒绝 → 选择器移除后重加）、
运营总览 + 套餐编辑器（自定义 code 创建/分配/占用禁退/退租后可退）；数据全部自建自清
（时间戳后缀 + afterAll 归档删除/plan 退场），不触碰隔离 spec 共用的 matrix 对。
随波修复两处存量红灯（report-only 从未拦截）：hostile-matrix spec 的 `/auth/current`
改为挂载路由 `/auth/tenants/current`（W4 强化断言首次真正跑绿）+ 后端同源注释勘误；
viewpoint spec test 3 补 租户成员 角色绑定（W4 登录门禁要求）。CI 不改 workflow——
smoke-tenant job 直接跑 `npm run test:smoke:tenant`，job 保持 report-only。
隔离栈（8081 后端 + runner 自管 vite）验证：console spec 6/6（48.2s，截图入 evidence）、
viewpoint 5/5（31.8s）、双腿全量 16/16 + 5/5。premise 修正（ensureTenantMembership
自动入会 → 成员场景为移除后重加；plan 只能退场 → 内建四档逐个断言；自定义套餐行显示
原始 code）记录于 evidence knownGaps；早期未上隔离栈的运行在维护者 ops 库留下的
`console-*` / `plan_console_*` 测试行已显式披露。证据：
`.harness/evidence/2026-10-27-tenant-console-ui-automation/`。

**显式不在范围内**：表结构/迁移/数据回填、计费、独立 schema、membership 角色到 IAM 角色的隐式映射、
删除历史跨租户 membership 行、`pantheon-ops` 业务改动、降低测试强度。

**2026-10-27 测试基线（各波次开工前的对照值）**：

| 项                                                 | 实测结果                                                                                                                                                                                                                                       |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `go build ./...` / `go vet ./...`                  | 通过                                                                                                                                                                                                                                           |
| 后端全量 `go test ./...`（带 `PANTHEON_TEST_DSN`） | 46 包 ok，exit 0                                                                                                                                                                                                                               |
| 租户包 `./modules/system/iam/tenant/...`           | **119 pass / 0 skip / 0 fail**（约 65s，真实 MySQL）                                                                                                                                                                                           |
| 前端 `tsc -b` / `lint` / `build`                   | 通过（build 含 14 项 prebuild 契约检查）                                                                                                                                                                                                       |
| 前端 `vitest run`                                  | 34 文件 / 230 测试通过（**无 entitlements 覆盖**，见 W7）                                                                                                                                                                                      |
| 租户 smoke 套件（4 个 spec）                       | **15 passed / 0 failed**（10 矩阵 + 5 视角，约 95s）。栈已起（后端 :8080、MySQL、Redis），专用 Vite 走 5178 避开占用的 5173；夹具已 `down` 清理。证据：`.harness/evidence/2026-10-27-tenant-completeness-remediation/smoke-tenant-baseline.md` |

> **DSN 陷阱**：不设 `PANTHEON_TEST_DSN` 时，租户包 119 个用例里有 85 个静默 skip，整包
> 0.04s 报 `ok`。各波次验证一律加 `PANTHEON_TEST_DSN_REQUIRED=true`，让 skip 变成 fail。
> 本轮据此更正了复核报告 §5（原文的"全绿"是 no-DSN 结果）。

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
