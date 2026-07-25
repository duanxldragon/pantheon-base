# Review — 2026-07-23-base-freeze-sonar-control

Reviewer: Claude Code (planner/reviewer per CLAUDE.md role split); implementation by Codex.

## Scope check

- Diff limited to `.github/workflows/*`, `Dockerfile`, `frontend/scripts/`,
  `scripts/`, `tests/scripts/`, and `.harness/` artifacts — matches the task
  packet scope (ci-workflow / quality-governance / security). No `backend/`
  or `frontend/src/` changes. ✅

## Findings reviewed

1. **`hasDeclaration` regex hardening** — previous code interpolated raw
   property/value into `new RegExp`; call sites compensated with manual
   double-escaping (`var\\(...\\)`), which is exactly the fragile pattern
   Sonar flags. New code normalizes legacy pre-escaped input, escapes both
   operands, and every call site now passes plain CSS. Verified the contract
   still passes against the live CSS (`check-shell-visual-contract` green),
   so the gate did not silently weaken. ✅
2. **`create-pr.mjs` input validation** — allowlist regexes are conservative
   (no CR/LF in title/message, branch charset restricted, 200-char cap) and
   `shell: false` made explicit. No injection path into `execFileSync` args
   remains. ✅
3. **pr-automation split** — read-only prereq jobs gate the write job via
   `needs` + output equality; write permissions are job-scoped. `edited`
   trigger added so a fixed PR body re-runs governance validation instead of
   deadlocking. ✅
4. **security-gates enforcement** — treats `skipped` dependency scan as pass
   (path-filtered runs) but any `failure` as hard fail; consistent with the
   single-source-of-truth summary design. ✅
5. **Release Gate CODE_SMELL=0** — intentional policy ratchet for the freeze
   (`ratchetDecision: gate-updated` in the manifest); matches the task
   packet's zero-open-issue success criterion. ✅

## Residual risk

- actionlint verified only in CI (no local binary); Lint Workflows must be
  green before merge.
- SonarCloud OPEN=0 proof is post-merge (automatic analysis on main +
  Release Gate run); tracked as the closeout step of this task.
