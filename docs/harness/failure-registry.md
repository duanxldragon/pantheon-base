# Failure Registry

This registry turns repeated agent or process failures into concrete harness changes.

## Scope

- Repository: `pantheon-base`
- Owner: repository maintainer
- Review cadence: weekly during quality remediation, then after each release or repeated agent failure
- Last reviewed: 2026-06-08

## Registry

| Failure ID | Category | Failure Class | Owner Layer | Occurrences | Example | Impact | GitHub Signal | Current Guide | Current Sensor | Current Gate | Detected By | Missed By | Recommended Harness Change | Promotion Decision | Promotion Deadline | Status |
|---|---|---|---|---:|---|---|---|---|---|---|---|---|---|---|---|---|
| `FR-001` | method-health | method-health-gap | consumer-repository | 1 | The repository adopted the Harness method and seeded a failure registry. | Future repeated failures have a durable place to become guide, sensor, gate, or template changes. | method-gate | `docs/harness/HARNESS_COVERAGE_MODEL.md` | `scripts/harness/check-failure-registry.mjs` | repository review | method adoption | none | registry-only | registry-only | none | implemented |
| `FR-002` | runtime-quality | ci-signal-noise | consumer-repository | 3 | PR quality work repeatedly chased broad smoke, workflow, historical Sonar debt, and duplication symptoms together. | Remediation time moved from code quality into CI stabilization and selector or fixture repair. | repo-quality-gate | `docs/designs/QUALITY_AND_SECURITY_STRATEGY.md` | `.github/workflows/quality.yml` | `Quality Gates`, `Duplication Gate` | workflow review | previous required-check docs | gate | gate-updated | none | implemented |
| `FR-003` | maintainability | static-sensor-gap | consumer-template | 3 | Historical Sonar duplication and low-risk code-smell batches recurred across many commits before the GitHub-native gate migration. | AI output did not absorb maintainability constraints before CI feedback or independent review. | repo-quality-gate | `docs/remediations/MAIN_SONAR_REMEDIATION_RUNBOOK_20260603.md` | `npm run check:duplication`, review artifact checks | duplication gate | historical Sonar remediation commits | task packet profile | template | template-updated | none | implemented |
| `FR-004` | behaviour | security-boundary-gap | consumer-template | 3 | Auth, session, cookie, source-blocking, and permission mapping fixes appeared as repeated security-sensitive patches. | Security regressions can recur when generated code misses boundary-specific controls. | repo-quality-gate | `SECURITY.md`, `docs/contracts/SYSTEM_AUTH_CONTRACT.md`, `docs/contracts/SYSTEM_IAM_CONTRACT.md` | CodeQL, backend tests, security workflow | `Security Gates` | security and auth commit history | generic implementation prompts | template | template-updated | none | implemented |
| `FR-005` | runtime-quality | runtime-evidence-gap | consumer-repository | 2 | Broad Playwright smoke was used as a main PR signal while full regression value belongs later. | Slow or flaky browser feedback can block unrelated quality work and hide true root cause. | runtime-evidence-gate | `docs/harness/VERIFICATION_EVIDENCE_SPEC.md` | Playwright smoke suites | `Quality Gates`, `Full Smoke Suite` | smoke stabilization commits | CI signal placement rules | gate | gate-updated | none | implemented |
| `FR-006` | method-health | method-health-gap | consumer-repository | 2 | Repeated failures existed in commits and sessions while this registry still used the old table schema. | Lessons stayed in chat history and branch history instead of becoming reusable harness controls. | method-gate | `docs/harness/FAILURE_RATCHET_POLICY.md` | `scripts/harness/check-failure-registry.mjs` | repository review | governance review | previous method-health checks | sensor | sensor-added | none | implemented |
| `FR-007` | maintainability | static-sensor-gap | consumer-repository | 1 | `.harness/cache` was tracked with thousands of cache files. | Generated or transient state polluted repository history and increased review noise. | repo-quality-gate | `.gitignore` | `git ls-files .harness/cache` | repository review | governance review | previous hygiene checks | gate | gate-updated | none | implemented |
| `FR-008` | method-health | method-health-gap | consumer-repository | 1 | `scripts/harness/*.mjs` depended on `../../../harness-engineering/...` sibling paths. | Another project or standalone checkout would need the same sibling workspace to run method checks. | method-gate | `agentic-method-kit/INSTALL.md` | `scripts/harness/check-method-health.mjs` | `Docs Governance` | team-mode governance review | previous repo-shell sync checks | adapter | adapter-updated | none | implemented |

## Review Notes

- Repeated failures: CI signal noise, historical static-analysis maintainability debt, security boundary drift, smoke scope drift, unrecorded ratchet events, cache hygiene, and sibling-path method wrappers are now tracked.
- Sensors with false positives: broad smoke can over-block unrelated PRs when used as a main quality gate.
- Sensors with known false negatives: local checks still depend on agents recording task packet, evidence, and review artifacts for non-trivial work.
- Rules to remove or downgrade: Codacy remains informational only; `Full Smoke Suite` stays scheduled, manual, or release-precheck.
- Next harness changes: measure whether new-code duplication and security-boundary regressions recur after the task template and failure registry schema upgrade.
