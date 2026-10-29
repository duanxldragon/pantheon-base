# Smoke suite tiering and module split — verification summary

Task: `2026-10-11-smoke-test-tiering`

## What was wrong

Every pull request paid for the same browser regression, no matter what it touched:

```
quality.yml → smoke-sanity → npm run test:smoke:platform:contracts && npm run test:smoke:system:pages
```

`test:smoke:system:pages` was a single **3709-line file carrying 81 tests across six unrelated
business modules** (`iam`, `config`, `i18n`, `audit`, `org`, `platform`). Changing one i18n label
re-ran the user CRUD, the audit pager, the org dept/post flows and the platform lock-screen tests.

There was also no tier between "static contract, seconds" and "full browser regression, minutes":
the only fast signal was `prebuild`, and the only browser signal was the monolith.

## The split

The repo already publishes a module taxonomy on both sides — `frontend/src/modules/system/` and
`backend/modules/system/` both contain `audit`, `config`, `i18n`, `iam`, `org`, `profile`. The split
reuses that vocabulary rather than inventing one, so spec names, module selection and the source
tree all use the same six words.

| File | Tests | Source |
| --- | --- | --- |
| `system/system-routes.spec.ts` | 18 | the `systemPages` (14) and `workspacePages` (4) loops |
| `system/system-iam.spec.ts` | 9 | user, menu, auth |
| `system/system-config.spec.ts` | 23 | setting, dict, UI preference, refresh sync |
| `system/system-audit.spec.ts` | 11 | login-log, operation-log, session, security-center/event |
| `system/system-i18n.spec.ts` | 5 | i18n workspace, dialogs, CSV import |
| `system/system-org.spec.ts` | 3 | dept, post |
| `system/system-platform.spec.ts` | 12 | lock screen, module registry, cross-cutting + the 4 registrar tests |
| `system/system-pages-helpers.ts` | — | shared scaffolding (non-spec module) |

Total 81 tests, unchanged.

## Tiers

| Tier | Command | Scope | Gate |
| --- | --- | --- | --- |
| L0 | `npm run test:smoke:l0` | smoke wiring contracts, no browser | in `prebuild` |
| L1 | `npm run test:smoke:l1` | `platform:contracts` + `system:routes` | **blocking on every PR** |
| L2 | `npm run test:smoke:module:<name>` | one module | **blocking, only when touched** |
| L2 all | `npm run test:smoke:l2` | every module + platform surfaces + business | manual / pre-release |
| L3 | `npm run test:smoke:all` | everything incl. the viewport matrix | report-only / pre-release |

`scripts/resolve-smoke-modules.mjs` maps changed paths to module suites. **Anything not
unambiguously inside one module escalates to every module** — a shared-core edit can never silently
skip a module's suite. This default is asserted by a unit test, not just documented.

`smoke-core` is deliberately *not* folded into L1: its README states it must stay report-only until
it has been green for several consecutive runs.

## Verification performed

### 1. The split is provably behaviour-preserving

| Check | Result |
| --- | --- |
| Top-level test blocks byte-identical | **59 / 59**, missing 0, extra 0 |
| `systemPages` / `workspacePages` loops preserved | ok |
| `registerSystemWorkspaceTaskDepthSmokeTests` call preserved | ok |
| `beforeEach` present in all 7 specs | ok |
| Helper-region lines preserved in the barrel | **845 / 845** |
| Original import bindings still resolvable | **27 / 27** |

The 67 declaration lines that "differ" differ only by an added `export ` prefix.

### 2. No import was lost — proven by type-checking

`frontend/tests/**` is covered by **neither** `tsc` (`tsconfig.app.json` includes only `src`) **nor**
the CI eslint step (`eslint src --max-warnings 0`). A temporary tsconfig including `tests` was used
to make the refactor statically verifiable, then deleted.

| | Before (monolith) | After (split) |
| --- | --- | --- |
| TypeScript errors | 69 | 69 |
| Normalised error-message multiset | — | **identical (0 new, 0 gone)** |

This is the strongest local proof available: a dropped import shows up here as `TS2304 Cannot find
name`. It caught two real mistakes during the work — `apiBaseUrl` used inside a template literal
(stripped by the analysis) and `formItem` used in the registrar block (not scanned) — both fixed
before the final run.

`eslint tests --max-warnings 0` → exit 0. It caught one false positive: `path` matched as an object
key in a data table, so Node builtins are now never re-exported from the barrel.

### 3. Gates

| Gate | Result |
| --- | --- |
| `npm run type-check` | exit 0 |
| `npm run lint` | exit 0 |
| `npm run prebuild` | all 13 gates pass |
| `check:smoke-coverage-contract` | 34 smoke specs / 20 script entries |
| `check:system-page-admission` | 16 entries |
| `npm run test:smoke:l0` | exit 0 |
| `node --test tests/scripts/resolve-smoke-modules.test.mjs` | 13 / 13 |
| `node scripts/check-duplication.mjs` | PASS |
| harness gates (adoption, doc-links, doc-inventory, sync-drift, method, template, task-packet) | 0 findings |

Two gates pinned the old filename and were updated in the same patch:

- `check:smoke-coverage-contract` derives its counts, so it needed only the README + scripts updated.
- `check:system-page-admission` stores `requiredSmokeAssertions[].file` in
  `frontend/config/system-page-admission.json`. Both entries pointed at the deleted monolith; they now
  point at `system-config.spec.ts`, which is the file that actually contains all four tokens
  (`/system/setting`, `.setting-overview-page`, `/system/setting/security`, `.setting-group-page`).

## Residual risk

- **Playwright cannot run on this host.** Node cannot spawn child processes here — `spawnSync('git',
  ['--version'])` fails with `EBUSY` even with the tool sandbox fully disabled — so the runner cannot
  start Vite or a browser. The executed proof is CI.
- **`tests/` has no static coverage in CI.** Adding it is the obvious follow-up, but it would surface
  69 pre-existing errors, which is a separate remediation.
- **Shared-core changes still run everything.** That is the intended safe default; only unambiguous
  module changes get a narrower run.
- **The new workflow job repeats the mysql/redis service block** already used by four other jobs. The
  duplication gate passes; factoring it out is a larger workflow refactor.
