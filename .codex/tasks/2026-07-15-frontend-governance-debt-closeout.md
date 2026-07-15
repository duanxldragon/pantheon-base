# Task Packet: Frontend Governance Debt Closeout

- Status: `validated-awaiting-human-gate`

## Goal

Clear the historical frontend formatting backlog and remove the remaining 144 `!important` declarations without changing platform, authentication, or system-domain rendering and behavior.

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
- Portable Failure Class: css-priority-debt
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

- Format only files reported by `npm run format:check` at task start.
- Replace CSS priority overrides with deletion, component props, supported Arco hooks, or sufficiently scoped selectors.
- Ratchet the deterministic `!important` budget after each verified batch.
- Verify desktop and mobile platform/auth/system surfaces.

### Out

- Backend changes.
- `frontend/src/modules/business/**`.
- Product redesign or new UI dependencies.
- `pantheon-ops/**`, commits, PR creation, or hosted actions.

## Structural Scope

- Affected Subgraph: global tokens/styles -> platform shell/auth/system shared components -> rendered admin surfaces
- Boundary Crossings: CSS cascade across platform, system/auth, system/iam, and system/config UI surfaces
- Risk Nodes: Arco internals, navigation states, dialogs/drawers, tables, calendar grids, responsive forms
- Graph Focus: runtime-quality and visual contract only; no application data-flow change

## Expected Files

### Create

- `.codex/tasks/2026-07-15-frontend-governance-debt-closeout.md`
- `.harness/tasks/2026-07-15-frontend-governance-debt-closeout/manifest.json`
- `.harness/evidence/2026-07-15-frontend-governance-debt-closeout/**`

### Modify

- The 22 files reported by the initial Prettier check.
- CSS files containing the 144-declaration baseline.
- Directly affected React components when an Arco prop replaces a CSS override.
- `frontend/scripts/check-important-budget.mjs`.
- Focused visual/contract tests only when needed to preserve the behavior contract.

### Do Not Touch

- `backend/**`
- `frontend/src/modules/business/**`
- `pantheon-ops/**`
- Existing unrelated dirty files unless they are explicitly in the formatter or CSS migration scope.

## Assumptions And Open Questions

- Confirmed: the current checker reports 144 declarations at a budget of 144.
- Confirmed: the current formatter backlog is 22 files; the older 24-file count is stale.
- Assumption: most priority declarations can be replaced by dead-rule deletion, component APIs, or scoped specificity without changing computed styles.
- Open question: reduced-motion resets may remain standards-aligned exceptions; any retained declaration must be explicitly justified and budgeted.

## Minimum Viable Approach

Reuse Prettier, the budget checker, existing Arco component APIs, visual contracts, and Playwright smoke infrastructure. Add no dependency or generic styling abstraction.

## Implementation Notes

- Treat formatting and CSS migration as separate reviewable batches.
- Remove dead or redundant declarations before increasing selector specificity.
- Prefer Arco component props and supported style hooks for declarations that currently beat inline styles.
- Keep responsive and reduced-motion behavior covered by focused runtime checks.

## Success Criteria

- `npm run format:check` reports no files.
- `npm run check:important-budget` passes at the final actual count, with zero as the target and every exception documented if zero is unsafe.
- Static gates, type-check, lint, and production build pass.
- Desktop and mobile screenshots show no overlap, clipping, overflow, missing controls, or broken interaction states.
- Evidence and independent review validators pass.

## Method Readiness

- Consumer-Specific Controls: Prettier, important budget, shell visual contract, contrast, Playwright
- Required Sensors: static commands, computed styles, screenshots, runtime-error collection, review
- Minimal Complexity Rung: deletion/reuse/component-native API before scoped selector changes
- Ratchet Decision: lower the budget after every verified batch; never raise it

## Delivery Governance

- Design Gate: preserve the existing restrained enterprise admin language.
- Development Gate: declared file boundary and batch-level budget ratchet.
- QA Acceptance Gate: static gates plus rendered desktop/mobile evidence.
- GitHub Governance Gate: deferred to a later human-approved PR.

## Execution Roles

- Implementer Posture: implementer
- Reviewer Posture: mechanical, UX-QA, maintainability

## Stop Points

- Stop a candidate removal when computed styles or interactions change and migrate that rule through the owning component instead.
- Stop before external, destructive, backend, business-domain, or downstream-repository actions.

## Context Strategy

- Retrieval order: this task packet -> previous important-budget summary/review -> focused CSS/component source -> raw screenshots/logs.
- Response Budget: terse batch updates.
- Promotion Target: checker budget and closeout evidence.
- Economics Watch: avoid full-suite reruns between individual declarations; validate per surface group.

## Verification Plan

### Frontend

- `npm run format:check`
- `npm run check:important-budget`
- `npm run check:shell-visual-contract`
- `npm run check:contrast`
- `npm run lint`
- `npm run type-check`
- `npm run build`

### Browser / Smoke

- Focused platform/auth/system visual contracts at desktop and mobile viewports.
- Browser runtime-error and horizontal-overflow assertions.

## Linkage

- Task ID: `2026-07-15-frontend-governance-debt-closeout`
- Task Manifest: `.harness/tasks/2026-07-15-frontend-governance-debt-closeout/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `.codex/tasks/2026-07-15-frontend-governance-debt-closeout.md`
- Evidence Directory: `.harness/evidence/2026-07-15-frontend-governance-debt-closeout/`
- Review File: `.harness/evidence/2026-07-15-frontend-governance-debt-closeout/review.md`

## Evidence Required

- command result summary
- desktop and mobile screenshots
- runtime-error and overflow result
- independent review summary

## Human Gates

- PR creation, hosted checks, merge, and downstream foundation synchronization.

## Sync Expectation

- Modify `pantheon-base` only; defer the normal base-to-ops foundation synchronization.

## Completion Checklist

- [x] Layer and boundary declared
- [x] Quality profile and ratchet declared
- [x] Contract anchors read
- [x] Formatting debt cleared
- [x] CSS priority debt migrated and budget ratcheted
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Mechanical and UX review completed
- [x] Review completed with a conditional verdict and explicit independent-review gap
- [ ] Independent non-author review completed at the PR / human gate
