---
title: Pantheon Base 全局审计整改 programme（9 个子包与 7 项冻结门槛）
doc_type: Remediation
layer: platform
status: Archived
depends_on_layers: []
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/harness/HARNESS_ENGINEERING_CONTRACT.md
  - docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-10-31.md
updated_at: 2026-10-31
---

# Task Packet: 2026-10-31-audit-remediation-programme

## Goal

把 `docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-10-31.md`（合并终版）的 **3 个 P1 + 18 个 P2**
拆成 9 个可独立评审的整改子包，规定依赖顺序、冻结门槛与明确不处理的项。

**programme 本身不改任何产品代码**：它只登记边界、顺序与判据。冻结判定只读 9 个 manifest 的
`status` 与各自 evidence，不用散文结论替代读数。

## Primary Layer

platform

## Dependency Layers

- `platform`（文档、治理、生成器、CI）
- `system/auth`（OIDC 决策包）
- `inheritance-sync`（跨仓文档清理与前端导出面变更）

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `governance-programme`
- Portable Failure Class: `audit-remediation-programme`
- Owner Layer: `foundation-source`
- Ratchet Decision: `gate-updated`
- Coverage Dimensions:
  - behaviour
  - maintainability
  - architecture-fitness
  - runtime-quality

交付层级：**L1**（治理编排，无运行面）。

## Contract Anchors

- `docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-10-31.md`：本 programme 的唯一问题来源与编号依据。
- `docs/contracts/PLATFORM_CONTRACT.md`：公共面变更要求。
- `docs/harness/HARNESS_ENGINEERING_CONTRACT.md`：子包必须满足的任务包与证据要求。

## Scope

### In

- 登记 9 个子包的任务文档与 manifest，并规定依赖顺序（见下表）。
- 冻结门槛：7 项全部满足，或剩余项被显式登记为“冻结后接受的 gap”。
- 把审计 §12.4 的“明确不建议处理”8 项写成 programme 级 `Out`。
- 维护一张“审计条目 → 子包”的着落表，确保 28 个条目无静默遗漏。

### Out

- 修改审计报告结论或证据。
- **P3（7 项：AUD-020/021/022/023/024/025/028）的实施**：只在子包内顺带处理，不单独立项。
- **删除 `pkg/security/ssrf`**：base 内 0 引用但下游 5 处引用，属 D 类为下游保留，明确不处理。
- 功能扩展、性能优化、UI 视觉改版、大组件拆分。
- 合并 `docs/harness` 与 `.harness`、删除历史评审报告。
- 切 foundation release、改 `VERSION` / `CHANGELOG`。

## 子包与依赖

| 顺序 | 子包 | 覆盖条目 | 依赖 | 阻断冻结 |
| --- | --- | --- | --- | --- |
| W1 | `2026-10-31-audit-p1-lowcode-generator-build` | AUD-001 | — | 是 |
| W2 | `2026-10-31-audit-p1-business-route-tenant-context` | AUD-002 | —（决策点） | 是 |
| W3 | `2026-10-31-audit-p1-entry-doc-truthfulness` | AUD-003/004/007/016/024 | W2（租户章内容依赖 W2 结论） | 是 |
| W4 | `2026-10-31-audit-p2-doc-lifecycle-archive` | AUD-006/011/017/018/019 | W3 | 是 |
| W5 | `2026-10-31-audit-p2-doc-metadata-and-index` | AUD-008/009/010 | W4 | 是 |
| W6 | `2026-10-31-audit-p2-dead-code-legacy-surface` | AUD-012/013/014/020 | W1（生成器修好后才删 scaffold 死函数） | 是 |
| W7 | `2026-10-31-audit-p2-token-cache-race` | AUD-026 | — | 是 |
| W8 | `2026-10-31-audit-p2-ci-checker-wiring` | AUD-015/027 | W4、W5（文档类 checker 接线依赖归档与元数据结论） | 是 |
| W9 | `2026-10-31-audit-p2-oidc-scaffold-decision` | AUD-005 | —（维护者决策） | 否（可登记为 gap） |

依赖图（箭头表示“先于”）：

```
W1 ──► W6
W2 ──► W3 ──► W4 ──► W5 ──► W8
W7（独立）
W9（独立，不阻断）
```

## Expected Files

### Create

- `docs/harness/tasks/2026-10-31-audit-remediation-programme.task.md`
- `.harness/tasks/2026-10-31-audit-remediation-programme/manifest.json`
- 9 个子包的 `docs/harness/tasks/*.task.md` 与 `.harness/tasks/*/manifest.json`
- `.harness/evidence/2026-10-31-audit-remediation-programme/{commands.json,summary.md,review.md}`

### Modify

- 无（programme 不修改任何既有文件）

### Do Not Touch

- `backend/**`、`frontend/**`
- `.github/workflows/**`
- `backend/pkg/database/migrations/**`
- `docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-10-31.md`（问题来源，只读）
- `pantheon-ops/**`

## Implementation Notes

- 拆包单位是“一次可评审的 diff”，不是“一个发现一个包”：入口文档五条合为 W3，文档生命周期五条合为 W4。
- 每个子包都必须“修复 + 机械锁”，否则下一轮漂移会原样重现——W1 的编译校验、W5 的门禁覆盖、
  W8 的接线与负向验证都是这个道理。
- 依赖不是形式：W6 删 `scaffold.Generate` 必须等 W1 改完生成器，否则同一区域两次改动会互相覆盖。
- W2 与 W3 的分工必须守住：W2 决定“租户语义是什么”，W3 负责把 README/DESIGN 写成那个结论。
  两包各改一遍同一段就是重复劳动。
- 冻结判定不读散文：只看 9 个 manifest 的 `status` 与 evidence 里的读数。

## Verification Plan

- `node scripts/harness/check-task-packet.mjs --root .`
- `npm run check:task-packet-template`
- `npm run check:docs-frontmatter`
- `node scripts/harness/check-doc-links.mjs --root . --strict`
- `node scripts/harness/check-doc-inventory.mjs --root . --strict`
- 逐个 `JSON.parse` 9 个子包 manifest
- 着落表自检：审计 28 条 → 9 个子包 + Out + gap，逐条可追

## Linkage

- Task ID: `2026-10-31-audit-remediation-programme`
- Task Manifest: `.harness/tasks/2026-10-31-audit-remediation-programme/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-10-31.md`、`docs/contracts/PLATFORM_CONTRACT.md`
- Evidence Directory: `.harness/evidence/2026-10-31-audit-remediation-programme/`
- Review File: `.harness/evidence/2026-10-31-audit-remediation-programme/review.md`

## Evidence Required

- `commands.json`：9 份任务包与 manifest 的门禁读数
- `summary.md`：子包清单、依赖图、7 项冻结门槛、不处理清单
- `review.md`：审计 28 条 → 子包的逐条着落表

## Human Gates

- W2（业务域租户语义 A/B/C）、W9（OIDC 去留）是不可逆或对外承诺类决策，必须维护者拍板。
- W6 的 legacy 端点下线与 W8 的 workflow 修改需两位非作者批准。
- 冻结宣告归维护者：programme 只提供门槛达成读数。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] 9 个子包全部登记且各自 manifest 通过校验
- [x] 审计 28 条每一条都能对应到子包 / 明确不处理 / 显式 gap
- [x] 未把 P3 观察项升级为独立任务

## Execution Result

**状态：completed（2026-11-01）。**
证据：`.harness/evidence/2026-10-31-audit-remediation-programme/`。

### 终态

9/9 子包 `completed`（W1–W9），7/7 冻结门槛达成，全量门禁 0 error
（`check-task-packet` 92 文件、`check-evidence --strict` 12 文件、`check-review --strict` 12 文件、
`check-doc-links --strict` 0 findings、`check-doc-inventory --strict` 0 findings、
`check-encoding --strict` 0 findings）。

### 28 条的着落

**23 条着落到子包 + 5 条未立项**，不是 28/28：

- 未立项的 5 条里，AUD-022（大组件）与 AUD-023（跨域依赖）是审计自己判定"不建议处理"；
- AUD-021（退役 `FilterPanel`）、AUD-025（Active 90 天复核规则）、AUD-028（未使用 `cancel`）
  仍为 open，均 P3、不阻断冻结。

着落表见 `review.md` §2，逐条可追。

### 收口复核推翻的一处

W6 的 `000031.down` 初版以"up/down/up 三步 exit 0"为判据，但回滚到 v30 的表多了一条
000024 早已删除的 `role_key` 全局唯一索引——回滚后两个租户不能再用同一个 `role_key`。
改用 `SHOW CREATE TABLE` 逐字节对比暴露，已修复并补回归用例。这条教训写进了 review.md：
**命令能跑通不等于结果是那个结果**。

### 未执行的动作

**进入维护冻结的宣告未执行**。按本包 `Human Gates`，冻结宣告归维护者；programme 只交付
9/9 与 7/7 的读数，不代替维护者拍板。
