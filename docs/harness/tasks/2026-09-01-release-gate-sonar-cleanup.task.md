# Task Packet: 2026-09-01-release-gate-sonar-cleanup

## Goal

Resolve the final unresolved SonarCloud issue on `main` so the Base Release Gate can pass and a new foundation release can be published for Pantheon Ops.

## Primary Layer

platform

## Dependency Layers

- shared frontend data-display components
- Release Gate and SonarCloud analysis

## Harness Profile

- Template: admin-platform
- Overlay: pantheon-base
- Quality Profile: ui-runtime
- Portable Failure Class: repo-quality-gate
- Owner Layer: consumer-repository
- Coverage Dimensions:
  - behaviour
  - maintainability
  - architecture-fitness
  - runtime-quality

## Contract Anchors

- `AGENTS.md`
- `DESIGN.md`
- `docs/designs/QUALITY_AND_SECURITY_STRATEGY.md`
- `frontend/src/components/data-display/AppTable.tsx`

## Scope

### In

- Preserve the shared `AppTable` behavior while reducing the reported `typescript:S3776` cognitive complexity.
- Verify frontend static checks and the shared pagination browser path.
- Use hosted SonarCloud analysis and the Release Gate as final external evidence.

### Out

- Changes to the public `AppTable` API, menus, permissions, i18n resources, audit behavior, APIs, schemas, or Pantheon Ops sources.
- Visual redesign or dependency updates.

## Expected Files

### Create

- `.harness/tasks/2026-09-01-release-gate-sonar-cleanup/manifest.json`
- `.harness/evidence/2026-09-01-release-gate-sonar-cleanup/commands.json`
- `.harness/evidence/2026-09-01-release-gate-sonar-cleanup/summary.md`
- `.harness/evidence/2026-09-01-release-gate-sonar-cleanup/review.md`

### Modify

- `frontend/src/components/data-display/AppTable.tsx`

### Do Not Touch

- the public `AppTable` component API and props
- menus, permissions, i18n resources, and audit behavior
- backend, database schema, and Pantheon Ops sources

## Implementation Notes

- Reuse the existing table component contract and extract its presentation branch into a private component. No new dependency, public abstraction, or behavioral branch is introduced.
- Rendered controls, table states, and the pagination contract must remain byte-equivalent in behavior.

## Verification Plan

- `cd frontend && npm run type-check`
- `cd frontend && npm run lint`
- `cd frontend && npm run build`
- `cd frontend && node scripts/run-smoke-suite.mjs --host 127.0.0.1 --port 5173 --config playwright.config.ts -- tests/smoke/platform/pagination-contract.spec.ts --workers=1`
- Hosted SonarCloud analysis and `Release Gate Summary` on the merged commit.

## Linkage

- Task ID: `2026-09-01-release-gate-sonar-cleanup`
- Task Manifest: `.harness/tasks/2026-09-01-release-gate-sonar-cleanup/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Plan References: `docs/harness/tasks/2026-09-01-release-gate-sonar-cleanup.task.md`
- Evidence Directory: `.harness/evidence/2026-09-01-release-gate-sonar-cleanup/`
- Review File: `.harness/evidence/2026-09-01-release-gate-sonar-cleanup/review.md`

## Evidence Required

- frontend static and build results
- focused pagination browser smoke result
- hosted SonarCloud analysis and Release Gate Summary
- review summary

## Human Gates

- GitHub required checks, SonarCloud analysis, and Release Gate Summary.

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
