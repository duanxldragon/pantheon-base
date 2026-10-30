# 任务归档索引

**最后更新**: 2026-10-31

## 归档说明

已完成的任务按月归档到 `archive/{YYYY-MM}/` 目录，包含 `tasks/` 和 `evidence/` 两部分。

归档任务保留完整的：
- 任务定义文档 (task.md, manifest.json)
- 执行证据 (summary.md, review.md, commands.json)
- 相关产物和附件

## 归档统计

| 月份 | 任务数 | Evidence 数 | 关键轮次 |
|------|--------|-------------|----------|
| 2026-07 | 26 | 31 | V1.0 冻结与发布、Sonar 清零轮、安全审计 |
| 2026-08 | 23 | 23 | Foundation Release 体系建立、v0.10.x 系列发布 |
| 2026-09 | 72 | 70 | 命名与边界整改、企业级整改、治理收口、租户核心 |
| 2026-10 | 91 | 94 | 租户交付、v0.14.0–v0.18.1 发布、代码简化 S1–S4、传感器与工作流缺陷收口、SQL 字面量收敛与消费仓 runtime-acceptance 闭环 |
| **合计** | **212** | **218** | - |

统计口径：`archive/<YYYY-MM>/tasks/` 与 `archive/<YYYY-MM>/evidence/` 下的目录数。
月份取任务 ID 的 `YYYY-MM` 前缀，因此个别跨月任务按其开工月份归档。

## 2026-07：V1.0 发布与质量清零

### 关键任务

- **V1.0 里程碑**: v1-release-readiness, v1-leftovers, v090-module-rename, v090-govulncheck
- **Sonar 清零**: sonarcloud-remediation, base-freeze-sonar-control, sonar-* 系列 (8 个任务)
- **安全审计**: security-audit-governance-round, security-audit-ui-fixes, security-event-policy-i18n-header
- **基础设施**: infra-hardening-round, code-review-remediation, repo-deep-cleanup
- **前端改进**: frontend-unit-tests, profile-shell-fallback, search-toolbar-pilot/rollout

### 关键成果

- V1.0 产品里程碑达成 (2026-07-21)
- SonarCloud 从 812 个问题降至 128 个，BUG/VULN 双零
- Quality Gates 主分支绿灯
- CI/CD 管道标准化

## 2026-08：Foundation Release 与交付体系

### 关键任务

- **Foundation Release**: foundation-release-v0-10-12/13, foundation-release-repo-snapshot
- **版本发布**: base-v0-10-0-release-candidate, base-v0-10-1/2-release
- **交付认证**: delivery-certification, foundation-consumer-* 系列
- **安全加固**: base-security-dependencies, security-goroutine-hardening, shared-csrf-release
- **工作台设计**: base-operational-workbench-design (5 个设计包)
- **自动化**: pr-auto-merge-* 系列, dependabot-pr-governance

### 关键成果

- Foundation Release 模型建立，首个 v0.10.12 发布
- Consumer overlay 机制完成
- PR 自动化治理流程就位
- Smoke 测试契约闭环

## 2026-09：企业级整改与治理收口

### 关键任务

#### 命名与边界整改轮 (Wave 0-2, 6 个任务)
- naming-boundary-canonical-standard
- document-layout-inventory / document-relocation-and-archive
- layer-boundary-gate (auth 解耦，`pkg/contracts/authuser` 端口)
- generated-artifact-governance (生成器统一标记)
- frontend-style-naming-alignment

#### 企业级整改轮 (Wave 0-2, 6 个任务)
**Wave 0 - 安全边界 (P0)**:
- session-revocation-closure (统一撤销三路生效)
- tenant-public-settings-scope (租户隔离)
- upload-authorization-and-import-resources

**Wave 1 - 生产规模 (P1)**:
- export-and-session-pagination (10k 上限 + SQL 分页)
- request-path-maintenance (后台维护器 `pkg/maintenance`)

**Wave 2 - 门禁 (P1/P2)**:
- production-redis-and-security-gates (Redis fail-fast + govulncheck)

#### 治理收口系列
- governance-residual-closeout (fix-report 手工项关闭)
- dormant-governance-tests-and-status-vocabulary (tests/scripts 激活)
- fix-report-residual-closeout (生成器标记残余)
- ci-triage-338-fallout, legacy-packet-migration-and-config-integrity

#### 其他完成任务
- Core Smoke Tests 修复 (merged-packet-closeout, smoke-core-tenant-ci-gap)
- 设计对齐 (frontend-design-alignment-phase2)
- 性能基线 (bench-perf-smoke-summary-path, ci-bench-perf-smoke)
- 版本准备 (v0.11.1-release-preparation, readme-v011-*)

### 关键成果

- **命名与边界**: 6/6 任务完成，auth 模块解耦，边界门禁就位
- **企业级整改**: 6/6 任务完成，所有 P0/P1 安全边界和生产规模问题关闭
- **Race 检测**: 全模块 `-race` 验证通过 (MinGW-w64 GCC 16.2.0)
- **安全漏洞**: Go 1.26.6 修复 7 个 stdlib CVE，govulncheck 0 reachable vulnerabilities
- **门禁完整性**: Quality Gates + Security Gates 全绿，SonarCloud Release Gate 就位
- **Core Smoke**: 279 个用例全部通过，发现并修复 2 个产品 bug

## 当前活跃任务 (未归档)

`.harness/tasks/` 下只保留状态不是 `completed` 的 manifest：

本轮之后 `.harness/tasks/` 只剩本收口包自己（`2026-10-31-harness-archive-closeout-round2`），
它在收口 PR 合并后按同一入口归档。仍在途的还有评审中的 PR #478
（`2026-10-31-release-gate-checks-poll-resilience`），其 manifest 随该 PR 进入 `main` 后再收口。

归档后 `.harness/tasks/` 为空也属正常状态；`readTaskManifest` 会回退到
`archive/<YYYY-MM>/tasks/<task-id>/`，所以任务包、`Linkage` 与文档链接继续使用规范路径
`.harness/tasks/...` 与 `.harness/evidence/...`，不需要在归档后改写。

## 查看归档内容

```bash
# 查看特定月份的任务
ls .harness/archive/2026-07/tasks/

# 查看特定任务的证据
cat .harness/archive/2026-07/evidence/2026-07-21-v1-release-readiness/summary.md

# 统计归档数量
find .harness/archive -name "summary.md" | wc -l
```

## 归档恢复

如需恢复归档任务用于参考或重新执行：

```bash
# 复制特定任务回活跃目录（不是移动，保持归档不变）
cp -r .harness/archive/2026-07/tasks/2026-07-21-v1-release-readiness .harness/tasks/
cp -r .harness/archive/2026-07/evidence/2026-07-21-v1-release-readiness .harness/evidence/
```

## 相关文档

- [任务执行状态总览](./STATUS.md) - 当前活跃任务和完成状态
- [企业级整改计划](./ENTERPRISE_REMEDIATION_PLAN_2026-09-22.md) - Wave 0-2 完成
- [命名与边界整改计划](./NAMING_AND_BOUNDARIES_REMEDIATION_PLAN_2026-09-22.md) - 全部完成
- [Core Smoke 分诊](./CORE_SMOKE_TRIAGE.md) - 修复完成

---

## 2026-09-25 归档更新

**新增归档**: 43 个任务 (40 个 9月任务 + 3 个其他月任务)

### 9月归档详情 (总计 67 个)

之前: 24 个  
新增: 43 个  
合计: 67 个

#### 新增归档任务 (2026-09-25)

**9月1-7日** (11个):
- 2026-09-01-release-docs-reconciliation
- 2026-09-01-release-gate-sonar-cleanup
- 2026-09-01-sonar-duplication-reduction
- 2026-09-02-foundation-release-v0-10-26-and-ops-sync
- 2026-09-03-frontend-design-alignment
- 2026-09-03-frontend-design-alignment-phase2
- 2026-09-04-readme-v0.11.0-update
- 2026-09-04-readme-v011-final
- 2026-09-04-readme-v011-update
- 2026-09-04-v0.11.1-release-preparation
- 2026-09-07-core-smoke-followup

**9月8日 P0/P1/P2** (15个):
- 2026-09-08-p0-csp-hsts-implementation
- 2026-09-08-p0-license-declaration
- 2026-09-08-p0-security-gates-enforcement
- 2026-09-08-p1-csp-nonce-hardening
- 2026-09-08-p1-data-permission-integration
- 2026-09-08-p1-k8s-manifests
- 2026-09-08-p1-performance-baseline
- 2026-09-08-p1-sso-oidc-design
- 2026-09-08-p1-test-coverage-phase1
- 2026-09-08-p2-community-building
- 2026-09-08-p2-login-risk-control
- 2026-09-08-p2-multi-tenant-design
- 2026-09-08-p2-production-case-study
- 2026-09-08-p2-test-coverage-phase2
- 2026-09-08-p2-test-coverage-phase3

**9月9-10日** (14个):
- 2026-09-09-oidc-deps-ci-repair
- 2026-09-10-i18n-s3649-zero
- 2026-09-10-release-gate-repair
- 2026-09-10-release-gate-zero
- 2026-09-10-smoke-core-repair
- 2026-09-10-sonar-new-code-zero
- 2026-09-10-sonar-resolved-repair
- 2026-09-10-tenant-canary-slice
- 2026-09-10-tenant-contract-design
- 2026-09-10-tenant-core-auth-iam
- 2026-09-10-tenant-core-data-infrastructure
- 2026-09-10-tenant-migration-runbook
- 2026-09-10-tenant-ready-guardrails
- 2026-09-10-tenant-verification-and-gray

**其他归档到9月** (3个):
- maintenance-test-stability-2026-09-02
- sonarcloud-s4666
- test-suite-optimization

**归档到7月** (1个):
- ui-fix-20260727

### 总结性文档清理

移动 16 个 .md 文件到 `docs/history/2026-09/tasks-summaries/`:
- 2026-09-08-FINAL-SESSION-SUMMARY.md
- 2026-09-08-P1-COMPLETION-SUMMARY.md
- 2026-09-08-P1-FINAL-SUMMARY.md
- 2026-09-08-P2-FINAL-SUMMARY.md
- 2026-09-08-execution-report.md
- 2026-09-08-execution-summary-zh.md
- FINAL_PROJECT_SUMMARY.md
- PRODUCTION_READY_REPORT_20260921.md
- TASK_GENERATION_SUMMARY.md
- TASK_MASTER_PLAN.md
- TENANT_EVOLUTION_MASTER_PLAN_20260910.md
- TENANT_MIGRATION_EXECUTION_GUIDE.md
- TENANT_TASKS_COMPLETION_SUMMARY_ZH.md
- TENANT_TASKS_FINAL_EXECUTION_REPORT.md
- ULTIMATE_FINAL_SUMMARY.md
- README.md (tasks 目录下的)

### 最终统计

- **总归档任务**: 115 个 (72 + 43 = 115)
- **活跃任务**: 0 个 ✅
- **7月归档**: 26 个 (25 + 1)
- **8月归档**: 23 个
- **9月归档**: 66 个 (24 + 42)

**状态**: 所有已完成任务已归档，活跃任务清零 ✅

---

## 2026-10-29 归档更新

**新增归档**: 87 个 `completed` 任务（2026-09 月 5 个 + 2026-10 月 82 个），
同步移动 89 份证据（87 份任务证据中的 86 份 + 3 个无任务包的孤儿证据目录）。

### 本轮归档明细

| 月份 | 任务 | 证据 |
|------|------|------|
| 2026-09 | 5 | 4 |
| 2026-10 | 82 | 85（82 任务 + 3 孤儿） |

- 移动方式：`git mv`，保留全部历史；按月落到 `archive/<YYYY-MM>/{tasks,evidence}/<task-id>/`。
- `2026-09-29-ops-ssrf-protection-integration` 没有独立证据目录，其证据留在
  `pantheon-ops` 侧，本次只移动 manifest。
- 孤儿证据（无对应 manifest）：`2026-10-24-session-device-style`、
  `2026-10-24-tenant-login-recovery`、`2026-10-25-dual-mode-e2e-smoke`。

### 配套的门禁改动

归档把"规范路径"与"物理路径"彻底分开，因此三个消费方补上了档案回退：

- `scripts/task-manifest.mjs`：新增 `findArchivedReferencePath` / `resolveArchiveAwarePath`，
  同时覆盖 `tasks/` 与 `evidence/` 两类引用。
- `scripts/harness/check-task-packet.mjs`：`Review File` 与 `Contract Anchors` 的存在性
  检查改用上述解析器。`check:task-packet` 的警告从 42 条降到 14 条——降下来的 28 条是
  更早归档轮次遗留的假警告（指向已归档证据），剩下 14 条是真实缺口。
- `scripts/harness/check-doc-links.mjs`：文档里指向 `.harness/evidence/...` 的链接在目标
  已归档时仍然有效。

### 已知残余（刻意保留，未删除也未覆盖）

- `.harness/evidence/2026-09-10-tenant-verification-and-gray/artifacts/browser/` 两份
  png 是归档后才被 #427 重新写入旧路径的重复产物，与 `archive/2026-09/` 下的同名文件
  内容不同（尺寸 62609/39527 对 60379/39304）。覆盖会改写历史证据，删除会丢数据，
  因此原地保留待维护者决定。
- `.harness/evidence/2026-09-25-pr347-governance-body.md` 与
  `.harness/evidence/2026-09-27-v0130-pr-body.md` 是两份没有任务归属的散落 PR 正文，
  未被任何文档引用，同轮保留。

## 2026-10-30 归档更新

**新增归档**: 6 个 `completed` 任务（全部属 2026-10 月）。`.harness/tasks/` 现在只剩
`2026-10-29-v0180-simplification-release` 一个 `in-progress` manifest。

| task-id | 收口依据 |
|---------|----------|
| `2026-10-27-codebase-simplification-program` | 13 个波次全部合并，程序清单收口 |
| `2026-10-29-harness-task-archive` | 上一轮 87 个任务的 `git mv` 归档与档案回退门禁 |
| `2026-10-29-simplification-program-closeout` | 简化程序收尾评审与 residual risk 记录 |
| `2026-10-29-v0181-restore-request-guard` | PR #469 → v0.18.1 发布，消费者构建恢复 |
| `2026-10-30-menu-contract-inline-const` | PR #471（`03e13d48`）+ 记录 PR #472 |
| `2026-10-30-workflow-sonar-githubactions` | PR #473（`c1f0b1dd`），main Release Gate 回到 0 |

- 移动方式：`git mv`。manifest 落到 `archive/2026-10/tasks/<task-id>/`，证据落到
  `archive/2026-10/evidence/<task-id>/`（含
  `2026-10-29-v0181-restore-request-guard/notes/` 子目录），历史保留。
- 任务包正文仍在 `docs/harness/tasks/`：归档约定移动的是 manifest 与 evidence，
  `.task.md` 留在文档面，只在 frontmatter `status` 上标 `Archived`。
- 归档后继续用规范路径引用：`readTaskManifest` / `resolveArchiveAwarePath` 会回退到
  `archive/<YYYY-MM>/{tasks,evidence}/<task-id>/`，因此 `check:task-packet`、
  `check-evidence --strict`、`check-review --strict` 与文档链接在移动后仍全部通过。
- 刻意未移动的三项：`2026-10-29-v0180-simplification-release` 仍 `in-progress`；
  `.harness/evidence/2026-09-10-tenant-verification-and-gray/` 是归档后被 #427 重写进
  旧路径的重复产物；两份散落 PR 正文没有任务归属。三者与上一轮同样原地保留，
  等维护者决定。

## 2026-10-31 收口更新

上一轮（`2026-10-30-workflow-sonar-githubactions`）之后的第七个归档对象：

| task-id | 收口依据 |
|---------|----------|
| `2026-10-31-archive-closure-pr-governance` | PR #474 squash 到 `05ee0ec1`；main 七个作业全 success，`SonarCloud Gate` 读数 `Unprocessed SonarCloud issues: 0`，独立 API 复核 total 0 且 gate OK |

- 这一轮是**自我指涉**的：被归档的任务修的正是「PR 治理传感器不认识月度归档路径」这条缺陷，
  而它的归档提交（`chore/harness-closeout-archive-closure`）继续用 canonical
  `.harness/tasks/<id>` 与 `.harness/evidence/<id>` 路径引用已移动的产物。
  `PR Governance Prereq` 检查通过即证明 `resolveArchiveAwarePath` 回退分支在生产门禁路径上生效，
  而不只是被 `tests/scripts/check-pr-governance.test.mjs` 的两个新用例覆盖。
- 统计口径不变：`archive/<YYYY-MM>/{tasks,evidence}/` 的目录数。任务包正文仍留在
  `docs/harness/tasks/`，只在 frontmatter 标 `status: Archived`。
- 残差（已登记 FR-024，本轮不扩面）：`check-evidence.mjs --strict` 的默认 glob 只扫 live 树，
  归档后的 evidence 不再被它覆盖；消费方审计读数见 FR-024 的 Review Notes。

## 2026-10-31 收口更新（第二轮）

同一天内的第八、第九个归档对象（均为 `completed`，`git mv` 到 `archive/2026-10/{tasks,evidence}/`，
任务包正文仍留在 `docs/harness/tasks/` 并把 frontmatter 改为 `status: Archived`）：

| task-id | 收口依据 |
|---------|----------|
| `2026-10-31-base-menu-filter-sql-literal-convergence` | PR #477 squash 到 main `e17eaaa1`；底座该文件自锁定点起零变化，消费者 `check:shared-drift` 由 `FAIL 1 modified` 变 `OK 812 identical / 10 allowlisted / 0 modified`，ops 侧 `430a9f0c` 的同形修复已随之收敛 |
| `2026-10-29-v0180-simplification-release` | `pantheon-base-v0.18.0` 与 `pantheon-base-v0.18.1` 两个 tag 均已发布、各带 4 个 release 资产；`VERSION` = 0.18.1；最后一项「消费仓 runtime-acceptance」由 ops PR #164（`4e69224f`）关闭并由 #165（`9afabc2a`）在 ops main 复核，因此该 manifest 的 completionChecklist 全部为已完成事实 |

- 两条都是**由读数关闭**而非由叙述关闭：前者的判据是 drift 比对器在两侧仓库的同一份文件上给出
  0 modified，后者的判据是 tag/资产计数与消费者 main 的落地提交。
- 归档后继续用规范路径引用（`readTaskManifest` / `resolveArchiveAwarePath` 回退），因此
  `check:task-packet` 在移动后对两份已归档任务包正文仍给 `[PASS]`；manifest 的 `status`
  改为 `completed`，`linkage` 里的 `taskManifest` / `evidenceDir` 一字不改。
- 口径差异要点出来：`check-evidence.mjs --strict` 与 `check-review.mjs --strict` 只扫 live 树，
  本轮把最后两个带 `commands.json` 的证据目录归档后，它们当场报
  `No evidence command files found.` / `No review artifacts found.`（两条 `failed` 读数已记入
  本包 commands.json）。二者都不在 `check:*` 面与 CI 作业里，故不影响发布；本轮的处置是让
  收口包自带 live evidence 目录，使覆盖对象不归零，而不是改传感器或加豁免。是否给这两个
  传感器接 `archive/` 回退属治理脚本变更，归维护者判断。
- 在途的 PR #478（`2026-10-31-release-gate-checks-poll-resilience`）未被本轮代为归档：
  它尚未合并，提前判 `completed` 会让档案与事实脱钩；合并进 `main` 后按同一入口收口。
- 统计口径不变；`2026-10` 由 89/92 增至 91/94，合计由 210/216 增至 212/218。
- 仍未动的两项遗留（沿用上一轮的显式延期，不扩面）：`.harness/evidence/2026-09-10-tenant-verification-and-gray/`
  的重复产物归属，以及两份无任务归属的散落 PR 正文。
