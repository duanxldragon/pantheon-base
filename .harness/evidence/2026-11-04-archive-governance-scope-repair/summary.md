# Summary — 2026-11-04-archive-governance-scope-repair

## 做了什么

`.harness/archive/<YYYY-MM>/{tasks,evidence}/…` 落地之后，三个 strict 门禁对归档树失明或误红。本包把作用域与判定改诚实，不改 gate 布线。

1. **发现范围**：`check-evidence`、`check-review`、`check-runtime-evidence` 都改为扫活树 `.harness/evidence/` 加逐月 `.harness/archive/<month>/evidence/`。此前 HEAD 版检查器只看活树，实测读数是 `1 file(s), 1 error(s)`（「No evidence command files found」）与 runtime 的 `0 file(s), 0 error(s), exit 0`——即 196 个归档证据产物在门禁视野外，且「零覆盖」表现为绿灯。现在扫到 216–218 个。
2. **代际作用域**（`check-evidence`）：结构 schema 只对 2026-10-26（FR-016 回填轮）之后的产物做强校验。更早产物缺 `commands[].status` / `cwd` / `agent` / `repo` / `linkage` / `knownGaps`，共 **205 条**，记录的是当轮执行事实，事后无法从本轮文字恢复；硬要求等于逼人造证据。这 205 条改为**读出、计数、打印**，报告首行新增 `Pre-2026-10-26 structural findings counted, not gated: 205 across 43 archived artifact(s)`。JSON 解析失败与文件缺失仍一律 gate。
3. **敏感度判定**（`check-runtime-evidence`）：`runtimeSensitive` 布尔是作者声明，优先（证据优先于任务包）；两边都没声明才回落 `verificationPlan.runtimeEvidence` 文本，并忽略 `not runtime-sensitive` / `none` 这类否定条目。旧规则「文本数组非空即敏感」产生 22 条误报（只读盘点、文档搬迁、CI 修复被标成运行时敏感）。
4. **planRefs 解析**（`check-evidence` / `check-review`）：与 `summaryFile` / `reviewFile` 一样走 `resolveArchiveAwarePath`，规范拼写指向已物理归档的文件不再误报缺失。
5. **具名豁免**：`config/review-loop-legacy-artifacts.json` 8 条、`config/runtime-evidence-legacy-artifacts.json` 2 条。按文件具名而非日期/路径整片放行；条目指向的产物消失即报错，豁免集只能缩小。
6. **同类第二实例 + 作用域成文**（收尾时新增）：`check-failure-registry.mjs` 的 `findRegistryTable` 遇空行即停，`FR-026` 行落在表外从未被校验（渲染成无表头孤立表）。修复只跨表内空行、遇正文停止，`tests/scripts/harness-check-failure-registry.test.mjs` 钉住两半；本轮同时把该类登记为 `FR-027`（method-health / static-sensor-gap / occurrences 2 / sensor-added / implemented），并把「检查器作用域」小节写进 `scripts/harness/README.md` 与 `README.zh.md`——包括本包承诺的回归防护：新证据必须写 `.harness/evidence/<id>/` 并随包归档，否则活树发现与包-证据一致性都会漏检该轮。

## 归档产物改了什么（全部可核验为纯追加/重指向）

- 30 个归档 `review.md` 追加 `## Machine Readable` 块：verdict 取该产物自己的散文（散文沉默的取其同包 `summary.md`），门禁未闭合的统一 `blocked`，不写 `approved`。每份 `git diff --numstat` 为 `21 0`、单 hunk。
- 6 处 `planRefs` 重指向现存路径：`docs/history/2026-09/tasks-summaries/TASK_MASTER_PLAN.md`、`…/TENANT_EVOLUTION_MASTER_PLAN_20260910.md`、`docs/reviews/TENANT_*_2026-10-15.md`（W4 文档迁移改址）。
- 2 个 2026-09-01 旧式块补齐合同要求的键（`verdict` / `reviewFile` / `changeRef: "none"` / `planRefs`），并在块下写明这是重述该产物自身的 `decision` / `status`，未增删任何结论。
- 2 份 `commands.json` 追加 `runtimeGap`（重述本轮 `knownGaps` 已有事实）；本轮 `2026-11-04-audit-freeze-preconditions/commands.json` 补 `knownGaps` 数组。
- 不可诚实修复的 2 份走豁免并写明原因：`2026-08-31-base-operational-workbench-design`（checks 是四个自由文本维度，不属于 cycle/hub/call-depth/sensitive-flow；verdict 是枚举外的复合词）、`2026-09-24-fix-report-residual-closeout`（其 `fix-report.md` 已被 `722fa9e1` 随 v0.14.0 发布删除）。

## 事实边界

- 本包**不**提交 2026-11-03/11-04 工作区整改本身，只是它的前置：strict 链绿了才能开 PR。
- 冻结宣告、GOV-08、`000031` 生产执行仍是维护者门禁，本包未动。
- 当前 `cd backend && go build ./... && go vet ./...` 红在**未跟踪**的 `backend/modules/business/aud001bcheck/`（并发 P3 收口 agent 的在途产物）。HEAD 上 build/vet 均 exit 0。本包不改 Go。
- 代际作用域、敏感度布尔优先、豁免集收缩这三条若要让维护者另行收紧，是门禁策略决定，不在本包内擅自改。

## 验证读数

见 `commands.json`：三条 strict 门禁 exit 0（收尾复跑读数 evidence 219 file(s) 0 error(s)、review 217 file(s) 0 error(s)、runtime 217 file(s) 0 error(s) 0 warning(s)，历史计数仍为 205/43）；登记表检查 27 行全部入扫描、exit 0；四条负向差分各自重新变红（删豁免集 → 2 warning；陈旧豁免条目 → stale error；阈值改 2020-01-01 → 205 error；planRefs 还原字面判定 → 5 error；还原旧敏感度 → 18 warning）；两组新增负向差分：`FR-026` / `FR-027` 行 Status 篡改成枚举外值时分别报 `Line 41` / `Line 42`（HEAD 版扫描器对同一副本报 0 error），新回归用例在 HEAD 检查器上失败、在修复后 3/3 通过；`frontmatter-check` exit 0；`frontend tsc -b` exit 0。
