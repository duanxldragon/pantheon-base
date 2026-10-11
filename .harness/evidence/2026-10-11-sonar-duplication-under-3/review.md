# Review: 2026-10-11 SonarCloud duplication under 3%

## Verdict

**Accept.** The change is a pure extraction of duplicated test scaffolding. No production file is
touched, no assertion is weakened, no test is deleted or renamed, and the extraction was verified
by three independent mechanisms (eslint, a before/after type-error set diff, and a line-level
equivalence proof for the Go file). The projected overall density is ~2.75% against the 3.00%
target, so the target is met with margin rather than by a hair.

## Review points

- **The metric that was failing is not the metric that is gated.** SonarCloud's quality gate tests
  `new_duplicated_lines_density` (3%), and on `main` it reads 1.8% — green. The 3.16% is the
  ungated overall density, and it is the number the 2026-09-01 task packet targeted. Worth stating
  plainly so this is not mistaken for a red gate.
- **The repository's own duplication gate cannot arbitrate this.** `npm run check:duplication`
  reports 1.52% before and after, because its `includeRoots` cover `frontend/src` but not
  `frontend/tests`. That blind spot is precisely where the SonarCloud duplication concentrates.
  Anyone trying to reproduce this work locally must not rely on that gate.
- **The objective is honestly pursued, not gamed.** `.sonarcloud.properties` was not modified, no
  file was excluded, and no fixture content was rewritten. This follows the explicit non-goal in
  `docs/harness/tasks/2026-09-01-sonar-duplication-reduction.task.md`: *"Do not add dependencies,
  change exclusions, or rewrite generated/fixture content to game the metric."* The 62% share
  sitting in test code is the honest, highest-leverage place to work.
- **The largest single win was also the cleanest.** Two 145- and 159-line duplicated ranges in
  `system-pages.spec.ts` turned out to be two near-identical tests of the same template. Extracting
  the template fixed the biggest block *and* made the seven tests readable side by side, so the
  change improves maintainability rather than merely moving lines.
- **Test count preserved.** 59 top-level `test(` declarations before and after, with identical
  titles. The smoke coverage contract still passes for 28 smoke specs and 14 script entries.
- **The Go transformation was proven, not assumed.** `db` becoming unused at 11 sites was the one
  real hazard of collapsing the setup block, and it was found and fixed. The line-level
  equivalence check (809 → 810 significant lines, difference = one closing brace) is stronger
  evidence than "the tests pass", because it bounds what *could* have changed.
- **Deliberate restraint on the secondary-route specs.** Five files share ~280 duplicated lines of
  identical harness that could be moved into the existing `tests/smoke/helpers/` directory. They
  were left alone because those specs run only in the report-only daily `smoke-full` workflow; a
  regression there would surface after merge rather than in the PR. Recorded as headroom rather
  than silently skipped.
- **Verification gaps are stated, not hidden.** `go test` could not be executed locally because the
  sandbox started killing Go process execution mid-session (`go run` on hello-world fails too,
  while `go build` and `go test -c` still work); E2E specs cannot run locally either because Node
  cannot spawn child processes on this host. Both are recorded with the substitute evidence used,
  not presented as local passes.

## Reviewer posture

- Treat the two-file diff as mechanical: if a reviewer sees any changed assertion, expectation,
  route string, permission string or cleanup step, that is a defect — there should be none.
- Do not accept "the local duplication gate passes" as evidence toward this objective; it measures
  a different file set.
- Confirm the hosted SonarCloud re-analysis before closing the objective. The local evidence bounds
  the change; only the cloud metric confirms the outcome.
- The follow-up clusters (secondary-route specs, Go table-driven fixtures, `permission-workbench-remediation.spec.ts`,
  the frontend list pages) are the natural next tranche if a further margin is wanted.
