# Review: 2026-10-26-pr427-ci-gate-closure

## Verdict

approved with documented P2 follow-up

## What was claimed, and what is measured

PR #427 reached the hosted chain with four red signals on head `e4a70094` and acquired a fifth during the repair. Each is
closed by a reading of the thing that flagged it, not by a restatement of intent:

- `golangci-lint run --new-from-rev=main ./...` (the CI form): 5 findings → **`0 issues.`, exit 0**; `go build ./...`,
  `go vet ./modules/system/...` and `gofmt -l .` all silent.
- SonarCloud PR gate for #427: 10 unresolved issues and 3.62% new-code duplication → live web-api reading of
  **`status: OK`** on all five conditions with `new_duplicated_lines_density` actual **0.8** against threshold 3, and
  `issues/search?resolved=false` **`total: 1`** — the last one (`typescript:S3626`) being a finding this round's own
  fixture repair introduced and removed in the same round.
- Hosted `PR Smoke Modules` on head `76e3bdb6`: 'Touched smoke suites: `test:smoke:module:all`', **exactly one failed case**,
  and it is the spec this round repairs (`permission-workbench-remediation-real.spec.ts:141`, failing on
  `expect(before.governanceStatus).toBe('pending')`). Every other suite in that job is green, which is the measured statement
  that the earlier 400-class fixture failures are gone.
- `node scripts/fetch-github-feedback.mjs --check --repo duanxldragon/pantheon-base --pr 427` → **exit 0**, and the hosted
  `GitHub Feedback Prereq` job reports pass.
- Local strict matrix (24 checkers): 21/24 on the first run of this round → **all 24 exit 0** once this round's own
  packet, manifest and evidence set exist.

## Why this counts as a fix rather than a silence

- No linter rule, threshold, scan set or enable list was edited; no baseline entry was added; no failing test was skipped or
  deleted; the Sonar Quality Gate definition is untouched. Every repair is in source, test, or docs.
- The `gosecurity:S3649` BLOCKER is suppressed, not deleted — and the suppression moved to the line Sonar actually reports
  (by hoisting the update map into a variable) rather than by turning the rule off. This is the same disposition
  `tenant_service.go:871/886` already records, per the standing policy 'rules unchanged, false positives suppressed in code'.
- The duplication came down by **deleting a copy** (the table shell, four loading branches and the cell renderers that
  `TenantOverview.tsx` and `TenantMemberList.tsx` each carried), not by asking for a higher threshold: 198/5462 → 0.8%.
- The two `PR Smoke Modules` password failures were closed by retargeting the locators at `input[type=password]`, which is what
  `tests/smoke/helpers/auth.ts:82` already did. The accessible names given to the visibility toggle in the previous round stay —
  the a11y work is not the regression, the locator's substring match is.
- The CodeQL alerts are the same `js/file-access-to-http` instance class already dismissed five times on this fixture family
  with `used in tests`; alerts 95-96 got the same recorded rationale rather than a new one. `SECURITY.md` > GitHub Security
  Surfaces authorises exactly this: fix, or dismiss with a reason.
- CI-08 is the honest one. The root cause is a behaviour this branch adds deliberately (saving a role syncs the API routes its
  permission keys declare), and the correct fix is arguably uncomfortable: the fixture asked for a grant that was already in
  place. The round chose to teach the fixtures to accept `permission.policy.exists` — and only that message, so a genuine
  failure still goes red — instead of making `POST /system/permission` an idempotent upsert, which would have removed a conflict
  the permission page form depends on.
- The new differential is real: with the revoke step deleted, the remediation spec fails at its own gap assertion; restored, it
  passes. That is the proof the repair is causal, not a relaxed expectation.

## Points a reviewer should challenge about this round itself

- **Does accepting `permission.policy.exists` hide a broken grant?** It can hide a *different* problem at the same address: any
  non-200 envelope whose message happens to be that key now passes, and the envelope code cannot distinguish them (no 409
  sentinel — `CodeForError` maps `ErrConflict` to 400). The mitigation is that the assertion is on the message, not the code, so
  a validation or permission error still fails the fixture. A stronger version would pre-read `GET /system/permission/list` and
  require the row to exist before accepting the conflict; the remediation spec now does exactly that shape of check via
  `dropPolicy`, and the fixtures were left minimal on purpose.
- **Is revoking a policy to create a gap gaming the test?** It changes what the case proves, and that has to be said plainly: the
  case is no longer 'saving a role leaves a hole the workbench can fill', it is 'a hole that exists can be filled'. The first
  claim is now unexercised by any smoke spec. It is still covered in the unit layer by
  `backend/modules/system/iam/role`'s sync tests; if a reviewer wants the end-to-end version back, the honest way is a role whose
  permission keys have **no** binding entry, which is a new case rather than a mutation of this one.
- **Is the local `pagination-contract` failure being waved away?** Three readings of one command disagree (fail under load,
  fail at 30s + `--timeout=120000` at a different line, pass alone in 20.4s), and the hosted job that runs the same suite reports
  it green. Recording it as a known gap with all three readings is the honest form; raising the timeout or dropping the file would
  not be. If it recurs on a quiet host it is a real finding, not an environment note.
- **Was the `0 issues` lint claim over-read?** No, and the counter-reading is in the same file: the bare
  `golangci-lint run ./...` reports 73 repo-wide findings (goconst 10 / gosec 13 / revive 50) that the gate never sees because CI
  lints `--new-from-rev`. CI-07 exists precisely so the green is not mistaken for a clean repository.
- **Why are the governance artifacts of this round red at first?** Because they were incomplete: the packet was written without
  the template's 13 sections, the manifest stored `implementationNotes` as prose where the checker requires a string array, and
  `commands.json` did not exist yet. All three are this round's own work, and each was repaired by completing the artifact rather
  than by adjusting a checker — which is the same class FR-016/FR-017 describe, only self-inflicted rather than inherited.
- **Green because verified, or because unobserved?** Both are partly true. The hosted `golangci-lint` step is
  `continue-on-error: true`, so the step reads success while `steps.go-lint.outcome` is failure and the real red is
  `Enforce go-lint gate` (CI-06). And five strict checkers still have no npm script and no workflow. Fixing the workflow
  expression and promoting the checkers are gate-policy decisions and were left to the maintainer rather than taken silently.

## Explicitly not run

- `test:smoke:system` in full and the tenant/business smoke tiers on this host — the hosted `test:smoke:module:all` run is the
  authority for those, and the batch executed here covers the suites that consume the changed fixtures.
- The next Sonar analysis of the pushed head. The `1 → 0` open-issue step is a code fact here, not a hosted reading.
- Any write-side plan/quota behaviour: quotas remain display-only under contract V1.5, so nothing in this round changes what a
  tenant can do.
- Historical rounds' own verification commands. `git diff -- .harness/evidence` adds only this round's directory.

## Residual risk accepted

The branch's role-save sync is now load-bearing for three smoke fixtures: whenever `requiredAPIRoutesByPermission` gains an entry
for a key a fixture provisions, the fixture's POST becomes a conflict again. The tolerance absorbs it, but the coupling is real and
invisible from the binding table alone. Second: the remediation spec's meaning narrowed as described above. Third: the hosted
`Smoke Sanity` / `PR Smoke Modules` jobs share a runner and a 30s budget, so a load-driven flake in a mocked spec can still go red
for reasons this round cannot fix locally. Fourth: `mergeStateStatus` is `BLOCKED` with an empty `reviewDecision` — CI is not the
last word; the required-review check is, and that is a human gate.

## Machine Readable

```json
{"taskId":"2026-10-26-pr427-ci-gate-closure","verdict":"approved with documented P2 follow-up","verdictRationale":"Approved on measured readings rather than intent: the CI-form golangci-lint run reports 0 issues/exit 0 (with the bare run's 73 repo-wide findings recorded as the counter-reading so the 0 is not mistaken for a clean repository); go build/vet/gofmt are silent; PANTHEON_TEST_DSN_REQUIRED=true against live MySQL gives 12 packages ok, 0 FAIL, 0 skips, and the same command without a sourced DSN is recorded as failed because that is the skip-masking guard working; the SonarCloud PR web-api reads status OK with new_duplicated_lines_density 0.8 against threshold 3 (from 198/5462 = 3.62%) and exactly 1 unresolved issue, a typescript:S3626 that this round's own fixture repair introduced and removed in code; the hosted PR Smoke Modules job on head 76e3bdb6 reports a single failing case, which is the CI-08 second-order regression this round repairs, and every other suite in that job is green; fetch-github-feedback --check exits 0 with CodeQL alerts 95-96 dismissed under the rationale already recorded on alerts 90-94. Nothing was weakened to get there: no rule, threshold, scan set, enable list, baseline entry or Quality Gate definition was edited, no test was skipped or deleted, the S3649 suppression moved to the line Sonar reports instead of disabling the check, and the repaired remediation spec was proven causal by deleting its revoke step and watching it fail at its own assertion before restoring it. Outstanding items are explicit and belong to others: the pushed head's hosted re-run, one narrowed test claim (the case now fills a hole that exists rather than proving saving a role leaves a hole), a locally load-sensitive pagination-contract reading the hosted job reports green, the continue-on-error golangci step (CI-06), five strict checkers still unobserved by CI (FR-016/FR-017), and mergeStateStatus BLOCKED with an empty reviewDecision, which is a human gate rather than a red test.","linkage":{"taskManifest":".harness/tasks/2026-10-26-pr427-ci-gate-closure/manifest.json","evidence":".harness/evidence/2026-10-26-pr427-ci-gate-closure/commands.json","reviewFile":".harness/evidence/2026-10-26-pr427-ci-gate-closure/review.md","changeRef":"none","planRefs":["docs/contracts/TENANT_CONTRACT_V1.md","docs/harness/tasks/2026-10-26-tenant-plan-assignment.task.md","docs/harness/tasks/2026-10-26-login-accessibility-and-lang.task.md","docs/harness/tasks/2026-10-26-governance-red-checkers-closure.task.md"]}}
```

> This block is written natively by the round that produced the artifacts. Two facts were corrected while writing it: the
> remediation case's claim after the repair is narrower than its name suggests (it fills a gap that exists, it no longer proves
> that saving a role leaves one), and the local `pagination-contract` reading needed three runs to disagree with itself, so it is
> recorded as a gap with all three readings rather than as a pass.
