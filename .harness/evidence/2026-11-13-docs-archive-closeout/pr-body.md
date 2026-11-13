## 变更摘要

Pantheon Base 入口文档仍停留在 v0.18.8 准备阶段，本次对齐已发布提交及不可变资产，更新双语 README 和 GitHub 描述，并归档 18 个已完成任务。历史评审与残余验收范围保留。

- 改动层级: platform
- 改动模块: documentation / harness archives / GitHub repository metadata
- 目标问题: 入口仍显示发行待完成，完成任务滞留活跃目录
- 预期影响: 对齐正式 v0.18.8、改善导航并保留可追溯完成档案

## Harness 链路

- Task ID: 2026-11-13-docs-archive-closeout
- Task Manifest: .harness/tasks/2026-11-13-docs-archive-closeout/manifest.json
- Evidence: .harness/evidence/2026-11-13-docs-archive-closeout/summary.md
- Verification evidence: .harness/evidence/2026-11-13-docs-archive-closeout/commands.json
- Review Artifact: .harness/evidence/2026-11-13-docs-archive-closeout/review.md
- OpenSpec change: none
- Trivial change: no
- Quality Profile: ci-workflow
- Ratchet Decision: guide-updated
- GitHub Signal: repo-quality-gate

## Harness adoption markers

- task id: 2026-11-13-docs-archive-closeout
- task manifest: .harness/tasks/2026-11-13-docs-archive-closeout/manifest.json
- evidence: .harness/evidence/2026-11-13-docs-archive-closeout/commands.json
- boundaries: platform documentation and completed evidence only
- backend response contract: none
- backend DTO contract: none
- permission contract: none
- audit coverage: none
- visual evidence: none
- inheritance contract: no contract change; official v0.18.8 Ops adoption deferred
- base drift: none
- Base/ops inheritance: Base documentation only; Ops official lock remains v0.18.7

## 边界说明

- [x] 平台层文档与治理档案；未改产品源码、workflow、门禁、VERSION、发布资产或 Ops。
- [x] 完成 manifest/evidence 依既有约定 git mv；canonical 路径由现有 archive-aware resolver 解析。
- [x] 发行说明仅追加终局事实；历史正文、旧 review verdict 与未完成验收保留。

## 验证记录

- [x] 11 项适用文档与治理检查最终通过，执行和 gzip/raw SHA-256 见 commands.json。
- [x] 18 对目录完整性通过；1264 个原 tracked 文件与原 main 逐字节一致。库存 255 tasks / 261 evidence。
- [x] GitHub 描述写入与 readback 完全一致。
- [x] 独立非作者 review APPROVE 已保存；隔离提交的11项检查全部通过。
- [ ] Exact PR hosted checks 将在交付前完成。

## 审核留痕

- Copilot review: automatic-policy; independent non-author review artifact also required
- CodeQL 结果: source unchanged; published main alerts #100–108 fixed automatically, zero dismissals
- GitHub checks 结果: pending exact PR hosted checks
- Auto-merge: not-enabled; normal required checks govern merge
- Duplication Gate 结果: local PASS
- 是否高风险改动: no; documentation and reversible archive moves only
- Residual risk / follow-up: Ops v0.18.8 upgrade, freeze signature, S3 provider, FR028 and separate production/product acceptance remain scoped separately

## 检查清单

- [x] 归属层与变更边界明确。
- [x] 双语入口与当前状态一致；历史证据可追溯。
- [x] 原始档案字节与旧失败/skip/blocked 证据保留。
- [x] 既有真实残余事项未被关闭或豁免。
- [ ] 独立评审及正常 GitHub required checks 完成后合并。
