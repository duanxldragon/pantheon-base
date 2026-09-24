# Evidence summary — 2026-09-23 dormant governance tests and status vocabulary

Task: `2026-09-23-dormant-governance-tests-and-status-vocabulary`
Layer: `platform` · Profile: `ci-workflow` · Ratchet: `sensor-added`

## What was wrong

Two instances of the same class — a sensor the repository had already paid for but never switched on.

**1. The governance regression suite was dormant.** Of the 28 files under
`tests/scripts/`, 13 had no npm script, and 12 of the 17 `test:` scripts were
referenced by no workflow. Only five ever ran in CI. No workflow ran the
directory wholesale, and a grep for `node --test` across `.github/workflows/`
finds nothing. Running the directory for the first time produced two failures,
both real:

| Failure | Who was stale | Evidence |
| --- | --- | --- |
| `branch-hygiene-workflow` expects a `push: main` trigger | the test | `547427c3` (#142, "simplify workflows for solo developer") deleted the trigger; the test was last touched in `bec01d18` and never notified |
| `harness-check-boundaries` expects a stale baseline entry to exit 0 | the test | the 2026-09-23 round tightened `--strict` to fail on stale entries, documented in the script's own help text — a regression from the previous round that nothing could see |

The second one is the point of the round: a change made in a prior round broke a
test, and there was no gate capable of noticing.

**2. `manifest.json` `status` was uncontrolled metadata.** 110 manifests used
three vocabularies — `completed` 101, `done` 7, `complete` 2 — for one state.
`status` appears nowhere in `validateTaskManifest` and is read by no script, so
nothing objected. Any future `status === 'completed'` query would have silently
missed 9 packets.

## What changed

- **`package.json`** — new `test:scripts` catch-all: `node --test tests/scripts/*.test.mjs`.
- **`.github/workflows/ci.yml`** — the existing "Run npm script tests" step now ends with `npm run test:scripts`.
- **`tests/scripts/ci-workflow-dispatch.test.mjs`** — asserts the workflow still contains `npm run test:scripts`, so the wiring itself is covered by the catch-all.
- **`tests/scripts/branch-hygiene-workflow.test.mjs`** — asserts the push trigger is *absent* (with the #142 reference) and keeps every still-true invariant.
- **`tests/scripts/harness-check-boundaries.test.mjs`** — split the stale case into strict (exits 1) and non-strict (exits 0 + warning), matching the documented contract.
- **`scripts/task-manifest.mjs`** — `TASK_MANIFEST_STATUSES = planned | in-progress | completed | abandoned`; validated when present, so an absent field stays legal.
- **9 manifests** normalised to `completed`.
- **`docs/HARNESS_GOVERNANCE_GUIDE.md`** — documents the optional field and its vocabulary.
- **`tests/scripts/task-manifest-status.test.mjs`** — 4 tests: accepts the vocabulary, rejects the synonyms, tolerates absence, and asserts every committed manifest in the repo is canonical.

## Measured result

| | Before | After |
| --- | --- | --- |
| `tests/scripts` suite | 122 tests, 120 pass, **2 fail** | **124 tests, 124 pass, 0 fail** |
| manifest `status` vocabulary | `completed` 101 / `done` 7 / `complete` 2 | **`completed` 110** |
| manifests validating | n/a (no rule) | **110 validated, 0 invalid** |

Reachability: the rule is enforced wherever a manifest is loaded, and
`check:harness-visual` (quality.yml) loads every one of them through
`listTaskManifestPaths`. `check:task-packet` carries it too.

Gate battery after the change set, all exit 0: `check-task-packet` (28 packets,
0 errors), `check-visual-evidence`, `check-method-health`, `check-adoption`,
`check-generated`, and `check-boundaries` with CI's exact flags
(`0 finding(s), 5 baselined, 0 stale`).

## Deferred (recorded, not fixed)

- **`check-evidence.mjs` / `check-review.mjs`** — listed by
  `check-method-health.mjs` as expected harness scripts, executed by nothing, and
  red with 196 and 51 errors over 93/98 legacy files. Wiring them as-is would
  block every PR; they need a legacy allowlist designed like
  `config/task-packet-legacy-docs.json`.
- **`check-graph-review.mjs`** — unwired, pre-existing tenant-packet subgraph
  mismatches, untouched.
- **`pantheon-ops`** — 15 manifests with no `status` (still legal) and 10
  non-canonical values that the inherited schema will reject at sync; part of the
  standing ops deferral.
