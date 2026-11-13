## 变更摘要

- 改动层级：platform
- 改动模块：共享 system smoke helper、foundation candidate 文件处理及回归、package.json 测试接线、v0.18.8 发布治理
- 目标问题：临时 Arco empty 节点脱离 DOM 后，readiness helper 丢失短超时并耗尽测试时间；candidate 文件处理另有9条高危 CodeQL js/file-system-race 告警，候选回归此前未被 hosted foundation 命令选中。
- 预期影响：把 Locator.evaluate 的 timeout 放入第三参数，现有重试可以恢复；candidate/descriptor/receipt/executable/CLI inventory 用受限 fd 读取及身份校验，测试重建文件使用独占 fd 写入；扩展现有 foundation 测试命令覆盖 candidate 回归。

安全修复保留 descriptor/hash/capability 与官方 consumer lock 合同。package.json 的命令增加 scripts/foundation-release/*.test.mjs；ci.yml 已调用同一命令。本准备沿用原发布任务，并链接新的独立 L2 安全任务。最终 target candidateaf7b5e4b 已封存，标准 consumer backend/frontend 构建通过，五源码独立 SOURCE/CODE-security APPROVE 与 ARCH APPROVE/CLEAR 已留证；最终完整树确认、合并与 hosted 门禁待完成；此前43be57与bb028仅保留其历史/临时范围。

## Harness 链路

- Task ID：2026-11-13-v0188-release-preparation
- Task Manifest：.harness/tasks/2026-11-13-v0188-release-preparation/manifest.json
- Evidence：.harness/evidence/2026-11-13-v0188-release-preparation/commands.json
- Verification evidence：.harness/evidence/2026-11-13-v0188-release-preparation/summary.md
- Review Artifact：.harness/evidence/2026-11-13-v0188-release-preparation/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：ci-workflow
- Ratchet Decision：sensor-added
- GitHub Signal：repo-quality-gate
- Security task：.harness/tasks/2026-11-13-candidate-filesystem-security/manifest.json
- Security evidence：.harness/evidence/2026-11-13-candidate-filesystem-security/commands.json
- Security review：.harness/evidence/2026-11-13-candidate-filesystem-security/review.md

## Harness adoption markers

- task id: 2026-11-13-v0188-release-preparation
- task manifest: .harness/tasks/2026-11-13-v0188-release-preparation/manifest.json
- evidence: .harness/evidence/2026-11-13-v0188-release-preparation/commands.json
- boundaries: platform 共享烟测与 foundation producer/consumer；单表达式 helper 修复、三处 candidate 文件及 package 测试接线
- backend response contract: none
- backend DTO contract: none
- permission contract: none
- audit coverage: none
- visual evidence: .harness/evidence/2026-11-13-v0188-release-preparation/smoke-empty-readiness/known-empty-desktop.png
- inheritance contract: docs/designs/FOUNDATION_RELEASE_MODEL.md
- base drift: Base-first；消费由标准封存 candidate 验证与正式 immutable release 提供
- Base/ops inheritance: v0.18.7 正式消费保留；v0.18.8 最终 candidate 重封存/标准构建通过，正式发行或消费未宣称

## 边界说明

- [x] 安全文件与 runtime 回归归属独立 L2；共享 smoke 修复为原 L2 发布任务下的 L1 续办。
- [x] 变更限于 helper 一处调用、三处 candidate 文件、package 测试命令与本轮治理/evidence。

结构链路：system route smoke -> readiness helper -> native Locator.evaluate/toPass；本地 source/descriptor/receipt/executable/inventory 文件 -> fd 验证 -> immutable candidate -> consumer reconstruction；现有 CI foundation 命令 -> 新纳入 candidate suite。原84文件审批和失败记录保留；本轮五源码独立审批通过，最终完整文档/evidence 树确认待完成。

## 验证记录

- [x] 实际 helper 浏览器证明：PW1.65.0 / Chromium158 / Node24.22.3；五个预期结果通过。旧脱离节点失败30.046s，修复后2.171s、两次重试；有效 empty/有数据通过，未知 empty 仍拒绝。精确 helper ESLint/strict TypeScript 通过。
- [x] node --test scripts/foundation-release/candidate-artifact.test.mjs：68节点 / 65通过 / 0失败 / 3 Windows leaf-symlink capability skips。
- [x] npm run test:foundation-release（接线后）：125节点 / 122通过 / 0失败 / 3同类 skips；Node24.22.3，exit0。接线前57/57与初始 TDD 失败记录分别保留。
- [x] npm run check:security-patterns：0 new violations；46 accepted baseline 保留。
- [x] 九项准备治理检查通过，导入 helper 证明后相关四项重跑通过；真实 command/log/原始 SHA256 有记录。
- [x] 最终 candidateaf7b5e4b 已重封存；1176 sourceStable，5 changed/1171 unchanged leaves，descriptor/tar hash 已核对。
- [x] target candidate 标准 consumer readonly CGO backend 与 fresh Node24.22.3 npm ci/lint/type-check/build 全部 exit0；1176/963/2115 leaves、adapter pins、官方0187lock 与 seal 前后不变。
- [ ] 最终 merged main/local HEAD=remote SHA 且1176输入精确绑定。
- [x] 独立五源码 SOURCE/CODE-security APPROVE、ARCH APPROVE/CLEAR，绑定 source93b617 与 finalAF；原始报告 gzip/hash 留证。
- [ ] 最终完整文档/evidence tree 独立只读确认由 root 留存外部报告。
- [ ] Linux hosted 三个 leaf-symlink case、同规则 CodeQL、9条告警自动关闭和最终 required checks。

源码检查点：五源码 tree 93b617c283b20866f3b209047e931246dbf9b009，parent ae2fa81d9903d63b4bec8f01d61082f48a999e2f；package SHA256 aeacce2b72366bc648943d7860355efecab431d28e0d9dacc573bb7bea260a3c。这不是最终完整文档/evidence freeze。捕获的 external helper harness 依赖原 sr509 目录与安装 toolchain；fixture 截图只证明受控状态。官方 CodeQL2.27.4 query 是未执行的参考；manual boundary review 与 hosted 扫描分别留证。

## 审核留痕

- Copilot review：最终 PR 创建后按既有策略请求并收敛；当前尚无该 PR 的反馈结果
- CodeQL 结果：9条高危路径的源码整改与手工边界记录已具备；同规则 hosted rescan/自动关闭待完成
- GitHub checks 结果：本地 helper/candidate/接线测试及准备治理检查通过；最终 hosted 结果待完成
- Auto-merge：not-enabled
- Duplication Gate 结果：最终 hosted 结果待完成
- 是否高风险改动：是；foundation candidate 文件信任边界，需要独立 security/CODE 与 ARCH
- Residual risk / follow-up：Windows 路径观察不是 namespace 原子锁；3个 capability skips 需 Linux hosted 执行。security-diff-scan/CodeQL CLI/LSP 不可用，真实 compiler/AST/test 不冒充 LSP。native preliminary review 0 findings/COMMENT 因 required LSP 缺失；当前五源码 CODE-security/ARCH 审批通过。最终完整树确认/合并/main-only/exact-main CI/Release Gate/四资产仍待；FR028延期、S3无豁免、freeze未签、Ops独立验收保留。

## 检查清单

- [x] 两份任务、层级、源码所有者与 producer/consumer 边界明确。
- [x] 真实失败、历史审批和临时候选范围保留；当前审批未借用旧结果。
- [x] Source/runtime/log/hash 证据可定位，原始敏感认证 trace/backend log 未导入。
- [x] 用户已授权安全修复、常规合并、无用 Base 分支/worktree 清理与 CI 成功后发行。
- [x] source/preparation 两任务 completed/Archived；live inventory18 completed/0 in-progress，完成范围限于准备好走 required-check PR。
- [ ] 最终完整树确认与所有 required checks 完成后通过仓库 wrapper 提交/合并。
