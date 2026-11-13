# Independent CODE Review: archive-aware manifest status test

**APPROVE。无未关闭 P0/P1/P2。**

范围仅为 `tests/scripts/task-manifest-status.test.mjs`。修复将词汇检查从活跃目录扩展到活跃与月度归档目录，保留非空断言和原 schema 校验；未删除失败信号或放宽合法状态。

独立验证：

- 指定 Node 24.22.3 执行目标测试：**5/5 通过，零跳过**；语法检查通过。
- 实际仓库：活跃 manifest 为 0，归档 manifest 为 **256**，全部完成读取与校验。
- archive-only fixture 保持非空；非法 `done` 被明确拒绝。
- 既有 `quality.yml` 和其回归测试未改变，SHA-256 与原批准记录一致。
- 完整 `test:scripts` 的原失败与修复后 **210/210、零跳过**日志均保留，原始日志哈希验证通过。完整套件由根执行。

源码 SHA-256：

```text
tests/scripts/task-manifest-status.test.mjs
4e10cf9dc3f2d131df3c967b2b251d9553f86863daa9528f3d4b6123e8a827ed
```

LSP 工具未暴露；已使用 Node 语法检查和实际测试验证。最终 hosted CI 与正常合并仍为交付门禁。报告未落盘。
