# Summary — Frontend Unit Tests + Coverage Gates + Release Gate (PR #198)

## What landed

- **Vitest infrastructure**: 13 test files / 132 cases over `frontend/src/core/**` pure logic
  (arcoLocale, formValidation, dateTime, checkPermission, refresh topics/versioning/bus,
  automationPolicy, languagePreference, colorMode) and hooks (useRequest, usePagination,
  useGovernanceRail). Tests live in `frontend/tests/unit/**` per REPOSITORY_LAYOUT §2.2.
- **Per-file coverage thresholds** in `vitest.config.ts`: 80% lines/functions/statements,
  70% branches; untestable files excluded with inline rationale.
- **ci.yml**: `frontend-unit-tests` job (npm ci --ignore-scripts supply-chain hardening);
  Go coverage artifact produced once in Unit Tests and reused by Coverage Gate.
- **quality.yml**: golangci-lint `--new-from-rev=<PR base>` with `fetch-depth: 0` —
  historical debt no longer blocks PRs, new code stays gated.
- **security.yml**: open CodeQL error/critical alerts now fail the Security Summary.
- **release-gate.yml**: pre-release checkpoint — CodeQL zero, Dependabot zero,
  SonarCloud quality gate OK + processed-zero BUG/VULNERABILITY (Bearer auth).

## Red-gate remediation round (second push)

| Gate | Root cause | Fix |
|------|-----------|-----|
| Fast Checks / Frontend Contract | unused import `shouldLoadShellNoticeSummary` | removed |
| Frontend Unit Tests | upload-artifact pinned SHA typo `655e` → `656e` | corrected |
| Docs Governance (structure) | 13 tests in `frontend/src/`; `vitest.config.ts` outside whitelist | `git mv` → `tests/unit/**`; doc-first whitelist registration |
| Secret Scan | gitleaks `curl-auth-user` FP on `curl -u "${SONAR_TOKEN}:"` | Bearer header + `.gitleaksignore` fingerprints for historical commit |
| Go Lint (quality.yml) | shallow checkout → `--new-from-rev` bad object → full-repo debt | `fetch-depth: 0` |
| Coverage Gate | `go tool cover` run outside module context after artifact-reuse refactor | run inside `backend/` |
| Go Lint (ci.yml, push event) | full-repo lint enforced on feature-branch pushes contradicts accepted-debt policy | push events report-only; enforced gate stays in quality.yml PR/merge_group |

## Verification

- `node scripts/harness/check-structure-contract.mjs --strict` → 0 findings / 1130 files
- `npx eslint . --max-warnings 0` → clean
- `npm run test:unit:coverage` → 132/132 passed; gated scope 93.46% stmts / 88.57% branches / 97.77% funcs; per-file thresholds green (exit 0)
- `npx tsc -b` → clean
- Playwright configs all scope `testDir` to `tests/smoke` / `tests/visual` — no collision with `tests/unit`
- Smoke specs unchanged by design: PR touches CI workflows + tests only, no runtime code

## Executor note

Codex (freemodel) quota exhausted until 2026-07-24; relocation executed directly.
All content edits live outside `frontend/src/` (tests/, root configs, scripts/harness, docs);
`frontend/src` was only touched by `git mv` removals.
