## 变更摘要

- 改动层级：platform（CI 治理层，不涉及产品代码）
- 改动模块：`.github/workflows/quality.yml` docs-governance job、`package.json` scripts
- 目标问题：pantheon-harness HOT-001 —— visual evidence promotion window 无法启动，因为 base CI 从未运行 `check-visual-evidence.mjs`
- 预期影响：新增观察模式（`continue-on-error: true`）的 visual evidence 检查步骤，结果进 harness governance 汇总表；不阻断任何事件（明确排除在 main/release 严格 enforcement 之外）。连续 3 个 UI 任务带渲染证据且零误报后，按 policy 升级为阻断

## Harness 链路

- Task ID：2026-07-26-visual-evidence-observation-gate
- Task Manifest：.harness/tasks/2026-07-26-visual-evidence-observation-gate/manifest.json
- Evidence：.harness/evidence/2026-07-26-visual-evidence-observation-gate/commands.json
- Verification evidence：.harness/evidence/2026-07-26-visual-evidence-observation-gate/summary.md
- Review Artifact：.harness/evidence/2026-07-26-visual-evidence-observation-gate/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：ci-workflow
- Ratchet Decision：sensor-added
- GitHub Signal：method-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-07-26-visual-evidence-observation-gate
- task manifest: .harness/tasks/2026-07-26-visual-evidence-observation-gate/manifest.json
- evidence: .harness/evidence/2026-07-26-visual-evidence-observation-gate/commands.json
- boundaries: .github/workflows/quality.yml + package.json + task harness artifacts only
- backend response contract: not-applicable
- backend DTO contract: not-applicable
- permission contract: not-applicable
- audit coverage: not-applicable
- visual evidence: not-applicable (this PR wires the checker itself; no UI touched)
- inheritance contract: not-applicable
- base drift: none
- Base/ops inheritance: none

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

## 验证记录

- [ ] 后端测试：`go test ./...`（未涉及后端代码，governance-only 路径自动跳过）
- [ ] 前端构建：`cd frontend && npm run build`（未涉及前端代码）
- [ ] 轻量 smoke（未涉及运行时代码，change-scope 判定 governance_only 后自动跳过）
- [ ] 如涉及系统域深链路，已补充专项 smoke（不适用）
- [x] 其他专项验证已补充：`npm run check:harness-visual` no findings；`npm run test:quality-workflow` 3/3 pass
- [x] CodeQL 结果已检查并解释：无代码变更，不产生新 alert
- [ ] 如有 open CodeQL alert（不适用）
- [x] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [ ] GitHub required checks 通过（等待本次推送后的 CI）
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用（solo maintainer 直接验收）
- [x] 已启用或确认将启用 squash auto-merge（CI 绿后由 maintainer 启用）

补充说明：观察模式步骤的注释里写明了升级条件与 policy 出处（pantheon-harness `visual-evidence-promotion-policy.md`）；对应评估记录见 pantheon-harness 提交 4ac6dee。首次 CI 失败原因是 PR body 缺少 harness 工件链路（Trivial change: no 不允许 none），本次推送补齐了 manifest + evidence 工件并更新了 body。

## 审核留痕

- Copilot review：unavailable（solo maintainer 仓库，无 Copilot review 账号）
- CodeQL 结果：无代码变更，不产生新 alert
- GitHub checks 结果：前次运行失败于 PR body 治理校验（缺工件链路），已补齐工件并更新 body，等待本次推送重新运行
- Auto-merge：not-enabled（CI 绿后由 maintainer 决定启用）
- Duplication Gate 结果：预期通过（无产品代码变更，无新增重复面）
- 是否高风险改动：no（观察模式步骤，continue-on-error，不参与任何 enforcement）
- Residual risk / follow-up：promotion window 追踪在 pantheon-harness harness-open-tasks.md HOT-001；连续 3 个 UI 任务达标后另开 PR 升级为阻断

## 检查清单

- [x] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n（不适用：无前端改动）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰（不适用：无授权面改动）
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（不适用）
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁

🤖 Generated with [Claude Code](https://claude.com/claude-code)
