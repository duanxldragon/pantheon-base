## 变更摘要

- 改动层级：platform（CI 基础设施）
- 改动模块：`.github/workflows/ci.yml`（汇总步骤补齐 working-directory + 接线新测试）、`package.json`（新增 test 脚本）、`docs/harness/failure-registry.md`（FR-010）、`tests/scripts/ci-bench-perf-smoke-workflow.test.mjs`（新增漂移守卫）
- 目标问题：#327 新增的 advisory `bench-perf-smoke` job **自落地起每次都红**（两次 main push `0b17c5d9`/`8c8ff37f` 与 #329 的 PR run）：benchmark 步骤在 `backend/` 下 `tee bench.txt`，汇总步骤没声明 `working-directory`，于是 `cat bench.txt` 在仓库根执行 → `No such file or directory`。step 级结论显示 benchmark 步骤是 success（三个 audit benchmark 都真实采样），失败的是「汇报」而不是「测量」
- 预期影响：main 的 CI 基线恢复为全绿；advisory job 的输出重新可信；新增毫秒级漂移守卫，防止「A 步骤在 X 目录写文件、B 步骤在 Y 目录读」这类缺陷回归（守卫已用负向对照验证：还原修复即失败）。job 的 advisory/report-only 定位与门禁权重不变

## Harness 链路

- Task ID：2026-09-20-bench-perf-smoke-summary-path
- Task Manifest：.harness/tasks/2026-09-20-bench-perf-smoke-summary-path/manifest.json
- Evidence：.harness/evidence/2026-09-20-bench-perf-smoke-summary-path/commands.json
- Verification evidence：.harness/evidence/2026-09-20-bench-perf-smoke-summary-path/summary.md
- Review Artifact：.harness/evidence/2026-09-20-bench-perf-smoke-summary-path/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：ci-workflow
- Ratchet Decision：sensor-added
- GitHub Signal：repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-09-20-bench-perf-smoke-summary-path
- task manifest: .harness/tasks/2026-09-20-bench-perf-smoke-summary-path/manifest.json
- evidence: .harness/evidence/2026-09-20-bench-perf-smoke-summary-path/commands.json
- boundaries: ci.yml bench-perf-smoke summary step working-directory + workflow drift guard test + failure-registry row; no product code, no backend/benchmark code, no quality/security/release-gate workflow changes, no advisory-to-blocking promotion
- backend response contract: none
- backend DTO contract: none
- permission contract: none
- audit coverage: none (audit benchmarks untouched)
- visual evidence: none
- inheritance contract: none
- base drift: none
- Base/ops inheritance: none (CI-only; ops consumes via next foundation release if desired)

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

> 全部改动收敛在 CI workflow、其漂移守卫与治理记录；产品代码、后端测试辅助、benchmark 本体零改动。

## 验证记录

- [ ] 后端测试：不适用（无后端改动）
- [ ] 前端构建：不适用（无前端改动）
- [ ] 轻量 smoke：不适用（无 UI/运行时行为改动）
- [x] 如涉及系统域深链路，已补充专项 smoke：不适用（本 PR 是 CI 报告链路的修复）
- [x] 其他专项验证已补充：① 守卫正跑 2/2 pass；② **负向对照**——临时删除汇总步骤的 `working-directory` 后守按预期失败（`["backend",""]`），证明它能抓住原始缺陷；③ `yaml.safe_load` 校验 ci.yml 可解析、bench job 步骤 working-directory = `['-','-','backend','backend']`、unit-tests 已包含新脚本；④ `check-failure-registry.mjs --root . --strict` PASS（0 error / 0 warning）
- [x] CodeQL 结果已检查并解释：workflow 与测试断言改动，无信任边界变化；由 PR required checks 执行
- [ ] 如有 open CodeQL alert，已说明：不适用
- [x] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [ ] GitHub required checks 通过：推送后由分支保护执行
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用：创建 PR 后按仓库策略请求
- [x] 已启用或确认将启用 squash auto-merge

补充说明：本机 `npm`/`npx` 被 WSL shim 拦截（`execvpe(/bin/bash) failed`）且本地 3306 无 MySQL 服务，因此没有本地重放 `benchmark → bench.txt → $GITHUB_STEP_SUMMARY` 全链路；等价命令已用 `node --test` 直接跑通，链路级证据由本 PR 的 `Bench Perf Smoke (advisory)` run 给出。advisory 的可见性缺口（无门禁盯着 report-only job）按原设计保留，已记入 FR-010 的 residual risk；升级为阻断仍是维护者决策（#327 明确列为 Out）。

## 审核留痕

- Copilot review：requested
- CodeQL 结果：由 PR required checks 执行并留痕于 GitHub
- GitHub checks 结果：推送后由分支保护判定
- Auto-merge：enabled
- Duplication Gate 结果：not-applicable（workflow 一行修复 + 独立守卫测试）
- 是否高风险改动：yes（`.github/workflows/*` 在高风险清单）——改动为单行 working-directory 对齐 + 注释，未增删 job/step/trigger/权限，未引入凭证或缓存面
- Residual risk / follow-up：advisory job 静默变红仍无门禁捕捉（FR-010 记录，升级需维护者 gate）；本机 npm shim 与无本地 MySQL 的验证 gap 已显式记录

## 检查清单

- [x] 已明确本次改动归属 platform（CI 基础设施）
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n：不适用
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰（未触碰）
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（无 schema/权限变更；failure registry 与 task packet 已记录）
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
