## 变更摘要

- 改动层级：platform（发布记录）
- 改动模块：`.harness/STATUS.md`、`.harness/tasks/2026-10-24-v0175-release-closeout/manifest.json`、`.harness/evidence/2026-10-24-v0175-release-closeout/{summary.md,review.md,commands.json}`
- 目标问题：v0.17.5 已切 tag 并发布，需要把发布事实（tag object、目标提交、资产校验和、Release Gate、SonarCloud、Foundation Release Verify、secret scan）写回任务记录，使 `state` 从 `prepared` 变为 `published`
- 预期影响：仅文档与证据记录，无代码、schema、路由、权限码、菜单 seed 或 workflow 变化

## Harness 链路

- Task ID：2026-10-24-v0175-release-closeout
- Task Manifest：.harness/tasks/2026-10-24-v0175-release-closeout/manifest.json
- Evidence：.harness/evidence/2026-10-24-v0175-release-closeout/commands.json
- Verification evidence：.harness/evidence/2026-10-24-v0175-release-closeout/summary.md
- Review Artifact：.harness/evidence/2026-10-24-v0175-release-closeout/review.md
- OpenSpec change：none
- Trivial change：yes
- Quality Profile：none
- Ratchet Decision：registry-only
- GitHub Signal：not-applicable

## Harness adoption markers

- task id: 2026-10-24-v0175-release-closeout
- task manifest: .harness/tasks/2026-10-24-v0175-release-closeout/manifest.json
- evidence: .harness/evidence/2026-10-24-v0175-release-closeout/
- boundaries: publication facts only; the released tree is `ed636967` and this PR does not modify it
- backend response contract: unchanged
- backend DTO contract: unchanged
- permission contract: unchanged
- audit coverage: unchanged
- visual evidence: not-applicable
- inheritance contract: no sharedPaths or contract document change
- base drift: branch cut from main ed636967
- Base/ops inheritance: pantheon-ops consumes `pantheon-base-v0.17.5` by advancing its foundation pin

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

补充说明：发布已经完成；本 PR 只记录事实，不重新发布、不改动 tag 或资产。

## 验证记录

- [x] `check-release-secrets`：clean，扫描 3126 个文件
- [x] `check-release-assets`：本地 bundle 与远端 release 四件资产一致
- [x] `gh release view pantheon-base-v0.17.5`：非 draft、非 prerelease，target `ed636967`，四件资产齐备
- [x] `Foundation Release Verify` run `40048834275`：Verify Release Assets 与 Summary 均 success
- [x] `Release Gate` run `40046885713`：success
- [x] SonarCloud `main@ed636967`：未解决 issue 0，Quality Gate OK
- [x] `check-evidence --strict`：通过；`check-review --strict`（本任务文件）：通过
- [ ] CodeQL 结果：待 CI
- [ ] GitHub required checks：待 CI
- [ ] Copilot review：待 PR Automation

## 审核留痕

- Copilot review：requested
- CodeQL 结果：待 CI
- GitHub checks 结果：待 CI
- Auto-merge：enabled by PR Automation
- Duplication Gate 结果：待 CI
- 是否高风险改动：no（纯记录）
- Residual risk / follow-up：本地 TSan 仍不可用（error 87）；v0.17.0–v0.17.4 的 tag 与资产保持不可变

## 检查清单

- [x] 已明确本次改动归属 `platform`（发布记录）
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n：未涉及
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步：无此类变更
- [x] 已确认不会泄露敏感配置、账号密码或 Token
