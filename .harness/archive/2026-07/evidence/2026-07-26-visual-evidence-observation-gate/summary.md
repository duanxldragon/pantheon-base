# Summary: visual-evidence observation gate wiring

- Added `check:harness-visual` npm script running `scripts/harness/check-visual-evidence.mjs --root . --strict`.
- Added an advisory `Check visual evidence` step (`continue-on-error: true`, id `harness-visual`) to the quality workflow docs-governance job, reported in the Harness Governance Results summary and step log.
- Deliberately excluded from the strict main/release enforcement block: per pantheon-harness `visual-evidence-promotion-policy.md`, the gate stays observational until 3 consecutive UI-affecting tasks pass with rendered evidence and zero checker false positives (HOT-001).

## Verification

- `npm run check:harness-visual`: passed — 0 UI tasks, 0 warnings, no findings.
- `npm run test:quality-workflow`: passed — 3/3 workflow structure tests.

## Known gaps

- Observation data stays empty until the first UI-affecting task packet lands; promotion tracking lives in pantheon-harness `harness-open-tasks.md` (HOT-001, 2026-07-26 evaluation).
