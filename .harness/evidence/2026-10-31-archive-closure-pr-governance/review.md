# Review: 2026-10-31-archive-closure-pr-governance

Verdict: approved with findings. Independent review posture applied to the diff, the moves and
the two new tests; every reading below is quoted from `commands.json`, not from intention.

## Reviewer posture, item by item

- Diff boundary: confirmed. 9 tracked files changed with `+267/-13` after excluding the pre-existing
  uncommitted i18n files, plus 34 `git mv` renames and 6 new paths belonging to this package. The
  changed set is `scripts/check-pr-governance.mjs`, `tests/scripts/check-pr-governance.test.mjs`,
  `docs/harness/failure-registry.md`, `.harness/ARCHIVE.md`, the two closure records of
  `2026-10-30-workflow-sonar-githubactions`, and this package's own documents. No `.github/workflows/**`,
  no `backend/**` other than the excluded i18n files, no `frontend/src/**` other than the excluded
  i18n files, no `VERSION` / `CHANGELOG.md` / `docs/release-notes/**`.
- Repair direction: confirmed. `hasExistingRepoFile` still tries the literal path first and only
  then delegates to `resolveArchiveAwarePath` from `scripts/task-manifest.mjs`; the URL, absolute
  path and `..` escapes are rejected before either check, and no new path arithmetic was invented.
- Assertion strength: confirmed and directional. Both new cases exist — archived artefacts validate
  with zero findings, and a task id present neither live nor archived still produces
  `does not exist in repository`. No existing case was deleted or relaxed; the shared
  `writeTaskManifest` helper gained an optional base-directory argument with unchanged defaults.
- Real-world reproduction: confirmed. The before/after probe used the actual archived `pr-body.md`
  of `2026-10-30-workflow-sonar-githubactions`: HEAD's sensor returned exit 1 with exactly four
  `file does not exist in repository` findings, the repaired sensor returned exit 0 on the same
  input. Probe files were removed afterwards.
- Moves: confirmed. `git mv` only, history preserved, `notes/` subdirectory moved together with its
  parent evidence tree; post-move counters 88 / 91 match the `ARCHIVE.md` table, and the live tree
  keeps only the one `in-progress` task plus this package.
- No suppression: confirmed. No exemption marker, no threshold change, no assertion weakened, no
  gate widened; the residual `check-evidence` errors on archived input were recorded as a reading
  rather than made to disappear.
- Honest scope: confirmed. The 67 older `status: Active` packets were not bulk-flipped, and the
  three unarchived items (the `in-progress` v0.18.0 package, the duplicated `2026-09-10` browser
  artifacts, and the two orphan PR bodies) are explicitly kept and explained instead of silently
  deleted or re-named.
- Release posture: confirmed. This package cuts no version and publishes no release; the ops
  absorption of the sensor and workflow repairs remains a maintainer-owned, irreversible step.

## Findings

- P2 (accepted, out of scope here): `check-evidence`, `check-review` and `generate-pr-body` still
  resolve canonical task/evidence paths with bare `fs.existsSync`. Measured on archived input: three
  errors for three files that exist under `archive/2026-10/`. Because the default glob scans only the
  live tree, no gate is red today — and archived evidence is consequently outside the checked
  surface. Needs its own fixture suite, so it is registered as residual in FR-024 rather than
  repaired inside a records round.
- P3: `check:harness-adoption` pairs implementation changes with task-manifest changes across the
  whole worktree. Observed directly: 2 findings before this package, 0 after, with the i18n files
  untouched and unstaged. The pairing is therefore weaker than its name suggests; a future package
  should scope the pairing to the diff that claims it.
- P3: archiving relies on a convention plus discipline rather than on a checker. Nothing fails if an
  agent leaves a `completed` manifest in the live tree — that was the state this package found — so
  the monthly sweep stays a manual round. Whether to add a liveness check is a governance-surface
  decision for the maintainer.

## Machine Readable

```json
{
  "taskId": "2026-10-31-archive-closure-pr-governance",
  "verdict": "approved",
  "structuralReview": {
    "affectedSubgraph": [
      "scripts/check-pr-governance.mjs",
      "tests/scripts/check-pr-governance.test.mjs",
      "scripts/task-manifest.mjs",
      "docs/harness/failure-registry.md",
      ".harness/ARCHIVE.md",
      ".harness/archive/2026-10/tasks/",
      ".harness/archive/2026-10/evidence/",
      "docs/harness/tasks/2026-10-30-workflow-sonar-githubactions.task.md",
      "docs/harness/tasks/2026-10-31-archive-closure-pr-governance.task.md",
      ".harness/tasks/2026-10-31-archive-closure-pr-governance/manifest.json",
      ".harness/evidence/2026-10-31-archive-closure-pr-governance/"
    ],
    "checks": ["cycle", "hub", "sensitive-flow"],
    "findings": [
      "P2: check-evidence, check-review and generate-pr-body still use bare fs.existsSync on canonical task/evidence paths; measured as 3 errors on an archived commands.json whose targets all exist under archive/2026-10/. Default glob scans only the live tree, so no gate turns red today, and archived evidence leaves the checked surface entirely.",
      "P3: check:harness-adoption pairs implementation changes with task-manifest changes at worktree scope, so 2 findings became 0 the moment this package's manifest was added while the uncommitted i18n files stayed untouched and unstaged.",
      "P3: the archive convention has no liveness checker; a completed manifest left in .harness/tasks/ is not detected by any gate, which is exactly the state this round found six of.",
      "P3: this package moves files and repairs a PR-surface sensor; the durable end-state proof for the two archived 2026-10-30 packages was already taken before the move (main Release Gate Unprocessed SonarCloud issues: 0 at c1f0b1dd)."
    ],
    "notes": "Six completed task trees were moved into .harness/archive/2026-10/ with git mv (34 files, notes/ subdirectory included) as .harness/ARCHIVE.md requires, and the archive index was recomputed to 88/91 for 2026-10 and 209/215 overall. Preparing the closure PR exposed the unresolved half of FR-019: scripts/check-pr-governance.mjs validated Task Manifest, Evidence, Verification evidence and Review Artifact with a bare fs.existsSync, so a PR recording an archived task was rejected even though the convention says canonical paths stay valid after archiving. The repair reuses the resolver the 2026-10-29 round shipped for check-task-packet and check-doc-links — literal path first, monthly-archive fallback only when absent — and is pinned by two opposite-direction tests (archived artefacts pass with zero findings; a task id existing neither live nor archived still reports missing) plus a before/after probe on the real archived pr-body.md, which returned exit 1 with four findings on HEAD's sensor and exit 0 on the repaired one. No gate semantics, threshold, workflow file, Sonar query or VERSION entry changed; no exemption or suppression marker was used; the residual bare existsSync in check-evidence/check-review/generate-pr-body is recorded as measured output and left for its own package."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-31-archive-closure-pr-governance/manifest.json",
    "evidence": ".harness/evidence/2026-10-31-archive-closure-pr-governance/commands.json",
    "reviewFile": ".harness/evidence/2026-10-31-archive-closure-pr-governance/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/failure-registry.md",
      ".harness/ARCHIVE.md",
      "docs/harness/VERIFICATION_EVIDENCE_SPEC.md"
    ]
  }
}
```
