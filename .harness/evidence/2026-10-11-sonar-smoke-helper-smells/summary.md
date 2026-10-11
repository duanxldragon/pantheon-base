# SonarCloud smoke-helper smells — verification summary

Task: `2026-10-11-sonar-smoke-helper-smells`

## What happened

PR #373 merged at 10:51 UTC and the main Release Gate went red:
`Release blocked: 17 unresolved SonarCloud issue(s)` — while the SonarCloud quality gate for the
merge commit itself was **OK**.

The 17 findings are all CODE_SMELL (16 MINOR, 1 MAJOR) and all sit in one file:
`frontend/tests/smoke/system/system-pages-helpers.ts`. Root cause: SonarCloud automatic analysis
only raises issues on code it has not analysed before. The same helper lines lived inside
`system-pages.spec.ts` with **0 issues ever recorded** against that component; the split
re-classified every moved line as new code and surfaced 17 latent smells at once.

## The fix (behaviour-preserving by construction)

| Rule | Count | Fix |
| --- | --- | --- |
| S7763 import-plus-re-export | 4 | Converted to `export { ... } from` re-exports; verified first that all 4 symbols have no in-file usage |
| S7503 async without await | 1 | Removed the `async` keyword from `waitForOkApiResponse`; it returns the same `Promise` |
| S4043 mutating reverse in iteration | 1 | Hoisted `targets.reverse()` to its own statement before the `for...of` loop (children-first dept deletion order preserved) |
| S9382 await inside loop | 11 | `// NOSONAR` with a written justification each — these are deliberate sequential fixture semantics: children-first dept deletion, per-delete header fetching, ordered permission seeding, sequential auto-retrying assertions |

The NOSONAR route for the 11 S9382 sites is a deliberate trade-off: parallelising with
`Promise.all` would change fixture behaviour that CI already validated (e.g. parallel parent/child
dept deletes could race and silently drop a swallowed delete), and Playwright cannot execute on
this host to re-verify. Repo convention for justified NOSONAR already exists
(`backend/pkg/testmysql/mysql.go`, `i18n_service_fast_test.go`).

## Local verification

- `eslint tests/smoke/system/system-pages-helpers.ts --max-warnings 0` → clean
- `node frontend/scripts/check-smoke-coverage-contract.mjs` → passed (34 specs / 20 script entries)
- `node scripts/check-pr-governance.mjs` → OK

## CI verification (authoritative)

- SonarCloud main re-analysis of the merge commit must report `resolved=false` total = 0.
- Release Gate (incl. the SonarCloud Gate and unprocessed-issues steps) must return to success.
