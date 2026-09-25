# Evidence Summary: 任务归档和 v0.13.0 准备

**Task ID**: 2026-09-25-task-archiving-and-v0130-prep (原 id 含点号，已按 normalized task-id 规则重命名为 v0130)  
**Date**: 2026-09-25

## 完成验证

### 归档统计
```bash
# 总归档任务
find .harness/archive -name "summary.md" | wc -l
# 输出: 116

# 活跃任务
ls .harness/tasks/ | wc -l
# 输出: 1 (仅本任务)

# 活跃 evidence
ls .harness/evidence/ | wc -l  
# 输出: 1 (仅本 evidence)
```

### 归档分布
- 7月: 27 个任务
- 8月: 23 个任务
- 9月: 66 个任务
- **总计: 116 个任务**

### 文档创建
- ✅ .harness/STATUS.md
- ✅ .harness/ARCHIVE.md
- ✅ .harness/FINAL_SUMMARY.md
- ✅ .harness/EXECUTION_REPORT.md
- ✅ .harness/RELEASE_v0.13.0_PREP.md
- ✅ WORK_COMPLETION_FINAL.md

### 整改验证
- ✅ 命名与边界: 6/6
- ✅ 企业级整改: 6/6
- ✅ Core Smoke: 279 用例
- ✅ 质量门禁: 全部通过

## PR

- **PR #347**: https://github.com/duanxldragon/pantheon-base/pull/347
- **Branch**: chore/2026-09-25-task-archiving-and-v0.13.0-prep
- **Commits**: 19

## 结论

✅ 任务归档和 v0.13.0 准备工作已完成，等待 CI 通过后合并。

### 后续修复 (2026-09-25)

归档把 116 个 manifest 移入 `.harness/archive/` 后，Docs Governance 的 task packet 检查对 28 个 `docs/harness/tasks/*.task.md` 报 "task manifest does not exist"（PR #347 Docs Governance + Quality Gates 红灯）。

修复：`scripts/task-manifest.mjs` 的 `readTaskManifest` 增加 archive 兜底（canonical 路径缺失时回退到 `.harness/archive/<month>/tasks/<id>/manifest.json`，taskId 交叉校验保持生效），新增 `tests/scripts/task-manifest-archive.test.mjs`（9 个用例）。

验证：
```bash
node --test "tests/scripts/*.test.mjs"   # 136 passed
node scripts/harness/check-task-packet.mjs --root .   # 0 error(s)
node scripts/harness/check-evidence.mjs --strict      # PASS
node scripts/harness/check-review.mjs --strict        # PASS
```

CI（commit 4f5f01eb）：Docs Governance 转 pass，无失败检查，等待 Smoke Sanity 收尾。
