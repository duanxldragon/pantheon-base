## Code Review Summary

**结论：REQUEST CHANGES。** 发现 **4 个 MEDIUM、1 个 LOW** 问题；未发现已证实的 CRITICAL/HIGH 问题。规格符合性仍有缺口，运行态证据检查存在掩盖失败的分支，不能仅凭 CI 放行。

- PR：[#489](https://github.com/duanxldragon/pantheon-base/pull/489)
- 基线：`52550603`
- 候选：`1a7b388bcaa2c178346b7fcaa78cf6c0b057e246`
- backend tree：`02341ada0ee53a3924522a6599723be71c060658`
- frontend/src tree：`a3351c514bced1a6885abcc54a5d57f986b01062`

已核实两个产品代码树与 `57b42ace467dd6f96db232bfebab7626f07c84be` 相同。完整差异盘点覆盖 **367 个文件**；重点逐文件审阅 **55 个变更源码、测试及配置文件**，清单见后文。其余大型历史报告和设计草案未作逐行全文审计，不计入这 55 个文件。

### Issues

**1. [MEDIUM] evidence 的 `false` 可以覆盖 task 明确声明的运行态风险**

文件：[check-runtime-evidence.mjs:95](/D:/workspace/go/pantheon-platform/pantheon-base/scripts/harness/check-runtime-evidence.mjs:95)

`payload.runtimeSensitive=false` 会阻止读取 manifest 中的 `runtimeSensitive=true`，随后提前返回成功，即使没有任何运行态证据或 gap。

已用实际检查器源码做内存差分验证，同一输入：

```text
task:     runtimeSensitive=true，计划 browser smoke
evidence: runtimeSensitive=false，无 runtime 信号或 gap

基线：产生缺少运行态证据警告，strict 模式阻断
候选：warnings=[]，errors=[]
```

这是新增的失败掩盖路径。任务允许“显式 false 优先于模糊计划文本”，并不意味着应忽略两个显式布尔声明之间的冲突。

**修复：** 对相互矛盾的显式声明报错，或保留任一 `true` 的证据要求；历史文本兼容应限制在对应边界。增加上述冲突回归，确保缺失证据继续可见。

**2. [MEDIUM] 分页候选没有稳定排序，仍可能漏项却宣告收齐**

文件：[useUserList.ts:333](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/modules/system/iam/user/useUserList.ts:333)、[fetchAllPages.ts:23](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/api/fetchAllPages.ts:23)

新增聚合请求使用 `sortField: 'sort'`。实际服务端 [role_service.go:107](/D:/workspace/go/pantheon-platform/pantheon-base/backend/modules/system/iam/role/role_service.go:107) 和 [post_service.go:82](/D:/workspace/go/pantheon-platform/pantheon-base/backend/modules/system/org/post/post_service.go:82) 只按该列排序，没有唯一键作为次序补充。

超过 100 条角色或岗位共享相同 `sort` 时，MySQL 不保证各个 OFFSET 查询中相等值的顺序一致。跨页可能重复、遗漏；helper 仅按数组长度达到 `total` 判断完成。内存探针已确认：返回 200 行、只有 100 个唯一值时仍成功结束。现有测试也只检查长度。

**修复：** 服务端追加稳定的唯一键排序，例如 `ORDER BY sort, id`，保持所有相关调用一致；用超过 100 条同排序值的数据验证完整 ID 集合。单纯去重无法找回遗漏行。此轮未执行真实 MySQL 重排复现，结论基于实际 SQL 与聚合逻辑。

**3. [MEDIUM] 新增真实创建表单不能创建必填布尔值为 `false` 的记录**

文件：[frontendGenerator.ts:700](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/modules/lowcode/generator/frontendGenerator.ts:700)、[backendGenerator.ts:346](/D:/workspace/go/pantheon-platform/pantheon-base/frontend/src/modules/lowcode/generator/backendGenerator.ts:346)

实际运行候选生成器，针对 `enabled: bool, required: true` 得到：

```text
表单初值：enabled: false
前端提交检查：只拒绝 null / undefined
Go CreateReq：Enabled bool `json:"enabled" binding:"required"`
```

已检查 Gin 使用的 validator 实现：非指针布尔值的 `required` 使用零值检查，因此 `false` 被判为缺失。用户保留关闭状态提交会得到参数错误。

DTO 问题原已存在，本次新增真实创建入口使其进入承诺交付的 CRUD 流程；现有布尔更新验证不能证明布尔创建正确。

**修复：** 使用能区分“未提供”和 `false` 的创建 DTO，并同步转换逻辑。回归至少覆盖缺字段拒绝、`false` 创建成功、`true` 创建成功。

**4. [MEDIUM] SSRF 首地址超时会耗尽所有地址的连接机会**

文件：[validator.go:151](/D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/security/ssrf/validator.go:151)

循环把同一个整体 deadline 交给每次数值 IP 拨号。若第一个公网地址丢弃 SYN，它会占用整个期限；循环到第二个可用地址时，`ctx.Err()` 已直接返回超时。

原 `net.Dialer` 的多地址路径会分配单地址期限，并提供双栈连接竞速；逐个传入数值 IP 后，这些能力不再自动作用于整组地址。已检查 Ops datasource/webhook 的实际消费者，它们使用该客户端。

现有多地址测试只模拟立即返回错误，因此不能覆盖这个退化。

**修复：** 在已验证地址集合内分配每次尝试的期限，必要时保留双栈竞速；不得回退到未绑定地址的 hostname 拨号。增加“首地址阻塞、第二地址可达”的验证，并保留整体超时及 Host/SNI 断言。

**5. [LOW] token-storage 规则命中后扫描器抛出 TypeError**

文件：[check-security-patterns.mjs:147](/D:/workspace/go/pantheon-platform/pantheon-base/scripts/check-security-patterns.mjs:147)

`runPattern` 的第三个参数应为描述字符串，这里误传了正则。命中后，汇总阶段调用 `finding.description.includes(...)` 崩溃。

已用实际源码注入匹配结果复现：

```text
TypeError: finding.description.includes is not a function
```

这不会静默放行，但会丢失正常的发现报告和级别处理。

**修复：** 恢复字符串描述，增加规则命中时能完整输出报告的回归。

### 验证与边界

- **规格先行：** 核对任务包、认证/IAM/组织/租户 V1 合同后检查实现。上述分页完整性、创建语义和运行态门禁问题使规格阶段不能完全通过。
- **认证与授权：** GETDEL 确实发生在刷新会话和签发之前；条件更新检查撤销、到期、旧 JTI 和 tenant。Sonar 拆分后的竞争测试仍保留拒绝签发及数据库状态断言。系统路由转换保留用户 list/export 数据范围、平台能力检查及上传租户上下文。
- **失败处理：** npm audit 的失败退出码恢复传播，后续检查使用 step `outcome`；既有 PR advisory 策略没有被本次改为更宽松。未把所有兼容分支一概判错。
- **诊断：** 没有可调用的 `lsp_diagnostics` / `ast_grep_search`。替代执行了全部 **19 个 Go 修改文件的 `gopls check`**，退出 0；正式前端配置的 TypeScript 诊断为 0。扩展到全部 14 个修改 TS/TSX 文件后有 5 项诊断，基线对照为 6 项，剩余均为基线已有问题，不能称整个测试树类型检查全绿。
- **其他检查：** 29 个 TS/TSX/MJS 文件进行了 TypeScript AST 模式检查；15 个 MJS 语法检查、3 个 workflow YAML 解析及 `git diff --check` 通过。独立重跑 `TestDialChecked* / TestPinnedDial*` 通过。
- **UI：** 使用 impeccable，实际查看既有 390px 创建弹窗和 1440px 编辑失败截图。没有重新启动浏览器；未据此宣称全部状态或字段类型验收通过。
- **发行与消费：** helper 移到 `frontend/src/api` 后被既有 foundation 共享路径覆盖，相关页面、预取和测试导入已同步。v0.18.3 仍未发布；官方资产、Ops overlay 重建及 `000031` 冲突整合尚未验证。
- **其他限制：** 未独立重跑完整 MySQL/Redis race、全部 smoke 或真实 S3；现有结果仅作上下文。当前 HEAD 的远端 CI 未在本轮重新查询。CodeGraph CLI 多次无法打开数据库，且一次返回的源码位置明显与当前文件不一致，相关结论改由实际文件读取支撑。

### 主审文件清单（55）

```text
.github/workflows/pr-automation.yml
.github/workflows/quality.yml
.github/workflows/security.yml
backend/internal/middleware/data_scope_middleware.go
backend/internal/middleware/data_scope_schema_test.go
backend/modules/auth/login/login_handler.go
backend/modules/auth/login/refresh_rotation_test.go
backend/modules/auth/session/refresh_race_test.go
backend/modules/auth/session/session_service.go
backend/modules/system/org/dept/dept_bootstrap_scope_test.go
backend/modules/system/org/dept/dept_service.go
backend/modules/system/system_modules.go
backend/modules/system/system_modules_route_groups_test.go
backend/modules/system/system_modules_tenant_wiring_test.go
backend/pkg/authtoken/consume_refresh_test.go
backend/pkg/authtoken/token.go
backend/pkg/contracts/route_groups.go
backend/pkg/contracts/route_groups_system_test.go
backend/pkg/security/ssrf/transport_test.go
backend/pkg/security/ssrf/validator.go
backend/pkg/testredis/redis.go
backend/pkg/testredis/redis_test.go
config/review-loop-legacy-artifacts.json
config/runtime-evidence-legacy-artifacts.json
config/security-pattern-baseline.json
frontend/scripts/run-lowcode-smoke.mjs
frontend/src/api/fetchAllPages.ts
frontend/src/modules/lowcode/generator/backendGenerator.ts
frontend/src/modules/lowcode/generator/frontendGenerator.ts
frontend/src/modules/system/iam/permission/PermissionList.tsx
frontend/src/modules/system/iam/permission/index.ts
frontend/src/modules/system/iam/user/index.ts
frontend/src/modules/system/iam/user/useUserList.ts
frontend/src/modules/system/org/dept/DeptList.tsx
frontend/src/modules/system/org/dept/index.ts
frontend/tests/generator/generator-quality-contract.test.ts
frontend/tests/smoke-core/business-generated-basic.spec.ts
frontend/tests/smoke-core/tenant-console.spec.ts
frontend/tests/smoke/system/system-form-state-matrix.spec.ts
frontend/tests/unit/api/fetchAllPages.test.ts
package.json
scripts/check-security-patterns.mjs
scripts/check-ui-tokens.mjs
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

本 lane 的代码/spec/security 审查结束，建议修复上述问题后复审；架构最终裁定由另一独立 lane 给出。本轮未修改仓库文件、发送 GitHub 消息或执行发布操作。
