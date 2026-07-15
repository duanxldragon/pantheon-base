# Superpowers Legacy Linkage Audit

## Scope

All `docs/harness/tasks/*.task.md` files in `pantheon-base` that still contain `Superpowers Plan`.

## Inventory

Total files: 22

| File                                                                | Status          | Recommendation                                       |
| ------------------------------------------------------------------- | --------------- | ---------------------------------------------------- |
| `2026-05-18-pantheon-base-audit-and-qa.task.md`                     | legacy          | normalize to `Plan References: none`                 |
| `2026-06-03-main-sonar-batch-1-i18n-resource-dedup.task.md`         | legacy          | normalize to `Plan References: none`                 |
| `2026-06-03-main-sonar-batch-2-backend-i18n-coverage.task.md`       | legacy          | normalize to `Plan References: none`                 |
| `2026-06-03-main-sonar-remediation.task.md`                         | active plan ref | keep superpowers ref or migrate to `Plan References` |
| `2026-06-17-auth-platform-preference-boundary.task.md`              | legacy          | normalize to `Plan References: none`                 |
| `2026-06-17-permission-workbench-remediation-schema-compat.task.md` | legacy          | normalize to `Plan References: none`                 |
| `2026-06-18-auth-http-posture-and-github-feedback.task.md`          | active plan ref | keep superpowers ref or migrate to `Plan References` |
| `2026-06-18-branch-hygiene-fallback.task.md`                        | legacy          | normalize to `Plan References: none`                 |
| `2026-06-18-branch-hygiene-slash-path-fix.task.md`                  | legacy          | normalize to `Plan References: none`                 |
| `2026-06-18-pr-branch-cleanup-automation.task.md`                   | legacy          | normalize to `Plan References: none`                 |
| `2026-06-21-auth-service-split.task.md`                             | legacy          | normalize to `Plan References: none`                 |
| `2026-06-21-jwt-to-token-redis.task.md`                             | legacy          | normalize to `Plan References: none`                 |
| `2026-06-21-rate-limit-redis.task.md`                               | legacy          | normalize to `Plan References: none`                 |
| `2026-06-21-security-headers-csp-hsts.task.md`                      | legacy          | normalize to `Plan References: none`                 |
| `2026-06-21-typed-errors-and-context.task.md`                       | legacy          | normalize to `Plan References: none`                 |
| `2026-06-27-pantheon-harness-upstream-linkage.task.md`              | legacy          | normalize to `Plan References: none`                 |
| `2026-06-27-repository-layout-tidy.task.md`                         | legacy          | normalize to `Plan References: none`                 |
| `2026-07-03-codeql-alert-remediation.task.md`                       | legacy          | normalize to `Plan References: none`                 |
| `2026-07-08-base-upload-default-types-release-sync.task.md`         | legacy          | normalize to `Plan References: none`                 |
| `2026-07-10-p1-1-permission-anti-privilege-escalation.task.md`      | normalized      | already aligned                                      |
| `2026-07-10-p1-2-multi-instance-consistency.task.md`                | normalized      | already aligned                                      |
| `2026-07-10-p1-3-schema-single-source.task.md`                      | normalized      | already aligned                                      |

## Alignment Summary

- Normalized in this packet: 3
- Remaining legacy files: 19
- Active historical superpowers plan refs: 2

## Recommended Next Actions

1. Normalize remaining 19 legacy docs in a follow-up docs-governance task.
2. Decide whether to keep the 2 active historical superpowers refs as-is or migrate to `Plan References`.
3. Extend checker warning coverage for legacy `Superpowers Plan` keys.
