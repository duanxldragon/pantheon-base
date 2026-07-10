# Decision: docs-governance 门禁固化 (2026-07-10)

## Problem

The repo's CI gates (docs-governance, quality-gates, security, ci) were **all
advisory** — the `main` ruleset "solo dev merge rules" had **no required status
checks**, only: require-PR (0 approvals), no-force-push, no-deletion. So:

- The solo maintainer was never blocked (good), **but**
- Agent PRs were also never enforced — "把控代理质量" relied on agent discipline,
  not the gate.
- Separately, the docs-governance PR-body check (full template + 4 harness artifact
  files) imposed heavy ceremony that is valuable for agent traceability but pure
  friction for the maintainer's own quick PRs (observed on PR #160).

## Goal

Workflows should **control agent quality and boost efficiency, without blocking the
solo human maintainer's development flow.**

## Decision (Option 2 + Option 3)

1. **`Quality Gates` becomes the single required status check** in the ruleset. It
   aggregates docs-governance + frontend-contract + backend-tests + go-lint +
   duplication + smoke-sanity (runtime gates already auto-skip for docs/governance-only
   changes via `change-scope`). This makes enforcement real for agent PRs.

2. **`solo-override` label = maintainer escape hatch.** When present on a PR:
   - `quality-gates` short-circuits to success (all gates advisory for that PR);
   - the heavy docs-governance PR-body ceremony (`check-pr-governance.mjs --event`)
     is skipped (cheap structural doc checks still run).
     → The maintainer is never blocked (one label); agents are held to the bar.

3. **Agents must not self-apply `solo-override`** (codified in `AGENTS.md`). Real
   quality signals (build/test/lint/security) always run and stay visible regardless.

## Why not the alternatives

- **Author-based bypass** doesn't work: human and agents share one GitHub identity
  (`duanxldragon`), so `pull_request.user.login` can't distinguish them. A label is
  the reliable discriminator.
- **Keep everything advisory (Option 1)** fails "把控代理质量" — nothing would enforce
  agent quality.

## Changes

- `.github/workflows/quality.yml`: `solo-override` bypass in `quality-gates`; skip
  PR-body ceremony when labelled.
- `AGENTS.md`: `solo-override` policy rule.
- Repo label `solo-override` created.
- Ruleset `solo dev merge rules`: add `Quality Gates` to required_status_checks.

## Revert

Remove `Quality Gates` from the ruleset's required checks (or delete the required
checks rule) to return to fully-advisory gates. The label bypass is harmless if left
in place.
