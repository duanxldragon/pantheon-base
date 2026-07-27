# Summary — CI API unit test wiring

The V1 freeze now exposes all pure `frontend/tests/api` node:test suites through `npm run test:api:unit` and runs that command in the existing frontend CI test job. The runner discovers every `*.test.ts` file, transpiles its relative-import closure using the repository helper, and returns non-zero on any failed suite.

The route-warmup policy test now documents the deliberate exception: refresh-state polling remains active under automated browsers because the refresh-sync smoke requires cross-context propagation verification. This is an expectation correction, not a production behavior change.

Validation: 11 API suites / 37 assertions passed; ESLint, TypeScript, and Prettier passed. `Lint Workflows` actionlint remains a PR-CI human-gate signal because it is absent locally.

Production build: the full prebuild contract chain and Vite production bundle also passed (1375 modules transformed).
