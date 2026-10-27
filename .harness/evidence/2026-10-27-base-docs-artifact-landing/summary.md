# Base Docs Artifact Landing — 2026-10-27

## What landed

The 2026-10-27 review round delivered four assessment documents and a set of L2 planning
artifacts, but they were committed to the local branch `chore/harness-task-packets-2026-10-27`
as `806e053e` and never opened as a pull request. 30 files / 5244 added lines of delivered work
therefore existed only on this workstation while the repository-hygiene goal asks for `main`
only. This round lands them.

`git cherry-pick -x 806e053e` onto a branch created from `main` (`2091a2d8`, equal to
`origin/main` in both directions) applied without conflict and produced `1dd5c785`. The landed
content is two groups:

- `docs/reviews/`: `TENANT_FUNCTIONAL_COMPLETENESS_REVIEW_2026-10-27.md`,
  `CODEBASE_SIMPLIFICATION_AUDIT.md`, `CODE_SIMPLIFICATION_PLAN.md`,
  `REDUNDANT_CODE_CANDIDATES.md`.
- governance records: 23 `.harness/tasks/*/manifest.json` entries, 2 task packets under
  `docs/harness/tasks/`, `.harness/evidence/2026-10-27-tenant-completeness-remediation/smoke-tenant-baseline.md`
  and an appended `.harness/STATUS.md` entry.

On top of that, this round adds its own packet, manifest and evidence trio so the landing itself
is an L2 record rather than an unexplained commit.

## No product surface moved

Every changed path is documentation or a governance artifact. `VERSION`, `CHANGELOG.md`,
`backend/**`, `frontend/**` and `config/**` are untouched, so no foundation release is required
and ops does not need a consumption round for this.

That is not just a convenience: `business-overlay.json` in the consumer declares `docs/harness/tasks`
in `baseExcludedPaths` and `.harness` in both `replaceRoots` and `repositoryOverlayPaths`, so a base
`.harness` or task-packet file cannot overwrite ops-side governance state. The only landed paths
that do flow into the ops tree on the next rebuild are the four `docs/reviews/*` documents, which is
the intended behaviour — they describe base's product.

## Branch deletion decision

Two local branches besides `main` existed. Each was resolved with a proof, not with `--no-merged`:

| Branch | Proof | Action |
| --- | --- | --- |
| `fix/lint-and-codeql-suppressions-2026-10-27` | `git diff --quiet main fix/...` exits 0 → trees byte-identical; content squash-merged by base PR #430 | deleted |
| `chore/harness-task-packets-2026-10-27` | `git diff --name-only main chore/...` → 30 files, all additions | landed by this PR, then deleted |

The reason this matters is that `git branch --no-merged main` listed the first branch as unmerged
even though its content is on `main`. Squash merges make that signal systematically unreliable
here, so tree equality is the gate for every deletion.

## In-flight repair found by re-running the chain

Re-running the full base check set against the landed tree turned up a red that is not mine:
`node scripts/harness/check-evidence.mjs --root . --strict` reported 2 errors on
`.harness/evidence/2026-10-27-v0177-lint-codeql-closure/commands.json`, a file PR #430 merged into
`main`. It still had the pre-contract shape — no `schema`, no `knownGaps`, no `linkage` — so it
failed the root-level requirements at `scripts/harness/check-evidence.mjs:162` and `:321`.
The fields are now filled in: `knownGaps` records that the v0.17.7 CodeQL annotations do not change
GitHub's alert state (the conclusion ops measured independently during consumption), and `linkage`
points at that round's manifest, summary and review, all of which already exist.

The reason it merged red is worth separating from the repair. `quality.yml` invokes fourteen harness
checkers; `check-evidence` and `check-review` are not among them, and neither appears in any other
workflow (`grep -rl check-evidence .github/workflows | wc -l` → `0`). The evidence contract is
therefore policed by a checker that CI never runs. Adding those two steps would close the class of
failure permanently, but it converts an advisory checker into a merge blocker, which is a gate-policy
decision rather than a cleanup — so the data is repaired here and the gate is filed as finding A4 for
the maintainer.

## Verification

`commands.json` in this directory holds the per-command readings. All executed checks exit 0:
frontmatter, task packet, evidence, review, adoption, doc-links, doc-inventory, sync drift,
method health, template health, generated artifacts, structure contract, encoding and duplication,
plus the generated-modules check. The PR body was validated locally through
`check-pr-governance.mjs --event <payload>` before opening.

## Known gaps

- The landed manifests describe planned work (tenant completeness remediation, the S1–S4
  simplification programme). Landing them does not execute any of it, and no checker forces a
  planned manifest to eventually change state.
- `check-method-health --strict` reports one warning: the OpenSpec skeleton directory is missing.
  Pre-existing, unrelated to this round, and non-blocking.
- `check-task-packet` reports two advisory warnings introduced by the landed packets:
  `docs/harness/tasks/2026-10-27-codebase-simplification-program.task.md` and
  `docs/harness/tasks/2026-10-27-tenant-completeness-remediation.task.md` each link a
  `Review File:` that does not exist yet, because those programmes have not run a review round.
  The checker treats a missing linked review as a warning, not an error, so both files still report
  `[PASS]`; the reading is recorded in `commands.json` rather than silenced.
- `docs/harness/tasks/2026-10-26-pr427-ci-gate-closure.task.md` carries a pre-existing warning that
  one of its contract anchors (`backend/modules/system/iam/permission/permission_workbench.go:624-654`)
  no longer resolves. Not touched by this round.
