# 任务归档索引

**最后更新**: 2026-09-25

## 归档说明

已完成的任务按月归档到 `archive/{YYYY-MM}/` 目录，包含 `tasks/` 和 `evidence/` 两部分。

归档任务保留完整的：
- 任务定义文档 (task.md, manifest.json)
- 执行证据 (summary.md, review.md, commands.json)
- 相关产物和附件

## 归档统计

| 月份 | 任务数 | Evidence 数 | 关键轮次 |
|------|--------|-------------|----------|
| 2026-07 | 25 | 30 | V1.0 冻结与发布、Sonar 清零轮、安全审计 |
| 2026-08 | 23 | 23 | Foundation Release 体系建立、v0.10.x 系列发布 |
| 2026-09 | 24 | 23 | 命名与边界整改、企业级整改、治理收口 |
| **合计** | **72** | **76** | - |

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

`.harness/tasks/` 下剩余的任务为：
- 2026-09-08 系列总结文档 (P0/P1/P2 完成总结)
- 2026-09-10 租户演进任务 (tenant-* 系列，部分完成)
- 2026-09-03/04 设计对齐和版本准备的后续任务

这些任务要么是总结性文档，要么是尚在进行中的工作，暂不归档。

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
