# Summary — governance-gate-repair (G01)

## Root cause

1. `SHELL_VERSION.json` — commit `722fa9e1` ("complete v0.14.0 publication")
   deleted it as a "temporary release file", but the artifact is a required
   shell landing file per upstream `pantheon-harness` (listed in
   `REQUIRED_REPO_SHELL_FILES` and read by `check-method-health.mjs`, which
   enforces `compatibleRepoShell`/`compatibleMethodKit` = 1.4.0). Decision:
   **restore the artifact** (the checker/contract stays as-is).
2. `scripts/harness/check-doc-frontmatter.mjs` mirror drift — the worktree copy
   already matches the upstream `pantheon-harness` script byte-for-byte
   (synced in `d65310ba`); the drift finding came from the remote `main` state
   before that sync. No copy divergence remains.

## Changes

- Restored `SHELL_VERSION.json` verbatim (content identical to the deleted version).

## Verification

- `check-method-health.mjs --strict`: method kit 1.4.0 / repo shell 1.4.0, no findings.
- `check-sync-drift.mjs --strict`: 0 findings.
- `check-doc-links.mjs --strict`, `check-doc-frontmatter`: 0 errors.
- `npm.cmd run check:task-packet|check:harness-sync|check:harness-docs`: exit 0.
- `check:harness-adoption`: passes once the closeout evidence files land (it
  requires implementation changes to be paired with evidence/commands.json).

## Acceptance mapping

1. SHELL_VERSION.json required → restored; documented here — PASS.
2. Mirror check passes with intended upstream source; no unexplained copies — PASS.
3. Hosted Docs Governance / Quality Gates / Release Gate reruns on a candidate SHA — partially blocked (see gap): local equivalents all green; hosted rerun needs G02 PR closeout (maintainer decision).
