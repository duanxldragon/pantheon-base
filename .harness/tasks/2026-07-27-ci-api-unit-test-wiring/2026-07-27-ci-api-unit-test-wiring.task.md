# Task Packet: ci-api-unit-test-wiring

## Goal

Make every existing pure `frontend/tests/api/*.test.ts` suite a required CI signal for the V1 freeze without changing product behavior or adding a dependency.

## Primary Layer

platform

## Dependency Layers

- ci-workflow

## Harness Profile

- Template: admin-platform
- Overlay: ci-workflow
- Coverage Dimensions:
  - behaviour
  - maintainability
  - architecture-fitness
  - runtime-quality
  - method-health
- Quality Profile: ci-workflow
- Portable Failure Class: repo-quality-gate
- Owner Layer: consumer repository
- Ratchet Decision: gate-updated
- Delivery Governance: parent V1 freeze plan; this is an independently reviewable CI batch.
- GitHub Signal: required after PR CI passes.
- Deferred Code Issues: actionlint is validated by the existing CI job because it is not installed locally.

## Scope

### In

- Reusable Node runner for every `tests/api/*.test.ts` suite.
- `test:api:unit` package script.
- Invocation in the existing frontend CI test job.
- The automation-policy test expectation documenting intentional refresh polling.
- This task packet, command evidence, summary, and review.

### Out

- Production runtime behavior and request flow.
- Backend code and database changes.
- Browser smoke coverage expansion.
- `pantheon-ops` files and unrelated CI/workflow changes.

## Assumptions and Open Questions

- The API suites require no service. One browser-storage suite launches the repository-pinned Playwright Chromium, so the existing frontend CI job installs Chromium explicitly before running the API test command.
- The PR CI `Lint Workflows` job owns the remaining actionlint validation.

## Minimum Viable Approach

Reuse the repository TypeScript transpilation helper and current CI frontend-test job. Add one runner and one explicit command; add no package or workflow-permission changes.

## Success Criteria

- All discovered `tests/api/*.test.ts` suites execute through one command and a failure produces a non-zero exit.
- API tests, ESLint, TypeScript, and touched-file formatting pass locally.
- Task packet, evidence, and review have valid reciprocal linkage.

## Contract Anchors

- `AGENTS.md`
- `docs/harness/AI_QUALITY_GOVERNANCE.md`
- `.github/workflows/ci.yml`
- `frontend/scripts/transpile-typescript-files.mjs`

## Expected Files

### Create

- frontend/scripts/run-api-unit-tests.mjs
- .harness/tasks/2026-07-27-ci-api-unit-test-wiring/2026-07-27-ci-api-unit-test-wiring.task.md
- .harness/tasks/2026-07-27-ci-api-unit-test-wiring/manifest.json
- .harness/evidence/2026-07-27-ci-api-unit-test-wiring/commands.json
- .harness/evidence/2026-07-27-ci-api-unit-test-wiring/summary.md
- .harness/evidence/2026-07-27-ci-api-unit-test-wiring/review.md

### Modify

- .github/workflows/ci.yml
- frontend/package.json
- frontend/tests/api/route-warmup-policy.test.ts

### Do Not Touch

- backend/**
- pantheon-ops/**
- production request/runtime code
- CI permissions and external actions

## Structural Scope

- Affected Subgraph: tests/api → frontend TypeScript transpiler → CI frontend test job.
- Boundary Crossings: CI invokes a repository-local package script.
- Risk Nodes: ESM/CJS transpilation and automated-browser refresh polling assertion.
- Graph Focus: no production request path, runtime import, cycle, hub, or call depth is changed.

## Implementation Notes

- The runner discovers every `*.test.ts` entry and transpiles its relative-import closure using the repository helper.
- It returns a non-zero exit for no tests, unresolved imports, or a failed suite.
- Refresh polling remains enabled under automated browsers because the refresh-sync smoke needs cross-context propagation; only the stale test expectation changes.

## Verification Plan

- `cd frontend && npm run test:api:unit`
- `cd frontend && npm run lint`
- `cd frontend && npm run type-check`
- `cd frontend && ./node_modules/.bin/prettier.cmd --check package.json scripts/run-api-unit-tests.mjs tests/api/route-warmup-policy.test.ts`
- PR CI `Lint Workflows` for actionlint.

## Evidence Required

- Command summary for all local deterministic gates.
- Review proving the runner propagates failures and does not alter product runtime.
- PR CI actionlint result before merge.

## Human Gates

- PR CI Lint Workflows actionlint result.
- The parent V1 release gate after every freeze phase is complete.

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
- [x] Existing transpile helper reused; no dependency added.
- [ ] PR CI actionlint passes.

## Linkage

- Task ID: 2026-07-27-ci-api-unit-test-wiring
- Task Manifest: `.harness/tasks/2026-07-27-ci-api-unit-test-wiring/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: none; parent handoff is Claude session `aff7e630-4d1d-4395-96e3-7aae3530fa93`.
- Evidence Directory: `.harness/evidence/2026-07-27-ci-api-unit-test-wiring/`
- Review File: `.harness/evidence/2026-07-27-ci-api-unit-test-wiring/review.md`
