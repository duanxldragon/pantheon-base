## 变更摘要

- 改动层级：`platform`
- 改动模块：`repository-governance / pr-automation`
- 目标问题：`GitHub auto-merge 成功后，head branch 没有稳定自动删除，导致单人维护分支残留`
- 预期影响：`merged PR 会在 closed 事件里显式删除同仓库 head branch，远端分支不再依赖 GitHub 默认行为`

## Harness 链路

- Task Packet：`docs/harness/tasks/2026-06-18-pr-branch-cleanup-automation.task.md`
- Evidence：`.harness/evidence/2026-06-18-pr-branch-cleanup-automation/commands.json`
- Verification evidence：`.harness/evidence/2026-06-18-pr-branch-cleanup-automation/summary.md`
- Review Artifact：`.harness/evidence/2026-06-18-pr-branch-cleanup-automation/review.md`
- OpenSpec change：`none`
- Trivial change：`no`
- Quality Profile：`ci-workflow`
- Ratchet Decision：`gate-updated`
- GitHub Signal：`repo-quality-gate`

## Harness adoption markers

- task packet: `docs/harness/tasks/2026-06-18-pr-branch-cleanup-automation.task.md`
- evidence: `.harness/evidence/2026-06-18-pr-branch-cleanup-automation/`
- boundaries: `repository-governance only`
- backend response contract: `none - repository-governance only`
- backend DTO contract: `none - repository-governance only`
- permission contract: `none - repository-governance only`
- audit coverage: `workflow test + governance checks + explicit remote branch cleanup verification`
- visual evidence: `none`
- inheritance contract: `none - repository-governance only`
- base drift: `none`
- Base/ops inheritance: `ops mirrors the same merged-branch cleanup rule in its own follow-up PR`

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

> 本次只调整仓库级 PR 自动化与分支清理策略，不涉及 backend、frontend 或业务运行时。

## 验证记录

- [x] 其他专项验证已补充
- [x] GitHub required checks 将由 PR 门禁继续验证
- [x] 已启用或确认将启用 squash auto-merge

补充说明：

- 已本地验证 `pr-automation` workflow test、feedback loop regression、docs/task/failure/generated governance checks。
- 已手工清理当前确认可删的 merged remote branches，并开启 `fetch.prune=true` 作为本地视图兜底。

## 审核留痕

- Copilot review：`requested-or-nonblocking`
- CodeQL 结果：`not-applicable-repo-governance-only`
- GitHub checks 结果：`pending-github-checks`
- Auto-merge：`pending-github-checks`
- Duplication Gate 结果：`report-only-on-pr`
- 是否高风险改动：`no`
- Residual risk / follow-up：`historical closed-but-unmerged branches still need one-time cleanup policy`

## 检查清单

- [x] 已明确本次改动归属 `platform`
- [x] 未触碰系统域和业务域运行时
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks 和分支保护负责最终合并门禁
