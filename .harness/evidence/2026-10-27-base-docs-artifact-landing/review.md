# Findings-first Review — Base Docs Artifact Landing

## Findings

### P2 - Delivered review work had no landing path, and nothing detected that

The four `docs/reviews/*` assessments and 23 planning manifests from the 2026-10-27 round were
committed to `chore/harness-task-packets-2026-10-27` (`806e053e`) and then stopped: no PR was ever
opened for that head ref (`gh pr list --state all` returns nothing), so 30 files and 5244 added
lines were invisible on GitHub while the local completion ritual treated them as delivered. The
failure is not the missing commit — it is that no gate in this repository distinguishes "artifact
exists in a working tree" from "artifact exists in `main`". A round that ends with "evidence
written" can therefore close green while its actual deliverable is stranded.

Evidence: `git diff --name-only main chore/harness-task-packets-2026-10-27` → 30 paths, all additions;
`git log --oneline -1 806e053e` → the commit exists locally only.

### P2 - `git branch --no-merged main` is not a usable deletion signal here

`fix/lint-and-codeql-suppressions-2026-10-27` was listed as unmerged even though base PR #430 had
squash-merged it, because a squash merge produces a new commit and leaves the branch's own commits
unreachable from `main`. Reading that output literally would either have kept a dead branch around
forever or invited a `git branch -D` justified by nothing. The rule applied here, and the one worth
keeping: a branch may be deleted only when `git diff --quiet main <branch>` exits 0 (tree equality),
or after its unique content has been landed and merged.

Evidence: `git diff --quiet main fix/lint-and-codeql-suppressions-2026-10-27` → exit 0, printed
`TREES IDENTICAL`; deletion then removed nothing that is not already on `main`.

### P3 - The landed manifests describe work that this round does not do

The tenant-completeness remediation and the S1–S4 simplification programme are filed as planned
and blocked intentions, and one of the four documents (`REDUNDANT_CODE_CANDIDATES.md`) enumerates
removal candidates that still exist in the tree. Landing them is a filing action. The risk of
filing them without saying so is that a later reader mistakes `docs/reviews/CODE_SIMPLIFICATION_PLAN.md`
for an in-flight programme; this review is the place that boundary is stated.

Evidence: `.harness/tasks/2026-10-27-s1-*` through `2026-10-27-s4-governance-decisions` manifests
record non-`completed` statuses and no matching `.harness/evidence/*` implementation package.

## Positive Signals

- The landing is provably inert with respect to the product: every path is documentation or a
  governance artifact, so no release is required and ops needs no consumption round for it.
- Overlay ownership already protects the consumer from this class of churn: `docs/harness/tasks`
  is in the ops `baseExcludedPaths` and `.harness` is in both `replaceRoots` and
  `repositoryOverlayPaths`, so base-side governance files cannot overwrite ops governance state —
  which is exactly the coupling that would otherwise make a docs merge a cross-repo event.
- `git cherry-pick -x` kept the origin note and produced one reviewable commit with no conflict,
  instead of importing a side branch into `main`'s first-parent history.
- The whole base governance chain is green on the landed tree, including the two checkers that
  are sensitive to exactly this kind of change: `frontmatter-check` (364 docs) and
  `check-doc-inventory` / `check-doc-links` (0 findings), plus structure and encoding at 0 findings.

## Decision

Accept the landing and merge it. The two P2s are process observations that this round itself acts
on — the stranded work is landed, and the deletion rule is now written down where the next operator
will hit it. The P3 stays open on purpose: the simplification programme is out of scope for this
round and should be scheduled on its own merits, not by the fact that its plan is now on `main`.

## Unknowns

- Whether the four landed assessments are still accurate line-by-line after the v0.17.6 and v0.17.7
  rounds, or whether some of their findings have since been overtaken. They were written against
  the same tree this branch started from, but they were never re-read after the release work.
- Whether the landed planned manifests should be re-baselined into the current harness task-id
  convention before any of them is executed.

## Machine Readable

```json
{
  "taskId": "2026-10-27-base-docs-artifact-landing",
  "status": "reviewed",
  "verdict": "approved with documented P2 follow-up",
  "findings": [
    {"id": "A1", "severity": "P2", "title": "Delivered review artifacts had no landing path and no gate distinguishes tree-local from main", "state": "closed-for-these-files-process-gap-open"},
    {"id": "A2", "severity": "P2", "title": "git branch --no-merged is unreliable after squash merges; tree equality is the deletion gate", "state": "documented-rule"},
    {"id": "A3", "severity": "P3", "title": "Landed manifests describe planned remediation and simplification work not executed here", "state": "open-by-design"}
  ],
  "structuralReview": {
    "affectedSubgraph": [
      "docs/reviews",
      "docs/harness/tasks",
      ".harness/tasks",
      ".harness/evidence"
    ],
    "checks": ["cycle", "hub", "sensitive-flow"],
    "findings": [
      "A1: governance artifacts can be committed without a landing path, so a round can close while its deliverable stays local"
    ],
    "notes": "No runtime or module graph is touched: the change set is documentation and governance records only, and the business/module boundary and structure contracts pass unchanged."
  },
  "residualRisk": [
    "The landed assessments were written before the v0.17.6/v0.17.7 rounds and have not been re-validated against current code.",
    "Planned simplification manifests now live on main without an owner or schedule, which can read as in-flight work."
  ],
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-27-base-docs-artifact-landing/manifest.json",
    "taskPacket": "docs/harness/tasks/2026-10-27-base-docs-artifact-landing.task.md",
    "evidence": ".harness/evidence/2026-10-27-base-docs-artifact-landing/commands.json",
    "reviewFile": ".harness/evidence/2026-10-27-base-docs-artifact-landing/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-27-base-docs-artifact-landing.task.md",
      "docs/harness/tasks/2026-10-27-tenant-completeness-remediation.task.md",
      "docs/harness/tasks/2026-10-27-codebase-simplification-program.task.md"
    ]
  }
}
```
