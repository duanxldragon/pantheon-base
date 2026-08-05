## 变更摘要

- 改动层级：platform
- 改动模块：CI aggregation、release governance、Harness evidence
- 目标问题：CI Summary 未对 required job 的非成功状态失败关闭，且未清晰区分全仓 Go Lint 的 advisory 结果与 `quality.yml` 的新代码阻断门禁；历史发布台账存在未收口链接
- 预期影响：提高发布门禁可信度；不改变产品运行时行为

## Harness 链路

- Task ID：2026-08-05-base-v0-10-1-release
- Task Manifest：.harness/tasks/2026-08-05-base-v0-10-1-release/manifest.json
- Evidence：.harness/evidence/2026-08-05-base-v0-10-1-release/
- Verification evidence：.harness/evidence/2026-08-05-base-v0-10-1-release/commands.json
- Review Artifact：.harness/evidence/2026-08-05-base-v0-10-1-release/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：ci-workflow
- Ratchet Decision：gate-updated
- GitHub Signal：repo-quality-gate

## Harness adoption markers

- task id: 2026-08-05-base-v0-10-1-release
- task manifest: .harness/tasks/2026-08-05-base-v0-10-1-release/manifest.json
- evidence: .harness/evidence/2026-08-05-base-v0-10-1-release/
- boundaries: platform CI and release governance only
- backend response contract: not-applicable
- backend DTO contract: not-applicable
- permission contract: unchanged
- audit coverage: not-applicable
- visual evidence: not-applicable; no UI behavior changed
- inheritance contract: foundation release consumer handoff required
- base drift: v0.10.1 is based on the v0.10.0 source tree plus governance-only changes
- Base/ops inheritance: Ops will consume the published v0.10.1 artifact

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

## 验证记录

- [x] 后端测试：不适用，未改 Go 代码
- [x] 前端构建：不适用，未改前端代码
- [x] 轻量 smoke：不适用，未改运行时行为
- [x] 如涉及系统域深链路，已补充专项 smoke：不适用
- [x] 其他专项验证已补充：release tooling、workflow regression、actionlint、Harness strict checks
- [x] CodeQL 结果已检查并解释：候选 PR required check
- [x] 如有 open CodeQL alert，已说明是新增问题、既有 baseline、误报还是已补 follow-up
- [x] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [ ] GitHub required checks 通过
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用：独立 reviewer evidence 已请求
- [ ] 已启用或确认将启用 squash auto-merge

补充说明：候选提交通过后运行 Release Gate，再发布 v0.10.1 并让 Ops 消费。

## 审核留痕

- Copilot review：unavailable；使用两路独立 reviewer evidence
- CodeQL 结果：awaiting hosted candidate
- GitHub checks 结果：awaiting hosted candidate
- Auto-merge：not-enabled
- Duplication Gate 结果：awaiting hosted candidate
- 是否高风险改动：yes，涉及 .github/workflows
- Residual risk / follow-up：hosted candidate checks and release publication

## 检查清单

- [x] 已明确本次改动归属 platform
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n：不适用
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步：不适用
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
