# Summary — 2026-11-03-audit-remediation-programme

审计最终版（`docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-11-03.md`）§12「应该处理」清单的
P1×2 + P2×6 全部着落到子包并收口。programme 自身不改产品代码。

## 子包清单与覆盖表

| 波次 | 子包 | 审计项 | 状态 | evidence |
|---|---|---|---|---|
| W1 | `2026-11-03-audit-p1-pagination-data-consistency` | FE-01 / FE-02 | completed | `.harness/evidence/2026-11-03-audit-p1-pagination-data-consistency/` |
| W2 | `2026-11-03-audit-p2-governance-wiring-closeout` | GOV-01 / GOV-02 / GOV-03 / BE-02 | completed | `.harness/evidence/2026-11-03-audit-p2-governance-wiring-closeout/` |
| W3 | `2026-11-03-audit-p2-doc-drift-closeout` | DOC-01 / DOC-02 / GOV-06 / GOV-07 | completed | `.harness/evidence/2026-11-03-audit-p2-doc-drift-closeout/` |
| W4 | `2026-11-03-audit-p2-route-groups-unify` | ARCH-01 | completed | `.harness/evidence/2026-11-03-audit-p2-route-groups-unify/` |
| W5 | `2026-11-03-audit-p2-data-scope-automigrate` | DB-01 | completed | `.harness/evidence/2026-11-03-audit-p2-data-scope-automigrate/` |

依赖图：5 个包互相独立（`dependsOn: []`），可并行；W1 是冻结前必做（`blockingFreeze: true`），
其余 `blockingFreeze: false`。执行顺序为 W1 → W5 → W4 → W2 → W3（按可验证性由强到弱排）。

## 各包一句话结论

- **W1**：前端 `pageSize 9999/1000` 全部改为按 cap=100 分页聚合；后端契约零改动。
- **W2**：两个零引用 checker 接线、一个工具收编；新增 `check-checker-wiring.mjs` 让「写了但没跑」变红；
  FR-016/017 登记表由 `open` 校正为 `implemented`。
- **W3**：CONTRIBUTING 的版本号改为指向机器源、`--migrate` 与 `npm test` 改为真实命令；两份 PR 指南合并为一份。
- **W4**：15 条手写中间件链收敛到 `contracts.System*Group`；链断言 + 源码 ratchet 双层防漂移。
- **W5**：`system_role_data_scope` 的运行时 AutoMigrate 移除，迁移链成为唯一权威；三方形状断言钉死。

## 不处理清单（与审计裁决一致）

- P3 全部（FE-06…FE-14、GOV-09/10/11、DOC-03、BE-01）与 GOV-04/05：审计判「可以优化」，不立项。
- GOV-08（前端覆盖率阈值）：需维护者一句话决策，登记为 human gate。
- 维护者动作：冻结宣告签署、`000031` 生产执行时点、legacy 认证端点 2026-12-31 下线。
- 删除 `pkg/security/ssrf`（ops 5 处引用）、合并 `docs/history` 与 `docs/reviews`、切 foundation release、改 VERSION/CHANGELOG。

## 门禁读数（2026-11-04）

`check-task-packet` exit 0（5 packet PASS）；`check-evidence --strict` / `check-review --strict` exit 0；
`check-checker-wiring` 32/31/1/0；`check-doc-links --strict` 0 finding；6 份 manifest JSON.parse 通过；
`go build` / `go vet` exit 0、`go test ./... -short` 47 ok / 0 FAIL。
