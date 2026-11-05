# Pantheon Base Documentation Index

Current functionality/release closeout: [task](./harness/tasks/2026-11-05-base-freeze-release.task.md) · [validation evidence](../.harness/evidence/2026-11-05-base-freeze-release/summary.md). v0.18.3 is an unpublished candidate retaining tenant V1; official release and Ops consumption require successful gates.

Current global-audit baseline: [FULL audit](./reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-11-04_FULL.md), with [all document assets](./reviews/PANTHEON_BASE_GLOBAL_AUDIT_2026-11-04_ASSETS.md). Remediation state: [harness plan](../.harness/tasks/2026-11-04-global-audit-remediation/plan.md). The older same-date report remains historical; implementation does not itself declare a maintenance freeze.

Chinese version: [README.md](./README.md)

This file is the unified entry point for `pantheon-base/docs/`.

Its purpose is not to dump all historical material on the front page. It should help readers quickly decide:

- whether they need contracts, architecture/design docs, acceptance docs, or historical artifacts
- which documents are active long-term references
- which files are phase baselines, remediation materials, or historical examples

## Usage Principles

- the docs home should expose only documents with ongoing operational value
- phase evaluations, one-off acceptance outputs, and remediation examples should not be first-line entry points unless still referenced by current process or templates
- if a newer design, matrix, or baseline has replaced an older intermediate evaluation, the older draft should stop being a primary entry

## Recommended Reading Order

For Chinese-first onboarding, read:

1. [README.md](./README.md)
2. [../DESIGN.md](../DESIGN.md)
3. [../AGENTS.md](../AGENTS.md)
4. [harness/PANTHEON_BASE_DELIVERY_WORKFLOW.md](./harness/PANTHEON_BASE_DELIVERY_WORKFLOW.md)
5. [harness/AI_QUALITY_GOVERNANCE.md](./harness/AI_QUALITY_GOVERNANCE.md)
6. [contracts/DOCUMENT_GOVERNANCE_CONTRACT.md](./contracts/DOCUMENT_GOVERNANCE_CONTRACT.md)
7. [contracts/PLATFORM_CONTRACT.md](./contracts/PLATFORM_CONTRACT.md)
8. [designs/REPOSITORY_LAYOUT.en.md](./designs/REPOSITORY_LAYOUT.en.md)
9. [designs/BACKEND.md](./designs/BACKEND.md)
10. [designs/FRONTEND.md](./designs/FRONTEND.md)
11. [acceptances/ACCEPTANCE_CHECKLIST.md](./acceptances/ACCEPTANCE_CHECKLIST.md)
12. [acceptances/AGENT_EXECUTION_CHECKLIST.md](./acceptances/AGENT_EXECUTION_CHECKLIST.md)
13. [designs/README.md](./designs/README.md)

## Active Document Groups

### Root entry and governance

- [../DESIGN.md](../DESIGN.md)
- [../AGENTS.md](../AGENTS.md)
- [../.agents/skills/README.md](../.agents/skills/README.md)
- [contracts/DOCUMENT_GOVERNANCE_CONTRACT.md](./contracts/DOCUMENT_GOVERNANCE_CONTRACT.md)
- [contracts/DOCUMENT_METADATA_AND_STATUS.md](./contracts/DOCUMENT_METADATA_AND_STATUS.md)
- [contracts/DOCUMENT_FRONTMATTER_SCHEMA.md](./contracts/DOCUMENT_FRONTMATTER_SCHEMA.md)

### Core contracts

- [contracts/PLATFORM_CONTRACT.md](./contracts/PLATFORM_CONTRACT.md)
- [contracts/SYSTEM_AUTH_CONTRACT.md](./contracts/SYSTEM_AUTH_CONTRACT.md)
- [contracts/SYSTEM_IAM_CONTRACT.md](./contracts/SYSTEM_IAM_CONTRACT.md)
- [contracts/SYSTEM_ORG_CONTRACT.md](./contracts/SYSTEM_ORG_CONTRACT.md)
- [contracts/SYSTEM_CONFIG_CONTRACT.md](./contracts/SYSTEM_CONFIG_CONTRACT.md)

### Architecture and design

- [designs/README.md](./designs/README.md)
- [designs/REPOSITORY_LAYOUT.en.md](./designs/REPOSITORY_LAYOUT.en.md)
- [designs/PANTHEON_BASE_ARCHITECTURE_OVERVIEW.md](./designs/PANTHEON_BASE_ARCHITECTURE_OVERVIEW.md)
- [designs/BACKEND.md](./designs/BACKEND.md)
- [designs/FRONTEND.md](./designs/FRONTEND.md)
- [designs/FRONTEND_UI_SPEC.md](./designs/FRONTEND_UI_SPEC.md)
- [designs/PERMISSION_MODEL.md](./designs/PERMISSION_MODEL.md)
- [designs/DICT_AND_SETTING_DESIGN.md](./designs/DICT_AND_SETTING_DESIGN.md)
- [designs/WORKFLOW.md](./designs/WORKFLOW.md)
- [designs/QUALITY_AND_SECURITY_STRATEGY.md](./designs/QUALITY_AND_SECURITY_STRATEGY.md)

### Acceptance and delivery

- [Enterprise release readiness review (2026-10-07; current release decision, Chinese)](./reviews/ENTERPRISE_RELEASE_READINESS_REVIEW_2026-10-07.md)
- [Release readiness remediation task packet (2026-10-07; Chinese)](./harness/tasks/2026-10-07-release-readiness-remediation.task.md) — machine-readable tasks are under `../.harness/tasks/2026-10-07-*/manifest.json`
- [acceptances/ACCEPTANCE_CHECKLIST.md](./acceptances/ACCEPTANCE_CHECKLIST.md)
- [acceptances/AGENT_EXECUTION_CHECKLIST.md](./acceptances/AGENT_EXECUTION_CHECKLIST.md)
- [acceptances/TASK_PACKET_BASE_TEMPLATE.md](./acceptances/TASK_PACKET_BASE_TEMPLATE.md)
- [acceptances/BUSINESS_MODULE_ACCEPTANCE_MATRIX.md](./acceptances/BUSINESS_MODULE_ACCEPTANCE_MATRIX.md)
- [acceptances/CODE_REVIEW_STANDARD.md](./acceptances/CODE_REVIEW_STANDARD.md)
- [acceptances/SYSTEM_CONFIG_GOVERNANCE_ACCEPTANCE.md](./acceptances/SYSTEM_CONFIG_GOVERNANCE_ACCEPTANCE.md)
- [PANTHEON_BASE_DELIVERY_WORKFLOW.md](./harness/PANTHEON_BASE_DELIVERY_WORKFLOW.md)
- [GITHUB_GOVERNANCE_CHECKLIST.md](./GITHUB_GOVERNANCE_CHECKLIST.md)
- [GITHUB_REPOSITORY_SETUP.md](./GITHUB_REPOSITORY_SETUP.md)
- [AI_QUALITY_GOVERNANCE.md](./harness/AI_QUALITY_GOVERNANCE.md)
- [../SECURITY.md](../SECURITY.md): security reporting policy

### Operations and guides

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- [DEV_DB_INIT_GUIDE.md](./DEV_DB_INIT_GUIDE.md)
- [VERSION_MANAGEMENT_GUIDE.md](./VERSION_MANAGEMENT_GUIDE.md)
- [Release notes index (from v0.13.1)](./release-notes/README.en.md)
- [TENANT_INITIALIZATION_GUIDE.md](./TENANT_INITIALIZATION_GUIDE.md): tenant initialization
- [api/TENANT_API.md](./api/TENANT_API.md): tenant API
- [migrations/COMPAT_TO_MULTI_UPGRADE.md](./migrations/COMPAT_TO_MULTI_UPGRADE.md): compat to multi upgrade
- [contracts/TENANT_CONTRACT_V1.en.md](./contracts/TENANT_CONTRACT_V1.en.md): the authoritative tenant contract
- [Core testing and verification workflow](./harness/PANTHEON_BASE_DELIVERY_WORKFLOW.en.md)
- [testing-usage-guide.md](./testing-usage-guide.md)
- [testing-strategy-optimization.md](./testing-strategy-optimization.md)
- [testing-implementation-report.md](./testing-implementation-report.md)
- [HARNESS_GOVERNANCE_GUIDE.md](./HARNESS_GOVERNANCE_GUIDE.md)
- [harness-pr-generator-guide.md](./harness-pr-generator-guide.md)

Directory responsibilities: `docs/harness/` contains reviewable, versioned Harness methods, contracts, and task-packet specifications. `.harness/` contains machine-readable task state, execution evidence, and runtime artifacts. They are intentionally separate because the checkers and delivery workflow consume them independently.

## Notes

- documents with no reuse value, no linkage, and no baseline role should be deleted rather than archived
- the Chinese index remains the more detailed source for local working context
- seven dated tenant topical records (`docs/TENANT_*_2026-*.md`) are indexed only in the Chinese index, section 4.5. They are audit and decision evidence from 2026-09/10, not first-line entry points: their conclusions may already be superseded by the tenant contract and the current implementation
- the superseded security hardening plan is retained under `../archive/2026-08-security/`; current security status comes from task evidence and quality gates
