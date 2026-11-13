---
title: Pantheon Base 文档与完成任务归档收口
doc_type: Remediation
layer: platform
status: Draft
updated_at: 2026-11-13
linked_contracts:
  - docs/contracts/DOCUMENT_GOVERNANCE_CONTRACT.md
---

# Task Packet: 2026-11-13-docs-archive-closeout

## Goal

对齐已发布 v0.18.8 的双语入口、GitHub 描述和完成任务档案；保留原始检查点与未完成验收。交付 L1，复用已有归档解析和校验器。

## Primary Layer

platform

## Dependency Layers

- platform

## Workspace Context

- Target Repository: pantheon-base
- Repository Role: foundation-source
- Upstream Dependencies: pantheon-harness
- Downstream Consumers: pantheon-ops
- Sync Expectation: not-required
- Release Requirement: none

## Harness Profile

- Template: admin-platform
- Overlay: pantheon-base
- Quality Profile: ci-workflow
- Portable Failure Class: harness-governance
- Owner Layer: foundation-source
- Ratchet Decision: guide-updated
- Coverage Dimensions:
  - maintainability
  - method-health
  - architecture-fitness

## Contract Anchors

- docs/contracts/DOCUMENT_GOVERNANCE_CONTRACT.md
- docs/harness/VERIFICATION_EVIDENCE_SPEC.md
- docs/harness/REVIEW_LOOP_SPEC.md
- .harness/ARCHIVE.md

## Scope

### In

- 归档后普通 Markdown href 指向物理地址；合同/设计/runbook/历史任务正文仅修 href，不改语义。冻结发行说明追加可点击归档链接。

- 双语 README、docs 与发行索引、当前状态、GitHub 仓库描述。
- 18 个已完成 manifest 与 evidence 整目录 git mv；校验原文件哈希。
- v0.18.8 发行说明只追加正式发行记录；旧 STATUS 保留历史快照。

### Out

- 产品代码、UI、workflow、门禁策略、依赖、VERSION 和不可变资产。
- Ops 消费升级、冻结签署、S3 豁免、FR028、生产迁移与独立业务验收。
- 没有 manifest/完成证据的旧正文、重复证据与散落 PR 正文。

## Structural Scope

- Affected Subgraph: README -> docs index -> STATUS -> archive manifest/evidence
- Boundary Crossings: documentation to existing archive-aware resolver; no implementation changes
- Risk Nodes: historical pending statements, moved evidence links, overclaimed consumer acceptance
- Graph Focus: sensitive-flow

## Expected Files

### Create

- docs/harness/tasks/2026-11-13-docs-archive-closeout.task.md
- .harness/tasks/2026-11-13-docs-archive-closeout/manifest.json
- .harness/evidence/2026-11-13-docs-archive-closeout/{commands.json,summary.md,review.md,pr-body.md,archive-receipt.json}
- .harness/archive/2026-11/STATUS-before-doc-closeout.md

### Modify

- 受影响合同、设计、初始化指南、runbook 与历史任务正文的归档 href（见 markdown-link-migration.json）。

- README.md / README.en.md / docs/README.md / docs/README.en.md
- docs/release-notes/README.md / README.en.md / RELEASE_NOTES_v0.18.8.md
- .harness/STATUS.md / .harness/ARCHIVE.md

### Do Not Touch

- backend/ / frontend/ / scripts/ / .github/ / VERSION / CHANGELOG.md / Ops

## Implementation Notes

复用最小复杂度阶梯：已有 git mv 和 archive-aware resolver 足够，不新增依赖或 checker。manifest/evidence 保留 canonical linkage 和旧评审 verdict；关闭依据取 completion/currentDelivery 和后续发行/消费证据。任务正文按既有约定留在 docs/harness/tasks。

## Execution Roles

- Implementer Posture: Dispatcher 编辑文档、读取主机事实并做可回退归档。
- Reviewer Posture: 独立非作者核对字节完整性、发布身份、历史范围和保留事项。

## Verification Plan

- npm run check:docs-frontmatter
- npm run check:task-packet-template
- npm run check:task-packet
- npm run check:harness-docs
- npm run check:harness-inventory
- npm run check:harness-encoding
- npm run check:structure
- npm run check:harness-evidence
- npm run check:harness-review
- npm run check:harness-runtime-evidence
- npm run check:duplication
- 目录聚合 SHA-256、canonical 引用解析、GitHub metadata readback 与 PR checks。

## Linkage

- Task ID: 2026-11-13-docs-archive-closeout
- Task Manifest: .harness/tasks/2026-11-13-docs-archive-closeout/manifest.json
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: .harness/ARCHIVE.md
- Evidence Directory: .harness/evidence/2026-11-13-docs-archive-closeout/
- Review File: .harness/evidence/2026-11-13-docs-archive-closeout/review.md

## Evidence Required

- commands.json：实际命令/退出码/压缩日志哈希。
- archive-receipt.json：每目录前后字节摘要与关闭依据。
- summary.md / review.md / pr-body.md：验证、独立评审与门禁链路。

## Human Gates

用户已授权更新文档、GitHub 描述和完成任务归档；一位非作者评审与正常必过 CI。策略豁免、冻结/生产操作和 Ops 验收仍独立。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
