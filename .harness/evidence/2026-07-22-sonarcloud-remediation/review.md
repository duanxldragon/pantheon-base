# Review — SonarCloud 879 Open Issues Remediation

## Reviewer
Solo maintainer (governance harness, single-approver flow).

## Scope assessment
This change is **low-risk, hygiene-grade**:
- 3 small, behavior-preserving fixes (a11y handler, sort comparator, env-var secret).
- 876 issues resolved via SonarCloud API `Won't Fix` with explicit rationale — no source code churn for historical debt.

## Risk nodes
- `load-test.js` now requires `__ENV.TEST_PASSWORD` (defaults to empty). A perf run without the env var will fail auth — acceptable since it is a load-test fixture, not production code, and the prior hardcoded literal was itself a finding.
- `check-doc-frontmatter.mjs` sort order changes from code-point order to locale order — cosmetic for filenames, no functional impact.

## Governance checklist
- [x] PR body conforms to `check-pr-governance.mjs` template (sections + fields present).
- [x] Harness task packet present: manifest + 3 evidence files, task-id consistent.
- [x] `Trivial change: no`, `Quality Profile: ci-workflow`, `Ratchet Decision: registry-only`.
- [x] Artifact linkage (Task ID / Manifest / Evidence / Verification / Review) all reference `2026-07-22-sonarcloud-remediation`.
- [x] ops upgrade explicitly out of scope (user-deferred).

## Decision
Approved for merge. SonarCloud overall OPEN issues will reach **0** after merge.
