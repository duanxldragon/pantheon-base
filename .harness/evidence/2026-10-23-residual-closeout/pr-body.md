## 变更摘要

- 改动层级：platform（backend 为主，含发布脚本与文档）
- 改动模块：`pkg/testredis`（测试隔离）、`pkg/database`（新增 duplicate_key 识别）、`modules/system/iam/tenant`（provisioning 重试、墓碑修复、并发/墓碑用例）、`pkg/authtoken`、`internal/middleware`、`modules/auth/*`（Redis 测试分库）、`scripts/foundation-release`（凭据预检）、`docs/contracts`（V1.3 澄清）、README / CHANGELOG / VERSION / harness 文档
- 目标问题：v0.17.1 显式登记的 5 项残余（P2-4 Redis 测试隔离、P2-9 并发 provisioning、P3-1 凭据残留、P3-2 合同第四态、race 本地缺口）
- 预期影响：
  - 并发创建两个租户不再死锁（`Error 1213` 修复，INSERT…SELECT 有界重试）；同码并发创建返回 `ErrTenantCodeExists` 而非原始 500
  - **真实缺陷修复**：已删除租户不再能被状态更新复活（状态机 default 分支拒绝墓碑；读取隐藏墓碑；成员与 provisioning 路径拒绝墓碑）
  - Redis 测试各包独立逻辑库，多包并行不再互相冲刷
  - 发布打包前强制凭据预检，拒绝携带泄漏形态产物的 bundle
  - 合同 §2.1 补 V1.3 墓碑澄清（中英双版）
  - 无 schema 变更（仍 29），无接口移除或重命名

## Harness 链路

- Task ID：2026-10-23-residual-closeout
- Task Manifest：.harness/tasks/2026-10-23-residual-closeout/manifest.json
- Evidence：.harness/evidence/2026-10-23-residual-closeout/commands.json
- Verification evidence：.harness/evidence/2026-10-23-residual-closeout/summary.md
- Review Artifact：.harness/evidence/2026-10-23-residual-closeout/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：permission-policy
- Ratchet Decision：sensor-added
- GitHub Signal：method-gate

## 残余处置性质（诚实登记）

| 残余 | 处置 | 性质 |
|---|---|---|
| P2-4 Redis 隔离 | 各包独立 DB 索引 + 3 轮并行复跑 | 消除条件 |
| P2-9 并发 provisioning | 实测暴露死锁 → 修复 + `-count=8` + race 钉住 | 真实缺陷修复 |
| P3-1 凭据残留 | 发布前预检门禁；历史产物不可变不回收 | 防复发门禁 |
| P3-2 合同第四态 | V1.3 澄清（L2 合同变更）；顺带发现并修复墓碑复活漏洞 | 澄清 + 真实缺陷修复 |
| race 本地缺口 | 定位 CC=MinGW gcc，race 在本机可跑 | 环境修正 |
