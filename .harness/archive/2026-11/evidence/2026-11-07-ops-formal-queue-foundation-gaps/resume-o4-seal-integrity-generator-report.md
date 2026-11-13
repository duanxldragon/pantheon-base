已完成最小修复：最终 rename 前，有界读取并核对 descriptor/archive 的原始字节与 pin，同时复查 fd、路径和目录身份。原有 29 项测试及非递归清理、主因处理逻辑保持不变。

- 新增六个真实 producer 回归；RED 成功复现缺口，最终 GREEN **37/37，零跳过**。
- 两份脚本语法检查、差异检查通过，最终源码哈希稳定。

精确哈希、原始日志及限制均记录于[独立交接](/D:/workspace/go/pantheon-platform/pantheon-base/.harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/resume-o4-seal-integrity-handoff.md)。未自审批；交由 root 重跑独立 CODE/ARCH。
