# Summary — 2026-10-31-audit-p2-ci-checker-wiring

## AUD-027：11 个 checker 的归宿

判据顺序是“先问它现在会不会红，再问要不要接线”。逐项表在 `checker-triage.md`，结论：

| 归宿 | 数量 | checker |
|---|---|---|
| 接线到 `Docs Governance`（`quality.yml`） | 9 | evidence、review、runtime-evidence、graph-review、audit-coverage、feature-ledger、permission-contract、backend-dto-contract、backend-response-contract |
| 接线到 workspace 链路（`--root ..`），不进 base PR 门禁 | 1 | inheritance-contract |
| 保留 portable 镜象，不接线 | 1 | doc-frontmatter |
| 删除 | 0 | — |

三个 checker 在体检时是红的，处置是**先修数据再接**，不是放宽门禁：

1. `check-review`：3 份 W3/W4/W5 `review.md` 缺 `## Machine Readable` 块 → 补齐（`verdict` +
   `structuralReview` + `linkage`），门禁转绿。
2. `check-runtime-evidence`：`2026-10-29-v0180-simplification-release` 标了 `runtimeSensitive` 但没有运行读数，
   也没写 gap → 补 `runtimeGap`：该包只改版本元数据与发布说明，没有运行面可测。写清事实，而不是让
   warning 长期存在被当噪声忽略。
3. `check-inheritance-contract`：`--root .` 必然失败（它要看 `pantheon-ops`），`--root ..` 通过 →
   归为 workspace 级，只留 npm script。

`doc-frontmatter` 不接线是 W5 的结论：字段定义只剩一处权威，`scripts/frontmatter-check.mjs` 是实现；
再接一个 portable 镜象进来，就是同一规则双跑，正是 W5 修掉的 spec-duplication。

## 为什么不全部塞进 prebuild

`prebuild` 已有 12 条检查。再加 9 条会影响每次本地构建，开发者会用 `--ignore-scripts` 绕开——
那时门禁比不接线更糟：它看起来存在，实际被跳过。所以这 9 条进 `quality.yml` 的 `Docs Governance`
（它们都是秒级静态检查，与该 job 现有 20 条同性质），workspace 级的 1 条只保留 npm script。

## AUD-015：race 只跑一次

原状：`ci.yml:167` 跑 `go test -race -short -coverprofile=...`，`quality.yml:384` 跑 `go test -race ./...`，
两者都在 `pull_request` 触发，后者是前者的超集。

处置：`ci.yml` 的步骤**去掉 `-race`**，保留 `-short` 与 `coverage.out`。这样：

- race 每 PR 从 2 次降到 1 次；
- `Upload Go coverage artifact` 仍有输入（任务包提示的“先确认 coverage 依赖”已确认，所以不是删步骤而是删 flag）；
- 全量 race 仍由合并门禁 `Test backend` 提供。

## W4 遗留：把人工判据变成门禁

W4 用 `task-evidence-state.mjs` 把 70 份任务包的状态与证据对齐，但当时只能人工跑。现在
`check-task-packet.mjs` 直接调用同一判据，两条硬约束：

- `status: Archived` 但找不到带 `summary.md` 的证据 → error；
- 证据已完成（manifest `completed` 或 summary 有完成读数）但状态没改 `Archived` → error。

负向验证：把 `2026-07-29-sonar-ts-final` 改回 `Active`，exit 1 并给出“证据已完成但状态是 Active”；
恢复后 92/92 PASS。这次是把“下次又漂移”从“靠人记得跑脚本”变成 CI 判据。

## 文档与登记

- `scripts/harness/README.md` 新增 “Wired checker scripts (2026-10-31)” 表：npm script ↔ checker ↔ 链路，
  并写明“新增 checker 必须同一个 diff 里接线”——这是本轮的根因约束。
- `docs/harness/failure-registry.md` 新增 `FR-026`（method-health / method-health-gap / `gate-updated`）：
  “checker 存在但不接线”这一失败模式在 FR-016/FR-017 之后又出现了一次，需要长期可查。

## 显式 gap

- 远端 workflow 未真实执行；负向验证在本地完成，PR 上需复核 9 个新步骤的表现。
- `.github/workflows/*` 的两位非作者批准属人工门，本包只落地改动。
- `check-graph-review` 在出现带 `structuralScope` 的任务包前不会产生判据（设计如此）。
- checker 的断言逻辑一行未改（任务包 `Out`），修的全是数据（review 块、runtimeGap 说明）。
