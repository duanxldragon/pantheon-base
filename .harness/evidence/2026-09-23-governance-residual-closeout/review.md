# Self-review — 2026-09-23 governance residual closeout

Reviewer posture: self-review against the harness contract and the gates this
round itself changes. Implementation and review share an author, so the findings
below lean on executable proof (four negative probes) rather than on reading.

## Scope check

Every item traces to a residual another packet recorded, not to new scope:

| Item | Where it was recorded |
| --- | --- |
| stale baseline entries | `2026-09-22-layer-boundary-gate` residual risks and the 2026-09-22 remediation plan |
| `check-arch-boundaries.mjs` overlap | `2026-09-22-layer-boundary-gate`, `-generated-artifact-governance`, `-naming-boundary-canonical-standard` (all three name "retiring scripts/check-arch-boundaries.mjs") |
| generator marker not written | `2026-09-22-generated-artifact-governance` technical debt note |
| `check-task-packet.mjs` red and unwired | this round's triage of the B-list; the script is documented in `scripts/harness/README.md` |
| `2026-07-20` blocked verdict | noted during the `2026-09-01-release-docs-reconciliation` audit |
| committed credentials | found while preparing the 2026-09-22 closeout commit |
| testredis variable trap | recorded in the 2026-09-22 round summary and reproduced in this round as a live CI gap |
| ops sync | `pantheon-ops/.foundation/foundation-release.lock.json` `pendingWork` |

## Risk points examined

- **Is the new `--strict` failure on stale baseline entries safe?** It only
  changes behaviour when the allowlist and the tree disagree — exactly the case
  that needs a human. Verified by probe: stale entry ⇒ exit 1, report-only ⇒
  exit 0, current baseline ⇒ 0 findings and 0 stale.
- **Does the ported `system/*` rule fire on legitimate wiring?** The composition
  root lives at `backend/modules/system/system_modules.go`, outside every scanned
  subdomain directory, so its cross-subdomain imports are not in scope. The tree
  reports 0 findings; a probe import inside `system/iam` is reported.
- **Could the legacy allowlist hide a new doc?** Only named paths are skipped, a
  missing entry is an error, and `--include-legacy` still checks everything. A doc
  written to the current template is not in the list, so it is enforced.
- **Did the task-packet change alter exit semantics?** No: any error still exits 1,
  which is what the pre-existing `harness-check-task-packet-context.test.mjs`
  pair asserts; both tests pass unchanged.
- **Does the marker break generated Go?** The prefix is a `//` line comment placed
  before the package clause, which is valid Go and matches the standard generated
  file convention the toolchain recognises. JSON is deliberately not prefixed.
- **Did the testredis change weaken the skip path?** Unchanged for a bare
  checkout: with no address and no flag it still skips, so `go test ./...` works
  on a machine without Redis.
- **Do the workflow edits hold?** `quality-workflow.test.mjs` and
  `ci-workflow-dispatch.test.mjs` pass, and the two new steps sit inside the
  docs-governance job before the `Enforce harness governance gate` step that reads
  the named step outcomes.

## Findings

None blocking. Two follow-ups worth naming rather than fixing here:

1. `pkg/testredis` is now the authority on which environment variables configure
   test Redis. The `docs/operations/RUNBOOK.md` section added here documents the
   contract and the required-flag pairing; a future Redis-backed job that omits
   the flag re-opens the silent-skip class for that job only.
2. The credential class has no automated gate. Gitleaks runs in `security.yml`,
   which is why nothing was flagged as a "secret", but the QA script's hardcoded
   fallback list was a code literal rather than a recognizable secret format. The
   new QA-script test pins that no credential is hardcoded there; a repo-wide
   rule would be a larger piece of work.

## Deferred

**pantheon-ops synchronization — deferred, with the blocker recorded.**
`pantheon-ops/.foundation/foundation-release.lock.json` locks
`pantheon-base-v0.12.1` at `baseCommit 884465c0` (an ancestor of base `main`,
which is 31+ commits ahead) and its `pendingWork` already states that
`baseline-swap` is blocked by uncommitted changes from another session. `git
status --short` in ops reports 269 entries, so the blocker is still live. Swapping
the foundation baseline over a dirty tree risks mixing lineage and discarding work
this round does not own, which is a maintainer decision, not an agent one. The
three shared artifacts this round touches (`pkg/testredis`, the generator marker,
`frontend/scripts/database-import-qa-setup.mjs`) therefore reach ops through the
next foundation release. Nothing was hand-copied into ops, and no ops file was
modified by this round.

## Verdict

All in-scope residuals are fixed at their source, each with a guard where the
class can recur, and every guard was shown to fire under a negative probe. Gates
green: Go build/vet/gofmt, affected Go tests, golangci-lint on new code, boundary,
task-packet, generated, structure, doc-links, inventory, encoding,
failure-registry, frontmatter, tsc, import-path-case, generator contract, marker
consistency, QA-setup and workflow tests. The ops sync and the four residual risks
listed in `summary.md` stay explicitly open.

## Machine Readable

```json
{
  "taskId": "2026-09-23-governance-residual-closeout",
  "verdict": "approved with documented P2 follow-up",
  "findings": [],
  "residualRisks": [
    "pantheon-ops synchronization is deferred: its foundation lock is 31+ commits behind base main and its own pendingWork records baseline-swap as blocked by 269 uncommitted files from another session, so the shared artifacts reach ops with the next foundation release.",
    "No Redis server was available on the reviewing host, so the Redis-backed cases ran as skips and the helper contract was proven by two targeted probes instead of a full run.",
    "The 17 pre-template task docs stay in config/task-packet-legacy-docs.json until someone migrates or deletes them.",
    "The generator still does not write the marker into the 11 stable artifacts it rewrites; check:generated continues to cover them by name.",
    "Pre-existing gitignored release payloads under pantheon-base/dist/ and pantheon-ops/.foundation/releases/ still contain the removed password.",
    "This is a self-review: implementation and review share an author, and the 2026-07-20 verdict closure rests on CI smoke evidence rather than a new manual run."
  ],
  "structuralReview": {
    "affectedSubgraph": [
      "harness checker layer: boundary, task-packet and generated gates",
      "backend shared test helper pkg/testredis and its Redis-backed consumers",
      "frontend low-code generator export path",
      "CI quality and ci workflow env plus two new gate steps"
    ],
    "checks": ["cycle", "hub", "call-depth", "sensitive-flow"],
    "findings": [],
    "notes": "No new cycle or hub: every change either tightens an existing gate, edits a leaf helper, or sits on an existing CI step list. check-boundaries.mjs gained a rule factory but no new dependency, and the deleted checker had no inbound references outside historical evidence. The one behaviour change on the test path (testredis) reduces skip surface rather than adding a new call path, and its new required mode is off unless CI sets it, so no unvalidated input reaches a sensitive action."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-09-23-governance-residual-closeout/manifest.json",
    "evidence": ".harness/evidence/2026-09-23-governance-residual-closeout/commands.json",
    "reviewFile": ".harness/evidence/2026-09-23-governance-residual-closeout/review.md",
    "changeRef": "none",
    "planRefs": [
      ".harness/NAMING_AND_BOUNDARIES_REMEDIATION_PLAN_2026-09-22.md"
    ]
  }
}
```
