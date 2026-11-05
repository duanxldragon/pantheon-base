# 全局审计整改执行记录

Programme：in-progress；本轮安全可逆整改已实施，独立评审与发布/冻结仍未关闭。

## 当前进度

| 问题 | 优先级 | 已执行 | 状态 |
|---|---|---|---|
| PB-001 | P1 | DNS核查与实际拨号绑定，空/混合私网答案拒绝；numeric IP直拨，保留Host/SNI、timeout override与所有导出签名。无新依赖。 | 已实施/本地验证，独立review待办 |
| PB-002 | P1 | 删除两处 npm audit 的 || true，保留上传报告与既有PR/report-only策略；严格路径以真实step outcome判定。行为回归执行工作流原shell片段。 | 已实施/本地验证，独立review待办 |
| PB-003 | P1 | 两个Runtime、同一旧token16请求的动态复现从16个pair降为1个；GETDEL先消费，失败不恢复旧token。进一步确认旧Save会恢复撤销/覆盖tenant，并对刷新及切换共用条件更新，保留导出签名。 | 已实施/本地验证，独立review待办 |
| PB-004 | P2 | 只修逐项核查的权威现态、命令、目录、链接与双语描述；历史正文和路径保留，Draft缺文件明确未产出。两份本轮审计报告仅格式实体编码修正，审计计数/结论不回填。 | 已实施/本地验证，独立review待办 |
| PB-005 | P2 | 双语工作流对齐维护者三触点与已授权可逆步骤自主执行，保留政策/生产/发布限制，不为Agent增加豁免。 | 已实施/本地验证，独立review待办 |
| PB-006 | P2 | 双语策略明确当前Sonar发布全BUG/VULNERABILITY/CODE_SMELL清零是发布例外；风险优先用于投入分配，现行门禁配置不放宽。 | 已实施/本地验证，独立review待办 |
| PB-007 | P2 | 全量Go通过后，修正两个core接线测试不读取PANTHEON_TEST_REDIS_ADDR而静默skip的问题，复用testredis helper及独立DB6，单独补跑完整受影响包。对当前工作树进行全量Go、前端和治理验证；专属MySQL/Redis隔离原有数据；冻结仍需批准候选和真实外部门禁。前三次全量Go记录分别为停滞中断/共享缓存访问拒绝/专属缓存再停滞，均不记通过。 | 已实施/本地验证，独立review待办 |
| PB-008 | P3 | 真实DB消费套件266通过节点/12失败节点（9顶层用例）、0跳过；全部失败在Ops HEAD同环境复现且断言相同，确认既有测试失败但业务意图责任待裁定，PB-010单独登记，下游验收不关闭。从全部现存tracked/untracked非忽略文件建立完整隔离候选，尊重既有删除；实际Ops重建802项资产，公共接口未删除。最终消费树后端验证及前端输入哈希对比；主Ops工作树不改。 | 已实施/本地验证，独立review待办 |
| PB-009 | P3 | 裁定保留coverage与race、checker历史覆盖与dormant占位；缺少实际CI耗时/故障收益不能删门禁。可优化项延期，未增加门禁、平台、依赖或大重构。 | 优化延期，裁定已登记 |

## Evidence

[命令记录](./commands.json)、[文档变更](./document-changes.md)、[受控变更SHA256](./owned-change-ledger.json)、[独立评审状态](./review.md)。完整原始日志与候选快照保留在workspace audit-artifacts/base-global-remediation-2026-11-04。原审计FULL/ASSETS保持审计基线，不重算或改写数量。

## 实际验证读数

下表来自实际命令结果；Go统计为包含父/子测试的节点数，各轮单列，不相加伪造独立用例总数。

| 验证 | 结果 | 范围与限制 |
|---|---|---|
| 全量 Go，专属缓存、-count=1 | exit 0；47测试包、1874通过节点、3跳过 | 2个Redis接线跳过随后补跑；剩余S3缺外部配置 |
| 核心接线两个完整包补跑 | exit 0；30通过节点、0跳过 | 修正专用Redis地址和测试DB注册 |
| P1四包 race | exit 0；308通过节点、0跳过 | SSRF、authtoken、login、session |
| 前端 type-check / lint / build / test:unit | 全部 exit 0；33文件、218测试 | 本轮未改UI，无视觉质量完成声明 |
| 根脚本测试 | exit 0；202通过、0跳过 | 既有脚本回归 |
| foundation-release 与 frontmatter 测试 | exit 0；71通过、0跳过 | 本地工具回归，非正式发布 |
| 七项治理检查 | 全部 exit 0 | 工件与链接合法；独立review仍blocked |
| Ops候选实际重建与整个后端构建 | exit 0；802项重建 | 本地合成候选，非已发布版本 |
| Ops真实DB业务测试 | exit 1；266通过节点、12失败节点、0跳过 | 4失败包、9顶层用例；Ops HEAD同断言复现 |

[结构化读数](./validation-summary.json)；原始命令、日志与哈希对照在workspace证据目录保留。消费者最终571份前端输入与已通过测试的候选相同；复用现有Ops依赖，未执行干净安装。消费者候选后续差异仅三份Redis测试fixture/registry文件，两个完整受影响包已单独通过。

## 后续任务与兼容风险

新增[PB-010：Ops既有DB测试失败裁定](../../tasks/2026-11-04-audit-p2-ops-db-test-followup/manifest.json)，状态planned。共1父任务、原9整改子任务和1新增P2后续任务。需先判断业务实现、fixture与合同的责任；本轮不把既有测试红灯写成已确认的生产功能故障，也不为变绿放宽SSRF或鉴权。

刷新改为单次消费，并以旧JTI及tenant等条件更新会话；并发、吊销或数据库/Redis故障导致刷新失败时，旧refresh不会恢复，用户可能需要重新登录。公共导出签名保留，但这是有意的安全行为收紧，下游发布前仍需验收。SSRF只拨号已核查地址，混合私网答案会被拒绝，可能影响下游连接配置。npm严格门禁现在正确传播非零结果，真实漏洞或扫描工具故障可能使其变红。

PB-009仅登记优化延期；缺少实际CI耗时与错误收益证据，不删除coverage、race或checker。原214项既有工作树变化保留，Ops主工作树保持干净；正式foundation release、Ops lock升级、独立review及冻结签署未执行。

## 未关闭项

- Independent review unavailable: executor gpt-5.5 and architect gpt-5.4-mini attempts returned HTTP 503; no independent approval is claimed.
- Downstream real-DB suite is red at 4 business packages (12 failure nodes / 9 top-level tests), identically reproduced at Ops HEAD; PB-010 intent/fixture triage pending.
- No approved release commit, external required CI/Sonar result or maintenance-freeze acceptance.
- Foundation release and Ops lock upgrade deferred; local synthetic candidate is not a release.
- Browser full/core smoke and live external integration were not run; no UI code was modified and no visual-polish claim is made.
- S3 and OIDC external-provider validation depend on provisioned services. Actual remote dependency vulnerability status is not established by mock npm tests.

## 测试环境收口

已核对本轮专用Redis/MySQL进程的可执行路径、端口及datadir并正常关闭，未触碰其他实例，保留磁盘数据目录和日志；Redis按shutdown nosave关闭，不保存内存键。首次MySQL命令参数解析失败及成功重试均留档。[关闭记录](./services-shutdown.json)。测试任务均已结束。
