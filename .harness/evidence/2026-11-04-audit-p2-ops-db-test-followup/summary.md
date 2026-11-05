# Ops既有DB测试失败后续裁定

状态：逐项裁定完成；8 个测试侧用例与 host `state_version` 业务缺口均已在隔离 Ops worktree 修复，真实 DB 全业务套件 278 通过 / 0 失败 / 0 跳过；剩余 observability 端口策略裁定与发布/评审动作。

## 当前证据

[完整对照](./comparison.json)、[逐项裁定](./triage.md)、[结构化裁定](./triage.json)、[实际失败命令](./commands.json)、[review状态](./review.md)。最终候选266通过节点/12失败节点/0跳过；12含父/子节点，共9顶层用例。Ops HEAD同环境逐项同断言失败，5份测试源码哈希相同。

## 裁定结果

8 个顶层用例 / 11 节点为测试 fixture 或期望过期（bizscope 未接线能力、deploy 未跟随认领建行与租约、Start 返回规范错误的期望、observability fixture 与 SSRF 端口策略冲突）；1 个顶层用例 / 1 节点为业务实现缺口（host 创建 `state_version=0` 使 CAS 在创建窗口失效，违反 `BUSINESS_FUNCTIONAL_DESIGN.md:84` 乐观锁合同）；合同本身错误 0 项。不放宽 SSRF 端口或鉴权，不修改用例期望掩盖缺口。

修复清单已写入 [triage.md](./triage.md)。测试侧 8 用例已在 `audit-artifacts/ops-test-fixes-2026-11-05`（基于 Ops HEAD `1c057ee`）修复：bizscope 接能力并建齐引用表、deploy 对齐认领建行与租约并接受 Start 规范错误、observability 注入测试 validator（生产 SSRF 策略不变）。真实隔离 MySQL 全业务套件回归：**278 通过 / 0 失败 / 0 跳过**（18 包），`go build` 全仓通过。host 修复为创建/导入即 `state_version=1`、列默认 0→1，使 `ExpectedStateVersion>0` 真正启用 CAS；存量 0 行由迁移 `000031` 回填（守卫表存在、幂等、down 保留），并有迁移链+CAS 端到端回归。详见 [test-fixes.md](./test-fixes.md)。observability 端口/私网允许范围仍为维护者策略裁定项。

| 问题ID | 分类/分级 | 文件与行号（Ops） | 证据 | 实际影响 | 建议/修改风险 | 置信度 |
|---|---|---|---|---|---|---|
| PB-010 | 工程/下游，P2；确认测试失败，功能责任证据不足 | backend/modules/business/bizscope/bizscope_service_test.go:413、:441；cmdb/host/host_service_test.go:82；deploy/deploy_reliability_test.go:55；deploy/deploy_service_test.go:1079、:2269、:2977；observability/datasource_service_test.go:29、:133（均位于backend/modules/business/） | 双候选同断言；comparison.json保存原始断言 | 4业务包门禁失败，当前下游验收不能关闭；未证明为生产功能故障 | 对照业务合同与fixture后最小修复；先判断代码/测试描述错误。不可放宽SSRF端口、鉴权或直接改期望掩盖问题 | 失败及既有性高；功能缺陷归因未裁定 |

## 未关闭项

observability 端口策略裁定、独立review与正式锁升级。consumer 业务门禁已在隔离 worktree 全绿，但主工作树未同步、修复未推。
