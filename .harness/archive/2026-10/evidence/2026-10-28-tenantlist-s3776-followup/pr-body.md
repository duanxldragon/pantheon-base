## 变更摘要

- 改动层级：platform（一个前端列表页的渲染函数提取 + 两处 harness 文档/登记），
  无 schema / 路由 / 权限 / i18n / 契约语义变化
- 改动模块：`frontend/src/modules/system/iam/tenant/TenantList.tsx`（四态分支链提取为
  组件内 `renderBody()`）；`docs/harness/AI_QUALITY_GOVERNANCE.md` §5.2（新增
  “静态分析类修复须同规则复测并记录改前/改后读数”）；`docs/harness/failure-registry.md`
  （新增 `FR-018` 与复核说明）
- 目标问题：`2026-10-28-release-gate-green`（PR #463）声称 `typescript:S3776` 已通过
  把五处 `isAdmin || hasPerm('...')` 收敛成 `can(perm)` 清除，但 `main` 在 `1ae6481c`
  上的最新分析（2026-10-28T14:19Z）仍报同一 issue（`AaF89PoZ78TOH8UMk82y`，
  `TenantList.tsx:116`，复杂度 16）。用与 SonarCloud 同一套
  `sonarjs/cognitive-complexity` 规则复测：`main` 现有文件与 #463 之前的文件**都是 16**，
  即 `can(perm)` 只是等价去重、对分值无影响；真实贡献项是组件体内联的四态分支链
- 预期影响：提取后组件 16 → 10、新函数 5（阈值 4 下的真实分值），阈值 15 下无告警；
  四态判定条件、返回元素、类名、i18n key、`onRetry` 行为逐条不变，渲染结果等价；
  `can(perm)` 保留不动；不新增依赖、不改门禁与 workflow

## Harness 链路

- Task ID：`2026-10-28-tenantlist-s3776-followup`
- Task Manifest：`.harness/tasks/2026-10-28-tenantlist-s3776-followup/manifest.json`
- Evidence：`.harness/evidence/2026-10-28-tenantlist-s3776-followup/commands.json`
- Verification evidence：`.harness/evidence/2026-10-28-tenantlist-s3776-followup/summary.md`
- Review Artifact：`.harness/evidence/2026-10-28-tenantlist-s3776-followup/review.md`
- OpenSpec change：none
- Trivial change：no
- Quality Profile：ui-runtime
- Ratchet Decision：guide-updated
- GitHub Signal：repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-10-28-tenantlist-s3776-followup
- task manifest: .harness/tasks/2026-10-28-tenantlist-s3776-followup/manifest.json
- evidence: .harness/evidence/2026-10-28-tenantlist-s3776-followup/commands.json
- boundaries: 只动一个前端列表页的渲染函数与两处 harness 文档；未改 backend / workflow / sonar 配置 / 依赖
- backend response contract: not-applicable（无后端改动）
- backend DTO contract: not-applicable（无后端改动）
- permission contract: unchanged（`can(perm)` 及五个权限布尔保持 #463 合入后的取值）
- audit coverage: unchanged（无审计链路改动）
- visual evidence: not-applicable（四态元素、类名、i18n key 逐条不变，无样式或文案变化）
- inheritance contract: 未改 sharedPaths 或继承合同；`pantheon-ops` 无需动作
- base drift: 分支基于 `main` @ `1ae6481c`（PR #463 合并后的提交）
- Base/ops inheritance: 无同步要求；改动自包含于 base 前端

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

补充说明：改动落在 `platform` 层。路径上触及 `system/iam`（按 `repo-pr-gate` 口径属高风险范围），
但内容是一个组件内渲染分支的等价提取，不涉及权限判定、数据流或接口；另两处为 harness
规则与失败登记。

## 验证记录

- [x] 同规则复测（`eslint-plugin-sonarjs@3` 的 `sonarjs/cognitive-complexity`，临时目录在仓库外）
  - 阈值 15：`1ae6481c` 的 `TenantList.tsx` → `116:33` = **16**（与 SonarCloud 读数一致）
  - 阈值 15：`origin/main`（#463 之前）→ `116:33` = **16**（对照：`can(perm)` 无度量效果）
  - 阈值 15：改后文件 → **无 finding**，exit 0
  - 阈值 4：`1ae6481c` → 组件 16；改后 → 组件 **10**、`renderBody()` **5**
- [x] `cd frontend && npm run lint` → 干净
- [x] `cd frontend && npm run type-check` → 干净
- [x] `cd frontend && npm run build` → 成功（528ms）
- [x] `check:task-packet`、`check:structure`（0/2888）、`check:harness-encoding`（0/2540）、
  `check:docs-frontmatter`（393 docs / 275 带 frontmatter）→ 通过
- [x] `check:harness-docs`、`check:harness-inventory`、`check:ui-quality-gate` → 0 finding(s)
- [x] `node scripts/harness/check-failure-registry.mjs --strict` → 0 error / 0 warning
- [x] `node scripts/harness/check-evidence.mjs --strict`、`check-review.mjs --strict` → exit 0

## 审核留痕

- Copilot review：见 PR 机器人读数；本 PR 无需人工豁免
- CodeQL 结果：仅前端渲染函数重排与文档改动，预计无新增告警；以 PR checks 为准
- GitHub checks 结果：见 PR checks 读数（`PR Smoke Modules` 覆盖租户控制台页面）
- Auto-merge：disabled（路径口径属高风险，需两名非作者批准后由维护者合并）
- Duplication Gate 结果：提取的是既有分支与既有断言，无新增重复逻辑；以 PR checks 为准
- 是否高风险改动：是（按 `repo-pr-gate` 路径口径落在 `system/iam`；改动本身行为等价）
- Residual risk / follow-up：
  - SonarCloud issue 只在合并后下一次 `main` 分析时关闭；本地证据是“同一规则、同一文件”
    的读数（`main` 16、新文件 15 阈值下无告警）。
  - 仓库不依赖 `eslint-plugin-sonarjs`，§5.2 的复测是人工步骤；把插件纳入依赖并做成 CI
    步骤属于依赖与门禁策略决定，留给维护者。
  - 本包未做浏览器实跑：四态渲染面按构造等价，运行读数由 CI `PR Smoke Modules` 承担。

## 检查清单

- [x] 已明确本次改动归属 `platform`，未把系统域职责混写
- [x] 未改任何门禁规则、workflow、Sonar 配置，未使用 `NOSONAR` 或规则排除
- [x] 未删除任何分支、断言或测试用例：四态条件、元素、类名、i18n key、`onRetry` 逐条保留
- [x] 前端无新增展示文案，i18n 无变化
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰：权限判定表达式未动
- [x] 无数据库/迁移变更，schema 版本不变
- [x] 已确认不会泄露敏感配置、账号密码或 Token：diff 只含渲染函数、规则文字与登记行
- [x] 已把“未复测即宣告修复”的失败模式登记为 `FR-018` 并落到 §5.2 规则
