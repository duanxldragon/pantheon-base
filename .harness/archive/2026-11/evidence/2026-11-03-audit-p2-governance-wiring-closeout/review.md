# Review — 2026-11-03-audit-p2-governance-wiring-closeout

## 逐条核对

| Reviewer posture | 结论 |
|---|---|
| 三个零引用脚本是否各自落入「接线 / 收编 / 删除+登记」三选一 | 是。两个 checker 接线（实测绿后接线，不是接线后再修），一个工具收编进 `scripts/harness/` |
| 是否有静默删除 | 没有。本包一行脚本实现都没有删；`migrate-task-manifests.mjs` 是移动 + 修导入，`git status` 可见重命名 |
| failure-registry 是否与实测一致 | 是。FR-016/FR-017 的 Current Gate 现在写的是真实存在的 npm script 与 workflow 步骤；`check-failure-registry --strict` 通过 |
| 新 checker 是否负向验证过会红 | 是，在 `tests/scripts/harness-check-checker-wiring.test.mjs` 里：临时树放死 checker → exit 1 并点名；写进 package.json → exit 0 |
| 有没有顺手改别的治理规则 | 没有。未改 `check-task-packet.mjs`、未改例外判定之外的任何 checker、未动 docs/reviews |
| blocking 提升是否经授权 | 是。维护者 2026-11-04 指令要求提升并验证会红；三个步骤已去掉 `continue-on-error`，README / failure-registry / evidence 同步改为 blocking 表述 |
| 提升后的步骤真的会红吗 | 会，且已实测：`check-checker-wiring` 构造未接线文件 → exit 1；`check-security-patterns` 构造一条不在基线的 `db.Exec(` 生产命中 → exit 1 并点名文件；存量 46 条 → exit 0（`accepted by baseline`） |
| 是否顺手改了检查器的判定阈值 | 否。只改「执行失败」的处置（吞掉 → exit 2），匹配阈值、错误/警告分级与 findings 输出均未动 |

## 反向检查（防「接线」变成空转）

- 新 checker 若把所有 checker 都判绿，等于没有观测力。单测因此在**同一个临时树**里
  同时放置 wired / in-workflow / unwired / excepted 四类文件，断言计数为 `2 wired / 1 exception / 1 unwired`，
  防止实现退化成「永远 0 unwired」。
- 例外表只有一条且带理由。新增例外必须在两处同时出现（脚本 + README 表），否则 review 会打回。

## Machine Readable

```json
{
  "taskId": "2026-11-03-audit-p2-governance-wiring-closeout",
  "verdict": "approved",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-11-03-audit-p2-governance-wiring-closeout/manifest.json",
    "evidenceDir": ".harness/evidence/2026-11-03-audit-p2-governance-wiring-closeout/",
    "evidence": ".harness/evidence/2026-11-03-audit-p2-governance-wiring-closeout/commands.json",
    "reviewFile": ".harness/evidence/2026-11-03-audit-p2-governance-wiring-closeout/review.md",
    "changeRef": "none",
    "planRefs": ["docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-11-03.md"]
  },
  "openDeviations": [
    "`config/security-pattern-baseline.json` 接受 46 条生产存量（Raw(/Exec(），只保证不再新增，未逐条判定安全性；reviewBy 2027-02-02。",
    "SQL 注入规则排除 `_test.go`（310 条夹具命中不设防）；UI 的 6 条 Modal 警告不阻断。",
    "三个 blocking 步骤尚未在托管 runner 上跑过真实执行；Ensure ripgrep 步骤已随 Node 扫描替换下线。",
    "migrate-task-manifests.mjs 移动后未执行 --write（会改写历史 manifest），其行为等价性只由导入路径修正与 dry-run 入口保证。"
  ]
}
```
