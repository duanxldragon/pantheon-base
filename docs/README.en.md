# Pantheon Base Documentation Index

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
4. [contracts/DOCUMENT_GOVERNANCE_CONTRACT.md](./contracts/DOCUMENT_GOVERNANCE_CONTRACT.md)
5. [contracts/PLATFORM_CONTRACT.md](./contracts/PLATFORM_CONTRACT.md)
6. [designs/BACKEND.md](./designs/BACKEND.md)
7. [designs/FRONTEND.md](./designs/FRONTEND.md)
8. [acceptances/ACCEPTANCE_CHECKLIST.md](./acceptances/ACCEPTANCE_CHECKLIST.md)
9. [designs/README.md](./designs/README.md)

## Active Document Groups

### Root entry and governance

- [../DESIGN.md](../DESIGN.md)
- [../AGENTS.md](../AGENTS.md)
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
- [designs/PANTHEON_BASE_ARCHITECTURE_OVERVIEW.md](./designs/PANTHEON_BASE_ARCHITECTURE_OVERVIEW.md)
- [designs/BACKEND.md](./designs/BACKEND.md)
- [designs/FRONTEND.md](./designs/FRONTEND.md)
- [designs/FRONTEND_UI_SPEC.md](./designs/FRONTEND_UI_SPEC.md)
- [designs/PERMISSION_MODEL.md](./designs/PERMISSION_MODEL.md)
- [designs/DICT_AND_SETTING_DESIGN.md](./designs/DICT_AND_SETTING_DESIGN.md)
- [designs/WORKFLOW.md](./designs/WORKFLOW.md)
- [designs/QUALITY_AND_SECURITY_STRATEGY.md](./designs/QUALITY_AND_SECURITY_STRATEGY.md)

### Acceptance and delivery

- [acceptances/ACCEPTANCE_CHECKLIST.md](./acceptances/ACCEPTANCE_CHECKLIST.md)
- [acceptances/TASK_PACKET_BASE_TEMPLATE.md](./acceptances/TASK_PACKET_BASE_TEMPLATE.md)
- [acceptances/BUSINESS_MODULE_ACCEPTANCE_MATRIX.md](./acceptances/BUSINESS_MODULE_ACCEPTANCE_MATRIX.md)
- [acceptances/CODE_REVIEW_STANDARD.md](./acceptances/CODE_REVIEW_STANDARD.md)
- [acceptances/SYSTEM_CONFIG_GOVERNANCE_ACCEPTANCE.md](./acceptances/SYSTEM_CONFIG_GOVERNANCE_ACCEPTANCE.md)
- [GITHUB_GOVERNANCE_CHECKLIST.md](./GITHUB_GOVERNANCE_CHECKLIST.md)
- [GITHUB_REPOSITORY_SETUP.md](./GITHUB_REPOSITORY_SETUP.md)
- [../SECURITY.md](../SECURITY.md): security reporting policy

### Historical and retained material

- `archive/examples/`: reusable real delivery examples
- `archive/baselines/`: older baselines still retained for comparison
- `archive/upgrade/`: upgrade and migration runbooks
- `assessments/`: assessment outputs that are not first-line entry docs
- `remediations/`: remediation plans and visual baselines

## Notes

- `docs/superpowers/specs/` should retain only adopted or still-referenced AI design anchors
- documents with no reuse value, no linkage, and no baseline role should be deleted rather than archived
- the Chinese index remains the more detailed source for local working context
