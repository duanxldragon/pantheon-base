## Change boundary

- Owning layer: `platform` / `ci-workflow`
- In: API unit-test runner, package script, existing frontend CI job invocation, one stale assertion correction, and L2 evidence.
- Out: product runtime code, backend, dependencies, workflow permissions, `pantheon-ops`, and browser-smoke expansion.

## Affected subgraph

`frontend/tests/api` → repository TypeScript transpile helper → `npm run test:api:unit` → CI frontend-test job.

## Verification

- `npm run test:api:unit` — 11 suites / 37 assertions passed.
- `npm run lint` — passed.
- `npm run type-check` — passed.
- `npm run build` — all prebuild contracts and Vite production build passed.
- Touched-file Prettier — passed.
- Harness task packet/evidence/review strict checks — passed.

## Evidence

- `.harness/evidence/2026-07-27-ci-api-unit-test-wiring/commands.json`
- `.harness/evidence/2026-07-27-ci-api-unit-test-wiring/summary.md`
- `.harness/evidence/2026-07-27-ci-api-unit-test-wiring/review.md`

## Known gap / CI triage

Local `actionlint` is not installed. The affected hosted gate is **Lint Workflows**; its actionlint step is the remaining required PR-CI signal. There is no local workflow failure to triage. The runner adds no permissions or external action and uses the existing `npm ci` / local-node-modules path.
