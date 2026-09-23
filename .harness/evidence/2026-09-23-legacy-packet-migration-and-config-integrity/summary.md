# Summary — 2026-09-23 legacy packet migration and config integrity

Closes the three items `2026-09-23-governance-residual-closeout` recorded under
`scope.out`. Nothing new was opened: each item was already named as a deferral by
the round that found it.

## 1. Legacy task-packet migration (17 files)

`config/task-packet-legacy-docs.json` was introduced by the previous round as an
explicit, reviewable allowlist for the 17 packets written before the
section-based template existed. That round recorded emptying it as out of scope.
This round performs the migration instead of extending the exemption.

Each of the 17 packets was rewritten to the current template. The facts were not
re-invented: `Goal`, `Primary Layer`, `Dependency Layers`, `Harness Profile`,
`Contract Anchors`, `Scope`, `Expected Files`, `Verification Plan`, human gates
and checklist come from the packet's own `.harness/tasks/<id>/manifest.json`,
which already held them in structured form, plus the prose the doc already
carried. Frontmatter was left untouched, the linked manifests and evidence
directories were not modified, and no new claim was introduced about work that
had already shipped.

Two structural notes worth recording:

- Four of the manifests still carry a `primaryLayer` that is not in the checker's
  enum (`ci-workflow` for the release/CI packets, `frontend/tests` and `system`
  for two others). Those manifests are historical records and were deliberately
  left alone; the migrated docs declare a valid layer (`platform`,
  `inheritance-sync`). The doc is what the checker validates.
- The five `inheritance-sync` packets needed a `## Workspace Context` block, which
  the template requires for that layer. Those blocks are populated from the same
  manifests (`Sync Expectation: completed`, `Release Requirement:
  foundation-release`), so they describe the handoff that actually happened.

Result: `Task packet check: 28 file(s), 0 error(s), 0 warning(s)` with `entries`
empty, where the same command previously read `11 file(s)` plus 17 skipped. The
allowlist file is kept rather than deleted so its staleness rule stays armed: a
future entry for a doc that does not exist fails the run.

## 2. golangci-lint v2 key drift

`backend/.golangci.yml` carried three keys the v2 schema rejects, and both CI
workflows passed `verify: false` to avoid the failure. The consequence was not
cosmetic: `issues.exclusions` is invalid in v2, so **none of the config's
exclusion rules had ever applied**. Test files were being reported for `goconst`
despite a rule that said not to.

`golangci-lint config verify` names the three keys exactly:

```
linters.settings.goconst ... additional properties 'ignore-tests' not allowed
issues ... additional properties 'exclusions' not allowed
output ... additional properties 'sort-results' not allowed
```

The migration is three moves and two deletions:

| Key | Action |
| --- | --- |
| `goconst.ignore-tests` | deleted — redundant with the `_test\.go` exclusion rule, which is the supported v2 expression |
| `issues.exclusions.rules` | moved to `linters.exclusions.rules`, rules carried over unchanged |
| `output.sort-results` | deleted — v2 replaced it with `sort-order`, whose `[linter, file]` default is the ordering the repo relied on |
| `linters: [all]` on the generated-code rule | deleted with its rule — `all` is not in the v2 linter enum, and both generated registries carry the standard `// Code generated ... DO NOT EDIT.` marker that `linters.exclusions.generated: strict` already covers |

Behaviour was measured, not assumed: the setting package reported 3 test-file
findings under the HEAD config and 0 under the migrated one, which is the proof
that the exclusions took effect for the first time. The new-code gate scope stays
at `0 issues`.

`verify` is now `true` in both `ci.yml` and `quality.yml`, so an unknown key is a
hard failure rather than a silent no-op. That is the ratchet for this class.

## 3. Generated-smoke defect behind the "flake"

Run `35787715713` failed `module-governance-real.spec.ts` on both the attempt and
its retry. Investigated from artifacts rather than by raising a timeout, and it
turned out not to be a flake at all:

- On the **passing** main run `35704013167`, the same test failed attempt 1 at
  1.1m and passed `retry #1` in **6.5s**. The test was never green on its first
  attempt.
- Trace timing from the failing run shows the enclosed
  `page.goto('/system/modules')` consuming the **entire** 60s predicate window
  before returning, and the failure snapshot still showing the generator wizard —
  the navigation had not completed when the deadline expired.

Root cause: the generator rewrites the generated registries and i18n resources,
so the app entry now imports a fresh module tree that Vite must transform on
demand. The old shape put that cold `goto` **inside** the retry loop, sharing one
60s predicate window with the row assertion. The first navigation ate the whole
window, so attempt 1 could not succeed by construction and only the warmed retry
ever passed. The data was never the problem — the API poll above the assertion had
already proven the module ready.

Fix: navigate once under its own 120s budget and retry only the row assertion;
raise the test budget to 240s to hold that slice. The comment in the spec now
records the measured evidence so the next reader does not re-raise the shared
window.

## Verification

| Gate | Result |
| --- | --- |
| `check-task-packet.mjs --root .` | 28 files, 0 errors, 0 warnings |
| legacy allowlist staleness probe | exit 1 (negative probe) |
| `golangci-lint config verify` | clean (3 schema errors before) |
| `golangci-lint run --new-from-rev` | 0 issues |
| test-file exclusions | 3 findings → 0 |
| frontend `tsc --noEmit` / eslint / smoke coverage contract | pass |
| doc frontmatter / links / inventory / encoding / structure | pass |
| `check-boundaries.mjs` | unchanged report-only state (5 findings) |
| Full Smoke Suite | dispatched on the branch (see commands.json) |

## Open items

- The Full Smoke Suite is not in the PR gate set, so the smoke change relies on a
  manual dispatch plus post-merge main runs.
- `check-boundaries.mjs` stays report-only with its 5 known findings; promoting it
  to blocking is a maintainer policy decision.
- No static sensor forbids a navigation inside a Playwright retry callback. This
  was one latent instance rather than a repeat, so a regex gate was not added; it
  is recorded as a deferred option.
- `golangci-lint config verify` needs network access for its JSON schema, so the
  local gate is not hermetic (it timed out intermittently on this host).
- pantheon-ops synchronization remains deferred with its earlier recorded blocker.
