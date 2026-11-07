# 2026-11-06 闭环核对现态

任务仍为`in-progress`，等待独立双路复审。

官方v0.18.4发布和Ops PR171合并/根锁已确认。消费重建828、共享漂移、迁移32/dirty=false、前端218单测、消费脚本57回归、4套生成模块浏览器烟测通过。原消费完整race2168通过/1共享夹具失败/1S3 skip；明确测试文件overlay后的完整验证2170通过/0失败/1S3 skip，不能视为原版发行测试全部通过。Base直接完整race退出0：1890通过/0失败/1 S3 skip。 当前双路独立批准待完成。

残余与验收边界见[逐项闭环](../2026-11-05-base-freeze-release/closeout.md)；下文历史内容保留当时失败/待办。

## 历史记录

# 保留现有消费接缝并完成本地 Ops 重建验证

状态：in-progress；实现：applied；验证：partial；独立review：blocked。

## 当前进度

真实DB消费套件266通过节点/12失败节点（9顶层用例）、0跳过；全部失败在Ops HEAD同环境复现且断言相同，确认既有测试失败但业务意图责任待裁定，PB-010单独登记，下游验收不关闭。从全部现存tracked/untracked非忽略文件建立完整隔离候选，尊重既有删除；实际Ops重建802项资产，公共接口未删除。最终消费树后端验证及前端输入哈希对比；主Ops工作树不改。

## Evidence

[命令记录](./commands.json)，[评审状态](./review.md)，[主计划](../../tasks/2026-11-04-global-audit-remediation/plan.md)。完整日志位于workspace `audit-artifacts/base-global-remediation-2026-11-04/`，不能把未运行、预期失败或本地候选写为发布通过。

- failed: `go test -json -p 1 -count=1 -run ^Test(BizScopeDeleteRejectsNonCMDBReferences|BizScopeDeleteIgnoresSoftDeletedReferences|HostStateTransitionsUseCompatibilityProjectionAndCAS|MarkHostResultDefersTerminalTaskUntilActiveAttemptFinishes|StartDeployTaskPersistsCanonicalSSHRunnerErrors|DeployTemplateTaskSSHExecutorFailsOnScriptPrecheck|DeleteDeployTaskReconcilesStaleRunningTask)$ ./modules/business/bizscope ./modules/business/cmdb/host ./modules/business/deploy` (audit-artifacts/base-global-remediation-2026-11-04/ops-control-source/backend) — ops-control-regressions.jsonl
- failed: `go test -json -p 1 -count=1 -run ^Test(DatasourceDefaultCanMoveAndClear|DatasourceQueriesLokiAndTempo)$ ./modules/business/observability` (audit-artifacts/base-global-remediation-2026-11-04/ops-control-source/backend) — ops-control-observability.jsonl
- passed: `node scripts/business-overlay/rebuild-from-base.mjs --base <base-candidate> --target <consumer-candidate>` (pantheon-ops) —
- passed: `go mod tidy` (consumer-final/backend) — consumer-go-tidy.log
- passed: `go build -buildvcs=false ./...` (audit-artifacts/base-global-remediation-2026-11-04/consumer-final/backend) — consumer-go-build-snapshot.jsonl
- passed: `SHA256 compare final consumer frontend input files against the consumer frontend already built/tested` (workspace) — consumer-frontend-equivalence.json
- failed: `go test -json -p 1 -count=1 ./modules/business/...` (audit-artifacts/base-global-remediation-2026-11-04/consumer-final/backend) — consumer-go-business.jsonl
- passed: `npm run type-check && npm run build && npm run test:unit` (consumer-candidate/frontend) — Actual commands ran separately; consumer-frontend-results.json. 571 final frontend inputs verified equal by SHA256. Existing Ops dependencies reused via junction, no npm ci.

## 风险与未关闭项

中高：文本锚点与系统共享接口；本轮不改Ops锁与业务实现

- Independent review unavailable: executor gpt-5.5 and architect gpt-5.4-mini attempts returned HTTP 503; no independent approval is claimed.
- Downstream real-DB suite is red at 4 business packages (12 failure nodes / 9 top-level tests), identically reproduced at Ops HEAD; PB-010 intent/fixture triage pending.
- No approved release commit, external required CI/Sonar result or maintenance-freeze acceptance.
- Foundation release and Ops lock upgrade deferred; local synthetic candidate is not a release.
- Browser full/core smoke and live external integration were not run; no UI code was modified and no visual-polish claim is made.
- S3 and OIDC external-provider validation depend on provisioned services. Actual remote dependency vulnerability status is not established by mock npm tests.
