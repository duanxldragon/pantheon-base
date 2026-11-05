# Base 功能收尾与发行执行证据

状态：in-progress。PR [#489](https://github.com/duanxldragon/pantheon-base/pull/489) 为草稿；v0.18.3 尚未发布，最后正式版 v0.18.2。

## 当前修复与评审

用户授权两路独立评审使用 gpt-6-astra。首轮代码 REQUEST CHANGES / 架构 BLOCK 的五项发现已修复：运行态声明冲突、角色/岗位稳定分页、必填布尔创建 DTO、SSRF 回退期限、token-storage 扫描报告。

第二轮代码 APPROVE / 架构 CLEAR，12 个源文件指纹一致。随后复杂度检查发现 SSRF 两个函数为 16/19，已做两处小函数提取降至阈值内，完整 SSRF race 通过；第三轮两路已复审通过（代码APPROVE/架构CLEAR），均以反向内联哈希核实提取等价。最终候选不得借用旧源码评审或旧提交 CI。

## 当前候选验证

- 修复前真实失败、修复后通过：脚本 6 项，生成器 17 项（包含生成 Go 编译、Gin binding 缺失/null/false/true 与 mapper 验证），真实 MySQL 角色/岗位 205 条同排序值三页升降序，SSRF 阻塞首地址与父期限回退。
- 前端 lint/type-check/build、33 文件/218 单测通过；test:scripts、foundation-release/frontmatter 回归通过。
- 14 项治理检查全部通过；完整 generator smoke 通过，basic/enterprise/many-to-many 生成 Go 格式与 TS 编译通过。
- 全量隔离 MySQL/Redis Go race 完成：1889通过测试节点/0失败/1真实S3 skip，47个有测试包通过；两处 SSRF 提取后的该包完整 race 已通过。
- PR 反馈快照无未关闭条目；当前 GitHub CodeQL/Dependabot 开放告警均为 0。最终提交 CI 待推送后确认。
- 精确命令、退出码及原始日志 SHA256 见 review-remediation.json，源码指纹见 review-source-manifest.json。原始日志保存在 workspace audit-artifacts/base-freeze-2026-11-05。

## 已有运行态与渲染证据

此前代码树的完整 race 为 1880 通过节点/0 失败/1 真实 S3 skip；代码候选 57b42ace 及证据提交 1a7b388b 的最新 CI 均为 27 SUCCESS、2 条件 SKIPPED。Sonar 9→0、Gate OK。具体旧候选见 hosted-validation.json，不能代替本轮新源码验证。

已执行租户 V1 16+视角5、core27/3未激活生成模块skip、系统域11模块组合119、平台97与另次77、业务五套生成 smoke。真实生成模块浏览器/API CRUD 覆盖必填校验、创建、编辑失败恢复、删除与390px。已有1440×900桌面/暗色及390px截图经 impeccable 检查。部分错误状态采用受控mock，未描述为外部真实故障。

本轮仅改变生成 Go DTO/mapper，不改变页面布局或控件，未重新生成截图；新增布尔创建行为以真实生成 Go/Gin 验证，已有表单渲染证据保留。完整证据边界见 functionality-matrix.md、local-validation.json 和 resume-validation.json。

## 发布与 Ops 消费

两路最终复审与当前提交 CI 通过后方可合并；随后必须通过 main Release Gate、Full Smoke、Sonar，再发布和校验正式 foundation 资产。

Ops 隔离业务修复 dbce4ae 保留，未发布回填迁移已从000031调整至000032，并连同回归测试加入 business-overlay.json。真实 MySQL backfill race 与 overlay 测试通过。Base000031不变；正式发布后仍须官方 snapshot+overlay 重建、完整race/前端/业务smoke/CI，不从 Base main 手抄共享源码。

## 明确缺口

- 当前候选CI、合并、发行及正式Ops消费尚待完成。
- 真实S3 provider未配置，集成用例跳过；未获得豁免。
- npm开发链15 moderate，0 high/critical；全仓zizmor23既有发现，未宣称安全扫描全零。
- 分页测试证明静态数据集的确定顺序与完整ID序列，不承诺并发写入的快照一致性。
- 生产DDL不在发行授权内；000031 down仅恢复结构，遵守production migration runbook。

## 合并后文档证据修复

PR #489 已合入 main（de9f11a6）。main严格文档门禁发现审计报告两条截图链接依赖工作区外层附件；现打包原始PNG并修正链接，见[修复证据](ci-doc-link-repair.md)。本地严格链接、frontmatter以及隔离暂存快照检查均通过。发行仍等待最新main门禁，Ops消费待正式发行。
