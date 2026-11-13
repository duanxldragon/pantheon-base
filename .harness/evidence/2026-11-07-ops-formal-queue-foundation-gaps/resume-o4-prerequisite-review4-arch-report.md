## Summary

**ARCH `CLEAR`。** Review3 剩余的 MEDIUM「保存字节在封印前改变仍返回成功」已在指定最终源码中闭合；本 lane 未发现新的未解决缺陷。架构上可进入 paired candidate assembly 与 Ops backend adoption，联合推进仍由 root 汇总独立 CODE verdict。

范围：平台层 foundation candidate producer，L2 父任务 `docs/harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps.task.md`；revision4 计划哈希核对准确。

## Analysis

1. **原始 pin 独立于保存文件。** Archive pin 从原始内存 archive 生成；descriptor pin 在写入前生成，成功返回沿用同一 pin：[producer:89](/D:/workspace/go/pantheon-platform/pantheon-base/scripts/foundation-release/build-candidate-artifact.mjs:89)、[producer:96](/D:/workspace/go/pantheon-platform/pantheon-base/scripts/foundation-release/build-candidate-artifact.mjs:96)、[producer:173](/D:/workspace/go/pantheon-platform/pantheon-base/scripts/foundation-release/build-candidate-artifact.mjs:173)。

2. **最终检查覆盖实际保存字节。** 新检查位于 source stability、output existence 和 stage shape preflight 之后、rename 之前：[producer:165](/D:/workspace/go/pantheon-platform/pantheon-base/scripts/foundation-release/build-candidate-artifact.mjs:165)。两个文件均经 bigint lstat/fstat、单链接、精确大小、显式 offset 的有界读取以及完整字节／原始 digest 比较；两个 fd 保留到配对读取完成，随后复核 fd、pathname 和 stage／ancestor 实例：[producer:130](/D:/workspace/go/pantheon-platform/pantheon-base/scripts/foundation-release/build-candidate-artifact.mjs:130)、[producer:149](/D:/workspace/go/pantheon-platform/pantheon-base/scripts/foundation-release/build-candidate-artifact.mjs:149)。分配长度受原 descriptor/archive 上限约束：[helper:5](/D:/workspace/go/pantheon-platform/pantheon-base/scripts/foundation-release/candidate-descriptor.mjs:5)。

3. **六个新增叶子用例具有实际缺陷覆盖。** 四个用例分别注入 descriptor newline、archive late append，以及两个文件的同长度字节修改，要求拒绝成功且没有输出：[test:400](/D:/workspace/go/pantheon-platform/pantheon-base/scripts/foundation-release/candidate-artifact.test.mjs:400)。另外两个在实际 fd read 后 rename/recreate 字节相同文件，要求 pathname/instance 检查拒绝并保留移出的原文件：[test:489](/D:/workspace/go/pantheon-platform/pantheon-base/scripts/foundation-release/candidate-artifact.test.mjs:489)。

**此前发现映射：**

| 发现                                                  | 本轮结论                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Review3 保存字节完整性 MEDIUM                         | 闭合，依据上述源码与独立 GREEN                                                                                                                                                                                                                                                                                                                                                                                                |
| Review2 producer 目录删除 MEDIUM                      | 保持闭合；原 cleanup 未变，当前仍逐项预检、非递归删除并保留 primary cause：[producer:174](/D:/workspace/go/pantheon-platform/pantheon-base/scripts/foundation-release/build-candidate-artifact.mjs:174)                                                                                                                                                                                                                       |
| Review2 Ops cause MEDIUM、此前 privacy/telemetry HIGH | 延续 review3 闭合结论；相关路径哈希完全一致，本轮未重审其实现：[review3:34](/D:/workspace/go/pantheon-platform/pantheon-base/.harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/resume-o4-prerequisite-review3-CODE-handoff.md:34)、[review3:40](/D:/workspace/go/pantheon-platform/pantheon-base/.harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/resume-o4-prerequisite-review3-CODE-handoff.md:40) |

## Root Cause

原 producer 将源稳定性和 stage 形状检查当作输出完整性证据，descriptor 未读回，archive 检查发生在更早阶段。因此，已完成的输出修改仍可被 rename 并报告成功：[review3:13](/D:/workspace/go/pantheon-platform/pantheon-base/.harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/resume-o4-prerequisite-review3-CODE-handoff.md:13)。当前修复在最终封印边界重新建立“保存字节＝原始期望字节及 pin”的条件。

## Verification / References

本轮独立执行：

- 指定 named-file suite：**37/37 passed，exit 0，零 skipped/cancelled/todo**。
- 两个变更文件 `node --check`：exit 0；限定 `git diff --check`：exit 0。
- 以 [review3 69-path receipt:12](/D:/workspace/go/pantheon-platform/pantheon-base/.harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/resume-o4-prerequisite-review3-CODE-source-receipt.json:12) 为基准逐项计算 SHA256：**仅指定两路径改变，其余 67 路径完全一致；全部 69 路径本轮前后稳定**。
- 在内存中反向应用 delta patch，精确还原原 producer 哈希 `9ba91562d0854701cc1eacc58e854fcc122af096721c3ec83fe914a171932352`；原测试 24,281-byte prefix 也与 review3 精确一致。

| 文件              | 本轮 before＝after SHA256                                          |
| ----------------- | ------------------------------------------------------------------ |
| Producer          | `646e622f2eef3ae30d29aed50272d3f4665dd54d04c2fcb1ffb41777e554d6e3` |
| Test              | `17301133892fe649d7fdd2ec25ed7e0a570c45b47f7a0842ed896b0723dd9b11` |
| Descriptor helper | `a9b242e4b6d787344f16357b6c7397ab4a7ffda633e21556138e240ccece71a6` |

官方 Ops lock 哈希仍为 `95de1a87270e15c0d4c672418a5df906818a88652f8a3e6c480f1484ee9fa70c`，符合 [review3 receipt:6](/D:/workspace/go/pantheon-platform/pantheon-base/.harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/resume-o4-prerequisite-review3-CODE-source-receipt.json:6)。

同最终测试字节的 RED 29/37、GREEN 37/37 属于已读取的 Generator 证据，本轮未重跑 RED：[seal receipt:60](/D:/workspace/go/pantheon-platform/pantheon-base/.harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/resume-o4-seal-integrity-receipt.json:60)。

## Recommendations

1. **Root 绑定以上精确哈希，汇总 review4 CODE 后推进配对及 Ops 接入** — 低工作量；本 ARCH lane 无需源码补修。
2. **保持 prerequisite 与后续验收的边界** — 本结论不批准完整 O4/P0、最终 tenant runtime、部署、正式消费或发布。

## Architectural Status

`CLEAR` — 独立 ARCH lane，限定本次 prerequisite delta。

## Trade-offs

| 选择                                  | 收益                             | 成本／限制                     |
| ------------------------------------- | -------------------------------- | ------------------------------ |
| 当前有界整文件比对及配对 fd 复核      | 直接验证原始字节、pin 和读取实例 | 增加读取、哈希及 buffer 分配   |
| 仅沿用早期 archive 验证和最终形状检查 | 较少资源开销                     | 无法关闭已复现的封印完整性缺陷 |

独立执行证据限 Windows x64、Node v24.14.0；`O_NOFOLLOW` 未暴露，实际使用 fallback 与 lstat/fstat/path 检查。检查和 rename 仍是独立 syscall，源码明确不承诺原子 namespace lock：[producer:156](/D:/workspace/go/pantheon-platform/pantheon-base/scripts/foundation-release/build-candidate-artifact.mjs:156)。前后哈希也不能排除观察之间的 edit/revert；未取得跨平台执行或 LSP/type-safety 证据。

**停止条件已满足：缺陷闭合、建议及 verdict 已有源码和限定验证依据。未修改仓库源码、锁或报告；本自包含文本交由 root 保存。**
