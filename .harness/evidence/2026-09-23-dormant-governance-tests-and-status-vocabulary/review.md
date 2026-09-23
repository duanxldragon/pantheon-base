# Self-review — 2026-09-23 dormant governance tests and status vocabulary

Reviewer posture: self-review against the harness contract and against the gates
this round adds. Implementation and review share an author, so the findings
below rest on measurements (test counts, a vocabulary census, schema probes,
exit codes) rather than on reading.

## Scope check

The round is a ratchet over two findings, both measured before anything was
changed: the dormant `tests/scripts` suite (first execution produced 2 failures)
and the uncontrolled `status` field (3 vocabularies over 110 manifests). Nothing
was added that the measurements did not demand.

## Risk points examined

- **Is running 13 previously-unrun test files safe to gate on?** Yes — that is
  the whole measurement. All 13 were executed and only two failed; both failures
  were resolved by correcting the stale assertion, not by excluding or
  weakening the file. The suite is now 124/124.
- **Could the catch-all be flaky or environment-dependent in CI?** Checked
  explicitly: no test under `tests/scripts/` performs network I/O or reads a
  secret. The apparent `gh` references in `pr-automation-workflow.test.mjs` are
  regex assertions over workflow text, not invocations. `node --test` expands the
  glob itself, so the script behaves the same whether the calling shell expands
  globs — verified by running the quoted glob on Windows Git Bash.
- **Does the glob hide tests instead of running them?** It covers
  `tests/scripts/*.test.mjs`; the only subdirectory, `tests/scripts/foundation-release/`,
  is already wired via `test:foundation-release` and stays covered. Recorded as a
  known limitation rather than silently accepted.
- **Should the branch-hygiene fix have been in the workflow instead of the
  test?** No. `git log -p --follow` shows #142 deliberately removed the
  push-to-main trigger as part of a solo-developer simplification, and the
  workflow has run successfully since (main run on `45fee363` is green). Changing
  the workflow would re-add a trigger that was removed on purpose; the test
  encoded intent that no longer applies.
- **Is the boundaries test change masking a real regression?** No — the reverse:
  it makes a real regression visible. The test had been asserting the pre-tightening
  contract while the script had moved on. Both halves are now asserted, so a
  future change to either the strict or the lenient branch fails a test.
- **Is `status` validation a breaking change for the inherited schema?** Not for
  an absent field: validation is `when present`, which is deliberate because
  `pantheon-ops` has 15 manifests without the field and would otherwise go red at
  sync while its remediation is out of scope. The enum includes `planned`, a
  value already in real use, rather than inventing a vocabulary that conflicts
  with live data.
- **Is the enum documented rather than merely implemented?** Yes —
  `docs/HARNESS_GOVERNANCE_GUIDE.md` lists the field in the standard manifest
  template and states the allowed values, why synonyms are rejected, and that the
  field is optional.
- **Was normalising 9 manifests a data-fix that hides a real problem?** The
  opposite: the normalisation is the precondition for the rule. The schema would
  have failed on those 9 files immediately, and 110/110 now validate.
- **Does anything here touch runtime behaviour?** No product code, no API, no
  permission, menu, i18n, schema or seed change. The only non-test edits are a
  schema constant, one CI step line, an npm script and one documentation section.

## Findings

None blocking. Three unwired gates are named rather than fixed, because fixing
them is a policy decision with a large blast radius (see Deferred).

## Deferred

- **`check-evidence.mjs` and `check-review.mjs` are unwired and fully red.**
  `check-method-health.mjs` lists both among the expected harness scripts, but
  nothing executes them. Against the repository's own artifacts they report 196
  errors over 93 files and 51 errors over 98 files, dominated by the pre-2026-09
  `commands.json` shape (no `repo`/`agent`/`knownGaps`/`linkage`) and missing
  `## Machine Readable JSON` blocks. Wiring them as-is would block every PR, so
  they need a legacy allowlist built the way `config/task-packet-legacy-docs.json`
  was — a maintainer-facing decision, not an agent one.
- **`check-graph-review.mjs` is unwired and red** on pre-existing tenant-packet
  subgraph mismatches. Unrelated to this round and left untouched.
- **`pantheon-ops` manifest vocabulary.** 15 manifests have no `status` (still
  legal under the new rule) and 10 use `complete`/`complete-with-explicit-gates`,
  which the inherited schema will reject when ops syncs. Normalising them belongs
  to the standing ops deferral and was not done here.
- **`test:scripts` covers one directory.** A test file placed in a subdirectory
  would need explicit wiring; recorded so the catch-all is not mistaken for a
  global guarantee.

## Verdict

Both in-scope findings are fixed at the source and each carries a guard: the
suite is wired behind a catch-all whose wiring is itself asserted, and the status
vocabulary is enforced wherever a manifest is read with a test over the
repository's own 110 manifests. The two failures the activation exposed were both
stale tests, one of them a regression from the previous round that had been
invisible for exactly the reason this round exists. Measured: 122 tests / 2
failures → 124 tests / 0 failures; 3 status vocabularies → 1; 110 manifests
validated. Gate battery green. The items under Deferred stay explicitly open.

## Machine Readable
```json
{
  "taskId": "2026-09-23-dormant-governance-tests-and-status-vocabulary",
  "verdict": "approved with documented P2 follow-up",
  "findings": [],
  "residualRisks": [
    "check-evidence.mjs and check-review.mjs are listed as expected harness scripts but are executed by nothing, and are 196-error / 51-error red over 93 and 98 legacy artifacts; wiring them needs a legacy allowlist before they can block a PR.",
    "check-graph-review.mjs is unwired and reports pre-existing tenant-packet subgraph mismatches; it was not touched in this round.",
    "The status rule fires when a manifest is read, which currently happens through check:harness-visual and check:task-packet; a manifest no gate loads is still unvalidated.",
    "pantheon-ops carries 15 manifests without a status field (still legal) and 10 non-canonical values that the inherited schema will reject when ops syncs.",
    "The test:scripts catch-all covers tests/scripts/*.test.mjs only, so a test placed in a subdirectory would still need explicit wiring.",
    "This is a self-review: implementation and review share an author, and the only non-local verification is CI.",
    "Every measurement in this round was taken on a Windows Git Bash host where npm resolves to a broken WSL shim, so scripts were invoked as `node <script>` rather than through npm; the npm script bodies are equivalent but were not exercised through npm itself."
  ],
  "structuralReview": {
    "affectedSubgraph": [
      "tests/scripts governance regression suite and the CI npm script step",
      "scripts/task-manifest.mjs schema and the gates that load every manifest"
    ],
    "checks": ["cycle", "hub", "call-depth", "sensitive-flow"],
    "findings": [],
    "notes": "No call path is added. The CI edit adds one line to an existing job rather than a new job, so runner, cache and permission surfaces are unchanged. The schema edit is an additional validation branch on an optional field; it removes no existing check and is reached through the same readTaskManifest path already used by check-visual-evidence and check-task-packet. No new dependency and no new runtime surface."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-09-23-dormant-governance-tests-and-status-vocabulary/manifest.json",
    "evidence": ".harness/evidence/2026-09-23-dormant-governance-tests-and-status-vocabulary/commands.json",
    "reviewFile": ".harness/evidence/2026-09-23-dormant-governance-tests-and-status-vocabulary/review.md",
    "changeRef": "none",
    "planRefs": [
      ".harness/tasks/2026-09-23-legacy-packet-migration-and-config-integrity/manifest.json"
    ]
  }
}
```
