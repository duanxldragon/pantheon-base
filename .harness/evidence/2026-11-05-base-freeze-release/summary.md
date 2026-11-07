# Current v0.18.5 candidate: complete direct race and Sonar fixture correction

Current candidate includes one exact shared test seed helper; original four-row lifecycle assertions and external-reference protection remain intact. Both independent lanes approved the same helper snapshot: [approval](resume8-sonar-approval.json), [CODE](resume7-sonar-code-reviewer.md), [ARCH](resume7-sonar-architect.md).

Direct current-worktree CGO race with required real MySQL/Redis completed: 1890 pass, 0 fail, 1 skip; 47 passing packages. [Result](resume7-base-full-race.json) binds unchanged fixture hash; [raw log archive](resume7-base-full-race.log.gz) contains test events proving execution. One real S3 integration skip has no waiver.

Sonar PR496 previously failed new duplication density 55.4% (36 newly duplicated lines). The exact repeated seed is now extracted once; same hosted metric now passes at 0.0% against unchanged 3% threshold on head 2c1660a75d42630c3b90f02a6e7cc349194712ad ([proof](resume8-sonar-pr496-after.json)). Final PR checks and merged commit release gate remain pending. No threshold or exclusion changes. v0.18.5 remains unreleased; current PR checks, merged commit release gate, official publication and stock Ops consumption still pending. All original 12 manifests remain in-progress; freeze unsigned.

## Previous candidate record

# 2026-11-07 Current corrective foundation candidate

Version0.18.5 remains unreleased on fix/v0185-fixture-closed-loop. Actual bounded CODE APPROVE/ARCH CLEAR match the same snapshot; [approval](resume7-fixture-approval.json), [CODE](retry5-fixture-code-reviewer.md), [ARCH](retry5-fixture-architect.md).

All507 backend files equal the reference tree actually tested:1890 pass/0 fail/1 real S3 skip. This is byte-equivalence evidence, not a worktree rerun or current hosted CI. Original lifecycle assertions and external-reference preservation remain tested. No UI/product/schema changes.

Latest previously verified official release remainsv0.18.4. GitHub connectivity recovered2026-11-07. Current-branch hosted checks/merge/Release Gate/publication and official Ops consumption remain pending actual results. Original12 tasks stay in-progress in this candidate; S3 unverified/no waiver and freeze unsigned.

## Historical candidate evidence

# Base 功能收尾与发行执行证据

状态：in-progress。当前以 2026-11-06 补充状态为准；下文保留旧候选验证历史。

## 2026-11-06 当前状态（取代下文历史读数）

用户补充要求：纳入 GitHub 新合并 PR #485，修复 Dependabot #52（minimatch / GHSA-g3hv-75wg-m249，修复版本 11.0.1），发布 v0.18.4，再让 Ops 从 GitHub 最新稳定正式 release 消费。

Base 安全分支 `fix/v0184-minimatch-security` 已快进至 GitHub main `2a7061fa0e5bc943c6dc91166e16dc77d614ee70`。限定受影响版本范围的 minimatch override 已写入；当前网络连接 EACCES，在线及离线安装均失败，package-lock 未更新，未进行新版兼容性/audit/CI 验证，因此安全修复仍未关闭，VERSION 保持 0.18.3。

此前 v0.18.3 发布器 session53536 返回 exit0，输出确认四个正式资产上传完成。再次独立查询 GitHub 时网络连接被禁止；未重切或覆盖 v0.18.3 资产。v0.18.4 尚未切包、发布或消费。

Ops 隔离分支已实现 GitHub 最新稳定版获取/四资产校验/不可变 tag 与 manifest 及 git-archive commit 校验/锁定重建；CLI 拒绝本地 Base 来源参数。漂移检查直接读取验证过的快照字节，覆盖父 Ops HEAD 不同、共享文件删除、篡改/过期缓存及业务迁移冲突。当前消费与迁移测试 54 pass / 0 fail / 0 skip，overlay、frontmatter 和 task-template 校验通过。真实 v0.18.4 暂存重建、全量 CGO race、业务 smoke、GitHub CI 与合并均未完成；Ops 主工作树及正式锁文件仍为 v0.18.2。

两路独立复审未产生新批准：原适配器 MCP 配置解析失败；临时禁用无关 MCP 后代码/架构服务均无法连接。原批准和指纹只作历史，不覆盖本轮变更。当前 source manifest 另存，不将旧 21/21 当作新批准。

阻断：本会话 sandbox 禁止 npm registry、api.github.com 和审查服务网络连接，审批策略 never。未申请提权、未放宽门禁。恢复允许联网的执行环境后按依赖安装验证 → Base review/CI/merge/release gate → v0.18.4 官方发布 → Ops GitHub 下载消费/最终验证/review/CI/merge 顺序继续。

## 历史修复与评审

用户授权两路独立评审使用 gpt-6-astra。首轮代码 REQUEST CHANGES / 架构 BLOCK 的五项发现已修复：运行态声明冲突、角色/岗位稳定分页、必填布尔创建 DTO、SSRF 回退期限、token-storage 扫描报告。

第二轮代码 APPROVE / 架构 CLEAR，12 个源文件指纹一致。随后复杂度检查发现 SSRF 两个函数为 16/19，已做两处小函数提取降至阈值内，完整 SSRF race 通过；第三轮两路已复审通过（代码APPROVE/架构CLEAR），均以反向内联哈希核实提取等价。最终候选不得借用旧源码评审或旧提交 CI。

## 当前候选验证

- 修复前真实失败、修复后通过：脚本 6 项，生成器 17 项（包含生成 Go 编译、Gin binding 缺失/null/false/true 与 mapper 验证），真实 MySQL 角色/岗位 205 条同排序值三页升降序，SSRF 阻塞首地址与父期限回退。
- 前端 lint/type-check/build、33 文件/218 单测通过；test:scripts、foundation-release/frontmatter 回归通过。
- 14 项治理检查全部通过；完整 generator smoke 通过，basic/enterprise/many-to-many 生成 Go 格式与 TS 编译通过。
- 全量隔离 MySQL/Redis Go race 完成：1889通过测试节点/0失败/1真实S3 skip，47个有测试包通过；两处 SSRF 提取后的该包完整 race 已通过。
- PR 反馈快照无未关闭条目；当前 GitHub CodeQL/Dependabot 开放告警均为 0。新 Sonar 增量候选 CI 待推送后确认。
- 精确命令、退出码及原始日志 SHA256 见 review-remediation.json，源码指纹见 review-source-manifest.json。原始日志保存在 workspace audit-artifacts/base-freeze-2026-11-05。

## 已有运行态与渲染证据

此前代码树的完整 race 为 1880 通过节点/0 失败/1 真实 S3 skip；代码候选 57b42ace 及证据提交 1a7b388b 的最新 CI 均为 27 SUCCESS、2 条件 SKIPPED。Sonar 9→0、Gate OK。具体旧候选见 hosted-validation.json，不能代替本轮新源码验证。

已执行租户 V1 16+视角5、core27/3未激活生成模块skip、系统域11模块组合119、平台97与另次77、业务五套生成 smoke。真实生成模块浏览器/API CRUD 覆盖必填校验、创建、编辑失败恢复、删除与390px。已有1440×900桌面/暗色及390px截图经 impeccable 检查。部分错误状态采用受控mock，未描述为外部真实故障。

本轮仅改变生成 Go DTO/mapper，不改变页面布局或控件，未重新生成截图；新增布尔创建行为以真实生成 Go/Gin 验证，已有表单渲染证据保留。完整证据边界见 functionality-matrix.md、local-validation.json 和 resume-validation.json。

## 发布与 Ops 消费

两路最终复审与当前提交 CI 通过后方可合并；随后必须通过 main Release Gate、Full Smoke、Sonar，再发布和校验正式 foundation 资产。

Ops 隔离业务修复 dbce4ae 保留，未发布回填迁移已从000031调整至000032，并连同回归测试加入 business-overlay.json。真实 MySQL backfill race 与 overlay 测试通过。Base000031不变；正式发布后仍须官方 snapshot+overlay 重建、完整race/前端/业务smoke/CI，不从 Base main 手抄共享源码。

## 明确缺口

- Sonar 增量候选 CI/合并、正式发行及 Ops 消费尚待完成；主功能与截图附件 PR 已合并。
- 真实S3 provider未配置，集成用例跳过；未获得豁免。
- npm开发链15 moderate，0 high/critical；全仓zizmor23既有发现，未宣称安全扫描全零。
- 分页测试证明静态数据集的确定顺序与完整ID序列，不承诺并发写入的快照一致性。
- 生产DDL不在发行授权内；000031 down仅恢复结构，遵守production migration runbook。

## 合并后文档证据修复

PR #489 已合入 main（de9f11a6）。main严格文档门禁发现审计报告两条截图链接依赖工作区外层附件；现打包原始PNG并修正链接，见[修复证据](ci-doc-link-repair.md)。本地严格链接、frontmatter以及隔离暂存快照检查均通过。发行仍等待最新main门禁，Ops消费待正式发行。

## Release Gate Sonar follow-up

Main `0e56f922` Full Smoke 已通过，Release Gate 因两项未关闭 Sonar 问题失败。最小修复已获得 CODE APPROVE / ARCH CLEAR；新的完整 Go race：1889 pass / 0 fail / 1 skip; 47 passing test packages；14 项治理检查通过。详见 [Sonar closeout](sonar-closeout.md)。新提交的托管 Sonar 同规则复测、CI 与 main Release Gate 仍为发布条件。

Ops 准备树 37 项 overlay 回归、真实 MySQL 回填 race 与独立 CODE/ARCH 评审已通过。正式消费仍等待 v0.18.3 发布。


## 最新续办：明确 v0.18.4 与授权

用户再次明确授权发行 v0.18.4、让 Ops 主线锁定消费并检查结果。已补 `npm run fetch:base-release -- --release pantheon-base-v0.18.4`，该入口只请求指定的 GitHub 正式 tag，不会退回 latest 或其他版本；无参数仍支持最新稳定版。新增回归后 57 tests pass / 0 fail / 0 skip。重新运行真实 v0.18.4 获取命令仍被系统拒绝网络 socket，锁文件哈希保持不变。GitHub查询与npm安装也返回相同阻断。当前审批策略 never，不能发起工具提权请求；聊天授权已记录但不会修改执行环境。v0.18.4 未发行，Ops主线仍为v0.18.2，主线消费结果尚不能验证。详见 v0184-explicit-consumption-status.json。

## 2026-11-06 网络恢复后的 minimatch 安装验证（最新）

网络恢复后完成被阻断的依赖安装验证：`npm install` 成功并将限定范围 override 写入 package-lock，全部 minimatch 实例统一至 11.0.1，GHSA-g3hv-75wg-m249（Dependabot #52）消除；`npm audit --registry=https://registry.npmjs.org --audit-level=high` exit 0（残余 5 项 moderate 为既有 glob 链告警，修复需 nyc 破坏性升级，不在本次范围）；前端 `npm run build` 通过、`npm run test:unit` 218/218 通过、docs frontmatter 检查通过。VERSION 升至 0.18.4。命令与结果明细见 [v0184-security-validation.json](2026-11-06-v0184-security-validation.json)。待办：PR CI 与合并、main Release Gate、v0.18.4 切包发布与四资产校验、Ops 官方 release 消费。

## 2026-11-06 v0.18.4 发布完成

PR #494 合并为 main `0a8229c67ab482c2e163622fc4e5b87301c53399`，Dependabot alert #52 关闭。main Full Smoke 首跑在 `backoffice-ui-visual › control thickness contract` 的 `/system/dept` 筛选项断言失败（含 retry 同点）；该提交相对绿色基线 `2a7061fa` 无 UI 源码差异，重跑转绿，Release Gate 重算 `completed/success`。随后 `cut-foundation-release` 切包、`publish-foundation-release` 发布：annotated tag 指向 `0a8229c6`，GitHub release `pantheon-base-v0.18.4` 为 Latest，四资产经 `check-release-assets` 远端/本地校验通过。剩余：Ops 主工作树从官方 v0.18.4 正式消费重建与验证。详见 [发布状态](2026-11-06-v0184-release-published.json)。
