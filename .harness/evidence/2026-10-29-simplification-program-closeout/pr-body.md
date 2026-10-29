## 变更摘要

- 改动层级：platform（`docs/` 与 `.harness/` 的文档收口），无产品行为、接口、路由、权限、
  i18n、数据库或依赖变化
- 改动模块：`docs/reviews/CODE_SIMPLIFICATION_PLAN.md`（状态行 + §11 执行记录）；
  `.harness/evidence/2026-10-27-codebase-simplification-program/`（新建，兑现程序 manifest
  长期悬空的 linkage）；`docs/harness/tasks/2026-10-27-codebase-simplification-program.task.md`
  与对应 manifest（清单勾选、`runtimeGap`、波次数 12 → 13）；
  `docs/harness/failure-registry.md`（`FR-020`）；`docs/harness/AI_QUALITY_GOVERNANCE.md`（§5.3）；
  本包自己的 packet、manifest 与 evidence
- 目标问题：13 个波次在 2026-10-27/28 全部合并，但计划文档第 6 行仍写"**未执行**"、
  第 302 行仍声明"未修改任何业务源码"；程序清单一项未勾、`runtimeGap` 仍写
  "No wave has started"；program manifest 的 `linkage.summaryFile` 指向一个从未创建的
  证据目录，`check:task-packet` 因此每轮都报一条"Linked review file does not exist"
- 预期影响：计划文档的状态与仓库事实一致，并携带 13 波实测表、结构指标复测、行数窗口口径、
  RC 覆盖率（33/45）与未关闭项；程序包状态**保持 `in-progress`**（唯一未勾项是
  `pantheon-ops` 对 foundation release 的构建）；`check:task-packet` 警告 15 → 13；
  零源码 diff、零门禁规则改动

## Harness 链路

- Task ID：`2026-10-29-simplification-program-closeout`
- Task Manifest：`.harness/tasks/2026-10-29-simplification-program-closeout/manifest.json`
- Evidence：`.harness/evidence/2026-10-29-simplification-program-closeout/commands.json`
- Verification evidence：`.harness/evidence/2026-10-29-simplification-program-closeout/summary.md`
- Review Artifact：`.harness/evidence/2026-10-29-simplification-program-closeout/review.md`
- OpenSpec change：none
- Trivial change：no
- Quality Profile：none
- Ratchet Decision：guide-updated
- GitHub Signal：method-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-10-29-simplification-program-closeout
- task manifest: .harness/tasks/2026-10-29-simplification-program-closeout/manifest.json
- evidence: .harness/evidence/2026-10-29-simplification-program-closeout/commands.json
- boundaries: 只动 `docs/` 与 `.harness/`；未改 backend / frontend / workflow / sonar 配置 / 依赖
- backend response contract: not-applicable（无后端改动）
- backend DTO contract: not-applicable（无后端改动）
- permission contract: unchanged（无权限链路改动）
- audit coverage: unchanged（无审计链路改动）
- visual evidence: not-applicable（无 UI 改动）
- inheritance contract: 未改 sharedPaths 或继承合同；`pantheon-ops` 无需动作
- base drift: 分支基于 `main` @ `3b73c7a4`（PR #466 合并后的提交）
- Base/ops inheritance: 无同步要求；只改 base 自有的计划文档与证据

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

补充说明：改动落在 `platform` 层的治理文档面。§11 写入的是**已经发生的**代码事实
（13 个波次早已以常规 PR 合入 `main`），本 PR 不包含任何源码变更，因此不需要
重新验证波次行为——后端 `go test` 复跑只是为了确认计划文档引用的读数没有过期。

## 验证记录

- [x] 波次普查：13 个波次 manifest 全部 `completed`（S1×2、S2×6、S3×3、S4×2）
- [x] `cd backend && go build ./... && go vet ./...` → 0 错误
- [x] `cd backend && go test -count=1 ./...` → **47 ok / 0 FAIL / 6 个无测试文件的包 / 0 SKIP**
- [x] 测试包数 vs 基线：46 → 47，唯一新增是 `modules/system/iam`（S3 双租户冒烟），无包减少
- [x] 结构指标复测：`ParseUint(c.Param("id")` **2**（基线 35，目标 ≤2）、
  分页归一化 **1 + 字段适配器**（基线 13）、按页上限钳制行 **1**（基线 11）、
  `Offset((page-1)*pageSize)` **4**（基线 14）、`func.*tenantOwnerID` **0**（基线 11）、
  `var errParamInvalid` **0**（基线 11）
- [x] 行数窗口：backend 非测试 53,179 → **52,332**、frontend src 68,169 → **67,828**；
  已在 §11.4 标明该窗口含租户功能等净增项，**不作为精简收益引用**
- [x] `check:task-packet`：15 → **13 warnings / 0 errors**（消失的两条正是本包要关的）
- [x] `check:harness-docs`、`check:structure`（0/2909）、`check:harness-encoding`（0/2561）、
  `check:docs-frontmatter`（395 docs / 277 带 frontmatter）、`check:harness-inventory`、
  `check:harness-adoption`、`check:harness-visual`、`check:ui-quality-gate`、
  `check:failure-registry`、`check:duplication` → 全部 0 finding / PASS
- [x] `node scripts/harness/check-evidence.mjs --strict`（2 文件）、
  `check-review.mjs --strict`（3 文件）→ 0 error

## 审核留痕

- Copilot review：见 PR 机器人读数
- CodeQL 结果：仅 Markdown 与 JSON，预计无新增告警；以 PR checks 为准
- GitHub checks 结果：见 PR checks 读数
- Auto-merge：允许（纯文档收口，无行为面；若有 review 反馈先处理再合）
- Duplication Gate 结果：`Result: PASS`
- 是否高风险改动：否（无源码、无 workflow、无权限/审计链路、无依赖）
- Residual risk / follow-up：
  - 程序包的 `pantheon-ops` 构建项仍未验证，需要维护者切一个覆盖 13 个波次的
    foundation release；本 PR 不切发布。
  - 计划里 12 条 RC（018、021、032–035、039–042、044、045）仍是显式遗留，
    要动它们需另立波次。
  - 其余 13 条 `check:task-packet` 警告属于别的任务包，本 PR 不认领。

## 检查清单

- [x] 已明确本次改动归属 `platform`，未把系统域职责混写
- [x] 未改任何门禁规则、workflow、Sonar 配置、阈值或依赖
- [x] 未删除任何文件；程序包状态保持 `in-progress`，未关闭未完成的项
- [x] 无前端、i18n、菜单、授权、数据库或迁移变化
- [x] 计划文档的原始估算与风险判断保留原文，实测值单列在 §11，未回写改写
- [x] 已把"程序收口被波次收口掩盖"的失败模式登记为 `FR-020` 并落到 §5.3
