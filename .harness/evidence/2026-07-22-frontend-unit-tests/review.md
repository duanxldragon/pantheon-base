# Review — Frontend Unit Tests + Coverage Gates + Release Gate (PR #198)

## Reviewer
Solo maintainer (governance harness, single-approver flow).

## Scope assessment
Medium-size but low-risk: all changes are test files, test/lint configs, CI workflows,
governance docs and gate whitelists. No backend or frontend runtime code changed.

## Risk nodes
- `coverage-gate` now depends on the `go-coverage` artifact from Unit Tests; if the
  artifact upload fails the gate fails closed (correct direction).
- `quality.yml` go-lint `fetch-depth: 0` costs a deeper clone (~seconds) to restore
  the `--new-from-rev` baseline — acceptable.
- `ci.yml` go-lint is now report-only for push events; the enforced new-code lint
  gate lives in quality.yml (pull_request + merge_group). Rationale: main pushes were
  permanently red on accepted historical debt, which desensitizes the signal.
  Maintainer may veto and restore push enforcement once debt is cleared.
- `vitest.config.ts` whitelist entry follows the documented doc-first procedure
  (REPOSITORY_LAYOUT updated in the same commit as the gate change).
- gitleaks fingerprints are commit-scoped (d489c8db) — future occurrences of the
  same pattern in new commits will still be flagged.

## Governance checklist
- [x] PR body conforms to `check-pr-governance.mjs` (sections + fields + artifact linkage).
- [x] Harness task packet present: manifest + 3 evidence files, task-id consistent.
- [x] `Trivial change: no`, `Quality Profile: ci-workflow`, `Ratchet Decision: gate-updated`.
- [x] Structure gate, eslint, vitest thresholds, tsc all verified locally before push.
- [x] Smoke specs confirmed unaffected (no runtime change; playwright testDir isolated).

## Decision
Approved for merge pending green required checks on PR #198.
