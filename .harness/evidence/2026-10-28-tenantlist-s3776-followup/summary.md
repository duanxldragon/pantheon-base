# Summary — 2026-10-28-tenantlist-s3776-followup

## What went wrong before

`2026-10-28-release-gate-green` (PR #463) listed the `typescript:S3776` finding on
`frontend/src/modules/system/iam/tenant/TenantList.tsx` as cleared, and described
the remedy as collapsing five `isAdmin || hasPerm('...')` sequences into one
`can(perm)` helper. The merge happened, and `main`'s next SonarCloud analysis
(revision `1ae6481c`, 2026-10-28T14:19Z) still reports the same issue:

```
AaF89PoZ78TOH8UMk82y | typescript:S3776 | TenantList.tsx:116
Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.
```

Re-measuring the file that `main` actually carries, with the rule SonarCloud
reports (`eslint-plugin-sonarjs@3` → `sonarjs/cognitive-complexity`, threshold
15), reproduces it exactly: `116:33` = **16**.

The helper was behaviourally sound but metrically neutral: the rule does not
increment for logical-operator sequences inside a plain `const` initializer, so
five collapsed `||` expressions moved nothing. `can(perm)` stays — it is a valid
de-duplication — but it was never the fix.

## What the real contributor was

The component body resolved its four display states with an inline
`let bodyContent; if … else if … else` chain, on top of the JSX conditional
expressions. At threshold 4 — lowered only to read the raw values — the whole 16
sits in that one function:

| Unit | Before (#463 `main`) | After |
| --- | ---: | ---: |
| `TenantList` component | 16 | **10** |
| `renderBody()` (new) | — | **5** |

## The change

The four-state chain moves into a component-local `renderBody()` and the JSX
renders `{renderBody()}` instead of `{bodyContent}`. Every state is preserved
verbatim:

| State | Predicate | Returns |
| --- | --- | --- |
| compat guide | `!tenantModeEnabled` | `Space` + `PageEmpty` + `Button` → `navigate('/system/setting/platform')` |
| first load | `loading && tableData.length === 0` | `<PageLoading />` |
| request error | `error && tableData.length === 0` | `<PageRequestError onRetry={() => void loadData(query)} />` |
| table | otherwise | `tableContent` |

Order, predicates, returned elements, class names (`tenant-list__compat-guide`),
i18n keys (`system.tenant.compat.desc`, `.action`) and the `onRetry` body are
identical. The function is nested inside the component, so it closes over
`tenantModeEnabled`, `loading`, `error`, `tableData`, `t`, `navigate`,
`loadData`, `query` and `tableContent` with no new props, types or imports.

## Measurement

Done in `/d/tmp/sonarcheck` — outside the repository, because the plugin is not a
repository dependency:

| Run | Readout |
| --- | --- |
| threshold 15, `main`'s file (`1ae6481c`) | `116:33` — 16 |
| threshold 15, pre-#463 file (`origin/main`) | `116:33` — 16 (control: the helper was neutral) |
| threshold 15, new file | no findings, exit 0 |
| threshold 4, `main`'s file | `116:33` — 16 |
| threshold 4, new file | `116:33` — 10, `632:42` — 5 |

## Verification

| Command | Readout |
| --- | --- |
| `npm run lint` | clean |
| `npm run type-check` | clean |
| `npm run build` | built in 528ms |
| `check:task-packet` | PASS (only the expected pre-review warning) |
| `check:structure` | 0 findings / 2888 tracked files |
| `check:harness-encoding` | 0 findings / 2540 scanned files |
| `check:docs-frontmatter` | 393 docs, 275 with frontmatter |
| `check:harness-docs` / `check:harness-inventory` | 0 / 0 findings |
| `check:ui-quality-gate` | 0 findings |
| `check-failure-registry --strict` | 0 errors, 0 warnings |
| `check-evidence --strict` / `check-review --strict` | exit 0 / exit 0 |

## Ratchet

The failure is not "the complexity was 16" — that was already tracked. It is that
a static-analysis fix was asserted from reading the diff and merged without a
re-measurement, so the red main-branch gate survived a merge. Recorded as
`FR-018` (`maintainability` / `static-sensor-gap`) and closed by a guide change:
`docs/harness/AI_QUALITY_GOVERNANCE.md` §5.2 now requires static-analysis fixes
to be re-measured with the same rule, with before/after readings recorded before
commit. The sensor stays manual because `sonarcloud-gate` already owns the
authoritative reading; what was missing was the pre-commit measurement.

## Explicit gaps

- The SonarCloud issue only closes after this branch merges and the next `main`
  analysis finishes; local proof is the same rule on the same file.
  **Resolved:** see "Post-merge verification" below.
- The measurement plugin is not a repository dependency, so the §5.2 rule is
  honoured by hand. Making it a gate would be a dependency and CI-policy
  decision for the maintainer.
- No browser run was made for this packet: the change is a predicate-for-predicate
  extraction with an unchanged rendered surface, and CI `PR Smoke Modules`
  exercises the tenant console page.

## Post-merge verification (2026-10-28T15:0xZ)

| Reading | Value |
| --- | --- |
| PR | #464, merged 15:01:04Z as squash commit `7ceee624` |
| PR checks | 35 passed, 2 skipped; `SonarCloud Code Analysis` passed on the PR in 34s |
| `Release Gate` on `main` @ `7ceee624` | run `40711689652` — **success**, every job green (Open PRs, Dependabot Alerts, CodeQL Alerts, Candidate Checks, SonarCloud Gate, Release Gate Summary) |
| SonarCloud open issues on `main` (analysis `7ceee624`) | **0** — `AaF89PoZ78TOH8UMk82y` is gone |
| Dependabot open alerts | **0** |

The earlier `main` run `40704728582` (on `1ae6481c`) stays recorded as a failure:
it carried both the Sonar row this packet fixes and the Dependabot-refresh race
from the previous packet. The next push superseded it, which is why the green
reading above is on `7ceee624`.

