# Historical Debt Audit

## Scope And Method

- Audit date: `2026-08-31`
- Repository: `pantheon-base`
- Scope: historical quality, visual-regression, dependency-audit, and static performance signals relevant to the B1-B4 delivery.
- Method: evidence-backed triage. A recorded issue is either `confirmed`, `accepted`, or `unknown`; a search hit alone is not treated as a defect.
- Out of scope: changing unrelated backend behaviour, updating existing screenshot baselines without maintainer approval, and publishing a foundation release.

## Summary

| Priority | State | Debt | Evidence | Recommended Owner / Next Action |
| --- | --- | --- | --- | --- |
| P1 | confirmed | Existing desktop-light visual baselines for Dashboard and system user list drift from current runtime. | `frontend/tests/visual/visual-baseline.spec.ts`; current comparison evidence in `commands.json`. | Maintainer visual acceptance, then either fix the runtime drift or intentionally refresh the approved baseline. |
| P1 | accepted | Full-repository Go lint remains report-only on protected-branch push because historical lint debt would otherwise keep main red. | `.github/workflows/quality.yml`; `2026-07-22-sonarcloud-remediation`; `2026-07-23-main-quality-gates-green`. | Dedicated lint-debt workstream; preserve PR/merge-group new-code enforcement until the baseline is cleared. |
| P2 | confirmed | The generator datasource listing loads every persisted datasource without a result bound. | `backend/modules/lowcode/generator/generator_datasource_service.go:46`. | Low-code owner: add an explicit operational maximum or pagination only after API/consumer contract review. |
| P2 | accepted | The lint configuration contains legacy keys and is run with configuration verification disabled. | `.github/workflows/quality.yml` Go lint comments near the action configuration. | Tooling owner: migrate `.golangci.yml` under a dedicated configuration-change task, then enable verification. |
| P2 | unknown | High-severity dependency-audit result is unknown because the public npm audit endpoint was unavailable from this environment. | Attempt recorded in `commands.json`; no vulnerability conclusion is valid. | CI or a network-enabled security review: rerun `npm audit --audit-level=high`, archive the machine-readable result, and triage findings. |
| P2 | accepted | Supply-chain hardening prompts remain deferred: selected GitHub Action dependency-install paths cannot blindly add `--ignore-scripts` without breaking the frontend patch/build path. | `2026-07-22-sonarcloud-remediation/summary.md`. | Security/tooling owner: carry out a dedicated lifecycle-script and action-install review. |

## Findings

### HD-001: Visual Regression Baseline Drift

- Classification: `confirmed`, P1, UI quality.
- Evidence: the current desktop-light comparisons differ by approximately `2%` for Dashboard and `5%` for the system user list. Earlier inspection attributes the differences to runtime menu/data content, not an approved B1-B4 visual change.
- Impact: a full visual-suite success cannot prove those historical screens are stable. Blind snapshot refresh would hide either a regression or an unreviewed product change.
- Disposition: leave the affected baseline images untouched in this task. This B1-B4 delivery supplies its own focused visual evidence; a maintainer must decide the intended Dashboard and user-list appearance before any baseline update.

### HD-002: Historical Go Lint Debt

- Classification: `accepted`, P1, maintainability / CI signal.
- Evidence: the Sonar remediation recorded `784` historical code smells, and the later quality-gate closeout records the policy that full-repository lint is report-only on push while PR and merge-group lint remains new-code-only.
- Impact: main-push lint does not presently provide a blocking full-baseline signal; expanding an unrelated feature task to clear the full backlog would be unsafe and unreviewable.
- Disposition: no change in this task. Preserve the scoped PR gate and schedule lint remediation by category, with each batch restoring a measurable portion of the strict baseline.

### HD-003: Unbounded Generator Datasource Listing

- Classification: `confirmed`, P2, performance / availability.
- Evidence: `GeneratorService.ListDatasources` appends the current datasource and calls `Order("id asc").Find(&rows)` without pagination or a maximum.
- Impact: an administrative endpoint can allocate and serialize an unbounded datasource collection. The current feature does not establish its expected cardinality, so an arbitrary cap would be a contract change.
- Disposition: deferred. A dedicated low-code task must establish the supported count, response shape, UI paging/search behaviour, and test boundaries before implementation.

### HD-004: Lint Configuration Migration

- Classification: `accepted`, P2, tooling correctness.
- Evidence: the Go lint workflow documents that `.golangci.yml` carries legacy keys and invokes the action with `verify: false` to preserve existing behavior.
- Impact: configuration problems are masked until a future action/tool upgrade changes the effective lint set.
- Disposition: deferred to the same or a separate lint-governance task. Validate old/new effective configuration before making the verification gate blocking.

### HD-005: Dependency Audit Coverage Gap

- Classification: `unknown`, P2, supply-chain visibility.
- Evidence: `npm audit --registry=https://registry.npmjs.org --audit-level=high` could not reach the audit endpoint in the current environment. The failure proves only that this audit did not complete.
- Impact: there is no current local evidence for either the presence or absence of high-severity dependency vulnerabilities.
- Disposition: do not mark as pass or failure. Rerun from a network-enabled CI/security environment and record the raw report before creating remediation work.

### HD-006: Lifecycle-Script Supply-Chain Review

- Classification: `accepted`, P2, supply-chain hardening.
- Evidence: the prior Sonar closeout identifies `14` real `githubactions:S6505` prompts and explains why a blanket `--ignore-scripts` change would risk breaking the required frontend compatibility patch/build process.
- Impact: dependency installation retains a reviewed-but-unresolved lifecycle-script exposure.
- Disposition: deferred. Review every install site, minimize script execution, pin/verify required scripts, and prove the frontend patch remains reproducible before hardening CI.

## Evidence Boundaries

- `HD-001` is a visual comparison and requires human acceptance; it is not automatically attributed to a code defect.
- `HD-002`, `HD-004`, and `HD-006` are existing governance decisions, not regressions introduced by B1-B4.
- `HD-003` is a static performance risk; production load, cardinality, and observed latency were not available in this task.
- `HD-005` is intentionally an unknown, not a clean audit result.

## Ratchet Decision

- `registry-only` for this delivery: every repeated or policy-level item already has a CI-policy, previous closeout, or dedicated owner path.
- Do not add a new global gate for a single unbounded-listing finding before its contract is defined.
- Keep the B5 UI quality gate as the active ratchet for new UI work; it prevents new tasks from omitting rendered-evidence planning, but does not rewrite old baselines.

## Exit Criteria For Follow-up Work

1. Dashboard and user-list baselines are either fixed or refreshed after a recorded maintainer visual decision.
2. Full Go lint runs strictly with a verified configuration and an agreed zero/bounded baseline.
3. Generator datasource-list behaviour has an explicit cardinality contract and focused tests.
4. A network-enabled dependency audit produces a retained result and each high finding has a disposition.
5. CI lifecycle-script exposure has an approved, reproducible hardening plan.
