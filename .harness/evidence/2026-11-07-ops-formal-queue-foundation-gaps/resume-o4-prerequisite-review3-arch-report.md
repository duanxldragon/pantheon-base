**CLI 摘要：ARCH `CLEAR`——当前 prerequisite 源码未发现未解决的架构阻断。联合批准仍等待 review3 CODE；本次不关闭 O4/P0，也不批准正式消费或发布。**

## Summary

此前 ARCH 摘要中的 telemetry 和目录所有权阻断，在当前源码中均已闭合；review2 CODE 新增的原错误被 cleanup 掩盖问题也已修复。当前组合具备进入 paired candidate 与业务后端接入的架构条件，但实际推进仍须 root 收齐两条独立 review3 lane，符合[既定门禁](/D:/workspace/go/pantheon-platform/pantheon-base/.harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/resume-o4-prerequisite-review2-code-handoff.md:119)。

## Analysis

1. **隐私策略现在覆盖实际采集入口。**  
   生产装配将安全 telemetry 放在 body、CSRF、rate、auth 拒绝之前，并在注册路由后验证、封存策略：[main.go:137](/D:/workspace/go/pantheon-platform/pantheon-base/backend/cmd/server/main.go:137)。安全 span 使用注册的 method/template、服务端 request ID、新 root 和空 baggage；错误及 panic 只记录固定事件，状态描述为空：[business_telemetry_middleware.go:28](/D:/workspace/go/pantheon-platform/pantheon-base/backend/internal/middleware/business_telemetry_middleware.go:28)。Legacy filter 同时检查冻结标记，防止后续请求变动重新启用原始采集：[同文件:90](/D:/workspace/go/pantheon-platform/pantheon-base/backend/internal/middleware/business_telemetry_middleware.go:90)。审计分支在安装请求/响应捕获前选定，只保存 typed metadata：[operation_log_middleware.go:230](/D:/workspace/go/pantheon-platform/pantheon-base/backend/internal/middleware/operation_log_middleware.go:230)。

2. **身份、租户来源及当前权限保持独立边界。**  
   新 route group 明确按 fresh token → tenant context → authorization 排序：[business_tenant_groups.go:89](/D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/contracts/business_tenant_groups.go:89)。实时 session 读取要求正 PTTL，两个 blacklist 只有 `redis.Nil` 才表示未吊销：[businessauth.go:58](/D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/contracts/businessauth/businessauth.go:58)。实际全局绑定来自 tenant0 的 SQL join；header override 保留全局权限来源，不取得目标租户角色，也不能绕过 originating claim 的有效性：[business_authorization.go:65](/D:/workspace/go/pantheon-platform/pantheon-base/backend/modules/auth/login/business_authorization.go:65)、[同文件:100](/D:/workspace/go/pantheon-platform/pantheon-base/backend/modules/auth/login/business_authorization.go:100)。

3. **fresh-authority seam 可用，出口复检仍由业务接入承担。**  
   `Reauthorize`复制冻结输入、核对 mode，再调用当前授权 reader；当前 Casbin 使用既有 model 和持久化 adapter，DataScope 只消费实际授予动作的绑定：[businessauth.go:110](/D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/contracts/businessauth/businessauth.go:110)、[business_policy.go:15](/D:/workspace/go/pantheon-platform/pantheon-base/backend/pkg/database/business_policy.go:15)、[business_authorization.go:38](/D:/workspace/go/pantheon-platform/pantheon-base/backend/internal/middleware/business_authorization.go:38)。实际测试在 provider 阻塞期间撤销权限，并要求出口不泄露结果：[business_authorization_test.go:198](/D:/workspace/go/pantheon-platform/pantheon-base/backend/modules/auth/login/business_authorization_test.go:198)。这证明 seam 的行为，不代替 Ops handler 的真实接入验收。

4. **producer 的已观察目录替换风险关闭。**  
   producer 记录 bigint stage/ancestor `dev/ino`；封印前检查实例、限定两个允许文件，失败清理采用逐项检查的 `unlink/rmdir`，无递归删除，cleanup 拒绝保留 primary cause：[build-candidate-artifact.mjs:104](/D:/workspace/go/pantheon-platform/pantheon-base/scripts/foundation-release/build-candidate-artifact.mjs:104)。回归覆盖 write/verification、stage/ancestor/nested 替换，以及成功 rename 前的字节相同替换：[candidate-artifact.test.mjs:113](/D:/workspace/go/pantheon-platform/pantheon-base/scripts/foundation-release/candidate-artifact.test.mjs:113)、[同文件:168](/D:/workspace/go/pantheon-platform/pantheon-base/scripts/foundation-release/candidate-artifact.test.mjs:168)。

5. **consumer 的保留策略与错误证据兼容。**  
   cleanup 对完整目录树预检，不从位置推断 assembler-created directory 的所有权；未知目录保留：[foundation-candidate.mjs:762](/D:/workspace/go/pantheon-platform/pantheon-ops/scripts/business-overlay/foundation-candidate.mjs:762)。修复后的 catch 传入 `{ cause: error }`，CLI 输出 cleanup 和原始原因：[rebuild-from-candidate.mjs:257](/D:/workspace/go/pantheon-platform/pantheon-ops/scripts/business-overlay/rebuild-from-candidate.mjs:257)、[同文件:329](/D:/workspace/go/pantheon-platform/pantheon-ops/scripts/business-overlay/rebuild-from-candidate.mjs:329)。mutation、drift、migration 测试现在要求具体原始 cause，新增真实 CLI 回归：[foundation-candidate.test.mjs:903](/D:/workspace/go/pantheon-platform/pantheon-ops/scripts/business-overlay/foundation-candidate.test.mjs:903)、[同文件:1072](/D:/workspace/go/pantheon-platform/pantheon-ops/scripts/business-overlay/foundation-candidate.test.mjs:1072)。

## Root Cause

此前报告揭示的是**保护未覆盖最终执行边界**：metadata 策略未约束生产 telemetry 采集，目录 pathname 被当作目录实例所有权；随后 cleanup 拒绝又覆盖了主失败证据。[review2 CODE:29](/D:/workspace/go/pantheon-platform/pantheon-base/.harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/resume-o4-prerequisite-review2-code-handoff.md:29)、[同报告:46](/D:/workspace/go/pantheon-platform/pantheon-base/.harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/resume-o4-prerequisite-review2-code-handoff.md:46)。当前修复分别落在采集入口、文件系统实例检查和错误链上。

## Recommendations

1. **root 收齐 review3 CODE 后再推进配对** — 低工作量，高门禁价值；绑定以下精确源码哈希。
2. **Ops 在 outbound 前、provider 后及 DTO/write 出口调用 `Reauthorize`，重新核对 datasource 与 DataScope** — 中等工作量，直接影响真实隔离；这是[revision4:101](/D:/workspace/go/pantheon-platform/pantheon-base/.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md:101)要求的业务责任。
3. **保持 candidate receipt 的 staging 语义** — 后续 build/runtime、生成器、迁移、live acceptance 和正式消费分别验收；当前工具明确标记 `officialConsumption: false`：[rebuild-from-candidate.mjs:243](/D:/workspace/go/pantheon-platform/pantheon-ops/scripts/business-overlay/rebuild-from-candidate.mjs:243)。

## Architectural Status

`CLEAR`，限当前 prerequisite 源码；不构成两 lane 联合批准。

## Trade-offs

| 当前选择                     | 收益                                | 成本／边界                                |
| ---------------------------- | ----------------------------------- | ----------------------------------------- |
| 新 root、固定 metadata/event | 防止客户端及错误文本进入保护 span   | 失去客户端 trace 连续性和原始错误详情     |
| 每 checkpoint 读取当前权限   | 避免缓存与 token role snapshot 授权 | 增加 DB/Redis 读取；不提供全请求原子撤权  |
| 实例检查、未知目录保留       | 防止已观察的替换目录被递归删除      | 保留失败 stage；独立 syscall 仍有竞态窗口 |

最强反对意见是 pathname 检查并非原子 namespace 锁，保留 assembled stage 也会阻止同 identity 重试。源码和测试明确承认这些限制：[producer:126](/D:/workspace/go/pantheon-platform/pantheon-base/scripts/foundation-release/build-candidate-artifact.mjs:126)、[consumer:795](/D:/workspace/go/pantheon-platform/pantheon-ops/scripts/business-overlay/foundation-candidate.mjs:795)。当前 bounded prerequisite 不宣称原子锁、回滚或自动清理，因此这些限制不构成本轮架构阻断。

## Verification / References

69 个冻结路径复审前后全部一致；其中 65 个与 review2 一致，仅指定四个 delta 改变。完整历史清单见[review2:127](/D:/workspace/go/pantheon-platform/pantheon-base/.harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/resume-o4-prerequisite-review2-code-handoff.md:127)。以下均为本轮 **before = after SHA256**：

| 文件          | SHA256                                                             |
| ------------- | ------------------------------------------------------------------ |
| Base producer | `9ba91562d0854701cc1eacc58e854fcc122af096721c3ec83fe914a171932352` |
| Base test     | `1c5869e4c0f4670ccacf89333e9010607a0aca1c14cccf0eedb5926c2cea8a8f` |
| Ops rebuild   | `cbcf32ed8246736eb78469eabffa9d80145c67bfaf96d4a9928d660cabc74e32` |
| Ops test      | `4590052710de1c1d283400cf7ef9784cb2095722154a265523360e55e578e32b` |
| Ops resolver  | `da8a8eeeb0a9f52514b157353475a75d43675711f264731cd8564398d7610161` |

四个 delta 的 fresh `node --check` 均 exit0。Base 29/29、Ops 64/64引用[最终 receipt:10](/D:/workspace/go/pantheon-platform/pantheon-base/.harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/resume-o4-final-tooling-root-receipt.json:10)，未作为本轮重跑结果。原 ARCH 详细报告不可恢复，review2 ARCH receipt 为[exit1 / report null](/D:/workspace/go/pantheon-platform/pantheon-base/.harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/resume-o4-prerequisite-review2-arch-report.receipt.json:3)；本轮依据现存摘要和实际源码独立判断。

诊断与建议已获得源码依据，复审到此停止。按明确只读约束，未落盘请求的 ARCH handoff，也未修改源码；以上文本可由 root 保存为独立报告。
