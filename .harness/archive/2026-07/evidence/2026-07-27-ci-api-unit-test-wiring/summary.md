# Summary — CI API unit test wiring

## CI remediation

The first hosted run of PR #218 exposed a real environment dependency: `tests/api/auth-smoke-helper.test.ts` launches Playwright Chromium, while the existing frontend unit-test job installed packages only. The local command passed because Chromium was already available. The CI job now uses the repository-pinned Playwright binary to install Chromium with its Linux dependencies immediately before `npm run test:api:unit`; this mirrors the existing smoke and quality workflows and does not add an action, package, permission, or service dependency.

The PR body was also corrected to use the repository's required governance template and artifact linkage. Focused task/evidence/review strict checks and `git diff --check` pass after remediation. Local `actionlint` and `zizmor` are absent, so their hosted workflow gates remain explicit residual validation.

The V1 freeze now exposes all `frontend/tests/api/**/*.test.ts` node:test suites through `npm run test:api:unit` and runs that command in the existing frontend CI test job. The runner discovers nested suites, transpiles each relative-import closure using the repository helper, resolves ESM directory imports to their emitted `index.js` files, and returns non-zero on any failed suite. The nested ESM regression suite verifies both guarantees.

The route-warmup policy test now documents the deliberate exception: refresh-state polling remains active under automated browsers because the refresh-sync smoke requires cross-context propagation verification. This is an expectation correction, not a production behavior change.

Validation: 12 API suites / 39 assertions passed; ESLint, TypeScript, and Prettier passed. `Lint Workflows` actionlint remains a PR-CI human-gate signal because it is absent locally.

Production build: the full prebuild contract chain and Vite production bundle also passed (1375 modules transformed).
