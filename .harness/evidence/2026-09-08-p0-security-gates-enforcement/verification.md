# Evidence: 2026-09-08-p0-security-gates-enforcement

## Before state

`ruleset 17011510` ("solo dev merge rules", active, targets `~DEFAULT_BRANCH`, i.e. `main`):

- required status checks: `Quality Gates` only
- rules: deletion, non_fast_forward, pull_request (0 approvals required, dismiss stale on push, extra approval for unattributed changes), required_status_checks

Full snapshot: `branch-protection-before.json` (this directory).

## Change applied (2026-09-08, maintainer-approved)

Added `Security Gates` to the required status checks via `gh api -X PUT repos/duanxldragon/pantheon-base/rulesets/17011510`. All other rules preserved byte-for-byte (verified by diffing before/after JSON).

## After state (verified via GET)

```json
"required_status_checks": [{"context": "Quality Gates"}, {"context": "Security Gates"}]
```

Full snapshot: `branch-protection-after.json` (this directory).

## Preconditions verified

- Workflow name check: `.github/workflows/security.yml` line 274 `name: Security Gates` — matches the required check context exactly.
- Recent run health: latest `Security Gates` run on `main` = `success` (2026-09-07T10:28:42Z), so enabling enforcement does not immediately block mergeable state.
- `current_user_can_bypass: "never"` — the enforcement applies to the maintainer account too.

## Success criteria check

- [x] `Security Gates` (secret scan, workflow posture, dependency reports, CodeQL scan + CodeQL alert gate) is a required check for PR merge to `main`
- [x] Documentation updated: `docs/designs/QUALITY_AND_SECURITY_STRATEGY.md` + `.en.md` now state the 2026-09-08 enforcement instead of "尚未纳入"
- [ ] Test PR validating blocking behavior — not executed this session (would require pushing a deliberately failing PR to main's checks); explicit gap. Enforcement mechanics are GitHub-native and the check context name was verified against the workflow definition.
- [x] Dependabot alert integration: already part of the `Security Gates` aggregate (dependency reports + CodeQL alert gate) per workflow definition; no separate branch-protection toggle needed.

## Rollback

Re-run the same PUT with `required_status_checks` reduced to `[{"context": "Quality Gates"}]` (before-state snapshot kept in this directory).

## Task manifest

`status` updated to `completed`, with the test-PR gap recorded above.
