# Pantheon Base 当前状态

本页保留当前工作重点；任务状态以 [TASK_INDEX](./TASK_INDEX.md) 和各包 manifest 为准，进度写目标任务 summary。

## 当前版本与任务

- 工作树产品版本：[VERSION](../VERSION)；正式发行看 [GitHub Releases](https://github.com/duanxldragon/pantheon-base/releases/latest) 与对应发行证据。11/13 的发行/消费结论属于历史候选。
- 本地 workspace 另有 Ops completion contracts、release naming、business runtime settings、archive formatter protection 在途任务；仅存在于本地的 manifest 不随本 PR 提交，当前已跟踪任务见索引。
- 底座产品实现由其他任务推进；验证须绑定实际候选，不能以旧发行测试代签。
- Ops 实际消费以其 foundation-release.lock.json 为准。共享产品修改仍需 Base 正式发行与 Ops 重建；方法 policy receipt 不改变该边界。

## 开放验收与后续

- 维护冻结未签署；真实 S3 provider 验证未完成且未获豁免。
- FR028 大审计存储、生产迁移、旧认证退役保留原范围与负责人，见 [failure registry](../docs/harness/failure-registry.md)。
- archive formatter protection 的正式发布/消费仍开放；新方法检查器与索引 helper 处于 Harness Unreleased。
- 本次工作机制改进已收口：Harness PR #13（`51fc783d`）、Base PR #526（merge `768c3708`）、Ops PR #209（merge `60bfdf98`）均合并；hosted 必过门禁为绿（Ops 的 Automate Solo PR / Vercel 为既有非必需外部红灯）。正式发行、消费重建与产品验收仍分开。

## 历史

- [完整原状态快照](./archive/2026-11/STATUS-before-workflow-improvement-20261124.md)：按原字节保留，不能作为当前任务索引。
- [月度归档](./ARCHIVE.md)：归档 completed 只表示原任务范围关闭。
