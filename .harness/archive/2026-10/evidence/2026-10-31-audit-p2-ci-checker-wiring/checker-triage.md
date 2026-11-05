# Checker triage — 2026-10-31-audit-p2-ci-checker-wiring

11 个 `scripts/harness/check-*.mjs` 在改动前既没有 npm script 也没有 workflow。判据顺序是
**先看它现在会不会红，再看要不要接线**：一个永远绿的 checker 接上去只增加耗时，不增加保障；
一个红着又没人修的 checker 接上去就是把 main 变红。

正/负向读数见 `commands.json`。

| # | checker | 改前状态（`--root . --strict`） | 归宿 | 理由 |
|---|---|---|---|---|
| 1 | `check-evidence` | exit 0，9 个证据包 0 error | **接线** → `npm run check:harness-evidence`，`Docs Governance` | 证据包是每个任务包的交付凭证；格式坏了没有任何别的检查会发现 |
| 2 | `check-review` | exit 1，3 份 `review.md` 缺 `## Machine Readable` 块 | **接线**（先修数据）→ `npm run check:harness-review` | 强制 review 留下机读结论，否则“评审过”无法复核。三份 W3/W4/W5 review 已补块后转绿 |
| 3 | `check-runtime-evidence` | exit 1，1 条 warning（`2026-10-29-v0180-simplification-release` 标了 runtimeSensitive 但无运行读数且无 gap 说明） | **接线**（先修数据）→ `npm run check:harness-runtime-evidence` | 这正是“运行时证据”该拦的情形；补 `runtimeGap` 后转绿 |
| 4 | `check-audit-coverage` | exit 0，0 finding | **接线** → `npm run check:harness-audit-coverage` | 审计写路由覆盖率是管理面契约检查，属契约类 |
| 5 | `check-feature-ledger` | exit 0，0 finding（schema 0 / entry 0） | **接线** → `npm run check:harness-feature-ledger` | 功能账本与 schema 对账；当前账本为空仍须接线，否则账本一旦写入就无人校验 |
| 6 | `check-permission-contract` | exit 0，0 finding | **接线** → `npm run check:harness-permission-contract` | 直接对应 `SYSTEM_IAM_CONTRACT`，最容易“写了但从不跑” |
| 7 | `check-backend-dto-contract` | exit 0，0 finding | **接线** → `npm run check:backend-dto-contract` | 后端 DTO 与前端类型的契约面 |
| 8 | `check-backend-response-contract` | exit 0，2 warning | **接线** → `npm run check:backend-response-contract` | 响应信封契约；warning 不阻断（`--strict` 仍绿） |
| 9 | `check-graph-review` | exit 0，0 个带 `structuralScope` 的任务包 | **接线** → `npm run check:harness-graph-review` | 结构评审传感器：任务包一旦声明 `structuralScope`，它才会真正生效；接线是为了那一刻已经就位 |
| 10 | `check-inheritance-contract` | `--root .` exit 1（7 条：`docs/WORKSPACE_INHERITANCE.md`、`pantheon-ops/*` 不在 base 内）；`--root ..` exit 0 | **接线到 workspace 链路** → `npm run check:inheritance-contract`（`--root ..`），**不进** base PR 门禁 | 它是 workspace 级检查，在单仓 checkout 里必然误报；塞进 `Docs Governance` 会让每个 PR 变红 |
| 11 | `check-doc-frontmatter` | exit 0，0 error | **保留为 portable 镜象，不接线**（mirror-only） | 与 `scripts/frontmatter-check.mjs` 规则重叠，而 W5 已定后者为唯一实现；双跑会把同一条问题报两次，正是 W5 修掉的 spec-duplication |

删除 0 个 checker。因此不触发“减少门禁需 failure-registry 登记”的那道人工门；反过来，为
“checker 存在但不接线”这一失败模式新登记了 `FR-026`（gate-updated）。

## 分流原则

- **不进 `prebuild`**：`prebuild` 已有 12 条检查，再加 9 条会显著拖慢本地构建，开发者会用 `--ignore-scripts`
  绕过——那时门禁等于不存在。
- **进 `Docs Governance`**（`quality.yml`）：这 9 条都是秒级、纯静态的仓库治理检查，和该 job 现有 20 条同性质。
- **workspace-only**：`check-inheritance-contract` 需要同级 `pantheon-ops` 才是有效判据。

## 顺带修掉的数据缺口（不是放宽门禁)

- 三份 W3/W4/W5 `review.md` 补 `## Machine Readable` JSON 块（`verdict` / `structuralReview` / `linkage`）。
- `2026-10-29-v0180-simplification-release/commands.json` 补 `runtimeGap`：该包标了 `runtimeSensitive`
  但实际上只改版本元数据与发布说明，没有运行面读数可记——把这件事写下来，而不是让门禁把 warning 当噪声。
