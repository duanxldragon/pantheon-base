# AI Quality Governance

This document applies the portable Harness Engineering method to `pantheon-base`.

`pantheon-base` is an admin-platform consumer of the method. The reusable method belongs in `../harness-engineering/agentic-method-kit/`. This file only defines controls that depend on the current business architecture, repository layout, and CI stack.

## 1. Boundary

Portable across projects:

- task packet lifecycle
- evidence and review artifact shape
- failure ratchet rules
- guide, sensor, state, gate, template, adapter vocabulary
- multi-agent handoff expectations

Specific to `pantheon-base`:

- system module contracts
- auth, IAM, config, org, i18n, generator, and dynamic module quality profiles
- GitHub Actions topology
- SonarCloud project scope
- Playwright smoke route selection
- base-to-ops inheritance constraints

Do not promote `pantheon-base` module details into the portable method unless the same failure appears in another unrelated repository template.

## 2. Quality Profiles

Every non-trivial task should choose one primary profile. Multiple profiles are allowed when a task crosses boundaries.

| Profile | Applies To | Required Guides | Required Sensors | Evidence |
|---|---|---|---|---|
| `auth-security` | login, session, MFA, JWT, cookies, CSRF, lockout | `docs/contracts/SYSTEM_AUTH_CONTRACT.md`, `SECURITY.md` | backend tests, security review, CodeQL/security gate when applicable | command summary plus security boundary note |
| `permission-policy` | IAM policy, menu policy, role/user/dept/post permissions | `docs/contracts/SYSTEM_IAM_CONTRACT.md`, `docs/designs/PERMISSION_MODEL.md` | policy mapping tests, backend tests, focused smoke if UI permissions changed | before/after policy mapping or route authorization note |
| `i18n` | locale resources, hardcoded text, generated i18n scope | `docs/designs/I18N_MODULE_DESIGN.md`, frontend i18n scripts | i18n hardcode check, generated-scope check, relevant backend tests | locale key/resource summary |
| `ui-runtime` | user-facing pages, layout, forms, tables, dashboards | UI design docs and acceptance docs | frontend lint/build, focused Playwright smoke, rendered evidence when visual behavior changed | screenshot or explicit no-UI-change statement |
| `generator` | low-code generator, dynamic modules, scaffolded modules | generator and dynamic module design docs | generator contract tests, generated-module cleanup check, smoke if runtime module path changed | generated diff and cleanup result |
| `ci-workflow` | GitHub Actions, Sonar, security, duplication, smoke topology | `docs/designs/QUALITY_AND_SECURITY_STRATEGY.md`, `docs/GITHUB_GOVERNANCE_CHECKLIST.md` | workflow posture, YAML inspection, affected workflow run when available | workflow intent and gate classification |

## 3. Required Task Packet Addendum

For non-trivial work, add this block to the task packet or implementation note:

```text
Quality Profile:
Portable Failure Class:
Owner Layer:
Consumer-Specific Controls:
Required Sensors:
Required Evidence:
Ratchet Decision:
Delivery Governance:
GitHub Signal:
Deferred Code Issues:
```

`Ratchet Decision` must be one of:

- `no-repeat-observed`
- `guide-updated`
- `sensor-added`
- `gate-updated`
- `template-updated`
- `adapter-updated`
- `registry-only`

## 4. CI Signal Placement

Use fast and deterministic signals in PR required checks.

PR required:

- docs governance
- frontend contract, lint, build
- backend tests
- duplication gate
- smoke sanity
- security gates

Auxiliary or scheduled:

- SonarCloud auxiliary scan
- full smoke suite
- deep dependency audit
- broad ecosystem drift checks

Rules:

- Sonar is a trend and debt dashboard, not the only merge gate.
- Full smoke is valuable but should not block every ordinary PR.
- Duplication must be visible in PR and merge queue checks, but the current full-repository baseline is enforced on protected-branch push or manual quality review until a new-code duplication gate exists.
- CodeQL should have one primary execution path in the security workflow.
- A slow or flaky sensor must either be narrowed, moved later, or made advisory until it is reliable.

## 5. Ratchet Operating Rule

When a failure recurs:

1. Add or update a row in `docs/harness/failure-registry.md`.
2. Decide whether the owner layer is portable method, consumer template, consumer repository, or agent adapter.
3. Promote the smallest useful control.
4. Measure recurrence in the next two weeks or next three related tasks.

If the same pattern reaches human review three times and no control was promoted, the harness work is incomplete even if the code patch passed CI.

## 6. Metrics

Track weekly:

- AI first-pass local gate success rate
- repeated failure recurrence rate
- PR quality gate P50 and P95 duration
- manual remediation hours spent on CI/Sonar/security issues
- new-code Sonar issues
- new-code duplication
- new-code backend coverage for included modules
- sensor false positive and false negative counts
- percentage of repeated failures with a ratchet decision
