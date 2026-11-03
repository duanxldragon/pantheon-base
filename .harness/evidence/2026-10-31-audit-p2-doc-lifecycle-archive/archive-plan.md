# Archive plan — 2026-10-31-audit-p2-doc-lifecycle-archive

判据是机械的，实现在 `scripts/harness/task-evidence-state.mjs`（门禁接线由 W8 负责）：

1. **证据存在**：`.harness/evidence/<task-id>/` 或 `.harness/archive/<YYYY-MM>/evidence/<task-id>/` 存在；
2. **有 summary**：该证据目录下有 `summary.md`；
3. **有完成读数**：manifest `status: completed`，或 `summary.md` 含结果类小标题（验证/结果/结论/Verification/Result…）。

三条同时满足才改 `Archived`；判据不足的一律保留原状态并给出原因码——**不猜完成**。
“改前 status”取自 `git show HEAD:` 的同名文件；HEAD 里没有的（本工作区新增包）直接标注。
flipped 清单见 `flipped-task-ids.txt`（含本包自身的任务文档：它在证据落盘后由 `Draft` 改 `Archived`）。

| taskId | 改前 status | 证据位置 | summary | 完成读数 | manifest | 本次处置 |
| --- | --- | --- | --- | --- | --- | --- |
| `2026-07-29-sonar-ts-final` | （无 frontmatter） | archived | yes | no | completed | 未改（文档无 frontmatter，状态无处落） |
| `2026-07-30-local-consolidation` | （无 frontmatter） | archived | yes | no | completed | 未改（文档无 frontmatter，状态无处落） |
| `2026-08-02-sonarcloud-open-issues` | Active | archived | yes | no | completed | `Active` → `Archived` |
| `2026-08-03-dependabot-pr-governance` | Active | archived | yes | no | completed | `Active` → `Archived` |
| `2026-08-03-sonarcloud-encoding-warning` | Active | archived | yes | no | completed | `Active` → `Archived` |
| `2026-08-04-base-v0-10-0-release-candidate` | Archived | archived | yes | no | completed | 已是 `Archived` |
| `2026-08-05-base-v0-10-1-release` | Active | archived | yes | no | completed | `Active` → `Archived` |
| `2026-08-05-base-v0-10-2-visual-checker` | Active | archived | yes | no | completed | `Active` → `Archived` |
| `2026-08-06-generator-business-page-route` | Active | archived | yes | no | completed | `Active` → `Archived` |
| `2026-08-10-shared-csrf-release` | Active | archived | yes | no | completed | `Active` → `Archived` |
| `2026-08-11-base-security-dependencies` | Archived | archived | yes | no | completed | 已是 `Archived` |
| `2026-08-11-delivery-certification` | Active | archived | yes | no | completed | `Active` → `Archived` |
| `2026-08-11-foundation-release-v0-10-12` | Active | archived | yes | no | completed | `Active` → `Archived` |
| `2026-08-11-foundation-release-v0-10-13` | Active | archived | yes | no | completed | `Active` → `Archived` |
| `2026-08-12-foundation-consumer-cleanup-overlay` | Active | archived | yes | no | completed | `Active` → `Archived` |
| `2026-08-12-foundation-consumer-runtime-portability` | Active | archived | yes | no | completed | `Active` → `Archived` |
| `2026-08-12-foundation-smoke-closure` | Active | archived | yes | no | completed | `Active` → `Archived` |
| `2026-08-12-foundation-smoke-contract-closure` | Active | archived | yes | no | completed | `Active` → `Archived` |
| `2026-08-12-pr-auto-merge-push-trigger` | Active | archived | yes | no | completed | `Active` → `Archived` |
| `2026-08-12-pr-auto-merge-token` | Active | archived | yes | no | completed | `Active` → `Archived` |
| `2026-08-13-foundation-release-repo-snapshot` | Active | archived | yes | no | completed | `Active` → `Archived` |
| `2026-08-17-foundation-cross-repo-handoff-adoption` | Active | archived | yes | yes | completed | `Active` → `Archived` |
| `2026-08-21-sonarcloud-remediation` | （无 frontmatter） | archived | yes | yes | completed | 未改（文档无 frontmatter，状态无处落） |
| `2026-08-31-base-operational-workbench-design` | Active | archived | yes | yes | completed | `Active` → `Archived` |
| `2026-09-01-release-docs-reconciliation` | （无 frontmatter） | archived | yes | no | completed | 未改（文档无 frontmatter，状态无处落） |
| `2026-09-01-release-gate-sonar-cleanup` | （无 frontmatter） | archived | yes | yes | completed | 未改（文档无 frontmatter，状态无处落） |
| `2026-09-01-sonar-duplication-reduction` | Active | archived | yes | no | completed | `Active` → `Archived` |
| `2026-09-02-foundation-release-v0-10-26-and-ops-sync` | （无 frontmatter） | archived | yes | no | completed | 未改（文档无 frontmatter，状态无处落） |
| `2026-09-29-v0140-release-completion` | （无 frontmatter） | archived | yes | yes | completed | 未改（文档无 frontmatter，状态无处落） |
| `2026-10-07-release-readiness-remediation` | Active | archived | yes | no | completed | `Active` → `Archived` |
| `2026-10-11-smoke-test-tiering` | Active | archived | yes | yes | completed | `Active` → `Archived` |
| `2026-10-11-sonar-smoke-helper-smells` | Active | archived | yes | no | completed | `Active` → `Archived` |
| `2026-10-12-flake-signal-remediation` | Active | archived | yes | no | completed | `Active` → `Archived` |
| `2026-10-12-foundation-release-asset-gate` | Active | archived | yes | yes | completed | `Active` → `Archived` |
| `2026-10-12-v0160-release-closeout` | Active | archived | yes | no | completed | `Active` → `Archived` |
| `2026-10-12-v0161-release-cut` | Active | archived | yes | no | completed | `Active` → `Archived` |
| `2026-10-13-tenant-console-remediation` | Active | archived | yes | yes | completed | `Active` → `Archived` |
| `2026-10-13-tenant-true-isolation` | Active | archived | yes | yes | completed | `Active` → `Archived` |
| `2026-10-19-tenant-permission-isolation-remediation` | Active | archived | yes | no | completed | `Active` → `Archived` |
| `2026-10-20-sonarcloud-zero-issues` | Active | archived | yes | no | completed | `Active` → `Archived` |
| `2026-10-20-tenant-audit-permission-seed` | Active | archived | yes | no | completed | `Active` → `Archived` |
| `2026-10-20-tenant-delivery-hardening` | Active | archived | yes | no | completed | `Active` → `Archived` |
| `2026-10-21-acceptance-remediation` | Active | archived | yes | no | completed | `Active` → `Archived` |
| `2026-10-21-v0170-release-cut` | Active | archived | yes | yes | completed | `Active` → `Archived` |
| `2026-10-22-delivery-audit-remediation` | Active | archived | yes | no | completed | `Active` → `Archived` |
| `2026-10-22-release-and-residual-closeout` | Active | archived | yes | no | completed | `Active` → `Archived` |
| `2026-10-22-tenant-plan-entitlements-and-audit` | Active | archived | yes | no | completed | `Active` → `Archived` |
| `2026-10-22-v0171-release-closeout` | Active | archived | yes | yes | completed | `Active` → `Archived` |
| `2026-10-23-iam-race-closeout` | Active | archived | yes | yes | completed | `Active` → `Archived` |
| `2026-10-23-iam-residual-closeout` | Active | archived | yes | yes | completed | `Active` → `Archived` |
| `2026-10-23-residual-closeout` | Active | archived | yes | yes | completed | `Active` → `Archived` |
| `2026-10-23-v0173-release-closeout` | Active | archived | yes | yes | completed | `Active` → `Archived` |
| `2026-10-23-v0174-release-closeout` | Active | archived | yes | yes | completed | `Active` → `Archived` |
| `2026-10-24-single-tenant-scope-closeout` | Active | archived | yes | yes | completed | `Active` → `Archived` |
| `2026-10-24-v0175-release-closeout` | Active | archived | yes | yes | completed | `Active` → `Archived` |
| `2026-10-26-governance-evidence-schema-backfill` | Active | archived | yes | yes | completed | `Active` → `Archived` |
| `2026-10-26-governance-red-checkers-closure` | Active | archived | yes | yes | completed | `Active` → `Archived` |
| `2026-10-26-login-accessibility-and-lang` | Active | archived | yes | no | completed | `Active` → `Archived` |
| `2026-10-26-pr427-ci-gate-closure` | Active | archived | yes | yes | completed | `Active` → `Archived` |
| `2026-10-26-tenant-plan-assignment` | Active | archived | yes | no | completed | `Active` → `Archived` |
| `2026-10-27-base-docs-artifact-landing` | Active | archived | yes | yes | completed | `Active` → `Archived` |
| `2026-10-27-codebase-simplification-program` | Archived | archived | yes | yes | completed | 已是 `Archived` |
| `2026-10-27-s3-oidc-envelope` | Active | archived | yes | yes | completed | `Active` → `Archived` |
| `2026-10-27-s3-role-data-scope-model` | Active | archived | yes | yes | completed | `Active` → `Archived` |
| `2026-10-27-s3-tenant-scope-unification` | Active | archived | yes | yes | completed | `Active` → `Archived` |
| `2026-10-27-tenant-completeness-remediation` | Active | archived | yes | no | completed | `Active` → `Archived` |
| `2026-10-27-v0176-release-closeout` | Active | archived | yes | yes | completed | `Active` → `Archived` |
| `2026-10-27-v0177-lint-codeql-closure` | Active | archived | yes | no | completed | `Active` → `Archived` |
| `2026-10-27-v0178-dep-vuln-closure` | Active | archived | yes | no | completed | `Active` → `Archived` |
| `2026-10-28-plan-ladder-option-a-impl` | Active | archived | yes | no | completed | `Active` → `Archived` |
| `2026-10-28-release-gate-green` | Active | archived | yes | yes | completed | `Active` → `Archived` |
| `2026-10-28-release-notes-directory` | Active | archived | yes | yes | completed | `Active` → `Archived` |
| `2026-10-28-tenantlist-s3776-followup` | Active | archived | yes | yes | completed | `Active` → `Archived` |
| `2026-10-29-harness-task-archive` | Active | archived | yes | yes | completed | `Active` → `Archived` |
| `2026-10-29-simplification-program-closeout` | Active | archived | yes | no | completed | `Active` → `Archived` |
| `2026-10-29-v0180-simplification-release` | Active | live | yes | no | in-progress | 保留 `Active`（evidence-without-completion-readout） |
| `2026-10-29-v0181-restore-request-guard` | Archived | archived | yes | no | completed | 已是 `Archived` |
| `2026-10-30-menu-contract-inline-const` | Archived | archived | yes | no | completed | 已是 `Archived` |
| `2026-10-30-workflow-sonar-githubactions` | Archived | archived | yes | no | completed | 已是 `Archived` |
| `2026-10-31-archive-closure-pr-governance` | Archived | archived | yes | no | completed | 已是 `Archived` |
| `2026-10-31-audit-p1-business-route-tenant-context` | （HEAD 无此文件） | live | yes | no | completed | `（HEAD 无此文件）` → `Archived` |
| `2026-10-31-audit-p1-entry-doc-truthfulness` | （HEAD 无此文件） | live | yes | no | completed | `（HEAD 无此文件）` → `Archived` |
| `2026-10-31-audit-p1-lowcode-generator-build` | （HEAD 无此文件） | live | yes | no | completed | `（HEAD 无此文件）` → `Archived` |
| `2026-10-31-audit-p2-ci-checker-wiring` | Draft | missing | no | no | planned | 保留 `Draft`（no-evidence） |
| `2026-10-31-audit-p2-dead-code-legacy-surface` | Draft | missing | no | no | planned | 保留 `Draft`（no-evidence） |
| `2026-10-31-audit-p2-doc-lifecycle-archive` | （HEAD 无此文件） | live | yes | no | completed | `（HEAD 无此文件）` → `Archived` |
| `2026-10-31-audit-p2-doc-metadata-and-index` | Draft | missing | no | no | planned | 保留 `Draft`（no-evidence） |
| `2026-10-31-audit-p2-oidc-scaffold-decision` | （HEAD 无此文件） | live | yes | no | completed | `（HEAD 无此文件）` → `Archived` |
| `2026-10-31-audit-p2-token-cache-race` | Draft | missing | no | no | planned | 保留 `Draft`（no-evidence） |
| `2026-10-31-audit-remediation-programme` | Draft | missing | no | no | in-progress | 保留 `Draft`（no-evidence） |
| `2026-10-31-base-menu-filter-sql-literal-convergence` | Active | live | yes | no | in-progress | 保留 `Active`（evidence-without-completion-readout） |
| `2026-10-31-release-gate-checks-poll-resilience` | Active | live | yes | no | in-progress | 保留 `Active`（evidence-without-completion-readout） |

## 汇总

- 任务包文档总数：**92**
- 本包 `Active`/`Draft` → `Archived`：**70**（含本包自身）
- 原本已是 `Archived`：**7**
- 保留 `Active`：**3**（证据在，manifest 仍 `in-progress`）
- 保留 `Draft`：**5**（`planned`，无证据）
- 无 frontmatter、无法承载 status：**7**（legacy 任务包，移交 W5 元数据包）

