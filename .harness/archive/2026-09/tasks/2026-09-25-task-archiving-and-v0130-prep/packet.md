# Task Packet: 任务归档和 v0.13.0 准备

**Task ID**: 2026-09-25-task-archiving-and-v0.13.0-prep  
**Created**: 2026-09-25  
**Type**: Governance / Documentation  
**Priority**: P2

## In (输入)

- 60 个活跃任务需要归档
- 历史文档需要整理
- 需要准备 v0.13.0 release

## Out (输出)

- [x] 所有活跃任务归档完成
- [x] 归档索引系统建立
- [x] 文档体系完善
- [x] v0.13.0 准备文档创建

## Acceptance Criteria (验收标准)

- [x] 活跃任务清零 (.harness/tasks/ 为空)
- [x] 归档系统完整 (116 个任务)
- [x] 文档索引创建 (STATUS.md, ARCHIVE.md)
- [x] CI 门禁通过

## Implementation

### 归档工作
1. 复审 60 个活跃任务
2. 归档 44 个已完成任务到 .harness/archive/2026-09/
3. 清理 16 个总结文档到 docs/history/
4. 移动 15 个孤儿 evidence

### 文档创建
- .harness/STATUS.md
- .harness/ARCHIVE.md
- .harness/FINAL_SUMMARY.md
- .harness/EXECUTION_REPORT.md
- .harness/RELEASE_v0.13.0_PREP.md

### 版本准备
- 基于 v0.12.1
- 版本号: v0.13.0
- 类型: 治理增强

## Evidence

见 `.harness/evidence/2026-09-25-task-archiving-and-v0.13.0-prep/`
