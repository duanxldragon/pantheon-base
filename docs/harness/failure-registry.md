# Failure Registry

This registry turns repeated agent or process failures into concrete harness changes.

## Scope

- Repository: `pantheon-base`
- Owner: repository maintainer
- Review cadence: weekly during quality remediation, then after each release or repeated agent failure
- Last reviewed: 2026-06-08

## Registry

| Failure ID | Category | Example | Impact | Current Guide | Current Sensor | Current Gate | Detected By | Missed By | Recommended Harness Change | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| `FR-001` | method-health | The repository adopted the Harness method and seeded a failure registry. | Future repeated failures have a durable place to become guide, sensor, gate, or template changes. | `docs/harness/HARNESS_COVERAGE_MODEL.md` | `scripts/harness/check-failure-registry.mjs` | repository review | method adoption | none | no-action | implemented |
| `FR-002` | ci-signal-noise | PR quality work repeatedly chased broad smoke, workflow, and Sonar symptoms together. | Remediation time moved from code quality into CI stabilization and selector/fixture repair. | `docs/superpowers/specs/2026-06-06-github-quality-and-sonar-refactor-design.md` | `quality.yml`, `smoke-full.yml`, `sonar.yml` | `Quality Gates` | recent commit history and workflow review | previous seed registry | split PR-required smoke sanity from scheduled full smoke; keep Sonar auxiliary | in-progress |
| `FR-003` | static-sensor-gap | Sonar literal duplication and low-risk code-smell batches recurred across many commits. | AI output did not absorb maintainability constraints before CI/Sonar feedback. | `docs/remediations/MAIN_SONAR_REMEDIATION_RUNBOOK_20260603.md` | SonarCloud, `npm run check:duplication` | duplication gate | Sonar remediation commits | task packet profile | add `AI_QUALITY_GOVERNANCE.md` profiles and require ratchet decision in non-trivial tasks | in-progress |
| `FR-004` | security-boundary-gap | Auth, session, cookie, source-blocking, and permission mapping fixes appeared as repeated security-sensitive patches. | Security regressions can recur when generated code misses boundary-specific controls. | `SECURITY.md`, `docs/contracts/SYSTEM_AUTH_CONTRACT.md`, `docs/contracts/SYSTEM_IAM_CONTRACT.md` | CodeQL, backend tests, security workflow | `Security Gates` | security/auth commit history | generic implementation prompts | require `auth-security` or `permission-policy` profile for boundary changes | in-progress |
| `FR-005` | runtime-evidence-gap | Broad Playwright smoke was used as a main PR signal while full regression value belongs later. | Slow or flaky browser feedback can block unrelated quality work and hide true root cause. | `docs/harness/VERIFICATION_EVIDENCE_SPEC.md` | Playwright smoke suites | `Quality Gates` and `Full Smoke Suite` | smoke stabilization commits | CI signal placement rules | narrow PR smoke to sanity scope; schedule full smoke for nightly/release evidence | in-progress |
| `FR-006` | method-health-gap | Repeated failures existed in commits and sessions while this registry still reported none. | Lessons stayed in chat history and branch history instead of becoming reusable harness controls. | `docs/harness/FAILURE_RATCHET_POLICY.md` | `scripts/harness/check-failure-registry.mjs` | repository review | this governance review | previous method-health checks | require registry update or explicit `no-repeat-observed` decision for non-trivial quality/security tasks | in-progress |

## Review Notes

- Repeated failures: CI signal noise, Sonar maintainability debt, security boundary drift, smoke scope drift, and unrecorded ratchet events are now tracked.
- Sensors with false positives: broad smoke can over-block unrelated PRs when used as a main quality gate.
- Sensors with known false negatives: task packets did not force a ratchet decision for repeated failures.
- Rules to remove or downgrade: duplicate CodeQL execution in quality and security workflows should be removed.
- Next harness changes: add or strengthen deterministic sensors for the highest-recurrence rows instead of adding more prose-only guidance.
