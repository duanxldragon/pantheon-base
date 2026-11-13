## Summary

**架构状态：`BLOCK`。方向成立，但当前计划还不足以批准 Generator 执行。** 租户隔离的业务授权已经明确；本评审保留同批实现及 §2.6 四项前置条件，不回退到 actor-only，也不要求重新授权。依据：[父任务:7](D:/workspace/go/pantheon-platform/pantheon-base/docs/harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps.task.md:7)、[租户合同:314](D:/workspace/go/pantheon-platform/pantheon-base/docs/contracts/TENANT_CONTRACT_V1.md:314)。

主要阻断项是审计保护的位置、实时授权接口的执行顺序、模式读取错误降级，以及尚未落实的候选装配和旧二进制防回退机制。以下结论针对计划；不构成实现、正式发布、P0 或 O4 完成批准。

## Analysis

### 1. BLOCK：路由内审计保护晚于全局拒绝路径

[计划:150](D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:150) 要求保护先于 TokenAuth、租户、Casbin 和绑定，但实际顺序还包括：

- 全局 OperationLog → CSRF：[main.go:143](D:/workspace/go/pantheon-platform/pantheon-base/backend/cmd/server/main.go:143)。
- API 限流先于业务模块挂载：[main.go:160](D:/workspace/go/pantheon-platform/pantheon-base/backend/cmd/server/main.go:160)、[main.go:175](D:/workspace/go/pantheon-platform/pantheon-base/backend/cmd/server/main.go:175)。
- OperationLog 在 `c.Next()` 前读取正文，之后采用正文作为审计 fallback：[operation_log_middleware.go:233](D:/workspace/go/pantheon-platform/pantheon-base/backend/internal/middleware/operation_log_middleware.go:233)、[:265](D:/workspace/go/pantheon-platform/pantheon-base/backend/internal/middleware/operation_log_middleware.go:265)。

因此，合法 JSON 中的 `query` 在 CSRF 拒绝时仍可能落库；业务 guard 根本没有执行。现有遮罩只按 password/token/secret 等**字段名**处理，不识别表达式内的秘密：[operation_log_middleware.go:597](D:/workspace/go/pantheon-platform/pantheon-base/backend/internal/middleware/operation_log_middleware.go:597)。CSRF 明确会提前 Abort：[csrf_middleware.go:65](D:/workspace/go/pantheon-platform/pantheon-base/backend/internal/middleware/csrf_middleware.go:65)。

**最小修正：** Base 提供按准确路由模板与方法登记的审计正文策略，OperationLog 在读取正文前应用安全默认值，覆盖所有 O4 非 GET 方法及别名。业务 handler 只补安全 ID、状态和计数。保留 CSRF、限流及审计事件；把 CSRF、API 限流拒绝加入隐私矩阵。Ops 对旧幂等中间件的精确绕过可以保留，但不能替代这项 Base 修复。

### 2. BLOCK：实时授权 read port 必须介入入口，而不只是结果返回前

[计划:58](D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:58) 正确识别了旧会话角色问题，但只描述“返回当前允许动作及 DataScope”，没有冻结它在新 helper 中的位置。

实际入口中：

- TokenAuth 写入会话保存的角色：[token_middleware.go:219](D:/workspace/go/pantheon-platform/pantheon-base/backend/internal/middleware/token_middleware.go:219)。
- 租户 header/platform fallback 能力检查使用这些角色：[tenant_context_middleware.go:215](D:/workspace/go/pantheon-platform/pantheon-base/backend/internal/middleware/tenant_context_middleware.go:215)。
- Casbin 同样使用这些角色：[casbin_middleware.go:22](D:/workspace/go/pantheon-platform/pantheon-base/backend/internal/middleware/casbin_middleware.go:22)。
- DataScope 的管理员判定和策略读取也从它们出发，并缓存用户部门：[data_scope_middleware.go:102](D:/workspace/go/pantheon-platform/pantheon-base/backend/internal/middleware/data_scope_middleware.go:102)、[:145](D:/workspace/go/pantheon-platform/pantheon-base/backend/internal/middleware/data_scope_middleware.go:145)。

单纯在 handler 或 provider 完成后补一次授权，无法让入口使用当前角色；新增授权也可能被旧 Casbin 前置拒绝。

**最小修正：** 冻结新 helper 的授权阶段及 read port 签名：

1. TokenAuth 后读取当前有效主体与真实全局角色绑定，供平台 header/fallback 判定。
2. 解析租户后，读取该租户的当前角色绑定，执行路由/source-kind 授权并生成当前 DataScope。
3. provider 完成和 restore 返回前，重新检查主体、membership、租户状态、权限及 datasource revision。

现有角色查询已经按 user-role 与 role 的租户共同过滤，可作为 Base 内部复用锚点：[login_runtime.go:328](D:/workspace/go/pantheon-platform/pantheon-base/backend/modules/auth/login/login_runtime.go:328)。但不能只查询“目标租户角色”而丢掉合法平台 override 的真实全局授权，也不能把同名租户角色当成全局绑定；现有 subject expansion 本身不携带绑定来源：[authz.go:449](D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/tenant/authz.go:449)。

保留 credential projection 与业务授权 projection 的分离是正确的：[authuser.go:22](D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/contracts/authuser/authuser.go:22)。修复归 Base，Ops 消费公共接口。

### 3. BLOCK：注册了 ModeLoader 仍不等于失败关闭

[计划:50](D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:50) 禁止缺失 provider 时静默创建 compat，但拟复用的 loader 会把 **任何 setting 读取错误**转成 compat：[membership.go:112](D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/tenant/membership.go:112)。`ModeLoader.Load()` 又无法返回错误：[tenant.go:218](D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/tenant/tenant.go:218)。

后果是读取失败会改变作用域解释，而不只是影响可用性：`Resolve` 在非 multi 模式直接返回 tenant0，忽略租户 claim/header：[tenant.go:123](D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/tenant/tenant.go:123)。这与运行 multi 后禁止直接回 compat 的约束存在冲突：[合同:402](D:/workspace/go/pantheon-platform/pantheon-base/docs/contracts/TENANT_CONTRACT_V1.md:402)。

另一个必须明确的条件是 DB：现有平台人口判定在 membership DB 为 nil 时返回 true：[tenant_context_middleware.go:169](D:/workspace/go/pantheon-platform/pantheon-base/backend/internal/middleware/tenant_context_middleware.go:169)。

**最小修正：** 新业务 opt-in bridge 必须能区分有效 compat、有效 multi 和读取失败；错误拒绝，不能降为 compat，并拒绝缺失 DB 等必要依赖。可在 Base 增加最小错误感知接口，同时保留旧接口行为。

启动顺序本身已有可用依据：system 初始化先于 business，现有 loader 在 system dependencies 中创建：[main.go:169](D:/workspace/go/pantheon-platform/pantheon-base/backend/cmd/server/main.go:169)、[system_modules.go:96](D:/workspace/go/pantheon-platform/pantheon-base/backend/modules/system/system_modules.go:96)。应复用此顺序，无需新增启动框架。

### 4. BLOCK：候选装配有复用接缝，但当前 CLI 不能完成计划中的接入

[计划:180](D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:180) 要求 Ops 用未发布的 Base candidate；[计划:195](D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:195) 又把现有正式重建机制列为验证入口。

当前事实是：

- `rebuildFromBase` 拒绝本地 Base；CLI 只有 `--target`、`--manifest`：[rebuild-from-base.mjs:661](D:/workspace/go/pantheon-platform/pantheon-ops/scripts/business-overlay/rebuild-from-base.mjs:661)。
- 正式 resolver 要求发布的稳定 GitHub release，拒绝 draft/prerelease：[foundation-release.mjs:27](D:/workspace/go/pantheon-platform/pantheon-ops/scripts/business-overlay/foundation-release.mjs:27)。
- 当前 lock 固定 v0.18.6：[foundation-release.lock.json:5](D:/workspace/go/pantheon-platform/pantheon-ops/foundation-release.lock.json:5)。
- Base release bundle 验证共享路径与真实 commit 一致，拒绝额外未提交内容：[build-release-bundle.mjs:124](D:/workspace/go/pantheon-platform/pantheon-base/scripts/foundation-release/build-release-bundle.mjs:124)。

**找到的具体复用入口：** `assembleConsumerTree({ snapshot, targetRoot, ... })` 和 `checkSharedDrift({ root, snapshot })` 已导出：[rebuild-from-base.mjs:612](D:/workspace/go/pantheon-platform/pantheon-ops/scripts/business-overlay/rebuild-from-base.mjs:612)、[check-shared-drift.mjs:14](D:/workspace/go/pantheon-platform/pantheon-ops/scripts/business-overlay/check-shared-drift.mjs:14)。但 assembler 目前只检查 `baseRoot/baseCommit` 存在，不能把传入对象自行称为已验证候选。

**最小可实施方案：**

- Base 增加独立的 candidate artifact 描述，记录基线 commit、候选文件摘要、整体摘要、shared paths 和 review/evidence 身份；明确它不是正式 release。
- Ops 增加候选 resolver/薄入口：校验产物与解包路径，调用现有 assembler 和 drift 函数，并记录候选身份。
- 仅从验证后的候选产物装配到独立 staging；不手抄共享源码、不伪造 `baseCommit`、不使用旧 release 名标签。
- 原工作树和正式 lock 保持原身份。正式 release/lock 验收仍走现有严格路径。

这项工具工作必须排在 Ops backend Generator 前，并进入 owning-lane 文件清单。`--target` 本身不能解决它。

### 5. BLOCK：readiness 要真正阻止服务启动；新程序不能替旧程序执行检查

[计划:160](D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:160) 正确指出 retained-down 后旧二进制不安全，但没有指定拒绝发生在哪个实际入口。

打开的旧代码确实只按 DataScope 列表查询 datasource，没有租户谓词：[datasource_service.go:110](D:/workspace/go/pantheon-platform/pantheon-ops/backend/modules/business/observability/datasource_service.go:110)。旧 Ops 启动还无条件 AutoMigrate observability：[opsinit.go:56](D:/workspace/go/pantheon-platform/pantheon-ops/backend/modules/business/opsinit/opsinit.go:56)。

此外，Base `RegisterBackendModules` 对 bootstrap 错误只 Warn，随后仍注册路由：[module.go:94](D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/contracts/module.go:94)、[:114](D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/contracts/module.go:114)。仅“保留 BootstrapFunc”不足以保证 schema 不就绪时服务拒绝启动。

**最小修正：**

- 新 tenant v2 生成模块与 O4 readiness 失败时不得注册可服务路由；明确错误传播和进程失败点。
- Ops production startup 验证 datasource、新表、索引及 revision 形状；dev AutoMigrate 保留明确入口。
- 指定受支持部署/启动工具中的 **artifact 能力—数据库形状**校验，覆盖 retained-down 后迁移版本号降低的情况。
- 明确承认：未经修改的旧二进制直接启动，不会执行新二进制中的 guard；不能据此宣称已防回退。

没有检查外部部署入口，因此该入口是否已有可复用防回退能力仍未知。

### 6. 必须冻结清理事务协议，删掉不必要的 guard-row 回收复杂度

[计划:134](D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:134) 要在“无记录、无活跃事务”时回收 budget guard；[计划:136](D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:136) 要 datasource purge 先拿 owner locks，并对集合变化重试。

方向合理，但“无活跃事务”和 purge 集合变化还没有可执行定义。这里是**计划缺失协议**，不是已经证实的新代码死锁。

**最小修正：**

- 默认保留只含 ID/时间的 budget guard，取消请求内自动回收。
- 普通写入：创建/锁定 owner guard → datasource → history/view。
- datasource 删除：预枚举 owners → 排序锁 guards → 锁 datasource → 用当前读重新核对 owners；发现新 owner，整笔回滚后重试，禁止持 datasource lock 再补 owner lock。
- 检查与硬删覆盖软删的新 metadata；明确有限重试及安全失败响应。
- saved-view 更新明确 datasource ID 是否不可变；若可变，规定旧、新 datasource 的排序锁序。

旧 rule 创建与 datasource 删除当前没有共同事务锁：[alert_rule_service.go:38](D:/workspace/go/pantheon-platform/pantheon-ops/backend/modules/business/observability/alert_rule_service.go:38)、[datasource_service.go:193](D:/workspace/go/pantheon-platform/pantheon-ops/backend/modules/business/observability/datasource_service.go:193)。计划要求二者共锁 datasource 是必要修正。

### 应保留的设计及具体边界

- **生成器不能省略。** 当前 scaffold 同时拒绝 v2 和 tenant：[contract.go:31](D:/workspace/go/pantheon-platform/pantheon-base/backend/internal/scaffold/contract.go:31)、[:71](D:/workspace/go/pantheon-platform/pantheon-base/backend/internal/scaffold/contract.go:71)。现有 options/detail/update/delete 是裸查询：[backendGenerator.ts:492](D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/modules/lowcode/generator/backendGenerator.ts:492)。计划的 flat v2、拒绝未实现关系、保留真实 BootstrapFunc 是合理最小范围。补充要求：导出路径直接构造 exporter，也必须执行相同验证：[export-generated-module.mjs:26](D:/workspace/go/pantheon-platform/pantheon-base/frontend/scripts/export-generated-module.mjs:26)。
- **tenant0 必须仍只匹配 tenant0；private metadata 必须再交 actor。** 保留存量归零、不推断归属及无 admin actor bypass：[计划:86](D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:86)、[:102](D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:102)。
- **legacy0 alerts 是必要隔离栅栏。** evaluator 有第二次裸 ID credential reload：[alert_evaluator.go:227](D:/workspace/go/pantheon-platform/pantheon-ops/backend/modules/business/observability/alert_evaluator.go:227)。必须落实启动、AddRule、查询与通知前的合法 global datasource 检查；无法使用 source 时明确 error/unavailable，零通知。不要给没有 TenantID 的旧 alert 表机械追加租户谓词：[alert_rule_model.go:11](D:/workspace/go/pantheon-platform/pantheon-ops/backend/modules/business/observability/alert_rule_model.go:11)。
- **catalog 是编译合同，不是脱敏函数。** UI AST 的 `value` 是 unknown，现有校验只检查 field/operator：[types.ts:46](D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/components/operational/types.ts:46)、[conditionAst.ts:9](D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/components/operational/conditionAst.ts:9)。保留 server-owned catalog 和 raw metadata-only。
- **URL 与资源预算仍需具体验收。** 当前统一 proxy 使用 GET query string：[datasource_service.go:468](D:/workspace/go/pantheon-platform/pantheon-ops/backend/modules/business/observability/datasource_service.go:468)，产品 Loki/Tempo API 也是 GET：[api.ts:127](D:/workspace/go/pantheon-platform/pantheon-ops/frontend/src/modules/business/observability/api.ts:127)。Tempo provider 能力未验证前，literal-free URL 条件保持 gap。现有 Base limiter 限频且存储错误放行，不能直接替代分布式 in-flight cap：[rate_limit_middleware.go:31](D:/workspace/go/pantheon-platform/pantheon-base/backend/internal/middleware/rate_limit_middleware.go:31)。新 permit 应规定原子双层获取、失败撤销、deadline/过期关系；8MiB 上限也要覆盖连接测试路径，目前其解码没有同样上限：[datasource_service.go:569](D:/workspace/go/pantheon-platform/pantheon-ops/backend/modules/business/observability/datasource_service.go:569)。

## Root Cause

当前业务入口、授权快照、生成模板和 observability 数据访问都按旧单租户合同工作；tenant middleware 本身不会补出缺失的 schema、谓词和授权来源。现有 helper 的“不挂租户”还是明确合同要求：[route_groups.go:13](D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/contracts/route_groups.go:13)。

计划已经识别这些边界，但部分安全目标仍停留在文字承诺：未完整连接到全局拒绝链、错误感知模式读取、当前角色绑定、候选身份及部署回退入口。

## Recommendations

1. **Coordinator：修订阻断条款与 paired packet — 中等工作量 — 解除计划执行阻断。** 补齐上述接口、顺序、候选工具、readiness 和事务协议，并将文件、验证及独立 review 链路纳入 manifest。当前 manifest 的 expectedFiles 仍主要是原共享 UI/permission 工作：[manifest.json:37](D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/manifest.json:37)。
2. **Base Generator：先交付公共安全入口和 flat tenant v2 — 较大工作量 — 建立可信消费合同。** 包含审计策略、错误感知 mode、当前授权 read port、生成验证与失败关闭 bootstrap；共享修复全部归 Base。
3. **Base/Ops 工具 owner：交付候选产物与装配入口 — 中等工作量 — 让未发布 helper 可审查地集成。** 使用现有 assembler/drift 接缝，保持正式 lock 身份。
4. **Ops backend，再 frontend — 较大工作量 — 落实端到端隔离。** backend 先固定 DTO、迁移、legacy0 栅栏与锁序；frontend 随后接 POST、restore-without-run、身份变化清理和现有取消/follow 生命周期。
5. **Independent Reviewer：分开批准执行、候选实现与正式收口。** 修订后的计划 review 可以解除执行阻断；实现仍需新证据。正式发布、paired consumption、原 O4/P0 与最终视觉/功能签署继续独立开放，符合[计划:198](D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:198)。

## Architectural Status

`BLOCK` — 当前计划执行批准被上述 load-bearing 缺口阻断；已授权业务方向保持有效。

## Trade-offs

| 选择                                          | 收益                                   | 成本 / 限制                            |
| --------------------------------------------- | -------------------------------------- | -------------------------------------- |
| 新业务 opt-in 入口，复用 Base 解析与 IAM 能力 | 保留旧模块行为，采用边界明确           | 必须补当前授权及错误感知模式接口       |
| 独立 candidate artifact，复用现有 assembler   | 发布前完成双仓集成，保持正式 lock 真实 | 需要候选身份和验证薄层                 |
| 保留 budget guard                             | 减少回收与并发协议复杂度               | 保留少量非正文元数据                   |
| legacy0 alerts + 安全 catalog                 | 控制第一批采用范围与隐私风险           | private alerts、任意表达式恢复仍不可用 |

## Consensus Addendum

- **Antithesis：** 现有系统 helper、Casbin、DataScope、mode loader 和 assembler 已提供大量能力；新增多个 registry/read port/candidate 协议可能把一个 O4 切片扩成第二套平台框架。
- **Tradeoff tension：** 复用旧行为降低维护成本，但它们确实包含会话角色、错误转 compat、晚于全局拒绝的业务挂载及稳定 release-only resolver，不能直接满足新隔离合同。
- **Synthesis：** 保留旧导出行为，新增薄的业务 opt-in 合同；复用 resolver、IAM 查询、assembler、drift 与既有生成模板。限制首批资源及编译语言，取消不必要的 guard 回收，不新增关系框架、授权表或后台重试队列。

## References / 验证状态

已通过 CodeGraph CLI 做结构检索，并打开上述合同、启动/中间件、租户工具、生成/export、Ops datasource/alert/seed/opsinit、前端 API/LogExplorer 及 producer/consumer 工具源码。计划摘要为 `898c6f5714ee…`，评审期间两次读取一致。

**未执行测试、数据库操作或页面渲染；未写文件，未运行发布、提交、push、lock 替换或源码复制。** 实际 MySQL 索引形状、provider POST/Tempo 协议、外部防回退入口及修正后的运行行为仍未知。已应用 `impeccable` 的计划质量要求；视觉验收留待实现后的渲染证据。

本次只读诊断已完成。停止条件是交回这份独立报告；解除执行阻断需要计划落实上述修正并经复核，不能用历史绿色测试替代。
