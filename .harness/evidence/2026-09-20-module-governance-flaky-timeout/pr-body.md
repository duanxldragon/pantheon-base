## 变更摘要

- 改动层级：test-infrastructure（前端 smoke 测试预算）
- 改动模块：frontend/tests/smoke/business/generated/module-governance-real.spec.ts
- 目标问题：配置级 30s test timeout 小于该 spec 自身的重试预算（toPass 60s / goto 90s，#246/#284 稳定化引入），CI 2-vCPU runner 上真实 generate→register→purge 闭环在 Vite 首次编译偏慢时于 29.9s 处被截断——超时倒挂型 flaky，与产品行为无关
- 预期影响：test 预算提至 120s 并补充预算推导注释，消除该 flake；不削重试块、不改产品代码、不动全局 playwright 配置

## Harness 链路

- Task ID：2026-09-20-module-governance-flaky-timeout
- Task Manifest：.harness/tasks/2026-09-20-module-governance-flaky-timeout/manifest.json
- Evidence：.harness/evidence/2026-09-20-module-governance-flaky-timeout/commands.json
- Verification evidence：.harness/evidence/2026-09-20-module-governance-flaky-timeout/summary.md
- Review Artifact：.harness/evidence/2026-09-20-module-governance-flaky-timeout/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：ci-workflow
- Ratchet Decision：no-repeat-observed
- GitHub Signal：external-flaky

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-09-20-module-governance-flaky-timeout
- task manifest: .harness/tasks/2026-09-20-module-governance-flaky-timeout/manifest.json
- evidence: .harness/evidence/2026-09-20-module-governance-flaky-timeout/commands.json
- boundaries: test budget raise only; no product code, no contract, no permission/menu/i18n surface
- backend response contract: none
- backend DTO contract: none
- permission contract: none
- audit coverage: none
- visual evidence: none
- inheritance contract: none
- base drift: none
- Base/ops inheritance: test-only; ops consumes via next foundation release, no manual copy

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

> 改动全部落在 smoke 测试预算；未触碰任何系统域或产品路径。

## 验证记录

- [ ] 后端测试：不适用（无后端代码改动）
- [ ] 前端构建：不适用（仅测试文件）
- [ ] 轻量 smoke：已按最小充分集合执行——`test:smoke:business:generated`（真实闭环）本地实跑通过，见 Verification evidence
- [x] 如涉及系统域深链路，已补充专项 smoke：真实 generate→register→purge 闭环即本 spec 本身
- [x] 其他专项验证已补充：隔离复现确认运行环境另一发现（见补充说明）
- [ ] CodeQL 结果已检查并解释：由 GitHub required checks 在 PR 上执行
- [ ] 如有 open CodeQL alert，已说明：不适用（测试预算改动，无安全面）
- [x] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [ ] GitHub required checks 通过：推送后由分支保护执行
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用：创建 PR 后按仓库策略请求
- [x] 已启用或确认将启用 squash auto-merge

补充说明：本地实跑时发现**运行环境另一发现**——维护者启动的 8080 后端进程 PATH 中无 node，generator preview 端点返回 500 `module.generate.server_export_failed`（`workspace.go` 的 `exec.LookPath("node")` 失败）；同一 exporter 脚本手动执行正常，用 `PANTHEON_NODE_BIN` 启动的第二个后端实例 preview 返回 200。此为运行环境问题而非代码缺陷，不属本 PR 范围，已记录于 evidence 并提请维护者侧处理（重启后端时带上 node PATH 或设置 PANTHEON_NODE_BIN）。

## 审核留痕

- Copilot review：requested
- CodeQL 结果：由 PR required checks 执行并留痕于 GitHub
- GitHub checks 结果：推送后由分支保护判定
- Auto-merge：enabled
- Duplication Gate 结果：not-applicable（仅测试预算常量与注释）
- 是否高风险改动：no（test-only，非高风险范围清单所列）
- Residual risk / follow-up：CI Full Smoke 为 2-vCPU 时序的最终裁决；8080 node/PATH 环境发现留待维护者处理

## 检查清单

- [x] 已明确本次改动归属 test-infrastructure（非系统域/业务域产品代码）
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n：不适用（无展示文案）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰（未触碰）
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（无此类变更）
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
