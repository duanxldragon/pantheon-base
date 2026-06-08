---
title: Deferred Code Backlog 2026-06-08
doc_type: Remediation
layer: platform
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-06-08
---

# Deferred Code Backlog 2026-06-08

This backlog records code-level follow-up discovered while improving the Harness method and process.

The current priority is method/process readiness. Do not let these items consume the method work unless they block method validation.

## Deferred Items

| ID | Symptom | Suspected Owner Layer | Recommended Profile | Required Verification | Follow-Up |
|---|---|---|---|---|---|
| `DCB-001` | `git diff --check` reports trailing whitespace in `backend/pkg/common/cookie.go`. | consumer-repository | `auth-security` | focused diff check plus relevant backend security tests if behavior changes | fix in a dedicated cleanup task, not in method work |
| `DCB-002` | `npm run check:docs-frontmatter` fails on existing archived release runbooks and a superpowers spec. | consumer-repository | `ci-workflow` | `npm run check:docs-frontmatter` | handle as document governance cleanup |
| `DCB-003` | Full GitHub Actions, Go test, and Playwright smoke were not run locally because the workspace contains broad unrelated dirty changes. | consumer-repository | `ci-workflow` | `Quality Gates`, `Security Gates`, and scheduled smoke/Sonar runs | run after workspace isolation or branch cleanup |

## Rule

When method/process work reveals production-code failures, classify and defer them unless:

- the failure blocks validation of the method artifact itself
- the failure is caused by the method artifact changed in the same task
- the user explicitly switches the task from method work to code remediation
