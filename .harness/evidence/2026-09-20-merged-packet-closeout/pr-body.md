## 变更摘要

- 改动层级：platform（harness 治理 / task packet 与 evidence 回写）
- 改动模块：`.harness/tasks/2026-09-20-{ci-bench-perf-smoke,tenant-hostile-matrix-phase2,bench-perf-smoke-summary-path}/`（status 回写 + closeout 章节）、对应三个 `.harness/evidence/*/summary.md`（追加 closeout 记录）、`docs/harness/failure-registry.md`（新增 FR-011）、本次回写自身的 packet + evidence（`.harness/tasks|evidence/2026-09-20-merged-packet-closeout/`）、以及 FR-011 的 follow-up packet（`.harness/tasks|evidence/2026-09-20-smoke-core-tenant-ci-gap/`，诊断命令以 `not-run` 记录）
- 目标问题：当天合入的三个 PR（#327 / #329 / #330）对应的 task packet 仍停在合入前状态（`in-progress` / `in-review`），packet 与 evidence 描述的是分支期意图——PR 号、merge commit、分支是否删除、required/advisory 信号的实际结论、哪些 gap 被合入关闭，全部没有落进仓库；`PANTHEON_BASE_DELIVERY_WORKFLOW.md` 第 7 节「最小交付件」明确要求这些字段，缺项就不能称为完整闭环
- 预期影响：三个 packet 的 `status` 变为 `completed`，`statusNote` 与 `task.md` 的 closeout 表带上可核对的合入事实（PR / merge commit / merged-at / 分支删除 / 信号分类）；三份 evidence 各补一节合入后记录，明确「合入关闭了什么、还开着什么」。**纯文档与证据回写**：无 workflow、无产品代码、无测试改动，未改变任何门禁权重。过程中发现的新问题（advisory `Core Smoke` 长期红且被 `continue-on-error` 掩盖）只登记为 FR-011，不在本 PR 处置

## Harness 链路

- Task ID：2026-09-20-merged-packet-closeout
- Task Manifest：.harness/tasks/2026-09-20-merged-packet-closeout/manifest.json
- Evidence：.harness/evidence/2026-09-20-merged-packet-closeout/commands.json
- Verification evidence：.harness/evidence/2026-09-20-merged-packet-closeout/summary.md
- Review Artifact：.harness/evidence/2026-09-20-merged-packet-closeout/review.md
- OpenSpec change：none
- Trivial change：yes
- Quality Profile：none
- Ratchet Decision：registry-only
- GitHub Signal：repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-09-20-merged-packet-closeout
- task manifest: .harness/tasks/2026-09-20-merged-packet-closeout/manifest.json
- evidence: .harness/evidence/2026-09-20-merged-packet-closeout/commands.json
- boundaries: task packet status/closeout writeback for three merged tasks + append-only closeout sections in their evidence + one failure-registry row (FR-011) + this pass's own packet/evidence; no workflow, product code, test, permission, menu or i18n change
- backend response contract: none
- backend DTO contract: none
- permission contract: none
- audit coverage: none
- visual evidence: none
- inheritance contract: none
- base drift: none
- Base/ops inheritance: none

## 边界说明

- [x] 本次改动仅涉及单一层级（platform / harness 治理）
- [ ] 本次改动涉及跨层，已说明边界与依赖

> 改动全部落在 `.harness/**` 与 `docs/harness/failure-registry.md`；三个被回写任务的 `review.md` 与 `commands.json` 保持原样，历史记录不被改写。

## 验证记录

- [ ] 后端测试：不适用（无后端改动）
- [ ] 前端构建：不适用（无前端改动）
- [ ] 轻量 smoke：不适用（无 UI/运行时行为改动）
- [ ] 如涉及系统域深链路，已补充专项 smoke：不适用
- [x] 其他专项验证已补充：① 合入事实逐条由 `gh pr view` / `gh api .../check-runs` / `git ls-remote --heads origin` 取回（PR、merge commit、merged-at、分支已删除、PR 与 main tip 的信号分类）；② `check-failure-registry.mjs --root . --strict` PASS（0 error / 0 warning，FR-011 行枚举合法）；③ `check-evidence.mjs --strict` 与 `check-review.mjs --strict` 对本次新增 evidence/review 均 PASS；④ structure-contract 0 findings / 1903 文件、encoding 0 findings / 1703 文件、method-health no findings、doc-links 0 findings、duplication PASS、adoption 0 findings；⑤ 四个被改动 manifest 用 `json.load` 逐个校验（过程中发现并修复了 statusNote 编辑丢掉尾逗号导致 JSON 不可解析的问题）
- [x] CodeQL 结果已检查并解释：本次无代码改动，无信任边界变化
- [ ] 如有 open CodeQL alert，已说明：不适用
- [x] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [ ] GitHub required checks 通过：推送后由分支保护执行
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用：创建 PR 后按仓库策略请求
- [x] 已启用或确认将启用 squash auto-merge

补充说明：main tip `b3350be3` 上 required 信号（CI 含 Quality Gates / Frontend Contract、Security Gates、Code Quality Gates、Lint Workflows）全绿，advisory `Bench Perf Smoke` 已转 success；advisory `Core Smoke` 仍红，且**先于本次合入存在**（近 37 次 main run 中 29 红，唯一三个绿 run 都在 2026-09-10，最早的红 run 在 2026-09-05）。该 job 是 push-only + `continue-on-error: true`，workflow 级结论始终为绿，PR 路径永远不会跑到它，因此 `.harness/evidence/.../tenant-hostile-matrix-phase2` 里的 9/9 依旧是本地证据。已登记为 FR-011（registry-only，open），**处置**（给该 job 配 multi-mode + fixture，或把 smoke-core 租户 spec 移出范围）属维护者决策，本 PR 不做；**根因诊断**已另开任务 `.harness/tasks/2026-09-20-smoke-core-tenant-ci-gap/`，其中记录了已确认的静态机制（job 不提供租户模式/租户/fixtures，spec 无 skip 守卫，`tests/smoke-core/README.md` 的 8 文件清单与 `*.spec.ts` 通配已脱节）与排序假设（环境前置缺失 vs. 真实隔离回归）。

## 审核留痕

- Copilot review：requested
- CodeQL 结果：无代码改动，由 PR required checks 留痕
- GitHub checks 结果：推送后由分支保护判定
- Auto-merge：enabled
- Duplication Gate 结果：PASS（`node scripts/check-duplication.mjs`，仅剩既有的 smoke-core / smoke-full workflow 重复对）
- 是否高风险改动：no（无 `.github/workflows/*`、无 schema/权限/认证/审计/删除动作）
- Residual risk / follow-up：① advisory `Core Smoke` 长期红（FR-011，open，未修；根因诊断另开 `.harness/tasks/2026-09-20-smoke-core-tenant-ci-gap/`，含假设与验证方案）；② 「合入 → 回写 packet」仍无机械联系，本次为手工回写（升级 sensor 需要更明确的信号来源，已写明理由）；③ 同一工作流之外的合入 packet 未回写（#325、#326、#328，其中 #328 仍显示 in-progress），已在 evidence 中显式列出；④ `check-review --strict` 未接线到 CI，部分历史 evidence 缺 Machine Readable 块（观察到但未改）

## 检查清单

- [x] 已明确本次改动归属 platform（harness 治理回写）
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n：不适用
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰（未触碰）
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（无 schema/权限变更；task packet、evidence、failure registry 已同步）
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
