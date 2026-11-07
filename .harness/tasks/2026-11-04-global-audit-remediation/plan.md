# Final original-scope plan acceptance (2026-11-07)

2026-11-07: exact original scope approved by fresh independent CODE APPROVE / ARCH CLEAR on the final five-task plan. Official Base v0.18.5 at1da0834b; Base1890/0/1 and47packages, FE218, immutable Full Smoke/Release Gate passed. Official Ops PR177 merged at92c1efcfc4f754a7f0a4e9f181f446f4a2ddcfc2 after required hosted gates including Smoke Sanity; full readonly CGO consumer race2170/0/1,64packages, no source overlay or module mutation; FE218/scripts59/migration32clean/four standard generator smoke passed. Original unchanged SSRF public-API attack replay now records2 DNS lookups / loopbacknotreached; original deliberate attack-failure panic is preserved as a nonzero result, not called a green test. All40 original criteria and all source/contract boundaries preserved. S3 provider skip/no waiver, maintenance freeze unsigned, OpsQA002 and extra host-import runtime table gaps, network policy/CI measurements/baselines/production operations remain explicit separate residuals.

## Historical plan (preserved)

# Pantheon Base 全局审计整改计划

日期：2026-11-04；状态：in-progress（用户已授权按优先级实施）；审计：docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-11-04_FULL.md；工作树基线：525506035b3a843f85b984beb46866c1329cd964 / 214 项已有变化。

## 目标与边界

以简单、可靠、稳定、准确、易维护为目标。先修两个确定P1，认证风险经动态复现确认后做最小修复；不把历史文档、未实现路线图、个人偏好变成必须整改。平台层修共享SSRF与CI；system/auth修刷新轮换；业务域保持Ops实际消费，无租户V2扩展。

In：PB-001–PB-009逐项裁定、有限实现、文档确定漂移、现有检查与下游本地实验。Out：旧文档批量删除/重写、大重构、新产品功能、新门禁/依赖、生产DB操作、冻结代签、发布/提交已有未提交改动、Ops主工作树共享文件抄写。

## 优先级与依赖

| 顺序 | 问题   | 任务                                                                                               | 优先级 | 处理策略                    |
| ---- | ------ | -------------------------------------------------------------------------------------------------- | ------ | --------------------------- |
| 1    | PB-001 | [SSRF DNS 校验与实际拨号绑定](../2026-11-04-audit-p1-ssrf-dial-binding/manifest.json)              | P1     | 实施并验证                  |
| 2    | PB-002 | [npm 漏洞扫描非零结果传递到门禁](../2026-11-04-audit-p1-npm-audit-exit/manifest.json)              | P1     | 实施并验证                  |
| 3    | PB-003 | [刷新令牌并发与存储故障验证及最小修复](../2026-11-04-audit-p1-refresh-rotation/manifest.json)      | P1     | 单任务TDD验证后决定最小修复 |
| 4    | PB-004 | [修正已确认权威文档漂移与失效链接](../2026-11-04-audit-p2-authoritative-docs/manifest.json)        | P2     | 实施并验证                  |
| 5    | PB-005 | [统一 Agent 授权与维护者三触点](../2026-11-04-audit-p2-agent-stop-points/manifest.json)            | P2     | 实施并验证                  |
| 6    | PB-006 | [说明风险优先与现行 Sonar 发布门禁的权威边界](../2026-11-04-audit-p2-release-policy/manifest.json) | P2     | 实施并验证                  |
| 7    | PB-007 | [最终候选及核心集成验证收口](../2026-11-04-audit-p2-freeze-validation/manifest.json)               | P2     | 实测与显式gap；不代签       |
| 8    | PB-008 | [保留现有消费接缝并完成本地 Ops 重建验证](../2026-11-04-audit-p3-consumer-seams/manifest.json)     | P3     | 实施并验证                  |
| 9    | PB-009 | [按实际价值裁定 CI 重复与 dormant 机制](../2026-11-04-audit-p3-ci-cost-review/manifest.json)       | P3     | 仅裁定并延期优化            |

P1-001/P1-002允许只读补丁建议并行，合并串行；PB-003高风险并发不进入盲并行补丁。P2文档/指令/发布边界使用同一个writer顺序改，最终整体验证只跑一次；发现新失败才定向复测。

## 验收与停止条件

### PB-001：SSRF DNS 校验与实际拨号绑定

- [x] 原始DNS重绑定复现从到达loopback变为拒绝，测试先红后绿
- [x] 只拨号已核查IP；私网、混合DNS、IPv4/IPv6、取消/超时、多地址和HTTPS Host/SNI行为有回归
- [ ] Ops实际消费接口不删除；本地重建和业务测试通过，下游正式升级明确延期

对应文件：backend/pkg/security/ssrf/validator.go、backend/pkg/security/ssrf/transport_test.go、backend/pkg/security/ssrf/README.md。
风险：高：多地址、IPv6、HTTPS、重定向和Ops datasource/webhook连接行为；保留导出签名、无新依赖。

### PB-002：npm 漏洞扫描非零结果传递到门禁

- [x] npm audit高危命中、扫描失败和npm ci失败保留非零exit并显示失败outcome
- [x] 上传报告保留；main/release等严格路径失败，PR/merge_group既有report-only策略保留
- [x] 行为测试执行工作流中的实际shell片段，覆盖成功/漏洞/工具故障及enforcement

对应文件：.github/workflows/security.yml、tests/scripts/security-workflow.test.mjs、tests/scripts/security-audit-exit.test.mjs。
风险：中：真实漏洞或扫描错误现在会使严格门禁变红；不擅自更改阈值或豁免。

### PB-003：刷新令牌并发与存储故障验证及最小修复

- [x] 先隔离验证同一旧refresh并发、跨实例和存储失败；记录实际结果，不将静态疑点直接当漏洞
- [x] 确认后补原子消费/轮换最小实现；同一旧token最多一次签发成功，失败不可继续成功响应
- [x] 回归正常刷新、吊销/改密、租户V1约束和失败恢复；证据不足保持未关闭

对应文件：backend/pkg/authtoken/token.go、backend/pkg/authtoken/consume_refresh_test.go、backend/modules/auth/login/login_handler.go、backend/modules/auth/login/refresh_rotation_test.go、backend/modules/auth/session/session_service.go、backend/modules/auth/session/refresh_race_test.go、docs/contracts/SYSTEM_AUTH_CONTRACT.md、docs/contracts/SYSTEM_AUTH_CONTRACT.en.md。
风险：高：并发与重试语义、跨实例会话、部分DB/Redis失败；禁止盲目并行补丁和新增租户功能。

### PB-004：修正已确认权威文档漂移与失效链接

- [x] 按资产附表逐项核对后只改确定的现态、命令、状态、链接，保留历史正文
- [x] 失效链接替换为明确未产出/计划项；不为补链接实现审批/通知/调度/报表
- [x] 三份归档、MERGE、REPLACE建议保留旧路径和历史内容，仅标历史/指向权威；不得批量删文档
- [x] 中英文同步；不重新统计或改写已交付审计基线

对应文件：DESIGN.en.md、DESIGN.md、docs/DEV_DB_INIT_GUIDE.md、docs/VERSION_MANAGEMENT_GUIDE.md、docs/contracts/SYSTEM_IAM_CONTRACT.en.md、docs/contracts/SYSTEM_IAM_CONTRACT.md、docs/designs/ALERT_MONITORING_CENTER_DESIGN.en.md、docs/designs/APPROVAL_WORKFLOW_DESIGN.en.md、docs/designs/APPROVAL_WORKFLOW_DESIGN.md、docs/designs/AUTH_MODULE_DESIGN.md、docs/designs/BACKEND.en.md、docs/designs/BACKEND.md、docs/designs/DARK_MODE_DESIGN.en.md、docs/designs/DATA_PERMISSION_HOOK.en.md、docs/designs/DATA_PERMISSION_HOOK.md、docs/designs/DICT_AND_SETTING_DESIGN.en.md、docs/designs/DICT_AND_SETTING_DESIGN.md、docs/designs/FOUNDATION_RELEASE_MODEL.en.md、docs/designs/FOUNDATION_RELEASE_MODEL.md、docs/designs/FRONTEND.en.md、docs/designs/FRONTEND.md、docs/designs/FRONTEND_COMPONENT_PLAN.en.md、docs/designs/FRONTEND_COMPONENT_PLAN.md、docs/designs/FRONTEND_PAGE_TEMPLATES.en.md、docs/designs/FRONTEND_PAGE_TEMPLATES.md、docs/designs/GENERATOR_MODULE_DESIGN.md、docs/designs/MODULE_CONTRACT.en.md、docs/designs/MODULE_CONTRACT.md、docs/designs/NOTICE_CENTER_API_CONTRACT.md、docs/designs/P2_SCALE_ROADMAP.md、docs/designs/PANTHEON_BASE_ARCHITECTURE_OVERVIEW.md、docs/designs/PERMISSION_MENU_DECOUPLING.md、docs/designs/PLATFORM_DASHBOARD_DESIGN.md、docs/designs/QUALITY_AND_SECURITY_STRATEGY.en.md、docs/designs/QUALITY_AND_SECURITY_STRATEGY.md、docs/designs/README.md、docs/designs/REPORT_CENTER_API_CONTRACT.en.md、docs/designs/REPORT_CENTER_API_CONTRACT.md、docs/designs/REPORT_CENTER_DESIGN.en.md、docs/designs/REPORT_CENTER_DESIGN.md、docs/designs/REPORT_CENTER_TEST_PLAN.en.md、docs/designs/REPORT_CENTER_TEST_PLAN.md、docs/designs/REPOSITORY_LAYOUT.en.md、docs/designs/REPOSITORY_LAYOUT.md、docs/designs/SCHEDULER_CENTER_DB_DESIGN.md、docs/designs/SCHEDULER_CENTER_DESIGN.en.md、docs/designs/SCHEDULER_CENTER_DESIGN.md、docs/designs/TASK_CENTER_DESIGN.en.md、docs/designs/TENANT_READY_SINGLE_TENANT_DESIGN.en.md、docs/designs/TENANT_READY_SINGLE_TENANT_DESIGN.md、docs/harness/VERIFICATION_EVIDENCE_SPEC.en.md、docs/harness/VERIFICATION_EVIDENCE_SPEC.md、docs/testing-quick-start.md。
风险：中：引用/继承/历史追溯；不移动旧报告，不删除未知1252份资产。

### PB-005：统一 Agent 授权与维护者三触点

- [x] 已授权安全可逆工作自主推进，不再仅因涉及auth/schema/menu一律中途询问
- [x] 需求澄清/门禁策略/最终验收三触点明确；真实生产/破坏/凭证操作保留限制
- [x] 中英文规则一致，入口不复制一套规范

对应文件：docs/harness/PANTHEON_BASE_DELIVERY_WORKFLOW.md、docs/harness/PANTHEON_BASE_DELIVERY_WORKFLOW.en.md。
风险：中：不能把自主执行写成允许生产破坏、发布或Agent自贴solo-override。

### PB-006：说明风险优先与现行 Sonar 发布门禁的权威边界

- [x] 文档明确当前release-gate强制Sonar全BUG/VULNERABILITY/CODE_SMELL清零为发布例外
- [x] 风险优先用于整改投入，不能由Agent解释为绕开已有门禁
- [x] 阈值放宽/移除门禁仅写成维护者策略裁定项；本轮保持配置

对应文件：docs/designs/QUALITY_AND_SECURITY_STRATEGY.md、docs/designs/QUALITY_AND_SECURITY_STRATEGY.en.md。
风险：中：擅自移除门禁削弱信号；本轮只解释当前真实规则。

### PB-007：最终候选及核心集成验证收口

- [x] 最终工作树全量Go、FE typecheck/lint/build/test和治理检查给出结果与skip数
- [x] 保留原有214项改动来源，用户既有删除不恢复、在途产物不删除
- [x] 隔离DB/Redis可用则执行核心认证/迁移验证，不可用明确缺口
- [x] 没有不可变候选/真实集成/外部required checks就不代签维护冻结

对应文件：backend/modules/system/system_modules_tenant_wiring_test.go、backend/pkg/testredis/redis.go、backend/pkg/testredis/redis_test.go及任务证据。
风险：高：测试flush会清数据，必须新隔离实例；不提交别人的工作、不发布。

### PB-008：保留现有消费接缝并完成本地 Ops 重建验证

- [x] 保持注册/ModuleConfig/公共API签名，实际rebuild后Go业务和FE构建通过
- [x] 采用隔离本地候选，不在Ops主工作树复制Base源码；Ops状态保持干净
- [x] 发布与lock升级通过foundation release流程，明确延期；不增加插件协议

对应文件：仅任务证据/隔离消费者。
风险：中高：文本锚点与系统共享接口；本轮不改Ops锁与业务实现。

### PB-009：按实际价值裁定 CI 重复与 dormant 机制

- [x] 保留coverage与race目的差异，缺少实测不删除checker或job
- [x] 登记需实际run耗时/收益才能启动的低优先优化；不作为冻结必需项
- [x] 不新增门禁、依赖、复杂平台；不为全风格清零重构

对应文件：仅任务证据/隔离消费者。
风险：低：优化不实施；盲删可能丢coverage/race保护。

## 治理与下游

Implementer：Generator/executor单一写入者；Reviewer：独立Reviewer对照In/Out与失败路径（本轮服务503，未获批准）；协调者维护packet/evidence/status。已授权可逆步骤持续执行，不重复请求批准。策略放宽/生产破坏/正式发布/冻结宣告仍属维护者；能在现行策略内完成的修复不等待决策。

Base-first：本轮输出Base修复与Ops本地兼容证据；正式foundation release和Ops锁升级明确延期，交给发布触点，不把实验称作已升级。

文档附表保留审计基线，不回填本轮计数。UPDATE只修确定条款；ARCHIVE只标注历史且保留路径/正文；MERGE保留兼容指针；REPLACE只在现态入口指向FULL，不覆盖旧审计。未知文档仍REVIEW，删除0。

停止：P1回归和整体检查完成、文档确定问题已落地、消费者实验有证据、每个未关闭项有原因。programme只在全部必要验收满足时completed，不因代码已写就宣称冻结。

## 本轮执行读数

2026-11-04：三项P1补丁及确定文档/治理整改已实施；PB-003从疑点经真实DB/Redis复现变为确认问题，16请求16 pair→1 pair，另以受控时序复现并修复旧Save恢复撤销/覆盖tenant。最终认证278 tests、0 skip。前端33文件/218 tests通过；root脚本202 tests通过。

Ops本地候选完整重建802项；a9616e753b8dc2d1d4a332febb98341fdead8636为本地合成验证提交，非发布。原有删除scripts/migrate-task-manifests.mjs保留，使用现态完整候选过滤不存在的索引项，不恢复用户删除。

[本轮证据](../../evidence/2026-11-04-global-audit-remediation/summary.md)与各子任务commands/review已绑定。独立评审服务503，不能写为review通过；programme和子任务保持in-progress，implementationStatus/verificationStatus分别记录。首次全量Go停滞和共享缓存权限失败保留，最终专属缓存 -count=1 全量通过（47有测试包/1874通过节点/3跳过），两个core Redis接线跳过已修正后补跑完整包30通过/0跳过，S3外部服务缺口保留；本地通过不等于发布/冻结获准。

2026-11-05：PB-010逐项裁定完成（[triage](../2026-11-04-audit-p2-ops-db-test-followup/triage.md)）。9顶层用例/12节点中，8用例/11节点为测试fixture或期望过期（bizscope未接线能力、deploy未跟随认领建行与租约、Start返回规范错误的期望、observability fixture与SSRF端口策略冲突），1用例/1节点为业务缺口（host创建state_version=0使CAS失效），合同错误0。不放宽SSRF/鉴权，不改期望掩盖缺口；修复登记Ops独立任务（测试侧8、业务侧1），observability端口/私网范围登记维护者策略裁定。PB-008首项以既有重建证据闭合：802项Ops资产重建、`go build ./...` exit 0、前端type-check/build/unit exit 0；Base改动包的导出声明只有新增`authtoken.ConsumeRefresh`，无签名删除或修改。consumer真实DB业务门禁仍为266通过/12失败，PB-010关闭前下游验收不通过。

2026-11-05 续：PB-010测试侧8用例/11节点已在隔离Ops worktree（基于`1c057ee`）修复，随后补修host业务缺口（创建/导入即`state_version=1`、列默认0→1，使`ExpectedStateVersion>0`真正启用CAS）。存量0行回填由迁移`000031_backfill_cmdb_host_state_version`提供（守卫表存在、幂等、down保留），并加迁移链+CAS端到端回归（`pkg/database`全量48s绿）。真实隔离MySQL全业务套件**278通过/0失败/0跳过**（18包），`go build`全仓通过；修复提交在本地分支`ops/triage-test-fixes-2026-11-05`（2759dd9/430e53e/dbce4ae），Ops主工作树/锁未改，未push/未发布。

明确不建议：重建插件架构、删除SSRF包、扩审批/通知/调度/报表或租户V2、批量删/重写旧文档、清零全部风格/历史资产、合并coverage/race门禁而丢信号。PB-009优化延期，后续仅在真实CI耗时/复发收益明确时立项。

## 本轮新增下游后续任务

[P2 Ops既有DB测试失败裁定](../2026-11-04-audit-p2-ops-db-test-followup/manifest.json)（PB-010）。1父任务 + 原9整改子任务 + 1新增P2后续任务。全部12失败节点在Ops HEAD同环境复现，不能归因本轮Base补丁，也不能称消费者门禁通过。责任属于business/*，先裁定代码/fixture/合同，再在Ops独立修复；本轮保留其主工作树与锁不变。不降低安全规则。

## 当前未关闭项

- 独立安全/架构review：服务503，所有实现未自我批准。
- PB-008/PB-010：隔离worktree真实DB全业务套件已全绿（278通过/0失败/0跳过）；剩observability端口策略裁定与修复推送/发布；构建与前端通过不能替代业务门禁。
- S3/live外部集成、浏览器core/full smoke、真实远端CI/Sonar未验证；P1相关四包race已通过，308测试节点/0跳过。
- 正式foundation release、Ops锁升级、批准候选及维护冻结验收未执行。
- PB-009是延期的优化，不作为功能缺口，不盲删coverage/race或dormant规则。
