## 变更摘要

- 改动层级：platform（CI 基础设施）+ 测试基础设施
- 改动模块：`.github/workflows/ci.yml`（新增 advisory bench job）、`backend/pkg/testmysql`（`OpenTB`）、`backend/modules/system/audit/audit_export_test.go`（helper 放宽）
- 目标问题：finding #4 follow-up（runtime-gap-ci-feasibility-20260918）——CI 缺少可随时间追踪的 benchmark 相对回归信号；且实跑发现三个 audit benchmark 因 helper 硬断言 `*testing.T` 而从未能运行（`testing.B` 直接 fatal）
- 预期影响：新增 `bench-perf-smoke` advisory job（MySQL service + `-benchtime 1x`，输出仅进 job summary，不阻断合并）；benchmark 在本地与 CI 均可真实运行；生产容量基线仍归 staging（runner 数字不具生产代表性）

## Harness 链路

- Task ID：2026-09-20-ci-bench-perf-smoke
- Task Manifest：.harness/tasks/2026-09-20-ci-bench-perf-smoke/manifest.json
- Evidence：.harness/evidence/2026-09-20-ci-bench-perf-smoke/commands.json
- Verification evidence：.harness/evidence/2026-09-20-ci-bench-perf-smoke/summary.md
- Review Artifact：.harness/evidence/2026-09-20-ci-bench-perf-smoke/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：ci-workflow
- Ratchet Decision：sensor-added
- GitHub Signal：not-applicable

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-09-20-ci-bench-perf-smoke
- task manifest: .harness/tasks/2026-09-20-ci-bench-perf-smoke/manifest.json
- evidence: .harness/evidence/2026-09-20-ci-bench-perf-smoke/commands.json
- boundaries: CI advisory bench job + test helper TB support; no product code, no audit production logic, no quality/security workflow changes
- backend response contract: none
- backend DTO contract: none
- permission contract: none
- audit coverage: none (audit production code untouched; only its test helper)
- visual evidence: none
- inheritance contract: none
- base drift: none
- Base/ops inheritance: none (CI-only; ops consumes via next foundation release if desired)

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

> platform（CI）+ 测试基础设施（pkg/testmysql、audit test helper）两处最小改动；product/audit 生产代码零改动。

## 验证记录

- [x] 后端测试：`go test ./pkg/testmysql/ ./modules/system/audit/`（含 DSN）全绿；无 DSN skip 路径 PASS；`go vet`/`gofmt` clean
- [ ] 前端构建：不适用（无前端改动）
- [ ] 轻量 smoke：不适用（无 UI 改动）
- [x] 如涉及系统域深链路，已补充专项 smoke：三个 benchmark 真实执行（~24-26ms/op @ 20k 行，修复前为 helper fatal）
- [x] 其他专项验证已补充：zizmor 1.25.2 基线对比（stash 前后 13=13，`cache:false` 修正了 `cache:true` 的 +1）；ci.yml YAML 语法校验
- [x] CodeQL 结果已检查并解释：测试辅助与 workflow 改动，无信任边界变化；由 PR required checks 执行
- [ ] 如有 open CodeQL alert，已说明：不适用
- [x] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [ ] GitHub required checks 通过：推送后由分支保护执行
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用：创建 PR 后按仓库策略请求
- [x] 已启用或确认将启用 squash auto-merge

补充说明：runner 上的 benchmark 数字**不是**生产容量基线（2-4 vCPU 共享宿主）；生产级性能/观测基线仍按 2026-09-18 处置结论归 staging。job 为 advisory/report-only，升级为阻断属未来 ratchet 决策（维护者 gate）。

## 审核留痕

- Copilot review：requested
- CodeQL 结果：由 PR required checks 执行并留痕于 GitHub
- GitHub checks 结果：推送后由分支保护判定
- Auto-merge：enabled
- Duplication Gate 结果：not-applicable（workflow + 测试辅助）
- 是否高风险改动：yes（`.github/workflows/*` 在高风险清单）——已做 zizmor 本地基线对比（零新增）、job advisory 化、无凭证字面量
- Residual risk / follow-up：staging 基线（维护者侧）；advisory→blocking 升级（维护者 gate）；其他包潜在同类 benchmark 失能（当前仓库无其他 benchmark）

## 检查清单

- [x] 已明确本次改动归属 platform + 测试基础设施
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n：不适用
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰（未触碰）
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（无 schema/权限变更；task packet 已记录）
- [x] 已确认不会泄露敏感配置、账号密码或 Token（job 用 per-run 随机密码模式）
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
