# depguard 边界规则包路径与实际 module 路径对齐 — 实施摘要

- Task: `2026-11-24-golangci-depguard-boundary-paths`
- 日期: 2026-11-24
- 状态: **规则已由空转变为生效，并有回归测试锁定**
- 交付层级: L2（自审见 `review.md`，无独立评审）

## 来源与判定

来源为 2026-11-24 外部综合审查报告 §3.2（B-02）。核实结果：

| 报告结论                                                      | 核实结果                                                                                                                                                           |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `.golangci.yml` depguard deny 路径与真实 Go module 路径不一致 | 成立。原值 `pantheon-base/modules/system`，真实 import 前缀为 `github.com/duanxldragon/pantheon-base/backend/modules/system`                                       |
| 「边界检查可能空转」                                          | 部分修正。真实跨层门禁 `scripts/harness/check-boundaries.mjs` 使用 `/backend/modules/system/` 等正则，规则有效且 strict 0 findings；空转的是 depguard 这层纵深防御 |

## 交付内容

| 验收项                  | 实现                                                                                                                                                     |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| deny 路径与 module 对齐 | 三条 `pkg` 改为 `github.com/duanxldragon/pantheon-base/backend/modules/{system,auth,platform}`                                                           |
| 防止再次退化            | 新增 `tests/scripts/golangci-depguard-paths.test.mjs`：解析 `backend/go.mod` 的 module 与 `backend/.golangci.yml` 的 deny 列表，断言前缀一致并覆盖三个域 |
| 免改 CI                 | 既有 `npm run test:scripts` 使用 `tests/scripts/*.test.mjs` glob，自动纳入新测试                                                                         |
| 无 YAML 依赖            | 只用正则读 `deny: - pkg:` 行，未新增依赖                                                                                                                 |

## 验证

- 测试 RED：修复前 2/2 失败（断言失败于前缀不匹配）。
- lint 探针（关键证据）：临时包 `modules/business/zz_depguard_probe` 导入 `modules/system/config/setting`；修复前 `0 issues`（规则空转），修复后 `1 depguard issue`（规则生效）。探针验证后已删除，未进入提交。
- 测试 GREEN：修复后 2/2 通过。
- 现有代码回归：`golangci-lint run ./modules/business/...` 无 depguard 命中，仅 2 条既有 revive 注释告警，说明没有业务代码靠这条空转规则藏着越界导入。
- `golangci-lint config verify` 需联网拉 schema，本机离线未执行（环境 gap，不是配置错误）。

## 显式 gap

1. Ops 仍持有过期副本：`backend/.golangci.yml` 属 Base 跟踪文件，必须经正式 foundation release + overlay 重建进入 Ops，不在下游手改。
2. 无独立代码/架构评审。
3. config schema 校验因离线未跑。
