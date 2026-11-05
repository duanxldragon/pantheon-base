**独立架构审查结论：`BLOCK`，建议修改后复审。**
确认三项 P2 问题：SSRF 多地址回退可能失效、分页聚合不能保证候选完整、生成表单与 Go DTO 对必填布尔值的语义冲突。本报告仅代表 Architect lane，不代表另一独立评审 lane，也不构成合并或发行批准。

**审查对象与覆盖**

| 项目              | 核对结果                                                       |
| ----------------- | -------------------------------------------------------------- |
| PR                | [#489](https://github.com/duanxldragon/pantheon-base/pull/489) |
| 基线              | `525506035b3a843f85b984beb46866c1329cd964`                     |
| 候选              | `1a7b388bcaa2c178346b7fcaa78cf6c0b057e246`                     |
| backend tree      | `02341ada0ee53a3924522a6599723be71c060658`                     |
| frontend/src tree | `a3351c514bced1a6885abcc54a5d57f986b01062`                     |
| 产品代码一致性    | 两个代码树均与 `57b42ace467dd6f96db232bfebab7626f07c84be` 相同 |
| 实际打开范围      | 101 个仓库文件，含完整 diff、源码和必要片段，名单附后          |

完整变更清单为 367 项。本 lane 已检查产品变更及相关工作流、打包和治理代码；**未逐行审完其余历史设计、审计和归档材料，不能将本报告称为全部 367 项的完整内容批准。**

**发现**

1. **P2：首个地址超时会耗尽全部拨号预算，后续有效地址无法回退。**

   [validator.go:141](D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/security/ssrf/validator.go:141) 为 DNS 查询和所有连接创建共同截止时间；[validator.go:151](D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/security/ssrf/validator.go:151) 随后串行拨号，每次均使用这个完整剩余预算。

   可复现时序：解析出两个合法公网地址；第一个地址丢弃连接包，第二个地址可连接。第一次拨号等待至共同截止时间，下一轮在 `ctx.Err()` 处退出，第二个地址没有机会连接。原实现把主机名交给 `net.Dialer`，新实现自行拆分地址后没有保留其地址回退预算行为。

   当前[回退测试:75](D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/security/ssrf/transport_test.go:75) 的拨号桩立即返回错误，未覆盖首个地址阻塞的情况。影响是 Ops datasource/webhook 等消费者的连接可用性，**不是已确认的 SSRF 绕过**。

   **建议：**保留“全部地址验证后，仅拨数字 IP”的安全边界，同时为每次尝试分配子截止时间，或实现有界并发回退。增加“首地址超时、次地址成功、总耗时仍受限”的回归。

2. **P2：分页聚合把返回行数当成完整集合，但调用端没有稳定分页顺序。**

   [fetchAllPages.ts:21](D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/api/fetchAllPages.ts:21) 直接追加每页数据，达到 `total` 即成功。用户页和权限页按非唯一的 `sort` 字段分页，例如 [useUserList.ts:330](D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/modules/system/iam/user/useUserList.ts:330)。

   后端角色查询仅排序一个字段，没有主键补充排序：[role_service.go:105](D:/workspace/go/pantheon-platform/pantheon-base/backend/modules/system/iam/role/role_service.go:105)。岗位查询相同：[post_service.go:80](D:/workspace/go/pantheon-platform/pantheon-base/backend/modules/system/org/post/post_service.go:80)。重复 `sort` 值是合法数据，默认值即为 0。

   本轮在内存中调用了当前 helper：第一页返回 ID 1–100，第二页返回 ID 1–10，`total=110`。结果正常返回 **110 行、只有 100 个唯一 ID**。这证明 helper 无法识别重叠；真实 MySQL 对相同排序值是否出现该顺序，本轮未实测。

   **根因：**新增跨页收集依赖了接口尚未提供的稳定排序保证。非唯一排序下，独立 OFFSET 查询不能保证各页互不重叠。

   **建议：**角色、岗位分页追加唯一主键排序，例如 `ORDER BY sort ASC, id ASC`；增加超过两页、全部同 `sort` 的真实数据库回归，比较唯一 ID 集合。仅前端去重不足以找回漏项。并发增删期间是否要求快照完整性，应另行明确，不必因此直接引入游标接口。

3. **P2：新增创建表单允许 `false`，生成的创建 DTO 却拒绝它。**

   [frontendGenerator.ts:689](D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/modules/lowcode/generator/frontendGenerator.ts:689) 对必填布尔值只拒绝 `null/undefined`；[frontendGenerator.ts:700](D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/modules/lowcode/generator/frontendGenerator.ts:700) 还把布尔字段初始化为 `false`。但 [backendGenerator.ts:345](D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/modules/lowcode/generator/backendGenerator.ts:345) 为创建 DTO 输出非指针类型并附加 `binding:"required"`。

   本轮执行当前生成器，实际得到：

   ```go
   Enabled bool `json:"enabled" binding:"required"`
   ```

   前端同时输出 `enabled: false` 和仅判空的提交检查。仓库使用的 Gin validator 将 `binding` 交给 go-playground/validator；其 `hasValue` 对非指针值检查 `!field.IsZero()`，因此拒绝 `false`。已读取对应依赖源码。

   **归因说明：**DTO 的零值问题基线已存在；本 PR 新接通创建交互，使它成为新增交付路径中的接口冲突，不能称为新引入的后端回归。

   **建议：**需要区分“缺失”和 `false` 的创建字段使用 `*bool` 加必填验证，并同步生成模型赋值；测试明确覆盖缺字段失败、`false` 成功、`true` 成功。不要通过删除必填约束解决。

**架构边界判断**

| 检查维度        | 结论与证据                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cycle           | 在已审变更子图中未发现新增依赖环。`fetchAllPages` 没有导入依赖；路由共享包接收 `RefreshSync` 回调，没有反向导入系统模块。[fetchAllPages.ts:15](D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/api/fetchAllPages.ts:15)、[route_groups.go:69](D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/contracts/route_groups.go:69)                                                                                                                             |
| Hub             | `SystemProtectedGroup` 成为显式的系统路由装配中心，属于合理集中。鉴权、租户上下文、Casbin、可选 capability/data scope 的顺序可见，调用点仍声明差异。[route_groups.go:135](D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/contracts/route_groups.go:135)、[system_modules.go:178](D:/workspace/go/pantheon-platform/pantheon-base/backend/modules/system/system_modules.go:178)                                                                                      |
| Depth           | 新增路由 helper 主要增加注册阶段调用层；会话条件更新增加一层持久化 helper。值得关注的运行成本来自分页请求数量及拨号串行等待，而非调用栈深度。[session_service.go:167](D:/workspace/go/pantheon-platform/pantheon-base/backend/modules/auth/session/session_service.go:167)、[fetchAllPages.ts:21](D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/api/fetchAllPages.ts:21)                                                                                          |
| Sensitive input | SSRF 已把验证结果绑定至数字地址，URL 保持不变以保留 Host/SNI；刷新在签发前 GETDEL；会话更新检查旧 JTI、tenant、撤销和到期状态。[validator.go:158](D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/security/ssrf/validator.go:158)、[token.go:230](D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/authtoken/token.go:230)、[session_service.go:248](D:/workspace/go/pantheon-platform/pantheon-base/backend/modules/auth/session/session_service.go:248) |
| 系统域隔离      | 部门 bootstrap 的根选择、顶层挂载和额外根清理均限定平台租户；子树递归限定父子同租户。[dept_service.go:477](D:/workspace/go/pantheon-platform/pantheon-base/backend/modules/system/org/dept/dept_service.go:477)、[dept_service.go:511](D:/workspace/go/pantheon-platform/pantheon-base/backend/modules/system/org/dept/dept_service.go:511)、[dept_service.go:557](D:/workspace/go/pantheon-platform/pantheon-base/backend/modules/system/org/dept/dept_service.go:557)          |
| 租户 V1         | 没有据此要求业务域租户隔离或跨租户角色绑定。V1 明确排除前者，并限制后者。[TENANT_CONTRACT_V1.md:54](D:/workspace/go/pantheon-platform/pantheon-base/docs/contracts/TENANT_CONTRACT_V1.md:54)、[TENANT_CONTRACT_V1.md:128](D:/workspace/go/pantheon-platform/pantheon-base/docs/contracts/TENANT_CONTRACT_V1.md:128)                                                                                                                                                              |

认证修复的保证应保持精确：它阻止同一 refresh token 重复消费及旧数据库快照覆盖生命周期变化，**没有把 DB 更新与 Redis 签发变成一个事务**。[session_service.go:167](D:/workspace/go/pantheon-platform/pantheon-base/backend/modules/auth/session/session_service.go:167) 更新后才调用 issuer；合同也明确承认跨存储非事务与失败后重新登录的取舍：[SYSTEM_AUTH_CONTRACT.md:296](D:/workspace/go/pantheon-platform/pantheon-base/docs/contracts/SYSTEM_AUTH_CONTRACT.md:296)。

Sonar 后续重构保留了测试屏障、未授权/无 pair、tenant/JTI 和撤销状态断言；部门测试仍比较租户树并验证重复 bootstrap。[refresh_race_test.go:132](D:/workspace/go/pantheon-platform/pantheon-base/backend/modules/auth/session/refresh_race_test.go:132)、[refresh_race_test.go:150](D:/workspace/go/pantheon-platform/pantheon-base/backend/modules/auth/session/refresh_race_test.go:150)、[dept_bootstrap_scope_test.go:85](D:/workspace/go/pantheon-platform/pantheon-base/backend/modules/system/org/dept/dept_bootstrap_scope_test.go:85)。

**工作流与发行接口**

- npm audit 删除 `|| true` 后，失败会保留在 step outcome；严格事件的汇总步骤据此失败。PR/merge_group 仍是原有 report-only 政策，绿色 PR 检查不等于严格发布扫描通过。[security.yml:57](D:/workspace/go/pantheon-platform/pantheon-base/.github/workflows/security.yml:57)、[security.yml:80](D:/workspace/go/pantheon-platform/pantheon-base/.github/workflows/security.yml:80)
- draft 评论改为 `pull-requests: write`，该 job 没有 checkout 或执行 PR 提供的脚本；本次 diff 未改变自动合并条件。[pr-automation.yml:165](D:/workspace/go/pantheon-platform/pantheon-base/.github/workflows/pr-automation.yml:165)
- helper 迁至 `frontend/src/api` 后处于既有 foundation 共享清单内，无需新增所有权例外。[build-release-manifest.mjs:62](D:/workspace/go/pantheon-platform/pantheon-base/scripts/foundation-release/build-release-manifest.mjs:62)、[frontend-ownership.mjs:8](D:/workspace/go/pantheon-platform/pantheon-base/scripts/foundation-release/frontend-ownership.mjs:8)
- v0.18.3 仍未发布。000031 的 Base/Ops 编号冲突不能由当前 Base 验证消除；正式消费时须对齐来源、重建并重新验证迁移链。[RELEASE_NOTES_v0.18.3.md:22](D:/workspace/go/pantheon-platform/pantheon-base/docs/release-notes/RELEASE_NOTES_v0.18.3.md:22)

**建议、取舍与停止条件**

| 优先动作                   | 工作量 | 收益与取舍                                           |
| -------------------------- | ------ | ---------------------------------------------------- |
| 修复公网地址回退预算       | 中     | 保留 SSRF 防护并恢复容错；增加少量拨号调度逻辑       |
| 给候选分页追加唯一排序     | 小     | 修复静态数据集完整性；不承诺并发写入期间的快照一致性 |
| 统一必填布尔字段存在性语义 | 中     | `false` 可合法创建；DTO 与赋值模板须同步调整         |
| 在同一最终候选补定向验证   | 中     | 避免用既有宽泛通过结果覆盖尚未测试的边界             |

支持现在通过的最强理由，是主要安全修复方向正确、公共入口签名稳定，并已有大规模验证。反对现在批准的最强理由，是这些验证尚未覆盖上述**合法输入和正常故障条件**；三个局部组件各自看似正确，组合后的接口保证仍不成立。

停止条件：上述三项修复或由协调者提供足以推翻发现的实际证据，再审最终代码树；候选自身 CI、正式 release 校验和 Ops overlay 消费分别闭环。无需扩展到租户 V2。

**独立验证与限制**

- 本轮执行：提交/树核对、差异检查、`git diff --check`；内存分页反例；当前生成器产物核对；30 份生成 Go 产物通过 stdin 的语法/格式检查。
- 未独立重跑完整 Go race、数据库 smoke 或浏览器 CRUD。1880/218 等结果仅作为已记录的协调者证据引用。[resume-validation.json:6](D:/workspace/go/pantheon-platform/pantheon-base/.harness/evidence/2026-11-05-base-freeze-release/resume-validation.json:6)
- 未独立检查渲染截图，本 lane 不给视觉质量通过结论；已按 `impeccable` 审视表单状态，受本轮源码架构审查范围限制。
- CodeGraph CLI 报告最新，但查询返回旧路径及错位源码，故不据其声称完成全仓环路扫描。
- 当前 head 的远端 CI 未独立查询；`hosted-validation.json` 对应 `57b42ace`。[hosted-validation.json:3](D:/workspace/go/pantheon-platform/pantheon-base/.harness/evidence/2026-11-05-base-freeze-release/hosted-validation.json:3)
- 真实 S3 provider 仍缺失，Ops 正式消费及迁移冲突仍未关闭。[summary.md:19](D:/workspace/go/pantheon-platform/pantheon-base/.harness/evidence/2026-11-05-base-freeze-release/summary.md:19)、[summary.md:25](D:/workspace/go/pantheon-platform/pantheon-base/.harness/evidence/2026-11-05-base-freeze-release/summary.md:25)
- 本轮未写文件、未发 GitHub 消息、未批准、合并或发行。

**实际检查文件清单：101 个**
以下计入全文、diff 或针对性源码片段读取；技能、外部 harness 规则和依赖源码另计。

```text
.github/workflows/pr-automation.yml
.github/workflows/quality.yml
.github/workflows/security.yml
.harness/evidence/2026-11-05-base-freeze-release/functionality-matrix.md
.harness/evidence/2026-11-05-base-freeze-release/hosted-validation.json
.harness/evidence/2026-11-05-base-freeze-release/resume-validation.json
.harness/evidence/2026-11-05-base-freeze-release/summary.md
AGENTS.md
CHANGELOG.md
DESIGN.md
VERSION
backend/go.mod
backend/internal/middleware/data_scope_middleware.go
backend/internal/middleware/data_scope_schema_test.go
backend/internal/middleware/token_middleware.go
backend/modules/auth/login/login_handler.go
backend/modules/auth/login/login_runtime.go
backend/modules/auth/login/login_tenant_switch.go
backend/modules/auth/login/refresh_rotation_test.go
backend/modules/auth/session/refresh_race_test.go
backend/modules/auth/session/session_service.go
backend/modules/system/iam/role/role_helper.go
backend/modules/system/iam/role/role_model.go
backend/modules/system/iam/role/role_service.go
backend/modules/system/org/dept/dept_bootstrap_scope_test.go
backend/modules/system/org/dept/dept_service.go
backend/modules/system/org/post/post_model.go
backend/modules/system/org/post/post_service.go
backend/modules/system/system_modules.go
backend/modules/system/system_modules_route_groups_test.go
backend/modules/system/system_modules_tenant_wiring_test.go
backend/pkg/authtoken/consume_refresh_test.go
backend/pkg/authtoken/token.go
backend/pkg/contracts/route_groups.go
backend/pkg/contracts/route_groups_system_test.go
backend/pkg/database/migrations/000031_drop_permission_role_data_scope_policy.up.sql
backend/pkg/security/ssrf/README.md
backend/pkg/security/ssrf/transport_test.go
backend/pkg/security/ssrf/validator.go
backend/pkg/testredis/redis.go
backend/pkg/testredis/redis_test.go
config/review-loop-legacy-artifacts.json
config/runtime-evidence-legacy-artifacts.json
config/security-pattern-baseline.json
docs/README.md
docs/acceptances/AGENT_EXECUTION_CHECKLIST.md
docs/contracts/SYSTEM_AUTH_CONTRACT.md
docs/contracts/SYSTEM_IAM_CONTRACT.md
docs/contracts/TENANT_CONTRACT_V1.md
docs/designs/DATA_PERMISSION_HOOK.md
docs/designs/FOUNDATION_RELEASE_MODEL.md
docs/designs/FRONTEND.md
docs/designs/GENERATOR_MODULE_DESIGN.md
docs/designs/MODULE_CONTRACT.md
docs/designs/PERMISSION_MENU_DECOUPLING.md
docs/designs/QUALITY_AND_SECURITY_STRATEGY.md
docs/harness/AI_QUALITY_GOVERNANCE.md
docs/harness/PANTHEON_BASE_DELIVERY_WORKFLOW.md
docs/harness/tasks/2026-11-05-base-freeze-release.task.md
docs/release-notes/RELEASE_NOTES_v0.18.3.md
docs/runbooks/MIGRATION_000031_PRODUCTION_DROP.md
frontend/scripts/run-lowcode-smoke.mjs
frontend/src/api/fetchAllPages.ts
frontend/src/core/router/prefetch.ts
frontend/src/modules/lowcode/generator/backendGenerator.ts
frontend/src/modules/lowcode/generator/frontendGenerator.ts
frontend/src/modules/lowcode/generator/schema.ts
frontend/src/modules/lowcode/generator/typeMapping.ts
frontend/src/modules/system/iam/permission/PermissionList.tsx
frontend/src/modules/system/iam/permission/index.ts
frontend/src/modules/system/iam/role/api.ts
frontend/src/modules/system/iam/user/index.ts
frontend/src/modules/system/iam/user/useUserList.ts
frontend/src/modules/system/org/dept/DeptList.tsx
frontend/src/modules/system/org/dept/index.ts
frontend/src/modules/system/org/post/api.ts
frontend/tests/generator/generator-quality-contract.test.ts
frontend/tests/smoke-core/business-generated-basic.spec.ts
frontend/tests/smoke-core/tenant-console.spec.ts
frontend/tests/smoke/system/system-form-state-matrix.spec.ts
frontend/tests/unit/api/fetchAllPages.test.ts
package.json
scripts/check-security-patterns.mjs
scripts/check-ui-tokens.mjs
scripts/foundation-release/build-release-bundle.mjs
scripts/foundation-release/build-release-manifest.mjs
scripts/foundation-release/frontend-ownership.mjs
scripts/harness/README.md
scripts/harness/README.zh.md
scripts/harness/check-checker-wiring.mjs
scripts/harness/check-evidence.mjs
scripts/harness/check-failure-registry.mjs
scripts/harness/check-review.mjs
scripts/harness/check-runtime-evidence.mjs
scripts/harness/migrate-task-manifests.mjs
scripts/harness/pattern-baseline.mjs
scripts/harness/scan-tree.mjs
tests/scripts/harness-check-checker-wiring.test.mjs
tests/scripts/harness-check-failure-registry.test.mjs
tests/scripts/harness-scan-tree.test.mjs
tests/scripts/security-audit-exit.test.mjs
```
