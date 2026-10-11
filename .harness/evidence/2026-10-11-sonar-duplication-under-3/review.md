# Review: 2026-10-11 SonarCloud duplication under 3%

## Verdict

**Accept.** The change is a pure extraction of duplicated test scaffolding plus one ratchet that
closes the blind spot which allowed the regression. No production file is touched, no assertion is
weakened, no test is deleted or renamed, and the extraction was verified by three independent
mechanisms (eslint, a before/after type-error set diff, and a line-level equivalence proof for the
Go file). The projected overall density is ~2.75% against the 3.00% target, so the target is met
with margin rather than by a hair.

## Review points

- **The metric that was failing is not the metric that is gated.** SonarCloud's quality gate tests
  `new_duplicated_lines_density` (3%), and on `main` it reads 1.8% — green. The 3.16% is the
  ungated overall density, and it is the number the 2026-09-01 task packet targeted. Worth stating
  plainly so this is not mistaken for a red gate.
- **The repository's own duplication gate could not arbitrate this — and now can.** Before this
  change `npm run check:duplication` reported 1.52% while SonarCloud reported 3.16%, because the
  gate's `includeRoots` covered `frontend/src` but not `frontend/tests` — precisely where the
  duplication concentrates. That is the mechanism by which the density doubled from 1.61% to 3.16%
  with the local gate never going red. The gate's scanned set was therefore widened to include
  `frontend/tests`; it now reports 1.62% against the unchanged 3.00% threshold. Anyone reproducing
  this work should note the number moved for *visibility* reasons, not because the tree got worse.
- **The ratchet is the right shape.** The failure class (duplication growing back in unscanned test
  code) had already recurred, so per `docs/acceptances/TASK_PACKET_BASE_TEMPLATE.md:213` the
  ratchet cannot be `no-repeat-observed`. Adding a control is required, and the control chosen is
  the cheapest one that actually covers the failure: one line in `includeRoots`. The threshold was
  **not** relaxed, no file was excluded, and no dependency was added.
- **The ratchet was measured before it was written.** The widened scope was probed with the gate's
  own `analyzeDuplication()` first — 1.62% (784 files), with `frontend/tests` in isolation at 2.24%
  — so the change was known to leave 1.38pp of headroom rather than being hoped to. The gate's own
  unit tests were run afterwards: 2 pass / 0 fail.
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
  while `go build` and `go test -c` still work); the Playwright specs cannot run locally either
  because Node cannot spawn child processes on this host. Both are recorded with the substitute
  evidence used, not presented as local passes.

## Reviewer posture

- Treat the two-file diff as mechanical: if a reviewer sees any changed assertion, expectation,
  route string, permission string or cleanup step, that is a defect — there should be none. The only
  non-test file is `scripts/check-duplication.mjs`, where the sole change should be the added
  `'frontend/tests'` entry in `includeRoots`.
- Do not accept the local duplication gate as *proof* of the cloud metric: it normalises lines
  differently and scans a different file set. After the ratchet it can catch a local regression of
  this class, but only the hosted re-analysis confirms the outcome.
- Confirm the hosted SonarCloud re-analysis before closing the objective. The local evidence bounds
  the change; only the cloud metric confirms the outcome.
- The follow-up clusters (secondary-route specs, Go table-driven fixtures, `permission-workbench-remediation.spec.ts`,
  the frontend list pages) are the natural next tranche if a further margin is wanted.
