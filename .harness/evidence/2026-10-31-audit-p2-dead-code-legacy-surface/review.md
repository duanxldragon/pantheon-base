# Review — 2026-10-31-audit-p2-dead-code-legacy-surface

逐条对照 manifest `executionRoles.reviewerPosture`。

本文件在 W6 收口复核（2026-11-01）中重写过一次：第 3 条原先按“up/down/up 三步 exit 0”
判为通过，但“能往返”不等于“往返后形状正确”。复核用 `SHOW CREATE TABLE` 对照后
发现 000031.down 多建了一个索引，已在本次收口修复并补上回归用例。

## 1. 每项删除都有 base 全仓 + ops 前后端的检索输出 — ✅

- hooks：base `frontend/src` 零命中；ops 前端命中 6 行，全部是 ops 自有文件
  （`hooks/index.ts` 再导出与两 hook 定义本身），不引用 base 路径 → 跨仓无破坏。
- `scaffold.Generate`、`readRoleKeysFromContext`：base backend 零命中
  （复核时用 `scaffold\.Generate(` 精确匹配确认，`scaffold.GeneratedModuleRef` /
  `GenerateModuleFilesFromSchema` 等同类前缀不算命中）。
- ops backend 对本次删除物零引用（检索输出见 commands.json Q1–Q3）。

## 2. pkg/security/ssrf 未被删除，且记录了下游 5 处引用 — ✅

`grep -rn "security/ssrf" ../pantheon-ops/backend --include=*.go | wc -l` → **5**（5 条 import；
不限 `--include=*.go` 时另有 README 与二进制命中，故不加该过滤会读到 10），
写入 commands.json；summary.md 记录了 FR-021 同类风险与 D 类保留理由。
`git status` 中无 `backend/pkg/security/ssrf/**` 变更。

## 3. 000031 未改写历史迁移，up/down 可往返，down 数据承诺表述准确 — ⚠️ → ✅（收口时修复）

- 新增文件仅 `000031_drop_permission_role_data_scope_policy.{up,down}.sql`；
  `000001/000020/000024` 无改动 — ✅
- up/down/up 三步 exit 0 — ✅，但**这一步不足以下结论**（见下）。
- **复核发现的缺陷（已修）**：初版 down 从 000001 重建表后，又把 000024 引入的
  `uk_permission_role_data_scope_policy_tenant (tenant_id, role_key)` 与 000024 已
  **删除**的 `idx_permission_role_data_scope_policy_role_key (role_key)` 一起建了回来。
  后者使 `role_key` 重新变成全局唯一——一个 v30 从未有过的约束。回滚到 v30 后，
  多租户模式下两个租户用同一个 `role_key` 会被这条索引拒绝。
- 取证方式：把「空库直接迁移到 30」与「迁到 31 再回滚到 30」两张表的 `SHOW CREATE TABLE`
  逐字节对比，二者不等（输出见 commands.json Q10）。
- 修复：down 只重建 v30 真实形状（仅 `uk_...tenant`）；新增回归用例
  `TestDropPolicyTableDownReconstructsVersion30Shape`，并把同一断言在缺陷代码上跑过一次
  以证明它真的会红（负向验证见 commands.json Q12）。
- summary.md 的“down 只重建表结构，不承诺恢复数据……这不是可回滚”表述保留 — ✅，
  并补充了索引形状保真这一条。

## 4. legacy 端点处置有明确决策，CSRF 豁免与端点状态一致 — ✅

- 决策：保留 + Deprecated + 2026-12-31 下线（manifest 默认倾向，未越权直接下线）。
- `csrf_middleware.go` 两条精确豁免与 `/system/login|refresh` 两条现存路由一一对应；
  `casbin_middleware.go` 无 legacy 特例 case（login/refresh 在公开组，logout/user/info 走常规策略），
  故不存在“豁免无对应路由”或“case 无对应路由”的悬空状态；合同新章节把“下线日随路由一并移除”写成约束。
- 合同 zh §7.7 / en §7.6 已登记四个端点与维护者确认前置。

## 5. 前端删除后 npm run build 通过，而不是只跑 tsc — ✅

`npx tsc -b` 与完整 `npm run build`（含 prebuild 链）均 exit 0（✓ built）。

## 附加检查：同步关闭

- runbook 两份的死表引用已清（`grep permission_role_data_scope_policy docs/runbooks/` → none）。
- `tenantsizing/main.go` kept-global 注释已同步（表名移除 + 注明 000031）。
- 文档门禁：frontmatter-check / check-doc-links / check-task-packet 全绿。

## 遗留 human gates（未关闭，非本任务可自行关闭）

1. legacy 端点真正下线需维护者确认无外部集成方（2026-12-31 或之前）。
2. 死表 drop 不可逆：生产执行前需确认数据可丢弃并留导出；本地往返≠生产验证。
3. ops 仓自有 hook 副本的清理属 ops 侧任务，按 doNotTouch 不在本包处理。

## 收口复核的自我更正

初版 evidence 在 commands.json 里把 `check-evidence --strict` 记为 `passed`，但该文件当时
缺 `knownGaps`，strict 实际是 FAIL。这条已改为如实记录（FAIL → 补 knownGaps → PASS），
并把“用 exit 0 代替断言”的两处（迁移往返、evidence 自检）都换成了带判据的读数。

## Machine Readable

```json
{
  "taskId": "2026-10-31-audit-p2-dead-code-legacy-surface",
  "verdict": "approved with documented P2 follow-up",
  "verdictRationale": "Every deletion carries workspace-level search evidence rather than a repo-local one: the two frontend hooks have zero hits in base frontend/src and the six hits in pantheon-ops are ops-owned copies that import nothing from base, so the FR-021 failure mode (deleting a shared export that only a consumer still uses) is ruled out by reading rather than by hoping. pkg/security/ssrf is untouched and the five ops imports that justify keeping it are recorded. The migration is the one place this review did not accept the implementer's own reading: up/down/up exited 0, but the down file rebuilt the version-30 table with an extra role_key-only unique index that 000024 had deliberately dropped, so a rolled-back deployment would have rejected the same role_key in two tenants. Comparing SHOW CREATE TABLE between a schema migrated straight to 30 and a schema migrated to 31 and rolled back proved the mismatch byte for byte; the down file now rebuilds only uk_permission_role_data_scope_policy_tenant and TestDropPolicyTableDownReconstructsVersion30Shape pins it, and that test was run once against the defective file to show it fails. The legacy auth decision is the conservative one (keep, mark Deprecated, Sunset 2026-12-31) and the CSRF exemptions still match live routes, so no exemption is left dangling. Two things this review cannot close and does not pretend to: the real teardown of /system/{login,refresh,logout,user/info} needs the maintainer to confirm no external integrator, and the drop is irreversible so production needs an export first. The initial evidence also mislabelled its own strict-checker run as passing while the file was missing knownGaps; that is corrected here and both 'exit 0' claims were replaced with readings that carry a criterion.",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-31-audit-p2-dead-code-legacy-surface/manifest.json",
    "evidence": ".harness/evidence/2026-10-31-audit-p2-dead-code-legacy-surface/commands.json",
    "reviewFile": ".harness/evidence/2026-10-31-audit-p2-dead-code-legacy-surface/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-10-31.md",
      "docs/harness/AI_QUALITY_GOVERNANCE.md",
      "docs/contracts/SYSTEM_AUTH_CONTRACT.md"
    ]
  }
}
```
