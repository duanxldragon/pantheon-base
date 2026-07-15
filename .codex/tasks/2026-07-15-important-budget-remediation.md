# Task Packet: Important Budget Remediation

- Status: `validated-awaiting-human-gate`

## Goal

Reduce the frontend `!important` baseline below the enforced budget without changing the rendered login experience, then ratchet the budget to the verified total.

## Primary Layer

platform

## Dependency Layers

- system/auth
- system/iam
- system/config

## Harness Profile

- Template: admin-platform
- Overlay: pantheon-base
- Quality Profile: ui-runtime
- Portable Failure Class: static-sensor-gap
- Owner Layer: consumer-repository
- Coverage Dimensions:
  - behaviour
  - maintainability
  - runtime-quality
  - method-health

## Contract Anchors

- `AGENTS.md`
- `DESIGN.md`
- `docs/README.md`
- `docs/acceptances/AGENT_EXECUTION_CHECKLIST.md`
- `docs/harness/AI_QUALITY_GOVERNANCE.md`
- `frontend/scripts/check-important-budget.mjs`

## Scope

### In

- Remove redundant `!important` flags from browser-verified login and shared UI selectors.
- Delete one unreferenced user-list title style block.
- Ratchet the deterministic budget to the resulting repository total.
- Verify desktop and mobile login rendering, interaction states, and frontend gates.

### Out

- Broad CSS refactors or component rewrites.
- Calendar, table, dialog, drawer, shell-navigation, or business-module overrides.
- Formatting unrelated frontend files.

## Structural Scope

- Affected Subgraph: `Login.tsx -> Login.css -> rendered login page`
- Boundary Crossings: none
- Risk Nodes: public login page and responsive breakpoint
- Graph Focus: none; this is a stylesheet cascade change

## Expected Files

### Create

- `.codex/tasks/2026-07-15-important-budget-remediation.md`
- `.harness/evidence/2026-07-15-important-budget-remediation/commands.json`
- `.harness/evidence/2026-07-15-important-budget-remediation/summary.md`
- `.harness/evidence/2026-07-15-important-budget-remediation/review.md`
- desktop and mobile login screenshots in the evidence directory

### Modify

- `frontend/src/modules/auth/login/components/Login.css`
- `frontend/src/index.css`
- `frontend/src/core/layout/index.css`
- `frontend/src/modules/system/components/shared/list-page.css`
- `frontend/src/modules/system/user/user.css`
- `frontend/scripts/check-important-budget.mjs`

### Do Not Touch

- Other existing dirty files unless a directly affected gate proves a regression.
- `frontend/tests/smoke/system/system-pages.spec.ts`
- `pantheon-ops/**`

## Assumptions And Open Questions

- Confirmed: the current repository total is 164 and the enforced budget is 147.
- Assumption: login-page-owned selectors retain their computed values without `!important` because the page stylesheet loads after Arco styles and has equal or greater specificity.
- Open questions: none; computed-style and screenshot checks will falsify the assumption.

## Minimum Viable Approach

- Reuse the existing login stylesheet, budget checker, visual smoke, and Playwright screenshots.
- Remove redundant declaration flags and one unreferenced style block; do not add selectors, variables, dependencies, or component code.

## Implementation Notes

- CSSOM experiments removed one priority at a time and compared computed values at desktop and mobile viewports.
- Any declaration that changed a computed value remained untouched.
- The temporary audit spec was deleted before final validation.

## Success Criteria

- `npm run check:important-budget` passes at a lowered budget matching the actual total.
- Login desktop and 390px mobile computed styles and layout assertions pass.
- Login screenshots show no overlap, clipping, horizontal overflow, or missing controls.
- Shell visual contract, contrast, lint, type-check, and production build pass.

## Method Readiness

- Consumer-Specific Controls: `check:important-budget`, shell visual contract, login visual smoke
- Required Sensors: static commands, Playwright, rendered screenshots, review
- Required Evidence: command summary, desktop/mobile screenshots, review summary
- Minimal Complexity Rung: one-local-expression
- Ratchet Decision: gate-updated
- Deferred Code Issues: remaining load-bearing Arco overrides stay under the lowered budget

## Delivery Governance

- Design Gate: preserve the existing restrained enterprise login visual language
- Development Gate: expected files and do-not-touch boundary declared
- QA Acceptance Gate: static commands and browser evidence
- GitHub Governance Gate: repo-quality-gate; hosted checks remain a later PR gate

## Execution Roles

- Implementer Posture: implementer
- Reviewer Posture: UX-QA and mechanical

## Stop Points

- Stop if removing flags changes computed styles or rendered behavior; restore only the affected load-bearing flags and select a different low-risk group.

## State Plan

- Checkpoint Expectation: evidence directory
- Resume Artifacts: this task packet and linked evidence

## Verification Plan

### Backend

- none

### Frontend

- `npm run check:important-budget`
- `npm run check:shell-visual-contract`
- `npm run check:contrast`
- `npm run lint`
- `npm run type-check`
- `npm run build`

### Browser / Smoke

- Focused `backoffice-ui-visual.spec.ts` login test at 1440x900 and 390x844
- Screenshot inspection for desktop and mobile

### Runtime Evidence

- Browser-computed style assertions, runtime-error capture, and screenshots

## Linkage

- Task ID: `2026-07-15-important-budget-remediation`
- Task Manifest: `.harness/tasks/2026-07-15-important-budget-remediation/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `.codex/tasks/2026-07-15-important-budget-remediation.md`
- Evidence Directory: `.harness/evidence/2026-07-15-important-budget-remediation/`
- Review File: `.harness/evidence/2026-07-15-important-budget-remediation/review.md`

## Evidence Required

- command result summary
- desktop and mobile screenshots
- browser runtime-error result
- review summary

## Human Gates

- PR creation, hosted checks, merge, and downstream foundation synchronization

## Sync Expectation

- Modify `pantheon-base` only.
- The budget checker and shared login CSS are base-owned; include them in the next normal `base -> ops` foundation synchronization.

## Completion Checklist

- [x] Layer and boundary declared
- [x] Quality profile declared
- [x] Ratchet decision declared
- [x] Delivery governance gates declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
