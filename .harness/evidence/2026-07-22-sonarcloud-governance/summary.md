# Evidence Summary — SonarCloud Governance Workstream (deferred)

## Context
SonarCloud Code Analysis is an external PR gate wired into the pantheon-base CI.
It currently reports FAILURE on PRs (e.g. #193) because of pre-existing issues in
the codebase. Per the release-ruleset analysis, SonarCloud is **not** a blocking
check — the `solo dev merge rules` ruleset only requires the `Quality Gates`
check, which is green. So SonarCloud red does not block merges today, but it is
noisy and hides real signal.

## Decision (2026-07-22)
- SonarCloud is governed as its **own separate workstream**, explicitly NOT bundled
  with the errcheck cleanup or the ops lock upgrade.
- Remediation is **deferred** until SonarCloud dashboard access is available or a
  maintenance window is scheduled (this environment has no SonarCloud connector).

## Triage Procedure (run at remediation time)
1. Open `https://sonarcloud.io/dashboard?id=duanxldragon_pantheon-base`.
2. Pull the current issue list; export to CSV for archive.
3. Classify each issue:
   - **Real bug** (null deref, resource leak, SQL injection, secrets) → fix in a
     dedicated `fix/sonarcloud-*` PR, one logical group per PR.
   - **Legacy / accepted** (intentional pattern, already covered by errcheck/gosec,
     or won't-fix by design) → mark `Won't Fix` / `Accept` in SonarCloud with a
     justification comment.
   - **Duplicate of errcheck cleanup** → close as covered by
     2026-07-22-errcheck-cleanup.
4. Set a Quality Gate: new code = 0 blocker/critical; legacy debt tracked with a
   `tech-debt` label, not blocking.
5. Add `sonar-project.properties` scoping legacy vs new if issue volume is high.

## Acceptance (this packet)
- [x] SonarCloud scoped as a separate, tracked workstream.
- [x] Triage procedure and acceptance criteria documented.
- [ ] Actual issue remediation (deferred — blocked on dashboard access).

## Risk
None for this packet (governance-only). Remediation risk will be assessed per-issue.
