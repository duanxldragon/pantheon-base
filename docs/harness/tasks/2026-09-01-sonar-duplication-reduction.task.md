---
title: Reduce Pantheon Base SonarCloud duplication below three percent
doc_type: Remediation
layer: system
status: Active
updated_at: 2026-09-01
---

# Task Packet: 2026-09-01 Sonar duplication reduction

## Goal

Reduce the `pantheon-base` SonarCloud overall duplication from the observed `4.10%` to below `3.00%` through behavior-preserving reuse of repeated production and test patterns.

## Primary Layer

`system/*` and shared frontend platform components; no contract or runtime behavior change.

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `pantheon-harness`
- Downstream Consumers: `pantheon-ops`
- Sync Expectation: `not-required`
- Release Requirement: `none`

## Contract Anchors

- `AGENTS.md`
- `DESIGN.md`
- `docs/designs/QUALITY_AND_SECURITY_STRATEGY.md`
- `scripts/check-duplication.mjs`
- SonarCloud project `duanxldragon_pantheon-base`

## Assumptions and Open Questions

- Confirmed: public SonarCloud measures report `5,936` duplicated lines, `128,506` NCLOC, and `4.10%` overall density.
- Confirmed: `SONAR_TOKEN` is unavailable locally; the public measures endpoint is readable, but hosted post-change analysis remains authoritative.
- Assumption: repeated test setup and repeated list/schema presentation are safe to consolidate without changing exported APIs or observable behavior.
- Open: exact post-change SonarCloud density until CI analysis runs.

## Minimum Viable Approach

- Reuse existing local helpers/components and extract only repeated blocks shown by the Sonar file ranking.
- Do not add dependencies, change exclusions, or rewrite generated/fixture content to game the metric.
- Preserve i18n, authorization, audit, menu, and runtime behavior.

## Scope

### In

- Top Sonar duplication hotspots in frontend production modules and backend service/test packages.
- Focused type-check, lint, build, Go tests, local duplication gate, and diff validation.

### Out

- SonarCloud project settings or exclusions.
- API, schema, seed semantics, permissions, menus, Ops repository, and visual redesign.

## Structural Scope

- Affected Subgraph: list/schema view composition and backend test/service helper paths -> existing shared helpers/components -> rendered/API behavior.
- Boundary Crossings: none; changes remain inside `pantheon-base` modules.
- Risk Nodes: shared frontend list patterns; backend service/test setup helpers.
- Graph Focus: hub-check and behavior-preserving call-depth review.

## Expected Files

### Create

- `.harness/tasks/2026-09-01-sonar-duplication-reduction/manifest.json`
- `.harness/evidence/2026-09-01-sonar-duplication-reduction/commands.json`
- `.harness/evidence/2026-09-01-sonar-duplication-reduction/summary.md`
- `.harness/evidence/2026-09-01-sonar-duplication-reduction/review.md`

### Modify

- Only files confirmed by the Sonar hotspot ranking and assigned implementation scope.

### Do Not Touch

- `.sonarcloud.properties`
- `pantheon-ops/**`
- `database/**`, schema contracts, permissions, menus, i18n resource policy, and release configuration.

## Method Readiness

- Quality Profile: `ci-workflow` plus `ui-runtime` where frontend production code is touched.
- Minimal Complexity Rung: `reuse`.
- Required Sensors: local duplication gate, Go tests, frontend type-check/lint/build, review.
- Ratchet Decision: `guide-updated` is deferred unless the same hotspot pattern recurs after this closeout.
- Deferred Code Issues: hosted SonarCloud post-change measure until CI runs.

## Verification Plan

- Backend: focused `go test` for changed packages, then `go test ./...` if feasible.
- Frontend: `npm run type-check`, `npm run lint`, `npm run build`.
- Duplication: `npm run check:duplication` and public SonarCloud measures after CI.
- Runtime Evidence: no API/server runtime path changed; record explicit gap.

## Linkage

- Task ID: `2026-09-01-sonar-duplication-reduction`
- OpenSpec Change: `none`
- Evidence Directory: `.harness/evidence/2026-09-01-sonar-duplication-reduction/`
- Review File: `.harness/evidence/2026-09-01-sonar-duplication-reduction/review.md`

## Human Gates

- Hosted SonarCloud analysis and final acceptance of any residual density above the target.

## Foundation Release Handoff

- Shared change owner: `pantheon-base`
- Foundation release required: `deferred`
- Consumer sync status: `not-started`
- Downstream validation command: `none`
- Release/lock stop point: `none`

## Success Criteria

- Hosted SonarCloud overall duplication density is `< 3.00%`.
- Local duplication gate remains passing at `<= 3.00%`.
- Focused backend/frontend validation passes with no contract or behavior regressions.
- Evidence and review artifacts link back to this task packet.
