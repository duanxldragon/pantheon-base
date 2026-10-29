# Review: 2026-10-26-governance-red-checkers-closure

## Verdict

approved with documented P2 follow-up

## What was claimed, and what is measured

Three strict governance red lines that the previous round had reported as findings (G-03/G-04/G-05) are closed, and each closure is a re-read of the checker that flagged it, not a restatement of intent:

- `check-boundaries --root . --strict`: 1 finding / exit 1 → **0 findings, 0 baselined, 0 stale / exit 0**, and the CI `--baseline` form still exits 0 with baselined dropping from 1 to 0.
- `check-runtime-evidence --root . --strict`: 0 errors / 11 warnings / exit 1 → **0 errors, 0 warnings / exit 0** (54 files at the first after-run, 55 once this round's own evidence set joined the scan).
- `check-inheritance-contract` (workspace-root form): 8 findings / exit 1 → **0 findings / exit 0**.
- The other 21 strict checkers were re-run and stayed green, so the closure did not purchase its three greens with drift elsewhere.

## Why this counts as a fix rather than a silence

- No checker was edited, no rule relaxed, no enum widened, no file removed from a scan set, no `--strict` dropped.
- G-04 executed the **ratchet the baseline entry itself prescribed** (promote `MenuNode` to `frontend/src/api`) and then deleted the entry — which is the behaviour the contract demands, because a stale entry would keep whitelisting a reintroduced import. Keeping the entry with the date renewed would have been the easy, dishonest option.
- G-03 added a schema field, not a conclusion. The proof is mechanical: all 11 files are `1 insertion / 0 deletions`, and no added or removed diff line in `.harness/evidence` touches `"status"`. Every `runtimeGap` string names commands or prose already in that same round's own files.
- G-05 satisfied literal marker strings with sentences that belong in those documents (`the only authority`, `a derived business repository`, the Base-first rule), and pinned `Base version` to the value `pantheon-ops/foundation-release.lock.json` already records, rather than inventing a version.

## Points a reviewer should challenge about this round itself

- **Did G-03 invent runtime evidence?** No. Two of the 11 rounds (2026-10-07-performance-followup, 2026-10-07-upgrade-runbook) genuinely captured runtime data — P95 1.18s, EXPLAIN plans, MySQL connection counters, a disposable v12 → v21 → restore rehearsal — but only in their `summary.md` prose. Their `runtimeGap` says exactly that and points at the prose instead of fabricating a `runtimePerformance` array to make the warning vanish. Where nothing was captured (2026-09-25, 2026-10-07-governance-gate-repair, 2026-10-07-upgrade-runbook's commands.json itself) the gap says so plainly.
- **Is the boundary fix too small?** Only `MenuNode` moved; `MenuPayload`, `MenuListQuery` and the `apiRequest` calls stayed in the menu module. That is deliberate: the crossing layer needs the contract type, and promoting request/response shapes would make implementation detail public. Four consumers (two `core/layout` files, `store/useMenuStore.ts`, and the two system module lists) still import the type through the menu `api` re-export, so one type now has two import paths. Legitimate under §8.2, but a real inconsistency a reviewer may want swept.
- **Is the workspace-root PR template honest bookkeeping or a fake gate?** It is the weakest part of this round. `check-inheritance-contract` requires `.github/pull_request_template.md` at the workspace root, and the workspace container is not a git repository (`.git/` contains only `hooks/` and `info/`; `git rev-parse --is-inside-work-tree` fails), so GitHub can never auto-load that file. The alternative — retarget the checker at `pantheon-base/.github/pull_request_template.md` and `pantheon-ops/.github/PULL_REQUEST_TEMPLATE.md` — is a checker-rule change and was not made unilaterally. What this round did instead is create the required file, state its non-loading caveat in its own header, and add the same four markers to the ops template that PR authors actually see, so the substance exists where it functions. If the maintainer prefers the rule change, the file can be deleted and the checker pointed at the two real templates.
- **Is `check-inheritance-contract --root .` now silently green?** No, and the round says why: from inside `pantheon-base` it reports 7 'file is missing' findings for paths that exist one level up. That form is recorded as `not-run` in commands.json with the mis-scope explanation, and the README for both languages now documents the workspace-root invocation. Anyone who runs the wrong form gets a loud wrong answer, not a pass.
- **Does the pinned Base version create a new drift surface?** Yes, and it is registered rather than hidden (F-13). Nothing compares `pantheon-ops/docs/PROJECT_INHERITANCE.md`'s `Base version` line against `foundation-release.lock.json`, so the next ops upgrade can leave them disagreeing. The document line is marked as must-sync; a checker tying the two together would be a new sensor and was out of scope.
- **Green because verified or because unobserved?** Verified for the local chain — and the observer gap is the actual finding: two of the three checkers are still in no workflow and no npm script, and the third is only ever run with a baseline. That is FR-016's class recurring (now FR-017), and promoting them to blocking CI steps is a gate-policy decision reserved to the maintainer, so this round registers it instead of enacting it.

## Explicitly not run

- Backend `go test` suites, Playwright smoke tiers, SonarCloud and the hosted `Foundation Release Verify` — none is reachable from an artifact-schema and type-move round, and none is needed for its claim. `go build`, `go vet` and `gofmt -l .` were still re-run as a working-tree baseline.
- The full frontend vitest suite; the two suites that consume `MenuNode` were run instead (6 tests).
- `npm run check:pr-governance` — needs a hosted PR event payload; its template-shape half ran directly in both repositories.
- Every historical round's own verification commands. A schema field added to a 2026-10-07 evidence file is not evidence that the 2026-10-07 assertion still holds.

## Residual risk accepted

The chain is green only when someone runs it. Concretely: `check-runtime-evidence` and `check-inheritance-contract` can go red again with no CI signal, and `check-boundaries` will keep going red in the bare form while CI reports green, because CI always passes `--baseline`. The empty baseline is also a live trap in the good sense — a fresh cross-layer import now fails `--strict` in both forms, which was not true while the entries list carried a real finding. Second-order risk: the workspace-root and ops doc edits sit outside `pantheon-base`'s repository, so the base-side PR alone does not carry the G-05 closure.

## Machine Readable

```json
{"taskId":"2026-10-26-governance-red-checkers-closure","verdict":"approved with documented P2 follow-up","verdictRationale":"Approved for the measured claim: the three strict red checkers reported as G-03/G-04/G-05 are now exit 0 — check-boundaries --root . --strict went from 1 finding to 0 findings/0 stale (and the CI --baseline form stays 0 with baselined dropping 1→0), check-runtime-evidence --root . --strict went from 11 warnings to 0 errors/0 warnings (55 files after this round's own evidence set joined the scan), check-inheritance-contract from the workspace root went from 8 findings to 0 — while the other 21 strict checkers were re-run and stayed green. Nothing was weakened to get there: no checker was edited, no baseline entry was added (the one existing entry was deleted after executing its own recorded ratchet), and the G-03 repair is provably conclusion-preserving because all 11 commands.json files show 1 insertion / 0 deletions and no added or removed evidence diff line touches a \"status\" field. Follow-up is P2 and explicit: the root cause is an absent observer, so check-runtime-evidence and check-inheritance-contract still have no npm script and no workflow, check-boundaries still runs in CI only with a baseline, and promoting them is a gate-policy change reserved to the maintainer (FR-017, open, alongside FR-016); the workspace-root PR template satisfies the gate at a path GitHub cannot load because the workspace container is not a git repository, so the same markers were also placed in the ops template authors actually use, and leaving that file there versus retargeting the checker is the maintainer's call.","linkage":{"taskManifest":".harness/tasks/2026-10-26-governance-red-checkers-closure/manifest.json","evidence":".harness/evidence/2026-10-26-governance-red-checkers-closure/commands.json","reviewFile":".harness/evidence/2026-10-26-governance-red-checkers-closure/review.md","changeRef":"none","planRefs":["docs/designs/REPOSITORY_LAYOUT.md","docs/harness/tasks/2026-10-26-governance-evidence-schema-backfill.task.md"]}}
```

> This block is written natively by the round that produced the artifacts. Three facts were corrected during the round: the marker matching in `check-inheritance-contract` is case-sensitive; the previous round's proof phrasing (`git diff | grep '"status"'` is empty) only holds when the diff is filtered to added/removed lines; and the artifact counts quoted mid-round (54 evidence files) were taken before this round's own `commands.json` / `review.md` existed, so the final matrix re-run reports 55 and the entries now carry the final numbers.
