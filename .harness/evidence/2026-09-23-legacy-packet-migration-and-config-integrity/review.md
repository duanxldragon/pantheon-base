# Self-review — 2026-09-23 legacy packet migration and config integrity

Reviewer posture: self-review against the harness contract and the gates this
round changes. Implementation and review share an author, so the findings below
rest on measurements (before/after lint runs, trace timing, negative probes)
rather than on reading.

## Scope check

Every item traces to a deferral the previous packet named, not to new scope:

| Item | Where it was recorded |
| --- | --- |
| 17 pre-template task packets | `2026-09-23-governance-residual-closeout` `scope.out` and `technicalDebtNote` |
| `.golangci.yml` v1-only keys | same packet's `scope.out`; the explanation lives in the `verify: false` comment in `ci.yml`/`quality.yml` |
| generated-smoke `module-governance-real.spec.ts` | same packet's `scope.out` ("the flaky full-smoke generator suite") |

## Risk points examined

- **Did the migration invent facts?** No. Every populated section is derived from
  the packet's own manifest plus the prose already in the doc: goal, primary
  layer, dependency layers, harness profile, contract anchors, scope, expected
  files, verification plan, human gates and checklist all exist in structured form
  in `.harness/tasks/<id>/manifest.json`. Where a manifest had no `expectedFiles`
  (the older release packets), the section states the change areas the doc already
  described rather than inventing paths.
- **Were the checker's enum constraints respected?** Yes, and deliberately without
  rewriting the historical manifests. Four manifests carry a `primaryLayer` outside
  the checker's enum; the checker validates the doc, so the docs declare valid
  values and the manifests are left as records. Only the docs changed.
- **Is emptying the allowlist safe rather than merely tidy?** The allowlist is kept
  as a file with `entries: []`, not deleted, so the staleness rule stays armed: a
  future entry for a non-existent doc exits 1, proved by probe. Deleting the file
  would have the same effect by absence, but keeping it documents *why* the list is
  empty.
- **Was the golangci config fixed at the source or worked around?** At the source.
  The three keys were removed or relocated; nothing was silenced and no rule was
  dropped except the two that were provably redundant (`goconst.ignore-tests`
  against the `_test\.go` rule, and the `generated_.*\.go` name rule against
  `generated: strict` plus the standard marker both registries carry). `verify` is
  back on, which is the opposite of a workaround.
- **Did that change alter effective lint behaviour?** Yes, deliberately and in the
  intended direction: exclusions that had never applied now do. Measured as 3
  test-file findings → 0 in the setting package, and the new-code gate scope stays
  at `0 issues`, so no previously-suppressed finding was unmasked.
- **Is the smoke change a budget increase in disguise?** No. The budget is a
  consequence of the structural fix, not the fix: the navigation now has its own
  slice instead of sharing one predicate window with the assertion. The evidence
  is that attempt 1 previously could not pass at any budget, because a single
  `goto` consumed the whole window before returning; the retry passed in 6.5s on
  the same code, which rules out a genuine timeout shortage.
- **Could the smoke change mask a real regression?** The assertion is unchanged in
  what it requires (`/system/modules` URL, the `business.orderqa` row, then the
  `待激活|已接入` text). Only the budgeting of the wait changed, and the API
  readiness poll above it still gates the module actually being registered.
- **Does anything here touch runtime behaviour?** No product code, no API, no
  permission, menu, i18n, schema or seed change. The only runtime-adjacent edit is
  a test's wait strategy.

## Findings

None blocking. Two follow-ups worth naming rather than fixing here:

1. **The Full Smoke Suite is not in the PR gate set.** This round changed a smoke
   spec that GitHub only exercises on a manual dispatch, on push to `main`, or on
   the nightly schedule. The fix is therefore verified by a dispatched run, but a
   future regression in this file would not surface on a PR.
2. **`golangci-lint config verify` is not hermetic.** It fetches its JSON schema
   over the network and timed out intermittently on this host. CI egress is
   reliable, so the gate is sound there, but the local equivalent can fail for
   environmental reasons — which is exactly the ambiguity this round removed from
   the Go Lint job and would be worth eliminating locally too.

## Deferred

- **`check-boundaries.mjs` stays report-only** with 5 unbaselined findings
  (1 platform type import, 4 auth shared-CSS imports). Promoting it to a blocking
  gate — or baselining the findings — is a quality-gate policy decision, which is a
  maintainer touchpoint, not an agent one. State is unchanged by this round.
- **No sensor for navigation-inside-retry.** The defect was a single latent
  instance, not a repeat, so adding a regex gate over Playwright callbacks was
  judged premature; the measured comment in the spec is the guard for now.
- **pantheon-ops synchronization** remains deferred with its earlier recorded
  blocker (a dirty ops worktree owned by another session). Untouched here.

## Verdict

All three in-scope deferrals are closed at their source, two of them with a guard
that keeps the class from returning (the armed allowlist staleness rule; `verify:
true` in both workflows). Measured evidence exists for each claim that matters:
the lint before/after, the trace timing that identifies the smoke root cause, and
a dispatched Full Smoke run for the browser flow. Gates green: task-packet,
doc frontmatter/links/inventory/encoding, structure contract, golangci
`config verify` and new-code lint, frontend type-check, eslint, smoke coverage
contract, task-packet template. The items under Deferred stay explicitly open.

## Machine Readable
```json
{
  "taskId": "2026-09-23-legacy-packet-migration-and-config-integrity",
  "verdict": "approved with documented P2 follow-up",
  "findings": [],
  "residualRisks": [
    "The Full Smoke Suite is not part of the PR gate set, so the generated-smoke fix is verified by a manual dispatch plus post-merge main runs; a regression in that spec would not surface on a pull request.",
    "golangci-lint config verify fetches its JSON schema over the network and timed out intermittently on the reviewing host, so the local equivalent of the newly re-enabled CI check is not hermetic.",
    "check-boundaries.mjs remains report-only with 5 unbaselined findings; promoting it to blocking is a maintainer quality-gate policy decision and was not taken in this round.",
    "No static sensor forbids a page navigation inside a Playwright retry callback. This was one latent instance rather than a repeat, so a regex gate was deliberately not added; it is recorded as a deferred option.",
    "The migrated packets declare a valid Primary Layer while four of their historical manifests still carry a value outside the checker's enum; the manifests were deliberately left as records rather than rewritten.",
    "pantheon-ops synchronization remains deferred with its earlier recorded blocker and is untouched by this round.",
    "This is a self-review: implementation and review share an author, and the only non-local verification is CI (dispatched smoke plus PR checks)."
  ],
  "structuralReview": {
    "affectedSubgraph": [
      "docs harness task packets and the task-packet checker exemption list",
      "backend golangci-lint configuration and the two CI jobs that run it",
      "frontend generated-business smoke spec wait strategy"
    ],
    "checks": ["cycle", "hub", "call-depth", "sensitive-flow"],
    "findings": [],
    "notes": "Documentation and configuration only; no call path is added anywhere. The golangci change is a config-key relocation whose only behavioural effect is that pre-existing exclusion rules start applying, which removes findings rather than admitting new input. The smoke change reorders waits inside one test and does not alter what is asserted or which endpoints are exercised. No new dependency, no new script, no new CI step; the two workflow edits only flip an existing action input."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-09-23-legacy-packet-migration-and-config-integrity/manifest.json",
    "evidence": ".harness/evidence/2026-09-23-legacy-packet-migration-and-config-integrity/commands.json",
    "reviewFile": ".harness/evidence/2026-09-23-legacy-packet-migration-and-config-integrity/review.md",
    "changeRef": "none",
    "planRefs": [
      ".harness/tasks/2026-09-23-governance-residual-closeout/manifest.json"
    ]
  }
}
```
