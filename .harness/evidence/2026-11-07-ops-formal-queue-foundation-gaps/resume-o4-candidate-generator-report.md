Base 候选工具已实现并验证；整项任务仍被 Ops 目录的只读权限阻塞。

## Changes Made

- [build-candidate-artifact.mjs](/D:/workspace/go/pantheon-platform/pantheon-base/scripts/foundation-release/build-candidate-artifact.mjs) — 源码稳定性检查、候选封存与原子发布。
- [candidate-descriptor.mjs](/D:/workspace/go/pantheon-platform/pantheon-base/scripts/foundation-release/candidate-descriptor.mjs) — descriptor、归档、capability/export 和 executable 身份校验。
- [candidate-artifact.test.mjs](/D:/workspace/go/pantheon-platform/pantheon-base/scripts/foundation-release/candidate-artifact.test.mjs) — 篡改、危险路径、链接、碰撞、源码变更和失败清理测试。

## Verification

- 候选及既有 release 测试：**71/71 通过**。
- Ops 既有 overlay 测试：**62/62 通过**。
- 三个新增文件 `node --check`、治理检查通过。
- 正式 producer、resolver、assembler/drift 和 Ops lock 哈希保持不变。

## Assumptions / Notes

Ops 三个指定文件尚未创建。需要将 `pantheon-ops` 加入可写 workspace root 才能继续。独立 CODE/ARCH review、产品封存及配对 runtime 仍待完成。

## Summary

工具哈希、导出接口、CLI 示例和剩余工作已保存到[交接证据](/D:/workspace/go/pantheon-platform/pantheon-base/.harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/resume-o4-candidate-tooling.md)。没有修改正式 lock，也没有提交、推送或发布。
