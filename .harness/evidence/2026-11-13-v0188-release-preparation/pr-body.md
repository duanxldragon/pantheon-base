## 变更摘要

- 改动层级：platform
- 改动模块：版本元数据、发行说明、当前文档索引和 Harness 交付记录
- 目标问题：关闭 11 月 7 日审查续办记录中的既定交付项，准备 v0.18.8；保留历史失败和明确延期项。
- 预期影响：VERSION 更新为 0.18.8；v0.18.7 官方消费任务依据 Ops #183 实际合并记录关闭；新版本仅在最终提交通过 hosted gates 和 Release Gate 后发行。

依赖 PR #501、#502、#503 已分别合并至 `5beb3aa24af4dc1b72c6ac53fb6153d4d58e1558`、`1cc4d6fb320113865eac8226af4f6f499b74f455`、`bbd8a5e29b7658fb16c5741c3ffa6f6d7459dd8b`。PR #502 的精确 CSSOM 修复 `44188eff3e8618736b495043c6655a1538ce6857` 已通过独立 CODE/ARCH 审查及 hosted Smoke Sanity、PR Smoke Modules；全部 29 项最终检查为 27 SUCCESS、2 条件 SKIPPED、0 unsuccessful。sealed candidate43be57 消费端 backend/frontend 兼容构建通过；本准备快照 tree `a9d8ba825b7b6f05e9dc14b70d995cc2cc0b73fe` 已获独立 CODE APPROVE（84 文件、0 findings）和 ARCH APPROVE/CLEAR；仅机械留痕获准，最终 tree 确认与实际 hosted/合并/发行条件保留。

## Harness 链路

- Task ID：2026-11-13-v0188-release-preparation
- Task Manifest：.harness/tasks/2026-11-13-v0188-release-preparation/manifest.json
- Evidence：.harness/evidence/2026-11-13-v0188-release-preparation/commands.json
- Verification evidence：.harness/evidence/2026-11-13-v0188-release-preparation/summary.md
- Review Artifact：.harness/evidence/2026-11-13-v0188-release-preparation/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：ci-workflow
- Ratchet Decision：registry-only
- GitHub Signal：repo-quality-gate

## Harness adoption markers

- task id: 2026-11-13-v0188-release-preparation
- task manifest: .harness/tasks/2026-11-13-v0188-release-preparation/manifest.json
- evidence: .harness/evidence/2026-11-13-v0188-release-preparation/commands.json
- boundaries: platform 版本与治理；继承链路只记录 Base producer -> Ops consumer 证据
- backend response contract: none
- backend DTO contract: none
- permission contract: none
- audit coverage: none
- visual evidence: .harness/evidence/2026-11-13-v0188-release-preparation/screenshots/editor-contact-sheet.png
- inheritance contract: docs/designs/FOUNDATION_RELEASE_MODEL.md
- base drift: Base-first；不手抄 Base 文件到 Ops
- Base/ops inheritance: 官方 v0.18.7 已验证并由 Ops #183 合并；v0.18.8 sealed candidate43be57 兼容构建通过，正式消费未宣称

## 边界说明

- [x] 本次准备改动归属 platform；发行与继承证据引用下游消费验证。

治理准备不新增业务功能、系统域行为、菜单、权限、i18n、API 或数据库合同。依赖升级和四处严格 CSSOM 断言修复分别由其独立 PR 承载；本 PR 汇总事实与证据。生产操作、S3 豁免、维护冻结签署和提前停用 legacy-auth 均不在范围内。

## 验证记录

- [x] 既定依赖组合：根脚本 208/208、foundation 57/57、前端单元 240/240；lint、类型检查、构建和 high 级依赖审计通过。
- [x] 既定依赖组合：4 个已有视觉 spec、8 个桌面/移动明暗 console/overflow 场景通过；16 张截图已检查。
- [x] CSSOM 精确修复：Chromium 158 四方向几何相等，9 个错误值被拒绝，转译与定向 lint 通过；CODE APPROVE/ARCH CLEAR。
- [x] 准备草稿：frontmatter、task-packet template、task packet、evidence、review schema、文档链接、encoding、inventory、structure 全仓检查通过。
- [x] 官方 v0.18.7 消费：4 个不可变资产、重建和全量验证记录已保留；Ops #183 在 GitHub Actions 成功后于 2026-11-13T04:44:42Z 合并为 `fc3fa867630580f7bcf1d40082a77f6b2548ac56`。
- [x] PR #502 hosted Smoke Sanity、PR Smoke Modules 和最终 CI 门禁通过，于 2026-11-13T05:06:08Z 合并。
- [x] sealed candidate43be57：CGO readonly backend build、Node 24.22.3 frontend ci/lint/type-check/build 五条命令通过；1176 Base 输入匹配 merged source+VERSION0.18.8，2113 组装源码和官方 v0.18.7 lock 未变。
- [x] 独立 CODE/ARCH 准备审查通过，完整报告与 source tree 保留。
- [ ] 最终 hosted required checks。
- [ ] 最终 main 提交的 Release Gate 与 v0.18.8 四个不可变资产验证。

草稿检查不等同最终冻结快照或 hosted CI；review-schema 成功不等同独立审查批准。视觉证据绑定既定依赖组合的现有 fixture，保留桌面网格拉伸和移动步骤栏初始可见范围限制，不声称全产品验收。前端 Node 24 线最低版本仍为 24.15.0。

## 审核留痕

- Copilot review：准备草稿尚未建 PR；创建后依据现有仓库策略请求并收敛反馈
- CodeQL 结果：本准备快照 hosted 扫描尚待 PR 创建与 CI
- GitHub checks 结果：9 项本地准备治理检查通过，独立 CODE/ARCH APPROVE；本 PR hosted checks 尚待
- Auto-merge：not-enabled
- Duplication Gate 结果：本准备快照 hosted 结果尚待
- 是否高风险改动：否；版本与治理准备，不修改运行时合同
- Residual risk / follow-up：FR028 明确延期；真实 S3 未豁免，维护冻结未签署；Ops 非 required 外部 Vercel preview 失败保留。final-tree 确认、实际合并、main-only/clean-main/remote-SHA 和 candidate 输入绑定、exact-main CI 与发行门禁待完成。

## 检查清单

- [x] 归属 platform，Base/ops 继承边界已说明。
- [x] 历史失败、未签署项和延期项均保留，未用新证据冒充历史通过。
- [x] 未新增业务功能或修改生产合同。
- [x] Evidence 保留真实命令日志与 compressed/raw SHA256。
- [x] 用户已授权代码提交、合并、清理无用 Base 分支/worktree 和 CI 成功后的发行。
- [x] 独立 preparation CODE/ARCH 审查已批准，任务完成状态只涵盖准备范围。
- [ ] GitHub required checks、CodeQL 和分支保护门禁完成后实际合并。
