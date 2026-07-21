# Self-review — 2026-07-21-v1-leftovers

Reviewer posture: mechanical + self-review (claude-direct under the
maintainer's leftover-processing authorization).

## Risk points examined

- **Verification-string sync is not a behavior change**: the generated
  registry template already wrote `pantheon-platform/modules/<scope>/<name>`
  (confirmed in `workspace.go` template literal); only the *checks* were
  stale. Purge-path assertions flipped to the same string keep their
  `false`-after-purge meaning because `WriteGeneratedRegistries` rewrites the
  file from the surviving refs list.
- **Batch caps**: 500 sits far above the UI's realistic cross-page selection
  while bounding the IN clause; error key `param.invalid` is a pre-existing
  translated key in all locales, so no i18n additions were needed. Caps sit
  after normalization (dedup) so legitimate duplicate-heavy payloads are not
  unfairly rejected.
- **SecurityEventList timing fix** mirrors the exact pattern of the other
  three audit pages (synchronous `setQuery` before fetch); the failure-path
  behavior now leaves `query` consistent with what the user requested rather
  than what last succeeded — matching LoginLogList semantics.
- **quality.yml condition**: single-line `if:` keeps
  `tests/scripts/quality-workflow.test.mjs`'s regex satisfied (verified by
  hand: `if:\s*github\.event_name\s*==\s*'pull_request'` prefix intact, the
  appended `&& … != 'dependabot[bot]'` falls inside the `[\s\S]*` gap). The
  exemption narrows only the heavy body-validation step; every structural
  check above it still runs for dependabot PRs.
- **solo-override on #188** was applied under explicit maintainer
  authorization in-session (the label isonly forbidden for *self-applied*
  agent bypasses); the durable fix removes the need for it going forward.

## Verdict

Low-risk sync/hardening round; all target failures reproduced, root-caused,
fixed, and re-verified green locally. Merge gated by Quality Gates as usual.
