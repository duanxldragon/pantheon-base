---
title: Clear the frontend follow-redirects high advisory so the dependency gate is green again
doc_type: Remediation
layer: platform
status: Active
linked_contracts:
  - frontend/package-lock.json
  - .github/workflows/security.yml
updated_at: 2026-10-31
---

# Task Packet: 2026-10-31-frontend-follow-redirects-audit

Target repository: `pantheon-base`
Layer: `platform (frontend dependency lock)`
Delivery tier: `L1`
Mode: unblock the hosted dependency vulnerability gate after a new upstream advisory

## Goal

`Dependency Vulnerabilities` fails on a tree that did not change: `npm audit` for `frontend` reports
`follow-redirects@1.16.1` (reached through `axios@1.20.0`) under GHSA-mrwp-f3q8-3g9p, high,
CWE-201, range `>=1.16.0 <=1.16.1`. `1.16.2` is published and still satisfies the `axios`
constraint, so the fix is a single lock entry refresh rather than a dependency upgrade.

## Primary Layer

platform

## Workspace Context

- Target Repository: `pantheon-base`
- Repository Role: `foundation-source`
- Upstream Dependencies: `none`
- Downstream Consumers: `pantheon-ops` (fixed with the same lock entry in its own repository)
- Sync Expectation: `none`
- Release Requirement: `none`

## Dependency Layers

- `frontend/package-lock.json` (`node_modules/follow-redirects` under `axios@1.20.0`)
- `.github/workflows/security.yml` `Dependency Vulnerabilities` job (`npm audit --audit-level=high`)

## Harness Profile

- Template: api-service
- Overlay: pantheon-base
- Quality Profile: ci-workflow
- Portable Failure Class: dependency-advisory-drift
- Owner Layer: platform
- Coverage Dimensions:
  - method-health

## Contract Anchors

- `frontend/package.json`
- `frontend/package-lock.json`
- `.github/workflows/security.yml`

## Scope

### In

- Refresh `node_modules/follow-redirects` in `frontend/package-lock.json` from `1.16.1` to
  `1.16.2`, leaving every other lock entry untouched.
- Verify the resolved chain, the frontend audit high/critical count and the build.

### Out

- Any other frontend dependency re-resolution, including the 19 moderate advisories.
- Security workflow, gate thresholds or advisory policy changes.
- `frontend/package.json` ranges.
- Foundation release: `frontend/package*.json` are not `sharedPaths`, so no new tag is required.

## Expected Files

### Create

- `docs/harness/tasks/2026-10-31-frontend-follow-redirects-audit.task.md`
- `.harness/tasks/2026-10-31-frontend-follow-redirects-audit/manifest.json`
- `.harness/evidence/2026-10-31-frontend-follow-redirects-audit/commands.json`
- `.harness/evidence/2026-10-31-frontend-follow-redirects-audit/summary.md`
- `.harness/evidence/2026-10-31-frontend-follow-redirects-audit/review.md`
- `.harness/evidence/2026-10-31-frontend-follow-redirects-audit/pr-body.md`

### Modify

- `frontend/package-lock.json`

### Do Not Touch

- `frontend/package.json`
- `.github/workflows/security.yml`
- `foundation-release.lock.json` / `.foundation/foundation-release.lock.json`
- `backend/**` and `frontend/src/**`

## Implementation Notes

- `1.16.0` and `1.16.1` are the only vulnerable releases, so `1.16.2` is the smallest step out.
- `npm audit fix` also re-resolves `@typescript-eslint/*`, `i18next` and `react-i18next`; `npm update`
  rewrites unrelated `libc` fields with the local npm. Both were rejected, and the single
  `version` / `resolved` / `integrity` triple is edited directly instead.
- The lock is then installed with `npm ci` so the edited entries are proven self-consistent.
- No `overrides` entry is added; the resolver keeps owning the version.

## Verification Plan

- `cd frontend && npm ci --ignore-scripts`, then `npm ls follow-redirects`.
- `cd frontend && npm audit --registry=https://registry.npmjs.org --json` with high/critical at zero.
- `cd frontend && npm run lint && npm run type-check && npm run build`.
- Hosted `Dependency Vulnerabilities` and `Security Gates` on the PR and on `main`.

## Linkage

- Task ID: `2026-10-31-frontend-follow-redirects-audit`
- Task Manifest: `.harness/tasks/2026-10-31-frontend-follow-redirects-audit/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Plan References: `docs/harness/tasks/2026-10-31-frontend-follow-redirects-audit.task.md`
- Evidence Directory: `.harness/evidence/2026-10-31-frontend-follow-redirects-audit/`
- Review File: `.harness/evidence/2026-10-31-frontend-follow-redirects-audit/review.md`
- Related packet: `docs/harness/tasks/2026-10-31-v0182-consumer-closeout.task.md`

## Evidence Required

- Audit inventory before (1 high) and after (0 high).
- `npm ls follow-redirects` and frontend lint/type-check/build results.
- Hosted run identity and conclusion for `Dependency Vulnerabilities` and `Security Gates`.

## Human Gates

- None. Lockfile refresh only; no product behaviour, gate policy or credential change.

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
